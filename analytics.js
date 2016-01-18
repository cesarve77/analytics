
/**
 * git
 * Return if actual Meteor user is Trackable, means user is not a Agent or Admin
 * @returns {boolean}
 */

function isTrackableRole() {
    if (!Package['alanning:roles']) {
        return true;
    }
    if (!Meteor.userId()) {
        return true
    }
    let Roles = Package['alanning:roles'].Roles
    let result= !Roles.userIsInRole(Meteor.userId(), Analytics.adminRoles.concat(Analytics.noTrackableRoles))
    console.log(isTrackableRole,Meteor.userId(),result)
}

if (Meteor.isClient) {
    /*
     Identify user|device|logged user by unique Id
     * @returns {String} unique Id
     */
    function getDeviceOrUserId() {
        let userId = Meteor.userId()
        if (userId) {
            return userId
        }
        var deviceId = amplify.store("Analytics-deviceId");
        if (!deviceId) {
            deviceId = Random.id(25);
            amplify.store("Analytics-deviceId", deviceId);
        }
        return deviceId;
    }

    Analytics.getDeviceOrUserId = getDeviceOrUserId
    /*
     register events
     */
    Tracker.autorun(()=> {
        if (isTrackableRole()) {
             window.addEventListener('blur', () => Meteor.call('analytics.addEvent', 'blur', getDeviceOrUserId()))
             window.addEventListener('focus', () => Meteor.call('analytics.addEvent', 'focus', getDeviceOrUserId()))
        } else {
            log('widnow removed')
            window.removeEventListener('blur', () => Meteor.call('analytics.addEvent', 'blur', getDeviceOrUserId()))
            window.removeEventListener('focus', () => Meteor.call('analytics.addEvent', 'focus', getDeviceOrUserId()))
        }
    })
    /*
     * if iron router is installed, insert page view onRun
     * Note: when hot push code, onRun no trigger, be alert when is in developing
     */

    if (Package['iron:router']) {
        var Router = Package['iron:router'].Router;
        Router.onRun(function () {
            if (isTrackableRole()) {
                console.log('IRON .addEvent')
                Meteor.call('analytics.addEvent', 'pageView', getDeviceOrUserId(), Router.current().location.get().path)
            }

            this.next();


        });
    }

    /*
     Add new Connection
     */
    Meteor.startup(function () {
        if (isTrackableRole())
            console.log('first new connection')
        Meteor.call('analytics.addConnection', getDeviceOrUserId(), location.pathname + location.search)
        log('location.href', location)
    })

    /*
     Track login state changes
     */
    Tracker.autorun(function () {
            if (!Meteor.userId() && Session.equals('Analytics-deviceId', undefined)) {
                Session.set('Analytics-deviceId', getDeviceOrUserId());
            }
            else if (Meteor.userId() && Session.get('Analytics-deviceId')) {
                Meteor.call('analytics.updateToUser', Session.get('Analytics-deviceId'), Meteor.userId(), function (err, response) {

                    if (err) {
                        console.error(err)
                        return
                    }
                    Session.set('Analytics-deviceId', undefined);
                })
            }
        }
    )
}
if (Meteor.isServer) {
    /**
     * Calc past connections ans pages views
     * @param deviceId unique string for no logged user
     * @param userId unique string for logged user
     * @returns {Object} pastConnections as past connection count, and pastPages as past pages views count
     */
    function getPastCount(deviceId, userId) {
        let pastConnections = Analytics.Connections.find({$or: [{deviceOrUserId: userId}, {deviceOrUserId: deviceId}]}).count();
        let pastPages = Analytics.Events.find({
            $or: [{deviceOrUserId: userId}, {deviceOrUserId: deviceId}],
            type: 'pageView'
        }).count();
        return {pastConnections, pastPages}
    }

    /*
     * Handle inconsistencies
     */

    Meteor.startup(()=> {

        console.log('inconsistencies', Analytics.Connections.update({endDate: {$exists: false}}, {$set: {endDate: undefined}}, {multi: true}))
    })

    Meteor.methods({

        /*
         update from deviceId to userId, called  on  user login see Track Login
         */
        'analytics.updateToUser': function (deviceId, userId) {


            if (isTrackableRole()) {
                let {pastConnections,pastPages}=getPastCount(deviceId, userId)
                pastConnections--
                let query = {deviceOrUserId: deviceId}
                modifier = {$set: {deviceOrUserId: userId}}
                Analytics.Events.update(query, modifier, {multi: true});
                let modifier = {$set: {deviceOrUserId: userId, pastConnections, pastPages}}
                Analytics.Connections.update(query, modifier, {multi: true});
            }

        },
        /*
         add new connection
         */
        'analytics.addConnection': function (deviceOrUserId, path) {



            if (isTrackableRole()) {
                this.connection.onClose(()=> {
                    Analytics.Connections.update({_id: this.connection.id}, {$set: {endDate: new Date()}})
                    log('-------Connection closed--------')
                })
                log('new Connection',this.connection.id)
                Analytics.Connections.update({deviceOrUserId, endDate: {$exists: false}}, {$set: {endDate: new Date()}})
                const geoIp = Npm.require('geoip-lite')
                let parser = new UAParser()
                parser.setUA(this.connection.httpHeaders['user-agent'])
                let connection = {}
                connection.deviceOrUserId = deviceOrUserId
                let {pastConnections,pastPages}=getPastCount(deviceOrUserId)
                connection._id = this.connection.id
                connection.inFocus = true
                connection.pages = 0
                connection.currentPage = path
                connection.pastConnections = pastConnections
                connection.pastPages = pastPages
                connection.ip = this.connection.clientAddress
                connection.userAgent = parser.getResult()
                connection.geoData = geoIp.lookup(this.connection.clientAddress)
                connection.startDate = new Date()
                connection.events = []
                console.log(Analytics.Connections.insert(connection));
                //Meteor.call('analytics.addEvent', 'pageView', deviceOrUserId, path)
            }
            return false;

        }

        ,
        /*
         add events
         */
        "analytics.addEvent": function (type, deviceOrUserId, data) {

            this.unblock()
            if (isTrackableRole()) {
                log('new Event ' + type)
                let event = {
                    connectionId: this.connection.id,
                    type,
                    date: new Date(),
                    data
                }

                event.deviceOrUserId = deviceOrUserId

                let result = Analytics.Events.insert(event)
                switch (type) {
                    case 'blur':
                        Analytics.Connections.update({_id: this.connection.id}, {
                            $set: {inFocus: false},
                            $unset: {endDate: ""}
                        })
                        break;
                    case 'focus':
                        Analytics.Connections.update({_id: this.connection.id}, {
                            $set: {inFocus: true},
                            $unset: {endDate: ""}
                        })
                        break;
                    case 'pageView':

                        Analytics.Connections.update({_id: this.connection.id}, {
                            $inc: {pages: 1},
                            $set: {currentPage: data},
                            $unset: {endDate: ""}
                        })
                        break

                }

            }
        }
    })


    process.on('SIGTERM', Meteor.bindEnvironment(function () {
        console.log('closing', Analytics.Connections.update({endDate: {$exists: false}}, {$set: {endDate: new Date()}}, {multi: true}))
        process.exit(0)
    }))


    /*
     Accounts.onCreateUser(function (options, user) {
     console.log('xxxxx',this,options,user)
     user._id='xxxxxssx' + Random.id();
     return user;
     });
     */
}