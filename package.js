Package.describe({
    name: 'cesarve:analytics',
    version: '0.0.1',
    // Brief, one-line summary of the package.
    summary: '',
    // URL to the Git repository containing the source code for this package.
    git: '',
    // By default, Meteor will default to using README.md for documentation.
    // To avoid submitting documentation, set this field to null.
    documentation: 'README.md'
});
Npm.depends({
    "geoip-lite": "1.1.6"
})

Package.onUse(function (api) {
    api.versionsFrom('1.2.1');
    api.use(['alanning:roles','iron:router'],['server','client'],{weak:true})
    api.use([
        'ecmascript',
        'underscore',
        'mongo',
        'tracker',
        'random',
        'amplify',
        'session',
        'faisalman:ua-parser-js'

    ]);


    api.addFiles(['collections.js', 'utils.js', 'analytics.js'], ['client', 'server']);
    api.export("Analytics");
});

Package.onTest(function (api) {
    api.use('ecmascript');
    api.use('tinytest');
    api.use('cesarve:analytics');
    api.addFiles('analytics-tests.js');
});
