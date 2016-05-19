// Create bar charts.
Bloonix.barChart = function(o) {
    Bloonix[Bloonix.plotChartsWith].barChart(o);
};

// Create pie charts.
Bloonix.pieChart = function(o) {
    Bloonix[Bloonix.plotChartsWith].pieChart(o);
};

// Create area and line charts.
Bloonix.plotChart = function(o) {
    Bloonix[Bloonix.plotChartsWith].plotChart(o);
};

// Create map charts like worldmap.
Bloonix.mapChart = function(o) {
    Bloonix[Bloonix.plotChartsWith].mapChart(o);
};

// Create chart for MTR
Bloonix.createChartForMTR = function(o) {
    Bloonix[Bloonix.plotChartsWith].createChartForMTR(o);
};

// Create chart for WTRM
Bloonix.createChartForWTRM = function(o) {
    Bloonix[Bloonix.plotChartsWith].createChartForWTRM(o);
};

// The default time format for the Highcharts tooltip.
DateFormat.masks.highchartsTooltip = "ddd mmm dd yyyy HH:MM:ss";

// This function is used by default to create and cache
// chart objects. On this way it's easy to destroy the
// objects later with the destroyChart* functions.
Bloonix.createOrReplaceChart = function(o) {
    var chart = Bloonix.getChartObject(o.container);
    var cache = Bloonix.cache.charts;

    if (typeof chart == "object") {
        chart.destroy();
    }

    chart = new Highcharts[o.type](o.chartOpts, o.chartFunction);
    cache[o.container] = chart;
};

// Destroy all cached chart objects.
Bloonix.destroyChartObjects = function() {
    $.each(Bloonix.cache.charts, function(container, obj) {
        if (obj != undefined) {
            if (typeof obj.chart == "object") {
                obj.chart.destroy();
            }
            delete Bloonix.cache.charts[container];
        }

        if ($(container).length > 0) {
            $(container).remove();
        }
    });
};

// Check if a chart object already exists.
// All charts are stored by the id attribute
// of the container.
Bloonix.getChartObject = function(container) {
    var cache = Bloonix.cache.charts;

    if (cache[container] != undefined && typeof cache[container].chart == "object") {
        return cache[container];
    }

    return false;
};

Bloonix.convertBytesToStr = function(unit, value, sep) {
    var negative = 0;

    if (value === undefined || value === null) {
        return null;
    }

    value = parseFloat(value);

    if (unit === "bytes_to_bits") {
        value = value * 8;
        value = Bloonix.convertUnitsToStr("", value, sep);
        value += "b";
        return value;
    }

    if (/bits/.test(unit)) {
        unit.replace(/bits/, "bytes");
        value = value / 8;
    }

    // cal back to positive number
    if (value < 0) {
        negative = 1;
        value = value * -1;
    }

    // cal back to bytes
    if (unit == "kilobytes") {
        value = value * 1024;
    } else if (unit == "megabytes") {
        value = value * 1048576;
    } else if (unit == "gigabytes") {
        value = value * 1073741824;
    } else if (unit == "terabytes") {
        value = value * 1099511627776;
    } else if (unit == "petabytes") {
        value = value * 1125899906842624;
    } else if (unit == "exabytes") {
        value = value * 1152921504606846976;
    } else if (unit == "zettabytes") {
        value = value * 1180591620717411303424;
    } else if (unit == "yottabytes") {
        value = value * 1208925819614629174706176;
    }

    // check which unit to use
    if (value >= 1208925819614629174706176) {
        value = value / 1208925819614629174706176;
        unit = "YB";
    } else if (value >= 1180591620717411303424) {
        value = value / 1180591620717411303424;
        unit = "ZB"
    } else if (value >= 1152921504606846976) {
        value = value / 1152921504606846976;
        unit = "EB";
    } else if (value >= 1125899906842624) {
        value = value / 1125899906842624;
        unit = "PB";
    } else if (value >= 1099511627776) {
        value = value / 1099511627776;
        unit = "TB";
    } else if (value >= 1073741824) {
        value = value / 1073741824;
        unit = "GB";
    } else if (value >= 1048576) {
        value = value / 1048576;
        unit = "MB";
    } else if (value >= 1024) {
        value = value / 1024;
        unit = "KB";
    } else {
        unit = "";
    }

    // cal back to negative number
    if (negative == 1) {
        value = value * -1;
    }

    if (sep == true) {
        return value.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",") + unit;
    }

    return value.toFixed(1) + unit;
};

Bloonix.convertUnitsToStr = function(unit, value, sep) {
    if (value === undefined || value === null) {
        return null;
    }

    value = parseFloat(value);

    if (unit == "null") {
        var x = value.toString();
        if (/\./.test(x)) {
            value = value.toFixed(2);
        }
        return value;
    }

    var negative = 0;

    if (value < 0) {
        negative = 1;
        value = value * -1;
    }

    if (unit == "kilo") {
        value = value * 1000;
    } else if (unit == "mega") {
        value = value * 1000000;
    } else if (unit == "giga") {
        value = value * 1000000000;
    } else if (unit == "tera") {
        value = value * 1000000000000;
    } else if (unit == "peta") {
        value = value * 1000000000000000;
    } else if (unit == "exa") {
        value = value * 1000000000000000000;
    } else if (unit == "zetta") {
        value = value * 1000000000000000000000;
    } else if (unit == "yotta") {
        value = value * 1000000000000000000000000;
    } else if (unit == "chema") {
        value = value * 1000000000000000000000000000;
    }

    if (value >= 1000000000000000000000000000) {
        value = value / 1000000000000000000000000000;
        unit = "C";
    } else if (value >= 1000000000000000000000000) {
        value = value / 1000000000000000000000000;
        unit = "Y";
    } else if (value >= 1000000000000000000000) {
        value = value / 1000000000000000000000;
        unit = "Z";
    } else if (value >= 1000000000000000000) {
        value = value / 1000000000000000000;
        unit = "E";
    } else if (value >= 1000000000000000) {
        value = value / 1000000000000000;
        unit = "P";
    } else if (value >= 1000000000000) {
        value = value / 1000000000000;
        unit = "T";
    } else if (value >= 1000000000) {
        value = value / 1000000000;
        unit = "G";
    } else if (value >= 1000000) {
        value = value / 1000000;
        unit = "M";
    } else if (value >= 1000) {
        value = value / 1000;
        unit = "K";
    } else {
        unit = "";
    }

    if (negative == 1) {
        value = value * -1;
    }

    if (sep == true) {
        return value.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",") + unit;
    }

    return value.toFixed(1) + unit;
};

Bloonix.noChartData = function(container) {
    $(container).html("");

    var outer = Utils.create("div")
        .addClass("no-chart-data")
        .appendTo(container);

    var inner = Utils.create("p")
        .appendTo(outer);

    Utils.create("b")
        .text(Text.get("info.no_chart_data"))
        .appendTo(inner);
};

Bloonix.checkEmptyChartData = function(o) {
    if (o.series.length == 0) {
        var id = "#"+ o.chart.container;
        $(id).addClass("chart-load-info").html("");

        Utils.create("p").html(
            Utils.create("i").text(o.chart.title)
        ).appendTo(id);

        if (o.chart.subtitle) {
            Utils.create("p").html(
                Utils.create("i").text(o.chart.subtitle)
            ).appendTo(id);
        }

        Utils.create("p").html(
            Utils.create("b").text(Text.get("info.no_chart_data"))
        ).appendTo(id);

        return true;
    }

    return false;
};
