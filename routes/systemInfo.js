var _ = require('lodash');
var Promise = require('bluebird');
var debug = require('debug')('route:systemInfo');
var disk = Promise.promisifyAll(require('diskusage'));
var os = require('os');
var nconf = require('nconf');

var mongo = require('../lib/mongo');
/* 
 * this is the API call by bin/statusChecker.js
 * configured by config/statusChecker.json
 * and this API returns the statistics who gets recorded */

function systemInfo(req) {
    debug("%s systemInfo", req.randomUnicode);

    return Promise
        .map(_.values(nconf.get('schema')), function(tableName) {
            return mongo.countByObject(tableName);
        })
        .then(function(dbcounts) {
            return _.reduce(nconf.get('schema'), function(memo, cN, name) {
                var o = _.first(_.nth(dbcounts, _.size(memo)));
                memo[name] = _.isUndefined(o) ? "0" : o.count;
                return memo;
            }, {});
        })
        .then(function(namedNumbers) {
            return disk
                .checkAsync('/')
                .then(function(freebytes) {
                    return { json: {
                        rootspace: freebytes,
                        columns: namedNumbers,
                        loadavg: os.loadavg(),
                        totalmem: os.totalmem(),
                        freemem: os.freemem(),
                        freespace: freebytes
                    } };
                });
        });
}

module.exports = systemInfo;
