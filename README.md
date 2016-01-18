



# Analytics

Inspire on [https://github.com/Dev1an/Analytics/](https://github.com/Dev1an/Analytics/) the main diff is this package track this history of connections for a guest user or logged user

Demo [cesarve-analitycs.meteor.com](http://cesarve-analitycs.meteor.com)

##Contributing 
- Please help me with english
 
- Pull request are very welcome

- How to contribute, please see [https://guides.github.com/activities/contributing-to-open-source/](https://guides.github.com/activities/contributing-to-open-source/)

## Installing

```
$ meteor add cesarve:analytics
```


## Features

- Save a local storage id for each browser for guest tracking
- Tracks guest visitor and update when user get logged.
- Tracks the visitor's behavior using events

# Usage
When the package is added every new visited page will be logged in a mongo collection: `Analytics.Connections`.
Example:

```JSON
{
    "_id": "eHDSJrayaQEGjRDe9",                         //Unique Doc Id (mongoId)
    "deviceOrUserId": "NFBFdx9KNBFPRXzpGxJKMgEqv",      //Unique Id for User (if is logged) or device (if not logged)
    "inFocus": true,                                    //Last window event, true for onFocus, false for onBlur (Note: this init on true, even if not on focus, see know issues)
    "pages": 0,                                         //Pages views in this connection
    "currentPage": "/alternative?cesar=ramos",          //Current page views
    "pastConnections": 0,                               //Past connections counter (no include actual connection)
    "pastPages": 0,                                     //Past page views counter (no include actual connection)
    "ip": "127.0.0.1",                                  //Current User IP 
    "userAgent": {                                      // see https://github.com/faisalman/ua-parser-js
        "ua": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_2) AppleWebKit/601.3.9 (KHTML, like Gecko) Version/9.0.2 Safari/601.3.9",
        "browser": {
            "name": "Safari",
            "version": "9.0.2",
            "major": "9"
        },
        "engine": {
            "version": "601.3.9",
            "name": "WebKit"
        },
        "os": {
            "name": "Mac OS",
            "version": "10.11.2"
        },
        "device": {
            "model": null,
            "vendor": null,
            "type": null
        },
        "cpu": {
            "architecture": null
        }
    },
    "geoData":                                          //See https://github.com/bluesmoon/node-geoip
              { range: [ 3479299040, 3479299071 ],      //[ <low bound of IP block>, <high bound of IP block> ]
                 country: 'US',                         // 2 letter ISO-3166-1 country code         
                 region: 'CA',                          // 2 character region code.  For US states t
                                                        // ISO-3166-2 subcountry code for other countries
                                                        // FIPS 10-4 subcountry code                
                 city: 'San Francisco',                 // This is the full city name               
                 ll: [37.7484, -122.4156] }             // The latitude and longitude of the city   
              }
    "startDate": ISODate("2016-01-15T18:51:13.046Z"),   //Start of connection
    "events": [                                         //Lazy loaded Array of events, storage on Analytics.events collection.
                                                        //If you want a reactive datasource you should use the eventsCursor property of a connection, 
                                                        //this returns a mongo cursor to the same data.    
        {
            "_id":"ji2EhaaqpnXRFCzeN",                  //unique id of event
            "connectionId": "eHDSJrayaQEGjRDe9",        //connection id
            type":"focus",                              //event type, focus for windows onFocus
            "date": ISODate("2016-01-15T18:52:13.046Z") //date of event occurs 
        },
        {
            "_id":"GfyBdo7aFfh43vm2m",
            "connectionId": "eHDSJrayaQEGjRDe9",
            type":"pageView",                            //event type, pageView for Iron router onRun see Know Issues
            "date": ISODate("2016-01-15T18:53:23.036Z")
            "data": "/localhost:3000/test?test=1#test1"
        },
        {
            "_id":"n8M3k6Q3NWqkf7puj",
            "connectionId": "eHDSJrayaQEGjRDe9",
            type":"blur",
            "date": ISODate("2016-01-15T18:59:11.011Z")
        },
        
        ],                                              
    "endDate": ISODate("2016-01-15T19:01:07.533Z")      //End of connection
}
```
#Configure
###Api: 
    Analytics.configure(options)
####Options (a object of keys):
    adminRoles: Array of Roles 
                This packages will be publish Analitycs.Connections data just for this Roles 
                This packages will be ignore all those roles for track (no need to include in noTrackableRoles)
                Example value: ['admin']

    noTrackableRoles:  Array of Roles 
                This packages will be ignore all those roles for track
                Example value: ['admin']   
                
***Example***
```
    Analytics.configure({
        adminRoles: ['analytics-admin'],
        noTrackableRoles: []
    })

``` 

###Published data:

- 'analytics-raw': use ```Meteor.subscribe('analytics-raw')``` for subscribe to raw  history of connections

- 'analytics-live': user ```Meteor.subscribe('analytics-raw')``` for subscribe to live data

- 'analytics': use ```Meteor.subscribe('analytics-raw')``` for subscribe to raw  history of connections

Note just for adminRoles see below

##Know Issues:
### Initial InFocus state
The default initial  state of inFocus is true like is probably, but maybe this is not always true, 
for example a user can load a page and inmediatly change to other tab or application, 
the event onBlur will be not fire because the DOM in not ready yet, and in this case you will have a bad inFocus true state
### Iron router onRun
When you do a Hot Code Push,Iron:Router not fire onRun event again, (how have be) then not new page view will be recorded 
##External Resources 
- [https://github.com/alanning/meteor-roles](https://github.com/alanning/meteor-roles)
- [node-geoip](https://github.com/bluesmoon/node-geoip)
- [ua-parser-js](https://github.com/faisalman/ua-parser-js)

