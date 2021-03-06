#!/usr/bin/env nodejs
var _ = require('lodash');
var Promise = require('bluebird');
var debug = require('debug')('analyzeGroup');

var moment = require('moment');
var nconf = require('nconf');

var mongo = require('../lib/mongo');
var various = require('../lib/various');
var promises = require('../lib/promises');


var tname = promises.manageOptions();
var daysago = nconf.get('DAYSAGO') ? _.parseInt(nconf.get('DAYSAGO')) : 0;

/* still to be decided how to clean this */
var whenD = nconf.get('DAYSAGO') ? 
    new Date() : 
    new Date(moment().subtract(_.parseInt(nconf.get('DAYSAGO')), 'd'));

/* code begin here */

function saveAll(content) {
    if(content) {
        debug("Saving in results the product");
        return machetils.statsSave(nconf.get('schema').results, content);
    }
    else
        debug("No output produced");
}

function getReductions(daysago, target) {

    nconf.argv().env();
    nconf.file({ file: nconf.get('config') });
    daysago = _.parseInt(daysago) || 0;

    var when = moment().startOf('day').subtract(daysago, 'd');
    var min = when.toISOString();
    var max = when.add(25, 'h').toISOString();

    debug("looking for 'surface' and 'summary' daysago %s [%s-%s] target %s",
        daysago, min, max, target);

    var filter = {
        "when": { "$gte": new Date( min ), 
                  "$lt": new Date( max ) },
        "campaign": target
    };

    return Promise.all([
        mongo.read(nconf.get('schema').evidences, filter),
        mongo.read(nconf.get('schema').details, filter)
    ])
};


function orderBySubject(m) {

    /* use summary as reference, extend the info there with the
     * associated evidences */
    var ev = _.groupBy(m[0], 'subjectId');
    var det = _.groupBy(m[1], 'subjectId');
    /* this function just aggregate the results obtain from
     * different sources. evidences and details.
     *
     * later on these information will be processed
     */

    debugger;
    var rank = _.map(_.keys(det), function(sid) {
        var e = ev[sid];
        var d = det[sid];
        var companies = _.countBy(_.filter(e, 'company'), 'company')
        var traces = _.size(d);
        debug("%d %j", traces, companies);
        return {
            companies: companies,
            traces: traces,
            subjectId: sid
        };
    });
    debugger;
};

function computeStatus(both) {
    /* position 0, `today`, position 1, `today -1` */
};

return getReductions(daysago, tname)
    .then(orderBySubject)
    .then(function(fr) {
        debugger;
        // getReductions(daysago-1, tname).then(orderBySubject)
    })
/*
Promise.all([
    ])
    .then(computeStatus)
    .tap(function(result) {
        debug("Operations completed");
    });
*/
