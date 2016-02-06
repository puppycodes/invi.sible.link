var _ = require('lodash'),
    debug = require('debug')('lib.domain'),
    tld = require('tld'),
    DNparse = require('domain-name-parser');

var cleanHost = function(href) {
    if(href.indexOf('//') == -1) { debug("%s", href); return null; }
    var cleanHost = href.split('//')[1].split('/')[0];
    return (cleanHost.indexOf(':') == -1) ? cleanHost : cleanHost.split(':')[0];
};

var domainTLDinfo = function(links) {
    var retVal = [];
    _.each(links, function(linkObj) {

        var host = cleanHost(linkObj.href),
            domain = tld.registered(host);

        retVal.push({
            host: host,
            domain: domain
        });
    });
    return retVal;
};

var domainDetails = function(dict)  {
    var host = cleanHost(dict.href),
        d = DNparse(host);
    /*
    console.log(
        d.tld            //"com" -- the first part on the right
        , d.sld          //"domain" -- the second part from the right
        , d.host         //"host" -- the left-most part
        , d.domainName   //"domain.com" -- always the commonly referred to part (sld + tld)
        , d.domain       //"subdomain.domain.com" -- everything except the host
        , d.level(3)     //"subdomain" -- specific domain level part, 1 based (tld is level 1)
    );
    */
    dict.domain = d.domainName;
    dict.sld = d.sld;
    return dict;
};

module.exports = {
    domainTLDinfo: domainTLDinfo,
    domainDetails: domainDetails
};