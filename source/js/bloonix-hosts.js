Bloonix.listHosts = function(o) {
    var object = Utils.extend({
        postdata: {
            offset: 0,
            limit: Bloonix.requestSize
        },
        appendTo: "#content",
        hideItems: {}
    }, o);

    if (object.query) {
        object.postdata.query = object.query;
    }

    object.action = function(action) {
        var self = this,
            selectedIds = this.table.getSelectedIds();

        if (selectedIds.length == 0) {
            Bloonix.createNoteBox({ text: Text.get("schema.host.text.multiple_selection_help") });
            return;
        }

        var overlay = this.overlay = new Overlay();
        overlay.content = Utils.create("div"); //.css({ "text-align": "center" });

        if (action === 0) {
            overlay.title = Text.get("schema.host.text.multiple_downtimes");
            overlay.visible = true;
            var form = Bloonix.createScheduledDowntime({
                url: "/hosts/create-downtime/",
                data: { host_id: selectedIds },
                callback: function(result) { self.table.getData(); overlay.close() }
            });
            form.container.appendTo(overlay.content);
        } else if (action === 1) {
            overlay.title = Text.get("schema.host.text.multiple_notification");

            Utils.create("div")
                .addClass("btn btn-white btn-medium")
                .html(Text.get("schema.host.action.disable_notifications_multiple"))
                .appendTo(overlay.content)
                .click(function() {
                    Bloonix.hostServiceAction(
                        "/hosts/disable-notification/",
                        { host_id: selectedIds }
                    );
                    self.table.getData();
                    overlay.close();
                });

            Utils.create("div")
                .addClass("btn btn-white btn-medium")
                .html(Text.get("schema.host.action.enable_notifications_multiple"))
                .appendTo(overlay.content)
                .click(function() {
                    Bloonix.hostServiceAction(
                        "/hosts/enable-notification/",
                        { host_id: selectedIds }
                    );
                    self.table.getData();
                    overlay.close();
                });
        } else if (action === 2) {
            overlay.title = Text.get("schema.host.text.multiple_activate");

            Utils.create("div")
                .addClass("btn btn-white btn-medium")
                .html(Text.get("schema.host.action.deactivate_multiple"))
                .appendTo(overlay.content)
                .click(function() {
                    Bloonix.hostServiceAction(
                        "/hosts/deactivate/",
                        { host_id: selectedIds }
                    );
                    self.table.getData();
                    overlay.close();
                });

            Utils.create("div")
                .addClass("btn btn-white btn-medium")
                .html(Text.get("schema.host.action.activate_multiple"))
                .appendTo(overlay.content)
                .click(function() {
                    Bloonix.hostServiceAction(
                        "/hosts/activate/",
                        { host_id: selectedIds }
                    );
                    self.table.getData();
                    overlay.close();
                });
        } else if (action === 3) {
            var formOuter = Utils.create("div").css({ padding: "0 20px" }),
                elements = [];

            Utils.create("div")
                .addClass("text-warn")
                .css({ "text-align": "center", "padding-bottom": "20px" })
                .html(Text.get("schema.host.text.multiple_edit_info"))
                .appendTo(formOuter);

            $.each(Bloonix.getHostFormElements(), function(i, e) {
                if (
                    e.name === "description" ||
                    e.name === "comment" ||
                    e.name === "sysinfo" ||
                    e.name === "sysgroup" ||
                    e.name === "host_class" ||
                    e.name === "system_class" ||
                    e.name === "location_class" ||
                    e.name === "os_class" ||
                    e.name === "hw_class" ||
                    e.name === "env_class" ||
                    //e.name === "hw_manufacturer" ||
                    //e.name === "hw_product" ||
                    //e.name === "os_manufacturer" ||
                    //e.name === "os_product" ||
                    //e.name === "virt_manufacturer" ||
                    //e.name === "virt_product" ||
                    //e.name === "location" ||
                    e.name === "allow_from"
                ) {
                    elements.push(e);
                    e.required = false;
                }
            });

            var form = new Form({
                format: "medium",
                url: { submit: "/hosts/update-multiple" },
                onSuccess: function() { overlay.close() },
                action: "update",
                elements: elements,
                autocomplete: Bloonix.get("/hosts/cats"),
                appendTo: formOuter,
                showButton: false,
                overwriteDataCallback: function(data) {
                    var newData = { host_id: selectedIds };
                    $.each(data, function(key, value) {
                        if (value !== undefined && value.length) {
                            newData[key] = value;
                        }
                    });
                    return newData;
                }
            }).create();

            overlay.content = formOuter;
            overlay.title = Text.get("schema.host.text.multiple_edit");
            overlay.buttons = [{
                content: Text.get("action.update"),
                callback: function() { form.submit() },
                close: false
            }];
        }

        overlay.create();
    };

    object.create = function() {
        this.createBoxes();
        this.listClasses();
        this.listHosts();
    };

    object.createBoxes = function() {
        this.headerContainer = Utils.create("div")
            .appendTo(this.appendTo);

        this.container = Utils.create("div")
            .appendTo(this.appendTo);

        this.boxes = Bloonix.createSideBySideBoxes({
            container: this.container,
            width: "250px"
        });
    };

    object.listClasses = function() {
        var self = this;

        this.boxes.left.html("");

        var getClasses = function(menu, classType) {
            Bloonix.replaceWithLoading(menu.activeBox);

            if (classType !== Bloonix.user.stash.host_class_view) {
                Bloonix.saveUserConfig("host_class_view", classType, false);
            }

            Ajax.post({
                url: "/hosts/classes/" + classType,
                success: function(result) {
                    Bloonix.removeLoading(menu.activeBox);

                    var ul = Utils.create("ul")
                        .addClass("host-class-listing")
                        .appendTo(menu.activeBox);

                    self.listClassStructure(classType, ul, result.data, "", false);
                }
            });
        };

        /*
        this.menu = new Menu({
            title: Text.get("schema.host.menu.host_class"),
            appendTo: this.boxes.left,
            onClick: getClasses,
            value: "host",
        }).create();
        this.menu = new Menu({
            title: Text.get("schema.host.menu.system_class"),
            appendTo: this.boxes.left,
            onClick: getClasses,
            value: "system"
        }).create();
        this.menu = new Menu({
            title: Text.get("schema.host.menu.location_class"),
            appendTo: this.boxes.left,
            onClick: getClasses,
            value: "location"
        }).create();
        this.menu = new Menu({
            title: Text.get("schema.host.menu.os_class"),
            appendTo: this.boxes.left,
            onClick: getClasses,
            value: "os"
        }).create();
        this.menu = new Menu({
            title: Text.get("schema.host.menu.hw_class"),
            appendTo: this.boxes.left,
            onClick: getClasses,
            value: "hw"
        }).create();
        this.menu = new Menu({
            title: Text.get("schema.host.menu.env_class"),
            appendTo: this.boxes.left,
            onClick: getClasses,
            value: "env"
        }).create();
        */

        this.menu = new SimpleMenu({
            appendTo: this.boxes.left,
            callback: getClasses
        }).create();

        this.menu.add({
            text: Text.get("schema.host.menu.host_class"),
            value: "host"
        });
        this.menu.add({
            text: Text.get("schema.host.menu.system_class"),
            value: "system"
        });
        this.menu.add({
            text: Text.get("schema.host.menu.location_class"),
            value: "location"
        });
        this.menu.add({
            text: Text.get("schema.host.menu.hw_class"),
            value: "hw",
            lineBreak: true
        });
        this.menu.add({
            text: Text.get("schema.host.menu.env_class"),
            value: "env"
        });
        this.menu.add({
            text: Text.get("schema.host.menu.os_class"),
            value: "os",
            lineBreak: true
        });

        var initItem = Bloonix.user.stash.host_class_view
            ? Bloonix.user.stash.host_class_view
            : "host";

        this.menu.switchItem(initItem);

        /*
        var serviceFilterBox = Bloonix.createIconList({
            format: "even-full",
            items: [
                { name: "Team Linux A (1)", value: "Team Linux A" },
                { name: "Team Linux B (1)", value: "Team Linux B" },
                { name: "Team Linux C (1)", value: "Team Linux C" },
                { name: "Team Solaris A (1)", value: "Team Solatis A" },
                { name: "Team Solaris B (1)", value: "Team Solatis B" },
                { name: "Team Solaris C (1)", value: "Team Solatis C" },
                { name: "Team Windows A (1)", value: "Team Windows A" },
                { name: "Team Windows B (1)", value: "Team Windows B" },
                { name: "Team Windows C (1)", value: "Team Windows C" },
                { name: "Foobar (1)", value: "Foobar" },
            ],
            multiple: true,
        });

        new Menu({
            title: "Host by Tags",
            content: serviceFilterBox.getContainer(),
            hide: true,
            appendTo: this.boxes.left
        }).create();
        */
    };

    object.listClassStructure = function(classType, ul, data, path, hide) {
        var self = this;

        $.each(Bloonix.sortObject(data), function(i, className) {
            var obj = data[className],
                currentPath,
                totalObjects = parseInt(obj.total),
                statusColor = "OK",
                statusCount = 0;

            if (hide === false && className === "All") {
                currentPath = "";
            } else {
                currentPath = path +"/"+ className;
            }

            if (self.hideItems[currentPath] === undefined) {
                self.hideItems[currentPath] = hide;
            } else {
                hide = self.hideItems[currentPath];
            }

            $.each([ "UNKNOWN", "CRITICAL", "WARNING", "INFO" ], function(i, s) {
                statusCount += parseInt(obj.status[s]);
            });

            $.each([ "UNKNOWN", "CRITICAL", "WARNING", "INFO", "OK" ], function(i, s) {
                if (obj.status[s] > 0) {
                    statusColor = s;
                    return false;
                }
            });

            var li = Utils.create("li")
                .appendTo(ul);

            Utils.createInfoIcon({ type: statusColor, size: "small" })
                .appendTo(li);

            var statusString = statusColor === "OK"
                ? totalObjects
                : statusCount +"/"+ totalObjects;

            var span = Utils.create("span")
                .attr("data-path", currentPath)
                .addClass("host-class-listing-hover")
                .addClass("host-class-path")
                .text(className +" ("+ statusString +")")
                .appendTo(li);

            span.click(function() {
                var search = currentPath === ""
                    ? { search: currentPath }
                    : { search: classType +'_class:"!'+ currentPath +'"' };

                self.table.getData(search);
            });

            if (currentPath === "") {
                Utils.create("a")
                    .attr("href", "#help/host-classes")
                    .attr("target", "_blank")
                    .attr("title", Text.get("schema.host.text.host_class_help_link"))
                    .addClass("hicons-btn")
                    .css({ "margin-left": "15px" })
                    .html(Utils.create("span").addClass("hicons info-sign"))
                    .appendTo(li)
                    .tooltip();
            }

            if (Utils.objectSize(obj.classes)) {
                var newUl = Utils.create("ul")
                    .addClass("host-class-listing")
                    .appendTo(li);

                if (hide === true) {
                    newUl.hide();
                }

                span.click(function() {
                    if (self.hideItems[currentPath] === true) {
                        self.hideItems[currentPath] = false;
                        newUl.show(200);
                    } else {
                        self.hideItems[currentPath] = true;
                        newUl.find("ul").hide();
                        newUl.find(".host-class-path").each(function() {
                            self.hideItems[ $(this).data("path") ] = true;
                        });
                        newUl.hide(200);
                    }
                });

                self.listClassStructure(classType, newUl, obj.classes, currentPath, true);
            }
        });
    };

    object.listHosts = function() {
        var self = this;

        Bloonix.setTitle("schema.host.text.list");

        Utils.create("span")
            .attr("title", Text.get("schema.host.text.multiple_downtimes"))
            .tooltip()
            .addClass("footer-button")
            .html(Utils.create("div").addClass("hicons-white hicons time"))
            .appendTo("#footer-left")
            .click(function() { self.action(0) });

        Utils.create("span")
            .attr("title", Text.get("schema.host.text.multiple_notification"))
            .tooltip()
            .addClass("footer-button")
            .html(Utils.create("div").addClass("hicons-white hicons envelope"))
            .appendTo("#footer-left")
            .click(function() { self.action(1) });

        Utils.create("span")
            .attr("title", Text.get("schema.host.text.multiple_activate"))
            .tooltip()
            .addClass("footer-button")
            .html(Utils.create("div").addClass("hicons-white hicons remove-sign"))
            .appendTo("#footer-left")
            .click(function() { self.action(2) });

        if (Bloonix.user.role !== "user") {
            Utils.create("span")
                .attr("title", Text.get("schema.host.text.multiple_edit"))
                .tooltip()
                .addClass("footer-button")
                .html(Utils.create("div").addClass("hicons-white hicons wrench"))
                .appendTo("#footer-left")
                .click(function() { self.action(3) });
        }

        var counterButton = Utils.create("span")
            .attr("title", Text.get("text.selected_objects"))
            .tooltip()
            .addClass("footer-button")
            .text("0")
            .hide()
            .appendTo("#footer-left");

        var icons;

        if (Bloonix.user.role != "user") {
            icons = [
                {
                    type: "help",
                    callback: function() { Utils.open("/#help/add-new-host") },
                    title: Text.get("site.help.doc.add-new-host")
                },{
                    type: "create",
                    callback: function() { Bloonix.route.to("monitoring/hosts/create") },
                    title: Text.get("schema.host.text.create")
                }
            ];
        }

        this.table = new Table({
            url: "/hosts",
            postdata: this.postdata,
            appendTo: this.boxes.right,
            sortable: true,
            header: {
                title: Text.get("schema.host.text.list"),
                pager: true,
                search: true,
                icons: icons,
                appendTo: this.headerContainer,
                replace: true
            },
            selectable: {
                result: [ "id", "hostname", "ipaddr", "ipaddr6", "description" ],
                counter: { update: counterButton }
            },
            searchable: {
                url: "/hosts/search/",
                result: [ "id", "hostname", "ipaddr", "description", "status" ],
                value: this.postdata.query
            },
            reloadable: {
                before: function() { self.listClasses() }
            },
            deletable: {
                title: Text.get("schema.host.text.delete"),
                url: "/administration/hosts/:id/delete",
                result: [ "id", "hostname", "ipaddr", "ipaddr6" ]
            },
            tooltip: function(row) {
                var text = '';

                $.each(row.services, function(i, r) {
                    if (r.status !== "OK") {
                        text += '<p>'+ Utils.escape(r.service_name) +': <b style="color:'
                            + Bloonix.defaultStatusColor[r.status] +';">'+ r.status +'</b></p>';
                    }
                });

                return text;
            },
            columnSwitcher: {
                table: "host",
                callback: Bloonix.saveUserTableConfig,
                config: Bloonix.getUserTableConfig("host")
            },
            columns: [
                {
                    name: "id",
                    text: Text.get("schema.host.attr.id"),
                    hide: true
                },{
                    name: "hostname",
                    text: Text.get("schema.host.attr.hostname"),
                    call: function(row) { return Bloonix.call("monitoring/hosts/"+ row.id, row.hostname) },
                    switchable: false
                },{
                    icons: [
                        {
                            check: function(row) { return row.notification == "0" ? true : false },
                            icon: "cicons mute",
                            title: Text.get("schema.host.info.notification_disabled")
                        },{
                            check: function(row) { return row.active == "0" ? true : false },
                            icon: "cicons disabled",
                            title: Text.get("schema.host.info.inactive")
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
                        },
                    ]
                },{
                    name: "ipaddr",
                    text:  Text.get("schema.host.attr.ipaddr")
                },{
                    name: "ipaddr6",
                    text:  Text.get("schema.host.attr.ipaddr6"),
                    hide: true
                },{
                    name: "company",
                    text: Text.get("schema.company.attr.company"),
                    hide: Bloonix.user.role == "admin" ? false : true,
                    switchable: false
                },{
                    name: "description",
                    text: Text.get("schema.host.attr.description")
                },{
                    name: "comment",
                    text: Text.get("schema.host.attr.comment"),
                    hide: true
                },{
                    name: "status",
                    text: Text.get("schema.host.attr.status"),
                    wrapValueClass: true,
                    switchable: false
                },{
                    name: "last_check",
                    text: Text.get("schema.host.attr.last_check"),
                    convertFromUnixTime: true
                },{
                    name: "sysgroup",
                    text: Text.get("schema.host.attr.sysgroup")
                },{
                    name: "sysinfo",
                    text: Text.get("schema.host.attr.sysinfo"),
                    func: function(row) { return Bloonix.createSysInfoLink(row.sysinfo) },
                    hide: true
                },{
                    name: "host_class",
                    text: Text.get("schema.host.attr.host_class")
                },{
                    name: "system_class",
                    text: Text.get("schema.host.attr.system_class"),
                    hide: true
                },{
                    name: "location_class",
                    text: Text.get("schema.host.attr.location_class"),
                    hide: true
                },{
                    name: "os_class",
                    text: Text.get("schema.host.attr.os_class"),
                    hide: true
                },{
                    name: "hw_class",
                    text: Text.get("schema.host.attr.hw_class"),
                    hide: true
                },{
                    name: "env_class",
                    text: Text.get("schema.host.attr.env_class"),
                    hide: true
                /*
                },{
                    name: "hw_manufacturer",
                    text: Text.get("schema.host.attr.hw_manufacturer"),
                    hide: true
                },{
                    name: "hw_product",
                    text: Text.get("schema.host.attr.hw_product"),
                    hide: true
                },{
                    name: "os_manufacturer",
                    text: Text.get("schema.host.attr.os_manufacturer"),
                    hide: true
                },{
                    name: "os_product",
                    text: Text.get("schema.host.attr.os_product")
                },{
                    name: "virt_manufacturer",
                    text: Text.get("schema.host.attr.virt_manufacturer"),
                    hide: true
                },{
                    name: "virt_product",
                    text: Text.get("schema.host.attr.virt_product"),
                    hide: true
                },{
                    name: "location",
                    text: Text.get("schema.host.attr.location")
                */
                },{
                    name: "coordinates",
                    text: Text.get("schema.host.attr.coordinates"),
                    hide: true
                },{
                    name: "interval",
                    text: Text.get("schema.host.attr.interval"),
                    hide: true
                },{
                    name: "retry_interval",
                    text: Text.get("schema.host.attr.retry_interval"),
                    hide: true
                },{
                    name: "data_retention",
                    text: Text.get("schema.host.attr.data_retention"),
                    hide: true
                }
            ]
        }).create();
    };

    object.create();
    return object;
};

Bloonix.editHost = function(o) {
    var host = Bloonix.get("/administration/hosts/"+ o.id +"/options/");

    Bloonix.setTitle("schema.host.text.settings");

    new Header({
        title: Text.get("schema.host.text.settings"),
        icons: Bloonix.getHostAddEditIcons()
    }).create();

    new Form({
        url: { submit: "/administration/hosts/"+ o.id +"/update/" },
        title: "Host-Key: "+ o.id +"."+ host.values.password,
        action: "update",
        options: host.options,
        values: host.values,
        elements: Bloonix.getHostFormElements(host.limits),
        autocomplete: Bloonix.get("/hosts/cats")
    }).create();
};

Bloonix.createHost = function() {
    var host = Bloonix.get("/administration/hosts/options");

    Bloonix.setTitle("schema.host.text.create");
    new Header({
        title: Text.get("schema.host.text.create"),
        icons: Bloonix.getHostAddEditIcons()
    }).create();

    var elements = Bloonix.getHostFormElements(host.limits);
        //groups = Bloonix.get("/administration/groups/for-host-creation"),
        //contactgroups = Bloonix.get("/contactgroups");

    elements.splice(1, 0, {
        element: "multiselect",
        name: "group_id",
        text: Text.get("schema.host.text.add_host_to_group"),
        desc: Text.get("schema.host.desc.add_host_to_group"),
        required: true
    });

    elements.splice(2, 0, {
        element: "multiselect",
        name: "contactgroup_id",
        text: Text.get("schema.host.text.add_host_to_contactgroup"),
        desc: Text.get("schema.host.desc.add_host_to_contactgroup")
    });

    elements.splice(3, 0, {
        element: "multiselect",
        name: "host_template_id",
        text: Text.get("schema.host.text.add_host_to_host_template"),
        desc: Text.get("schema.host.desc.add_host_to_host_template")
    });

    host.values.password = Utils.genRandStr(30);

    var form = new Form({
        url: { submit: "/administration/hosts/create/" },
        onSuccess: function(result) { Bloonix.route.to("monitoring/hosts/"+ result.id) },
        action: "create",
        options: host.options,
        values: host.values,
        elements: elements,
        autocomplete: Bloonix.get("/hosts/cats")
    }).create();
};

Bloonix.getHostFormElements = function(o) {
    return [
        {
            element: "select",
            name: "company_id",
            text: Text.get("schema.company.attr.company"),
            desc: Text.get("schema.host.desc.company_id"),
            required: true
        },{
            element: "input",
            type: "text",
            name: "hostname",
            text: Text.get("schema.host.attr.hostname"),
            desc: Text.get("schema.host.desc.hostname"),
            maxlength: 64,
            required: true
        },{
            element: "input",
            type: "text",
            name: "ipaddr",
            text: Text.get("schema.host.attr.ipaddr"),
            desc: Text.get("schema.host.desc.ipaddr"),
            maxlength: 39,
            required: true
        },{
            element: "input",
            type: "text",
            name: "ipaddr6",
            text: Text.get("schema.host.attr.ipaddr6"),
            desc: Text.get("schema.host.desc.ipaddr6"),
            maxlength: 45
        },{
            element: "input",
            type: "text",
            name: "description",
            text: Text.get("schema.host.attr.description"),
            desc: Text.get("schema.host.desc.description"),
            maxlength: 100,
            required: true
        },{
            element: "input",
            type: "text",
            name: "comment",
            text: Text.get("schema.host.attr.comment"),
            desc: Text.get("schema.host.desc.comment"),
            maxlength: 100
        },{
            element: "input",
            type: "text",
            name: "password",
            text: Text.get("schema.host.attr.password"),
            desc: Text.get("schema.host.desc.password"),
            minlength: 30,
            maxlength: 128,
            genString: 30,
            required: true
        },{
            element: "input",
            type: "text",
            name: "sysinfo",
            text: Text.get("schema.host.attr.sysinfo"),
            desc: Text.get("schema.host.desc.sysinfo"),
            maxlength: 200
        },{
            element: "input",
            type: "text",
            name: "sysgroup",
            text: Text.get("schema.host.attr.sysgroup"),
            desc: Text.get("schema.host.desc.sysgroup"),
            maxlength: 50
        },{
            element: "input",
            type: "text",
            name: "host_class",
            text: Text.get("schema.host.attr.host_class"),
            desc: Text.get("schema.host.desc.host_class"),
            maxlength: 100
        },{
            element: "input",
            type: "text",
            name: "system_class",
            text: Text.get("schema.host.attr.system_class"),
            desc: Text.get("schema.host.desc.system_class"),
            maxlength: 100
        },{
            element: "input",
            type: "text",
            name: "location_class",
            text: Text.get("schema.host.attr.location_class"),
            desc: Text.get("schema.host.desc.location_class"),
            maxlength: 100
        },{
            element: "input",
            type: "text",
            name: "os_class",
            text: Text.get("schema.host.attr.os_class"),
            desc: Text.get("schema.host.desc.os_class"),
            maxlength: 100
        },{
            element: "input",
            type: "text",
            name: "hw_class",
            text: Text.get("schema.host.attr.hw_class"),
            desc: Text.get("schema.host.desc.hw_class"),
            maxlength: 100
        },{
            element: "input",
            type: "text",
            name: "env_class",
            text: Text.get("schema.host.attr.env_class"),
            desc: Text.get("schema.host.desc.env_class"),
            maxlength: 100
        },{
            element: "select",
            name: "coordinates",
            text: Text.get("schema.host.attr.coordinates"),
            desc: Text.get("schema.host.desc.coordinates"),
            required: true
        },{
            element: "radio-yes-no",
            name: "active",
            text: Text.get("schema.host.attr.active"),
            desc: Text.get("schema.host.desc.active"),
            required: true
        },{
            element: "radio-yes-no",
            name: "notification",
            text: Text.get("schema.host.attr.notification"),
            desc: Text.get("schema.host.desc.notification"),
            required: true
        },{
            element: "input",
            type: "text",
            name: "allow_from",
            text: Text.get("schema.host.attr.allow_from"),
            desc: Text.gets(["schema.host.desc.allow_from", "text.allow_from_desc"]),
            maxlength: 100,
            required: true
        },{
            element: "slider",
            name: "interval",
            text: Text.get("schema.host.attr.interval"),
            desc: Text.get("schema.host.desc.interval"),
            secondsToFormValues: true,
            nullString: Text.get("text.inherited_from_host")
        },{
            element: "slider",
            name: "retry_interval",
            text: Text.get("schema.host.attr.retry_interval"),
            desc: Text.get("schema.host.desc.retry_interval"),
            secondsToFormValues: true,
            nullString: Text.get("text.inherited_from_host")
        },{
            element: "slider",
            name: "timeout",
            text: Text.get("schema.host.attr.timeout"),
            desc: Text.get("schema.host.desc.timeout"),
            secondsToFormValues: true,
            nullString: Text.get("text.inherited_from_host")
        },{
            element: "slider",
            name: "notification_interval",
            text: Text.get("schema.host.attr.notification_interval"),
            desc: Text.get("schema.host.desc.notification_interval"),
            secondsToFormValues: true
        },{
            element: "input",
            type: "text",
            name: "data_retention",
            text: Text.get("schema.host.attr.data_retention"),
            desc: Text.get("schema.host.desc.data_retention"),
            minValue: 0,
            maxValue: 32767,
            required: true,
            elementInfo: o ? Text.get("schema.company.text.data_retention_info", o.data_retention) : false
        },{
            element: "input",
            type: "text",
            name: "max_services",
            text: Text.get("schema.host.attr.max_services"),
            desc: Text.get("schema.host.desc.max_services"),
            minValue: 0,
            maxValue: 9999,
            required: true
        },{
            element: "input",
            type: "text",
            name: "max_sms",
            text: Text.get("schema.host.attr.max_sms"),
            desc: Text.get("schema.host.desc.max_sms"),
            minValue: 0,
            maxValue: 99999,
            required: true
        },{
            element: "textarea",
            name: "variables",
            text: Text.get("schema.host.attr.variables"),
            desc: Text.get("schema.host.desc.variables")
        }
    ];
};

Bloonix.searchHosts = function(query) {
    Bloonix.route.to("monitoring/hosts", { query: query });
};

Bloonix.getHost = function(id) {
    return Bloonix.get("/hosts/"+ id);
};

Bloonix.getHostAddEditIcons = function() {
    return [
        {   
            type: "help",
            callback: function() { Utils.open("/#help/host-parameter") },
            title: Text.get("site.help.doc.host-parameter")
        }   
    ]
};
