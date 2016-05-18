var Form = function(o) {
    this.byKey = {};
    this.values = {};
    this.elements = [];
    Utils.extend(this, o);
};

Form.prototype = {
    autocomplete: false,
    format: "tall",
    appendTo: "#content",
    showButton: true,
    buttonText: false,
    action: false,
    // url: { submit: "/submit/url/", options: "/options/url/" }
    url: false,
    // onSuccess: function(result) {}
    onSuccess: false,
    // hasData is only for internal usage!
    hasData: false,
    // classes
    titleClass: "form-title",
    subtitleClass: "form-subtitle",
    errorClass: "form-error",
    successClass: "form-success",
    infoClass: "form-info",
    warningClass: "form-warning",
    tableClass: "form-table",
    descInfoClass: "form-table-desc-info",
    elementInfoClass: "form-table-element-info",
    formClass: false,
    createTable: false
};

Form.prototype.init = function() {
    this.container = Utils.create("div");
    this.msgbox();

    this.form = Utils.create("form")
        .appendTo(this.container);

    if (this.preventDefault) {
        this.form.submit(function(e) {
            e.preventDefault();
        });
    }

    if (this.formClass) {
        this.form.addClass(this.formClass);
    }

    if (this.appendTo) {
        this.container.appendTo(this.appendTo);
    }

    if (this.createTable === true) {
        this.table = new Table({
            type: "form",
            appendTo: this.form
        }).init().getTable();
    }

    return this;
};

Form.prototype.getContainer = function() {
    return this.form;
};

/*
    new Form().input({
        id: "id",
        type: "tel",
        name: "foo",
        value: "bar"
    });
*/
Form.prototype.input = function(o) {
    var object = Utils.extend({
        id: false,
        type: "text",
        readonly: false,
        required: false,
        placeholder: false,
        minlength: false,
        maxlength: false,
        minvalue: false,
        maxvalue: false,
        pattern: false,
        autocomplete: false,
        name: "not-available",
        value: undefined,
        appendTo: false,
        inputClass: false,
        bubbleOuterClass: false,
        bubbleClass: false,
        bubbleCloseIconClass: "hicons-gray hicons remove close-x",
        bubbleAlignment: "center right",
        bubbleWidth: false,
        genStrIconClass: "gicons-gray gicons refresh gicons-input-icon-default",
        format: this.format,
        form: this,
        width: false
    }, o);

    object.getBubbleOuterClass = function() {
        var align = this.getBubbleAlignment();
        return this.bubbleOuterClass || "i-bubble-"+ this.format +"-"+ align +"-outer";
    };

    object.getBubbleClass = function() {
        var align = this.getBubbleAlignment();
        return this.bubbleClass || "i-bubble-base i-bubble-"+ this.format +"-"+ align;
    };

    object.getClass = function() {
        return this.inputClass || "input input-"+ this.format;
    };

    object.getValue = function() {
        return this.input.val();
    };

    object.setValue = function(value) {
        return this.input.val(value);
    };

    object.clear = function() {
        this.input.val("");
    };

    object.getContainer = function() {
        return this.container;
    };

    object.getBubbleAlignment = function() {
        var align;
        if (!this.bubbleAlignment || this.bubbleAlignment == "center right") {
            align = "cr";
        } else if (this.bubbleAlignment == "bottom left") {
            align = "bl";
        }
        return align;
    };

    object.create = function() {
        var self = this;

        this.container = Utils.create("div")
            .css({ position: "relative", display: "inline-block" });

        this.input = Utils.create("input")
            .attr("type", this.type)
            .attr("name", this.name)
            .attr("data-name", this.name)
            .addClass(this.getClass())
            .appendTo(this.container);

        if (this.width) {
            this.input.css({ width: this.width });
        }

        if (this.autocomplete && this.autocomplete[this.name]) {
            new Autocomplete({
                format: this.format,
                source: this.autocomplete[this.name],
                container: this.container,
                input: this.input,
                start: 0
            }).create();
        }

        $.each(["id","placeholder","minlength","maxlength","minvalue","maxvalue","pattern"], function(i, key) {
            if (self[key] != false) {
                self.input.attr(key, self[key]);
            }
        });

        this.form.addInputValidator(this, "input", "val");

        $.each(["readonly","required"], function(i, key) {
            if (self[key] != false) {
                self.input.attr(key, key);
            }
        });

        if (this.genString) {
            Utils.create("span")
                .attr("title", Text.get("action.generate_string"))
                .tooltip()
                .addClass(this.genStrIconClass)
                .appendTo(this.container)
                .click(function(){ self.input.val(Utils.genRandStr(self.genString)) });
        }

        if (this.type == "password" && this.value) {
            this.input.attr("value", "************");
        } else if (this.value != undefined) {
            this.input.attr("value", this.value);
        }

        if (this.appendTo != false) {
            this.container.appendTo(this.appendTo);
        }
    };

    object.create();
    return object;
};

/*
    new Form().textarea({
        id: "id",
        name: "foo",
        value: "bar"
    });
*/
Form.prototype.textarea = function(o) {
    var object = Utils.extend({
        id: false,
        type: "text",
        readonly: false,
        required: false,
        placeholder: false,
        minlength: false,
        maxlength: false,
        name: "not-available",
        value: false,
        appendTo: false,
        textareaClass: false,
        bubbleOuterClass: false,
        bubbleClass: false,
        bubbleCloseIconClass: "i-bubble-close-button",
        bubbleCloseText: "x",
        genStrIconClass: "gicons-gray gicons refresh gicons-input-icon-default",
        format: this.format,
        form: this,
        css: false
    }, o);

    object.getBubbleOuterClass = function() {
        return this.bubbleOuterClass || "i-bubble-"+ this.format +"-cr-outer";
    };

    object.getBubbleClass = function() {
        return this.bubbleClass || "i-bubble-base i-bubble-"+ this.format +"-cr";
    };

    object.getClass = function() {
        return this.textareaClass || "textarea textarea-"+ this.format;
    };

    object.getValue = function() {
        this.textarea.text();
    };

    object.getContainer = function() {
        return this.container;
    };

    object.create = function() {
        var self = this;

        this.container = Utils.create("div")
            .css({ position: "relative", display: "inline-block" });

        this.textarea = Utils.create("textarea")
            .attr("name", this.name)
            .attr("data-name", this.name)
            .addClass(this.getClass())
            .text(this.value)
            .appendTo(this.container);

        if (this.css !== false) {
            this.textarea.css(this.css);
        }

        $.each(["id","placeholder","minlength","maxlength","minvalue","maxvalue"], function(i, key) {
            if (self[key] != false) {
                self.textarea.attr(key, self[key]);
            }
        });

        $.each(["readonly","required"], function(i, key) {
            if (self[key] != false) {
                self.textarea.attr(key, key);
            }
        });

        if (this.genString) {
            Utils.create("span")
                .attr("title", Text.get("action.generate_string"))
                .tooltip()
                .addClass(this.genStrIconClass)
                .appendTo(this.container)
                .click(function(){ self.textarea.val(Utils.genRandStr(self.genString)) });
        }

        this.form.addInputValidator(this, "textarea", "html");

        if (this.appendTo != false) {
            this.container.appendTo(this.appendTo);
        }
    };

    object.create();
    return object;
};

/*
    +-------------------------------------------------------------+
    |  (div) select-container                                     | 
    |                                                             |
    |  +-------------------------------------------------------+  |
    |  | (input) hidden input field                            |  |
    |  +-------------------------------------------------------+  |
    |                                                             |
    |  +-------------------------------------------------------+  |
    |  | (div) select                                          |  |
    |  |                                                       |  |
    |  | +------------------------+ +------------------------+ |  |
    |  | | (span) select-selected | | (span) select-caret    | |  |
    |  | +------------------------+ +------------------------+ |  |
    |  +-------------------------------------------------------+  |
    |                                                             |
    |  +-------------------------------------------------------+  |
    |  | (ul) select-list                                      |  |
    |  |                                                       |  |
    |  |                                                       |  |
    |  |                                                       |  |
    |  +-------------------------------------------------------+  |
    +-------------------------------------------------------------+

    select-container    - The container to place all elements.
    hidden input        - To save the selected item from the select list (has no class).
                          The input field is useable for jQuery.serializeArray().
    select              - The select drop down box.
    select-selected     - The selected item from the select list (has no class).
    select-caret        - A drop down image.
    select-list         - The item list that is opened on click.

    new Form().select({
        id: "id",
        placeholder: "This field is required",
        selected: "bar",
        appendTo: "xxx",
        options: [
            { name: "foo", value: "foo" },
            { name: "bar", value: "bar" },
            { name: "baz", value: "baz" }
        ]
    });

    A selected item can be marked with
        selected: "value"

    or with
        options: [
            { name: "foo", value: "foo", selected: true }
        ]
*/
Form.prototype.select = function(o) {
    var object = Utils.extend({
        id: false,
        appendTo: false,
        placeholder: "-",
        format: this.format,
        form: this,
        name: false,
        values: false,
        selected: false,
        callback: false,
        required: false,
        passNameValue: false,
        containerClass: false,
        dropDownClass: false,
        selectedClass: false,
        caretClass: false,
        listClass: false,
        getValueName: false,
        requiredMarkerClass: "rwb",
        short: false,
        width: false,
        fontSize: false,
        readOnly: false,
        store: false
    }, o);

    object.getContainerClass = function() {
        return this.containerClass || "select-container";
    };

    object.getDropDownClass = function() {
        return this.mainClass || "select select-"+ this.format;
    };

    object.getCaretClass = function() {
        return this.caretClass || "select-caret";
    };

    object.getListClass = function() {
        return this.listClass || "select-list-"+ this.format
    };

    object.getSelected = function() {
        return { option: this.selectSelected.text(), value: this.hiddenInput.val() };
    };

    object.getSelectedOption = function() {
        return this.selected.data("value");
    };

    object.getSelectedValue = function() {
        return this.hiddenInput.val();
    };

    object.destroy = function() {
        this.container.remove();
    };

    object.toggle = function() {
        if (this.selectList.is(":hidden")) {
            this.selectList.show();
        } else {
            this.selectList.hide();
        }
    };

    object.getContainer = function() {
        return this.container;
    };

    object.create = function() {
        var self = this;

        this.container = Utils.create("div")
            .addClass(this.getContainerClass())
            .click(function() { self.toggle() });

        if (this.id != false) {
            this.container.attr("id", this.id);
        }

        this.hiddenInput = Utils.create("input")
            .attr("type", "hidden")
            .attr("name", this.name)
            .appendTo(this.container);

        if (this.selected != false) {
            this.hiddenInput.attr("value", this.selected);
        }

        this.selectDropDown = Utils.create("div")
            .attr("data-name", this.name)
            .addClass(this.getDropDownClass())
            .appendTo(this.container);

        if (this.title) {
            this.selectDropDown.attr("title", this.title).tooltip();
        }

        if (self.required == true) {
            this.selectDropDown.addClass(this.requiredMarkerClass);
        }

        this.selectSelected = Utils.create("span")
            .html(this.placeholder)
            .appendTo(this.selectDropDown);

        this.selectCaret = Utils.create("span")
            .addClass(this.getCaretClass())
            .appendTo(this.selectDropDown);

        this.selectList = Utils.create("ul")
            .addClass(this.getListClass())
            .appendTo(this.container);

        if (this.short) {
            this.selectDropDown.css({ width: "130px" });
            this.selectList.css({ "min-width": "130px" });
        }

        if (this.width) {
            this.selectDropDown.css({ width: this.width });
            this.selectList.css({ "min-width": this.width });
        }

        if (this.maxHeight) {
            this.selectList.css({ "max-height": this.maxHeight });
        }

        if (this.options) {
            if (this.secondsToFormValues == true) {
                this.addOptions(
                    Utils.secondsToFormValues(this.options, this.nullString)
                );
            } else {
                this.addOptions(this.options);
            }
        }

        if (this.appendTo) {
            this.container.appendTo(this.appendTo);
        };
    };

    object.addOptions = function(options) {
        var self = this;

        $.each(options, function(i, item) {
            var name, value, raw, addClass;

            if (typeof item == "object") {
                name = item.name || item.label || item.option || item.key;
                value = item.value;
                addClass = item.addClass;
            } else {
                name = value = item;
            }

            if (self.getValueName) {
                name = self.getValueName(value);
            }

            var onClick = function() {
                if (self.store) {
                    self.store.to[self.store.as] = value;
                }

                if (self.readOnly == false) {
                    self.hiddenInput.val(value);
                    self.selectSelected.html(name);
                    self.selectList.find("li").removeAttr("selected");
                    $(this).attr("selected", "selected");
                    if (self.required == true && self.hiddenInput.val() != undefined) {
                        self.selectDropDown.removeClass(self.requiredMarkerClass);
                    }
                }
                if (self.callback) {
                    if (self.passNameValue == true) {
                        self.callback(name, value);
                    } else {
                        self.callback(value);
                    }
                }
            };

            var option = Utils.create("li")
                .attr("data-value", value)
                .html(name)
                .click(onClick)
                .appendTo(self.selectList);

            if (self.showValue === true) {
                Utils.create("span")
                    .text(" ("+ value +")")
                    .appendTo(option);
            }

            if (addClass) {
                option.addClass(addClass);
            }

            if (value == self.selected) {
                self.hiddenInput.val(value);
                self.selectSelected.html(name);
                self.selected = option;
                option.attr("selected", "selected");
                if (self.hiddenInput.val() != undefined) {
                    self.selectDropDown.removeClass(self.requiredMarkerClass);
                }
                if (self.store) {
                    self.store.to[self.store.as] = value;
                }
            }
        });
    };

    object.replaceOptions = function(o) {
        this.selectList.html("");
        this.hiddenInput.val("");
        if (!o.selected) {
            this.selectSelected.html(this.placeholder);
        }
        this.selected = o.selected;
        this.options = o.options;
        this.addOptions(o.options);
    };

    object.create();
    return object;
};

Form.prototype.multiselect = function(o) {
    var object = Utils.extend({
        id: false,
        appendTo: false,
        format: this.format,
        form: this,
        size: 5,
        name: false,
        values: false,
        selected: false,
        callback: false,
        required: false,
        listClass: false,
        getValueName: false
    }, o);

    object.getContainer = function() {
        return this.container;
    };

    object.getListClass = function() {
        return this.listClass || "input input-"+ this.format
    };

    object.create = function() {
        var self = this;

        this.container = Utils.create("div");

        this.hiddenInput = Utils.create("input")
            .attr("type", "hidden")
            .attr("name", this.name)
            .attr("value", "")
            .appendTo(this.container);

        this.selectList = Utils.create("select")
            .attr("name", this.name)
            .attr("data-name", this.name)
            .attr("multiple", "multiple")
            .attr("size", this.size)
            .addClass(this.getListClass())
            .appendTo(this.container);

        if (this.id) {
            this.container.attr("id", this.id);
        }

        if (this.selected) {
            if (this.selected && typeof this.selected == "string") {
                this.selected = this.selected.split(",");
            }
            var selected = this.selected;
            this.selected = {};
            $.each(selected, function(i, x) {
                this.selected[x] = true;
            });
        } else {
            this.selected = {};
        }

        $.each(this.options, function(i, item) {
            var name, value, raw;

            if (typeof item == "object") {
                name = item.name || item.label || item.option || item.key;
                value = item.value;
            } else {
                name = value = item;
            }

            if (self.getValueName) {
                name = self.getValueName(value);
            }

            var option = Utils.create("option")
                .attr("value", value)
                .html(name)
                .appendTo(self.selectList);

            if (self.selected[value]) {
                option.attr("selected", "selected");
            }
        });

        if (this.appendTo) {
            this.container.appendTo(this.appendTo);
        }
    };

    object.create();
    return object;
};

/*
    new Form().radio({
        id: "id",
        checked: "bar",
        appendTo: "xxx",
        options: [
            { label: "foo", value: "foo" },
            { label: "bar", value: "bar" },
            { label: "baz", value: "baz" }
        ]
    });

    A checked radio button can be marked with
        checked: "value"

    or with
        options: [
            { label: "foo", value: "foo", checked: true }
        ]
*/
Form.prototype.radio = function(o) {
    var object = Utils.extend({
        id: false,
        appendTo: false,
        format: this.format,
        form: this,
        name: false,
        options: false,
        checked: false,
        callback: false,
        onClick: false,
        passNameValue: false,
        containerClass: false,
        radioClass: false,
        itemsPerRow: false,
        bool: false
    }, o);

    object.getClass = function() {
        return this.radioClass || "radio radio-"+ this.format;
    };

    object.getContainer = function() {
        return this.container;
    };

    object.create = function() {
        var self = this;

        this.container = Utils.create("div")
            .addClass(this.getClass());

        if (this.id) {
            this.container.attr("id", this.id);
        }

        if (this.bool) {
            this.options = [
                { value: 0, label: Text.get("bool.yesno.0"), checked: self.checked == "0" ? true : false },
                { value: 1, label: Text.get("bool.yesno.1"), checked: self.checked == "1" ? true : false }
            ];
        }

        var itemCounter = 0;

        $.each(this.options, function(i, item) {
            itemCounter++;

            var attrID = "radio-"+ self.name + i,
                label, value, checked;

            if (typeof item == "object") {
                label = item.label || item.name || item.option || item.key || item.icon || item.hicon;
                value = item.value;
                checked = item.checked;
            } else {
                label = value = item;
                checked = this.checked == name ? true : false;
            }

            var radio = Utils.create("input")
                .attr("type", "radio")
                .attr("id", attrID)
                .attr("name", self.name)
                .attr("value", value)
                .appendTo(self.container);

            if (item.checked || self.checked == value) {
                radio.attr("checked", "checked");
                if (self.callback) {
                    self.callback(value);
                }
            }

            if (self.callback) {
                radio.click(function() { self.callback(value) });
            }

            if (self.store) {
                radio.click(function() {
                    self.store.to[self.store.as] = value;
                });
            }

            if (self.onClick) {
                radio.click(function() { self.onClick(value) });
            }

            var labelObject = Utils.create("label")
                .attr("for", attrID)
                .appendTo(self.container);

            if (item.icon) {
                labelObject.html(label)
            } else if (item.hicon) {
                labelObject.html(
                    Utils.create("span")
                        .addClass("hicons hicons-white "+ item.hicon)
                        .css({ "margin-top": "3px" })
                );
            } else {
                labelObject.text(label);
            }

            if (item.title) {
                labelObject.attr("title", item.title).tooltip();
            } else if (self.title && self.bool && value == 1) {
                labelObject.attr("title", self.title).tooltip();
            }

            if (self.itemsPerRow) {
                label.css({ width: "26px", "padding-top": "6px", "padding-bottom": "6px" });
                if (itemCounter == self.itemsPerRow) {
                    itemCounter = 0;
                    Utils.create("br").appendTo(self.container);
                }
            }
        });

        if (this.appendTo) {
            this.container.appendTo(this.appendTo);
        }
    };

    object.create();
    return object;
};

/*
    new Form().checkbox({
        name: "status",
        options: [ "OK", "WARNING", "CRITICAL", "UNNKOWN", "INFO" ],
        checked: "OK,CRITICAL",
        commaSeparatedList: true
    });
*/
Form.prototype.checkbox = function(o) {
    var object = Utils.extend({
        id: false,
        appendTo: false,
        format: this.format,
        form: this,
        name: false,
        options: false,
        checked: false,
        callback: false,
        passNameValue: false,
        checkboxClass: false,
        commaSeparatedList: false
    }, o);

    object.getClass = function() {
        return this.checkboxClass || "checkbox checkbox-"+ this.format;
    };

    object.getCheckedValues = function() {
        var checkedValues = [];
        this.container.find("input:checked").each(function() {
            checkedValues.push($(this).val());
        });
        return checkedValues;
    };

    object.getContainer = function() {
        return this.container;
    };

    object.create = function() {
        var self = this,
            checked = {};

        if (this.commaSeparatedList == true) {
            if (this.checked) {
                this.checked = this.checked.split(",");
            } else {
                this.checked = [];
            }
        }

        if ($.isArray(this.checked)) {
            $.each(this.checked, function(i, key) {
                checked[key] = true;
            });
        }

        this.container = Utils.create("div")
            .attr("data-name", this.name)
            .addClass(this.getClass());

        /*
            How to handle checkboxes: If no checkbox is checked in a form
            then the browser send nothing, but sometimes we want an empty
            list instead. For this reason an empty input hidden field is
            added. The server should remove the first element if this
            is empty.

                foo=""
                foo=1
                foo=2
                foo=3

            The result is foo=[1,2,3].

                foo=""

            This would be an empty list and the result is foo=[].
        */

        Utils.create("input")
            .attr("type", "hidden")
            .attr("name", self.name)
            .attr("value", "")
            .appendTo(this.container);

        $.each(this.options, function(i, option) {
            var attrID = "int-"+ self.name + i;

            if (typeof option == "string" || typeof option == "number") {
                option = {
                    label: option,
                    value: option,
                    checked: checked[option]
                };
            }

            var checkbox = Utils.create("input")
                .attr("id", attrID)
                .attr("type", "checkbox")
                .attr("name", self.name)
                .attr("value", option.value)
                .appendTo(self.container);

            if (option.checked) {
                checkbox.attr("checked", "checked");
            }

            if (self.store) {
                checkbox.click(function() {
                    self.store.to[self.store.as] = self.getCheckedValues();
                });
            }

            var label = Utils.create("label")
                .attr("for", attrID)
                .appendTo(self.container);

            if (self.emptyLabel != true) {
                label.html(option.label || option.value);
            }

            if (option.title) {
                label.attr("title", option.title).tooltip();
            }
        });

        if (this.store) {
            this.store.to[this.store.as] = this.getCheckedValues();
        }

        if (this.appendTo) {
            this.container.appendTo(this.appendTo);
        }
    };

    object.create();
    return object;
};

Form.prototype.slider = function(o) {
    var object = Utils.extend({}, o);

    object.getContainer = function() {
        return this.container;
    };

    object.create = function() {
        var self = this,
            max = -1,
            val = 0,
            options = this.options;

        this.container = Utils.create("div")
            .attr("data-name", this.name)
            .addClass("option-slider-container");

        this.slideContainer = Utils.create("div")
            .addClass("option-slider")
            .appendTo(this.container);

        this.labelContainer = Utils.create("div")
            .addClass("option-slider-label")
            .appendTo(this.container);

        this.input = Utils.create("input")
            .attr("type", "hidden")
            .attr("name", this.name)
            .attr("value", "")
            .appendTo(this.container);

        if (this.secondsToFormValues == true) {
            if (self.checked !== undefined) {
                var hit = false;
                $.each(options, function(i, option) {
                    console.log(option, "===", self.checked);
                    if (option == self.checked) {
                        hit = true;
                        return false;
                    }
                });
                if (hit === false) {
                    options.unshift(self.checked);
                }
            }
            options = Utils.secondsToFormValues(options, this.nullString)
        }

        this.options = [];
        $.each(options, function(i, option) {
            var label, value, checked;

            if (typeof option == "string" || typeof option == "number") {
                value = label = option;
                checked = self.checked == value ? true : false;
            } else {
                value = option.value;
                label = option.label || option.name || option.option || option.key;
                checked = self.checked == value ? true : option.checked;
            }

            if (typeof self.mapValueToLabel == "object" && self.mapValueToLabel[value] !== undefined) {
                label = self.mapValueToLabel[value];
            }

            if (self.getValueName) {
                label = self.getValueName(value);
            }

            self.options.push({ label: label, value: value });
            max += 1;

            if (checked == true) {
                val = max;
                self.select(val);
            }
        });

        this.slideContainer.slider({
            min: 0,
            max: max,
            value: val,
            slide: function(event, ui) { self.select(ui.value) }
        });

        if (this.appendTo) {
            this.container.appendTo(this.appendTo);
        }
    };

    object.select = function(pos) {
        var option = this.options[pos];
        this.input.val(option.value);
        this.labelContainer.html(option.label);
    };

    object.create();
    return object;
};

Form.prototype.iconList = function(o) {
    var object = Utils.extend({
        checked: false,
        items: false,
        even: false,
        multiple: false,
        buttonsPerRow: undefined,
        callback: false,
        css: false
    }, o);

    object.create = function() {
        var self = this,
            buttonsPerRow = this.buttonsPerRow;
        this.cache = [];
        this.container = Utils.create("div");

        // items = [ { name: "This is Foo", value: "foo", checked: true } ]
        $.each(this.options, function(i, item) {
            var name, value, checked, title;

            if (typeof item == "object") {
                if (item.icon) {
                    name = Utils.create("span").addClass(item.icon);
                } else {
                    name = item.label || item.name || item.option || item.key || item.value;
                }
                value = item.value;
                checked = self.checked == value ? true : item.checked;
                title = item.title;
            } else {
                name = value = item;
                checked = self.checked == name ? true : value;
            }

            var button = Utils.create("div")
                .addClass("btn btn-white")
                .html(name)
                .appendTo(self.container)
                .click(function() {
                    self.switchItem(value);
                    if (self.callback) {
                        self.callback(value);
                    }
                });

            if (self.css) {
                button.css(self.css);
            }

            if (item.icon) {
            //    button.addClass("btn-icon-unselected");
            }

            if (self.even == true) {
                button.addClass("btn-icon-even");
            }

            if (title) {
                button.attr("title", title).tooltip();
            }

            if (buttonsPerRow != undefined) {
                buttonsPerRow = buttonsPerRow - 1
                if (buttonsPerRow == 0) {
                    buttonsPerRow = self.buttonsPerRow;
                    Utils.create("br").appendTo(self.container);
                }
            }

            self.cache.push({
                value: value,
                button: button,
                input: false,
                icon: item.icon ? true : false
            });

            if (checked == true) {
                self.switchItem(value);
            }
        });

        if (this.appendTo) {
            this.container.appendTo(this.appendTo);
        }
    };

    object.switchItem = object.switchTo = function(value) {
        if (this.multiple) {
            this.switchMultipleItems(value);
        } else {
            this.switchSingleItem(value);
        }
    };

    object.switchMultipleItems = function(value) {
        var self = this;
        $.each(this.cache, function(i, item) {
            if (item.value == value) {
                if (item.input) {
                    item.input.remove();
                    item.input = false;
                    item.button.removeClass("btn-selected");
                } else {
                    item.input = self.createInput(value);
                    item.button.addClass("btn-selected");
                }
            }
        });
    };

    object.switchSingleItem = function(value) {
        var self = this;
        $.each(this.cache, function(i, item) {
            if (item.value == value && item.input == false) {
                item.input = self.createInput(value);
                item.button.addClass("btn-selected");
            } else if (item.value != value && item.input) {
                item.input.remove();
                item.input = false;
                item.button.removeClass("btn-selected");
            }
        });
    };

    object.createInput = function(value) {
        return Utils.create("input")
            .attr("type", "hidden")
            .attr("name", this.name)
            .attr("value", value)
            .appendTo(this.container);
    };

    object.create();
    return object;
};

Form.prototype.button = function(o) {
    var object = Utils.extend({
        id: false,
        appendTo: false,
        format: this.format,
        form: this,
        name: false,
        value: false,
        text: Text.get("action.submit"),
        callback: false,
        css: false,
        buttonClass: false
    }, o);

    object.getClass = function() {
        return this.buttonClass || "btn btn-white btn-"+ this.format;
    };

    object.getContainer = function() {
        return this.button;
    };

    object.create = function() {
        var self = this;

        this.button = Utils.create("div")
            .addClass(this.getClass())
            .html(this.text)
            .click(function(){
                if (self.callback) {
                    self.callback();
                } else {
                    self.form.submit();
                }
            });

        if (this.css) {
            this.button.css(this.css);
        }

        $.each([ "id", "name", "value" ], function(i, key) {
            if (this[key]) {
                this.button.attr(key, this[key]);
            }
        });

        if (this.appendTo) {
            this.button.appendTo(this.appendTo);
        }
    };

    object.create();
    return object;
};

Form.prototype.datetime = function(o) {
    var object = Utils.extend({
        id: false,
        name: false,
        placeholder: false,
        value: false,
        addClass: false,
        appendTo: false,
        format: this.format,
        readonly: false,
        zIndex: 3,
        maxlength: 17,
        ampm: false,
        timeFormat: "hh:mm:ss",
        dateFormat: "yy-mm-dd",
        stepMinute: 15
    }, o);

    object.getClass = function() {
        return this.addClass || "input input-"+ this.format;
    };

    object.clear = function() {
        this.input.val("");
    };

    object.setValue = function(value) {
        this.input.val(value);
    };

    object.create = function() {
        this.input = Utils.create("input")
            .attr("type", "text")
            .attr("maxlength", this.maxlength)
            .addClass(this.getClass())
            .css({ "z-index": this.zIndex });

        if (this.id) {
            this.input.attr("id", this.id);
        }
        if (this.readonly) {
            this.input.attr("readonly", "readonly");
        }
        if (this.name) {
            this.input.attr("name", this.name);
            this.input.attr("data-name", this.name);
        }
        if (this.placeholder) {
            this.input.attr("placeholder", this.placeholder);
        }
        if (this.value != false) {
            this.input.attr("value", this.value);
        }
        if (this.appendTo) {
            this.input.appendTo(this.appendTo);
        }

        this.input.datetimepicker({
            ampm: this.ampm,
            timeFormat: this.timeFormat,
            dateFormat: this.dateFormat,
            stepMinute: this.stepMinute
        });
    };

    object.create();
    return object;
};

/*
    Here we are to create full automatic a form
    that is pressed into a 2-column-table.
*/
Form.prototype.create = function() {
    Log.debug("create a new form");

    var self = this;
    this.container = this.appendTo;

    if (this.url && this.url.options && this.hasData == false) {
        return this.getOptions();
    }

    if (this.values == undefined) {
        this.values = {};
    }

    if (this.options == undefined) {
        this.options = {};
    }

    if (this.title) {
        Utils.create("div")
            .addClass(this.titleClass)
            .html(this.title)
            .appendTo(this.container);
    }

    if (this.subtitle) {
        Utils.create("div")
            .addClass(this.subtitleClass)
            .html(this.subtitle)
            .appendTo(this.container);
    }

    this.msgbox();

    this.form = Utils.create("form")
        .appendTo(this.container);

    this.table = Utils.create("table")
        .addClass(this.tableClass)
        .appendTo(this.form);

    if (this.action) {
        this.buttonText = Text.get("action."+ this.action);
    }

    if (this.showButton == true) {
        this.button({
            appendTo: this.form,
            buttonText: this.buttonText
        }).button.css({ "margin-bottom": "20px" });
    }

    $.each(this.elements, function(i, e) {
        self.createElement(e);
    });

    return this;
};

Form.prototype.createElement = function(e) {
    this.byKey[e.name] = e;

    var table = e.table || this.table,
        tr = Utils.create("tr").appendTo(table),
        th = Utils.create("th").appendTo(tr),
        td = Utils.create("td").appendTo(tr),
        value = e.value == undefined ? this.values[e.name] : e.value;

    if (e.text) {
        th.html(Utils.escape(e.text));
    }

    if (e.element == "multiselect" || e.element == "textarea") {
        th.css({ "vertical-align": "top", "padding-top": "12px" });
    }

    if (e.required == true) {
        Utils.create("span").html(" * ").appendTo(th);
    }

    var hasDesc = false,
        descBox = Utils.create("div");

    Utils.create("h2")
        .html(e.text)
        .appendTo(descBox);

    if (e.desc) {
        hasDesc = true;
        Utils.create("p")
            .html(e.desc)
            .appendTo(descBox);
    }

    if (e.minlength != undefined || e.maxlength != undefined || e.minvalue != undefined || e.maxvalue != undefined) {
        hasDesc = true;
        var small = Utils.create("small")
            .appendTo(descBox);

        if (e.minlength != undefined) {
            Utils.create("div")
                .html(Text.get("text.min_length", e.minlength))
                .appendTo(small);
        }
        if (e.maxlength != undefined) {
            Utils.create("div")
                .html(Text.get("text.max_length", e.maxlength))
                .appendTo(small);
        }
        if (e.minvalue != undefined && e.maxvalue != undefined) {
            Utils.create("div")
                .html(Text.get("text.range_value", [ e.minvalue, e.maxvalue ]))
                .appendTo(small);
        } else if (e.minvalue != undefined) {
            Utils.create("div")
                .html(Text.get("text.min_value", e.minvalue))
                .appendTo(small);
        } else if (e.maxvalue != undefined) {
            Utils.create("div")
                .html(Text.get("text.max_value", e.maxvalue))
                .appendTo(small);
        }
    }

    if (hasDesc == true) {
        new iButton({ text: descBox, width: e.descBoxWidth, css: e.descBoxCss }).appendTo(th);
    }

    var copy = Utils.extend({}, e);
    delete copy.element;
    copy.appendTo = td;

    if (e.element == "radio-yes-no") {
        copy.bool = true;
        copy.checked =  this.getCheckedValue(e);
        this.radio(copy);
    } else if (e.element == "radio") {
        copy.options = e.options || this.options[e.name];
        copy.checked = this.getCheckedValue(e);
        this.radio(copy);
    } else if (e.element == "input") {
        copy.value = value;
        copy.autocomplete = this.autocomplete;
        this.input(copy);
    } else if (e.element == "textarea") {
        copy.value = value;
        this.textarea(copy);
    } else if (e.element == "checkbox") {
        copy.options = e.options || this.options[e.name];
        copy.checked = this.getCheckedValue(e);
        this.checkbox(copy);
    } else if (e.element == "select" || e.element == "multiselect") {
        copy.options = e.options || this.options[e.name];
        copy.selected = this.getCheckedValue(e);
        this[e.element](copy);
    } else if (e.element == "slider") {
        copy.options = e.options || this.options[e.name];
        copy.checked = this.getCheckedValue(e);
        this.slider(copy);
    }

    if (e.descInfo) {
        Utils.create("div")
            .addClass(this.descInfoClass)
            .text(e.descInfo)
            .appendTo(th);
    }

    if (e.elementInfo) {
        Utils.create("div")
            .addClass(this.elementInfoClass)
            .text(e.elementInfo)
            .appendTo(td);
    }
};

Form.prototype.getCheckedValue = function(e) {
    if (e.selected != undefined) {
        return e.selected;
    }
    if (e.checked != undefined) {
        return e.checked;
    }
    if (this.values[e.name] != undefined) {
        return this.values[e.name];
    }
};

Form.prototype.submit = function() {
    var self = this,
        data = this.getData();

    this.messageContainer.hide();
    this.messageContainer.removeClass(this.errorClass);
    this.messageContainer.removeClass(this.successClass);

    if (this.submitCallback) {
        this.submitCallback(data);
        return false;
    }

    if (this.processDataCallback) {
        data = this.processDataCallback(data);
    }

    Ajax.post({
        url: this.url.submit,
        data: data,
        async: false,
        token: true,
        success: function(result) {
            if (result.status == "ok") {
                if (self.onSuccess) {
                    self.onSuccess(result.data);
                } else {
                    self.messageContainer.addClass(self.successClass);
                    self.messageContainer.html(
                        self.action === "create"
                            ? Text.get("info.create_success")
                            : Text.get("info.update_success")
                    );
                    self.messageContainer.fadeIn(400);
                    $("#content-outer").scrollTop(0);
                    setTimeout(function() { self.messageContainer.fadeOut(400) }, 3000);
                }
            } else {
                self.messageContainer.addClass(self.errorClass);
                self.messageContainer.html(Utils.escape(result.data.message));
                self.messageContainer.fadeIn(400);
                if (result.data.failed) {
                    self.markErrors(result.data.failed);
                }
                $("#content-outer").scrollTop(0);
            }
        }
    });
};

Form.prototype.msgbox = function(o) {
    if (!o) {
        o = { appendTo: this.container };
    }
    this.messageContainer = Utils.create("div")
        .hide()
        .appendTo(o.appendTo || this.container || this.appendTo);
};

Form.prototype.markErrors = function(names) {
    var self = this;
    $.each(names, function(i, name) {
        Log.debug("[data-name='" + name + "']");
        var object = self.form.find("[data-name='" + name + "']").addClass("rwb");
    });
};

Form.prototype.removeErrors = function() {
    this.form.find(".rwb").removeClass("rwb");
};

Form.prototype.table = function() {
    return new Table({ type: "form" }).init();
};

Form.prototype.getData = function() {
    var self = this,
        formData = this.form.serializeArray(),
        data = {};

    this.removeErrors();

    $.each(formData, function(i, e) {
        var keyOpts = self.byKey[e.name];

        // The token is not in list... so skip undefined options
        if (keyOpts != undefined &&
            (keyOpts.element == "checkbox" ||
            keyOpts.element == "multiselect" ||
            keyOpts.forceArray == true)
        ) {
            if (data[e.name] == undefined) {
                data[e.name] = [ ];
                // If the first value is empty then it's from
                // the hidden input field to force an array.
                if (e.value == undefined || e.value == "") {
                    return true;
                }
            }
            data[e.name].push(e.value);
        } else if (data[e.name] == undefined) {
            data[e.name] = e.value;
        } else {
            if (typeof data[e.name] != "object") {
                data[e.name] = [ data[e.name] ];
            }
            data[e.name].push(e.value);
        }
    });

    if (this.postpareDataCallback) {
        this.postpareDataCallback(data);
    }
    if (this.overwriteDataCallback) {
        data = this.overwriteDataCallback(data);
    }

    if (this.splice) {
        $.each(this.splice, function(i, str) {
            data[str] = {};
            $.each(data, function(key, value) {
                // option:warning
                var parts = key.split(":"),
                    spliceKey = parts.shift(),
                    inputName = parts.join(":");

                if (spliceKey == str && inputName) {
                    data[spliceKey][inputName] = value;
                    delete data[key];
                }
            });
        });
    }

    return data;
};

Form.prototype.setOption = function(opt, key, value) {
    if (!this.byKey[opt]) {
        this.byKey[opt] = {};
    }
    this.byKey[opt][key] = value;
};

Form.prototype.getOptions = function() {
    var self = this;
    this.hasData = true;

    Ajax.post({
        url: this.url.options,
        async: false,
        success: function(result) {
            self.options = result.data.options;
            self.values = result.data.values;
            self.create();
        }
    });
};

/*
    +------------------------------------------------------------------------------------+
    | this.container                                                                     |
    | +--------------------------------------------------------------------------------+ |
    | | this.titleContainer                                                            | |
    | | +----------------------------------------------------------------------------+ | |
    | | | this.title                                                                 | | |
    | | +----------------------------------------------------------------------------+ | |
    | | +----------------------------------------------------------------------------+ | |
    | | | this.subtitle                                                              | | |
    | | +----------------------------------------------------------------------------+ | |
    | +--------------------------------------------------------------------------------+ |
    | +-------------------------+ +------------------------+ +-------------------------+ |
    | | this.left.container     | | this.button.container  | | this.right.container    | |
    | | +---------------------+ | | +--------------------+ | | +---------------------+ | |
    | | | this.left.title     | | | | this.button.add    | | | | this.right.title    | | |
    | | +---------------------+ | | | this.button.remove | | | +---------------------+ | |
    | | +---------------------+ | | |                    | | | +---------------------+ | |
    | | | this.left.search    | | | |                    | | | | this.right.search   | | |
    | | | this.left.selected  | | | |                    | | | | this.right.selected | | |
    | | +---------------------+ | | |                    | | | +---------------------+ | |
    | | +---------------------+ | | |                    | | | +---------------------+ | |
    | | | this.left.table     | | | |                    | | | | this.right.table    | | |
    | | |                     | | | |                    | | | |                     | | |
    | | |                     | | | |                    | | | |                     | | |
    | | |                     | | | |                    | | | |                     | | |
    | | |                     | | | |                    | | | |                     | | |
    | | |                     | | | |                    | | | |                     | | |
    | | +---------------------+ | | |                    | | | +---------------------+ | |
    | | +---------------------+ | | |                    | | | +---------------------+ | |
    | | | this.left.pager     | | | |                    | | | | this.right.pager    | | |
    | | +---------------------+ | | |                    | | | +---------------------+ | |
    | +-------------------------+ +------------------------+ +-------------------------+ |
    +------------------------------------------------------------------------------------+

    Each Id consists of a prefix, the keyword 'int' and a postfix.

        #prefix-int-postfix

    The prefix is the parent Id of the hole group container.
    The postfix is the usage of a inner container like title, button and so on.

    new Form().group({
        title: "Title",
        subtitle: "Subtitle",
        left: {
            title:
            listURL:
            searchURL:
            updateURL:
        },
        right: {
            title:
            listURL:
            searchURL:
            updateURL:
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
        ]
    });
*/
Form.prototype.group = function(o) {
    var object = Utils.extend({
        appendTo: false,
        boxWidth: "500px",
        titleClass: "form-title",
        subtitleClass: "form-subtitle",
        cache: { selected: { left: {}, right: {} } },
        button: {},
        form: this
    }, o);

    object.create = function() {
        this.createMainBox();
        this.createBox(this.left);
        this.createButtonBox();
        this.createBox(this.right);
        this.createTable(this.left);
        this.createTable(this.right);
    };

    object.createMainBox = function() {
        this.container = Utils.create("div");

        if (this.appendTo) {
            this.container.appendTo(this.appendTo);
        }

        this.messageContainer = Utils.create("div")
            .appendTo(this.container);

        this.titleContainer = Utils.create("div")
            .appendTo(this.container);

        if (this.title) {
            this.title = Utils.create("div")
                .addClass(this.titleClass)
                .html(this.title)
                .appendTo(this.titleContainer);
        }

        if (this.subtitle) {
            this.subtitle = Utils.create("div")
                .addClass(this.subtitleClass)
                .html(this.subtitle)
                .appendTo(this.titleContainer);
        }
    };

    object.createBox = function(o) {
        o.container = Utils.create("div")
            .css({ width: this.boxWidth, display: "inline-block", "vertical-align": "top" })
            .appendTo(this.container);

        o.titleContainer = Utils.create("div")
            .appendTo(o.container);

        o.title = Utils.create("h3")
            .addClass("h3")
            .html(o.title || "")
            .appendTo(o.container);

        o.counterContainer = Utils.create("div")
            .css({ float: "right", "margin-left": "6px", "margin-top": "5px" })
            .appendTo(o.container);

        o.searchContainer = Utils.create("div")
            .css({ float: "right", "margin-left": "6px" })
            .appendTo(o.container);

        Utils.create("div")
            .addClass("clear")
            .appendTo(o.container);

        o.selected = Utils.create("div")
            .attr("title", Text.get("action.show_selected_objects"))
            .addClass("btn btn-white btn-small")
            .html("0")
            .appendTo(o.counterContainer)
            .tooltip();

        o.tableContainer = Utils.create("div")
            .appendTo(o.container);

        o.pagerContainer = Utils.create("div")
            .appendTo(o.container);
    };

    object.createButtonBox = function() {
        var self = this;

        // button container
        this.button.container = Utils.create("div")
            .css({ width: "40px", padding: "0 13px", display: "inline-block", "vertical-align": "top" })
            .appendTo(this.container);

        // remove button
        this.button.add = Utils.create("span")
            .attr("title", Text.get("action.remove"))
            .css({ "margin-top": "92px" })
            .addClass("btn btn-white btn-icon")
            .html(Utils.create("span").addClass("hicons hicons-white chevron-right"))
            .appendTo(this.button.container)
            .tooltip()
            .click(function() { self.addOrRemove("add") });

        // add button
        this.button.remove = Utils.create("span")
            .attr("title", Text.get("action.add"))
            .addClass("btn btn-white btn-icon")
            .html(Utils.create("span").addClass("hicons hicons-white chevron-left"))
            .appendTo(this.button.container)
            .tooltip()
            .click(function() { self.addOrRemove("remove") });
    };

    object.createTable = function(o) {
        o.table = new Table({
            url: o.listURL,
            postdata: { offset: 0, limit: 10 },
            appendTo: o.tableContainer,
            selectable: {
                key: this.selectable.key,
                title: this.selectable.title,
                result: this.selectable.result,
                counter: { update: o.selected, hideIfNull: false }
            },
            searchable: {
                url: o.searchURL,
                result: this.searchable.result,
                resultWidth: "400px",
                appendTo: o.searchContainer
            },
            pager: {
                appendTo: o.pagerContainer
            },
            showBottomPagerBox: false,
            columns: this.columns
        }).create();
    };

    object.addOrRemove = function(action) {
        var self = this,
            postdata = {},
            o = action == "add" ? this.left : this.right;

        postdata[this.selectable.key] = o.table.getSelectedIds();

        if (postdata[this.selectable.key].length === 0) {
            this.showError605();
            return false;
        }

        Ajax.post({
            url: o.updateMember,
            data: postdata,
            token: true,
            success: function(result) {
                if (result.status == "ok") {
                    self.left.table.clearSelectedRows();
                    self.left.table.getData();
                    self.right.table.clearSelectedRows();
                    self.right.table.getData();
                } else if (result.status == "err-605") {
                    self.showError605();
                }
            }
        });
    };

    object.showError605 = function() {
        var self = this;

        var message = Utils.create("div")
            .addClass(this.form.errorClass)
            .html(Text.get("text.please_select_objects"))
            .appendTo(this.messageContainer);

        setTimeout(function() {
            message.fadeOut(400);
            setTimeout(function() {
                message.remove();
            }, 400);
        }, 3000);
    };

    object.create();
    return object;
};

Form.prototype.addInputValidator = function(object, type, getValue) {
    return;

    var bubble = Utils.create("div")
        .addClass(object.getBubbleOuterClass())
        .hide()
        .appendTo(object.container);

    var innerBubble = Utils.create("div")
        .addClass(object.getBubbleClass())
        .appendTo(bubble);

    var textBox = Utils.create("p")
        .html("0")
        .appendTo(innerBubble);

    if (object.bubbleWidth) {
        innerBubble.css({ "max-width": object.bubbleWidth });
    }

    var validate = function() {
        var len = object[type][getValue]().length,
            text = "";

        if ((object.minlength && len < object.minlength) || (object.maxlength && len > object.maxlength)) {
            bubble.fadeIn(300);
            if (object.minlength != undefined) {
                text += "Min length: "+ object.minlength + "<br/>";
            }
            if (object.maxlength != undefined) {
                text += "Max length: "+ object.maxlength + "<br/>";
            }
            text += "Current length: "+ len;
        } else {
            bubble.fadeOut(100);
        }

        textBox.html(text);
    };

    object[type].blur(function() { bubble.fadeOut(100) });
    object[type].focus(validate);
    object[type].keyup(validate);
};

/*
    desc({
        title: "Foo",
        desc: "This is foo",
        note: "Max length: 100"
    });

    desc({
        text: "<h2>Foo</h2><p>This is foo</p><small>Max length: 100</small>"
    });
*/
Form.prototype.desc = function(o) {
    var descBox = Utils.create("div");

    if (o.title) {
        Utils.create("h2")
            .html(o.title)
            .appendTo(descBox);
    }

    if (o.desc) {
        Utils.create("p")
            .html(o.desc)
            .appendTo(descBox);
    }

    if (o.note) {
        Utils.create("small")
            .html(o.note)
            .appendTo(descBox);
    }

    if (o.text) {
        descBox.append(o.text);
    }

    var button = new iButton({ text: descBox, width: o.width });

    if (o.appendTo) {
        button.appendTo(o.appendTo);
    }

    return button;
};
