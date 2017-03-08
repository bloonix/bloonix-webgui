Bloonix.listCharts = function(o) {
    Bloonix.showChartsSubNavigation("service-charts");

    var object = Utils.extend({
        container: $("#content"),
        defaultAlignment: 3,
        cache: {},
        postdata: {
            offset: 0,
            limit: Bloonix.requestSize
        }
    }, o);

    object.create = function() {
        this.chartOptionBox = Utils.create("div").appendTo(this.container);
        this.chartChartBox = Utils.create("div").appendTo(this.container);
        this.chartViewAlias = "";

        if (this.screenCharts) {
            this.chartOptionBox.hide();
            this.createScreenCharts();
            return;
        }

        this.chartChartBox.hide();
        this.createTitleAndNavigation();
        this.createBoxes();
        this.getChartOptions();
        this.createChartOptions();
        this.createChartSelectionInfoBox();
        this.createServiceChartList();
        this.createUserChartList();
    };

    object.createTitleAndNavigation = function() {
        if (this.id) {
            this.host = Bloonix.getHost(this.id);
            Bloonix.showHostSubNavigation("charts", this.id, this.host.hostname);
            Bloonix.setTitle("schema.chart.text.select", this.host.hostname);
        } else {
            Bloonix.setTitle("schema.chart.text.multiselect");
        }
    };

    object.createBoxes = function() {
        this.boxes = Bloonix.createSideBySideBoxes({
            container: this.chartOptionBox,
            width: "290px"
        });

        if (this.id) {
            this.serviceChartContainer = this.boxes.right;
        } else {
            this.serviceChartContainer = Utils.create("div")
                .appendTo(this.boxes.right);

            this.userChartContainer = Utils.create("div")
                .appendTo(this.boxes.right)
                .hide();
        }
    };

    object.getChartOptions = function() {
        this.chartOptions = Bloonix.get("/hosts/charts/options/");
    };

    object.createChartOptions = function() {
        this.createFormHeader();

        if (this.id === undefined) {
            this.createChartTypeOptions();
        }

        this.createForm();
        this.createChartOptionsTimeMenu();
        this.createRefreshOptions();
        this.createPresetOptions();
        this.createFixedTimeOptions();
        this.createChartAlignmentOptions();
        this.createButtons();
        this.createChartLoaderOptions();
    };

    object.createFormHeader = function()  {
        new Header({
            title: Text.get("schema.chart.attr.options"),
            appendTo: this.boxes.left,
            rbox: false
        }).create();
    };

    object.createForm = function() {
        this.form = new Form({
            format: "default",
            appendTo: this.boxes.left
        });

        this.form.init();
        this.leftContainer = this.form.getContainer();
    };

    object.createChartTypeOptions = function() {
        var self = this;

        Utils.create("p")
            .addClass("chart-options-title")
            .html(Text.get("schema.chart.text.chart_type"))
            .appendTo(this.boxes.left);

        Bloonix.createIconList({
            items: [
                { name: Text.get("schema.chart.text.service_charts"), value: "service-charts", default: true },
                { name: Text.get("schema.chart.text.user_charts"), value: "user-charts" },
            ],
            format: "small",
            appendTo: this.boxes.left,
            callback: function(value) {
                if (value === "service-charts") {
                    self.userChartContainer.hide();
                    self.serviceChartContainer.show();
                } else {
                    self.serviceChartContainer.hide();
                    self.userChartContainer.show();
                }
            }
        });
    };

    object.createChartOptionsTimeMenu = function() {
        this.menu = new SimpleMenu({
            appendTo: this.leftContainer,
            store: { to: this.cache, as: "timetype" }
        }).create();

        this.absoluteTimeContainer = Utils.create("div")
            .appendTo(this.leftContainer);

        this.relativeTimeContainer = Utils.create("div")
            .appendTo(this.leftContainer);

        this.menu.add({
            text: Text.get("word.Relative"),
            value: "relative",
            container: this.relativeTimeContainer,
            show: true
        });

        this.menu.add({
            text: Text.get("word.Absolute"),
            value: "absolute",
            container: this.absoluteTimeContainer
        });
    };

    object.createRefreshOptions = function() {
        var options = [];

        $.each(this.chartOptions.options.refresh, function(i, value) {
            options.push({ name: value +"s", value: value });
        });

        Utils.create("p")
            .addClass("chart-options-title")
            .html(Text.get("schema.chart.attr.refresh"))
            .appendTo(this.relativeTimeContainer);

        this.refreshFormOptions = this.form.iconList({
            name: "refresh",
            options: options,
            appendTo: this.relativeTimeContainer,
            checked: this.chartOptions.defaults.refresh,
            even: true
        });
    };

    object.createPresetOptions = function() {
        Utils.create("p")
            .addClass("chart-options-title")
            .html(Text.get("schema.chart.attr.preset"))
            .appendTo(this.relativeTimeContainer);

        this.presetFormOptions = this.form.iconList({
            name: "preset",
            options: this.chartOptions.options.preset,
            appendTo: this.relativeTimeContainer,
            checked: this.chartOptions.defaults.preset,
            even: true
        });
    };

    object.createFixedTimeOptions = function() {
        this.fromFormOption = this.form.datetime({
            placeholder: Text.get("schema.chart.attr.from"),
            name: "from",
            format: "small",
            timeFormat: "hh:mm",
            stepMinute: 15,
            appendTo: this.absoluteTimeContainer
        });
        this.toFormOption = this.form.datetime({
            placeholder: Text.get("schema.chart.attr.to"),
            name: "to",
            format: "small",
            timeFormat: "hh:mm",
            stepMinute: 15,
            appendTo: this.absoluteTimeContainer
        });
    };

    object.createChartAlignmentOptions = function() {
        Utils.create("p")
            .addClass("chart-options-title")
            .html(Text.get("schema.chart.text.alignment"))
            .appendTo(this.leftContainer);

        this.alignmentFormOptions = this.form.iconList({
            name: "alignment",
            options: [
                { value: 1, icon: "hicons-white hicons align-justify" },
                { value: 2, icon: "hicons-white hicons th-large" },
                { value: 3, icon: "hicons-white hicons th" },
                { value: 4, icon: "hicons-white hicons col4" },
                { value: 5, label: "V" },
                { value: 6, label: "VI" },
                { value: 7, label: "VII" },
                { value: 8, label: "VIII" }
            ],
            appendTo: this.leftContainer,
            even: true,
            checked: this.defaultAlignment
        });
    };

    object.createButtons = function() {
        var self = this;

        this.buttonBox = Utils.create("div")
            .css({ "margin-top": "20px" })
            .appendTo(this.leftContainer);

        this.submitButton = Utils.create("div")
            .addClass("btn btn-white btn-default")
            .click(function() { self.generateCharts() })
            .html(Text.get("action.generate"))
            .css({ "margin-right": "6px" })
            .appendTo(this.buttonBox)
            .attr("title", Text.get("action.generate"))
            .tooltip();
    };

    object.createChartLoaderOptions = function() {
        if (this.id) {
            return;
        }

        var self = this,
            options = [ ];

        $.each(this.chartOptions.views, function(i, opt) {
            options.push({ name: opt.alias, value: opt.id });
        });

        this.saveChartBox = Utils.create("div")
            .css({ "margin-top": "20px" })
            .addClass("save-chart")
            .appendTo(this.boxes.left);

        Utils.create("p")
            .addClass("chart-options-title")
            .html(Text.get("schema.chart.text.chart_views"))
            .appendTo(this.saveChartBox);

        this.cache.chartSelection = new Form({ format: "small" }).select({
            placeholder: Text.get("schema.chart.text.load_view"),
            name: "chart_view",
            id: "chart-view-list",
            options: options,
            callback: function(id) { self.loadChartView(id) },
            appendTo: this.saveChartBox,
            showValue: true
        });

        Utils.create("div")
            .attr("title", Text.get("schema.chart.text.delete_view"))
            .addClass("btn btn-white btn-icon")
            .click(function(){ self.deleteChartView() })
            .html(Utils.create("span").addClass("hicons-white hicons remove"))
            .appendTo(this.saveChartBox)
            .tooltip();

        Utils.create("div")
            .addClass("clear")
            .appendTo(this.saveChartBox);
    };

    object.saveChartView = function() {
        var self = this,
            alias = $("#chart-view-alias").val();

        if (alias == undefined || alias == false) {
            $("#chart-view-alias").addClass("rwb");
            return false;
        }

        $("#chart-view-alias").removeClass("rwb");

        var toSave = {
            alignment: this.chartFormOptions.alignment,
            alias: alias,
            selected: [ ]
        };

        if (this.cache.timetype == "relative") {
            toSave.refresh = this.chartFormOptions.refresh;
            toSave.preset = this.chartFormOptions.preset;
        } else if (this.validateChartOptions(this.chartFormOptions)== true) {
            toSave.from = this.chartFormOptions.from;
            toSave.to = this.chartFormOptions.to;
        } else {
            return false;
        }

        $.each(this.chartColumnIDs, function(x, id) {
            x += 1;
            $(id).find(".chart-outer").each(function(y, obj) {
                var data = $(obj).data("chart");
                data.position = x;
                toSave.selected.push(data);
            });
        });

        Ajax.post({
            url: "/hosts/charts/view/save/",
            data: toSave,
            async: false,
            success: function(result) {
                if (result.status === "ok") {
                    self.reloadChartViews(alias);
                    Bloonix.createNoteBox({
                        infoClass: "info-ok",
                        text: Text.get("info.update_success"),
                        autoClose: true
                    });
                } else {
                    Bloonix.createNoteBox({
                        infoClass: "info-err",
                        text: Text.get("info.update_failed"),
                        autoClose: true
                    });
                }
            }
        });
    };

    object.reloadChartViews = function(selected) {
        var self = this;
        $("#chart-view-list ul").html("");

        Ajax.post({
            url: "/hosts/charts/options/",
            success: function(result) {
                var options = [ ];

                $.each(result.data.views, function(i, option) {
                    options.push({ name: option.alias, value: option.id });
                });

                self.cache.chartSelection.replaceOptions({
                    options: options,
                    selected: selected
                });
            }
        });
    };

    object.loadChartView = function(id) {
        var self = this;

        $("#chart-view-alias").removeClass("rwb");
        $("#chart-view-list .select").removeClass("rwb");
    
        Ajax.post({
            url: "/hosts/charts/view/"+ id,
            async: false,
            success: function(result) {
                var options = result.data.options;

                if (options.refresh) {
                    self.refreshFormOptions.switchTo(options.refresh);
                }
                if (options.preset) {
                    self.presetFormOptions.switchTo(options.preset);
                }
                if (options.alignment) {
                    self.alignmentFormOptions.switchTo(options.alignment);
                }
    
                if (options.from && options.to) {
                    self.fromFormOption.setValue(options.from);
                    self.toFormOption.setValue(options.to);
                    self.menu.switchTo("absolute");
                } else {
                    self.menu.switchTo("relative");
                }

                if (options.service_charts) {
                    self.serviceChartsTable.refreshSelectedRows(options.service_charts);
                }

                if (options.user_charts) {
                    self.userChartsTable.refreshSelectedRows(options.user_charts);
                }

                if (options.selected) {
                    self.chartPosition = options.selected;
                }

                self.chartViewAlias = result.data.alias;
            }
        });
    };

    object.deleteChartView = function(id, force) {
        var self = this,
            selected = this.cache.chartSelection.getSelected();

        if (!selected.value) {
            $("#chart-view-list .select").addClass("rwb");
            return false;
        }
    
        if (force == undefined) {
            new Overlay({
                title: Text.get("schema.chart.text.delete_view"),
                closeText: Text.get("action.abort"),
                content: Utils.create("div").html(Text.get("schema.chart.text.really_delete_view", Utils.escape(selected.option))),
                buttons: [{
                    content: Text.get("action.yes_delete"),
                    callback: function() { self.deleteChartView(selected.value, true) }
                }],
            }).create();
    
            return false;
        }
    
        $("#chart-view-list .select").removeClass("rwb");
        this.chartViewAlias = "";
        this.serviceChartsTable.clearSelectedRows();

        if (this.id === undefined) {
            this.userChartsTable.clearSelectedRows();
        }

        this.refreshFormOptions.switchTo(this.chartOptions.defaults.refresh);
        this.presetFormOptions.switchTo(this.chartOptions.defaults.preset);
        this.alignmentFormOptions.switchTo(this.defaultAlignment);
        this.fromFormOption.setValue("");
        this.toFormOption.setValue("");
        this.menu.switchTo("relative");
    
        Ajax.post({
            url: "/hosts/charts/view/"+ id + "/delete",
            async: false,
            success: function() { self.reloadChartViews() }
        });
    };

    object.createServiceChartList = function() {
        var self = this,
            url = this.id
                ? "/hosts/"+ o.id +"/charts"
                : "/hosts/charts",
            searchUrl = this.id
                ? "/hosts/"+ o.id +"/charts/search"
                : "/hosts/charts/search/";

        var header = new Header({
            appendTo: this.serviceChartContainer,
            title: this.id
                ? Text.get("schema.chart.text.select", this.host.hostname, true)
                : Text.get("schema.chart.text.multiselect"),
            pager: true,
            search: true,
            counter: true,
            infoBox: false
        }).create();

        this.serviceChartsTable = new Table({
            url: url,
            postdata: Utils.extend({}, this.postdata),
            appendTo: this.serviceChartContainer,
            headerObject: header,
            selectable: {
                result: [ "hostname", "service_name", "plugin", "title" ],
                counter: { update: header.counterObject, hideIfNull: false, descriptive: true },
                getUniqueId: function(row) { return row.service_id +":"+ row.chart_id },
                max: 100
            },
            searchable: {
                url: searchUrl,
                result: [ "hostname", "ipaddr", "service_name", "plugin", "title" ]
            },
            columns: this.getChartTableColumns()
        });

        this.serviceChartsTable.create();
        this.serviceChartsTable.getContainer().hover(
            function() { self.chartSelectionInfoBox.fadeIn(300) },
            function() { self.chartSelectionInfoBox.hide() }
        );
    };

    object.createUserChartList = function() {
        var self = this;

        var header = new Header({
            title: Text.get("schema.user_chart.text.title"),
            pager: true,
            search: true,
            counter: true,
            appendTo: this.userChartContainer
        }).create();

        this.userChartsTable = new Table({
            url: "/user/charts",
            postdata: Utils.extend({}, this.postdata),
            appendTo: this.userChartContainer,
            headerObject: header,
            searchable: {
                url: "/user/charts/search",
                result: [ "title" ]
            },
            selectable: {
                result: [ "title", "subtitle", "description" ],
                counter: { update: header.counterObject, hideIfNull: false, descriptive: true },
                max: 100
            },
            columns: [
                {
                    name: "id",
                    text: Text.get("schema.user_chart.attr.id"),
                    hide: true
                },{
                    name: "title",
                    text: Text.get("schema.user_chart.attr.title")
                },{
                    name: "subtitle",
                    text: Text.get("schema.user_chart.attr.subtitle")
                },{
                    name: "yaxis_label",
                    text: Text.get("schema.user_chart.attr.yaxis_label")
                },{
                    name: "description",
                    text: Text.get("schema.user_chart.attr.description")
                }
            ]
        }).create();
    };

    object.createChartSelectionInfoBox = function() {
        this.chartSelectionInfoBox = Utils.create("div")
            .addClass("info-simple")
            .html(Text.get("schema.chart.desc.charts"))
            .appendTo(this.boxes.left)
            .hide();
    };

    object.getChartTableColumns = function() {
        return [
            {
                name: "id",
                hide: true,
                text: Text.get("schema.chart.attr.id"),
                value: function(row) { return row.service_id +":"+ row.chart_id }
            },{
                name: "hostname",
                text: Text.get("schema.host.attr.hostname")
            },{
                name: "ipaddr",
                text: Text.get("schema.host.attr.ipaddr"),
            },{
                name: "service_name",
                text: Text.get("schema.service.attr.service_name")
            },{
                name: "plugin",
                text: Text.get("schema.service.attr.plugin")
            },{
                name: "title",
                text: Text.get("schema.chart.attr.title")
            }
        ];
    };

    object.generateCharts = function() {
        this.chartFormOptions = this.form.getData();
        this.chartsSelected = {};

        this.serviceChartsSelected = this.serviceChartsTable.getSelectedRows();
        this.userChartsSelected = this.userChartsTable.getSelectedRows();

        if (this.serviceChartsSelected) {
            Utils.extend(this.chartsSelected, this.serviceChartsSelected);
        }

        if (this.userChartsSelected) {
            Utils.extend(this.chartsSelected, this.userChartsSelected);
        }

        if (Utils.objectSize(this.chartsSelected) === 0) {
            return;
        }

        if (this.validateChartOptions(this.chartFormOptions) === true) {
            this.chartOptionBox.hide(200);
            this.chartChartBox.show(400);
            this.createChartBoxHeader();
            this.calculateChartSize();
            this.createChartBoxColumns();
            this.createChartBoxes();
            this.makeItSortable();
        }
    };

    object.createScreenCharts = function() {
        this.chartsSelected = this.screenCharts.options.selected;
        this.chartFormOptions = this.screenCharts.options;

        if (this.chartFormOptions.preset) {
            this.cache.timetype = "relative";
        }

        this.calculateChartSize();
        this.createChartBoxColumns();
        this.createChartBoxes();
        this.makeItSortable();
    };

    object.createChartBoxHeader = function() {
        var self = this;

        var header = new Header({
            appendTo: this.chartChartBox,
            title: this.id
                ? Text.get("schema.chart.text.view", this.host.hostname)
                : Text.get("schema.chart.text.multiple_view"),
            pager: false,
            search: false,
            infoBox: false
        }).create();

        Utils.create("input")
            .attr("placeholder", Text.get("schema.chart.text.save_view"))
            .attr("type", "text")
            .attr("id", "chart-view-alias")
            .attr("name", "chart-view-alias")
            .attr("value", Utils.escape(this.chartViewAlias))
            .addClass("input input-small")
            .css({ "margin-right": "6px", "margin-top": "9px" })
            .appendTo(header.rbox);

        Utils.create("div")
            .attr("title", Text.get("schema.chart.text.save_view"))
            .addClass("btn btn-white")
            .click(function() { self.saveChartView() })
            .html(Utils.create("span").addClass("hicons-white hicons check"))
            .appendTo(header.rbox)
            .tooltip();

        Utils.create("div")
            .attr("title", Text.get("schema.chart.text.back_to_selection"))
            .click(function() { self.reviewChartOptions() })
            .addClass("btn btn-white")
            .html(Utils.create("span").addClass("hicons-white hicons cog"))
            .appendTo(header.rbox)
            .tooltip();
    };

    object.createChartBoxColumns = function() {
        this.chartColumnsCounter = 0;
        this.chartColumnIDs = [];
        for (var i = 1; i <= this.countChartColumns; i++) {
            Utils.create("div")
                .attr("id", "chart-sortable-column-"+ i)
                .addClass("chart-sortable-column")
                .css(this.sortableChartColumns)
                .appendTo(this.chartChartBox);
            this.chartColumnIDs.push("#chart-sortable-column-"+ i);
        }
    };

    object.getNextChartPosition = function() {
        if (this.chartColumnsCounter >= this.countChartColumns) {
            this.chartColumnsCounter = 1;
        } else {
            this.chartColumnsCounter += 1;
        }
        return this.chartColumnsCounter;
    };

    object.createChartBoxes = function() {
        var self = this,
            selected = [],
            seen = {},
            x = 0;

        // store subkeys into an object
        $.each(this.chartsSelected, function(x, row) {
            if (row.subkeys && row.subkeys.length) {
                var subkeys = {};
                $.each(row.subkeys.split(","), function(y, str) {
                    subkeys[str] = true;
                });
                row.subkeys = subkeys;
            }
        });

        if (this.chartPosition) {
            $.each(this.chartPosition, function(i, row) {
                var key = row.service_id && row.chart_id
                    ? row.service_id +":"+ row.chart_id
                    : row.chart_id;

                // check if the chart is selected, if not, then ignore the saved selection
                if (self.chartsSelected[key]) {
                    var obj = Utils.extend({}, self.chartsSelected[key]);
                    obj.position = row.position;

                    if (obj.subkeys) {
                        // check if the subkey still exists, if not, then ignore it
                        if (row.subkey && row.subkey.length && obj.subkeys[row.subkey]) {
                            obj.subkey = row.subkey;
                            seen[key +":"+ row.subkey] = true;
                        }
                    // maybe the check switched from multiple to failover,
                    // then subkeys does not exists any more
                    } else {
                        seen[key] = true;
                    }

                    selected.push(obj);
                }
            });
        }

        // key = service_id:chart_id or chart_id
        $.each(this.chartsSelected, function(key, row) {
            if (row.subkeys) {
                $.each(row.subkeys, function(subkey, value) {
                    var obj = Utils.extend({}, row);

                    if (seen[key +":"+ subkey] !== true) {
                        obj.subkey = subkey;
                        obj.position = self.getNextChartPosition();
                        seen[key +":"+ subkey] = true;
                        selected.push(obj);
                    }
                });
            } else if (seen[key] !== true) {
                var obj = Utils.extend({}, row);
                obj.position = self.getNextChartPosition();
                seen[key] = true;
                selected.push(obj);
            }
        });

        $.each(selected, function(i, item) {
            var renderTo = "chart"+ x,
                outerContainer = "#"+ renderTo +"-outer",
                container = "#"+ renderTo;

            self.createChartBox(renderTo, item);
            item.outerContainer = outerContainer;
            item.container = container;
            item.renderTo = renderTo;
            item.avg = Math.floor(self.chartBoxCSS.width * 1.2) + "p";

            if (self.cache.timetype == "relative") {
                item.refresh = self.chartFormOptions.refresh;
                item.preset = self.chartFormOptions.preset;
                Bloonix.intervalObjects.push(
                    setInterval(function() {
                        Log.debug("load chart data for id "+ item.service_id +":"+ item.chart_id);
                        self.loadChartData(item);
                    }, self.chartFormOptions.refresh * 1000)
                );
            } else {
                item.from = self.chartFormOptions.from;
                item.to = self.chartFormOptions.to;
            }

            x++;
            self.loadChartData(item);
        });

        $(window).resize(function() {
            self.calculateChartSize();
            $(self.container).find(".chart-sortable-column").css(self.sortableChartColumns);
            $(self.container).find(".chart").css(self.chartBoxCSS);
        });
    };

    object.loadChartData = function(chart) {
        var self = this,
            query = this.createChartQuery(chart);

        if (this.screenCharts) {
            query.username = this.screenOpts.username;
            query.authkey = this.screenOpts.authkey;
        }

        Ajax.post({
            url: this.screenCharts
                ? "/screen/charts/data/"
                : "/hosts/charts/data/",
            data: query,
            success: function(result) {
                if (chart.service_id && chart.chart_id) {
                    self.plotServiceChart(chart, result);
                } else {
                    self.plotUserChart(chart, result);
                }
            }
        });
    };

    object.plotServiceChart = function(chart, result) {
        var service = result.data.service,
            stats = result.data.stats,
            title = service.hostname +" :: "+ service.title,
            subtitle = service.service_name,
            chartType = "line";

        if (service.subkey && service.subkey != "0") {
            subtitle += " ("+ service.subkey +")";
        }

        if (service.options["chart-type"]) {
            chartType = service.options["chart-type"];
        }

        var plotOptions = {
            chart: {
                container: chart.renderTo,
                title: title,
                subtitle: subtitle,
                ylabel: service.options.ylabel,
                xlabel: service.options.xlabel,
                units: service.options.units,
                type: chartType
            },
            series: [ ],
            colors: { },
            units: { },
            hasNegativeValues: service.options.negative === "true" ? true : false
        };

        $.each(service.options.series, function(index, item) {
            if (item.opposite == "true") {
                plotOptions.hasNegativeValues = true;
            }

            if (stats[item.name]) {
                var name = item.alias ? item.alias : item.name;
                plotOptions.colors[name] = item.color;

                plotOptions.series.push({
                    data: stats[item.name],
                    name: name,
                    description: item.description,
                    yAxis: 0,
                    color: "rgba("+ Utils.hexToRGB(item.color).join(",") +",0.8)"
                });
            }
        });

        $(chart.container)
            .css({ "border-color": "transparent" })
            .removeClass("loading chart-load-info");

        Bloonix.plotChart(plotOptions);
    };

    object.plotUserChart = function(chart, result) {
        var self = this,
            services = result.data.service,
            stats = result.data.stats;

        var plotOptions = { 
            chart: {
                container: chart.renderTo,
                title: chart.title,
                subtitle: chart.subtitle,
                ylabel: chart.yaxis_label,
                xlabel: chart.xaxis_label,
                units: chart.units,
                type: "area"
            },
            series: [ ],
            colors: { },
            units: { },
            hasNegativeValues: false
        };

        $.each(chart.options, function(i, item) {
            var service = services[item.service_id],
                alias = item.statkey_options.alias || item.statkey,
                name = '['+ alias +'] '+ service.hostname +' - '+ service.service_name;

            plotOptions.colors[name] = item.color;
            plotOptions.units[name] = item.statkey_options.units;

            var s = {
                data: stats[ item.service_id +':'+ item.statkey ],
                name: name,
                description: item.statkey,
                yAxis: 0
            };

            if (item.color) {
                s.color = "rgba("+ Utils.hexToRGB(item.color).join(",") +",0.8)"
            }

            plotOptions.series.push(s);
        });

        $(chart.container)
            .css({ "border-color": "transparent" })
            .removeClass("loading chart-load-info");

        Bloonix.plotChart(plotOptions);
    };

    object.createChartQuery = function(chart) {
        var query = { avg: chart.avg };

        if (chart.service_id && chart.chart_id) {
            query.chart_id = chart.chart_id;
            query.service_id = chart.service_id;
            query.subkey = chart.subkey;
            query.avg = chart.avg;
        } else {
            query.chart_id = chart.id;
        }

        if (chart.from && chart.to) {
            query.from = chart.from;
            query.to = chart.to;
        } else {
            query.preset = chart.preset;
        }

        return query;
    };

    object.createChartBox = function(id, item) {
        var self = this,
            icons = [];

        var outerBox = Utils.create("div")
            .attr("id", id +"-outer")
            .addClass("chart-outer")
            .css({ position: "relative", display: "inline-block" })
            .appendTo("#chart-sortable-column-"+ item.position);

        if (item.service_id && item.chart_id) {
            outerBox.data("chart", {
                service_id: item.service_id,
                chart_id: item.chart_id,
                subkey: item.subkey
            });
            icons.push({
                type: "info-sign",
                title: Text.get("text.chart_info"),
                callback: function() { self.createInfoBoxOverlay(item) }
            });
        } else {
            outerBox.data("chart", {
                chart_id: item.id
            });
        }

        icons.push({
            type: "move",
            title: Text.get("action.move_box"),
            addClass: "chart-portlet"
        });

        Bloonix.createHoverBoxIcons({
            container: outerBox,
            icons: icons
        });

        var chartBox = Utils.create("div")
            .attr("id", id)
            .addClass("chart")
            .appendTo(outerBox)
            .css(this.chartBoxCSS)
            .css({ "border-color": "#d1d1d1" })
            .addClass("loading chart-load-info");

        var title = Utils.create("p").appendTo(chartBox);
        var subtitle = Utils.create("p").appendTo(chartBox);

        if (item.service_id && item.chart_id) {
            Utils.create("i")
                .text([ item.hostname, item.title ].join("::"))
                .appendTo(title);

            Utils.create("i")
                .text(item.service_name)
                .appendTo(subtitle);
        } else {
            Utils.create("i")
                .text(item.title)
                .appendTo(title);

            Utils.create("i")
                .text(item.subtitle)
                .appendTo(subtitle);
        }

        return chartBox;
    };

    object.createInfoBoxOverlay = function(chartOptions) {
        var query = {};

        if (this.screenCharts) {
            query.username = this.screenOpts.username;
            query.authkey = this.screenOpts.authkey;
        }

        var pluginStats = Bloonix.get("/hosts/charts/info/"+ chartOptions.plugin_id, query);
        var names = [],
            content = Utils.create("div"),
            table = new Table({ appendTo: content }).init();

        table.addHeadColumn("Statistic");
        table.addHeadColumn("Description");

        $.each(chartOptions.options.series, function(i, item) {
            names.push(item.name);
        });

        $.each(names.sort(), function(i, name) {
            if (pluginStats[name]) {
                table.createRow([
                    pluginStats[name]["alias"],
                    pluginStats[name]["description"]
                ]);
            }
        });

        var chartId = chartOptions.subkey
            ? chartOptions.service_id +":"+ chartOptions.chart_id +":"+ chartOptions.subkey
            : chartOptions.service_id +":"+ chartOptions.chart_id;

        Utils.create("p")
            .css({ "font-size": "10px", "margin-top": "20px" })
            .text(Text.get("schema.chart.text.chart_id", chartId))
            .appendTo(content);

        new Overlay({
            title: Text.get("schema.chart.text.chart_information"),
            content: content
        }).create();
    };

    object.reviewChartOptions = function() {
        Ajax.abortXHRs();
        Bloonix.clearIntervalObjects();
        Bloonix.destroyChartObjects();
        this.chartChartBox.html("");
        this.chartChartBox.hide(400);
        this.chartOptionBox.show(200);
    };

    object.validateChartOptions = function(data) {
        if (this.cache.timetype == "absolute") {
            if (Bloonix.validateFromToDateHourMin(data.from, data.to) == false) {
                this.form.markErrors([ "from", "to" ]);
                return false;
            }
        }

        this.form.removeErrors();
        return true;
    };

    object.calculateChartSize = function() {
        var chartMargin = 10,
            chartWidth, chartHeight;

        if (this.chartFormOptions.alignment == 0) {
            chartWidth = Math.floor( $(this.container).width() / 2 );
            this.countChartColumns = 2;
        } else if (this.chartFormOptions.alignment == 1) {
            chartWidth = Math.floor( $(this.container).width() );
            this.countChartColumns = 1;
        } else if (this.chartFormOptions.alignment >= 2) {
            chartWidth = Math.floor( $(this.container).width() / this.chartFormOptions.alignment);
            this.countChartColumns = this.chartFormOptions.alignment;
        }

        chartWidth -= 20; // -20px scrollbar
        chartWidth = Math.floor( chartWidth - (chartMargin * 2) );

        if (chartWidth > 1000) {
            chartHeight = 450;
        } else if (this.chartFormOptions.alignment == 3) {
            chartHeight = Math.floor( (chartWidth / 2.2) - (chartMargin * 2) );
        } else {
            chartHeight = Math.floor( (chartWidth / 3) - (chartMargin * 2) );
        }

        if (chartHeight > chartWidth) {
            chartHeight = chartWidth;
        } else if (chartHeight < 300) {
            chartHeight = 300;
        }

        this.sortableChartColumns = {
            width: chartWidth + chartMargin + chartMargin,
            "min-height": "200px",
            margin: 0,
            padding: 0,
            float: "left",
            border: "1px solid transparent"
        };

        this.chartBoxCSS = {
            width: chartWidth,
            height: chartHeight,
            margin: chartMargin,
            border: "1px solid transparent"
        };
    };

    object.makeItSortable = function() {
        $(".chart-sortable-column").sortable({
            start: function() { $(".chart-outer").css({ "border": "1px dashed #c1c1c1" }) },
            stop: function() { $(".chart-outer").css({ "border": "1px solid transparent" }) },
            connectWith: ".chart-sortable-column",
            handle: ".chart-portlet",
            forcePlaceholderSize: true,
            tolerance: "pointer"
        }).disableSelection();
    };

    object.create();
};

Bloonix.listUserCharts = function(o) {
    Bloonix.showChartsSubNavigation("user-charts");

    var object = Utils.extend({
        appendTo: $("#content"),
        postdata: {
            offset: 0,
            limit: Bloonix.requestSize
        }
    }, o);

    object.create = function() {
        this.table = new Table({
            url: "/user/charts",
            postdata: this.postdata,
            appendTo: this.appendTo,
            header: {
                title: Text.get("schema.user_chart.text.title"),
                pager: true,
                search: true,
                icons: [
                    {
                        type: "help",
                        callback: function() { Utils.open("/#help/user-charts") },
                        title: Text.get("site.help.doc.user-charts")
                    },{
                        type: "create",
                        callback: function() { Bloonix.route.to("monitoring/charts/editor/create") },
                        title: Text.get("schema.user_chart.text.create")
                    }
                ]
            },
            searchable: {
                url: "/user/charts/search",
                result: [ "title" ]
            },
            deletable: {
                title: Text.get("schema.user_chart.text.delete"),
                url: "/user/charts/:id/delete",
                result: [ "id", "title" ]
            },
            columns: [
                {
                    name: "id",
                    text: Text.get("schema.user_chart.attr.id"),
                    hide: true
                },{
                    name: "title",
                    text: Text.get("schema.user_chart.attr.title"),
                    call: function(row) { return Bloonix.call("monitoring/charts/editor/"+ row.id +"/update", row.title) }
                },{
                    name: "subtitle",
                    text: Text.get("schema.user_chart.attr.subtitle")
                },{
                    name: "yaxis_label",
                    text: Text.get("schema.user_chart.attr.yaxis_label")
                },{
                    name: "description",
                    text: Text.get("schema.user_chart.attr.description"),
                }
            ]
        }).create();
    };

    object.create();
};

Bloonix.createUserChart = function(o) {
    Bloonix.showChartsSubNavigation("user-charts");

    var object = Utils.extend({
        appendTo: $("#content")
    }, o);

    object.create = function() {
        this.getUserChart();
        this.createHeader();
        this.createForm();
        this.createSelectBoxes();
        this.createSubmitButton();
    };

    object.getUserChart = function() {
        if (this.id) {
            this.values = Bloonix.get("/user/charts/"+ this.id);
        } else {
            this.values = {};
        }
    };

    object.createHeader = function() {
        new Header({
            title: Text.get("schema.user_chart.text.create"),
            icons: [
                {
                    type: "go-back",
                    callback: function() { Bloonix.route.to("monitoring/charts/editor") }
                }
            ]
        }).create();
    };

    object.createForm = function() {
        var self = this;

        var submit = o.id
            ? "/user/charts/"+ o.id +"/update"
            : "/user/charts/create";

        this.form = new Form({
            url: { submit: submit },
            format: "default",
            appendTo: this.appendTo,
            createTable: true
        }).init();

        this.form.postpareDataCallback = function(data) {
            data.options = self.getChartMetrics();
        };

        this.form.createElement({
            element: "input",
            type: "text",
            name: "title",
            text: Text.get("schema.user_chart.attr.title"),
            desc: Text.get("schema.user_chart.desc.title"),
            placeholder: Text.get("schema.user_chart.attr.title"),
            maxlength: 50,
            value: this.values.title
        });

        this.form.createElement({
            element: "input",
            type: "text",
            name: "subtitle",
            text: Text.get("schema.user_chart.attr.subtitle"),
            desc: Text.get("schema.user_chart.desc.subtitle"),
            placeholder: Text.get("schema.user_chart.attr.subtitle"),
            maxlength: 50,
            value: this.values.subtitle
        });

        this.form.createElement({
            element: "input",
            type: "text",
            name: "yaxis_label",
            text: Text.get("schema.user_chart.attr.yaxis_label"),
            desc: Text.get("schema.user_chart.desc.yaxis_label"),
            placeholder: Text.get("schema.user_chart.attr.yaxis_label"),
            maxlength: 30,
            value: this.values.yaxis_label
        });

        this.form.createElement({
            element: "input",
            type: "text",
            name: "description",
            text: Text.get("schema.user_chart.attr.description"),
            desc: Text.get("schema.user_chart.desc.description"),
            placeholder: Text.get("schema.user_chart.attr.description"),
            maxlength: 100,
            value: this.values.description
        });
    };

    object.createSelectBoxes = function() {
        var self = this;

        this.selectBoxes = Utils.create("div")
            .addClass("chart-selection")
            .appendTo(this.form.form);

        var box = {};

        box.outer = Utils.create("div")
            .addClass("chart-selection-outer")
            .appendTo(self.selectBoxes);

        box.header = Utils.create("div")
            .addClass("chart-selection-header")
            .text(Text.get("schema.user_chart.text.chart_metrics"))
            .appendTo(box.outer);

        box.content = Utils.create("ul")
            .attr("data-name", "options")
            .addClass("chart-selection-content")
            .appendTo(box.outer);

        Bloonix.createHoverBoxIcons({
            container: box.header,
            addClass: "chart-selection-header-icons",
            icons: [
                {
                    type: "plus-sign",
                    title: Text.get("schema.user_chart.text.add_metric"),
                    callback: function() { self.addMetric(box) },
                }
            ]
        });

        $(".chart-selection-content").sortable({
            connectWith: ".chart-selection-content",
            handle: ".chart-selection-portlet",
            forcePlaceholderSize: true,
            tolerance: "pointer"
        });

        if (this.values.options) {
            $.each(this.values.options, function(i, opt) {
                self.addServiceToBox({
                    appendTo: box.content,
                    text: "["+ opt.statkey +"] "+ opt.hostname +" - "+ opt.service_name,
                    color: opt.color,
                    data: {
                        service_id: opt.service_id,
                        plugin_id: opt.plugin_id,
                        statkey: opt.statkey
                    }
                });
            });
        }
    };

    object.createSubmitButton = function() {
        var self = this;
        this.form.button({ appendTo: this.form.form });
    };

    object.addMetric = function(box) {
        this.selectedBox = box;
        this.createOverlay();
        this.listPlugins();
    };

    object.createOverlay = function() {
        this.overlayContent = Utils.create("div");

        this.pluginList = Utils.create("div")
            .appendTo(this.overlayContent);

        this.pluginStatsList = Utils.create("div")
            .appendTo(this.overlayContent)
            .hide();

        this.serviceList = Utils.create("div")
            .appendTo(this.overlayContent)
            .hide();

        this.overlay = new Overlay({
            title: Text.get("schema.user_chart.text.add_metric"),
            content: this.overlayContent,
            width: "1000px",
            buttons: [{
                content: Text.get("action.submit"),
                alias: "Submit",
                hide: true,
                close: false
            }]
        }).create();
    };

    object.listPlugins = function() {
        var self = this;

        this.table = new Table({
            url: "/plugins",
            postdata: {
                offset: 0,
                limit: 15
            },
            appendTo: this.pluginList,
            sortable: true,
            header: {
                title: Text.get("schema.plugin.text.list"),
                pager: true,
                search: true,
                appendTo: this.pluginList
            },
            searchable: {
                url: "/plugins/search",
                result: [ "plugin", "command", "category", "description" ],
                resultWidth: "900px"
            },
            onClick: function(row) { self.listPluginStats(row) },
            columns: [
                {
                    name: "id",
                    text: Text.get("schema.plugin.attr.id"),
                    hide: true
                },{
                    name: "plugin",
                    text: Text.get("schema.plugin.attr.plugin")
                },{
                    name: "category",
                    text: Text.get("schema.plugin.attr.categories")
                },{
                    name: "description",
                    text: Text.get("schema.plugin.attr.description")
                }
            ]
        }).create();
    };

    object.listPluginStats = function(plugin) {
        var self = this;
        this.pluginList.hide(300);
        this.pluginStatsList.html("");
        this.pluginStatsList.show();

        this.table = new Table({
            url: "/plugin-stats/"+ plugin.id,
            appendTo: this.pluginStatsList,
            header: {
                title: Text.get("schema.plugin_stats.text.list", plugin.plugin),
                pager: true,
                search: true,
                appendTo: this.pluginStatsList,
                icons: [{
                    type: "go-back",
                    callback: function() {
                        self.pluginStatsList.hide();
                        self.pluginStatsList.html("");
                        self.pluginList.show(300);
                    }
                }]
            },
            onClick: function(row) { self.listServices(row) },
            columns: [
                {
                    name: "alias",
                    text: Text.get("schema.plugin_stats.attr.alias"),
                    value: function(row) { return row.alias && row.alias.length ? row.alias : row.statkey }
                },{
                    name: "description",
                    text: Text.get("schema.plugin_stats.attr.description")
                }
            ]
        }).create();
    };

    object.listServices = function(plugin) {
        var self = this;
        this.pluginStatsList.hide("");
        this.serviceList.html("");
        this.serviceList.show();

        var header = new Header({
            title: Text.get("schema.service.text.list"),
            pager: true,
            search: true,
            appendTo: this.serviceList,
            icons: [{
                type: "go-back",
                callback: function() { 
                    self.overlay.getButton("Submit").hide();
                    self.serviceList.hide();
                    self.serviceList.html("");
                    self.pluginStatsList.show(300);
                }
            }]
        }).create();

        var leftBox = Utils.create("div")
            .addClass("chart-selection-service-table")
            .appendTo(this.serviceList);

        var rightBox = Utils.create("div")
            .attr("id", "int-chart-selection-services-selected")
            .addClass("chart-selection-services-selected")
            .appendTo(this.serviceList);

        var selectedList = Utils.create("ul")
            .appendTo(rightBox);

        Utils.create("div")
            .addClass("clear")
            .appendTo(this.serviceList);

        this.table = new Table({
            url: "/plugin-stats/"+ plugin.plugin_id +"/"+ plugin.statkey +"/services",
            appendTo: leftBox,
            headerObject: header,
            searchable: {
                url: "/plugin-stats/"+ plugin.plugin_id +"/"+ plugin.statkey +"/services",
                result: [ "id", "hostname", "service_name" ]
            },
            onClick: function(row) {
                $("#int-chart-selection-services-selected").removeClass("rwb");

                var li = Utils.create("li")
                    .data("service-id", row.id)
                    .data("statkey", plugin.statkey)
                    .text(row.hostname +" - "+ row.service_name)
                    .attr("title", Text.get("text.click_to_delete_seletion"))
                    .appendTo(selectedList)
                    .tooltip({ track: true });

                li.click(function() { li.remove() });
            },
            columns: [
                {
                    name: "id",
                    text: Text.get("schema.service.attr.id"),
                    hide: true
                },{
                    name: "hostname",
                    text: Text.get("schema.host.attr.hostname")
                },{
                    name: "service_name",
                    text: Text.get("schema.service.attr.service_name"),
                }
            ]
        }).create();

        this.overlay.getButton("Submit").show().click(function() {
            var i = 0;

            selectedList.find("li").each(function() {
                var id = $(this).data("service-id"),
                    key = $(this).data("statkey"),
                    text = $(this).text();

                self.addServiceToBox({
                    appendTo: self.selectedBox.content,
                    text: "["+ key +"] "+ text,
                    data: {
                        service_id: id,
                        plugin_id: plugin.plugin_id,
                        statkey: plugin.statkey
                    }
                });

                i++;
            });

            // If no service is selected and the user clicks
            // on the submit button, then the select field
            // is marked with a red border.
            if (i == 0) {
                $("#int-chart-selection-services-selected").addClass("rwb");
            } else {
                self.overlay.close();
            }
        });
    };

    object.addServiceToBox = function(o) {
        var item = Utils.create("li")
            .data("item", o.data)
            .addClass("chart-selection-item")
            .text(o.text)
            .appendTo(o.appendTo);

        Bloonix.createHoverBoxIcons({
            addClass: "chart-selection-content-icons",
            container: item,
            icons: [
                {
                    type: "move",
                    title: Text.get("info.move_with_mouse"),
                    addClass: "chart-selection-portlet"
                },{
                    type: "remove",
                    title: Text.get("action.remove"),
                    callback: function() {
                        item.remove();
                        $(".chart-selection-content").sortable("refresh");
                    }
                },{
                    type: "colorpicker",
                    color: o.color
                }
            ]
        });

        $(".chart-selection-content").sortable("refresh");
    };

    object.getChartMetrics = function() {
        var options = [];

        $(".chart-selection-item").each(function() {
            var item = $(this).data("item");
            item.color = $(this).find(".color-picker-icon").data("color");
            options.push(item);
        });

        return options;
    };

    object.create();
};
