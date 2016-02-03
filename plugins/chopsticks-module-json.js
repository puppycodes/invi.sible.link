
var _ = require('lodash'),
    Promise = require('bluebird'),
    debug = require('debug')('plugin.json'),
    moment = require('moment'),
    dirToJson = require('dir-to-json');

var recursiveLook = function(objectWithChild, basePath) {
    var nextP = basePath + "/" + objectWithChild.path,
        retVal = "";
    if (objectWithChild.type === "file") {
        if (_.endsWith(objectWithChild.name, '.json')) {
            retVal += nextP + ",";
        }
    } else { /* is a directory, then, recursion */
        _.each(objectWithChild.children, function(elem) {
            retVal += recursiveLook(elem, nextP) + ",";
        });
    }
    return retVal;
};

module.exports = function(datainput) {

    var sourceDir = process.env.JSON_SOURCE + "/" + process.env.JSON_DETAIL;
    debug("Reading from directory %s", sourceDir);

    return dirToJson( sourceDir)
        .then( function( dirTree ) {
            var jsonIoList = recursiveLook(dirTree, sourceDir)
                .split(",");
            return _.remove(jsonIoList, function(e) { return e === ""; });
        })
        .catch( function( err ){
            throw err;
        })
        .then(function(jsonFiles) {
            debug("\x0FD3 Read %d phantom/JSON output files", jsonFiles.length);
            _.each(jsonFiles, )
        })
        .then(function(scanData) {
            /* rebuild the envelope properly */
            return {
                companies: datainput.source,
                source: [],
                data: scanData,
                stats: datainput.stats
            }
        });
};

module.exports.argv = {
    'json.source': {
        nargs: 1,
        type: 'string',
        default: 'tempdump',
        desc: 'Read URL directories from this directory.'
    },
    'json.detail': {
        nargs: 1,
        type: 'string',
        default: moment().format('YYMMDD')
    }
};