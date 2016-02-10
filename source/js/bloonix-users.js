Bloonix.listUsers = function() {
    Bloonix.setTitle("schema.user.text.list");

    var table = new Table({
        url: "/administration/users",
        header: {
            title: Text.get("schema.user.text.list"),
            pager: true,
            search: true,
            icons: [
                {
                    type: "help",
                    callback: function() { Utils.open("/#help/users-and-groups") },
                    title: Text.get("site.help.doc.users-and-groups")
                },{
                    type: "create",
                    callback: function() { Bloonix.route.to("administration/users/create") },
                    title: Text.get("schema.user.text.create")
                }
            ]
        },
        searchable: {
            url: "/administration/users/search/",
            result: [ "id", "username", "company", "name", "role" ]
        },
        deletable: {
            title: Text.get("schema.user.text.delete"),
            url: "/administration/users/:id/delete",
            result: [ "id", "username" ]
        },
        sortable: true,
        reloadable: true,
        columnSwitcher: {
            table: "user",
            callback: Bloonix.saveUserTableConfig,
            config: Bloonix.getUserTableConfig("user")
        },
        columns: [
            {
                name: "id",
                text: Text.get("schema.user.attr.id"),
                hide: true
            },{
                name: "username",
                text: Text.get("schema.user.attr.username"),
                call: function(row) { return Bloonix.call("administration/users/"+ row.id +"/edit", row.username) },
                swtichable: false
            },{
                name: "company",
                text: Text.get("schema.company.attr.company"),
                call: function(row) {
                    return Bloonix.call(
                        "administration/companies/"+ row.company_id +"/edit", row.company
                    )
                },
                hide: Bloonix.user.role == "admin" ? false : true,
                swtichable: false
            },{
                name: "name",
                text: Text.get("schema.user.attr.name")
            },{
                name: "phone",
                text: Text.get("schema.user.attr.phone")
            },{
                name: "manage_contacts",
                text: Text.get("schema.user.attr.manage_contacts"),
                hide: true,
                bool: "yn"
            },{
                name: "manage_templates",
                text: Text.get("schema.user.attr.manage_templates"),
                hide: true,
                bool: "yn"
            },{
                name: "last_login",
                text: Text.get("schema.user.attr.last_login")
            },{
                name: "is_logged_in",
                text: Text.get("schema.user.text.is_logged_in"),
                bool: "yn",
                sortable: false
            },{
                name: "session_expires",
                text: Text.get("schema.user.text.session_expires"),
                hide: true,
                sortable: false
            },{
                name: "locked",
                text: Text.get("schema.user.attr.locked"),
                hide: true,
                bool: "yn"
            },{
                name: "role",
                text: Text.get("schema.user.attr.role")
            },{ 
                name: "comment",
                text: Text.get("schema.user.attr.comment"),
                hide: true
            },{ 
                name: "allow_from",
                text: Text.get("schema.user.attr.allow_from"),
                hide: true
            },{ 
                name: "timezone",
                text: Text.get("schema.user.attr.timezone"),
                hide: true
            },{
                name: "operate_as",
                icons: [
                    {
                        check: function(row) {
                            if (Bloonix.user.role != "admin" || row.role == "admin") {
                                return false;
                            }
                            return true;
                        },
                        icon: "cicons arrow-right-orange",
                        title: Text.get("action.operate_as"),
                        link: "operateas/:id"
                    }
                ]
            }
        ]
    });

    table.create();
};

Bloonix.editUser = function(o) {
    var user = Bloonix.get("/administration/users/" + o.id +"/options");

    Bloonix.setTitle("schema.user.text.view", user.values.username);
    new Header({ title: Text.get("schema.user.text.view", user.values.username, true) }).create();

    new Form({
        url: { submit: "/administration/users/"+ o.id +"/update" },
        title: Text.get("schema.user.attr.id") +": "+ o.id,
        action: "update",
        values: user.values,
        options: user.options,
        elements: Bloonix.getUserFormElements()
    }).create();
};

Bloonix.createUser = function() {
    var user = Bloonix.get("/administration/users/options");

    Bloonix.setTitle("schema.user.text.create");
    new Header({ title: Text.get("schema.user.text.create") }).create();

    new Form({
        url: { submit: "/administration/users/create" },
        action: "create",
        values: user.values,
        options: user.options,
        elements: Bloonix.getUserFormElements()
    }).create();
};

Bloonix.getUserFormElements = function() {
    return [
        {
            element: "select",
            name: "company_id",
            text: Text.get("schema.company.attr.company"),
            desc: Text.get("schema.user.desc.company"),
            required: true
        },{
            element: "input",
            type: "email",
            name: "username",
            text: Text.get("schema.user.attr.username"),
            desc: Text.get("schema.user.desc.username"),
            minlength: 6,
            maxlength: 50,
            required: true
        },{
            element: "input",
            type: "text",
            name: "name",
            text: Text.get("schema.user.attr.name"),
            desc: Text.get("schema.user.desc.name"),
            maxlength: 50,
            required: true
        },{
            element: "input",
            type: "text",
            name: "phone",
            text: Text.get("schema.user.attr.phone"),
            desc: Text.get("schema.user.desc.phone"),
            maxlength: 100
        },{
            element: "select",
            name: "timezone",
            text: Text.get("schema.user.attr.timezone"),
            desc: Text.get("schema.user.desc.timezone")
        },{
            element: "select",
            name: "role",
            text: Text.get("schema.user.attr.role"),
            desc: Text.get("schema.user.desc.role"),
            required: true
        },{
            element: "radio-yes-no",
            name: "manage_contacts",
            text: Text.get("schema.user.attr.manage_contacts"),
            desc: Text.get("schema.user.desc.manage_contacts"),
            required: true
        },{
            element: "radio-yes-no",
            name: "manage_templates",
            text: Text.get("schema.user.attr.manage_templates"),
            desc: Text.get("schema.user.desc.manage_templates"),
            required: true
        },{
            element: "input",
            type: "text",
            name: "password",
            text: Text.get("schema.user.attr.password"),
            desc: Text.get("schema.user.desc.password"),
            minlength: 8,
            maxlength: 128,
            genString: 30,
            required: true
        },{
            element: "input",
            type: "text",
            name: "authentication_key",
            text: Text.get("schema.user.attr.authentication_key"),
            desc: Text.get("schema.user.desc.authentication_key"),
            minlength: 30,
            maxlength: 128,
            genString: 30
        },{
            element: "radio-yes-no",
            name: "password_changed",
            text: Text.get("schema.user.attr.password_changed"),
            desc: Text.get("schema.user.desc.password_changed"),
            required: true
        },{
            element: "radio-yes-no",
            name: "locked",
            text: Text.get("schema.user.attr.locked"),
            desc: Text.get("schema.user.desc.locked"),
            required: true
        },{
            element: "input",
            type: "text",
            name: "allow_from",
            text: Text.get("schema.user.attr.allow_from"),
            desc: Text.gets(["schema.user.desc.allow_from", "text.allow_from_desc"]),
            maxlength: 300
        },{
            element: "input",
            type: "text",
            name: "comment",
            text: Text.get("schema.user.attr.comment"),
            desc: Text.get("schema.user.desc.comment"),
            maxlength: 200
        }
    ];
};

Bloonix.saveUserConfig = function(key, data, updateInfo) {
    Ajax.post({
        url: "/user/config/save",
        data: { key: key, data: data },
        async: false,
        token: true,
        success: function(result) {
            if (result.status == "ok") {
                if (key === "dashboard") {
                    Bloonix.user.stash[key][data.name] = data.data;
                } else {
                    Bloonix.user.stash[key] = result.data;
                }
                if (updateInfo !== false) {
                    Bloonix.createNoteBox({
                        infoClass: "info-ok",
                        text: Text.get("info.update_success"),
                        autoClose: true
                    });
                }
            }
        }
    });
};

Bloonix.saveUserTableConfig = function(o) {
    Ajax.post({
        url: "/user/config/save-table-config",
        data: o,
        async: false,
        success: function(result) {
            if (result.status == "ok") {
                if (typeof Bloonix.user.stash.table_config != "object") {
                    Bloonix.user.stash.table_config = {};
                }
                if (typeof Bloonix.user.stash.table_config[o.table] != "object") {
                    Bloonix.user.stash.table_config[o.table] = {};
                }
                Bloonix.user.stash.table_config[o.table][o.column] = o.action;
                Bloonix.createNoteBox({
                    infoClass: "info-ok",
                    text: Text.get("info.update_success"),
                    autoClose: true
                });
            }
        }
    });
};

Bloonix.getUserTableConfig = function(table) {
    if (Bloonix.user.stash.table_config) {
        return Bloonix.user.stash.table_config[table];
    }
};

Bloonix.changeUserPassword = function(o) {
    var opts = Utils.extend({ force: false }, o),
        content = Utils.create("div");

    var overlay = new Overlay({
        title: Text.get("schema.user.text.password_update"),
        content: content,
        visible: true
    });

    if (opts.force) {
        overlay.closeText = Text.get("action.abort");
        overlay.closeCallback = function() { location.href = "/logout" };
    }

    var form = new Form({
        url: { submit: "/user/passwd" },
        onSuccess: function() {
            overlay.close();
            if (opts.force) {
                location.href = "/";
            } else {
                Bloonix.createNoteBox({
                    infoClass: "info-ok",
                    text: Text.get("update.success")
                });
            }
        },
        format: "medium",
        appendTo: content,
        showButton: false
    }).create();

    form.input({
        name: "current",
        type: "password",
        placeholder: Text.get("schema.user.text.current_password"),
        appendTo: form.form
    });

    Utils.create("br").appendTo(form.form);

    form.input({
        name: "new",
        type: "password",
        placeholder: Text.get("schema.user.text.new_password"),
        maxlength: 128,
        minlength: 8,
        appendTo: form.form
    });

    Utils.create("br").appendTo(form.form);

    form.input({
        name: "repeat",
        type: "password",
        placeholder: Text.get("schema.user.text.repeat_password"),
        appendTo: form.form
    });

    Utils.create("br").appendTo(form.form);

    form.button({
        text: Text.get("action.update"),
        appendTo: form.form
    });

    overlay.create();

    if (opts.force) {
        throw new Error();
    }
};

Bloonix.changeUserSettings = function() {
    Bloonix.changeUserPassword();
};

Bloonix.changeUserLanguage = function() {
    var content = Utils.create("div");

    var table = new Table({
        type: "vtable",
        appendTo: content
    }).init();

    $.each([
        { text: "English", flag: "gb", lang: "en" },
        { text: "Deutsch", flag: "de", lang: "de" },
        { text: "Italiano", flag: "it", lang: "it" }
    ], function(i, item) {
        var row = table.createFormRow(
            Utils.create("span")
                .addClass("f32")
                .html( Utils.create("span").addClass("flag "+ item.flag) ),
            item.text
        );

        row.tr.css({ cursor: "pointer" });
        row.tr.click(function() {
            Ajax.post({
                url: "/lang/"+ item.lang,
                success: function() {
                    location.href = "/";
                }
            });
        });
    });

    Utils.create("p")
        .css({ width: "300px", "font-size": "12px", "margin-top": "15px" })
        .html( Text.get("schema.user.desc.select_language") )
        .appendTo(content);

    var overlay = new Overlay({
        title: Text.get("schema.user.text.select_language"),
        content: content
    }).create();
};
