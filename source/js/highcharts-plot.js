Bloonix.highcharts.findSeriesPoint = function(series, value, axis) {
    if (axis === undefined) {
        axis = "x";
    }

    var lastValue,
        curValue,
        lastPoint,
        curPoint;

    $.each(series.data, function(i, data) {
        curValue = data[axis];
        curPoint = data;
        if (curValue > value) {
            return false;
        }
        lastValue = curValue;
        lastPoint = curPoint;
    });

    if (lastValue === undefined && curValue == undefined) {
        return undefined;
    }

    if (lastValue === undefined || curValue === value) {
        return curPoint;
    }

    var diffCur = curValue - value,
        diffLast = value - lastValue;

    if (diffCur > diffLast) {
        return lastPoint;
    }

    return curPoint;
};

Bloonix.highcharts.syncTooltip = function(e) {
    var selContainerId = e.currentTarget.id,
        selChart = Bloonix.cache.charts[selContainerId];

    if (selChart) {
        var coordChart = selChart.pointer.normalize(e),
            selPoint = selChart.series[0].searchPoint(coordChart, true);

        if (selPoint) {
            $.each(Bloonix.cache.charts, function(id, chart) {
                if (chart === undefined) {
                    return true;
                }
                if (id !== selContainerId) {
                    var point = Bloonix.highcharts.findSeriesPoint(chart.series[0], selPoint.x);
                    if (point) {
                        chart.tooltip.refresh(point);
                        chart.xAxis[0].drawCrosshair(e, point);
                    }
                }
            });
        }
    }
};

Bloonix.syncExtremesStatus = false;

Bloonix.highcharts.syncExtremes = function(e) {
    var thisChart = this.chart;

    if (Bloonix.syncExtremesStatus === false) {
        Bloonix.syncExtremesStatus = true;

        $.each(Bloonix.cache.charts, function (id, chart) {
            if (chart !== thisChart) {
                if (chart.xAxis[0].setExtremes) {
                    chart.xAxis[0].setExtremes(e.min, e.max);
                }
            }
        });

        Bloonix.syncExtremesStatus = false;
    }
};

Bloonix.highcharts.plotChart = function(o) {
    if (Bloonix.checkEmptyChartData(o)) {
        return false;
    }

    if (o.chart.xAxisType == undefined) {
        o.chart.xAxisType = "datetime";
    }

    if (o.chart.lineMarker == undefined) {
        o.chart.lineMarker = false;
    }

    if (o.chart.type === "area" || o.chart.type === "line" || o.chart.type === "spline") {
        $("#"+ o.chart.container).bind(
            "mousemove touchmove",
            Bloonix.highcharts.syncTooltip
        );
        $("#"+ o.chart.container).mouseleave(function() {
            $.each(Bloonix.cache.charts, function(id, chart) {
                chart.tooltip.hide();
            });
        });
    }

    var chartOpts = {
        chart: {
            zoomType: "x",
            renderTo: o.chart.container,
            type: o.chart.type,
            plotBorderColor: "#e1e1e1",
            plotBorderWidth: 1
        },
        title: {
            text: o.chart.title,
            align: "left",
            style: {
                color: "#505050",
                fontWeight: "normal",
                fontSize: "14px"
            }
        },
        subtitle: {
            text: o.chart.subtitle,
            align: "left",
            style: {
                color: "#555555",
                fontWeight: 300,
                fontSize: "13px"
            }
        },
        xAxis: {
            type: "datetime",
            title: {
                text: o.chart.xlabel,
                style: {
                    color: "#555555",
                    fontWeight: "normal",
                    fontSize: "13px"
                }
            },
            crosshair: true,
            events: {
                setExtremes: Bloonix.highcharts.syncExtremes
            }
        },
        yAxis: {
            title: {
                text: o.chart.ylabel,
                align: "high",
                style: {
                    color: "#555555",
                    fontWeight: "normal",
                    fontSize: "12px"
                }
            },
            labels: {
                style: {
                    color: "#555555",
                    fontWeight: "normal",
                    fontSize: "12px"
                }
            }
        },
        legend: {
            itemStyle: {
                color: "#505050",
                fontSize: "12px",
                fontWeight: "normal",
            },
            symbolWidth: 20,
            borderWidth: 0
        },
        tooltip: {
            crosshairs: true,
            //shared: true,
            valueDecimals: 2,
            formatter: function() {
                var date = new Date(this.x),
                    series = "<b>"+ DateFormat(date, "highchartsTooltip") +"</b>",
                    index = this.point.index;

                $.each(this.series.chart.series, function(i, point) {
                //$.each(this.points, function(index, point) {
                    //var name = point.series.name,
                    //    value = point.y,
                    //    color = o.colors[point.series.name] || Utils.rgbToHex(point.series.color),
                    var name = point.name,
                        value = point.data[index].y,
                        color = o.colors[point.name] || Utils.rgbToHex(point.color),
                        units = o.chart.units || o.units[name];

                    if (units) {
                        if (/bytes|bits/.test(units)) {
                            value = Bloonix.convertBytesToStr(units, value, true);
                        } else if (units == "default" || units == "null") {
                            value = Bloonix.convertUnitsToStr(units, value, true);
                        }
                    }

                    series += '<br /><span style="color:'+ color +';font-weight:bold;">'+ name +': '+ value +'</span>';
                });         

                return series;
            }
        },
        plotOptions: {
            line: {
                marker: { enabled: false },
                connectNulls: false
            },
            spline: {
                marker: { enabled: false },
                connectNulls: false
            },
            area: {
                stacking : o.hasNegativeValues == true ? null : "normal",
                //lineColor: "#aaaaaa",
                lineWidth: 1,
                marker: { enabled: false },
                connectNulls: false
            }
        },
        series: o.series
    };

    if (o.legend && o.legend.enabled === false) {
        chartOpts.legend.enabled = false;
    }

    if (o.plotOptions && o.plotOptions.animation !== undefined) {
        chartOpts.plotOptions.line.animation = o.plotOptions.animation;
        chartOpts.plotOptions.spline.animation = o.plotOptions.animation;
        chartOpts.plotOptions.area.animation = o.plotOptions.animation;
    }

    if (o.chart.units) {
        if (/bytes|bits/.test(o.chart.units)) {
            chartOpts.yAxis.labels.formatter = function() {
                return Bloonix.convertBytesToStr(o.chart.units, this.value);
            };
        } else {
            chartOpts.yAxis.labels.formatter = function() {
                return Bloonix.convertUnitsToStr(o.chart.units, this.value);
            };
        }
    }

    if (o.hasNegativeValues != true) {
        chartOpts.yAxis.min = 0;
    }

    Bloonix.createOrReplaceChart({
        container: o.chart.container, 
        chartOpts: chartOpts,
        type: "Chart"
    });
};

Bloonix.highcharts.createChartForMTR = function(o) {
    var chartOpts = {
        chart: {
            renderTo: o.chart.container
        },
        title: {
            text: false
        },
        yAxis: [
            { min: 0, title: { text: "time in ms" } },
            { min: 0, max: 100, title: { text: "loss %" }, opposite: true }
        ],
        xAxis: {
            title: "Step",
            categories: o.categories
        },
        tooltip: {
            crosshairs: true,
            shared: true,
            formatter: function() {
                var step = this.x,
                    desc = "<b>"+ step +") IP "+ o.ipaddrByStep[step] +"</b>";

                $.each(this.points, function(index, point) {
                    var name = point.series.name,
                        color = point.series.color,
                        value = point.y;

                    desc += '<br /><span style="color:'
                        + color +'; font-weight: bold;">'
                        + name +'</span>: <b>'
                        + value +'</b>';
                });

                return desc;
            }
        },
        plotOptions: {
            column: {
                stacking: "normal"
            }
        },
        series: o.series
    };

    new Highcharts.Chart(chartOpts);
};

Bloonix.highcharts.createChartForWTRM = function(o) {
    return new Highcharts.Chart({
        chart: {
            type: "area",
            renderTo: o.chart.container
        },
        title: {
            text: o.chart.title,
            align: "left",
            style: {
                color: "#333333",
                fontWeight: "normal",
                fontSize: "14px"
            }
        },
        subtitle: {
            text: o.chart.subtitle,
            align: "left",
            style: {
                color: "#555555",
                fontWeight: "normal",
                fontSize: "13px"
            }
        },
        xAxis: {
            categories: o.categories,
            title: { enabled: false }
        },
        yAxis: { title: { text: "ms" } },
        tooltip: {
            formatter: function() {
                return this.x +" step took <b>"+ this.y +"ms</b>";
            }
        },
        legend: {
            enabled: false
        },
        plotOptions: {
            area: {
                stacking: "normal",
                lineColor: "#005467",
                lineWidth: 1,
                marker: {
                    lineWidth: 1,
                    lineColor: "#005467"
                }
            }
        },
        series: [{
            name: "Steps",
            color: "#005467",
            data: o.seriesData
        }]
    });
};
