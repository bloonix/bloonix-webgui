Bloonix.listServices = function(o) {
    var object = Utils.extend({
        postdata: {
            offset: 0,
            limit: Bloonix.requestSize
        },
        appendTo: "#content",
    }, o);

    if (object.query) {
        object.postdata.query = object.query;
    }

    object.action = function(action) {
        var self = this,
            selectedIds = this.table.getSelectedIds();

        if (selectedIds.length == 0) {
            Bloonix.createNoteBox({ text: Text.get("schema.service.text.multiple_help") });
            return;
        }

        var overlay = new Overlay();
        overlay.content = Utils.create("div");

        if (action == 0) {
            overlay.title = Text.get("schema.service.text.multiple_downtimes");
            overlay.visible = true;
            var form = Bloonix.createScheduledDowntime({
                url: "/services/create-downtime/",
                data: { service_id: selectedIds },
                callback: function() { self.table.getData(); overlay.close() }
            });
            form.container.appendTo(overlay.content);
        } else if (action == 1) {
            overlay.title = Text.get("schema.service.text.multiple_notification");

            Utils.create("div")
                .addClass("btn btn-white btn-medium")
                .html(Text.get("schema.service.action.disable_notifications_multiple"))
                .appendTo(overlay.content)
                .click(function() {
                    Bloonix.hostServiceAction(
                        "/services/disable-notification/",
                        { service_id: selectedIds }
                    );
                    self.table.getData();
                    overlay.close();
                });

            Utils.create("div")
                .addClass("btn btn-white btn-medium")
                .html(Text.get("schema.service.action.enable_notifications_multiple"))
                .appendTo(overlay.content)
                .click(function() {
                    Bloonix.hostServiceAction(
                        "/services/enable-notification/", 
                        { service_id: selectedIds }
                    );
                    self.table.getData();
                    overlay.close();
                });
        } else if (action == 2) {
            overlay.title = Text.get("schema.service.text.multiple_activate");

            Utils.create("div")
                .addClass("btn btn-white btn-medium")
                .html(Text.get("schema.service.action.deactivate_multiple"))
                .appendTo(overlay.content)
                .click(function() {
                    Bloonix.hostServiceAction(
                        "/services/deactivate/",
                        { service_id: selectedIds }
                    );
                    self.table.getData();
                    overlay.close();
                });

            Utils.create("div")
                .addClass("btn btn-white btn-medium")
                .html(Text.get("schema.service.action.activate_multiple"))
                .appendTo(overlay.content)
                .click(function() {
                    Bloonix.hostServiceAction(
                        "/services/activate/", 
                        { service_id: selectedIds }
                    );
                    self.table.getData();
                    overlay.close();
                });
        } else if (action == 3) {
            overlay.title = Text.get("schema.service.text.multiple_acknowledge");

            Utils.create("div")
                .addClass("btn btn-white btn-medium")
                .html(Text.get("schema.service.action.acknowledge_multiple"))
                .appendTo(overlay.content)
                .click(function() {
                    Bloonix.hostServiceAction(
                        "/services/acknowledge",
                        { service_id: selectedIds }
                    );
                    self.table.getData();
                    overlay.close();
                });

            Utils.create("div")
                .addClass("btn btn-white btn-medium")
                .html(Text.get("schema.service.action.clear_acknowledgement_multiple"))
                .appendTo(overlay.content)
                .click(function() {
                    Bloonix.hostServiceAction(
                        "/services/clear-acknowledgement",
                        { service_id: selectedIds }
                    );
                    self.table.getData();
                    overlay.close();
                });
        } else if (action == 4) {
            overlay.title = Text.get("schema.service.text.multiple_volatile");

            Utils.create("div")
                .addClass("btn btn-white btn-medium")
                .html(Text.get("schema.service.action.clear_volatile_multiple"))
                .appendTo(overlay.content)
                .click(function() {
                    Bloonix.hostServiceAction(
                        "/services/clear-volatile-status/",
                        { service_id: selectedIds }
                    );
                    self.table.getData();
                    overlay.close();
                });
        } else if (action == 5) {
            overlay.title = Text.get("schema.service.text.multiple_force_next_check");

            Utils.create("div")
                .addClass("btn btn-white btn-medium")
                .html(Text.get("schema.service.action.multiple_force_next_check"))
                .appendTo(overlay.content)
                .click(function() {
                    Bloonix.hostServiceAction(
                        "/services/force-next-check/",
                        { service_id: selectedIds }
                    );
                    self.table.getData();
                    overlay.close();
                });
        }

        overlay.create();
    };

    object.create = function() {
        this.createFooterIcons();

        if (this.forHostView === true) {
            this.createHostServiceTable();
        } else {
            this.createServiceTable();
        }
    };

    object.createFooterIcons = function() {
        var self = this;

        Utils.create("span")
            .attr("title", Text.get("schema.service.text.multiple_downtimes"))
            .tooltip()
            .addClass("footer-button")
            .html(Utils.create("div").addClass("hicons-white hicons time"))
            .appendTo("#footer-left")
            .click(function() { self.action(0) });

        Utils.create("span")
            .attr("title", Text.get("schema.service.text.multiple_notification"))
            .tooltip()
            .addClass("footer-button")
            .html(Utils.create("div").addClass("hicons-white hicons envelope"))
            .appendTo("#footer-left")
            .click(function() { self.action(1) });

        Utils.create("span")
            .attr("title", Text.get("schema.service.text.multiple_activate"))
            .tooltip()
            .addClass("footer-button")
            .html(Utils.create("div").addClass("hicons-white hicons remove-sign"))
            .appendTo("#footer-left")
            .click(function() { self.action(2) });

        Utils.create("span")
            .attr("title", Text.get("schema.service.text.multiple_acknowledge"))
            .tooltip()
            .addClass("footer-button")
            .html(Utils.create("div").addClass("hicons-white hicons ok-sign"))
            .appendTo("#footer-left")
            .click(function() { self.action(3) });

        Utils.create("span")
            .attr("title", Text.get("schema.service.text.multiple_volatile"))
            .tooltip()
            .addClass("footer-button")
            .html(Utils.create("div").addClass("hicons-white hicons exclamation-sign"))
            .appendTo("#footer-left")
            .click(function() { self.action(4) });

        Utils.create("span")
            .attr("title", Text.get("schema.service.text.multiple_force_next_check"))
            .tooltip()
            .addClass("footer-button")
            .html(Utils.create("div").addClass("hicons-white hicons refresh"))
            .appendTo("#footer-left")
            .click(function() { self.action(5) });

        this.counterButton = Utils.create("span")
            .attr("title", Text.get("text.selected_objects"))
            .tooltip()
            .addClass("footer-button")
            .text("0")
            .hide()
            .appendTo("#footer-left");
    };

    object.createServiceTable = function() {
        Bloonix.setTitle("schema.service.text.list");

        this.table = new Table({
            url: "/services/list/",
            postdata: this.postdata,
            appendTo: this.appendTo,
            header: {
                title: Text.get("schema.service.text.list"),
                pager: true,
                search: true
            },
            selectable: {
                result: [ "id", "hostname", "service_name" ],
                counter: { update: this.counterButton }
            },
            searchable: {
                url: "/services/search/",
                result: [ "id", "hostname", "service_name", "status", "message" ],
                value: this.postdata.query
            },
            reloadable: true,
            sortable: true,
            columnSwitcher: {
                table: "service",
                callback: Bloonix.saveUserTableConfig,
                config: Bloonix.getUserTableConfig("service")
            },
            rowHoverIcons: [{
                title: Text.get("schema.service.text.clone"),
                icon: "share",
                onClick: this.cloneService
            }],
            columns: [
                {
                    name: "id",
                    text: Text.get("schema.service.attr.id"),
                    hide: true
                },{
                    name: "hostname",
                    text: Text.get("schema.host.attr.hostname"),
                    call: function(row) { return Bloonix.call("monitoring/hosts/"+ row.host_id, row.hostname) },
                    switchable: false
                },{
                    name: "service_name",
                    text: Text.get("schema.service.attr.service_name"),
                    switchable: false
                },{
                    icons: this.getStatusIcons()
                },{
                    name: "command",
                    text: Text.get("schema.service.attr.command"),
                    hide: true
                },{
                    name: "plugin",
                    text: Text.get("schema.service.attr.plugin")
                },{
                    name: "agent_id",
                    text: Text.get("schema.service.attr.agent_id"),
                    hide: true
                },{
                    name: "description",
                    text: Text.get("schema.service.attr.description"),
                    hide: true
                },{
                    name: "comment",
                    text: Text.get("schema.service.attr.comment"),
                    hide: true
                },{
                    name: "active",
                    text: Text.get("schema.service.attr.active"),
                    hide: true,
                    bool: "yn"
                },{
                    name: "acknowledged",
                    text: Text.get("schema.service.attr.acknowledged"),
                    hide: true,
                    bool: "yn"
                },{
                    name: "notification",
                    text: Text.get("schema.service.attr.notification"),
                    hide: true,
                    bool: "yn"
                },{
                    name: "flapping",
                    text: Text.get("schema.service.attr.flapping"),
                    hide: true,
                    bool: "yn"
                },{
                    name: "scheduled",
                    text: Text.get("schema.service.attr.scheduled"),
                    hide: true,
                    bool: "yn"
                },{
                    name: "status",
                    text: Text.get("schema.service.attr.status"),
                    wrapValueClass: true,
                    switchable: false
                },{
                    name: "last_check",
                    text: Text.get("schema.service.attr.last_check"),
                    convertFromUnixTime: true
                },{
                    name: "attempt_counter",
                    text: Text.get("schema.service.text.attempt"),
                    call: function(row) { return [ row.attempt_counter, row.attempt_max ].join("/") },
                    switchable: false
                },{
                    name: "message",
                    text: Text.get("schema.service.attr.message")
                }
            ]
        }).create();
    };

    object.createHostServiceTable = function() {
        var self = this,
            host = this.host,
            services = this.services,
            appendTo = this.appendTo,
            icons = this.getStatusIcons();

        icons.push({
            check: function(row) {
                return false; // DISABLED
                if (row.location_options != "0") {
                    if (row.location_options.check_type == "rotate") {
                        return true;
                    }
                }

                return false;
            },
            icon: "cicons report2",
            title: Text.get("schema.service.text.view_location_report"),
            onClick: function(row) { Bloonix.route.to("monitoring/hosts/"+ row.host_id +"/services/"+ row.id +"/report") }
        });

        icons.push({
            check: function(row) { return row.plugin_id == "58" ? true : false },
            icon: "cicons atom",
            title: Text.get("schema.service.text.view_wtrm_report"),
            onClick: function(row) { Bloonix.route.to("monitoring/hosts/"+ row.host_id +"/services/"+ row.id +"/wtrm-report") }
        });

        icons.push({
            check: function(row) { return row.host_template_name ? true : false },
            icon: "cicons template2",
            title: function(row) {
                return Text.get("schema.service.info.inherits_from_host_template", Utils.escape(row.host_template_name));
            }
        });

        this.table = new Table({
            url: "/hosts/"+ host.id +"/services",
            header: {
                appendTo: appendTo,
                title: Text.get("schema.service.text.title"),
                icons: [
                    {
                        type: "help",
                        callback: function() { Utils.open("/#help/add-new-service") },
                        title: Text.get("site.help.doc.add-new-service")
                    },{
                        type: "create",
                        callback: function() { Bloonix.route.to("monitoring/hosts/"+ host.id +"/services/create") },
                        title: Text.get("schema.service.text.create")
                    }
                ]
            },
            selectable: {
                result: [ "id", "service_name" ],
                counter: { update: this.counterButton }
            },
            searchable: false,
            appendTo: appendTo,
            values: services,
            reloadable: {
                callback: function() {
                    Bloonix.route.to("monitoring/hosts/"+ host.id);
                }
            },
            deletable: {
                title: Text.get("schema.service.text.delete"),
                url: "/hosts/:host_id/services/:id/delete",
                result: [ "id", "service_name", "plugin" ],
                check: function(row) { return row.host_template_name ? false : true }
            },
            columnSwitcher: {
                table: "service",
                callback: Bloonix.saveUserTableConfig,
                config: Bloonix.user.stash.table_config.service
            },
            rowHoverIcons: [{
                title: Text.get("schema.service.text.clone"),
                icon: "share",
                onClick: self.cloneService
            }],
            columns: [
                {
                    name: "id",
                    text: Text.get("schema.service.attr.id"),
                    hide: true
                },{
                    name: "service_name",
                    text: Text.get("schema.service.attr.service_name"),
                    call: function(row) {
                        if (row.host_template_name) {
                            return row.service_name;
                        }
                        return Bloonix.call("monitoring/hosts/"+ row.host_id +"/services/"+ row.id +"/edit", row.service_name);
                    }
                },{
                    icons: icons
                },{
                    name: "plugin",
                    text: Text.get("schema.service.attr.plugin"),
                    hide: true
                },{
                    name: "agent_id",
                    text: Text.get("schema.service.attr.agent_id"),
                    hide: true
                },{
                    name: "description",
                    text: Text.get("schema.service.attr.description"),
                    hide: true
                },{
                    name: "comment",
                    text: Text.get("schema.service.attr.comment"),
                    hide: true
                },{
                    name: "status",
                    text: Text.get("schema.service.attr.status"),
                    wrapValueClass: true
                },{
                    name: "attempt_max",
                    text: Text.get("schema.service.text.attempt"),
                    value: function(row) { return row.attempt_counter +"/"+ row.attempt_max },
                    centered: true
                },{
                    name: "last_check",
                    text: Text.get("schema.service.attr.last_check"),
                    convertFromUnixTime: true
                },{
                    name: "host_template_name",
                    text: Text.get("schema.service.text.host_template"),
                    hide: true,
                    call: function(row) {
                        if (row.host_template_name) {
                            return Bloonix.call("monitoring/templates/"+ row.host_template_id +"/services", row.host_template_name);
                        }
                        return "─";
                    }
                },{
                    name: "message",
                    text: Text.get("schema.service.attr.message")
                }
            ]
        }).create();
    };

    object.cloneService = function(service) {
        var content = Utils.create("div");

        var overlay = new Overlay({
            title: Text.get("schema.service.text.clone_service", service.service_name, true),
            content: content
        });

        var buttons = Utils.create("div")
            .appendTo(content);

        var hostList = Utils.create("div")
            .appendTo(content)
            .hide();

        Utils.create("div")
            .addClass("btn btn-white btn-medium")
            .html(Text.get("schema.service.text.clone_to_the_same_host"))
            .appendTo(buttons)
            .click(function() {
                overlay.close();
                Bloonix.route.to("monitoring/hosts/"+ service.host_id +"/services/"+ service.id +"/clone-to/"+ service.host_id);
            });

        Utils.create("div")
            .addClass("btn btn-white btn-medium")
            .html(Text.get("schema.service.text.clone_select_host"))
            .appendTo(buttons)
            .click(function() {
                buttons.hide();
                hostList.html("").show();
                overlay.setWidth("1000px");
                new Table({
                    url: "/hosts",
                    postdata: { offset: 0, limit: 20 },
                    appendTo: hostList,
                    sortable: true,
                    header: {
                        title: Text.get("schema.service.text.clone_select_host"),
                        pager: true,
                        search: true,
                        appendTo: hostList
                    },
                    searchable: {
                        url: "/hosts/search/",
                        result: [ "id", "hostname", "ipaddr" ]
                    },
                    onClick: function(row) {
                        overlay.close();
                        Bloonix.route.to("monitoring/hosts/"+ service.host_id +"/services/"+ service.id +"/clone-to/"+ row.id);
                    },
                    columns: [
                        {
                            name: "id",
                            text: Text.get("schema.host.attr.id")
                        },{
                            name: "hostname",
                            text: Text.get("schema.host.attr.hostname")
                        },{
                            name: "ipaddr",
                            text:  Text.get("schema.host.attr.ipaddr")
                        }
                    ]
                }).create();
            });

        overlay.create();
    };

    object.getStatusIcons = function() {
        var self = this;

        return [
            {
                check: function(row) { return row.notification == "0" ? true : false },
                icon: "cicons mute",
                title: Text.get("schema.service.info.notification")
            },{
                check: function(row) { return row.active == "0" ? true : false },
                icon: "cicons disabled",
                title: Text.get("schema.service.info.active")
            },{
                check: function(row) { return row.acknowledged == "1" ? true : false },
                icon: "cicons noalarm",
                title: Text.get("schema.service.info.acknowledged")
            },{
                check: function(row) { return row.flapping == "1" ? true : false },
                icon: "cicons attention",
                title: Text.get("schema.service.info.flapping")
            },{
                check: function(row) { return row.volatile_status == "1" ? true : false },
                icon: "cicons lightning",
                title: Text.get("schema.service.info.is_volatile")
            },{
                check: function(row) { return row.host_alive_check == "1" ? true : false },
                icon: "cicons host",
                title: Text.get("schema.service.info.host_alive_check")
            },{
                check: function(row) {
                    var delta = parseInt(row.nok_time_delta);
                    if (row.status == "OK" && delta > 0 && delta < 3600) {
                        return true;
                    }
                    return false;
                },
                icon: "cicons lightning2",
                title: Text.get("schema.service.info.status_nok_since")
            },{
                check: function(row) {
                    if (row.plugin_id == "58") {
                        return false;
                    }
                    return Bloonix.checkIfObject(row.result);
                },
                icon: "cicons robot",
                title: Text.get("schema.service.info.has_result"),
                onClick: function(row) { Bloonix.showServiceResultData(row.plugin, row.result) }
            },{
                check: function(row) { return Bloonix.checkIfObject(row.debug) },
                icon: "cicons light-on",
                title: Text.get("schema.service.info.has_result"),
                onClick: function(row) { Bloonix.showServiceDebugData(row.debug) }
            }
        ]
    };

    object.create();
    return object;
};

Bloonix.formatNiceJsonOutput = function(json) {
    json = Utils.escapeAndSyntaxHightlightJSON(json);

    var content = Utils.create("pre")
        .addClass("service-result")
        .html(json);

    return content;
};

Bloonix.searchServices = function(query) {
    Bloonix.route.to("monitoring/services", { query: query });
};

Bloonix.getServicesByHostId = function(hostId) {
    return Bloonix.get("/hosts/"+ hostId + "/services");
};

Bloonix.getService = function(serviceId) {
    return Bloonix.get("/services/"+ serviceId);
};

Bloonix.getServicesForSelection = function(hostId) {
    var services = Bloonix.getServicesByHostId(hostId);
    var selection = [ ];

    $.each(services, function(i, service) {
        selection.push({
            name: service.service_name,
            value: service.id
        });
    });

    return selection;
};

Bloonix.showServiceResultData = function(plugin, data) {
    var content = Utils.create("div");

    if (typeof data[0] === "object" && typeof data[0].result === "object") {
        // fix check-by-satellite bug in bloonix-plugins-basic 0.37
        data = data[0].result;
    }

    var table = new Table({ appendTo: content }).init();
    table.addHeadColumn(Text.get("schema.host.attr.hostname"));
    table.addHeadColumn(Text.get("schema.service.attr.status"));
    table.addHeadColumn(Text.get("schema.service.attr.message"));

    $.each(data, function(i, row) {
        table.createRow([
            row.hostname,
            Utils.create("span").addClass("status-base status-"+ row.status).text(row.status),
            Utils.escape(row.message)
        ]);
    });

    new Overlay({
        title: Text.get("schema.service.attr.result"),
        content: content
    }).create();
};

Bloonix.showServiceDebugData = function(data) {
    var content = Utils.create("div");

    if (Array.isArray(data) === true) {
        $.each(data, function(x, d) {
            content.append(
                Bloonix.prepareServiceDebugData(d)
            );
        });
    } else {
        content.append(
            Bloonix.prepareServiceDebugData(data)
        );
    }

    var title = Text.get("schema.service.attr.result");

    new Overlay({
        title: title,
        content: content
    }).create();
};

Bloonix.prepareServiceDebugData = function(data) {
    var content = Utils.create("div");

    if (data.satellite) {
        Utils.create("p")
            .addClass("service-result-small-title")
            .html(Text.get("text.satellite_hostname", Utils.escape(data.satellite), true))
            .appendTo(content);
    }

    if (data.ipaddr) {
        Utils.create("p")
            .addClass("service-result-small-title")
            .html(Text.get("text.target_ip", Utils.escape(data.ipaddr), true))
            .appendTo(content);
    }

    var order = [ "mtr", "http-header", "html-content", "dump" ];

    $.each(data, function(key) {
        if (/^(mtr|http-header|html-content|dump)$/.test(key) === false) {
            order.push(key);
        }
    });

    $.each(order, function(i, key) {
        var value = data[key];

        if (key === "ipaddr" || key === "satellite" || value === undefined || value.length === 0) {
            return true;
        }

        var box = Utils.create("div")
            .css({ padding: "0 20px 30px 0", float: "left" })
            .appendTo(content);

        var title = Utils.create("h4")
            .css({ padding: "0 0 10px 0" })
            .appendTo(box);

        if (key === "mtr") {
            box.width("470px");
            title.text("MTR-Result");
            Bloonix.viewMtrResult({
                appendTo: box,
                data: value.result,
                showChart: false
            });
        } else if (key === "http-header") {
            box.width("470px");
            title.text("HTTP-Header");
            var table = new Table({
                appendTo: box,
                type: "simple",
                addClass: "vtable small"
            }).init();
            $.each(value, function(headerKey, headerValue) {
                table.createRow([ headerKey, headerValue ]);
            });
        } else if (key === "html-content") {
            box.width("970px");
            title.text("HTML-Content");
            Utils.create("pre")
                .css({ color: "green", "font-size": "11px" })
                .text(value)
                .appendTo(box);
        } else {
            box.width("970px");
            title.text(key === "dump" ? "JSON-Dump" : key);
            Utils.create("pre")
                .html( Utils.escapeAndSyntaxHightlightJSON(value) )
                .appendTo(box);
        }

        if (key !== "mtr") {
            Utils.clear(content);
        }
    });

    return content;
};
