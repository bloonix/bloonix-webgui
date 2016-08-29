Bloonix.viewScreen = function(o) {
    var object = Utils.extend({ opts: {} }, o);

    object.orgOpts = o;

    object.defaultScreenOpts = {
        show_hostname: 1,
        show_ipaddr: 1,
        show_company: 0,
        show_sla: 0,
        show_services: 1,
        show_service_summary: 0,
        sort_by_sla: "none"
    };

    object.getScreenOpts = function() {
        Bloonix.initUser(this.postdata);

        var self = this,
            stash = Bloonix.user.stash.screen || {};

        $.each(this.defaultScreenOpts, function(key, value) {
            if (stash[key] === undefined) {
                stash[key] = value;
            }
        });

        return stash;
    };

    object.create = function() {
        this.checkUser();
        this.hideElements();
        this.showContent();
    };

    object.checkUser = function() {
        var self = this;

        if (Bloonix.user == undefined) {
            var parts = window.document.URL.toString().split("?");
            if (parts[1] != undefined) {
                var pairs = parts[1].split(/[;&]/);
                var username, authkey;
                $.each(pairs, function(i, pair) {
                    var pv = pair.split("=");
                    if (pv[0] != undefined && pv[1] != undefined) {
                        var key = pv[0], value = pv[1];
                        self.opts[key] = value;
                    }
                });
                if (this.opts.username != undefined && this.opts.authkey != undefined) {
                    this.postdata = {
                        username: this.opts.username,
                        authkey: this.opts.authkey
                    };
                    Bloonix.initUser(this.postdata);
                }
            }
        }
    };

    object.hideElements = function() {
        $("#header-wrapper").fadeOut(200);
        $("#footer-outer").fadeOut(200);
        $("#content-outer").fadeOut(200);
    };

    object.showElements = function() {
        $("#header-wrapper").fadeIn(200);
        $("#footer-outer").fadeIn(200);
        $("#content-outer").fadeIn(200);
    };

    object.addScreenElements = function() {
        this.body = $("body")
            .css({ "padding-top": "0px", width: "100%" })
            .addClass("screen");
    };

    object.removeScreenElements = function() {
        $(".screen-box-content").fadeOut(200).remove();
        $(".screen-counter-content").fadeOut(200).remove();
        $(".screen-container").fadeOut(200).remove();
        $("body").removeClass("screen");
    };

    object.goBack = function(site, args) {
        if (Bloonix.forceScreen == "1") {
            location.href = "/login/";
        }

        this.removeScreenElements();
        this.showElements();
        Bloonix.route.to(site, args);
    };

    object.showContent = function() {
        if (this.charts) {
            this.viewCharts();
        } else if (this.dashboard) {
            this.viewStatusDashboard();
        }
    };

    object.viewCharts = function() {
        var charts = Bloonix.get("/screen/charts/view/"+ this.opts.id, this.postdata);
        Bloonix.listCharts({
            screenCharts: charts,
            screenOpts: this.opts,
            container: $("body")
        });
    };

    object.viewStatusDashboard = function() {
        var self = this;
        Bloonix.setTitle("nav.sub.screen");

        this.addScreenElements();

        this.screenContainer = Utils.create("div")
            .addClass("screen-container")
            .appendTo(this.body);

        this.screenCounterContent = Utils.create("div")
            .addClass("screen-counter-content")
            .appendTo(this.screenContainer)
            .hide();

        this.screenBoxContent = Utils.create("div")
            .addClass("screen-box-content")
            .appendTo(this.screenContainer);

        this.unknownCounter = Utils.create("span")
            .addClass("screen-unknown-counter")
            .appendTo(this.screenCounterContent)
            .click(function(){ self.goBack("monitoring/hosts", { query: "status:UNKNOWN" }) });

        this.criticalCounter = Utils.create("span")
            .addClass("screen-critical-counter")
            .appendTo(this.screenCounterContent)
            .click(function(){ self.goBack("monitoring/hosts", { query: "status:CRITICAL" }) });

        this.warningCounter = Utils.create("span")
            .addClass("screen-warning-counter")
            .appendTo(this.screenCounterContent)
            .click(function(){ self.goBack("monitoring/hosts", { query: "status:WARNING" }) });

        this.infoCounter = Utils.create("span")
            .addClass("screen-info-counter")
            .appendTo(this.screenCounterContent)
            .click(function(){ self.goBack("monitoring/hosts", { query: "status:INFO" }) });

        this.okCounter = Utils.create("span")
            .addClass("screen-ok-counter")
            .appendTo(this.screenCounterContent)
            .click(function(){ self.goBack("monitoring/hosts", { query: "status:OK" }) });

        this.timestamp = Utils.create("span")
            .addClass("screen-timestamp")
            .appendTo(this.screenCounterContent);

        if (Bloonix.forceScreen !== 1) {
            this.configButton = Utils.create("div")
                .addClass("screen-config-button")
                .appendTo(this.screenCounterContent)
                .click(function(){ self.configureScreen() });

            Utils.create("div")
                .addClass("gicons-white gicons cogwheels")
                .appendTo(this.configButton);
        }

        Utils.create("div")
            .addClass("clear")
            .appendTo(this.screenCounterContent);

        this.refreshStatusDashboard();

        var interval = setInterval(function() {
            self.refreshStatusDashboard();
        }, 30000);

        Bloonix.intervalObjects.push(interval);
    };

    object.refreshStatusDashboard = function() {
        var self = this,
            stash = this.getScreenOpts();

        this.timestamp
            .html(DateFormat(new Date, DateFormat.masks.bloonix))
            .click(function(){ self.goBack("monitoring/hosts") });

        Ajax.post({
            url: "/screen/stats/",
            data: this.postdata,
            success: function(data) {
                $("body").find(".screen-box-remove").fadeOut(300).remove();

                self.unknownCounter.text(data.data.overall_service_status.UNKNOWN +" "+ Text.get("text.services"));
                self.criticalCounter.text(data.data.overall_service_status.CRITICAL +" "+ Text.get("text.services"));
                self.warningCounter.text(data.data.overall_service_status.WARNING +" "+ Text.get("text.services"));
                self.infoCounter.text(data.data.overall_service_status.INFO +" "+ Text.get("text.services"));
                self.okCounter.text(data.data.overall_service_status.OK +" "+ Text.get("text.services"));

                if (self.screenCounterContent.is(':hidden')) {
                    self.screenCounterContent.fadeIn(400);
                }

                $.each(data.data.service_status_by_host, function(x, host) {
                    if (host.services.length) {
                        var outerBox = Utils.create("a")
                            .addClass("screen-box-remove screen-box-outer")
                            .click(function() { self.goBack("monitoring/hosts/"+ host.id) });

                        var box = Utils.create("div")
                            .addClass("screen-box")
                            .appendTo(outerBox);

                        var messagesByStatus = { OK:[], INFO:[], WARNING:[], CRITICAL:[], UNKNOWN:[] },
                            messages = [],
                            status = [],
                            statusCount = { OK:0, INFO:0, WARNING:0, CRITICAL:0, UNKNOWN:0 };

                        $.each(host.services, function(y, service) {
                            statusCount[service.status] = statusCount[service.status] + 1;

                            if (stash.show_acknowledged == "0" && service.acknowledged == "1") {
                                return true;
                            }

                            if (host.services.length > 1) {
                                messagesByStatus[service.status].push(service.service_name);
                            } else {
                                messagesByStatus[service.status].push(service.service_name +" - "+ service.message);
                            }
                        });

                        $.each([ "UNKNOWN", "CRITICAL", "WARNING" ], function(i, s) {
                            if (messagesByStatus[s].length > 0) {
                                messages.push(messagesByStatus[s].join(", "));
                            }
                        });

                        if (messages.length == 0) {
                            $.each([ "INFO", "OK" ], function(i, s) {
                                if (messagesByStatus[s].length > 0) {
                                    messages.push(messagesByStatus[s].join(", "));
                                }
                            });
                        }

                        messages = messages.join(", ");
                        var backgroundColorSet = false;

                        $.each([ "UNKNOWN", "CRITICAL", "WARNING", "INFO", "OK" ], function(i, s) {
                            if (statusCount[s] > 0) {
                                status.push(statusCount[s] +" "+ s);
                            }
                            if (backgroundColorSet === false && messagesByStatus[s].length > 0 && s != "OK") {
                                outerBox.addClass("screen-box-"+ s).appendTo(self.screenBoxContent);
                                backgroundColorSet = true;
                            }
                        });

                        if (stash.show_hostname == "1") {
                            var h1 = Utils.create("h1")
                                .text(host.hostname)
                                .appendTo(box);
                            if (stash.show_company == "0" && stash.show_sla == "1") {
                                h1.append(" (SLA " + host.sla +")");
                            }
                        }

                        if (stash.show_ipaddr == "1") {
                            Utils.create("h2")
                                .text(host.ipaddr)
                                .appendTo(box);
                        }

                        if (stash.show_company == "1") {
                            var p = Utils.create("h2")
                                .text(host.company)
                                .appendTo(box);
                            if (stash.show_sla == "1") {
                                p.append(" (SLA " + host.sla +")");
                            }
                        }

                        if (stash.show_services == "1") {
                            if (stash.show_service_summary == "1") {
                                Utils.create("h2")
                                    .text(status.join(", "))
                                    .appendTo(box);
                            } else {
                                Utils.create("p")
                                    .text(messages)
                                    .appendTo(box);
                            }
                        }
                    }
                });

                Utils.create("div")
                    .addClass("clear")
                    .appendTo(self.screenCounterContent);
            }
        });
    };

    object.configureScreen = function() {
        var self = this,
            stash = this.getScreenOpts(),
            formOuter = Utils.create("div");

        var form = new Form({
            format: "medium",
            url: { submit: "/user/config/save" },
            processDataCallback: function(data) {
                data = { key: "screen", data: data };
                return data;
            },
            appendTo: formOuter,
            onSuccess: function() {
                overlay.close();
                location.reload();
            }
        }).init();

        var overlay = new Overlay({
            title: Text.get("site.screen.configure.title"),
            content: formOuter,
            buttons: [{
                content: Text.get("action.save"),
                callback: function() { form.submit() }
            }]
        });

        var table = new Table({
            type: "form",
            appendTo: form.getContainer()
        }).init();

        form.table = table.getTable();

        /*
        form.createElement({
            element: "slider",
            name: "scale",
            options: [ 1, 2, 3 ],
            checked: stash.scale,
            text: Text.get("site.screen.attr.scale"),
            placeholder: ""
        });
        */

        form.createElement({
            element: "radio-yes-no",
            type: "text",
            name: "show_hostname",
            checked: stash.show_hostname,
            text: Text.get("site.screen.attr.show_hostname")
        });

        form.createElement({
            element: "radio-yes-no",
            type: "text",
            name: "show_ipaddr",
            checked: stash.show_ipaddr,
            text: Text.get("site.screen.attr.show_ipaddr")
        });

        form.createElement({
            element: "radio-yes-no",
            name: "show_company",
            checked: stash.show_company,
            text: Text.get("site.screen.attr.show_company")
        });

        form.createElement({
            element: "radio-yes-no",
            name: "show_sla",
            checked: stash.show_sla,
            text: Text.get("site.screen.attr.show_sla")
        });

        form.createElement({
            element: "radio-yes-no",
            name: "show_services",
            checked: stash.show_services,
            text: Text.get("site.screen.attr.show_services")
        });

        form.createElement({
            element: "radio-yes-no",
            name: "show_service_summary",
            checked: stash.show_service_summary,
            text: Text.get("site.screen.attr.show_service_summary")
        });

        form.createElement({
            element: "radio",
            name: "sort_by_sla",
            options: [
                {
                    hicon: "ban-circle",
                    value: "none"
                },{
                    hicon: "chevron-down",
                    value: "asc"
                },{
                    hicon: "chevron-up",
                    value: "desc"
                }
            ],
            checked: stash.sort_by_sla,
            text: Text.get("site.screen.attr.sort_by_sla")
        });

        form.createElement({
            element: "radio-yes-no",
            name: "show_acknowledged",
            checked: stash.show_acknowledged || "1",
            text: Text.get("site.screen.attr.show_acknowledged"),
        });

        /*
        form.createElement({
            element: "input",
            type: "text",
            name: "bg_color",
            value: "",
            text: Text.get("site.screen.attr.bg_color"),
            placeholder: ""
        });

        form.createElement({
            element: "input",
            type: "text",
            name: "bg_color_ok",
            value: "",
            text: Text.get("site.screen.attr.bg_color_ok"),
            placeholder: ""
        });

        form.createElement({
            element: "input",
            type: "text",
            name: "text_color_ok",
            value: "",
            text: Text.get("site.screen.attr.text_color_ok"),
            placeholder: ""
        });

        form.createElement({
            element: "input",
            type: "text",
            name: "bg_color_info",
            value: "",
            text: Text.get("site.screen.attr.bg_color_info"),
            placeholder: ""
        });

        form.createElement({
            element: "input",
            type: "text",
            name: "text_color_info",
            value: "",
            text: Text.get("site.screen.attr.text_color_info"),
            placeholder: ""
        });

        form.createElement({
            element: "input",
            type: "text",
            name: "bg_color_warning",
            value: "",
            text: Text.get("site.screen.attr.bg_color_warning"),
            placeholder: ""
        });

        form.createElement({
            element: "input",
            type: "text",
            name: "text_color_warning",
            value: "",
            text: Text.get("site.screen.attr.text_color_warning"),
            placeholder: ""
        });

        form.createElement({
            element: "input",
            type: "text",
            name: "bg_color_critical",
            value: "",
            text: Text.get("site.screen.attr.bg_color_critical"),
            placeholder: ""
        });

        form.createElement({
            element: "input",
            type: "text",
            name: "text_color_critical",
            value: "",
            text: Text.get("site.screen.attr.text_color_critical"),
            placeholder: ""
        });

        form.createElement({
            element: "input",
            type: "text",
            name: "bg_color_unknown",
            value: "",
            text: Text.get("site.screen.attr.bg_color_unknown"),
            placeholder: ""
        });

        form.createElement({
            element: "input",
            type: "text",
            name: "text_color_unknown",
            value: "",
            text: Text.get("site.screen.attr.text_color_unknown"),
            placeholder: ""
        });

        form.createElement({
            element: "input",
            type: "text",
            name: "bg_color_time",
            value: "",
            text: Text.get("site.screen.attr.bg_color_time"),
            placeholder: ""
        });

        form.createElement({
            element: "input",
            type: "text",
            name: "text_color_time",
            value: "",
            text: Text.get("site.screen.attr.text_color_time"),
            placeholder: ""
        });
        */

        overlay.create();
    };

    object.create();
};
