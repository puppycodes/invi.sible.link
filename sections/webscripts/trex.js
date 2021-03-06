var defaultCampaign = null;
var initiativePrefix = null;

window.addEventListener('popstate', function(event) {
    console.log("popstate, loading page from location");
    loadPage();
}, false);

function initializeLanding(defaultC, initiativeP) {

    if(defaultC)
        defaultCampaign = defaultC;

    if(initiativeP)
        initiativePrefix = initiativeP;

};

function loadPage(destpage) {

    var guessed = false;
    if(!destpage) {
        console.log("destpage undeclared, guessing from location");
        guessed = true;
        destpage = window.location.pathname;
    }

    var validP = [ '/site', '/landing', '/what-to-do', '/about' ];

    console.log("destpage " + destpage);

    if(_.endsWith(destpage, '/site')) {
        var a = destpage.split('/');
        a.pop();
        var siten = a.pop();
        destpage = '/site';
        console.log("Extracted site from location: [" + siten + "]");
    }

    if(validP.indexOf(destpage) == -1) {
        console.log("Unknown location: "+ destpage +", forcing to 'landing'");
        destpage = '/landing';
    }

    $('li').removeClass('active');

    /* nothig is active when a site is look-at */
    if(destpage === '/site')
        $('.' + _.trim(destpage, '/') ).addClass('active');

    console.log("Loading page request: " + destpage + " to /direct ");
    $("#content").load("/direct" + destpage, function () {

        /* if a script need to be executed at the load, here it is fired,
         * this is a sloppy code: in fact I'm waiting 300ms hoping the <div>
         * has been put in the DOM */
        setTimeout(function() {

            if(destpage === '/landing') {
                console.log("loadPage/landing " + defaultCampaign);
                if( $("#cookiesrank").length )
                    trexCookiesRank(defaultCampaign, '#cookiesrank');
                if( $("#companyrank").length )
                    trexCompanyRank(defaultCampaign, '#companyrank');
                if( $("#simplerender").length )
                    trexSimpleRender(defaultCampaign, '#simplerender');
                if( $("#sankeytable").length )
                    trexRender(defaultCampaign, '#sankeytable');
            }

            if(destpage === '/archive') {
                /* not used ATM */
                console.log("loadPage/archive " + defaultCampaign);
                if( $("#archivetable").length )
                    trexArchive(defaultCampaign, '#archivetable');
                if( $("#detailedlist").length )
                    trexDetails(defaultCampaign, '#detailedlist');
            }

            if(_.endsWith(destpage,'/site')) {
                console.log("loadPage/site " + siten);
                /* piegraph is expected to exist, and .sitename is a class,
                 * like #firstpartyn -- clean this pattern */
                if( $('#sitedetails').length )
                    trexSiteDetails(siten);
            }

        }, 300);

        console.log("Loading and recording as: " + initiativePrefix + destpage);
        if(_.endsWith(destpage, 'site'))
            destpage = siten + destpage;

        if(!guessed)
            history.pushState(
                {'nothing': false},
                initiativePrefix,
                destpage
            );
    });
};

function setBlink() {
    console.log("90ies style blink hardcoded on class .sad");
    $('.sad').each(function() {
        var elem = $(this);
        setInterval(function() {
            if (elem.css('visibility') == 'hidden') {
                elem.css('visibility', 'visible');
            } else {
                elem.css('visibility', 'hidden');
            }
        }, 300 );
    });
};

function trexRender(campaignName, containerId) {

    console.log("trexRender of " + campaignName + " in " + containerId);
    $(containerId).html("");

    $('.nav-justified li p').removeClass('selected');
    $('.nav-justified li#' + campaignName + ' p').addClass('selected');

    var margin = {top: 30, right: 30, bottom: 30, left: 30},
        width = $(containerId).width() - margin.left - margin.right,
        height = 900 - margin.top - margin.bottom;

    var nodeWidth = 5;
    var nodePadding = 12;

    d3.json("/api/v1/sankeys/" + campaignName, function(data) {

        if(_.isUndefined(data.when)) {
            console.log("Error: no data available for this visualization");
            console.log("API: /api/v1/surface/" + campaignName );
            $(containerId).html("<b class='sad'> ✮  ✮  No data available for this visualization</b>");
            setBlink();
            return;
        }
        console.log(data);

        var formatNumber = d3.format(",.0f"),
            format = function(d) { return formatNumber(d); };

        var g = d3
            .select(containerId)
            .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
              .append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.bottom + ")");

        var maxNodes = 10;

        var sankey = d3.sankey()
            .nodeWidth(nodeWidth)
            .nodePadding(nodePadding)
            .size([width, height]);

        var path = sankey.link();

        sankey
            .nodes(data.nodes)
            .links(data.links)
            .layout(32);

        // Re-sorting nodes
        nested = d3.nest()
            .key(function(d){ return d.group; })
            .map(data.nodes)

        d3.values(nested)
            .forEach(function (d){
                var y = ( height - d3.sum(d,function(n){ return n.dy+sankey.nodePadding();}) ) / 2 + sankey.nodePadding()/2;
                d.sort(function (a,b){
                    return b.dy - a.dy;
                })
                d.forEach(function (node){
                    node.y = y;
                    y += node.dy +sankey.nodePadding();
                })
            })

        // Resorting links
        d3.values(nested).forEach(function (d){
            d.forEach(function (node){
                var ly = 0;
                node.sourceLinks
                    .sort(function (a,b){
                        return a.target.y - b.target.y;
                    })
                    .forEach(function (link){
                        link.sy = ly;
                        ly += link.dy;
                    })

                ly = 0;
                node.targetLinks
                    .sort(function(a,b){
                        return a.source.y - b.source.y;
                    })
                    .forEach(function (link){
                        link.ty = ly;
                        ly += link.dy;
                    })
            })
        })

        var colors = d3.scale.category20();

        var link = g.append("g").selectAll(".link")
            .data(data.links)
               .enter().append("path")
                    .attr("class", "link")
                    .attr("d", path )
                    .style("stroke-width", function(d) { return Math.max(1, d.dy); })
                    .style("fill","none")
                    .style("stroke", function (d){ return colors(d.source.name); })
                    .style("stroke-opacity",".4")
                    .sort(function(a, b) { return b.dy - a.dy; })
                    .append("title")
                    .text(function(d) { return d.value });

        var node = g.append("g").selectAll(".node")
            .data(data.nodes)
            .enter().append("g")
                .attr("class", "node")
                .attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; })

        node.append("rect")
            .attr("height", function(d) { return d.dy; })
            .attr("width", sankey.nodeWidth())
            .style("fill", function (d) { return d.sourceLinks.length ? colors(d.name) : "#666"; })
            .append("title")
            .text(function(d) { return d.name + "\n" + format(d.value); });

        node
            .append("text")
            .attr("x", -6)
            .attr("y", function (d) { return d.dy / 2; })
            .attr("dy", ".35em")
            .attr("text-anchor", "end")
            .attr("transform", null)
            .text(function(d) { return d.name; })
            .style("font-size","11px")
            .style("font-family","Arial, Helvetica")
            .style("pointer-events","none")
            .filter(function(d) { return d.x < width / 2; })
            .attr("x", 6 + sankey.nodeWidth())
            .attr("text-anchor", "start");

        node.filter(function(d) { return d.group === "site" })
            .append("foreignObject")
            .attr("x", 6 + sankey.nodeWidth())
            .attr("y", function (d) { return d.dy / 2; })
            .attr("dy", ".35em")
            .attr("width", "100%")
            .attr("text-anchor", "start")
            .attr("transform", null)
            /* in theory I've d.href with http or https, but in practice I'm loosing that attribute with sankey mangling */
            /* note: I was putting a simple link here, but on mobile platform was not display, so I'll removed and bon. */
            .html(function(d) { return "<a target='_blank' href='http://" + d.name + "'>-----------</a>"; })
            .style("font-weight", "bolder")
            .style("background-color", "#ffffff")
            .style("font-size","11px")
            .style("font-family","Arial, Helvetica");
        g
            .selectAll(".label")
            .data([
                { x: 14, name: 'site' },
                { x: 590, name: 'third party' },
                { x: 1080, name: 'responds to' }
            ])
            .enter()
            .append("text")
            .attr("class", "label")
            .attr("y", -8)
            .attr("x", function (d) { return d.x; })
            .attr("dy", ".35em")
            .attr("text-anchor", "end")
            .attr("transform", null)
            .text(function(d) { return d.name; })
            .style("text-transform", "capitalize")
            .style("font-size","14px")
            .style("font-family", "'Work Sans', sans-serif")
            .style("pointer-events","none");

    });
};

function trexArchive(campaignName, archiveTable) {

    console.log("trexArchive of " + campaignName + " in " + archiveTable);

    if ( $.fn.dataTable.isDataTable(archiveTable) ) {
        table = $(archiveTable).DataTable();
        table.destroy();
    }

    $.getJSON("/api/v1/surface/" + campaignName, function(collections) {

        console.log("getting surface data: " + _.size(collections) );
        console.log(collections);

        var converted = _.map(collections, function(list) {

            var inserted = moment
                .duration(moment() - moment(list.when) )
                .humanize() + " ago";

            /* order matter, so I want to be sure here */
            return [
                list.url,
                _.size(list.companies),
                list.javascripts,
                _.size(list.unique),
                inserted
            ];
        });

        $(archiveTable).DataTable( {
            data: converted
        });
    });

};

function trexBar(campaignName, archiveTable) {

    var svg = d3.select("svg"),
        margin = {top: 20, right: 20, bottom: 30, left: 40},
        width = +svg.attr("width") - margin.left - margin.right,
        height = +svg.attr("height") - margin.top - margin.bottom,
        g = svg.append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    var x0 = d3.scaleBand()
        .rangeRound([0, width])
        .paddingInner(0.1);

    var x1 = d3.scaleBand()
        .padding(0.05);

    var y = d3.scaleLinear()
        .rangeRound([height, 0]);

    var z = d3.scaleOrdinal()
        .range(["#98abc5", "#8a89a6", "#7b6888", "#6b486b", "#a05d56", "#d0743c", "#ff8c00"]);

    var url = "/api/v1/bar/" + campaignName;
    console.log(url);

    d3.json(url, function(error, data) {
      if (error) throw error;

      var keys = data.columns.slice(1);

      x0.domain(data.map(function(d) { return d.State; }));
      x1.domain(keys).rangeRound([0, x0.bandwidth()]);
      y.domain([0, d3.max(data, function(d) { return d3.max(keys, function(key) { return d[key]; }); })]).nice();

      g.append("g")
        .selectAll("g")
        .data(data)
        .enter().append("g")
          .attr("transform", function(d) { return "translate(" + x0(d.State) + ",0)"; })
        .selectAll("rect")
        .data(function(d) { return keys.map(function(key) { return {key: key, value: d[key]}; }); })
        .enter().append("rect")
          .attr("x", function(d) { return x1(d.key); })
          .attr("y", function(d) { return y(d.value); })
          .attr("width", x1.bandwidth())
          .attr("height", function(d) { return height - y(d.value); })
          .attr("fill", function(d) { return z(d.key); });

      g.append("g")
          .attr("class", "axis")
          .attr("transform", "translate(0," + height + ")")
          .call(d3.axisBottom(x0));

      g.append("g")
          .attr("class", "axis")
          .call(d3.axisLeft(y).ticks(null, "s"))
        .append("text")
          .attr("x", 2)
          .attr("y", y(y.ticks().pop()) + 0.5)
          .attr("dy", "0.32em")
          .attr("fill", "#000")
          .attr("font-weight", "bold")
          .attr("text-anchor", "start")
          .text("Population");

      var legend = g.append("g")
          .attr("font-family", "sans-serif")
          .attr("font-size", 10)
          .attr("text-anchor", "end")
        .selectAll("g")
        .data(keys.slice().reverse())
        .enter().append("g")
          .attr("transform", function(d, i) { return "translate(0," + i * 20 + ")"; });

      legend.append("rect")
          .attr("x", width - 19)
          .attr("width", 19)
          .attr("height", 19)
          .attr("fill", z);

      legend.append("text")
          .attr("x", width - 24)
          .attr("y", 9.5)
          .attr("dy", "0.32em")
          .text(function(d) { return d; });
    });

};

function getSpan(text, id, style) {
    return '<span class="'+style+'" id="'+id+'">'+text+'</span>';
};

function trexSimpleRender(campaignName, simpleRender) {

    console.log("trexSimpleRender of " + campaignName + " in " + simpleRender);

    $.getJSON("/api/v1/surface/" + campaignName, function(collections) {
        console.log(collections);
        if(!collections.length) {
            $(simpleRender).html("<b class='sad'> ✮  ✮  No data available for this visualization</b>");
            setBlink();
        }

        _.each(collections, function(c, i) {

            var siteId = 'url-' + i;
            var spanHtml = getSpan(c.url, siteId, 'site col-md-2');

            var lineC = _.reduce(c.leaders, function(memo, l, x, t) {

                if(x < 9) {
                    var slotId = 'company-' + x + '-' + i;
                    memo += getSpan(l.company, slotId, 'company col-md-1');
                } else if (x === 9 ) {
                    var slodId = 'company-' + x + '-' + i;
                    memo += getSpan("+ " + (_.size(t) - 9),
                        slotId, 'company col-md-1');
                }
                return memo;

            }, spanHtml);
            var lineId = 'site-' + i;
            $(simpleRender).append("<div class='col-md-12 underline entry' domaindottld='"+
                    c.domaindottld  +"' id='" +
                    lineId + "'>" +
                    lineC + "</div>"
            );
            $(simpleRender).addClass("entry");
            $("#" + lineId).click(function(e) {
                var ddtld = $(this).attr('domaindottld');
                loadPage(ddtld + '/site');
            });
        });
    });
};

function trexSiteDetails(sitename) {

    d3.json("/api/v1/evidences/" + sitename, function(collections) {

        var pied = _.countBy(
            _.reject(collections, {domaindottld: sitename}),
            'domaindottld');

        var first = _.filter(collections, {domaindottld: sitename});

        $("#firstpartyn").text(_.size(first));
        $("." + "sitename").text(sitename);

        c3.generate({
            bindto: '#domainpiegraph',
            data: {
                json: pied,
                type: 'donut',
            },
            donut: { title: sitename }
        });

        var piecompany = _.countBy(
            _.filter(collections, function(o) {
                return !_.isUndefined(o.company);
            }), 'company');

        c3.generate({
            bindto: '#companypiegraph',
            data: {
                json: piecompany,
                type: 'donut',
            },
        });

        /*
        var piecountry = _.countBy(
            _.filter(collections, function(o) {
                return !_.isUndefined(o.companyC)
            }), 'companyC');

        c3.generate({
            bindto: '#countrypiegraph',
            data: {
                json: piecountry,
                type: 'donut',
            },
        });
        */

        var ext = _.reject(collections, {domaindottld: sitename});

        $('#sitedetails').html('<ol id="orderedL">');
        _.each(ext, function(o) {
            var info = '';

            if(o['Content-Type']) {
                info = o['Content-Type'].replace(/;.*/, '');
            }

            if(o['cookies']) {

                if(info !== '')
                    info += ", ";

                if(_.size(o['cookies']) === 1)
                    info += "un Cookie installato";
                else
                  info += _.size(o['cookies']) + " Cookie installati";
            }

            if(info !== '')
                info = '<ul><li>' + info + '</ul></li>';

            $('#orderedL').append('<li>' + 
                '<span class="noverflow">' + o.url + '</span>' +
                info +
                '</li>');
        });

    });
}

function trexCookiesRank(campaignName, destId) {

    d3.json("/api/v1/surface/" + campaignName, function(collections) {

        console.log("trexCookiesRank: campaign " + campaignName + 
                " dest " + destId + " surface #" + _.size(collections) );

        var cookiesInfo = _.reduce(collections, function(memo, site) {

            if(!_.size(site.cookies))
                return memo;

            memo.push({
                site: site.domaindottld,
                cookies: _.size(site.cookies),
                info: site.cookies
            });
            return memo;
        }, []);

        cookiesInfo = _.reverse(_.orderBy(cookiesInfo, 'cookies'));

        return c3.generate({
            bindto: destId,
            data: {
                json: cookiesInfo,
                keys: {
                    x: 'site',
                    value: [ 'cookies' ]
                },
                type: 'bar',
                colors: { 'cookies': '#339199' },
                onclick: function(d, element) {
                    if(!$(element).hasClass('_selected_')) {
                        var ddtld = this.categories()[d.x];
                        loadPage(ddtld + '/site');
                    }
                },
                selection: { enabled: true },

            },
            size: { height: 800 },
            legend: { show: false },
            axis: {
                x: {
                    type: 'categories',
                },
                rotated: true
            }
        });
    });
};


function trexCompanyRank(campaignName, destId) {

    d3.json("/api/v1/surface/" + campaignName, function(collections) {

        console.log("trexCompanyRank: campaign " + campaignName + 
                " dest " + destId + " surface #" + _.size(collections) );

        var leaders = _.reduce(collections, function(memo, site) {
            _.each(site.leaders, function(l) {
                if(l.p < 10)
                    return memo;

                var x = _.find(memo, {company: l.company });

                if(!x)
                    memo.push(l);
            });
            return memo;
        }, []);

        leaders = _.reverse(_.orderBy(leaders, 'p'));

        return c3.generate({
            bindto: destId,
            data: {
                json: leaders,
                keys: {
                    x: 'company',
                    value: [ 'p' ]
                },
                colors: { 'p': '#C44F9D' },
                type: 'bar',
                names: {
                    p: 'frequenza in percentuale %'
                }
            },
            size: { height: 800 },
            legend: { show: false },
            axis: {
                x: {
                    type: 'categories'
                },
                rotated: true
            },
            grid: {
                y: {
                    lines: [
                        { value: 50, text: '50%', position: 'middle' }
                    ]
                }
            }
        });
    });
};

