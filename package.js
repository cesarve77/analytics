Package.describe({
    name: 'cesarve:analytics',
    version: '0.0.1',
    summary: 'Analytics for meteor: track guest or users connections and page views',
    git: 'https://github.com/cesarve77/analytics.git',
    documentation: 'README.md'
});
Npm.depends({
    "geoip-lite": "1.1.6"
})

Package.onUse(function (api) {
    api.versionsFrom('1.2.1');
    api.use(['alanning:roles', 'iron:router'], ['server', 'client'], {weak: true})
    api.use([
        'ecmascript',
        'underscore',
        'mongo',
        'tracker',
        'random',
        'amplify',
        'session',
        'faisalman:ua-parser-js',
        'ecmascript'


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
