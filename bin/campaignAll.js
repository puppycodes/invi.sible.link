#!/usr/bin/env nodejs
var _ = require('lodash');
var os = require('os');
var process = require('process');
var child_process = require('child_process');
var nconf = require('nconf');
var debug = require('debug')('campaignAll');

var ccfg = 'config/experimentsCampaign.json';
debug("Loading hardcoded %s", ccfg);
nconf.argv().env().file({ file: ccfg });

_.each(_.map(nconf.get('campaigns'), 'name'), function(avail) {
    if(nconf.get(avail)) {
        var mockenv = {
            DEBUG: '*',
            config: ccfg,
            campaign: avail
        };
        debug("Aggregating for %s", avail);
        var cmd = 'bin/campaignChecker.js';
        // > /tmp/campaignChecker.log 2>&1';
        child_process.execSync(cmd, { 'env': mockenv });
    }
});
