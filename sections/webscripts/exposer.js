

var getSurface = function(containerId) {
    var url = '/api/v1/surface';

    $.getJSON(url, function(collections) {

        /* convert collections with basic shape explained here 
         * https://datatables.net/manual/data/ */
        var converted = _.map(collections, function(list) {
            var inserted = moment
                .duration(moment() - moment(list.creationTime) )
                .humanize() + " ago";
            /* order matter, so I want to be sure here */
			/* Site Tested Inclusions Javascript(s) Unique 3rd partis Time ago */
            return [
                list.url,
                list.thirdparties,
				list.scripts,
				list.relations.length,
                inserted
            ];
        });


        $(containerId).DataTable( {
            data: converted
        });
    });
};


function renderBasic(something, containerId) {
    console.log(something);
    return c3.generate({
        bindto: containerId,
        data: {
            json: something,
            keys: {
                x: 'date',
                value: ['tasks', 'subjects', 'servers', 'domains', 'version2']
            },
            types: {
                subjects: 'line',
                servers: 'line',
                tasks: 'line',
                version2: 'line',
                domains: 'area'
            },
            colors: {
                subjects: '#448800',
                servers: '#f100f1',
                version2: '#A1AAA1',
                tasks: '#818081',
                domains: '#44ffff'
            },
            axes: {
                subjects: 'y2',
                version2: 'y2',
                servers: 'y',
                tasks: 'y',
                domains: 'y2'
            },
        },
        axis: {
            x: {
                type: 'timeseries',
                tick: {
                    format: '%Y-%m-%d'
                }
            },
            y2: { 'show': true }
        }
    });
};


var kindMap = {
    'basicReport': [ 'daily/basicReport', renderBasic ],
//    'users': [ 'daily/users', renderUsers ],
//    'metadata': [ false, 'daily/metadata', renderMetadata ]
};

function byDay(kind, containerId) {

    if( _.size(kindMap[kind]) !== 2 ) {
        console.log("not yet supported", kind);
        return;
    }

    var url = '/api/v1/' + _.nth(kindMap[kind], 0);
    var renderF = _.nth(kindMap[kind], 1);

    console.log("Fetching for", kind, "in", url);
    d3.json(url, function(something) {
        var chart = renderF(something, containerId);
        /* eventually, we can manage updates of this chart */
    });

}

