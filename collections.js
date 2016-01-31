Analytics = {}
Analytics.Connections = new Mongo.Collection('analyticsConnections', {
    transform(connection) {
        connection.eventsCursor = Analytics.Events.find({connectionId: connection.id})
        Object.defineProperty(connection, 'events', {
            get() {
                return this.eventsCursor.fetch();
            }
        })
        return connection
    }
})
Analytics.Events = new Mongo.Collection('analyticsEvents')
Analytics.Live = new Mongo.Collection('analytics')
Analytics.adminRoles= ['analytics-admin']
Analytics.noTrackableRoles= []
Analytics.configure = function (options) {
    for (var key in options) {
        this[key] = options[key]
        if (key == 'adminRoles')
            if (!Array.isArray(options[key]))
                throw new Meteor.Error('401', 'Analytics.adminRoles have to be a Array')
        if (key == 'noTrackableRoles')
            if (!Array.isArray(options[key]))
                throw new Meteor.Error('401', 'Analytics.noTrackableRoles have to be a Array')
    }
}
//todo publish just for somes roles

if (Meteor.isServer) {


    function isPublishableRole(userId) {
        if (!Package['alanning:roles']) {
            return true;
        }
        if (!userId) {
            return true
        }
        let Roles = Package['alanning:roles'].Roles
        let result = Roles.userIsInRole(userId,Analytics.adminRoles)
        console.log('result', userId,Analytics.adminRoles, result)
        return result

    }

    Meteor.publish('analytics-raw', function () {

        return [Analytics.Connections.find(), Analytics.Events.find()]
    })
    Meteor.publish('analytics-live', function (deviceOrUserId) {
        const now = new Date
        now.setSeconds(now.getSeconds() - 3)
        if (isPublishableRole(this.userId))
            return [Analytics.Connections.find({
                endDate: {$exists: false}}), Analytics.Events.find({date: {$gte: now}})]
        else
            return [Analytics.Connections.find({
                deviceOrUserId,
                endDate: {$exists: false}
            }), Analytics.Events.find({deviceOrUserId, date: {$gte: now}})]


    })


    const allConnections = Analytics.Connections.find()
    Meteor.publish('analytics', function () {
        var openConnectionCount = 0
        var connectionCount = 0
        var pageViews = 0
        var collectingOldData = true
        const allConnectionsObserver = allConnections.observeChanges({
            added: (id, fields) => {
                const changes = {connectionCount: ++connectionCount}
                if (!fields.hasOwnProperty('endDate'))
                    changes.openConnectionCount = ++openConnectionCount

                if (!collectingOldData) this.changed('analytics', 'live', changes)
            },
            changed: (id, fields) => {
                if (fields.hasOwnProperty('endDate')) {
                    --openConnectionCount
                    if (!collectingOldData) this.changed('analytics', 'live', {openConnectionCount})
                }
            }
        })
        const pageViewObserver = Analytics.Events.find({type: 'pageView'}).observeChanges({
            added: () => {
                ++pageViews
                if (!collectingOldData) this.changed('analytics', 'live', {pageViews})
            }
        })
        // When we are done analysing the old data
        // update the status variable so that we can transmit live data
        collectingOldData = false;
        this.added('analytics', 'live', {
            openConnectionCount,
            connectionCount,
            pageViews
        })
        // Stop observers when the client disconnects
        this.onStop(() => {
            allConnectionsObserver.stop()
            pageViewObserver.stop()
        })
        this.ready();
    })
}