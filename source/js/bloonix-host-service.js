Bloonix.createService = function(o) {
    var object = Utils.extend({
        orderBy: "plugin",
        filter: false,
        filterByCategory: {}
    }, o);

    // If object.template is defined then a service
    // template is created or updated.
    if (object.template === true) {
        object.template = Bloonix.getTemplateById(object.id);
    } else {
        object.host = Bloonix.getHost(object.id);

        Bloonix.showHostSubNavigation(
            "host",
            object.host.id,
            object.host.hostname
        );
    }

    object.create = function() {
        object.createHeader();
        object.createBoxes();
        object.getPlugins();
        object.createForm();
        object.listPlugins();
    };

    object.createHeader = function() {
        new Header({
            title: Text.get("schema.service.text.choose_plugin")
        }).create();
    };

    object.createBoxes = function() {
        this.boxes = Bloonix.createSideBySideBoxes({
            container: "#content",
            width: "300px"
        });
    };

    object.updateOrder = function(by) {
        this.orderBy = by;
        this.listPlugins();
    };

    object.filterCategories = function(categories) {
        var self = this;

        if (categories.length) {
            this.filter = true;
        } else {
            this.filter = false;
        }

        this.filterByCategory = categories;
        this.listPlugins();
    };

    object.createForm = function() {
        var self = this;

        Utils.create("h2")
            .addClass("h2")
            .html(Text.get("text.sort_by_dots"))
            .appendTo(this.boxes.left);

        var orderIconList = Utils.create("div")
            .css({ "margin-left": "20px" })
            .appendTo(this.boxes.left);

        Bloonix.createIconList({
            format: "even-large",
            items: [
                { name: Text.get("text.plugin"), value: "plugin", default: true },
                { name: Text.get("text.command"), value: "command" }
            ],
            callback: function(value) { self.updateOrder(value) },
            appendTo: orderIconList
        });

        Utils.create("h2")
            .addClass("h2")
            .html(Text.get("text.filter_by_category_dots"))
            .appendTo(this.boxes.left);

        var categoryIconList = Utils.create("div")
            .css({ "margin-left": "20px" })
            .appendTo(this.boxes.left);

        var categoryList = [];
        $.each(this.categories.sort(), function(i, category) {
            categoryList.push({
                name: category,
                value: category
            });
        });

        Bloonix.createIconList({
            format: "even-large",
            items: categoryList,
            callback: function(value) { self.filterCategories(value) },
            appendTo: categoryIconList,
            multiple: true
        });

        this.form = new Form({ format: "medium" });
    };

    object.getPlugins = function() {
        var self = this;

        this.plugins = Bloonix.get("/plugins", { limit: 1000 });
        this.categories = [];
        this.pluginsByCategory = {};
        this.order = {
            plugin: { keys: [], objects: {} },
            command: { keys: [], objects: {} }
        };

        $.each(this.plugins, function(i, plugin) {
            //if (plugin.command == "check-by-condition") {
            //    return true;
            //}
            $.each(plugin.category.split(","), function(i, category) {
                category = category.replace(/^\s+/, '').replace(/\s+$/, '');

                if (!plugin.hasCategory) {
                    plugin.hasCategory = {};
                }

                if (!self.pluginsByCategory[category]) {
                    self.pluginsByCategory[category] = [];
                    self.categories.push(category);
                }

                self.pluginsByCategory[category].push(plugin);
                plugin.hasCategory[category] = 1;
            });

            self.order.plugin.objects[plugin.plugin] = plugin;
            self.order.plugin.keys.push(plugin.plugin);
            self.order.command.objects[plugin.command] = plugin;
            self.order.command.keys.push(plugin.command);
        });

        Utils.create("div").addClass("clear").appendTo(this.boxes.right);
    };

    object.listPlugins = function() {
        var self = this;

        $(this.boxes.right).html("");

        var table = new Table({
            appendTo: this.boxes.right
        }).init();

        $.each([ "plugin", "categories", "command", "description" ], function(i, key) {
            table.addHeadColumn(
                Text.get("schema.plugin.attr."+ key)
            );
        });

        $.each(this.order[this.orderBy].keys.sort(), function(x, key) {
            var plugin = self.order[self.orderBy].objects[key];

            if (self.filter == true) {
                var show = false;

                $.each(self.filterByCategory, function(y, category) {
                    if (plugin.hasCategory[category] == 1) {
                        show = true;
                        return false;
                    }
                });

                if (show == false) {
                    return true;
                }
            }

            var boxClickEvent = function() {
                Bloonix.createServiceByCommand({
                    id: self.id,
                    host: self.host,
                    plugin: plugin,
                    template: self.template
                });
            };

            var tr = table.createRow();
            table.createColumn(tr, plugin, {
                name: "plugin",
                aTag: true,
                onClick: boxClickEvent
            });
            table.createColumn(tr, plugin, { name: "category" });
            table.createColumn(tr, plugin, { name: "command" });
            table.createColumn(tr, plugin, { name: "description" });
        });
    };

    object.create();
};

Bloonix.createServiceByCommand = function(o) {
    $("#content").html("");
    $("#content-outer").scrollTop(0);

    var serviceUrl, submitUrl, onSuccess;

    if (o.template) {
        serviceUrl = "/templates/hosts/"+ o.id +"/services/options/"+ o.plugin.id;
        submitUrl = "/templates/hosts/"+ o.id +"/services/create";
    } else {
        serviceUrl = "/hosts/"+ o.id +"/services/options/"+ o.plugin.id;
        submitUrl = "/hosts/"+ o.id +"/services/create";
    }

    var service = Bloonix.get(serviceUrl);

    Bloonix.createServiceForm({
        url: { submit: submitUrl },
        host: o.host,
        template: o.template,
        values: service.values,
        options: service.options,
        plugin: o.plugin,
        action: "create"
    });
};

Bloonix.editService = function(o) {
    var self = this,
        host, template,
        serviceUrl, submitUrl;

    if (o.template) {
        template = Bloonix.getTemplateById(o.id);
        serviceUrl = "/templates/hosts/"+ o.id +"/services/"+ o.refId +"/options/";
        submitUrl = "/templates/hosts/"+ o.id +"/services/"+ o.refId +"/update";
    } else {
        host = Bloonix.getHost(o.id);
        serviceUrl = "/hosts/"+ o.id +"/services/"+ o.service_id +"/options/";
        submitUrl = "/hosts/"+ o.id +"/services/"+ o.service_id +"/update";

        Bloonix.showHostSubNavigation(
            "host",
            host.id,
            host.hostname
        );
    }

    var service = Bloonix.get(serviceUrl),
        plugin = Bloonix.get("/plugins/"+ service.values.plugin_id);

    Bloonix.createServiceForm({
        url: { submit: submitUrl },
        host: host,
        template: template,
        values: service.values,
        options: service.options,
        plugin: plugin,
        action: "update"
    });
};

Bloonix.cloneService = function(o) {
    var toHost = Bloonix.getHost(o.clone_to),
        service = Bloonix.get("/hosts/"+ o.id +"/services/"+ o.service_id +"/options"),
        plugin = Bloonix.get("/plugins/"+ service.values.plugin_id),
        submitUrl = "/hosts/"+ o.clone_to +"/services/create"

    Bloonix.showHostSubNavigation(
        "host",
        toHost.id,
        toHost.hostname
    );

    Bloonix.createServiceForm({
        url: { submit: submitUrl },
        host: toHost,
        values: service.values,
        options: service.options,
        plugin: plugin,
        action: "clone"
    });
};

Bloonix.createServiceForm = function(o) {
    var object = Utils.extend({}, o);

    object.create = function() {
        this.preparePluginOptions();
        this.getLocations();
        this.initForm();
        this.createBaseSettingsElements();
        this.createWebTransactionWorkflow();
        this.createCommandFormElements();
        this.createNotificationFormElements();
        this.createSubmitButton();
    };

    object.preparePluginOptions = function() {
        var self = this;
        this.pluginOptionsByOption = {};
        this.commandOptionsByOption = {};
        this.thresholdElements = [];
        if (this.plugin && this.plugin.info) {
            $.each(this.plugin.info.options, function(i, opt) {
                self.pluginOptionsByOption[opt.option] = opt;
            });
        }
        if (this.action == "update" || this.action == "clone") {
            $.each(this.values.command_options, function(i, e) {
                // nagios-command is deprecated
                if (e.option == "nagios-command" && self.pluginOptionsByOption["simple-command"]) {
                    e.option = "simple-command";
                }
                if (self.pluginOptionsByOption[e.option].multiple) {
                    if (!self.commandOptionsByOption[e.option]) {
                        self.commandOptionsByOption[e.option] = [];
                    }
                    self.commandOptionsByOption[e.option].push(e.value);
                } else {
                    self.commandOptionsByOption[e.option] = e.value;
                }
            });
        }
    };

    object.getLocations = function() {
        var self = this;
        this.locations = Bloonix.get("/locations");
        this.hasLocations = this.locations.length > 0 ? true : false;
        this.locationsById = {};
        $.each(this.locations, function(i, item) {
            self.locationsById[item.id] = item;
            /*if (item.is_default == "1") {
                self.defaultLocation = item;
            }*/
        });
    };

    object.initForm = function() {
        var self = this,
            header, onSuccess,
            submitUrl;

        if (this.action == "create" || this.action == "clone") {
            submitUrl = this.template
                ? "/templates/hosts/"+ this.template.id +"/services/create"
                : "/hosts/"+ this.host.id +"/services/create";

            onSuccess = function(result) {
                if (self.template) {
                    Bloonix.route.to("monitoring/templates/"+ result.host_template_id +"/services/"+ result.ref_id +"/edit");
                } else {
                    Bloonix.route.to("monitoring/hosts/"+ result.host_id);
                }
            };

            header = new Header({
                title: Text.get("schema.service.text.create"),
                border: true,
                icons: [
                    {
                        type: "help",
                        callback: function() { Utils.open("/#help/service-parameter") }, 
                        title: Text.get("site.help.doc.service-parameter")
                    },{
                        type: "go-back",
                        callback: function() {
                            if (self.template) {
                                Bloonix.route.to("monitoring/templates/"+ self.template.id +"/services/create");
                            } else {
                                Bloonix.route.to("monitoring/hosts/"+ self.host.id +"/services/create");
                            }
                        },
                        title: Text.get("info.go-back")
                    }
                ]
            });
        } else {
            submitUrl = this.template
                ? "/templates/hosts/"+ this.template.id +"/services/"+ this.values.ref_id +"/update"
                : "/hosts/"+ this.host.id +"/services/"+ this.values.id +"/update";

            header = new Header({
                title: Text.get("schema.service.text.settings", self.values.service_name, true),
                subtitle: self.template
                    ? Text.get("schema.service.attr.ref_id") +": "+ self.values.ref_id
                    : Text.get("schema.service.attr.id") +": "+ self.values.id,
                border: true,
                icons: [
                    {
                        type: "help",
                        callback: function() { Utils.open("/#help/service-parameter") },              
                        title: Text.get("site.help.doc.service-parameter")
                    },{
                        type: "go-back",
                        callback: function() {
                            if (self.template) {
                                Bloonix.route.to("monitoring/templates/"+ self.template.id +"/services");
                            } else {
                                Bloonix.route.to("monitoring/hosts/"+ self.host.id);
                            }
                        },
                        title: Text.get("info.go-back")
                    }
                ]
            });
        }

        header.create();

        this.form = new Form({
            url: { submit: submitUrl },
            onSuccess: onSuccess,
            format: "default",
            appendTo: "#content",
            splice: [ "command_options", "agent_options" ],
            formClass: "service-form",
            postpareDataCallback: function(data) {
                self.addThresholdValues(data);
                if (self.plugin.id == "58" && self.wtrm) {
                    self.addWebTransactionSteps(data);
                }
            }
        });

        this.form.init();
        this.form.msgbox({ appendTo: this.form.form });

        Utils.create("input")
            .attr("type", "hidden")
            .attr("name", "plugin_id")
            .attr("value", this.plugin.id)
            .appendTo(this.form.form);
    };

    object.addThresholdValues = function(data) {
        $.each(this.thresholdElements, function(i, e) {
            if (e.destroyed == true) {
                return true;
            }

            var name = "command_options:"+ e.name;

            if (!data[name]) {
                data[name] = [];
            }

            var key = e.selectKey.getSelectedValue(),
                op = e.selectOperator.getSelectedValue(),
                value = e.thresholdInput.getValue();

            if (key != undefined && op != undefined && value != undefined) {
                if (key.length && op.length && value.length) {
                    data[name].push(key +":"+ op +":"+ value);
                }
            }
        });
    };

    object.addWebTransactionSteps = function(data) {
        var steps = this.wtrm.validateSteps();

        if (steps) {
            data["command_options:workflow"] = steps;
        }
    };

    object.createSettingsBox = function(title) {
        var objects = {};

        if (title) {
            objects.header = new Header({
                title: title,
                border: true,
                appendTo: this.form.form
            }).create();
        }

        objects.outer = Utils.create("div")
            .addClass("service-form-outer-box")
            .appendTo(this.form.form);

        objects.topBox = Utils.create("div")
            .addClass("service-form-top-box")
            .appendTo(objects.outer);

        objects.leftBox = Utils.create("div")
            .addClass("service-form-left-box")
            .appendTo(objects.outer);

        objects.rightBox = Utils.create("div")
            .addClass("service-form-right-box")
            .appendTo(objects.outer);

        Utils.create("div")
            .addClass("clear")
            .appendTo(objects.outer);

        objects.bottomBox = Utils.create("div")
            .addClass("service-form-bottom-box")
            .appendTo(objects.outer);

        objects.table = new Table({
            type: "form",
            appendTo: objects.leftBox
        }).init();

        return objects;
    };

    object.createOption = function(opt) {
        var desc = Utils.create("div"),
            element = "input",
            values = this.commandOptionsByOption,
            value, simple;

        if (this.action == "create") {
            value = opt.default;
        } else if (values[opt.option] != undefined) {
            value = values[opt.option];
        }

        Utils.create("p")
            .text(opt.description)
            .appendTo(desc);

        if (opt["default"] != undefined) {
            Utils.create("p")
                .html("<br/>Default: "+ opt["default"])
                .appendTo(desc);
        }

        if (this.plugin.info.flags && /simple/.test(this.plugin.info.flags)) {
            element = "textarea";
            simple = true;
        }

        this.form.createElement({
            element: element,
            type: "text",
            name: "command_options:"+ opt.option,
            text: opt.name,
            desc: desc,
            placeholder: opt.example == undefined ? "" : opt.example,
            value: value,
            css: { width: "450px" }
        });
    };

    object.createWebTransactionWorkflow = function() {
        var values = this.commandOptionsByOption;
        if (this.plugin.id == "58") {
            this.wtrm = Bloonix.WTRM({
                appendTo: this.form.form,
                preload: values.workflow
            });
        }
    };

    object.addDestroyButton = function(elem, destroy, element) {
        Utils.create("span")
            .addClass("hicons remove column-remove-button")
            .attr("title", Text.get("action.remove"))
            .tooltip()
            .appendTo(element)
            .click(function() { destroy.remove(); elem.destroyed = true; });
    };

    object.createMultipleOption = function(opt, value) {
        var tr = Utils.create("tr").appendTo(this.form.table),
            th = Utils.create("th").text(opt.name).appendTo(tr),
            td = Utils.create("td").appendTo(tr),
            options = [],
            pluginInfo = this.plugin.info;

        new iButton({
            title: opt.name,
            desc: opt.description
        }).appendTo(th);

        if (!pluginInfo.thresholds) {
            var input = this.form.input({
                name: "command_options:"+ opt.option,
                type: "text",
                appendTo: td
            });
            if (value != undefined) {
                input.setValue(value);
            }
            this.addDestroyButton({}, tr, td);
            return;
        }

        var selectkeySelected = undefined,
            selectOperatorSelected = undefined,
            thresholdValue = undefined;

        if (value) {
            var parts = value.split(":");
            selectkeySelected = parts[0];
            selectOperatorSelected = parts[1];
            thresholdValue = parts[2];
        }

        $.each(pluginInfo.thresholds.options, function(i, opt) {
            options.push(opt.key);
        });

        var selectKey = this.form.select({
            options: options.sort(),
            selected: selectkeySelected,
            appendTo: td,
            width: "210px"
        });

        var selectOperator = this.form.select({
            options: [
                { value: "lt", name: "<"  },
                { value: "le", name: "<=" },
                { value: "gt", name: ">"  },
                { value: "ge", name: ">=" },
                { value: "eq", name: "==" },
                { value: "ne", name: "!=" }
            ],
            selected: selectOperatorSelected,
            appendTo: td,
            width: "80px"
        });

        var thresholdInput = this.form.input({
            type: "text",
            appendTo: td,
            width: "140px",
            value: thresholdValue
        });

        var thresholdElement = {
            name: opt.option,
            selectKey: selectKey,
            selectOperator: selectOperator,
            thresholdInput: thresholdInput,
            destroyed: false
        };

        this.thresholdElements.push(thresholdElement);
        this.addDestroyButton(thresholdElement, tr, td);
    };

    object.getOperator = function(o) {
        if (o == "lt") {
            return "<";
        }
        if (o == "le") {
            return "<=";
        }
        if (o == "gt") {
            return ">";
        }
        if (o == "ge") {
            return ">=";
        }
        if (o == "eq") {
            return "==";
        }
        if (o == "ne") {
            return "!=";
        }
    };

    object.showThresholdOptions = function(plugin) {
        var pluginStats = Bloonix.get("/plugin-stats/"+ plugin.id),
            content = Utils.create("div"),
            thresholds = plugin.info.thresholds,
            pluginStatsByKey = {},
            pluginOptionsByOption = {},
            thresholdKeys = [];

        $.each(pluginStats, function(i, opt) {
            pluginStatsByKey[opt.statkey] = opt;
        });

        var table = new Table({ appendTo: content }).init();
        table.addHeadColumn("Key");
        table.addHeadColumn("Unit");
        table.addHeadColumn("Description");

        $.each(Utils.sort(thresholds.options, "key"), function(i, opt) {
            if (pluginStatsByKey[opt.key] == undefined) {
                Log.error("no data for plugin key "+ opt.key);
            } else {
                table.createRow([
                    opt.key,
                    opt.unit,
                    pluginStatsByKey[opt.key].description
                ]);
            }
        });

        var overlay = new Overlay({
            title: "Threshold options",
            content: content
        }).create();
    };

    object.createBaseSettingsElements = function() {
        var self = this,
            boxes = this.createSettingsBox();

        this.createPluginInfoBox(boxes);
        this.form.table = boxes.table.getTable();
        this.createBaseFormElements();
        this.createLocationFormElements();
    };

    object.createLocationFormElements = function() {
        var plugin = this.plugin;

        //if (plugin.netaccess != "1") {
        //    return;
        //}

        this.createLocationBoxes();
        this.createLocationContainer();
        this.createAgentIdElement();

        if (this.hasLocations === true) {
            this.createWorldwideLocationElements();
            this.createLocationMap();
        }
    };

    object.createLocationBoxes = function() {
        this.locationBoxes = this.createSettingsBox();
    };

    object.createLocationContainer = function() {
        this.locationContainer = Utils.create("div")
            .addClass("location-selection")
            .css({ "margin-top": "30px" })
            .hide()
            .appendTo(this.locationBoxes.leftBox);
    };

    object.createAgentIdElement = function() {
        var self = this,
            plugin = this.plugin;

        var agent_ids = plugin.netaccess != "1"
            ? [ "localhost" ]
            : this.options.agent_id;

        this.locationDefault = this.values.agent_id || plugin.prefer;

        if (this.locationDefault == "localhost") {
            this.agentTooltip.show();
        }

        this.form.createElement({
            element: "select",
            text: Text.get("schema.service.attr.agent_id"),
            desc: Text.get("schema.service.desc.agent_id_tooltip"),
            descBoxCss: { width: "400px", padding: "20px" },
            name: "agent_id",
            options: agent_ids,
            selected: this.locationDefault,
            required: true,
            callback: function(value) {
                if (value == "localhost") {
                    self.agentTooltip.show();
                } else {
                    self.agentTooltip.hide();
                }
                if (plugin.worldwide == 1) {
                    if (value == "remote") {
                        self.locationContainer.show();
                    } else {
                        self.locationContainer.hide();
                    }
                }
            }
        });
    };

    object.createWorldwideLocationElements = function() {
        var self = this,
            plugin = this.plugin;

        if (plugin.worldwide != "1") {
            return;
        }

        this.getLocationOptions();
        this.createLocationTypeContainer();
        this.createLocationTypeSelectionElements();
    };

    object.getLocationOptions = function() {
        this.locationOptions = this.values.location_options;

        if (!this.locationOptions || this.locationOptions == "0") {
            this.locationOptions = { locations: [] };
        } else if (!this.locationOptions.locations) {
            this.locationOptions.locations = [];
        }

        if (this.locationOptions.check_type) {
            this.selectedLocationType = this.locationOptions.check_type;
        } else {
            this.selectedLocationType = "default";
        }
    };

    object.createLocationTypeContainer = function() {
        if (this.locationDefault == "remote") {
            this.locationContainer.show();
        }

        this.locationSelectionLeftBox = Utils.create("div")
            .addClass("location-selection-type-box")
            .appendTo(this.locationContainer);

        /*
        this.locationSelectionRightBox = Utils.create("div")
            .attr("id", "eu-map-container")
            .addClass("location-selection-map-box")
            .appendTo(this.locationContainer);
        */

        this.typeSelection = Utils.create("div").appendTo(this.locationSelectionLeftBox);
        this.locationTypeDefaultContainer = Utils.create("div").appendTo(this.locationSelectionLeftBox).hide();
        this.locationTypeFailoverContainer = Utils.create("div").appendTo(this.locationSelectionLeftBox).hide();
        this.locationTypeRotateContainer = Utils.create("div").appendTo(this.locationSelectionLeftBox).hide();
        this.locationTypeMultipleContainer = Utils.create("div").appendTo(this.locationSelectionLeftBox).hide();

        this.locationTypeContainerByValue = {
            default: this.locationTypeDefaultContainer,
            failover: this.locationTypeFailoverContainer,
            rotate: this.locationTypeRotateContainer,
            multiple: this.locationTypeMultipleContainer
        };

        this.locationTypeContainerByValue[this.selectedLocationType].show();
    };

    object.createLocationTypeSelectionElements = function() {
        var self = this;

        var title = Utils.create("h2")
            .html(Text.get("schema.service.text.select_location_check_type"))
            .appendTo(this.typeSelection);

        Utils.create("small")
            .css({ "font-weight": "normal", "font-size": "13px" })
            .html("<br/>"+ Text.get("schema.service.text.select_location_check_type_info"))
            .appendTo(title);

        this.form.iconList({
            name: "command_options:check_type",
            options: [
                { name: Text.get("schema.service.text.default_location_check_button"), value: "default" },
                { name: Text.get("schema.service.text.failover_location_check_button"), value: "failover" },
                { name: Text.get("schema.service.text.rotate_location_check_button"), value: "rotate" },
                { name: Text.get("schema.service.text.multiple_location_check_button"), value: "multiple" }
            ],
            checked: self.selectedLocationType,
            css: { padding: "15px" },
            callback: function(value) {
                if (self.selectedLocationType != value) {
                    self.locationTypeContainerByValue[self.selectedLocationType].hide();
                    self.locationTypeContainerByValue[value].show();
                    self.selectedLocationType = value;
                }
                self.createLocationMap();
                /*
                if (Bloonix.user.sla < 3 && Bloonix.user.role != "admin") {
                    if (value == "default") {
                        $("#sla-note").hide();
                    } else {
                        $("#sla-note").fadeIn(300);
                    }
                }
                */
            },
            appendTo: this.typeSelection
        });

        /*
        Utils.create("div")
            .attr("id", "sla-note")
            .addClass("sla-note")
            .html(Text.get("schema.service.text.sla_requirements"))
            .hide()
            .appendTo(this.typeSelection);
        */

        // To prevent JS errors if this.locationOptions.failover_locations[0]
        // is accessed and does not exists.
        $.each([ "failover_locations", "rotate_locations", "multiple_locations" ], function(i, str) {
            if (!self.locationOptions[str]) {
                self.locationOptions[str] = [];
            }
        });

        this.createDefaultLocationTypeElements();
        this.createFailoverLocationTypeElements();
        this.createRotateLocationTypeElements();
        this.createMultipleLocationTypeElements();
    };

    object.createDefaultLocationTypeElements = function() {
        Utils.create("h2")
            .css({ "margin-top": "20px" })
            .html(Text.get("schema.service.desc.default_check_type_title"))
            .appendTo(this.locationTypeDefaultContainer);

        Utils.create("p")
            .html(Text.get("schema.service.desc.default_check_type"))
            .appendTo(this.locationTypeDefaultContainer);

        /*
        Utils.create("h3")
            .html(Text.get("schema.service.desc.default_check_type_location"))
            .appendTo(this.locationTypeDefaultContainer);

        var flag = Bloonix.flag(
            this.defaultLocation.country,
            this.defaultLocation.continent +" - "+ this.defaultLocation.city +" - "+ this.defaultLocation.ipaddr
        );

        Utils.create("div")
            .addClass("list-rotate-locations-box")
            .html(flag)
            .appendTo(this.locationTypeDefaultContainer);
        */
    };

    object.createFailoverLocationTypeElements = function() {
        var self = this,
            failoverOptions = [];

        Utils.create("h2")
            .css({ "margin-top": "20px" })
            .html(Text.get("schema.service.desc.failover_check_type_title"))
            .appendTo(this.locationTypeFailoverContainer);

        Utils.create("p")
            .html(Text.get("schema.service.desc.failover_check_type"))
            .appendTo(this.locationTypeFailoverContainer);

        Utils.create("h3")
            .html(Text.get("schema.service.desc.failover_check_type_locations"))
            .appendTo(this.locationTypeFailoverContainer);

        $.each(this.locations, function(i, item) {
            failoverOptions.push({
                name: item.continent +" - "+ item.city +" - "+ item.ipaddr,
                value: item.id
            });
        });

        var failoverTable = new Table({
            type: "form",
            appendTo: this.locationTypeFailoverContainer
        }).init();

        failoverTable.createRow([
            Text.get("text.fixed_checkpoint"),
            this.form.select({
                name: "command_options:fixed_checkpoint",
                options: failoverOptions,
                selected: this.locationOptions.failover_locations[0],
                callback: function() { self.createLocationMap() }
            }).getContainer()
        ]);

        failoverTable.createRow([
            Text.get("text.first_failover_checkpoint"),
            this.form.select({
                name: "command_options:first_failover_checkpoint",
                options: failoverOptions,
                selected: this.locationOptions.failover_locations[1],
                callback: function() { self.createLocationMap() }
            }).getContainer()
        ]);

        failoverTable.createRow([
            Text.get("text.second_failover_checkpoint"),
            this.form.select({
                name: "command_options:second_failover_checkpoint",
                options: failoverOptions,
                selected: this.locationOptions.failover_locations[2],
                callback: function() { self.createLocationMap() }
            }).getContainer()
        ]);
    };

    object.createRotateLocationTypeElements = function() {
        var self = this;

        Utils.create("h2")
            .css({ "margin-top": "30px" })
            .html(Text.get("schema.service.desc.rotate_check_type_title"))
            .appendTo(this.locationTypeRotateContainer);

        Utils.create("p")
            .html(Text.get("schema.service.desc.rotate_check_type"))
            .appendTo(this.locationTypeRotateContainer);

        this.addLocationOptionsToForm(this.locationTypeRotateContainer, "rotate");
    };

    object.createMultipleLocationTypeElements = function() {
        var self = this;

        Utils.create("h2")
            .css({ "margin-top": "30px" })
            .html(Text.get("schema.service.desc.multiple_check_type_title"))
            .appendTo(this.locationTypeMultipleContainer);

        Utils.create("p")
            .html(Text.get("schema.service.desc.multiple_check_type"))
            .appendTo(this.locationTypeMultipleContainer);

        Utils.create("h3")
            .html(Text.get("schema.service.desc.multiple_check_concurrency_title"))
            .appendTo(this.locationTypeMultipleContainer);

        Utils.create("p")
            .html(Text.get("schema.service.desc.multiple_check_concurrency"))
            .appendTo(this.locationTypeMultipleContainer);

        Utils.create("h3")
            .html(Text.get("schema.service.desc.multiple_check_select_concurrency"))
            .appendTo(this.locationTypeMultipleContainer);

        this.form.slider({
            name: "command_options:concurrency",
            options: [ 1, 2, 3, 4, 5, 6, 7, 8, 9, 10 ],
            checked: this.locationOptions.concurrency || 3,
            appendTo: this.locationTypeMultipleContainer
        });

        this.addLocationOptionsToForm(this.locationTypeMultipleContainer, "multiple");
    };

    object.addLocationOptionsToForm = function(container, type) {
        var parameter = "command_options:"+ type +"_locations",
            label = "int-options-"+ type +"locations-";

        Utils.create("h3")
            .html(Text.get("schema.service.desc.multiple_check_type_locations"))
            .appendTo(container);

        Utils.create("input")
            .attr("type", "hidden")
            .attr("name", parameter)
            .attr("value", "")
            .appendTo(container);

        var checkboxTable = Utils.create("table")
            .attr("data-name", parameter)
            .addClass("location-checkbox-table")
            .appendTo(container);

        var locationCounterBoxContainer = Utils.create("div")
            .addClass("locations-selected")
            .appendTo(container);

        var locationCounterBox = Utils.create("div")
            .appendTo(locationCounterBoxContainer);

        if (Bloonix.args.showCostInfo) {
            Utils.create("br")
                .appendTo(locationCounterBoxContainer);
            Utils.create("div")
                .html(Text.get("text.selected_locations_costs"))
                .appendTo(locationCounterBoxContainer);
        }

        if (type !== "multiple") {
            locationCounterBoxContainer.hide();
        }

        // force array
        this.form.setOption(parameter, "forceArray", true);
        var checkedLocations = {};
        if (this.locationOptions[type + "_locations"]) {
            $.each(this.locationOptions[type + "_locations"], function(i, id) {
                checkedLocations[id] = true;
            });
        }

        var tr, n = 1;
        $.each(this.locations, function(i, item) {
            if (n == 1) {
                tr = Utils.create("tr").appendTo(checkboxTable);
                n = 0;
            } else {
                n += 1;
            }

            var th = Utils.create("th").appendTo(tr);
            var div = Utils.create("div").addClass("checkbox-ng").appendTo(th);

            var checkbox = Utils.create("input")
                .attr("id", label + i)
                .attr("type", "checkbox")
                .attr("name", parameter)
                .attr("value", item.id)
                .appendTo(div);

            if (checkedLocations[item.id]) {
                checkbox.attr("checked", "checked");
            }

            var calCost = function() {
                var len = checkboxTable.find("input:checked").length;
                locationCounterBox.html(
                    Text.get("text.selected_locations_counter", len, true, true)
                );
             };

            calCost();
            checkbox.click(function() {
                calCost();
                self.createLocationMap();
            });

            Utils.create("label")
                .attr("for", label+ i)
                .appendTo(div);

            Utils.create("td")
                .html( Bloonix.flag(item.country, Utils.escape(item.continent +" - "+ item.city +" - "+ item.ipaddr)))
                .click(function() { checkbox.click() }).appendTo(tr);
        });
    };

    object.createPluginInfoBox = function(boxes) {
        var plugin = this.plugin;

        var infoBox = Utils.create("div")
            .addClass("command-examples")
            .appendTo(boxes.rightBox);

        Utils.create("h3")
            .html(Text.get("text.plugin_info"))
            .appendTo(infoBox);

        var table = new Table({ type: "simple", appendTo: infoBox }).init();
        table.createFormRow(Text.get("schema.plugin.attr.plugin"), plugin.plugin);
        table.createFormRow(Text.get("schema.plugin.attr.categories"), plugin.category);
        table.createFormRow(Text.get("schema.plugin.attr.description"), plugin.description);

        if (plugin.command != "check-simple-wrapper") {
            table.createFormRow(Text.get("schema.plugin.attr.command"), plugin.command);
        }

        if (plugin.info.info) {
            Utils.create("h3")
                .css({ "margin-top": "20px" })
                .html(Text.get("schema.plugin.attr.info"))
                .appendTo(infoBox);

            Utils.create("p")
                .html(plugin.info.info.join("<br/>"))
                .appendTo(infoBox);
        }

        this.agentTooltip = Utils.create("div")
            .css({ "margin-top": "20px" })
            .html(Text.get("schema.service.desc.agent_tooltip"))
            .hide()
            .appendTo(infoBox);

        if (plugin.netaccess == 0) {
            this.agentTooltip.show();
        }

        if (plugin.info) {
            Utils.create("h5")
                .html(plugin.info)
                .appendTo(infoBox);
        }

        if (/sudo/.test(plugin.info.flags)) {
            Utils.create("h3")
                .text("Root privileges (sudo)")
                .appendTo(infoBox);

            Utils.create("p")
                .text("Root privileged are necessary to execute this check on your server.")
                .appendTo(infoBox);

            Utils.create("a")
                .attr("href", "#help/bloonix-agent-configuration")
                .attr("target", "_blank")
                .text("⇒ Read more")
                .appendTo(infoBox);
        }
    };

    object.createBaseFormElements = function() {
        var plugin = this.plugin;

        this.form.createElement({
            element: "input",
            type: "text",
            name: "service_name",
            text: Text.get("schema.service.attr.service_name"),
            desc: Text.get("schema.service.desc.service_name"),
            value: this.values.service_name || plugin["abstract"],
            maxlength: 100,
            required: true
        });

        this.form.createElement({
            element: "input",
            type: "text",
            name: "description",
            text: Text.get("schema.service.attr.description"),
            desc: Text.get("schema.service.desc.description"),
            value: this.values.description || plugin.description,
            maxlength: 100
        });

        this.form.createElement({
            element: "input",
            type: "text",
            name: "comment",
            text: Text.get("schema.service.attr.comment"),
            desc: Text.get("schema.service.desc.comment"),
            value: this.values.comment,
            maxlength: 100
        });

        if (this.template === undefined) {
            this.form.createElement({
                element: "radio-yes-no",
                name: "active",
                text: Text.get("schema.service.attr.active"),
                desc: Text.get("schema.service.desc.active"),
                checked: this.values.active
            });
        }

        this.form.createElement({
            element: "radio-yes-no",
            name: "host_alive_check",
            text: Text.get("schema.service.attr.host_alive_check"),
            desc: Text.get("schema.service.desc.host_alive_check"),
            checked: this.values.host_alive_check
        });

        this.form.createElement({
            element: "radio-yes-no",
            name: "passive_check",
            text: Text.get("schema.service.attr.passive_check"),
            desc: Text.get("schema.service.desc.passive_check"),
            checked: this.values.passive_check
        });

        var intervalNullStrText = Text.get("text.inherited_from_host"),
            retryIntervalNullStrText = Text.get("text.inherited_from_host"),
            timeoutNullStrText = Text.get("text.inherited_from_host");

        // if it's a template, then this.host is undefined
        if (this.host) {
            intervalNullStrText += " ("+ Utils.secondsToStringShortReadable(this.host.interval) +")";
            retryIntervalNullStrText += " ("+ Utils.secondsToStringShortReadable(this.host.retry_interval) +")";
            timeoutNullStrText += " ("+ Utils.secondsToStringShortReadable(this.host.timeout) +")";
        }

        this.form.createElement({
            text: Text.get("schema.service.attr.interval"),
            desc: Text.get("schema.service.desc.interval"),
            element: "slider",
            name: "interval",
            options: this.options.interval,
            checked: this.values.interval,
            secondsToFormValues: true,
            nullString: intervalNullStrText
        });

        this.form.createElement({
            text: Text.get("schema.service.attr.retry_interval"),
            desc: Text.get("schema.service.desc.retry_interval"),
            element: "slider",
            name: "retry_interval",
            options: this.options.retry_interval,
            checked: this.values.retry_interval,
            secondsToFormValues: true,
            nullString: retryIntervalNullStrText
        });

        this.form.createElement({
            text: Text.get("schema.service.attr.timeout"),
            desc: Text.get("schema.service.desc.timeout"),
            element: "slider",
            name: "timeout",
            options: this.options.timeout,
            checked: this.values.timeout,
            secondsToFormValues: true,
            nullString: timeoutNullStrText
        });
    };

    object.createLocationMap = function() {
        /*
        var self = this,
            plugin = this.plugin,
            selected = {},
            locations = [],
            formData = this.form.getData(),
            options = formData.command_options;

        if (plugin.worldwide != "1") {
            return;
        }

        if (options) {
            if (options.check_type == "default") {
                selected[this.defaultLocation.city] = true;
            } else if (options.check_type == "failover") {
                $.each([ "fixed_checkpoint", "first_failover_checkpoint", "second_failover_checkpoint" ], function(i, key) {
                    if (options[key]) {
                        var id = options[key],
                            item = self.locationsById[id];
                        if (item) {
                            selected[item.city] = true;
                        }
                    }
                });
            } else if (options.check_type == "rotate") {
                $.each(this.locations, function(i, item) {
                    selected[item.city] = true;
                });
            } else if (options.check_type == "multiple" && options.locations) {
                $.each(options.locations, function(i, id) {
                    var item = self.locationsById[id];
                    if (item) {
                        selected[item.city] = true;
                    }
                });
            }
        }

        $.each(this.locations, function(i, item) {
            locations.push({
                name: item.city,
                ipaddr: item.ipaddr,
                x: item.coordinates.x,
                y: item.coordinates.y,
                color: selected[item.city] ? "#00ccff" : "#555555"
            });
        });

        if (this.map) {
            this.map.series[1].setData(locations, true);
        } else {
            this.map = Bloonix.highcharts.createLocationMap({
                container: "eu-map-container",
                data: locations
            });
            var infoBox = Utils.create("div")
                .addClass("chart-infobox")
                .html(Text.get("text.dashboard.double_click_or_mouse_wheel_to_zoom"))
                .hide()
                .appendTo("#eu-map-container");
            $("#eu-map-container").hover(
                function() { infoBox.show() },
                function() { infoBox.hide() }
            );
            this.map.mapZoom(0.45, 0, 0, -200, -150);
        }
        */
    };

    object.createCommandFormElements = function() {
        var self = this,
            boxes = this.createSettingsBox(Text.get("schema.service.text.command_options")),
            table = boxes.table,
            topBox = boxes.topBox,
            bottomBox = boxes.bottomBox,
            rightBox = boxes.rightBox,
            plugin = this.plugin,
            info = this.plugin.info,
            flags = [],
            multiple = [];

        if (info.options.length == 0) {
            Utils.create("div")
                .addClass("info-simple")
                .html(Text.get("schema.service.text.no_command_options"))
                .appendTo(topBox);
        }

        this.form.table = table.getTable();

        $.each(info.options, function(i, opt) {
            if (opt.value || opt.value_type) { // expects a value, opt.value is deprecated
                if (plugin.id == "58" && opt.option === "workflow") {
                    return true;
                } else if (opt.multiple) { // multiple values possible
                    multiple.push(opt);

                    if (self.action == "create" || !self.commandOptionsByOption[opt.option]) {
                        self.createMultipleOption(opt);
                    } else if (self.commandOptionsByOption[opt.option]) {
                        $.each(self.commandOptionsByOption[opt.option], function(i, value) {
                            self.createMultipleOption(opt, value);
                        });
                    }
                } else {
                    self.createOption(opt);
                }
            } else { // is a flag
                flags.push(opt);
            }
        });

        if (multiple.length) {
            Utils.create("p")
                .css({ "font-size": "14px", "font-weight": "bold", "margin-top": "20px" })
                .text(Text.get("info.add-further-options"))
                .appendTo(bottomBox);

            $.each(multiple, function(i, opt) {
                var btn = Utils.create("div")
                    .addClass("btn btn-white")
                    .text("+ "+ opt.name)
                    .appendTo(bottomBox);

                btn.click(function() {
                    self.form.table = table.getTable();
                    self.createMultipleOption(opt);
                });
            });
        }

        if (flags.length) {
            $.each(flags, function(i, flag) {
                var checked = self.action == "create"
                    ? flag.default
                    : self.commandOptionsByOption[flag.option];

                if (checked == undefined) {
                    checked = 0;
                }

                self.form.createElement({
                    element: "radio-yes-no",
                    name: "command_options:"+ flag.option,
                    text: flag.name,
                    desc: flag.description,
                    checked: checked
                });
            });
        }

        var exampleInfoBox = Utils.create("div")
            .addClass("command-examples")
            .hide()
            .appendTo(rightBox);

        if (info.examples) {
            Utils.create("h4")
                .html(Text.get("text.option_examples"))
                .appendTo(exampleInfoBox);

            $.each(info.examples, function(x, example) {
                var exampleDescription = example.description.join("<br/>");
                exampleDescription = exampleDescription.replace(/  /g, "&nbsp;&nbsp;");
                Utils.create("h5")
                    .html(exampleDescription)
                    .appendTo(exampleInfoBox);

                var exampleInfoTable = new Table({
                    type: "none",
                    appendTo: exampleInfoBox
                }).init();

                while (example.arguments.length > 0) {
                    var opt = example.arguments.shift(),
                        value = example.arguments.shift();

                    opt = self.pluginOptionsByOption[opt];

                    if (opt.multiple && info.thresholds) {
                        var key, op, val,
                            values = value.split(":");

                        if (values.length == 3) {
                            key = values[0];
                            op = self.getOperator(values[1]);
                            val = values[2];
                        } else {
                            key = values[0];
                            op = ">=";
                            val = values[1];
                        }

                        value = [ key, op, val ].join(" ");
                    }

                    // this is a flag (opt.value is deprecated)
                    if (!opt.value && !opt.value_type) {
                        value = Text.get("word.yes");
                    }

                    exampleInfoTable.createRow([ opt.name +":", value ]);
                }
            });

            exampleInfoBox.show();

            this.form.createElement({
                text: Text.get("schema.service.attr.agent_options.timeout"),
                desc: Text.get("schema.service.desc.agent_options.timeout"),
                element: "slider",
                name: "agent_options:timeout",
                options: [ 0, 10, 15, 30, 60, 90, 120 ],
                checked: this.values.agent_options.timeout || 0,
                secondsToFormValues: true,
                nullString: Text.get("text.default")
            });

            this.form.createElement({
                text: Text.get("schema.service.attr.agent_options.set_tags"),
                desc: Text.get("schema.service.desc.agent_options.set_tags"),
                element: "checkbox",
                name: "agent_options:set_tags",
                options: [ "timeout", "fatal", "security" ],
                checked: this.values.agent_options.set_tags,
                commaSeparatedList: true
            });
        }

        if (info.thresholds) {
            Utils.create("h4")
                .css({ "margin-top": "20px" })
                .html(Text.get("text.thresholds"))
                .appendTo(exampleInfoBox);

            Utils.create("h5")
                .css({ cursor: "pointer", "text-decoration": "underline" })
                .text("View a full list of all possible threshold options")
                .click(function() { self.showThresholdOptions(plugin) })
                .appendTo(exampleInfoBox);

            exampleInfoBox.show();
        }
    };

    object.createNotificationFormElements = function() {
        var boxes = this.createSettingsBox(Text.get("schema.service.text.notification_settings"));
        this.form.table = boxes.table.getTable();

        if (this.template === undefined) {
            this.form.createElement({
                text: Text.get("schema.service.attr.acknowledged"),
                desc: Text.get("schema.service.desc.acknowledged"),
                element: "radio-yes-no",
                name: "acknowledged",
                checked: this.values.acknowledged
            });

            this.form.createElement({
                text: Text.get("schema.service.attr.notification"),
                desc: Text.get("schema.service.desc.notification"),
                element: "radio-yes-no",
                name: "notification",
                checked: this.values.notification
            });
        }

        this.form.createElement({
            text: Text.get("schema.service.attr.attempt_max"),
            desc: Text.get("schema.service.desc.attempt_max"),
            element: "slider",
            name: "attempt_max",
            options: this.options.attempt_max,
            checked: this.values.attempt_max,
            mapValueToLabel: { "0": Text.get("schema.host.info.notification_disabled_short") }
        });

        var notificationIntervalText = Text.get("text.inherited_from_host");
        if (this.host) {
            notificationIntervalText += " ("+ Utils.secondsToStringShortReadable(this.host.notification_interval) +")";
        }

        this.form.createElement({
            text: Text.get("schema.service.attr.notification_interval"),
            desc: Text.get("schema.service.desc.notification_interval"),
            element: "slider",
            name: "notification_interval",
            options: this.options.notification_interval,
            checked: this.values.notification_interval,
            secondsToFormValues: true,
            nullString: notificationIntervalText
        });

        this.form.createElement({
            text: Text.get("schema.service.attr.attempt_warn2crit"),
            desc: Text.get("schema.service.desc.attempt_warn2crit"),
            element: "radio-yes-no",
            name: "attempt_warn2crit",
            checked: this.values.attempt_warn2crit
        });

        this.form.createElement({
            text: Text.get("schema.service.attr.fd_enabled"),
            desc: Text.get("schema.service.desc.fd_enabled"),
            element: "radio-yes-no",
            name: "fd_enabled",
            checked: this.values.fd_enabled
        });

        this.form.createElement({
            text: Text.get("schema.service.attr.fd_time_range"),
            desc: Text.get("schema.service.desc.fd_time_range"),
            element: "slider",
            name: "fd_time_range",
            options: this.options.fd_time_range,
            checked: this.values.fd_time_range,
            secondsToFormValues: true
        });

        this.form.createElement({
            text: Text.get("schema.service.attr.fd_flap_count"),
            desc: Text.get("schema.service.desc.fd_flap_count"),
            element: "slider",
            name: "fd_flap_count",
            options: this.options.fd_flap_count,
            checked: this.values.fd_flap_count
        });

        this.form.createElement({
            text: Text.get("schema.service.attr.is_volatile"),
            desc: Text.get("schema.service.desc.is_volatile"),
            element: "radio-yes-no",
            name: "is_volatile",
            checked: this.values.is_volatile
        });
    };

    object.createSubmitButton = function() {
        var self = this;
        this.form.button({
            name: "submit",
            text: this.action == "create" || this.action == "clone"
                ? Text.get("action.create")
                : Text.get("action.update"),
            appendTo: this.form.form
        });
    };

    object.create();
};
