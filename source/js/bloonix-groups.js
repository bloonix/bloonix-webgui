Bloonix.listGroups = function() {
    Bloonix.setTitle("schema.group.text.list");

    var table = new Table({
        url: "/administration/groups",
        header: {
            title: Text.get("schema.group.text.list"),
            pager: true,
            search: true,
            icons: [
                {
                    type: "help",
                    callback: function() { Utils.open("/#help/users-and-groups") },
                    title: Text.get("site.help.doc.users-and-groups")
                },{
                    type: "create",
                    callback: function() { Bloonix.route.to("administration/groups/create") },
                    title: Text.get("schema.group.text.create")
                }
            ]
        },
        searchable: {
            url: "/administration/groups/search/",
            result: [ "id", "groupname", "company", "description" ]
        },
        deletable: {
            title: Text.get("schema.group.text.delete"),
            url: "/administration/groups/:id/delete",
            result: [ "id", "groupname" ]
        },
        sortable: true,
        reloadable: true,
        columns: [
            {
                name: "id",
                text: Text.get("schema.group.attr.id"),
                hide: true
            },{
                name: "groupname",
                text: Text.get("schema.group.attr.groupname"),
                call: function(row) { return Bloonix.call("administration/groups/"+ row.id +"/edit", row.groupname) }
            },{
                name: "company",
                text: Text.get("schema.company.attr.company"),
                call: function(row) {
                    return Bloonix.call(
                        "administration/companies/"+ row.company_id +"/edit", row.company
                    );
                },
                hide: Bloonix.user.role == "admin" ? false : true
            },{
                name: "description",
                text: Text.get("schema.group.attr.description")
            }
        ]
    }).create();
};

Bloonix.editGroup = function(o) {
    var group = Bloonix.get("/administration/groups/"+ o.id +"/options");
    o.groupname = group.values.groupname;

    new Header({ title: Text.get("schema.group.text.settings") }).create();
    Bloonix.setTitle("schema.group.text.settings");
    Bloonix.showGroupSubNavigation();

    new Form({
        url: { submit: "/administration/groups/"+ o.id +"/update" },
        title: Text.get("schema.group.attr.id") + ": "+ o.id,
        appendTo: "#int-group-form",
        options: group.options,
        values: group.values,
        elements: Bloonix.getGroupFormElements()
    }).create();

    Bloonix.createHostGroupMemberForm(o);
    Bloonix.createUserGroupMember(o);
    Bloonix.createUserGroupMemberList(o);
    Bloonix.createUserGroupMemberForm(o);
};

Bloonix.createGroup = function() {
    var group = Bloonix.get("/administration/groups/options");
    new Header({ title: Text.get("schema.group.text.create") }).create();
    Bloonix.setTitle("schema.group.text.create");
    new Form({
        url: { submit: "/administration/groups/create" },
        action: "create",
        onSuccess: function(result) { Bloonix.route.to("administration/groups/"+ result.id +"/edit") },
        options: group.options,
        values: group.values,
        elements: Bloonix.getGroupFormElements()
    }).create();
};

Bloonix.getGroupFormElements = function() {
    return [
        {
            element: "select",
            name: "company_id",
            text: Text.get("schema.company.attr.company"),
            desc: Text.get("schema.group.desc.company"),
            required: true
        },{
            element: "input",
            type: "text",
            name: "groupname",
            text: Text.get("schema.group.attr.groupname"),
            desc: Text.get("schema.group.desc.groupname"),
            maxlength: 64,
            required: true
        },{
            element: "input",
            type: "text",
            name: "description",
            text: Text.get("schema.group.attr.description"),
            desc: Text.get("schema.group.desc.description"),
            maxlength: 100
        }
    ];
};

Bloonix.createHostGroupMemberForm = function(o) {
    var form = new Form();

    form.group({
        appendTo: "#int-host-form",
        title: Text.get("schema.group.text.group_members", o.groupname),
        subtitle: Text.get("schema.group.attr.id") +": "+ o.id,
        left: {
            title: Text.get("schema.group.text.host_members"),
            listURL: "/administration/groups/"+ o.id +"/members/hosts/list/",
            searchURL: "/administration/groups/"+ o.id +"/members/hosts/search/",
            updateMember: "/administration/groups/"+ o.id +"/members/hosts/remove/"
        },
        right: {
            title: Text.get("schema.group.text.host_nonmembers"),
            listURL: "/administration/groups/"+ o.id +"/members/hosts/list-non/",
            searchURL: "/administration/groups/"+ o.id +"/members/hosts/search-non/",
            updateMember: "/administration/groups/"+ o.id +"/members/hosts/add/"
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
                text: Text.get("schema.host.attr.ipaddr")
            }
        ],
        selectable: {
            key: "id",
            title: Text.get("schema.group.text.selected_hosts"),
            result: [ "id", "hostname", "ipaddr" ]
        },
        searchable: {
            result: [ "id", "hostname", "ipaddr" ]
        }
    });

    var userContainer = Utils.create("div")
        .attr("id", "int-user-group")
        .css({ width: "600px" })
        .appendTo("#int-user-form");

    Utils.create("div")
        .attr("id", "int-user-group-header")
        .appendTo(userContainer);

    Utils.create("div")
        .attr("id", "int-user-group-list-non")
        .css({ "text-align": "right" })
        .appendTo(userContainer);

    Utils.create("div")
        .attr("id", "int-user-group-list")
        .appendTo(userContainer);

    Utils.create("div")
        .addClass("clear")
        .appendTo(userContainer);
};

Bloonix.createUserGroupMember = function(o) {
    $("#int-user-group-header").html("");

    Utils.create("div")
        .addClass("form-title")
        .html(Text.get("schema.group.text.group_members", Utils.escape(o.groupname)))
        .appendTo("#int-user-group-header");

    Utils.create("div")
        .addClass("form-subtitle")
        .html(Text.get("schema.group.attr.id") +": "+ o.id)
        .appendTo("#int-user-group-header");
};

Bloonix.createUserGroupMemberList = function(o) {
    $("#int-user-group-list").html("");

    var table = new Table({
        url: "/administration/groups/"+ o.id +"/members/users/list/",
        appendTo: "#int-user-group-list",
        deletable: {
            title: Text.get("schema.group.text.remove_user"),
            url: "/administration/groups/"+ o.id +"/members/users/remove/",
            result: [ "username", "create_service", "update_service", "delete_service" ],
            buttonText: Text.get("action.remove"),
            successCallback: function() { Bloonix.refreshUserGroupForm(o) }
        },
        columns: [
            {
                name: "username",
                text: Text.get("schema.user.attr.username"),
                callback: function(row) { Bloonix.modifyUserGroupMember(o, "update", row) }
            },{
                name: "create_service",
                text: Text.get("schema.group.text.may_create_services"),
                bool: "yn"
            },{
                name: "update_service",
                text: Text.get("schema.group.text.may_modify_services"),
                bool: "yn"
            },{
                name: "delete_service",
                text: Text.get("schema.group.text.may_delete_services"),
                bool: "yn"
            }
        ]
    });

    table.create();
};

Bloonix.createUserGroupMemberForm = function(o) {
    $("#int-user-group-list-non").html("");

    Ajax.post({
        url: "/administration/groups/"+ o.id +"/members/users/list-non/",
        success: function(result) {
            if (result.status == "ok") {
                var options = [];
                $.each(result.data, function(i, row) {
                    options.push({ name: row.username, value: row.id });
                })
                new Form({ format: "medium" }).select({
                    placeholder: Text.get("schema.group.text.add_user"),
                    name: "user_id",
                    options: options,
                    appendTo: "#int-user-group-list-non",
                    callback: function(name, value) {
                        Bloonix.modifyUserGroupMember(
                            o, "add", {
                                username: name,
                                user_id: value,
                                create_service: 0,
                                update_service: 0,
                                delete_service: 0
                            }
                        );
                    },
                    resetPlaceholderAfterCallback: true,
                    passNameValue: true
                });
            }
        }
    });
};

Bloonix.modifyUserGroupMember = function(o, action, row) {
    var container = Utils.create("div");

    var form = new Form({
        id: "user-group-member",
        appendTo: container,
        showButton: false,
        title: row.username,
        elements: [
            {
                element: "radio-yes-no",
                name: "create_service",
                text: Text.get("schema.group.text.may_create_services")
            },{
                element: "radio-yes-no",
                name: "update_service",
                text: Text.get("schema.group.text.may_modify_services")
            },{
                element: "radio-yes-no",
                name: "delete_service",
                text: Text.get("schema.group.text.may_delete_services")
            },
        ],
        values: {
            create_service: row.create_service,
            update_service: row.update_service,
            delete_service: row.delete_service
        }
    }).create();

    new Overlay({
        title: Text.get("schema.group.text."+ action),
        content: container,
        buttons: [{
            content: Text.get("action."+ action),
            callback: function() {
                var data = form.getData();
                data.user_id = row.user_id;
                Ajax.post({
                    url: "/administration/groups/"+ o.id +"/members/users/"+ action +"/",
                    data: data,
                    async: false,
                    token: true,
                    success: function(updateResult) {
                        if (updateResult.status == "ok") {
                            Bloonix.refreshUserGroupForm(o);
                        }
                    }
                });
            }
        }]
    }).create();
};

Bloonix.refreshUserGroupForm = function(o) {
    Bloonix.createUserGroupMemberList(o);
    Bloonix.createUserGroupMemberForm(o);
};
