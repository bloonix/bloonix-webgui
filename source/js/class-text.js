var Text = function() {};

Text.lang = document.documentElement.lang
    ? document.documentElement.lang
    : "en";

Text.get = function(key, value, wrap) {
    var text = Lang[Text.lang][key];

    if (typeof text == "undefined") {
        Log.error("Text.get("+ key +") does not exists");
        return "";
    }

    if (typeof value == "undefined") {
        return text;
    }

    if (wrap == undefined) {
        if (typeof value != "object") {
            return text.replace(/%s/, value);
        }

        $.each(value, function(index, string) {
            text = text.replace(/%s/, string);
        });
    } else {
        if (typeof value != "object") {
            value = [ value ];
        }

        var parts = text.split(/(%s)/);
        text = Utils.create("span");

        $.each(parts, function(i, t) {
            if (t == "%s") {
                Utils.create("span")
                    .addClass("cit")
                    .html(value.shift())
                    .appendTo(text);
            } else if (t != "") {
                Utils.create("span")
                    .html(t)
                    .appendTo(text);
            }
        });
    }

    return text;
};

Text.gets = function(o) {
    var text = Utils.create("span"),
        len = o.length - 1;

    $.each(o, function(i, item) {
        var t;

        if (typeof item == "string") {
            t = Text.get(item);
        } else {
            t = Text.get(item.key, item.value, item.wrap);
        }

        if (t) {
            text.append(t);
            if (i < len) {
                text.append("<br/><br/>");
            }
        }
    });

    return text;
};

Text.dateFormat = {
    en: {
        dayNames: [
            "So", "Mo", "Di", "Mi", "Do", "Fr", "Sa",
            "Sonntag", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag"
        ],
        monthNames: [
            "Jan", "Feb", "Mär", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dez",
            "Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"
        ]
    },
    de: {
        dayNames: [
            "Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat",
            "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"
        ],
        monthNames: [
            "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
            "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"
        ]
    },
    it: {
        dayNames: [
            "Dom", "Lun", "Mar", "Mer", "Gio", "Ven", "Sab",
            "Domenica", "Lunedì", "Martedì", "Mercoledì", "Giovedì", "Venerdì", "Sabato"
        ],
        monthNames: [
            "Gen", "Feb", "Mar", "Apr", "Mag", "Giu", "Lug", "Ago", "Set", "Ott", "Nov", "Dic",
            "Gennaio", "Febbraio", "Marzo", "Aprile", "Maggio", "Giugno", "Luglio", "Agosto", "Settembre", "Ottobre", "Novembre", "Dicembre"
        ]
    }
};
