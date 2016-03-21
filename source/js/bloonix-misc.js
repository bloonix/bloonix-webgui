Bloonix.initAjax = function() {
    Ajax.defaults.err = {
        "err-400": function() { location.href = "/login/" },
        "err-405": function() { location.href = "/login/" },
        "err-410": function() { location.href = "/" },
        "err-415": function() { Bloonix.noAuth() },
        "err-700": function() { Bloonix.changeUserPassword({ force: true }) }
    };

    Ajax.defaults.beforeSuccess = function(result) {
        if (result.version && Bloonix.version && Bloonix.version !== result.version) {
            console.log("new application version available:", result.version);
            if ($("#int-version-note").length) {
                return;
            }
            Bloonix.createNoteBox({
                id: "int-version-note",
                baseClass: "headnote",
                text: Text.get("info.new_version")
            });
        }
    };

    Ajax.defaults.ignoreErrors = {
        "err-428": true,
        "err-605": true,
        "err-610": true,
        "err-620": true,
        "err-701": true,
        "err-702": true,
        "err-703": true,
        "err-704": true,
        "err-705": true,
        "err-802": true
    };
};

Bloonix.initUser = function(postdata) {
    Log.debug("initUser()");
    Ajax.post({
        url: "/whoami/",
        async: false,
        data: postdata,
        success: function(result) {
            Bloonix.user = result.data;
            if (Bloonix.user.password_changed == "0") {
                Bloonix.initHeader();
                Bloonix.initFooter();
                Bloonix.changeUserPassword({ force: true });
            } else if (result.maintenance == "enabled") {
                Bloonix.createNoteBox({
                    autoClose: false,
                    infoClass: "info-err",
                    text: Text.get("site.maintenance.text.enabled")
                });
            }
        }
    });
};

Bloonix.getStats = function() {
    Log.debug("getStats()");

    Bloonix.getRegisteredHostCount();
    Bloonix.getHostServiceStats();
    Bloonix.getBrowserStats();
    Bloonix.setStatsTimeout();
};

Bloonix.setStatsTimeout = function() {
    setTimeout(function() { Bloonix.getStats() }, 30000);
};

Bloonix.getRegisteredHostCount = function() {
    Ajax.post({
        url: "/hosts/registered/count",
        async: false,
        success: function(data) {
            if (data.data > 0) {
                Bloonix.registeredHostsInfoIcon.text(data.data);
                Bloonix.registeredHostsInfoIcon.show();
            } else {
                Bloonix.registeredHostsInfoIcon.hide();
            }
        }
    });
};

Bloonix.getHostServiceStats = function() {
    var hostStats, serviceStats;
    Ajax.post({
        url: "/hosts/stats/status/",
        async: false,
        success: function(data) {
            hostStats = data.data;
        }
    });

    Ajax.post({
        url: "/services/stats/status/",
        async: false,
        success: function(data) {
            serviceStats = data.data;
        }
    });

    if (hostStats != undefined && serviceStats != undefined) {
        $.each([ "UNKNOWN", "CRITICAL", "WARNING", "INFO", "OK" ], function(i, stat) {
            var value = parseFloat(hostStats[stat]);
            var text = value == "1" ? "Host" : "Hosts";
            Bloonix.objects.footerStats[stat].text(value +" "+ text);
        });

        Bloonix.objects.footerStats.Time.html(
            DateFormat(new Date, DateFormat.masks.bloonixNoHour)
        );
    }
};

Bloonix.getBrowserStats = function() {
    if (window.performance) {
        if (window.performance.memory) {
            Bloonix.updateBrowserStats();
        }
    }
};

Bloonix.updateBrowserStats = function() {
    var m = window.performance.memory;

    var usedHeapSize = Utils.bytesToStr(m.usedJSHeapSize),
        totalHeapSize = Utils.bytesToStr(m.totalJSHeapSize);

    Log.info("Browsers heap size: "+ usedHeapSize +"/"+ totalHeapSize);
};

Bloonix.changeMaintenanceStatus = function() {
    var content = Utils.create("div");

    var overlay = new Overlay({
        title: Text.get("site.maintenance.text.tooltip"),
        content: content
    });

    Utils.create("div")
        .addClass("btn btn-white btn-medium")
        .html(Text.get("site.maintenance.text.enable"))
        .appendTo(overlay.content)
        .click(function() {
            Bloonix.get("/maintenance/enable/");
            overlay.close();
        });

    Utils.create("div")
        .addClass("btn btn-white btn-medium")
        .html(Text.get("site.maintenance.text.disable"))
        .appendTo(overlay.content)
        .click(function() {
            Bloonix.get("/maintenance/disable/");
            overlay.close();
        });

    overlay.create();
};
