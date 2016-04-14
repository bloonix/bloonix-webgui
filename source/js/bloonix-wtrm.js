Bloonix.WTRM = function(o) {
    var object = Utils.extend({
        appendTo: "#content",
        header: true,
        preload: false
    }, o);

    object.stepId = 0;
    object.maxSteps = 50;
    object.stepCounter = 0;
    object.steps = {};

    object.getNewStepId = function(id) {
        if (id == undefined) {
            this.stepId++;
            return this.stepId;
        }

        if (parseInt(id) > parseInt(this.stepId)) {
            this.stepId = id;
        }

        return id;
    };

    object.create = function() {
        this.getActions();
        this.createStruct();
        this.createForm();
        this.createResultBoxes();
        this.preloadSteps();
    };

    object.getActions = function() {
        var self = this;
        this.actions = Bloonix.get("/wtrm/actions");
        this.actionsByName = {};
        $.each(this.actions, function(i, item) {
            self.actionsByName[item.action] = item;
        });
    };

    object.createStruct = function() {
        if (this.header == true) {
            new Header({
                title: Text.get("site.wtrm.text.wtrm_workflow"),
                border: true,
                appendTo: this.appendTo
            }).create();
        }
        this.outerBox = Utils.create("div")
            .addClass("wtrm-outer-box")
            .attr("data-name", "command_options:workflow")
            .appendTo(this.appendTo);
        this.infoBox = Utils.create("div")
            .addClass("info-err")
            .hide()
            .appendTo(this.outerBox);
        this.formBox = Utils.create("div")
            .appendTo(this.outerBox);
        this.stepBox = Utils.create("div")
            .appendTo(this.outerBox);
    };

    object.createForm = function() {
        var self = this,
            actions = [];

        this.form = new Form({
            format: "large",
            appendTo: this.formBox
        }).init();

        $.each(this.actions, function(i, item) {
            var addClass = /^do/.test(item.action)
                ? "wtrm-action"
                : "wtrm-check";

            var name = Utils.create("span");

            Utils.create("span")
                .html(Text.get("site.wtrm.action."+ item.action))
                .appendTo(name);

            actions.push({
                name: name,
                value: item.action,
                addClass: addClass
            });
        });

        this.selectBox = Utils.create("div").appendTo(this.form.getContainer());

        this.select = this.form.select({
            placeholder: "Add an action",
            appendTo: this.selectBox,
            options: actions,
            readOnly: true,
            callback: function(action) { self.createOrUpdateStep(action) }
        });

        this.button = Utils.create("div")
            .css({ "margin-left": "20px" })
            .addClass("btn btn-white btn-tall")
            .html(Text.get("site.wtrm.text.check_it"))
            .appendTo(this.selectBox)
            .click(function() { self.runTest() });

        this.button = Utils.create("div")
            .css({ "margin-left": "4px" })
            .addClass("btn btn-white btn-tall")
            .html(Text.get("site.wtrm.text.quick_check"))
            .appendTo(this.selectBox)
            .click(function() { self.runTest(true) });
    };

    object.createResultBoxes = function() {
        var self = this;

        this.transactionOuterBox = Utils.create("div")
            .addClass("wtrm-outer")
            .appendTo(this.stepBox);

        this.transactionInnerBox = Utils.create("div")
            .addClass("wtrm-inner")
            .appendTo(this.transactionOuterBox);

        this.transactionBox = Utils.create("ul")
            .addClass("wtrm-steps")
            .appendTo(this.transactionInnerBox)
            .sortable({ stop: function() { self.reNumberSteps() } });
    };

    object.createOrUpdateStep = function(action, id) {
        this.infoBox.hide();

        if (action === "doSwitchToParentFrame" || action === "doSwitchToNewPage" || action === "doSwitchToMainPage") {
            this.addStep(action, {});
            return;
        }

        var self = this,
            config = this.actionsByName[action],
            content = Utils.create("div").css({ "margin-bottom": "60px" });

        var form = new Form({
            format: "medium",
            appendTo: content,
            preventDefault: true
        }).init();

        var table = new Table({
            type: "form",
            appendTo: form.getContainer()
        }).init();

        form.table = table.getTable();

        $.each(config.options, function(i, item) {
            var name = item.name,
                mandatory = item.mandatory,
                value;

            if (id) {
                value = self.steps[id].attrs[name];
            }

            if (name == "hidden") {
                form.createElement({
                    element: "radio-yes-no",
                    name: name,
                    text: Text.get("site.wtrm.attr."+ name),
                    desc: Text.get("site.wtrm.desc."+ name),
                    checked: value === "1" ? "1" : 0
                });
            } else if (name == "event") {
                form.createElement({
                    element: "radio",
                    name: name,
                    text: Text.get("site.wtrm.attr."+ name),
                    desc: Text.get("site.wtrm.desc."+ name),
                    checked: value,
                    options: [ "change", "keypress", "keyup", "keydown", "focus" ]
                });
            } else {
                form.createElement({
                    element: "input",
                    type: "text",
                    name: name,
                    value: value,
                    text: Text.get("site.wtrm.attr."+ name),
                    desc: Text.get("site.wtrm.desc."+ name),
                    placeholder: Text.get("site.wtrm.placeholder."+ name),
                    mandatory: mandatory
                });
            }
        });

        new Overlay({
            title: Text.get("site.wtrm.action."+ action),
            content: content,
            buttons: [{
                content: id ? Text.get("action.update") : Text.get("action.add"),
                close: false,
                callback: function(a, c) {
                    var attrs = self.validateStep(action, form);

                    if (attrs) {
                        if (id) {
                            self.updateStep(id, attrs);
                        } else {
                            self.addStep(action, attrs);
                        }
                        c.close();
                    }
                },
            }],
            width: "600px"
        }).create();
    };

    object.validateStep = function(action, form, step) {
        var self = this,
            config = this.actionsByName[action],
            data = Utils.filterEmptyValues(form.getData()),
            markErrors;

        data.action = action;

        Ajax.post({
            url: "/wtrm/validate/step",
            data: data,
            async: false,
            success: function(result) {
                if (result.status == "err-610") {
                    markErrors = result.data.failed;
                }
            }
        });

        if (markErrors) {
            form.markErrors(markErrors);
            return false;
        }

        return data;
    };

    object.addStep = function(action, attrs) {
        var self = this;

        var addClass = /^do/.test(action)
            ? "wtrm-action"
            : "wtrm-check";

        var stepId = this.getNewStepId(attrs.id);

        var step = Utils.create("li")
            .attr("data-id", stepId)
            .addClass("wtrm-step")
            .appendTo(this.transactionBox);

        this.stepCounter++;
        this.steps[stepId] = {
            action: action,
            object: step,
            attrs: attrs,
            pos: this.stepCounter
        };

        var stepNum = Utils.create("div")
            .addClass("wtrm-step-num")
            .text("Step "+ this.stepCounter)
            .appendTo(step);

        Utils.create("div")
            .addClass("wtrm-step-command")
            .addClass(addClass)
            .html(Bloonix.PreWtrmAction(action, attrs))
            .appendTo(step);

        this.steps[stepId].resultContainer = Utils.create("div")
            .addClass("wtrm-step-result")
            .appendTo(step);

        var imageContainer = Utils.create("span")
            .addClass("wtrm-step-image")
            .appendTo(step);

        Utils.create("span")
            .addClass("hicons cog")
            .appendTo(imageContainer)
            .attr("title", Text.get("action.edit"))
            .tooltip()
            .click(function() { self.createOrUpdateStep(action, stepId) });

        Utils.create("span")
            .addClass("hicons remove")
            .appendTo(imageContainer)
            .attr("title", Text.get("action.remove"))
            .tooltip()
            .click(function() {
                self.removeStep(stepId);
                self.reNumberSteps();
            });

        Utils.create("span")
            .addClass("hicons sort")
            .appendTo(imageContainer)
            .attr("title", Text.get("info.move_with_mouse"))
            .tooltip();

        return true;
    };

    object.updateStep = function(id, attrs) {
        var step = this.steps[id],
            action = step.action;

        step.attrs = {};

        $.each(attrs, function(name, value) {
            step.attrs[name] = value;
        });

        step.object.find(".wtrm-step-command").each(function() {
            $(this).html(Bloonix.PreWtrmAction(action, attrs));
        });
    };

    object.removeStep = function(id) {
        var step = this.steps[id];
        delete this.steps[id];
        step.object.remove();
        this.stepCounter--;
        this.reNumberSteps();
    };

    object.reNumberSteps = function() {
        this.infoBox.hide();

        var self = this,
            i = 1;

        this.transactionBox.find(".wtrm-step").each(function() {
            var object = $(this),
                id = object.data("id"),
                step = self.steps[id];

            object.find(".wtrm-step-num").each(function() {
                $(this).text("Step "+ i);
                step.pos = i;
            });

            i++;
        });
    };

    object.validateSteps = function() {
        var self = this,
            hasUrl = false,
            hasErr = false,
            steps = [];

        // order steps
        $.each(this.steps, function(id, item) {
            var i = item.pos - 1;
            steps[i] = Utils.extend({ action: item.action, id: id }, item.attrs);
        });

        // validate first
        $.each(steps, function(pos, step) {
            var item = self.steps[step.id];

            if (item.action == "doUrl") {
                hasUrl = true;
            } else if (hasUrl === false) {
                if (item.action != "doAuth" && item.action != "doUserAgent" && item.action != "doAddCookie") {
                    hasErr = "The first action should be <i>Go to URL</i> at the beginning of the workflow."
                        +" The only actions that may be placed in front of the <i>Go to URL</i> action"
                        +" are the actions <i>Auth-Basic</i>, <i>User-Agent</i> and <i>Add Cookie</i>!";
                    return false;
                }
            }
        });

        if (hasErr === false && hasUrl === false) {
            hasErr = "It's not possible to run a test without a <i>URL</i> action at the beginning of the workflow!";
        }

        if (hasErr) {
            self.infoBox.html(hasErr);
            self.infoBox.fadeIn(400);
            self.formBox.find(".loading-small").removeClass("loading-small");
            self.select.getContainer().show();
            self.button.show();
            return false;
        }

        return steps;
    };

    object.runTest = function(quick) {
        var self = this;

        this.selectBox.hide();
        this.infoBox.hide();

        var steps = this.validateSteps();

        if (steps) {
            $.each(steps, function(pos, step) {
                var item = self.steps[step.id];
                item.resultContainer.html("");
                item.resultContainer.css({ "min-height": "20px" });
                item.resultContainer.addClass("loading-small");
            });

            Ajax.post({
                url: quick ? "/wtrm/quick" : "/wtrm/test",
                data: steps,
                success: function(result) {
                    if (result.status === "err-802") {
                        Bloonix.createNoteBox({
                            text: Text.get("err-802"),
                            infoClass: "info-err"
                        });
                        self.outerBox.find(".loading-small").removeClass("loading-small");
                        self.selectBox.show();
                    } else {
                        self.maxTestRequests = 50;
                        self.waitForData(result.data, 1);
                    }
                }
            });
        }
    };

    object.waitForData = function(url, num) {
        var self = this;

        Ajax.post({
            url: url +"/"+ num,
            success: function(result) {
                self.processTestData(url, num, result.data);
            }
        });
    };

    object.processTestData = function(url, num, data) {
        this.maxTestRequests--;
        var self = this,
            done = false;

        $.each(data, function(i, result) {
            if (result.status === "ok") {
                var m = result.data;

                if (result.status == "done") {
                    done = true;
                } else {
                    var step = self.steps[m.id],
                        success = m.success == true ? "ok" : "error";

                    if (success === "error") {
                        done = true;
                    }

                    step.result = m;
                    step.resultContainer.removeClass("loading-small");

                    Utils.create("span")
                        .addClass("wtrm-step-result-"+ success)
                        .html(success)
                        .appendTo(step.resultContainer);

                    Utils.create("span")
                        .addClass("wtrm-step-result-took")
                        .text(m.took + "ms")
                        .appendTo(step.resultContainer);

                    var table = new Table({
                        type: "none",
                        addClass: "wtrm-step-result-table",
                        appendTo: step.resultContainer
                    }).init();

                    table.createRow([ "Status", success ]);
                    table.createRow([ "Took", m.took + "ms" ]);
                    table.createRow([ "Start", DateFormat(m.start, DateFormat.masks.timePlusMs) ]);
                    table.createRow([ "Stop", DateFormat(m.stop, DateFormat.masks.timePlusMs) ]);
                    //table.createRow([ "Start (ms)", m.start ]);
                    //table.createRow([ "Stop (ms)", m.stop ]);

                    if (success === "error") {
                        if (m.message) {
                            table.createRow([ "Message", m.message ]);
                        }
                        if (m.debug) {
                            table.createRow([ "Debug", m.debug.join("<br/>") ]);
                        }
                    }

                    if (m.image) {
                        var img = Utils.create("div")
                            .addClass("wtrm-step-result-image")
                            .appendTo(step.resultContainer);

                        Utils.create("img")
                            .attr("src", "data:image/png;base64,"+ m.image)
                            .appendTo(img);

                        img.click(function() {
                            var overlay = Utils.create("div")
                                .addClass("overlay-outer")
                                .appendTo("body");

                            var img = Utils.create("div")
                                .addClass("overlay-fullscreen")
                                .appendTo(overlay);

                            Utils.create("img")
                                .attr("src", "data:image/png;base64,"+ m.image)
                                .appendTo(img);

                            overlay.fadeIn(400);
                            overlay.click(function() { overlay.remove() });
                        });
                    }
                }
            } else {
                done = true;
            }
        });

        if (done == true) {
            this.outerBox.find(".loading-small").removeClass("loading-small");
            this.selectBox.show();
            return false;
        } else if (this.maxTestRequests > 0) {
            this.waitForData(url, num + data.length);
        } else {
            this.selectBox.show();
        }
    };

    object.preloadSteps = function() {
        var self = this;

        if (this.preload) {
            $.each(this.preload, function(i, step) {
                self.addStep(step.action, step);
            });
        }
    };

    object.create();
    return object;
};

Bloonix.getWtrmElement = function(item) {
    return item["parent"]
        ? item["parent"] +" "+ item.element
        : item.element;
};

Bloonix.PreWtrmAction = function(action, attrs) {
    var clone = {};

    $.each(attrs, function(key, value) {
        clone[key] = Utils.escape(value);
    });

    return Bloonix.WtrmAction[action](clone);
};

Bloonix.WtrmAction = {
    doAuth: function(item) {
        return Text.get("site.wtrm.command.doAuth", [ item.username, item.password ]);
    },
    doUserAgent: function(item) {
        return Text.get("site.wtrm.command.doUserAgent", [ item.userAgent ]);
    },
    doUrl: function(item) {
        return Text.get("site.wtrm.command.doUrl", [ item.url ]);
    },
    doFill: function(item) {
        return Text.get("site.wtrm.command.doFill", [ Bloonix.getWtrmElement(item), item.hidden === "1" ? "xxxxxx" : item.value ]);
    },
    doTriggerEvent: function(item) {
        return Text.get("site.wtrm.command.doTriggerEvent", [ item["event"], Bloonix.getWtrmElement(item) ]);
    },
    doClick: function(item) {
        return Text.get("site.wtrm.command.doClick", [ Bloonix.getWtrmElement(item) ]);
    },
    doSubmit: function(item) {
        return Text.get("site.wtrm.command.doSubmit", [ Bloonix.getWtrmElement(item) ]);
    },
    doCheck: function(item) {
        return Text.get("site.wtrm.command.doCheck", [ Bloonix.getWtrmElement(item), item.value ]);
    },
    doUncheck: function(item) {
        return Text.get("site.wtrm.command.doUncheck", [ Bloonix.getWtrmElement(item), item.value ]);
    },
    doSelect: function(item) {
        return Text.get("site.wtrm.command.doSelect", [ item.value, Bloonix.getWtrmElement(item) ]);
    },
    doWaitForElement: function(item) {
        if (item.text) {
            return Text.get("site.wtrm.command.doWaitForElementWithText", [ Bloonix.getWtrmElement(item), item.text ]);
        }
        return Text.get("site.wtrm.command.doWaitForElement", [ Bloonix.getWtrmElement(item) ]);
    },
    doSleep: function(item) {
        return Text.get("site.wtrm.command.doSleep", [ item.ms ]);
    },
    doSwitchToFrame: function(item) {
        return Text.get("site.wtrm.command.doSwitchToFrame", [ item.name ]);
    },
    doSwitchToParentFrame: function() {
        return Text.get("site.wtrm.command.doSwitchToParentFrame");
    },
    doSwitchToNewPage: function() {
        return Text.get("site.wtrm.command.doSwitchToNewPage");
    },
    doSwitchToMainPage: function() {
        return Text.get("site.wtrm.command.doSwitchToMainPage");
    },
    doAddCookie: function(item) {
        return Text.get("site.wtrm.command.doAddCookie", [ item.name, item.value, item.domain ]);
    },
    checkUrl: function(item) {
        if (item.contentType) {
            return Text.get("site.wtrm.command.checkUrlWithContentType", [ item.url, item.contentType ]);
        }
        return Text.get("site.wtrm.command.checkUrl", [ item.url ]);
    },
    checkIfElementExists: function(item) {
        return Text.get("site.wtrm.command.checkIfElementExists", [ Bloonix.getWtrmElement(item) ]);
    },
    checkIfElementNotExists: function(item) {
        return Text.get("site.wtrm.command.checkIfElementNotExists", [ Bloonix.getWtrmElement(item) ]);
    },
    checkIfElementHasText: function(item) {
        return Text.get("site.wtrm.command.checkIfElementHasText", [ Bloonix.getWtrmElement(item), item.text ]);
    },
    checkIfElementHasNotText: function(item) {
        return Text.get("site.wtrm.command.checkIfElementHasNotText", [ Bloonix.getWtrmElement(item), item.text ]);
    },
    checkIfElementHasHTML: function(item) {
        return Text.get("site.wtrm.command.checkIfElementHasHTML", [ Bloonix.getWtrmElement(item), item.html ]);
    },
    checkIfElementHasNotHTML: function(item) {
        return Text.get("site.wtrm.command.checkIfElementHasNotHTML", [ Bloonix.getWtrmElement(item), item.html ]);
    },
    checkIfElementHasValue: function(item) {
        return Text.get("site.wtrm.command.checkIfElementHasValue", [ Bloonix.getWtrmElement(item), item.hidden === "1" ? "xxxxxx" : item.value ]);
    },
    checkIfElementHasNotValue: function(item) {
        return Text.get("site.wtrm.command.checkIfElementHasNotValue", [ Bloonix.getWtrmElement(item), item.value ]);
    },
    checkIfElementIsChecked: function(item) {
        return Text.get("site.wtrm.command.checkIfElementIsChecked", [ Bloonix.getWtrmElement(item), item.value ]);
    },
    checkIfElementIsNotChecked: function(item) {
        return Text.get("site.wtrm.command.checkIfElementIsNotChecked", [ Bloonix.getWtrmElement(item), item.value ]);
    },
    checkIfElementIsSelected: function(item) {
        return Text.get("site.wtrm.command.checkIfElementIsSelected", [ Bloonix.getWtrmElement(item), item.value ]);
    },
    checkIfElementIsNotSelected: function(item) {
        return Text.get("site.wtrm.command.checkIfElementIsNotSelected", [ Bloonix.getWtrmElement(item), item.value ]);
    }
};
