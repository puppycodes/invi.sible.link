#!/usr/bin/env nodejs
var _ = require('lodash');

var debug = require('debug')('director');
var Promise = require('bluebird');
var moment = require('moment');
var spawnCommand = require('../lib/cmdspawn');
var path = require('path');

var nconf = require('nconf');

nconf.env();

var PATH = nconf.get('campaigns') || 'campaigns';

var C = [{
    name: 'irantrex',
    cfgf: "irantrex/iran1st.csv" },{
    name: 'clinics-MX',
    cfgf: "chuptrex/clinics-MX.csv" },{
    name: 'clinics-CL',
    cfgf: "chuptrex/clinics-CL.csv" },{
    name: 'clinics-BR',
    cfgf: "chuptrex/clinics-BR.csv" },{
    name: 'clinics-CO',
    cfgf: "chuptrex/clinics-CO.csv" },{
    name: 'halal',
    cfgf: "amtrex/halal-list.csv" },{
    name: 'culture',
    cfgf: "amtrex/culture-list.csv" },{
    name: 'mosques',
    cfgf: "amtrex/mosques-list.csv" },{
    name: 'travel',
    cfgf: "amtrex/travel-list.csv" },{
    name: 'itatopex',
    cfgf: "itatopex/lista.csv" },{
    name: 'gptrex',
    cfgf: "gptrex/gptrex.csv" },{
    name: 'catalunya',
    cfgf: "catalunya/lista.csv" }
];

var confs = ['config/dailyBadger.json', 'config/dailyPhantom.json'];

function rollDirections(reqname) {

    if(_.startsWith(reqname, '-')) {
        reqname = _.trim(reqname, '-');
        var conflist = [ confs[1] ];
        debug("%s will be setup only for phantom", reqname);
    } else if(_.startsWith(reqname, '+')) {
        reqname = _.trim(reqname, '+');
        var conflist = [ confs[0] ];
        debug("%s will be setup only for phantom", reqname);
    } else 
        var conflist = confs;

    var found = _.find(C, { name: reqname });
    if(!found) {
        debug("Not found %s", reqname);
        return null;
    }

    var csvpath = path.join(PATH, found.cfgf);
    debug("Processing %s: %s", reqname, csvpath);

    _.map(conflist, function(kindOf) {
        return spawnCommand({
            binary: '/usr/bin/env',
            args: [ 'nodejs', 'bin/directionTool.js' ],
            environment: {
                needsfile: kindOf,
                csv: csvpath,
                taskName: reqname
            }
        }, 0);
    });

}

var requested = _.reduce(process.argv, function(memo, e) {
    if(_.endsWith(e, 'node'))
        return memo;
    if(_.endsWith(e, 'director.js'))
        return memo;
    memo.push(e);
    return memo;
}, []);

debug("Considering campaigns: %s, using PATH %s", requested, PATH);

return Promise
    .map(requested, rollDirections)
    .tap(function() {
        console.log("Execution completed, wait command returns...");
    });

