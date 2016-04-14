Bloonix.viewServiceWtrmReport = function(o) {
    var object = Utils.extend({
        appendTo: "#content",
        postdata: {
            offset: 0,
            limit: 25
        }
    }, o);

    object.create = function() {
        this.getService();
        this.createStruct();
        this.createHeader();
        this.getWtrmResultData();
    };

    object.getService = function() {
        this.service = Bloonix.getService(this.service_id);
        Bloonix.showHostSubNavigation("host", this.service.host_id, this.service.hostname);
    };

    object.createStruct = function() {
        this.headerBox = Utils.create("div")
            .appendTo(this.appendTo);

        this.resultBox = Utils.create("div")
            .addClass("w40 left")
            .appendTo(this.appendTo);

        this.stepBoxOuter = Utils.create("div")
            .addClass("w60 left")
            .appendTo(this.appendTo);

        this.stepBoxInner = Utils.create("div")
            .css({ "padding-left": "10px" })
            .appendTo(this.stepBoxOuter);

        this.chartBoxId = "chart-box-wtrm";

        this.chartBox = Utils.create("div")
            .attr("id", this.chartBoxId)
            .css({ height: "250px" })
            .appendTo(this.stepBoxInner);

        Utils.create("span")
            .addClass("info-simple")
            .css({ margin: "40px 20px" })
            .html(Text.get("site.wtrm.text.click_for_details"))
            .appendTo(this.chartBox);

        this.stepBox = Utils.create("div")
            .appendTo(this.stepBoxInner);
    };

    object.createHeader = function() {
        this.header = new Header({
            appendTo: this.headerBox,
            title: Text.get("site.wtrm.text.service_report", this.service.service_name, true),
            pager: true
        }).create();
    };

    object.getWtrmResultData = function() {
        var self = this;

        this.table = new Table({
            url: "/wtrm/report/"+ this.service.id,
            appendTo: this.resultBox,
            postdata: this.postdata,
            searchable: false,
            selectable: false,
            pager: { appendTo: this.header.pager },
            onClick: function(row) { self.showResultSteps(row) },
            columns: [
                {
                    name: "time",
                    text: Text.get("schema.event.attr.time")
                },{
                    name: "status",
                    text: Text.get("schema.event.attr.status"),
                    wrapIconClass: true
                },{
                    name: "message",
                    text: Text.get("schema.service.attr.message")
                }
            ]
        }).create();
    };

    object.showResultSteps = function(row) {
        this.stepBox.hide();
        this.stepBox.html("");

        if (this.chart) {
            this.chart.destroy();
            this.chartBox.html("");
        }

        var table = new Table({ appendTo: this.stepBox }).init(),
            seriesData = [],
            categories = [];

        table.addHeadColumn("Step");
        table.addHeadColumn("Action");
        table.addHeadColumn("Status");
        table.addHeadColumn("Took");

        $.each(row.data, function(i, r) {
            var tr = table.createRow();

            var data = r.data,
                step = data.step,
                num = i + 1,
                success = data.success === true ? "ok" : "error";

            var addClass = /^do/.test(step.action)
                ? "wtrm-step-command wtrm-action"
                : "wtrm-step-command wtrm-check";

            table.addColumn({ html: num +"." });

            var col = table.addColumn({
                addClass: addClass,
                html: Bloonix.PreWtrmAction(step.action, step)
                //text: Bloonix.WtrmAction[step.action](step)
            });

            if (success == "error") {
                if (data.message) {
                    Utils.create("div")
                        .text(data.message)
                        .appendTo(col);
                }
                if (data.debug) {
                    $.each(data.debug, function(i) {
                        data.debug[i] = Utils.escape(data.debug[i]);
                    });
                    Utils.create("div")
                        .html(data.debug.join("<br/>"))
                        .appendTo(col);
                }
            }

            table.addColumn({
                addClass: "wtrm-step-result",
                html: Utils.create("span").addClass("wtrm-step-result-"+ success).text(success)
            });

            table.addColumn({
                addClass: "wtrm-step-result",
                html: Utils.create("span").addClass("wtrm-step-result-took").text(data.took + "ms")
            });

            categories.push(num +".");
            seriesData.push(data.took);
        });

        this.stepBox.fadeIn(400);
        this.createChart({
            title: row.time +" - "+ row.message,
            categories: categories,
            seriesData: seriesData
        });
    };

    object.createChart = function(opts) {
        this.chart = Bloonix.createChartForWTRM({
            chart: {
                container: this.chartBoxId,
                title: Text.get("schema.service.text.wtrm_result_steps"),
                subtitle: opts.title
            },
            categories: opts.categories,
            seriesData: opts.seriesData
        });
    };

    object.create();
    return object;
};
