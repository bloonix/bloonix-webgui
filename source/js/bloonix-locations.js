Bloonix.listLocations = function() {
    Bloonix.setTitle("schema.location.text.list");

    new Table({
        url: "/administration/locations",
        header: {
            title: Text.get("schema.location.text.list"),
            icons: [{
                type: "create",
                callback: function() { Bloonix.route.to("administration/locations/create") },
                title: Text.get("schema.location.text.create")
            }]
        },
        deletable: {
            title: Text.get("schema.location.text.delete"),
            url: "/administration/locations/:id/delete/",
            result: [ "id", "continent", "country", "city" ]
        },
        reloadable: true,
        columns: [
            {
                name: "id",
                text: Text.get("schema.location.attr.id"),
                hide: true
            },{
                name: "hostname",
                text: Text.get("schema.location.attr.hostname"),
                call: function(row) { return Bloonix.call("administration/locations/"+ row.id +"/edit", row.hostname) }
            },{
                name: "ipaddr",
                text: Text.get("schema.location.attr.ipaddr")
            },{
                name: "continent",
                text: Text.get("schema.location.attr.continent")
            },{
                name: "country",
                text: Text.get("schema.location.attr.country")
            },{
                name: "city",
                text: Text.get("schema.location.attr.city")
            }
        ]
    }).create();
};

Bloonix.editLocation = function(o) {
    var location = Bloonix.get("/administration/locations/"+ o.id +"/options/");

    new Header({ title: Text.get("schema.location.text.view", location.values.hostname, true) }).create();
    Bloonix.setMetaTitle(Text.get("schema.location.text.view", location.values.hostname));

    new Form({
        url: { submit: "/administration/locations/"+ o.id +"/update/" },
        buttonText: Text.get("action.update"),
        values: location.values,
        options: location.options,
        elements: Bloonix.getLocationFormElements()
    }).create();
};

Bloonix.createLocation = function() {
    var location = Bloonix.get("/administration/locations/options/");

    new Header({ title: Text.get("schema.location.text.create") }).create();
    Bloonix.setTitle("schema.location.text.create");

    new Form({
        url: { submit: "/administration/locations/create/" },
        buttonText: Text.get("action.create"),
        values: location.values,
        options: location.options,
        elements: Bloonix.getLocationFormElements()
    }).create();
};

Bloonix.getLocationFormElements = function() {
    return [
        {
            element: "input",
            type: "text",
            name: "hostname",
            text: Text.get("schema.location.attr.hostname"),
            maxlength: 64,
            required: true
        },{
            element: "input",
            type: "text",
            name: "ipaddr",
            text: Text.get("schema.location.attr.ipaddr"),
            maxlength: 39,
            required: true
        },{
            element: "select",
            name: "continent",
            text: Text.get("schema.location.attr.continent"),
            required: true
        },{
            element: "select",
            name: "country",
            text: Text.get("schema.location.attr.country"),
            required: true
        },{
            element: "input",
            type: "text",
            name: "city",
            text: Text.get("schema.location.attr.city"),
            maxlength: 39,
            required: true
        },{
            element: "input",
            type: "text",
            name: "description",
            text: Text.get("schema.location.attr.description"),
            maxlength: 500
        }
    ];
};
