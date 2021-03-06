var _ = require('lodash');
var debug = require('debug')('route:getCampaignIndex');
var pug = require('pug');
var nconf = require('nconf').env();

var campaignName = nconf.get('campaign');

var pugCompiler = function(filePrefix) {
    return pug.compileFile(
        __dirname + '/../campaigns/' + campaignName + '/' + filePrefix + '.pug', {
            pretty: true,
            debug: false
        }
    );
};

var pageMap = {
    'home': pugCompiler('pugs/pagestruct'),
    'landing': pugCompiler('pugs/pagestruct'),
    'what-to-do': pugCompiler('pugs/pagestruct'),
    'about': pugCompiler('pugs/pagestruct'),
    'archive': pugCompiler('pugs/pagestruct'),
    'site': pugCompiler('pugs/pagestruct')
};

var getCampaignIndex = function(req) {

    var pageName = _.get(req.params, 'page');
    debug("page name [%s]", pageName);

    return { 'text': pageMap[pageName]() };
};

module.exports = getCampaignIndex;
