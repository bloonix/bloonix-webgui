-- Add each host to a company

CREATE SEQUENCE "company_id_seq" START WITH 2 INCREMENT BY 1 NO MAXVALUE NO MINVALUE CACHE 1;

CREATE TABLE "company" (
    "id"                         BIGINT PRIMARY KEY DEFAULT nextval('company_id_seq'),
    "alt_company_id"             BIGINT NOT NULL DEFAULT 0,
    "company"                    VARCHAR(100) UNIQUE NOT NULL,
    "sla"                        CHAR(1) NOT NULL DEFAULT 0,
    "title"                      VARCHAR(10),
    "name"                       VARCHAR(100),
    "surname"                    VARCHAR(100),
    "address1"                   VARCHAR(100),
    "address2"                   VARCHAR(100),
    "zipcode"                    VARCHAR(20),
    "city"                       VARCHAR(100),
    "state"                      VARCHAR(100),
    "country"                    VARCHAR(100),
    "phone"                      VARCHAR(100),
    "fax"                        VARCHAR(100),
    "email"                      VARCHAR(100),
    "active"                     CHAR(1) NOT NULL DEFAULT 1,
    "max_templates"              INTEGER NOT NULL DEFAULT 1000,
    "max_hosts"                  BIGINT NOT NULL DEFAULT 10000,
    "max_services"               BIGINT NOT NULL DEFAULT 10000,
    "max_services_per_host"      SMALLINT NOT NULL DEFAULT 100,
    "max_contacts"               SMALLINT NOT NULL DEFAULT 100,
    "max_contactgroups"          SMALLINT NOT NULL DEFAULT 100,
    "max_timeperiods"            SMALLINT NOT NULL DEFAULT 1000,
    "max_timeslices_per_object"  SMALLINT NOT NULL DEFAULT 200,
    "max_groups"                 SMALLINT NOT NULL DEFAULT 100,
    "max_users"                  SMALLINT NOT NULL DEFAULT 100,
    "max_sms"                    BIGINT NOT NULL DEFAULT 10000,
    "max_dependencies_per_host"  SMALLINT NOT NULL DEFAULT 100,
    "max_downtimes_per_host"     SMALLINT NOT NULL DEFAULT 1000,
    "max_chart_views_per_user"   BIGINT NOT NULL DEFAULT 50,
    "max_charts_per_user"        BIGINT NOT NULL DEFAULT 1000,
    "max_metrics_per_chart"      SMALLINT NOT NULL DEFAULT 50,
    "max_dashboards_per_user"    SMALLINT NOT NULL DEFAULT 50,
    "max_dashlets_per_dashboard" SMALLINT NOT NULL DEFAULT 50,
    "max_hosts_in_reg_queue"     BIGINT NOT NULL DEFAULT 1000,
    "data_retention"             SMALLINT NOT NULL DEFAULT 3650,
    "sms_enabled"                CHAR(1) DEFAULT '1',
    "sms_route"                  VARCHAR(10) DEFAULT 'gold',
    "comment"                    TEXT,
    "creation_time"              TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expire_time"                BIGINT NOT NULL DEFAULT 0,
    "host_reg_authkey"           VARCHAR(1000) NOT NULL DEFAULT '',
    "host_reg_enabled"           CHAR(1) NOT NULL DEFAULT '0',
    "host_reg_allow_from"        VARCHAR(300) NOT NULL DEFAULT 'all',
    "variables"                  TEXT NOT NULL DEFAULT '{}'
);

INSERT INTO "company" ("id", "company") VALUES (1, 'Bloonix');

-- Table user is used to store all user that are allowed to login
-- and request statistic informations.

CREATE SEQUENCE "user_id_seq" START WITH 2 INCREMENT BY 1 NO MAXVALUE NO MINVALUE CACHE 1;

CREATE TABLE "user" (
    "id"                BIGINT PRIMARY KEY DEFAULT nextval('user_id_seq'),
    "company_id"        BIGINT NOT NULL REFERENCES "company"("id") ON DELETE CASCADE DEFAULT 1,
    "username"          VARCHAR(50) UNIQUE NOT NULL,
    "name"              VARCHAR(50),
    "phone"             VARCHAR(100),
    "password_changed"  CHAR(1) NOT NULL DEFAULT 0,
    "manage_contacts"   CHAR(1) NOT NULL DEFAULT 0,
    "manage_templates"  CHAR(1) NOT NULL DEFAULT 0,
    "last_login"        BIGINT NOT NULL DEFAULT 0,
    "locked"            CHAR(1) NOT NULL DEFAULT 0,
    "role"              VARCHAR(8) NOT NULL DEFAULT 'user', -- admin or user
    "comment"           VARCHAR(200),
    "allow_from"        VARCHAR(300) NOT NULL DEFAULT 'all',
    "timezone"          VARCHAR(40) NOT NULL DEFAULT 'Europe/Berlin',
    "stash"             TEXT NOT NULL DEFAULT '{}',
    "creation_time"     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "user_id_index" ON "user" ("id");
CREATE INDEX "user_username_index" ON "user" ("username");

INSERT INTO "user" (
    "id", "company_id", "username", "manage_contacts", "manage_templates", "locked", "role", "comment", "name"
) VALUES (
    1, 1, 'admin', 1, 1, 0, 'admin', 'Administrator', 'Administrator'
);

-- Table user_secret contains the passwords for each user
-- crypt_type 0: 64 chars = sha256, 128 chars = sha512
-- crypt_type 1: pbkdf2 sha512 substr64 base64

CREATE TABLE "user_secret" (
    "user_id"               BIGINT NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
    "crypt_type"            CHAR(1) DEFAULT 0,
    "salt"                  VARCHAR(128),
    "rounds"                INTEGER DEFAULT 0,
    "password"              VARCHAR(128) NOT NULL,
    "authentication_key"    VARCHAR(128)
);

CREATE INDEX "user_secret_user_id" ON "user_secret" ("user_id");

-- password is admin
INSERT INTO "user_secret" (
    "user_id", "crypt_type", "salt", "rounds", "password"
) VALUES (
    '1',
    '1',
    'H23QZ5c2tBYijITNoz409NNpMr9GiHhF4uE3adX4FyExT6UjWRonye54mSvyOo8V',
    '17775',
    'TYSZ8HM+o8xU05wviSwQUI1avoS816ftBuUy+cxo4n0B3L3SXOC79fARCw2E/Q/2+A9PYgu7MTy3JfluFJS9KA=='
);

-- Target of table company_user: user X is allowed to manage company Y

CREATE TABLE "company_user" (
    "company_id" BIGINT NOT NULL REFERENCES "company"("id") ON DELETE CASCADE,
    "user_id"    BIGINT NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
    UNIQUE("company_id", "user_id")
);

-- Session IDs for each user

CREATE TABLE "session" (
    "sid"       VARCHAR(255) NOT NULL,
    "user_id"   BIGINT NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
    "expire"    BIGINT NOT NULL,
    "stash"     TEXT
);

CREATE INDEX "session_sid_index" on "session" ("sid");

-- Token IDs for transactions

CREATE TABLE "token" (
    "tid"       VARCHAR(255) NOT NULL,
    "sid"       VARCHAR(255) NOT NULL,
    "expire"    BIGINT NOT NULL,
    "action"    VARCHAR(100)
);

-- CREATE INDEX "token_tid_sid_index" on "token" ("tid", "sid");
-- Each user and host should be a member in one or more groups.

CREATE SEQUENCE "group_id_seq" START WITH 2 INCREMENT BY 1 NO MAXVALUE NO MINVALUE CACHE 1;

CREATE TABLE "group" (
    "id"            BIGINT PRIMARY KEY DEFAULT nextval('group_id_seq'),
    "company_id"    BIGINT NOT NULL REFERENCES "company"("id") ON DELETE CASCADE DEFAULT 1,
    "groupname"     VARCHAR(64) NOT NULL,
    "description"   VARCHAR(100),
    "creation_time" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "group_id_index" ON "group" ("id");
CREATE INDEX "group_groupname_index" ON "group" ("groupname");

INSERT INTO "group" (
    "id", "company_id", "groupname", "description"
) VALUES (
    1, 1, 'Administrator', 'Administration'
);

-- Host templates

CREATE SEQUENCE "host_template_id_seq" START WITH 1 INCREMENT BY 1 NO MAXVALUE NO MINVALUE CACHE 1;

CREATE TABLE "host_template" (
    "id"          BIGINT PRIMARY KEY DEFAULT nextval('host_template_id_seq'),
    "company_id"  BIGINT NOT NULL REFERENCES "company"("id") ON DELETE CASCADE,
    "name"        VARCHAR(100) NOT NULL,
    "description" VARCHAR(100) NOT NULL DEFAULT '',
    "variables"   TEXT NOT NULL DEFAULT '{}',
    "tags"        TEXT NOT NULL DEFAULT ''
);

CREATE INDEX "host_template_name_index" ON "host_template" ("name");

-- Table host is used to store all hosts that are allowed to deliver data.

CREATE SEQUENCE "host_id_seq" START WITH 1 INCREMENT BY 1 NO MAXVALUE NO MINVALUE CACHE 1;

CREATE TABLE "host" (
    "id"                    BIGINT PRIMARY KEY DEFAULT nextval('host_id_seq'),
    "company_id"            BIGINT NOT NULL REFERENCES "company"("id") ON DELETE CASCADE DEFAULT 1,
    "hostname"              VARCHAR(100) NOT NULL,
    "ipaddr"                VARCHAR(159),
    "ipaddr6"               VARCHAR(45),
    "description"           VARCHAR(100) NOT NULL,
    "comment"               VARCHAR(100) NOT NULL DEFAULT '', -- for user comments
    "active_comment"        VARCHAR(400) DEFAULT 'no comment', -- add a comment why the service was deactivated
    "notification_comment"  VARCHAR(400) DEFAULT 'no comment', -- add a comment why the notification was disabled
    "facts"                 TEXT NOT NULL DEFAULT '{}',
    "sysgroup"              VARCHAR(50) NOT NULL DEFAULT '',
    "sysinfo"               VARCHAR(200) NOT NULL DEFAULT '',
    "host_class"            VARCHAR(100) NOT NULL DEFAULT '',
    "system_class"          VARCHAR(100) NOT NULL DEFAULT '',
    "location_class"        VARCHAR(100) NOT NULL DEFAULT '',
    "os_class"              VARCHAR(100) NOT NULL DEFAULT '',
    "hw_class"              VARCHAR(100) NOT NULL DEFAULT '',
    "env_class"             VARCHAR(100) NOT NULL DEFAULT '',
    "active"                CHAR(1) NOT NULL DEFAULT 1, 
    "allow_from"            VARCHAR(300) NOT NULL DEFAULT 'all',
    "max_sms"               INTEGER NOT NULL DEFAULT 0,
    "status"                VARCHAR(8) NOT NULL DEFAULT 'INFO',
    "status_since"          BIGINT DEFAULT 0 NOT NULL,
    "status_nok_since"      BIGINT DEFAULT 0 NOT NULL,
    "interval"              INTEGER NOT NULL DEFAULT 60,
    "retry_interval"        INTEGER NOT NULL DEFAULT 60,
    "timeout"               INTEGER NOT NULL DEFAULT 300,
    "notification_interval" INTEGER NOT NULL DEFAULT 3600,
    "notification"          CHAR(1) NOT NULL DEFAULT 1,
    "last_check"            BIGINT NOT NULL DEFAULT 0,
    "max_services"          INTEGER NOT NULL DEFAULT 0,
    "coordinates"           VARCHAR(100) DEFAULT '',
    "creation_time"         TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "variables"             TEXT NOT NULL DEFAULT '{}',
    "data_retention"        SMALLINT DEFAULT 3650,
    "register"              CHAR(1) NOT NULL DEFAULT '0',
    UNIQUE("hostname", "company_id")
);

CREATE INDEX "host_id_index" ON "host" ("id");
CREATE INDEX "host_hostname_index" ON "host" ("hostname");
CREATE INDEX "host_company_id_index" ON "host" ("company_id");
CREATE INDEX "host_status_since_index" ON "host" ("status_since");

-- Table host_secret contains the passwords and cbckeys for each host

CREATE TABLE "host_secret" (
    "host_id"   BIGINT NOT NULL REFERENCES "host"("id") ON DELETE CASCADE,
    "password"  VARCHAR(128) NOT NULL
);

CREATE INDEX "host_secret_host_id" ON "host_secret" ("host_id");

-- Reference beween host_template and host

CREATE TABLE "host_template_host" (
    "host_template_id"  BIGINT NOT NULL REFERENCES "host_template"("id") ON DELETE CASCADE,
    "host_id"           BIGINT NOT NULL REFERENCES "host"("id") ON DELETE CASCADE,
    UNIQUE ("host_template_id", "host_id")
);

-- References between groups

CREATE TABLE "user_group" (
    "user_id"           BIGINT NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
    "group_id"          BIGINT NOT NULL REFERENCES "group"("id") ON DELETE CASCADE,
    "create_service"    CHAR(1) DEFAULT 0,
    "update_service"    CHAR(1) DEFAULT 0,
    "delete_service"    CHAR(1) DEFAULT 0,
    "create_host"       CHAR(1) DEFAULT 0,
    "update_host"       CHAR(1) DEFAULT 0,
    "delete_host"       CHAR(1) DEFAULT 0,
    UNIQUE ("user_id", "group_id")
);

CREATE INDEX "user_group_user_id_index" ON "user_group" ("user_id");
CREATE INDEX "user_group_group_id_index" ON "user_group" ("group_id");

INSERT INTO "user_group" (
    "user_id", "group_id", "create_service", "update_service", "delete_service", "create_host", "update_host", "delete_host"
) VALUES (
    1, 1, 1, 1, 1, 1, 1, 1
);

CREATE TABLE "host_group" (
    "host_id"   BIGINT NOT NULL REFERENCES "host"("id") ON DELETE CASCADE,
    "group_id"  BIGINT NOT NULL REFERENCES "group"("id") ON DELETE CASCADE,
    UNIQUE ("host_id", "group_id")
);

CREATE INDEX "host_group_host_id_index" ON "host_group" ("host_id");
CREATE INDEX "host_group_group_id_index" ON "host_group" ("group_id");

-- Table status is used to order the status

CREATE TABLE "status_priority" (
    "priority"  INTEGER NOT NULL,
    "status"    VARCHAR(10) NOT NULL
);

INSERT INTO "status_priority" ("priority", "status") VALUES (0, 'OK');
INSERT INTO "status_priority" ("priority", "status") VALUES (5, 'INFO');
INSERT INTO "status_priority" ("priority", "status") VALUES (10, 'WARNING');
INSERT INTO "status_priority" ("priority", "status") VALUES (20, 'CRITICAL');
INSERT INTO "status_priority" ("priority", "status") VALUES (30, 'UNKNOWN');

-- Table plugin is used to store all informations about plugins
-- that provides statistics.

CREATE TABLE "plugin" (
    "id"            BIGINT PRIMARY KEY NOT NULL,
    "company_id"    BIGINT NOT NULL REFERENCES "company"("id") ON DELETE CASCADE DEFAULT 1,
    "plugin"        VARCHAR(100) UNIQUE NOT NULL,             -- The plugin name.
    "command"       VARCHAR(100) NOT NULL,                    -- The script name.
    "category"      VARCHAR(100) NOT NULL,                    -- The category of the plugins data, comma separated, such as System/Network/Database/Security
    "netaccess"     CHAR(1) NOT NULL DEFAULT '0',             -- Does the service has network access?
    "prefer"        VARCHAR(10) NOT NULL DEFAULT 'localhost', -- What location is preferred? localhost, localnet, remote
    "worldwide"     CHAR(1) NOT NULL DEFAULT '0',             -- If the location is remote, is it possible to do worldwide checks?
    "subkey"        VARCHAR(20) DEFAULT 0,                    -- The subkey alias if exists, such as dev/cpu/disk.
    "datatype"      VARCHAR(10) NOT NULL,                     -- The data type of the plugin, such as statistic/table/logfile.
    "abstract"      VARCHAR(100) NOT NULL,                    -- A short description of the plugin (used as service name).
    "description"   VARCHAR(500) NOT NULL,                    -- A long description of the plugin (used as description).
    "info"          TEXT NOT NULL DEFAULT '{}'                -- The plugin information returned by --plugin-info, stored as JSON.
);

CREATE INDEX "plugin_plugin_index" ON "plugin" ("plugin");
CREATE INDEX "plugin_category_index" ON "plugin" ("category");

-- Table statitic is used to all availabe plugin statistics.

CREATE TABLE "plugin_stats" (
    "plugin_id"     BIGINT NOT NULL REFERENCES "plugin"("id") ON DELETE CASCADE DEFAULT 1,
    "statkey"       VARCHAR(25) NOT NULL,   -- txbyt
    "alias"         VARCHAR(100),           -- a human readable statkey name
    "datatype"      VARCHAR(20) NOT NULL,   -- float
    "units"         VARCHAR(20) NOT NULL DEFAULT 'default', -- units
    "stattype"      VARCHAR(10),            -- gauge | counter | derive ...
    "regex"         VARCHAR(200),           -- ^\d+\.\d+\z
    "substr"        INTEGER,                -- 100
    "default"       VARCHAR(30) DEFAULT 0,  -- default value
    "description"   VARCHAR(500) NOT NULL   -- desc
);

-- Table chart is used to store the service charts.

CREATE TABLE "chart" (
    "id"        BIGINT PRIMARY KEY NOT NULL,
    "plugin_id" BIGINT NOT NULL REFERENCES "plugin"("id") ON DELETE CASCADE DEFAULT 1,
    "title"     VARCHAR(100) NOT NULL,  -- the title of the chart
    "options"   TEXT                    -- the chart options like label names, area stacked or line charts
);

CREATE INDEX "chart_title_index" ON "chart" ("title");

-- Table user_chart is used to store user charts.

CREATE SEQUENCE "user_chart_id_seq" START WITH 1 INCREMENT BY 1 NO MAXVALUE NO MINVALUE CACHE 1;

CREATE TABLE "user_chart" (
    "id"          BIGINT PRIMARY KEY DEFAULT nextval('user_chart_id_seq'),
    "user_id"     BIGINT NOT NULL REFERENCES "user"("id") ON DELETE CASCADE DEFAULT 1,
    "public"      CHAR(1) DEFAULT 0,
    "title"       VARCHAR(50) DEFAULT 'n/a',
    "subtitle"    VARCHAR(50) NULL,
    "yaxis_label" VARCHAR(30) NULL,
    "description" VARCHAR(100) NULL,
    "options"     TEXT DEFAULT '{}'
);

CREATE INDEX "user_chart_title_index" ON "user_chart" ("title");

-- Table chart_view is used to store the charts that a bundled to a dashboard,
-- mixed from table chart and table user_chart.

CREATE SEQUENCE "chart_view_id_seq" START WITH 1 INCREMENT BY 1 NO MAXVALUE NO MINVALUE CACHE 1;

CREATE TABLE "chart_view" (
    "id"        BIGINT PRIMARY KEY DEFAULT nextval('chart_view_id_seq'),
    "user_id"   BIGINT NOT NULL REFERENCES "user"("id") ON DELETE CASCADE DEFAULT 1,
    "public"    CHAR(1) DEFAULT 0,
    "alias"     VARCHAR(200) DEFAULT 'n/a',
    "options"   TEXT DEFAULT '{}'
);

CREATE INDEX "chart_view_alias_index" ON "chart_view" ("alias");

-- Service templates

CREATE SEQUENCE "service_parameter_ref_id_seq" START WITH 1 INCREMENT BY 1 NO MAXVALUE NO MINVALUE CACHE 1;

CREATE TABLE "service_parameter" (
    "ref_id"                    BIGINT PRIMARY KEY DEFAULT nextval('service_parameter_ref_id_seq'),
    "host_template_id"          BIGINT NULL REFERENCES "host_template"("id") ON DELETE CASCADE,
    "agent_id"                  VARCHAR(100) NOT NULL DEFAULT 'localhost',
    "service_name"              VARCHAR(100) NOT NULL,
    "host_alive_check"          CHAR(1) NOT NULL DEFAULT '0',
    "passive_check"             CHAR(1) NOT NULL DEFAULT '0',
    "command_options"           TEXT NOT NULL DEFAULT '[]',
    "location_options"          TEXT NOT NULL DEFAULT '0',
    "agent_options"             TEXT NOT NULL DEFAULT '{}',
    "sum_services"              SMALLINT NOT NULL DEFAULT 1,
    "plugin_id"                 BIGINT NOT NULL REFERENCES "plugin"("id"),
    "description"               VARCHAR(100) NOT NULL DEFAULT '',
    "comment"                   VARCHAR(200) NOT NULL DEFAULT '',
    "interval"                  INTEGER NOT NULL DEFAULT 0,
    "retry_interval"            INTEGER NOT NULL DEFAULT 0,
    "timeout"                   INTEGER NOT NULL DEFAULT 0,
    "attempt_warn2crit"         CHAR(1) NOT NULL DEFAULT 0,
    "attempt_max"               SMALLINT NOT NULL DEFAULT 3,
    "notification_interval"     INTEGER NOT NULL DEFAULT 0,
    "fd_enabled"                CHAR(1) NOT NULL DEFAULT 1,
    "fd_time_range"             INTEGER NOT NULL DEFAULT 1800,
    "fd_flap_count"             INTEGER NOT NULL DEFAULT 8,
    "is_volatile"               CHAR(1) NOT NULL DEFAULT 0, -- is this a volatile status
    "volatile_retain"           INTEGER NOT NULL DEFAULT 0  -- the volatile retain time
);

CREATE INDEX "service_parameter_ref_id_index" ON "service_parameter" ("ref_id");
CREATE INDEX "service_parameter_service_name" ON "service_parameter" ("service_name");

-- Table service is used to store the services for
-- each host. This configuration is send to the agent
-- every time the configuration is requested or reloaded.

CREATE SEQUENCE "service_id_seq" START WITH 1 INCREMENT BY 1 NO MAXVALUE NO MINVALUE CACHE 1;

CREATE TABLE "service" (
    "id"                        BIGINT PRIMARY KEY DEFAULT nextval('service_id_seq'),
    "host_id"                   BIGINT NOT NULL REFERENCES "host"("id") ON DELETE CASCADE,
    "service_parameter_id"      BIGINT NOT NULL REFERENCES "service_parameter"("ref_id") ON DELETE CASCADE,
    "active"                    CHAR(1) NOT NULL DEFAULT 1,
    "acknowledged"              CHAR(1) NOT NULL DEFAULT 0,
    "notification"              CHAR(1) NOT NULL DEFAULT 1,
    "agent_version"             VARCHAR(10) NOT NULL DEFAULT '0',   -- the agent version
    "subkeys"                   TEXT,                               -- store subkeys of plugin statistics, comma separated
    "active_comment"            VARCHAR(400) DEFAULT 'no comment',  -- who activated/deactivated the service
    "acknowledged_comment"      VARCHAR(400) DEFAULT 'no comment',  -- who acknowledged or cleared the acknowledgement of the service
    "notification_comment"      VARCHAR(400) DEFAULT 'no comment',  -- who enabled/disabled the notifications of the service
    "volatile_comment"          VARCHAR(400) DEFAULT 'no comment',  -- who cleared the status of the service
    "attempt_counter"           SMALLINT NOT NULL DEFAULT 1,        -- attempt counter
    "last_notification_1"       BIGINT NOT NULL DEFAULT 0,          -- the last time a notification was send
    "last_notification_2"       BIGINT NOT NULL DEFAULT 0,          -- the last time a notification was send
    "last_check"                BIGINT NOT NULL DEFAULT 0,          -- last check timestamp
    "highest_attempt_status"    VARCHAR(10) NOT NULL DEFAULT 'OK',  -- save the highest status
    "flapping"                  CHAR(1) NOT NULL DEFAULT 0,         -- is the services flapping or not
    "scheduled"                 CHAR(1) NOT NULL DEFAULT 0,         -- has the service a scheduled downtime or not
    "next_check"                BIGINT NOT NULL DEFAULT 0,          -- next check of the service
    "next_timeout"              BIGINT NOT NULL DEFAULT 0,          -- next timeout of the service
    "last_event"                BIGINT NOT NULL DEFAULT date_part('epoch', now()), -- when the last event was stored
    "status_since"              BIGINT NOT NULL DEFAULT 0,          -- timestamp since the status is OK or not OK
    "status_nok_since"          BIGINT NOT NULL DEFAULT 0,          -- timestamp since the service is in the given status
    "status_dependency_matched" BIGINT NOT NULL DEFAULT 0,          -- timestamp or just a true value
    "volatile_status"           CHAR(1) NOT NULL DEFAULT 0,         -- has the service become volatile
    "volatile_since"            BIGINT NOT NULL DEFAULT 0,          -- since the status is volatile
    "status"                    VARCHAR(10) NOT NULL DEFAULT 'INFO', -- the last status
    "result"                    TEXT NULL,                          -- an advanced status message
    "debug"                     TEXT NULL,                          -- an advanced debug message
    "message"                   TEXT NOT NULL DEFAULT 'waiting for initialization', -- the last message
    "creation_time"             TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated"                   CHAR(1) DEFAULT '0',                -- used for software updates
    "last_status"               VARCHAR DEFAULT 'INFO',             -- the last status of the service
    "force_check"               CHAR(1) DEFAULT '0',                -- force the next check of the service
    "force_event"               CHAR(1) DEFAULT '0'                 -- force to store a event
);

CREATE INDEX "service_id_index" ON "service" ("id");
CREATE INDEX "service_host_id_index" ON "service" ("host_id");

-- Cache table

CREATE SEQUENCE "cache_id_seq" START WITH 1 INCREMENT BY 1 NO MAXVALUE NO MINVALUE CACHE 1;

CREATE TABLE "cache" (
    "id"   BIGINT PRIMARY KEY DEFAULT nextval('cache_id_seq'),
    "type" VARCHAR(100) NOT NULL,
    "data" TEXT
);

CREATE INDEX "cache_type_index" ON "cache" ("type");

-- Location table

CREATE SEQUENCE "location_id_seq" START WITH 1 INCREMENT BY 1 NO MAXVALUE NO MINVALUE CACHE 1;

CREATE TABLE "location" (
    "id"           BIGINT PRIMARY KEY DEFAULT nextval('location_id_seq'),
    "ipaddr"       VARCHAR(159) NOT NULL,
    "hostname"     VARCHAR(50) NOT NULL,
    "city"         VARCHAR(50) NOT NULL,
    "country"      VARCHAR(50) NOT NULL,
    "continent"    VARCHAR(13) NOT NULL,
    "coordinates"  VARCHAR(500) NOT NULL DEFAULT '0,0',
    "description"  VARCHAR(500)
);

-- Host and service dependencies

CREATE SEQUENCE "dependency_id_seq" START WITH 1 INCREMENT BY 1 NO MAXVALUE NO MINVALUE CACHE 1;

CREATE TABLE "dependency" (
    "id"                BIGINT PRIMARY KEY DEFAULT nextval('dependency_id_seq'),
    "host_id"           BIGINT REFERENCES "host"("id") ON DELETE CASCADE ,
    "service_id"        BIGINT REFERENCES "service"("id") ON DELETE CASCADE ,
    "status"            VARCHAR(32) NOT NULL DEFAULT 'CRITICAL,UNKNOWN,INFO',
    "on_host_id"        BIGINT REFERENCES "host"("id") ON DELETE CASCADE ,
    "on_service_id"     BIGINT REFERENCES "service"("id") ON DELETE CASCADE ,
    "on_status"         VARCHAR(32) NOT NULL DEFAULT 'CRITICAL,UNKNOWN,INFO',
    "inherit"           CHAR(1) NOT NULL DEFAULT 0,
    "timezone"          VARCHAR(40) NOT NULL DEFAULT 'Europe/Berlin',
    "timeslice"         TEXT DEFAULT 'Monday - Sunday 00:00 - 23:59',
    UNIQUE("service_id", "on_service_id")
);

CREATE INDEX "dependency_host_id_index" ON "dependency" ("host_id");
CREATE INDEX "dependency_on_host_id_index" ON "dependency" ("on_host_id");
CREATE INDEX "dependency_service_id_index" ON "dependency" ("service_id");
CREATE INDEX "dependency_on_service_id_index" ON "dependency" ("on_service_id");
CREATE INDEX "dependency_on_status_id_index" ON "dependency" ("on_status");

-- Tables contact, contactgroup, contact_contactgroup, host_contactgroup
-- and service_contactgroup are used to handle contacts for each host
-- and service.

CREATE SEQUENCE "contactgroup_id_seq" START WITH 1 INCREMENT BY 1 NO MAXVALUE NO MINVALUE CACHE 1;

CREATE TABLE "contactgroup" (
    "id"            BIGINT PRIMARY KEY DEFAULT nextval('contactgroup_id_seq'),
    "company_id"    BIGINT NOT NULL REFERENCES "company"("id") ON DELETE CASCADE,
    "name"          VARCHAR(100) NOT NULL,
    "description"   VARCHAR(100),
    "creation_time" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE SEQUENCE "contact_id_seq" START WITH 1 INCREMENT BY 1 NO MAXVALUE NO MINVALUE CACHE 1;

CREATE TABLE "contact" (
    "id"                            BIGINT PRIMARY KEY DEFAULT nextval('contact_id_seq'),
    "company_id"                    BIGINT NOT NULL REFERENCES "company"("id") ON DELETE CASCADE,
    "name"                          VARCHAR(100) NOT NULL,
    "escalation_time"               INTEGER NOT NULL DEFAULT '0',
    "creation_time"                 TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE SEQUENCE "contact_message_services_id_seq" START WITH 1 INCREMENT BY 1 NO MAXVALUE NO MINVALUE CACHE 1;

CREATE TABLE "contact_message_services" (
    "id"                 BIGINT PRIMARY KEY DEFAULT nextval('contact_message_services_id_seq'),
    "contact_id"         BIGINT NOT NULL REFERENCES "contact"("id") ON DELETE CASCADE,
    "message_service"    VARCHAR(20) NOT NULL,
    "enabled"            CHAR(1) NOT NULL DEFAULT 1,
    "send_to"            VARCHAR(100),
    "notification_level" VARCHAR(40) NOT NULL DEFAULT 'all',
    "creation_time"      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "contact_contactgroup" (
    "contactgroup_id"   BIGINT NOT NULL REFERENCES "contactgroup"("id") ON DELETE CASCADE,
    "contact_id"        BIGINT NOT NULL REFERENCES "contact"("id") ON DELETE CASCADE,
    UNIQUE ("contactgroup_id", "contact_id")
);

CREATE TABLE "host_contactgroup" (
    "contactgroup_id"   BIGINT NOT NULL REFERENCES "contactgroup"("id") ON DELETE CASCADE,
    "host_id"           BIGINT NOT NULL REFERENCES "host"("id") ON DELETE CASCADE,
    UNIQUE ("contactgroup_id", "host_id")
);

CREATE TABLE "service_contactgroup" (
    "contactgroup_id"   BIGINT NOT NULL REFERENCES "contactgroup"("id") ON DELETE CASCADE,
    "service_id"        BIGINT NOT NULL REFERENCES "service"("id") ON DELETE CASCADE,
    UNIQUE ("contactgroup_id", "service_id")
);

-- Table timeperiods is used to create time period
-- that can be used for contacts to configure when
-- a contact get notifications.

CREATE SEQUENCE "timeperiod_id_seq" START WITH 1 INCREMENT BY 1 NO MAXVALUE NO MINVALUE CACHE 1;

CREATE TABLE "timeperiod" (
    "id"            BIGINT PRIMARY KEY DEFAULT nextval('timeperiod_id_seq'),
    "company_id"    BIGINT NOT NULL REFERENCES "company"("id") ON DELETE CASCADE,
    "name"          VARCHAR(40) NOT NULL,
    "description"   VARCHAR(100)
);

CREATE SEQUENCE "timeslice_id_seq" START WITH 1 INCREMENT BY 1 NO MAXVALUE NO MINVALUE CACHE 1;

CREATE TABLE "timeslice" (
    "id"            BIGINT PRIMARY KEY DEFAULT nextval('timeslice_id_seq'),
    "timeperiod_id" BIGINT NOT NULL REFERENCES "timeperiod"("id") ON DELETE CASCADE,
    "timeslice"     VARCHAR(200) NOT NULL
);

-- ****** 24 x 7 ******
insert into "timeperiod" ("company_id", "name", "description")
values (1, '24x7', 'Around the clock');

insert into "timeslice" ("timeperiod_id", "timeslice")
values (1, 'Monday - Sunday 00:00 - 23:59');

-- ****** Working time ******
insert into "timeperiod" ("company_id", "name", "description")
values (1, 'Working time', 'Monday to friday from 9-17');

insert into "timeslice" ("timeperiod_id", "timeslice")
values (2, 'Monday - Friday 09:00 - 17:00');

-- ****** Off time ******
insert into "timeperiod" ("company_id", "name", "description")
values (1, 'Off time', 'The opposite of the working time');

insert into "timeslice" ("timeperiod_id", "timeslice")
values (3, 'Monday - Friday 17:01 - 23:59'),
       (3, 'Monday - Friday 00:00 - 08:59'),
       (3, 'Saturday - Sunday 00:00 - 23:59');

-- Table timeslice_contact is used to add a contact
-- to a timeperiod.

CREATE SEQUENCE "contact_timeperiod_id_seq" START WITH 1 INCREMENT BY 1 NO MAXVALUE NO MINVALUE CACHE 1;

CREATE TABLE "contact_timeperiod" (
    "id"                BIGINT PRIMARY KEY DEFAULT nextval('contact_timeperiod_id_seq'),
    "contact_id"        BIGINT NOT NULL REFERENCES "contact"("id") ON DELETE CASCADE,
    "timeperiod_id"     BIGINT NOT NULL REFERENCES "timeperiod"("id") ON DELETE CASCADE,
    "message_service"   VARCHAR(20) NOT NULL DEFAULT 'all',
    "exclude"           CHAR(1) NOT NULL DEFAULT '0',
    "timezone"          VARCHAR(40) NOT NULL DEFAULT 'Europe/Berlin'
);

-- Store host downtimes

CREATE SEQUENCE "host_downtime_id_seq" START WITH 1 INCREMENT BY 1 NO MAXVALUE NO MINVALUE CACHE 1;

CREATE TABLE "host_downtime" (
    "id"                        BIGINT PRIMARY KEY DEFAULT nextval('host_downtime_id_seq'),
    "host_id"                   BIGINT NOT NULL REFERENCES "host"("id") ON DELETE CASCADE,
    "begin"                     TIMESTAMP,
    "end"                       TIMESTAMP,
    "timeslice"                 VARCHAR(200),
    "flag"                      VARCHAR(100) DEFAULT 'none',
    "timezone"                  VARCHAR(40) NOT NULL DEFAULT 'Europe/Berlin',
    "username"                  VARCHAR(50) NOT NULL,
    "description"               VARCHAR(300) NOT NULL
);

CREATE INDEX "host_downtime_index" ON "host_downtime" ("host_id", "begin", "end");

-- Store service downtimes

CREATE SEQUENCE "service_downtime_id_seq" START WITH 1 INCREMENT BY 1 NO MAXVALUE NO MINVALUE CACHE 1;

CREATE TABLE "service_downtime" (
    "id"                        BIGINT PRIMARY KEY DEFAULT nextval('service_downtime_id_seq'),
    "host_id"                   BIGINT NOT NULL REFERENCES "host"("id") ON DELETE CASCADE,
    "service_id"                BIGINT NOT NULL REFERENCES "service"("id") ON DELETE CASCADE,
    "begin"                     TIMESTAMP,
    "end"                       TIMESTAMP,
    "timeslice"                 VARCHAR(200),
    "flag"                      VARCHAR(100),
    "timezone"                  VARCHAR(40) NOT NULL DEFAULT 'Europe/Berlin',
    "username"                  VARCHAR(50) NOT NULL,
    "description"               VARCHAR(300) NOT NULL
);

CREATE INDEX "service_downtime_index" ON "service_downtime" ("host_id", "begin", "end");

-- Table notification is used to store all mails that were send

CREATE TABLE "notification" (
    -- No referenc to host.id and service.id because this line shouldn't be deleted
    -- if the host or service will be deleted
    "time"              BIGINT DEFAULT 0,
    "host_id"           BIGINT NOT NULL,
    "company_id"        BIGINT NOT NULL DEFAULT 0,
    "message_service"   VARCHAR(20) NOT NULL DEFAULT 'n/a',
    "send_to"           VARCHAR(100) NOT NULL,
    "subject"           VARCHAR(200) NOT NULL,
    "message"           TEXT NOT NULL DEFAULT 'n/a'
);

CREATE INDEX "notification_time_host_id_index" ON "notification" ("time", "host_id");
CREATE INDEX "notification_time_company_id_index" ON "notification" ("time", "company_id");

-- User actions

CREATE SEQUENCE "user_tracking_id_seq" START WITH 1 INCREMENT BY 1 NO MAXVALUE NO MINVALUE CACHE 1;

CREATE TABLE "user_tracking" (
    "id"            BIGINT PRIMARY KEY DEFAULT nextval('user_tracking_id_seq'),
    "company_id"    BIGINT NOT NULL REFERENCES "company"("id") ON DELETE CASCADE,
    "time"          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "user_id"       BIGINT NOT NULL,
    "username"      VARCHAR(50) NOT NULL,
    "action"        VARCHAR(10) NOT NULL, -- create, update, delete, add, remove
    "target"        VARCHAR(200) NOT NULL DEFAULT 'n/a', -- the target, maybe a table or file
    "message"       TEXT NOT NULL -- a simple message or the data
);

CREATE INDEX "user_tracking_company_id_index" ON "user_tracking"("company_id");
CREATE INDEX "user_tracking_time_index" ON "user_tracking"("time");

-- Locking table

create table "lock_srvchk" (
    "locked" char(1)
);

-- Maintenance

CREATE TABLE "maintenance" (
    "version" VARCHAR(10),
    "active" BIGINT NOT NULL DEFAULT 0
);

INSERT INTO "maintenance" ("version", "active") values ('-1', '0');

-- End.
