Bloonix.other.plotChart = function(o) {    
    if (Bloonix.checkEmptyChartData(o)) {
        return false;
    }

    var chartOuterId = o.chart.container,
        chartOuterBox = "#"+ o.chart.container,
        chartHeaderId = chartOuterId +"-header",
        chartHeaderBox = chartOuterBox +"-header",
        chartContentId = chartOuterId +"-content",
        chartContentBox = chartOuterBox +"-content",
        chartLegendId = chartOuterId +"-legend",
        chartLegendBox = chartOuterBox +"-legend",
        chartTooltipId = chartOuterId +"-tooltip",
        chartTooltipBox = chartOuterBox +"-tooltip",
        colors = [];

    var object = { container: chartContentBox };

    $(chartOuterBox).html("");

    var chartHeader = Utils.create("div")
        .attr("id", chartHeaderId)
        .appendTo(chartOuterBox);

    if (o.chart.title) {
        Utils.create("div")
            .addClass("chart-title")
            .text(o.chart.title)
            .appendTo(chartHeader);
    }

    if (o.chart.subtitle) {
        Utils.create("div")
            .addClass("chart-subtitle")
            .text(o.chart.subtitle)
            .appendTo(chartHeader);
    }

    var chartContent = Utils.create("div")
        .attr("id", chartContentId)
        .appendTo(chartOuterBox);

    var chartLegend = Utils.create("div")
        .attr("id", chartLegendId)
        .addClass("chart-legend")
        .appendTo(chartOuterBox);

    if (o.mode === undefined) {
        o.mode = "time";
    }

    object.opts = {
        yaxis: {
            show: true,
            position: "left",
            font: {
                size: 12,
                lineHeight: 12,
                color: "#606060"
            },
            axisLabel: o.chart.ylabel,
            axisLabelUseCanvas: true,
            axisLabelFontSizePixels: 12,
            axisLabelColour: "#606060"
        },
        xaxis: {
            show: true,
            mode: o.mode,
            timezone: "browser",
            tickLength: 0,
            //timeformat: "%H:%M",
            font: {
                size: 12,
                lineHeight: 12,
                color: "#606060"
            }
        },
        legend: {
            show: false
        },
        grid: {
            show: true,
            color: "#222222",
            borderWidth: 1,
            borderColor: "#e1e1e1",
            hoverable: true,
            autoHighlight: false
        },
        series: {}
    };

    if (o.mode === "time") {
        object.opts.crosshair = {
            mode: "x",
            color: "rgba(0,0,0,.2)"
        };
    }

    if (o.points === true) {
        object.opts.series.points = { show: true, radius: 3 };
        object.opts.lines = { show: true };
    }

    if (o.chart.type === "area") {
        object.opts.series.stack = true;
        object.opts.series.lines = { fill: .7, lineWidth: 1 };
    }

    if (o.chart.units) {
        if (/bytes|bits/.test(o.chart.units)) {
            object.opts.yaxis.tickFormatter = function(value) {
                return Bloonix.convertBytesToStr(o.chart.units, value);
            };
        } else {
            object.opts.yaxis.tickFormatter = function(value) {
                return Bloonix.convertUnitsToStr(o.chart.units, value);
            };
        }
    }

    object.data = [];
    $.each(o.series, function(i, s) {
        if (s.type === "column") {
            return true;
        }

        if (s.color === undefined) {
            if (colors.length === 0) {
                colors = Bloonix.other.defaultColors();
            }
            s.color = colors.shift();
        }

        object.data.push({
            label: s.name,
            color: s.color,
            data: s.data,
            points: s.points,
            __showData: true,
            __data: s.__data
        });

        var legendItem = Utils.create("div")
            .addClass("chart-legend-box")
            .css({ cursor: "pointer" })
            .appendTo(chartLegend);

        Utils.create("div")
            .addClass("chart-legend-label")
            .css({ background: s.color })
            .appendTo(legendItem);

        Utils.create("div")
            .addClass("chart-legend-text")
            .text(s.name)
            .appendTo(legendItem);

        legendItem.click(function() {
            Bloonix.other.showOrHideData({
                chart: object,
                label: s.name,
                item: legendItem
            });
        });
    });

    var resizeContent = function() {
        var chartContentHeight = $(chartOuterBox).height() - chartHeader.outerHeight() - chartLegend.outerHeight() - 1;

        chartContent.css({
            height: chartContentHeight +"px"
        });
    };

    resizeContent();
    object.plot = $(chartContentBox).plot(object.data, object.opts).data("plot");

    $(chartOuterBox).tooltip({
        items: chartContentBox,
        content: function() { return '<div id="'+ chartTooltipId +'"></div>' },
        tooltipClass: "tooltip-ng",
        track: true
    });

    if (o.mode === "time") {
        $(chartContentBox).bind("plothover",  function (event, pos) {
            var axes = object.plot.getAxes();

            if (pos.x < axes.xaxis.min || pos.x > axes.xaxis.max ||
                pos.y < axes.yaxis.min || pos.y > axes.yaxis.max) {
                return;
            }

            var i, j, dataset = object.plot.getData(), text = [];

            for (i = 0; i < dataset.length; ++i) {
                var series = dataset[i];

                if (series.data.length > 0) {
                    $.each(series.data, function(ii, z) {
                        if (z[0] >= pos.x) {
                            var key = z[0];
                            var value = z[1];

                            if (i === 0) {
                                if (series.__data) {
                                    text.push("<b>"+ key +": "+ series.__data.xaxis[key] + "</b>");
                                } else {
                                    var date = new Date(key);
                                    text.push("<b>"+ DateFormat(date, "highchartsTooltip") +"</b>");
                                }
                            }

                            if (o.chart.units) {
                                if (/bytes|bits/.test(o.chart.units)) {
                                    value = Bloonix.convertBytesToStr(o.chart.units, value, true);
                                } else {
                                    value = Bloonix.convertUnitsToStr(o.chart.units, value, true);
                                }
                            }

                            text.push('<b style="color:'+ series.color +';">'+ series.label +"</b>: "+ "<b>"+ value +"</b>");

                            return false;
                        }
                    });
                }
            }

            if (text.length > 0) {
                $(chartTooltipBox).html(
                    '<div class="tooltip-ng-content">'+ text.join("<br/>") +'</div>'
                );
            }
        });
    }

    $(chartLegendBox).resize(function() {
        resizeContent();
        object.plot.resize();
    });
};

/*
    chart: {
        data: chart data
        opts: chart options
        plot: plot object
        container: chartN container
    }
    label: label name
    item: legend item
*/
Bloonix.other.showOrHideData = function(o) {
    var data = [];

    $.each(o.chart.data, function(i, row) {
        if (row.label === o.label) {
            if (row.__showData === true) {
                row.__showData = false;
                o.item.css({ opacity: .5 });
            } else {
                data.push(row);
                row.__showData = true;
                o.item.css({ opacity: 1 });
            }
        } else if (row.__showData === true) {
            data.push(row);
        }
    });

    o.chart.plot = $(o.chart.container).plot(data, o.chart.opts).data("plot");
};

// Special chart for MTR
Bloonix.other.createChartForMTR = function(o) {
    var data = [],
        points = [ "circle", "square", "diamond", "triangle", "cross" ];

    $.each(o.series, function(x, s) {
        if (s.type === "column") {
            return true;
        }

        $.each(s.data, function(y, d) {
            s.data[y] = [ o.categories[y], s.data[y] ];
        });

        data.push({
            name: s.name,
            color: s.color,
            data: s.data,
            points: { symbol: points.shift() },
            __data: {
                xaxis: o.ipaddrByStep
            }
        });
    });

    o.mode = "categories";
    o.type = "line";
    o.series = data;
    o.points = true;
    Bloonix.other.plotChart(o);
};

Bloonix.other.createChartForWTRM = function(o) {
    var data = [];

    $.each(o.seriesData, function(y, d) {
        o.seriesData[y] = [ o.categories[y], o.seriesData[y] ];
    });

    data.push({
        name: "Steps",
        color: "#005467",
        data: o.seriesData,
        points: { symbol: "circle" }
    });

    o.mode = "categories";
    o.type = "area";
    o.series = data;
    o.points = true;
    Bloonix.other.plotChart(o);
};

Bloonix.other.defaultColors = function() {
    return [
        '#7cb5ec', '#434348', '#90ed7d', '#f7a35c', '#8085e9', 
        '#f15c80', '#e4d354', '#8085e8', '#8d4653', '#91e8e1'
    ];
};
