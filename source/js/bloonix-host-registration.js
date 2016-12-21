Bloonix.listRegisteredHosts = function(o) {
    var object = Utils.extend({
        postdata: { offset: 0, limit: 100 },
        appendTo: "#content"
    }, o);

    object.addSelectedHostsToGroup = function() {
        var self = this,
            selectedIds = this.table.getSelectedIds();

        if (selectedIds.length == 0) {
            Bloonix.createNoteBox({ text: Text.get("schema.host.text.multiple_selection_help") });
            return;
        }

        var content = Utils.create("div"),
            options = Bloonix.get("/administration/hosts/options"),
            overlay, form;

        overlay = new Overlay({
            title: Text.get("schema.host.text.add_hosts_to_group"),
            content: content,
            closeText: Text.get("action.abort"),
            buttons: [{
                content: Text.get("action.add"),
                close: false,
                callback: function(content, overlay) {
                    form.submit();
                }
            }]
        });

        form = new Form({
            url: { submit: "/hosts/registered/update" },
            processDataCallback: function(data) {
                data.host_id = self.table.getSelectedIds();
                return data;
            },
            onSuccess: function() {
                Bloonix.getRegisteredHostCount();
                overlay.close();
                self.table.clearSelectedRows();
                self.table.getData();
            },
            appendTo: content,
            showButton: false
        }).init();

        form.table = new Table({
            type: "form",
            appendTo: form.form
        }).init().getTable();

        form.createElement({
            element: "multiselect",
            name: "group_id",
            text: Text.get("schema.host.text.add_host_to_group"),
            options: options.options.group_id
        });

        form.createElement({
            element: "multiselect",
            name: "contactgroup_id",
            text: Text.get("schema.host.text.add_host_to_contactgroup"),
            options: options.options.contactgroup_id
        });

        form.createElement({
            element: "multiselect",
            name: "host_template_id",
            text: Text.get("schema.host.text.add_host_to_host_template"),
            options: options.options.host_template_id
        });

        overlay.create();
    };

    object.delSelectedHosts = function() {
        var self = this,
            selectedIds = this.table.getSelectedIds();

        if (selectedIds.length == 0) {
            Bloonix.createNoteBox({ text: Text.get("schema.host.text.multiple_selection_help") });
            return;
        }

        var content = Utils.create("div");

        var overlay = new Overlay({
            title: Text.get("schema.host.text.delete_reg_hosts"),
            content: content
        });

        Utils.create("div")
            .addClass("btn btn-white btn-medium")
            .html(Text.get("schema.host.action.delete_reg_hosts"))
            .appendTo(overlay.content)
            .click(function() {
                Bloonix.hostServiceAction(
                    "/hosts/registered/delete",
                    { host_id: selectedIds }
                );
                self.table.getData();
                Bloonix.getRegisteredHostCount();
                overlay.close();
            });

        overlay.create();
    };

    object.listHosts = function() {
        var self = this;

        Bloonix.setTitle("schema.host.text.list");

        Utils.create("span")
            .attr("title", Text.get("schema.host.text.add_hosts_to_group"))
            .tooltip()
            .addClass("footer-button")
            .html(Utils.create("div").addClass("hicons-white hicons plus"))
            .appendTo("#footer-left")
            .click(function() { self.addSelectedHostsToGroup() });

        Utils.create("span")
            .attr("title", Text.get("schema.host.text.delete_reg_hosts"))
            .tooltip()
            .addClass("footer-button")
            .html(Utils.create("div").addClass("hicons-white hicons trash"))
            .appendTo("#footer-left")
            .click(function() { self.delSelectedHosts() });

        var counterButton = Utils.create("span")
            .attr("title", Text.get("text.selected_objects"))
            .tooltip()
            .addClass("footer-button")
            .text("0")
            .hide()
            .appendTo("#footer-left");

        this.table = new Table({
            url: "/hosts/registered/list",
            header: {
                title: Text.get("schema.host.text.registered_host_list"),
                pager: true,
                search: true,
                replace: true
            },
            sortable: true,
            selectable: {
                result: [ "id", "hostname", "ipaddr", "ipaddr6" ],
                counter: { update: counterButton }
            },
            searchable: {
                url: "/hosts/registered/search",
                result: [ "id", "hostname", "ipaddr", "ipaddr6" ],
                value: this.postdata.query
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
                },{
                    name: "ipaddr6",
                    text:  Text.get("schema.host.attr.ipaddr6")
                },{
                    name: "host_templates",
                    text: Text.get("schema.host_template.text.templates")
                }
            ]
        }).create();
    };

    object.listHosts();
    return object;
};
