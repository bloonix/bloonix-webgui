// setTitle sets the title in the html header
// and returns a copy of the title, because
// html is not valid in the title="" header.
Bloonix.setTitle = function(key, toReplace, flag) {
    var title;
    if (toReplace != undefined) {
        $("title").html(Text.get(key, toReplace));
        title = Text.get(key, toReplace, flag);
    } else {
        $("title").html(Text.get(key));
        title = Text.get(key);
    }
    return title;
};

Bloonix.setMetaTitle = function(title) {
    $("title").html(title);
};

// Clear all active interval objects.
Bloonix.clearIntervalObjects = function() {
    if (Bloonix.intervalObjects.length) {
        var object = Bloonix.intervalObjects.shift();
        clearInterval(object);
        Bloonix.clearIntervalObjects();
    }
};

// Clear all active timeout objects.
Bloonix.clearTimeoutObjects = function() {
    if (Bloonix.timeoutObjects.length) {
        var object = Bloonix.timeoutObjects.shift();
        clearTimeout(object);
        Bloonix.clearTimeoutObjects();
    }
};

// Clear the content.
Bloonix.clearHTML = function() {
    $("#content").html("");
    $("#footer-left").html("");
    if ( $("#header-title").length ) {
        $("#header-title").remove();
    }
};

// Clear all.
Bloonix.clearAll = function() {
    Ajax.abortXHRs();
    Bloonix.clearIntervalObjects();
    Bloonix.destroyChartObjects();
    Bloonix.clearHTML();
    if (Bloonix.destroy != undefined) {
        Bloonix.destroy();
        Bloonix.destroy = undefined;
    }
};

Bloonix.dropDownToggle = function(caller) {
    var ul = $(caller).find("ul");

    if (ul.is(":hidden")) {
        $(caller).tooltip({ disabled: true });
        ul.show();
    } else {
        ul.hide();
        $(caller).tooltip({ disabled: false });
    }
};

Bloonix.redirect = function(path) {
    Log.debug("redirect()");
    window.location.href = "/#"+ path;
    Bloonix.route.to(path);
};

Bloonix.call = function(link, text) {
    if (typeof text == "string") {
        text = Utils.escape(text);
    }
    return Utils.create("a")
        .attr("href", "#"+ link)
        .html(text)
        .mouseup(function(e){
            if (e.which == 1) {
                window.location.href = "#"+ link;
                Bloonix.route.to(this);
            }
            return true;
        });
};

Bloonix.switchDebug = function() {
    Log.level = Log.level == "debug"
        ? "info"
        : "debug";
    console.log("switch log level to "+ Log.level);
};

Bloonix.logIntervalObjectCount = function() {
    var global = Bloonix.intervalObjects.length;
    var charts = 0;

    $.each(Bloonix.cache.charts, function(key, obj) {
        if (obj != undefined) {
            if (obj.intervalObject) {
                charts += 1;
            }
        }
    });

    var total = global + charts;
    //Log.debug("intervalObjects: global("+ global + ") charts(" + charts +") total("+ total +")");
};

Bloonix.logXhrObjectCount = function() {
    //Log.debug("jqXhrObjects: "+ Bloonix.xhrPool.length);
};

Bloonix.createHoverBoxIcons = function(o) {
    var chartBoxIcons = Utils.create("div")
        .addClass("hover-box-icons")
        .appendTo(o.container);

    if (o.hide) {
        chartBoxIcons.hide();
        chartBoxIcons.css({ "background-color": "#ffffff" });
        $(o.hoverElement).hover(
            function() { chartBoxIcons.show() },
            function() { chartBoxIcons.hide() }
        );
    }

    if (o.addClass) {
        chartBoxIcons.addClass(o.addClass);
    }

    $.each(o.icons, function(i, icon) {
        var box = Utils.create("span")
            .addClass("hicons-btn")
            .appendTo(chartBoxIcons);

        var hicon = Utils.create("span")
            .appendTo(box);

        if (icon.type === "colorpicker") {
            if (icon.color) {
                hicon.css({ "background-color": icon.color });
                hicon.data("color", icon.color);
            } else {
                hicon.data("color", null);
            }
            hicon.addClass("color-picker-icon");
            hicon.hexColorPicker({
                colorModel: "hex",
                submitCallback: function(color) { hicon.data("color", color) }
            });
        } else {
            hicon.addClass("hicons "+ icon.type);
        }

        if (icon.title) {
            hicon.attr("title", icon.title).tooltip();
        }

        if (icon.addClass) {
            box.addClass(icon.addClass);
        }

        if (icon.callback) {
            hicon.click(function() { icon.callback(icon.data) });
        } else if (icon.route) {
            hicon.click(function() { Bloonix.route.to(icon.route) });
        }
    });

    o.destroy = function() {
        chartBoxIcons.remove();
    };

    return o;
};

Bloonix.get = function(url, data) {
    var object;

    Ajax.post({
        url: url,
        async: false,
        data: data,
        success: function(result) {
            object = result.data;
        }
    });

    return object;
};

Bloonix.notImplemented = function() {
    $("#content").html(
        Utils.create("div")
            .addClass("info-err")
            .text("This feature is not implemented yet!")
    );
};

Bloonix.createIcon = function(type) {
    var icon = Utils.create("span")
        .attr("title", Text.get("action."+ type))
        .addClass("btn btn-white btn-small-icon")
        .html(Utils.create("span").addClass("hicons-gray hicons "+ type))
        .tooltip();
    return icon;
};

/*
    In this example the value is stored to o.cache.selected.preset.

    Bloonix.createIconList({
        items: [
            { name: "30d",  value: "30d",  title: "30d", default: true },
            { name: "60d",  value: "60d",  title: "60d" },
            { name: "90d",  value: "90d",  title: "90d" },
            { name: "180d", value: "180d", title: "180d" }
        ],
        store: { to: o.cache.selected, as: "preset" },
        callback: function() { o.tableOpts.getData() },
        appendTo: dataRelativeTime
    });
*/
Bloonix.createIconList = function(o) {
    var self = this;

    o.container = Utils.create("div");
    o.getContainer = function() {
        return this.container;
    };

    if (o.appendTo) {
        o.container.appendTo(o.appendTo);
    }

    o.cache = { };

    if (o.multiple == true) {
        o.switchTo = function(value, noCallback) {
            var self = this;

            if (this.cache[value].enabled == true) {
                this.cache[value].object.removeClass("btn-selected");
                this.cache[value].enabled = false;
            } else {
                this.cache[value].object.addClass("btn-selected");
                this.cache[value].enabled = true;
            }

            var values = [ ];
            $.each(this.cache, function(key, btn) {
                if (self.cache[key].enabled == true) {
                    values.push(key);
                }
            });

            if (this.store) {
                this.store.to[this.store.as] = values;
            }

            if (this.callback && noCallback == undefined) {
                this.callback(values);
            }
        };
    } else {
        o.switchTo = function(value, noCallback) {
            $.each(this.cache, function(key, btn) {
                if (btn.enabled === true) {
                    btn.enabled = false;

                    btn.object.removeClass("btn-selected");

                    if (btn.icon !== undefined) {
                        btn.icon.removeClass("btn-icon-selected");
                        btn.icon.addClass("btn-icon-unselected");
                    }
                }
            });

            this.cache[value].enabled = true;
            this.cache[value].object.addClass("btn-selected");

            if (this.cache[value].icon !== undefined) {
                this.cache[value].icon.removeClass("btn-icon-unselected");
                this.cache[value].icon.addClass("btn-icon-selected");
            }

            if (this.store) {
                this.store.to[this.store.as] = value;
            }

            if (this.callback && noCallback == undefined) {
                this.callback(value);
            }
        };
    }

    $.each(o.items, function(i, item) {
        var elem = Utils.create("div")
            .attr("data-value", item.value)
            .appendTo(o.container)
            .tooltip();

        o.cache[item.value] = {
            object: elem,
            enabled: false
        };

        if (item.name) {
            elem.html(item.name);
        } else if (item.icon) {
            o.cache[item.value].icon = Utils.create("div")
                .addClass(item.icon)
                .addClass("btn-icon-unselected")
                .appendTo(elem);
        }

        if (item.title != undefined) {
            elem.attr("title", item.title)
        }

        elem.click(function() { o.switchTo(item.value) });

        if (o.button !== false) {
            if (o.format == undefined) {
                elem.addClass("btn btn-white btn-icon-even")
            } else {
                elem.addClass("btn btn-white btn-"+ o.format)
            }
        } else {
            if (o.display == undefined) {
                o.display = "block";
            }
            elem.css({
                display: o.display,
                padding: "4px",
                cursor: "pointer"
            });
            elem.hover(
                function() { elem.addClass("btn-hovered") },
                function() { elem.removeClass("btn-hovered") }
            );
        }

        if (item.default == true) {
            o.switchTo(item.value, true);
        }
    });

    return o;
};

// Some date time validations
// Validate timestamps "from time" - "to time", where the "to" timestamp
// must be higher than the "from" timestamp. The expected format of the
// timestamps is as example: 2000-10-10 01:00:00
Bloonix.validateFromToDateTime = function(from, to) {
    if (from == undefined || to == undefined) {
        return false;
    }

    var resultFrom = /^(\d{4}-\d{2}-\d{2}) (\d{2}:\d{2}:\d{2})$/.exec(from);
    var resultTo = /^(\d{4}-\d{2}-\d{2}) (\d{2}:\d{2}:\d{2})$/.exec(to);

    if (resultFrom == null || resultTo == null) {
        return false;
    }

    if (Bloonix.validateDate(resultFrom[1]) == false || Bloonix.validateDate(resultTo[1]) == false) {
        return false;
    }

    if (Bloonix.validateTime(resultFrom[2]) == false || Bloonix.validateTime(resultTo[2]) == false) {
        return false;
    }

    var numFrom = Math.floor(from.replace(/[-:\s]/g, "")),
        numTo = Math.floor(to.replace(/[-:\s]/g, ""));

    if (numFrom >= numTo) {
        return false;
    }

    return true;
};

// Validate "from" - "to" timestamps, but without seconds. The expected
// timestamp format is: 2000-10-10 01:00
Bloonix.validateFromToDateHourMin = function(from, to) {
    if (from == undefined || to == undefined) {
        return false;
    }

    from += ":00";
    to += ":00";

    return Bloonix.validateFromToDateTime(from, to);
};

// Validate the date part of a timestamp. The expected format is 2010-10-10.
Bloonix.validateDate = function(date) {
    if (date == undefined) {
        return false;
    }

    var result = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);

    if (result == null) {
        return false;
    }

    var year = Math.floor(result[1]),
        month = Math.floor(result[2]),
        day = Math.floor(result[3]);

    if (month > 12) {
        return false;
    }

    if (month == 4 || month == 6 || month == 9 || month == 11) {
        if (day > 30) {
            return false;
        }
    } else if (month == 2) {
        var febdays = year % 100 && year % 4 ? 28 : 29;
        if (day > febdays) {
            return false;
        }
    } else if (day > 31) {
        return false;
    }

    return true;
};

// Validate the time part of a timestamp. The expected format is 00:00:00.
Bloonix.validateTime = function(time) {
    if (time == undefined) {
        return false;
    }

    var result = /^(\d{2}):(\d{2}):(\d{2})$/.exec(time);

    if (result == null) {
        return false;
    }

    var hour = Math.floor(result[1]),
        min = Math.floor(result[2]),
        sec = Math.floor(result[3]);

    if (hour > 23 || min > 59 || sec > 59) {
        return false;
    }

    return true;
};

Bloonix.createNoteBox = function(o) {
    var object = Utils.extend({
        id: "int-footnote",
        timeout: 2000,
        fadeOutAfter: 400,
        autoClose: false,
        baseClass: "footnote",
        infoClass: "info-simple",
        closeIconClass: "hicons-gray hicons remove close-x",
        text: "not available"
    }, o);

    object.create = function() {
        var self = this;

        if ($("#"+ this.id).length) {
            $("#"+ this.id).remove();
        }

        this.outerContainer = Utils.create("div")
            .attr("id", this.id)
            .addClass(this.baseClass)
            .hide()
            .appendTo("body")
            .fadeIn(400);

        this.bubbleContainer = Utils.create("div")
            .addClass(this.infoClass)
            .html(this.text)
            .appendTo(this.outerContainer);

        Utils.create("span")
            .addClass(this.closeIconClass)
            .click(function() { self.close() })
            .appendTo(this.bubbleContainer);

        if (this.autoClose === true) {
            setTimeout( function() { self.close() }, self.timeout);
        }
    };

    object.close = function() {
        this.outerContainer.fadeOut(self.fadeOutAfter).remove();
    };

    object.create();
    return object;
};

Bloonix.hostServiceAction = function(url, data, text) {
    Ajax.post({
        url: url,
        data: data,
        token: true,
        success: function(result) {
            if (result.status == "ok") {
                Bloonix.createNoteBox({
                    infoClass: "info-ok",
                    text: Utils.create("p").html(Text.get("info.update_success")),
                    autoClose: true,
                    timeout: 4000
                });
            }
        }
    });
};

Bloonix.noAuth = function() {
    $("#content").html(
        Utils.create("div")
            .addClass("info-err")
            .html(Text.get("err-415"))
    ); 
};

Bloonix.flag = function(countryCode, text) {
    countryCode = countryCode.toLowerCase();

    var span = Utils.create("span")
        .addClass("f32");

    Utils.create("span")
        .addClass("flag "+ countryCode)
        .appendTo(span);

    if (text) {
        var outer = Utils.create("span")
            .html(span);
        Utils.create("span")
            .css({ "margin-left": "10px" })
            .text(text)
            .appendTo(outer);
        span = outer;
    }

    return span;
};

Bloonix.showScrollbarAtHover = function(container) {
    $(container)
        .css({ "overflow-x": "hidden", "overflow-y": "hidden" })
        .hover(
            function() { $(this).css({ "overflow-y": "auto" }) },
            function() { $(this).css({ "overflow-y": "hidden" }) }
        );
};

Bloonix.checkIfObject = function(value) {
    if (value === null || value === undefined || value === false || typeof value !== "object") {
        return false;
    }
    return true;
};

Bloonix.getContentSize = function() {
    var width = $("#content").width();

    var height = $(window).height()
        - $("#content-outer").offset().top
        - $("#footer-outer").outerHeight();

    return { width: width, height: height };
};

Bloonix.sortObject = function(o) {
    var a = [];
    $.each(o, function(i, r) {
        a.push(i);
    });
    return a.sort();
};

Bloonix.addLoading = function(container) {
    Utils.create("div")
        .addClass("loading")
        .show()
        .appendTo(container);
};

Bloonix.replaceWithLoading = function(container) {
    $(container).html(
        Utils.create("div")
            .addClass("loading")
            .show()
    );
};

Bloonix.removeLoading = function(container) {
    $(container).find(".loading").remove();
};

Bloonix.enableLoading = function(container) {
    $(container).find(".loading").show();
};

Bloonix.disableLoading = function(container) {
    $(container).find(".loading").hide();
};

Bloonix.createFooterIcon = function(o) {
    var span = Utils.create("span")
        .addClass("footer-button");

    if (o.title) {
        span.attr("title", o.title);
        span.tooltip();
    }

    if (o.icon) {
        Utils.create("div")
            .addClass("hicons-white hicons "+ o.icon)
            .appendTo(span);
    }

    if (o.click) {
        span.click(o.click);
    }

    span.appendTo("#footer-left")

    return span;
};

Bloonix.createSysInfoLink = function(o) {
    if (!o || o.length == 0) {
        return "";
    }

    var match = Bloonix.splitSysInfo(o);

    return Utils.create("a")
        .attr("href", match[1])
        .attr("target", "_blank")
        .text(match[0]);
};

Bloonix.splitSysInfo = function(o) {
    var text, href;

    if (o && /^[^=]+=http/.test(o)) {
        var matches = /^([^=]+)=(http.+)/.exec(o);
        text = matches[1];
        href = matches[2];
    } else {
        text = Text.get("schema.host.attr.sysinfo");
        href = o;
    }

    return [ text, href ];
};
