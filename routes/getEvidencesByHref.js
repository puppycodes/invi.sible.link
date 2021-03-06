var _ = require('lodash');
var Href = require('bluebird');
var debug = require('debug')('route:getEvidencesByHref');
var moment = require('moment');
var nconf = require('nconf');

var mongo = require('../lib/mongo');
 
/* This API return all the evidences, to display the historical changes
 * with a C3 graph (time, VP and number/kind of trackers are part of the 
 * visualization) 
 */
function getEvidencesByHref(req) {

    var maxDays = 7;
    var filter = {};

    filter.when = { '$gt': new Date( moment()
            .subtract(maxDays, 'd')
            .format("YYYY-MM-DD") 
        ) };
    filter.href = new RegExp(req.params.href);

    var omitf = [ "VP", "_id", "campaign", "domain",
                  "href", "id", "needName", "tld", "promiseId",
                  "subdomain", "subjectId", "version" ];

    return mongo
        .readLimit(nconf.get('schema').evidences, filter, {
            when: -1
        }, 7000, 0)
        .map(function(e) {
            e.da = _.parseInt(moment.duration(moment() - 
                              moment(e.when)).asDays() );
            return _.omit(e, omitf);
        })
        .tap(function(l) {
            debug("Before reduction list size %d", _.size(l));
        })
        .reduce(function(memo, e) {
            if(e.target)
                memo.push(e);
            else if(e.domaindottld !== req.params.href)
                memo.push(e);
            return memo;
        }, [])
        .tap(function(l) {
            debug("After reduction list size %d", _.size(l));
        })
        .then(function(C) {
            if(_.size(C) === 5000)
                debug("Warning! reach readLimit limit of 5k");
            var grouped =  _.groupBy(C, 'da');
            debug("getEvidencesByHref group %d days", _.size(grouped));
            return { 'json': grouped };
        });
};

module.exports = getEvidencesByHref;
