var Table = function(o) {
    this.postdata = {
        offset: 0,
        limit: 50
    };

    Utils.extend(this, o);

    Utils.append(this.selectable, {
        max: 0,
        name: "id",
        filter: "tr",
        cancel: "a,span,:input,option,ul",
        autoRefresh: true,
        resultTitle: Text.get("text.selected_objects")
    });

    Utils.append(this.searchable, {
        postdata: {
            offset: 0,
            limit: 10
        }
    });

    if (this.selectable) {
        if (this.selectable.counter == undefined) {
            this.selectable.counter = {};
        }
        Utils.append(this.selectable.counter, {
            hideIfNull: true,
            appendTo: "#selected-counter",
            addClass: "counter-button",
            title: Text.get("action.view_selected_objects")
        });
    }

    if (this.columnSwitcher === false) {
        this.columnSwitcher = { enabled: false };
    } else if (this.columnSwitcher === true) {
        this.columnSwitcher = { enabled: true };
    }
    if (this.columnSwitcher.enabled === undefined) {
        this.columnSwitcher.enabled = true;
    }
    if (this.columnSwitcher.config === undefined) {
        this.columnSwitcher.config = {};
    }

    this.cache = { data: {}, selected: {} };
};

Table.prototype = {
    width: "full",
    addClass: false,
    //iconsClass: "table-icons-column",
    iconsClass: "",
    appendTo: "#content",
    appendPagerTo: false,
    type: "default",
    /* columnSwitcher:
    **   - true
    **   - false
    **   - { table: "table-name", config: { column: "show|hide" }, callback: function(){} }
    */
    columnSwitcher: false,
    values: false,
    header: false,
    headerObject: false,
    url: false,
    postdata: false,
    columns: false,
    linkMenuClass: "link-onclick-menu",
    postdataCallback: false
};

Table.prototype.init = function() {
    this.container = Utils.create("div");
    this.table = Utils.create("table").appendTo(this.container);
    this.pagerBox = Utils.create("div").appendTo(this.container);
 
    if (this.type == "default") {
        this.table.addClass(this.addClass || "maintab");
        if (this.width == "full") {
            this.width = "100%";
        }
        if (this.width == "inline" || this.width == "none") {
            this.width = false;
        }
        if (this.width) {
            this.table.css({ width: this.width });
        }
        this.thead = Utils.create("thead").appendTo(this.table);
        this.thRow = Utils.create("tr").appendTo(this.thead);
        this.tbody = Utils.create("tbody").appendTo(this.table);
    } else if (this.type == "form") {
        this.table.addClass(this.addClass || "form-table");
        this.tbody = Utils.create("tbody").appendTo(this.table);
    } else if (this.type == "vtable") {
        this.table.addClass(this.addClass || "vtable");
        this.thead = Utils.create("thead").appendTo(this.table);
        this.thRow = Utils.create("tr").appendTo(this.thead);
        this.tbody = Utils.create("tbody").appendTo(this.table);
    } else if (this.type == "simple") {
        if (this.addClass) {
            this.table.addClass(this.addClass);
        }
        this.tbody = Utils.create("tbody").appendTo(this.table);
    } else {
        if (this.addClass) {
            this.table.addClass(this.addClass);
        }
        this.thead = Utils.create("thead").appendTo(this.table);
        this.thRow = Utils.create("tr").appendTo(this.thead);
        this.tbody = Utils.create("tbody").appendTo(this.table);
    }

    if (this.css) {
        this.table.css(this.css);
    }

    if (this.id) {
        this.table.attr("id", this.id);
    }

    if (this.appendTo) {
        this.container.appendTo(this.appendTo);
    }

    return this;
};

Table.prototype.getContainer = function() {
    return this.container;
};

Table.prototype.getTable = function() {
    return this.table;
};

Table.prototype.create = function() {
    Log.debug("create a new table");
    var self = this;

    this.colsByKey = { };

    $.each(this.columns, function(i, col) {
        self.colsByKey[col.name] = col;
    });

    this.createHeader();
    this.createStruct();
    this.createColumnSwitcher();

    if (this.values) {
        this.loading.hide();
        this.createRows(this.values);
        this.addSelectEvents();
    } else if (this.url) {
        this.getData();
    }

    if (this.searchable) {
        this.addSearchEvents();
    }

    if (this.searchButton) {
        $(this.searchButton)
            .click(function() { self.getData() });
    }

    return this;
};

Table.prototype.hide = function(o) {
    this.table.hide(o);
};

Table.prototype.show = function(o) {
    this.table.show(o);
};

Table.prototype.createHeader = function() {
    var self = this;

    if (this.headerObject) {
        this.header = this.headerObject;
    } else if (this.header) {
        if (this.reloadable === true) {
            this.reloadable = {};
        }
        if (this.reloadable) {
            if (this.header.icons === undefined) {
                this.header.icons = [];
            }
            if (this.reloadable.callback === undefined) {
                this.reloadable.callback = function() {
                    if (self.reloadable.before) {
                        self.reloadable.before();
                    }
                    self.getData();
                };
            }

            this.header.icons.push({
                type: "reload",
                callback: this.reloadable.callback,
                title: Text.get("action.reload")
            });
        }
        this.header = new Header(this.header);
        this.header.create();
    }
};

Table.prototype.createStruct = function() {
    var self = this;
    this.init();

    if (this.addAttr) {
        $.each(this.addAttr, function(id, value) {
            self.table.attr(id, value);
        }); 
    }   

    $.each(this.columns, function(i, col) {
        if (col.icons) {
            Utils.create("th").appendTo(self.thRow);
            return true;
        }

        var th = Utils.create("th")
            .attr("data-col", col.name)
            .text(col.text)
            .appendTo(self.thRow);

        if (self.sortable === true && col.sortable !== false) {
            th.css({ cursor: "pointer" });
            th.click(function() {
                self.postdata.sort_type = self.sortedType = self.sortedType === "asc" ? "desc" : "asc";
                self.postdata.sort_by = col.name;
                self.postdata.offset = 0;
                self.getData();
            });
        }

        self.hideOrShowColumn(th, col);
    });

    if (this.deletable != undefined || self.rowHoverIcons) {
        Utils.create("th")
            .appendTo(this.thRow)
            .css({ "width": "20px" });
    }

    this.loading = Utils.create("div")
        .addClass("loading")
        .appendTo(this.container);
};

Table.prototype.hideOrShowColumn = function(obj, col) {
    if (this.columnSwitcher !== false && this.columnSwitcher.config[col.name]) {
        if (this.columnSwitcher.config[col.name] === "hide") {
            obj.hide();
        }
    } else if (col.hide === true) {
        obj.hide();
    }
};

Table.prototype.createColumnSwitcher = function() {
    var self = this,
        callback, switchTable, config;

    if (this.columnSwitcher === false) {
        return false;
    }

    if (this.columnSwitcher.callback) {
        callback = this.columnSwitcher.callback;
        switchTable = this.columnSwitcher.table;
    }

    var container = Utils.create("div")
        .addClass("column-switcher")
        .appendTo(this.header.rbox);

    var icon = Utils.create("div")
        .addClass("gicons-gray gicons cogwheels")
        .appendTo(container);

    var result = Utils.create("div")
        .addClass("result")
        .hide()
        .appendTo(container);

    var infobox = Utils.create("div")
        .addClass("arrow-box-white")
        .appendTo(result);

    container.hover(
        function() { $(result).fadeIn(300) },
        function() { $(result).fadeOut(100) }
    );

    var table = Utils.create("table")
        .addClass("table-column-switcher")
        .appendTo(infobox);

    $.each(this.columns, function(i, col) {
        if (col.icons || col.switchable === false) {
            return true;
        }

        var tr = Utils.create("tr")
            .appendTo(table);

        var th = Utils.create("th")
            .text(col.text)
            .appendTo(tr);

        var td = Utils.create("td")
            .appendTo(tr);

        var input = Utils.create("input")
            .attr("type", "checkbox")
            .attr("name", col.name)
            .appendTo(td);

        if (self.columnSwitcher !== false && self.columnSwitcher.config[col.name]) {
            if (self.columnSwitcher.config[col.name] == "show") {
                input.attr("checked", "checked");
            }
        } else if (col.hide != true) {
            input.attr("checked", "checked");
        }

        input.click(function() {
            if (this.checked === true) {
                if (callback) {
                    callback({ table: switchTable, column: col.name, action: "show" });
                }
                self.table.find("[data-col='"+ col.name +"']").fadeIn();
                self.colsByKey[col.name].hide = false;
            } else {
                if (callback) {
                    callback({ table: switchTable, column: col.name, action: "hide" });
                }
                self.table.find("[data-col='"+ col.name +"']").fadeOut();
                self.colsByKey[col.name].hide = true;
            }
        });
    });
};

Table.prototype.getData = function(o) {
    var self = this,
        postdata = this.postdata;

    this.loading.show();
    this.tbody.hide();

    if (this.postdataCallback) {
        postdata = this.postdataCallback(postdata);
    }

    if (this.bindForm) {
        postdata = Utils.extend({}, postdata);
        Utils.extend(postdata, this.bindForm.getData());
    }

    if (o) {
        if (o.resetOffset) {
            postdata.offset = 0;
        }
        if (o.search !== undefined) {
            this.search.set(o.search);
            postdata.query = o.search;
        }
    }

    Ajax.post({
        url: this.url,
        data: postdata,
        success: function(result) {
            self.loading.hide();

            if (self.bindForm && (result.status == "err-610" || result.status == "err-620")) {
                self.tbody.fadeIn(300);
                self.bindForm.markErrors(result.data.failed);
                return false;
            }

            self.tbody.html("");

            if (self.pager || self.header) {
                var appendPagerTo = self.pager
                    ? self.pager.appendTo
                    : self.header.pager;

                new Pager({
                    data: result,
                    postdata: postdata,
                    appendTo: appendPagerTo,
                    callback: function(req) {
                        self.postdata = req.postdata;
                        self.getData();
                    }
                }).create();

                if (self.showBottomPagerBox !== false) {
                    new Pager({
                        data: result,
                        postdata: postdata,
                        appendTo: self.pagerBox,
                        start: 10,
                        callback: function(req) {
                            self.postdata = req.postdata;
                            self.getData();
                        }
                    }).create();
                }
            }

            self.createRows(result.data);
            self.tbody.fadeIn(300);
            self.addSelectEvents();
        }
    });
};

Table.prototype.createRows = function(rows) {
    var self = this;

    $.each(rows, function(x, row) {
        var tr = Utils.create("tr")
            .appendTo(self.tbody);

        if (self.selectable && self.selectable.name) {
            var id = self.selectable.getUniqueId
                ? self.selectable.getUniqueId(row)
                : row[self.selectable.name];

            tr.attr("data-id", id);

            if (self.cache.selected[id]) {
                tr.addClass("ui-selected");
            }

            self.cache.data[id] = row;

            if (self.cache.selected[id]) {
                tr.addClass("ui-selected");
            }
        }

        if (self.onClick) {
            tr.css({ cursor: "pointer" });
            tr.click(function() { self.onClick(row) });
        }

        if (self.click) {
            tr.css({ cursor: "pointer" });
            tr.click(function() { self.click.callback(row) });
            tr.attr("title", self.click.title);
            tr.tooltip({ track: true });
        }

        if (self.tooltip) {
            tr.tooltip({
                items: tr,
                track: true,
                content: self.tooltip(row),
                tooltipClass: "ui-tooltip-low-z-index"
            });
        }

        $.each(self.columns, function(y, col) {
            var td = self.createColumn(tr, row, col);
            self.hideOrShowColumn(td, col);
        });

        var rowHoverIcons, rowHoverIconsWidth = 0;

        if (self.deletable !== undefined || self.rowHoverIcons) {
            rowHoverIcons = Utils.create("td")
                .css({ "vertical-align": "middle", padding: "1px 0 0 0", "white-space": "nowrap" })
                .appendTo(tr);
        }

        if (self.deletable !== undefined) {
            var addDeletableObject = true,
                icon = "";

            if (self.deletable.check) {
                addDeletableObject = self.deletable.check(row);
            }

            if (addDeletableObject === true) {
                var icon = Utils.create("a")
                    .attr("title", self.deletable.title)
                    .tooltip()
                    .addClass("hicons-btn")
                    .html(Utils.create("span").addClass("hicons remove").css({ margin: "0" }))
                    .click(function() { self.createDeleteOverlay(row, self.deletable) })
                    .hide();

                tr.hover(
                    function() { icon.show() },
                    function() { icon.hide() }
                );

                rowHoverIconsWidth = rowHoverIconsWidth + 20;
                rowHoverIcons.css({ width: rowHoverIconsWidth });
                icon.appendTo(rowHoverIcons);
            }
        }

        if (self.rowHoverIcons) {
            $.each(self.rowHoverIcons, function(i, iconOpts) {
                var icon = Utils.create("a")
                    .attr("title", iconOpts.title)
                    .tooltip()
                    .addClass("hicons-btn")
                    .html(Utils.create("span").addClass("hicons "+ iconOpts.icon).css({ margin: "0" }))
                    .click(function() { iconOpts.onClick(row, iconOpts) })
                    .hide()
                    .appendTo(rowHoverIcons);

                tr.hover(
                    function() { icon.show() },
                    function() { icon.hide() }
                );

                rowHoverIconsWidth = rowHoverIconsWidth + 20;
                rowHoverIcons.css({ width: rowHoverIconsWidth });
            });
        }
    });
};

Table.prototype.createRow = function(columns) {
    var row = Utils.create("tr").appendTo(this.tbody);

    if (columns) {
        if (this.type == "default") {
            $.each(columns, function(i, column) {
                Utils.create("td").html(column).appendTo(row);
            });
        } else {
            if (columns[0]) {
                Utils.create("th").html(columns[0]).appendTo(row);
            }
            if (columns[1]) {
                Utils.create("td").html(columns[1]).appendTo(row);
            }
        }
    }

    return row;
};

Table.prototype.createSimpleRow = function(columns) {
    var row = Utils.create("tr").appendTo(this.tbody);

    $.each(columns, function(i, column) {
        Utils.create("td")
            .html(column)
            .appendTo(row);
    });

    return row;
};

Table.prototype.createFormRow = function(thText, tdText) {
    var tr = Utils.create("tr").appendTo(this.tbody),
        th = Utils.create("th").appendTo(tr),
        td = Utils.create("td").appendTo(tr);

    if (thText) {
        th.html(thText);
    }

    if (tdText) {
        td.html(tdText);
    }

    return { tr: tr, th: th, td: td };
};

Table.prototype.addHeadColumn = function(column) {
    return Utils.create("th").html(column).appendTo(this.thRow);
};

Table.prototype.createDeleteOverlay = function(row, o) {
    var self = this;

    if (o == undefined) {
        o = this.deletable;
    }

    var url = typeof o.url === "function"
        ? o.url(row)
        : Utils.replacePattern(o.url, row);

    var content = Utils.create("div");

    if (o.warning) {
        Utils.create("div")
            .addClass("text-warn")
            .css({ width: "500px", margin: "15px", "text-align": "center" })
            .html(o.warning)
            .appendTo(content);
    }

    var table = Utils.create("table").addClass("vtable").appendTo(content),
        tbody = Utils.create("tbody").appendTo(table),
        buttonText = o.buttonText != undefined
            ? o.buttonText
            : Text.get("action.delete");

    $.each(o.result, function(i, name) {
        var thRow = Utils.create("tr").appendTo(tbody),
            value = row[name];

        Utils.create("th")
            .html(self.colsByKey[name].text)
            .appendTo(thRow);

        if (self.colsByKey[name].bool != undefined) {
            if (self.colsByKey[name].bool == "yn") {
                value = value == "0" ? Text.get("word.No") : Text.get("word.Yes");
            } else if (col.bool == "tf") {
                value = value == "0" ? Text.get("word.False") : Text.get("word.True");
            }
        }

        Utils.create("td")
            .text(value)
            .appendTo(thRow);
    });

    new Overlay({
        title: o.title,
        content: content,
        width: o.width || "default",
        buttons: [{
            content: buttonText,
            callback: function() {
                Ajax.post({
                    url: url,
                    data: row,
                    async: false,
                    token: true,
                    success: function(result) {
                        if (o.statusCallback && o.statusCallback[result.status]) {
                            o.statusCallback[result.status](result);
                        } else if (result.status == "ok") {
                            if (o.successCallback != undefined) {
                                o.successCallback();
                            } else {
                                self.getData();
                            }
                        }
                    }
                });
            }
        }]
    }).create();
};

Table.prototype.createColumn = function(tr, row, col) {
    var td = Utils.create("td");

    if (col.icons) {
        td.addClass(this.iconsClass)
            .appendTo(tr);

        $.each(col.icons, function(i, obj) {
            if (obj.check == undefined || obj.check(row) == true) {
                var icon;

                if (obj.hicon) {
                    icon = Utils.createInfoIcon(obj.hicon);
                } else {
                    icon = Utils.create("span").addClass(obj.icon);
                }

                if (obj.link) {
                    var link = Utils.replacePattern(obj.link, row, row.username);
                    icon = Utils.create("a").attr("href", link).html(icon);
                    if (obj.blank == true) {
                        icon.attr("target", "_blank");
                    }
                } else if (obj.call) {
                    icon = obj.call(row);
                } else if (obj.onClick) {
                    icon.click(function() { obj.onClick(row) });
                    icon.css({ cursor: "pointer" });
                } else {
                    icon.css({ cursor: "default" });
                }

                if (obj.title) {
                    if (typeof obj.title == "function") {
                        var t = obj.title(row);
                        icon.attr("title", t);
                    } else {
                        icon.attr("title", Utils.escape(obj.title));
                    }
                    icon.tooltip();
                }

                icon.appendTo(td);
            }
        });

        return td;
    }

    var value;

    if (col.value) {
        value = typeof col.value == "function" ? col.value(row) : value;
    } else if (col.notNull && row[col.name] === undefined) {
        value = col.notNull;
    } else if (col.empty && row[col.name] === "") {
        value = col.empty;
    } else if (typeof row[col.name] !== "object") {
        value = Utils.escape(row[col.name]);
    }

    if (col.bool != undefined) {
        if (col.bool == "yn") {
            value = value == "0" ? Text.get("word.No") : Text.get("word.Yes");
        } else if (col.bool == "tf") {
            value = value == "0" ? Text.get("word.False") : Text.get("word.True");
        }
    }

    if (col.link || col.call) {
        var str = col.link ? col.link : col.call;
        str = Utils.replacePattern(str, row);

        if (col.link) {
            value = Utils.create("a")
                .attr("href", Utils.escape(str))
                .html(value);
        } else {
            value = col.call(row);
        }
    }

    if (col.func) {
        value = col.func(row);
    }

    if (col.activeFlag) {
        var addClass = value ? "is-active" : "is-not-active",
            value = value ? Text.get("word.active") : Text.get("word.inactive");
        value = Utils.create("span")
            .addClass(addClass)
            .html(value);
    }

    if (col.menu) {
        var menuContainer = Utils.create("div")
            .addClass(this.linkMenuClass);

        var link = Utils.create("a")
            .html(value)
            .appendTo(menuContainer);

        var listContainer = Utils.create("ul")
            .hide()
            .appendTo(menuContainer);

        Utils.create("div")
            .addClass("hicons-white hicons remove close-x")
            .appendTo(listContainer)
            .click(function() { listContainer.fadeOut(200) });

        link.click(function() { listContainer.fadeIn(400) });
        value = menuContainer;

        $.each(col.menu, function(i, item) {
            var li = Utils.create("li").appendTo(listContainer);

            if (item.deletable) {
                var text = item.text || Text.get("action.delete");
                text = typeof text == "function"
                    ? text(row)
                    : text;
                li.html(text).click(function() {
                    listContainer.fadeOut(400);
                    self.createDeleteOverlay(row, item.deletable);
                });
            } else {
                var text = typeof item.text == "function"
                    ? item.text(row)
                    : item.text;
                li.html(text).click(function() {
                    listContainer.fadeOut(400);
                    item.callback(row);
                });
            }
        });
    }

    if (col.aTag) {
        value = Utils.create("a").html(value);
    }

    if (col.callback) {
        value = Utils.create("span").html(value);
        value.click(function(){ col.callback(row) });
    }

    if (col.convertFromUnixTime === true) {
        var date = new Date(value * 1000);
        value = DateFormat(date, DateFormat.masks.bloonix);
    }

    if (col.convertToTimeString === true) {
        value = Utils.secondsToStringShortReadable(value);
    }

    if (col.wrapIconClass === true) {
        value = Utils.createInfoIcon({ type: value });
    }

    if (col.wrapValueClass === true) {
        td.addClass("status-base status-"+ value +" status-border-right");
    }

    if (col.wrapNameValueClass === true) {
        value = Utils.create("div")
            .addClass("status-base status-"+ col.name +"-"+ value)
            .html(value);
    }

    if (typeof(value) != "object") {
        value = Utils.create("span").html(value);
    }

    if (col.prefix) {
        value.html(col.prefix +" "+ value.text());
    }

    if (col.onClick) {
        value = Utils.create("a")
            .html(value)
            .click(function() { col.onClick(row) });

        if (col.link == undefined && col.call == undefined) {
            value.hover(
                function() { $(this).css({ "text-decoration": "underline" }) },
                function() { $(this).css({ "text-decoration": "none" }) }
            );
        }
    }

    if (col.title) {
        if (typeof col.title === "function") {
            var content = col.title(row);

            if (content.length) {
                value.tooltip({
                    items: value,
                    track: true,
                    content: col.title(row)
                });
            }
        } else {
            value.attr("title", Utils.escape(col.title));
            value.tooltip({ track: true });
        }
    }

    td.attr("data-col", col.name)
        .html(value)
        .appendTo(tr);

    if (col.nowrap == true) {
        td.css({ "white-space": "nowrap" });
    }

    if (col.centered == true) {
        td.css({ "text-align": "center" });
    } else if (col.rightAlign == true) {
        td.css({ "text-align": "right" });
    }

    return td;
};

Table.prototype.addColumn = function(o) {
    var td = Utils.create("td");

    if (o.addClass) {
        td.addClass(o.addClass);
    }

    if (o.html) {
        td.html(o.html);
    }

    if (o.text) {
        td.text(o.text);
    }

    td.appendTo(this.tbody);

    return td;
};

Table.prototype.addSelectEvents = function() {
    if (!this.selectable) {
        return;
    }

    var self = this,
        selectedCache = this.cache.selected,
        dataCache = this.cache.data;

    if (this.selectable.counter) {
        this.addSelectedCounter();
    }

    // jQuery.selectable()
    this.tbody.selectable({
        filter: this.selectable.filter,
        cancel: this.selectable.cancel,
        autoRefresh: this.selectable.autoRefresh,
        selected: function(event, ui) {
            var selID = $(ui.selected).data("id");

            if (selectedCache[selID] == undefined) {
                if (self.selectable.max == 0 || Utils.objectSize(selectedCache) < self.selectable.max) {
                    selectedCache[selID] = dataCache[selID];
                } else {
                    $(ui.selected).removeClass("ui-selected");
                }
            }

            if (self.selectable.counter) {
                self.updateSelectedCounter();
            }
        },
        unselected: function(event, ui) {
            var selID = $(ui.unselected).find("[data-col='"+ self.selectable.name +"']").find("span").text();
            delete selectedCache[selID];

            if (self.selectable.counter) {
                self.updateSelectedCounter();
            }
        }
    });
};

Table.prototype.addSelectedCounter = function() {
    var self = this,
        counter = this.selectable.counter;

    if (counter.update) {
        counter.update = $(counter.update);
    } else {
        counter.update = Utils.create("span")
            .attr("title", counter.title)
            .tooltip()
            .addClass(counter.addClass);

        if (counter.hideIfNull) {
            counter.update.hide();
        }

        if (counter.appendTo) {
            $(counter.appendTo).html(counter.update);
        }
    }

    this.updateSelectedCounter();

    $(counter.update).click(
        function() {
            var table = Utils.create("table").addClass("maintab");
            var thead = Utils.create("thead").appendTo(table);
            var thRow = Utils.create("tr").appendTo(thead);
            var tbody = Utils.create("tbody").appendTo(table);

            $.each(self.selectable.result, function(i, name) {
                Utils.create("th")
                    .html(self.colsByKey[name].text)
                    .appendTo(thRow);
            });

            Utils.create("th")
                .html("")
                .appendTo(thRow);

            $.each(self.cache.selected, function(id, row) {
                var tdRow = Utils.create("tr").appendTo(tbody);

                $.each(self.selectable.result, function(y, col) {
                    Utils.create("td")
                        .html(row[col])
                        .appendTo(tdRow);
                });

                Utils.create("span")
                    .attr("title", Text.get("action.unselect"))
                    .addClass("btn btn-white btn-small-icon")
                    .html(Utils.create("span").addClass("hicons-white hicons remove"))
                    .appendTo(Utils.create("td").appendTo(tdRow))
                    .click(function(){
                        delete self.cache.selected[id];
                        tdRow.remove();
                        self.updateSelectedCounter();
                        self.table.find(".ui-selected").each(function() {
                            var value = $(this).data("id");
                            if (self.cache.selected[value] == undefined) {
                                $(this).removeClass("ui-selected");
                            }
                        });
                    }).tooltip();
            });

            var buttons = [ ];

            if (self.selectable.deletable) {
                buttons.push({
                    content: Text.get("action.delete"),
                    callback: function(overlayContent) {
                        var ids = self.getSelectedIds(),
                            failed = ids.length,
                            done = 0;

                        $.each(ids, function(i, id) {
                            var url = Utils.replacePattern(self.selectable.deletable.url, { id: id });

                            Ajax.post({
                                url: url,
                                token: true,
                                async: false,
                                success: function(result) {
                                    if (result.status == "ok") {
                                        --failed;
                                    }
                                }
                            });

                            done++;
                        });

                        self.cache.selected = {};
                        self.getData();
                        self.updateSelectedCounter();
                    }
                });
            }

            new Overlay({
                title: self.selectable.resultTitle,
                content: table,
                buttons: buttons
            }).create();
        }
    );
};

Table.prototype.updateSelectedCounter = function() {
    if (this.selectable && this.selectable.counter) {
        var size = Utils.objectSize(this.cache.selected);

        if (this.selectable.counter.descriptive) {
            if (size > 1 && size == this.selectable.max) {
                this.selectable.counter.update.html(size +" "+ Text.get("schema.chart.text.selected_max_reached"));
                this.selectable.counter.update.addClass("rwt");
            } else {
                this.selectable.counter.update.html(size +" "+ Text.get("schema.chart.text.selected"));
                this.selectable.counter.update.removeClass("rwt");
            }
        } else {
            this.selectable.counter.update.html(size);
        }

        if (size == 0 && this.selectable.counter.hideIfNull == true) {
            this.selectable.counter.update.hide();
        } else {
            this.selectable.counter.update.show();
        }
    }
};

Table.prototype.getSelectedIds = function() {
    var rows = this.getSelectedRows(),
        ids = [ ];
    $.each(rows, function(i, row) {
        ids.push(row.id);
    });
    return ids;
};

Table.prototype.getSelectedRows = function() {
    var rows = {};

    if (this.cache.selected) {
        $.each(this.cache.selected, function(key, val) {
            rows[key] = val;
        });
    }

    return rows;
};

Table.prototype.clearSelectedRows = function() {
    this.cache.selected = { };
    this.tbody.find(".ui-selected").removeClass("ui-selected");
    this.tbody.selectable("destroy");
    this.addSelectEvents();
};

Table.prototype.refreshSelectedRows = function(ids) {
    var self = this;
    this.clearSelectedRows();

    $.each(ids, function(id, obj) {
        var tr = self.table.find("[data-id='"+ id +"']");

        if (tr) {
            tr.addClass("ui-selected");
            self.cache.selected[id] = obj;
        }

        if (self.selectable.counter) {
            self.updateSelectedCounter();
        }
    });
};

Table.prototype.addSearchEvents = function() {
    var self = this,
        searchable = this.searchable;

    searchable.columns = [];

    if (searchable.appendTo) {
        searchable.appendTo = $(searchable.appendTo);
    } else if (this.header) {
        searchable.appendTo = this.header.search;
    }

    $.each(searchable.result, function(i, col) {
        searchable.columns.push(self.colsByKey[col]);
    });

    this.search = new Search({
        url: searchable.url,
        appendTo: searchable.appendTo,
        postdata: searchable.postdata,
        searchValue: searchable.value,
        resultWidth: searchable.resultWidth,
        searchCallback: function(result) {
            var table = new Table();
            table.init();

            $.each(searchable.columns, function(i, col) {
                table.addHeadColumn(col.text);
            });

            $.each(result.data, function(i, row) {
                var tr = table.createRow();

                $.each(searchable.columns, function(i, col) {
                    table.createColumn(tr, row, col);
                });
            });

            return table.table;
        },
        submitCallback: function(query) {
            self.postdata.query = query;
            self.postdata.offset = 0;
            self.getData();
        }
    }).create();
};

Table.createShell = function(addClass) {
    if (addClass == undefined) {
        addClass = "maintab";
    }
    var table = { };
    table.table = Utils.create("table").addClass(addClass);
    table.thead = Utils.create("thead").appendTo(table.obj);
    table.tbody = Utils.create("tbody").appendTo(table.obj);
    table.hrow = Utils.create("tr").appendTo(table.thead);
    return table;
};
