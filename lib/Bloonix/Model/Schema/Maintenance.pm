package Bloonix::Model::Schema::Maintenance;

use strict;
use warnings;
use base qw(Bloonix::DBI::Base);
use base qw(Bloonix::DBI::CRUD);

sub init {
    my $self = shift;

    $self->{schema_version} = 14;
    $self->log->warning("start database upgrade");
    $self->dbi->reconnect;
    $self->run_upgrade;
    $self->log->warning("database upgrade finished");
    $self->dbi->disconnect;
}

sub status {
    my ($self, $status, $message) = @_;
    my $active = $status eq "disable" ? 0 : 1;
    my $message ||= "";

    $self->dbi->do(
        $self->sql->update(
            table => "maintenance",
            data => { active => $active }
        )
    );
}

sub get_status {
    my $self = shift;

    my $row = $self->dbi->unique(
        $self->sql->select(
            table => "maintenance",
            column => "*"
        )
    );

    return $row->{active} ? "enabled" : "disabled";
}

sub get_version {
    my $self = shift;

    $self->log->warning("get current schema version");

    return $self->all->[0]->{version};
}

sub update_version {
    my $self = shift;

    $self->log->warning("upgrade schema version to $self->{schema_version}");

    $self->dbi->do(
        $self->sql->update(
            table => $self->{table},
            data => { version => $self->{schema_version} }
        )
    );
}

sub upgrade {
    my ($self, $stmt) = @_;

    $self->log->warning("upgrade table: $stmt");
    eval { $self->dbi->do($stmt) };

    if ($@) {
        $self->log->error($@);
        return 0;
    }

    return 1;
}

sub exist {
    my ($self, $table, $column) = @_;
    my $stmt;

    if ($self->dbi->driver eq "Pg") {
        $stmt = qq{
            SELECT column_name
            FROM information_schema.columns
            WHERE table_name = ?
            AND column_name = ?
        };

        return $self->dbi->unique($stmt, $table, $column);
    }

    if ($self->dbi->driver eq "mysql") {
        $stmt = qq{
            SELECT *
            FROM information_schema.COLUMNS
            WHERE TABLE_SCHEMA = ?
            AND TABLE_NAME = ?
            AND COLUMN_NAME = ?
        };

        return $self->dbi->unique($stmt, $self->dbi->database, $table, $column);
    }
}

# ----------------------------
# Upgrade
# ----------------------------

sub run_upgrade {
    my $self = shift;
    my $version = $self->get_version;

    $self->log->warning("found schema version $version");

    if ($version eq "-1") {
        $self->update_version;
        return;
    }

    if ($version == $self->{schema_version}) {
        $self->log->warning("database schema is on the lastest version");
        return 1;
    }

    foreach my $v (1 .. $self->{schema_version}) {
        if ($version < $v) {
            my $m = "v$v";
            $self->log->warning("run upgrade $m");
            $self->$m;
        }
    }

    $self->update_version;
}

sub v1 {
    my $self = shift;

    if (!$self->exist(service => "force_check")) {
        $self->upgrade("alter table service add column force_check char(1) default '0'");
    }

    if (!$self->exist(host => "data_retention")) {
        $self->upgrade("alter table host add column data_retention smallint default 3650");
    }
}

sub v3 {
    my $self = shift;

    if (!$self->exist(service => "volatile_comment")) {
        $self->upgrade("alter table service add column volatile_comment varchar(400) default 'no comment'");
    }
}

sub v4 {
    my $self = shift;

    my %limit = (
        max_templates               => [ qw(integer 1000) ],
        max_hosts                   => [ qw(bigint 10000) ],
        max_services                => [ qw(bigint 10000) ],
        max_services_per_host       => [ qw(smallint 100) ],
        max_contacts                => [ qw(smallint 100) ],
        max_contactgroups           => [ qw(smallint 100) ],
        max_timeperiods             => [ qw(smallint 1000) ],
        max_timeslices_per_object   => [ qw(smallint 200) ],
        max_groups                  => [ qw(smallint 100) ],
        max_users                   => [ qw(smallint 100) ],
        max_sms                     => [ qw(bigint 10000) ],
        max_dependencies_per_host   => [ qw(smallint 100) ],
        max_downtimes_per_host      => [ qw(smallint 1000) ],
        max_chart_views_per_user    => [ qw(bigint 50) ],
        max_charts_per_user         => [ qw(bigint 1000) ],
        max_metrics_per_chart       => [ qw(smallint 50) ],
        max_dashboards_per_user     => [ qw(smallint 50) ],
        max_dashlets_per_dashboard  => [ qw(smallint 50) ]
    );

    while (my ($col, $val) = each %limit) {
        if (!$self->exist(company => $col)) {
            $self->upgrade("alter table company add column $col $val->[0] not null default $val->[1]");
        }
    }
}

sub v5 {
    my $self = shift;

    if ($self->exist(location => "country_code")) {
        $self->upgrade("alter table location drop column country_code");
    }

    if ($self->exist(location => "is_default")) {
        $self->upgrade("alter table location drop column is_default");
    }

    $self->upgrade("update location set coordinates = '0,0' where coordinates is null");
    $self->upgrade("alter table location alter column coordinates set not null");
}

sub v6 {
    my $self = shift;

    if ($self->dbi->driver eq "Pg") {
        $self->upgrade("alter table plugin alter column info set not null");
    } elsif ($self->dbi->driver eq "mysql") {
        $self->upgrade("alter table plugin modify info text not null");
    }

    $self->upgrade("alter table service_parameter drop column command");

    if ($self->exist(plugin => "metadata")) {
        $self->upgrade("alter table plugin drop column metadata");
    }
}

sub v7 {
    my $self = shift;

    if (!$self->exist(company => "data_retention")) {
        $self->upgrade("alter table company add column data_retention SMALLINT NOT NULL DEFAULT 3650");
    }
}

sub v8 {
    my $self = shift;

    if ($self->dbi->driver eq "Pg") {
        $self->upgrade("alter table contact_timeperiod rename to contact_timeperiod_old");
        $self->upgrade("alter table contact_timeperiod_old alter column id set default '0'");
        $self->upgrade("drop sequence contact_timeperiod_id_seq");
        $self->upgrade(qq{
            CREATE TABLE "notification" (
                "time"              BIGINT DEFAULT 0,
                "host_id"           BIGINT NOT NULL,
                "company_id"        BIGINT NOT NULL DEFAULT 0,
                "message_service"   VARCHAR(20) NOT NULL DEFAULT 'n/a',
                "send_to"           VARCHAR(100) NOT NULL,
                "subject"           VARCHAR(200) NOT NULL,
                "message"           TEXT NOT NULL DEFAULT 'n/a'
            )
        });
        $self->upgrade(qq{
            CREATE INDEX "notification_time_host_id_index" ON "notification" ("time", "host_id")
        });
        $self->upgrade(qq{
            CREATE INDEX "notification_time_company_id_index" ON "notification" ("time", "company_id")
        });
        $self->upgrade(qq{
            CREATE SEQUENCE "contact_message_services_id_seq" START WITH 1 INCREMENT BY 1 NO MAXVALUE NO MINVALUE CACHE 1
        });
        $self->upgrade(qq{
            CREATE TABLE "contact_message_services" (
                "id"                 BIGINT PRIMARY KEY DEFAULT nextval('contact_message_services_id_seq'),
                "contact_id"         BIGINT NOT NULL REFERENCES "contact"("id") ON DELETE CASCADE,
                "message_service"    VARCHAR(20) NOT NULL,
                "enabled"            CHAR(1) NOT NULL DEFAULT 1,
                "send_to"            VARCHAR(100),
                "notification_level" VARCHAR(40) NOT NULL DEFAULT 'all',
                "creation_time"      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
            )
        });
        $self->upgrade(qq{
            CREATE SEQUENCE "contact_timeperiod_id_seq" START WITH 1 INCREMENT BY 1 NO MAXVALUE NO MINVALUE CACHE 1
        });
        $self->upgrade(qq{
            CREATE TABLE "contact_timeperiod" (
                "id"                BIGINT PRIMARY KEY DEFAULT nextval('contact_timeperiod_id_seq'),
                "contact_id"        BIGINT NOT NULL REFERENCES "contact"("id") ON DELETE CASCADE,
                "timeperiod_id"     BIGINT NOT NULL REFERENCES "timeperiod"("id") ON DELETE CASCADE,
                "message_service"   VARCHAR(20) NOT NULL DEFAULT 'all',
                "exclude"           CHAR(1) NOT NULL DEFAULT '0',
                "timezone"          VARCHAR(40) NOT NULL DEFAULT 'Europe/Berlin'
            )
        });
    }

    if ($self->dbi->driver eq "mysql") {
        $self->upgrade("rename table contact_timeperiod to contact_timeperiod_old");
        $self->upgrade(qq{
            CREATE TABLE `notification` (
                `time`              BIGINT DEFAULT 0,
                `host_id`           BIGINT NOT NULL,
                `company_id`        BIGINT NOT NULL DEFAULT 0,
                `message_service`   VARCHAR(20) NOT NULL DEFAULT 'n/a',
                `send_to`           VARCHAR(100) NOT NULL,
                `subject`           VARCHAR(200) NOT NULL,
                `message`           TEXT NOT NULL -- DEFAULT 'n/a'
            ) ENGINE=InnoDB
        });
        $self->upgrade(qq{
            CREATE INDEX `notification_time_host_id_index` ON `notification` (`time`, `host_id`)
        });
        $self->upgrade(qq{
            CREATE INDEX `notification_time_company_id_index` ON `notification` (`time`, `company_id`)
        });
        $self->upgrade(qq{
            CREATE TABLE `contact_message_services` (
                `id`                 BIGINT NOT NULL PRIMARY KEY AUTO_INCREMENT,
                `contact_id`         BIGINT NOT NULL,
                `message_service`    VARCHAR(20) NOT NULL,
                `enabled`            CHAR(1) NOT NULL DEFAULT 1,
                `send_to`            VARCHAR(100),
                `notification_level` VARCHAR(40) NOT NULL DEFAULT 'all',
                `creation_time`      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (`contact_id`) REFERENCES `contact`(`id`) ON DELETE CASCADE
            ) ENGINE=InnoDB
        });
        $self->upgrade(qq{
            CREATE TABLE `contact_timeperiod` (
                `id`                BIGINT NOT NULL PRIMARY KEY AUTO_INCREMENT,
                `contact_id`        BIGINT NOT NULL,
                `timeperiod_id`     BIGINT NOT NULL,
                `message_service`   VARCHAR(20) NOT NULL DEFAULT 'all',
                `exclude`           CHAR(1) NOT NULL DEFAULT '0',
                `timezone`          VARCHAR(40) NOT NULL DEFAULT 'Europe/Berlin',
                FOREIGN KEY (`contact_id`) REFERENCES `contact`(`id`) ON DELETE CASCADE,
                FOREIGN KEY (`timeperiod_id`) REFERENCES `timeperiod`(`id`) ON DELETE CASCADE
            ) ENGINE=InnoDB
        });
    }

    { # copy mail and sms parameter to contact_message_services
        my $sth = $self->dbi->dbh->prepare("select * from contact");
        $sth->execute;

        while (my $row = $sth->fetchrow_hashref) {
            $self->dbi->do(
                $self->sql->insert(
                    table => "contact_message_services",
                    data => {
                        contact_id => $row->{id},
                        message_service => "mail",
                        enabled => $row->{mail_notifications_enabled},
                        send_to => $row->{mail_to},
                        notification_level => $row->{mail_notification_level}
                    }
                )
            ) if $row->{mail_to};

            $self->dbi->do(
                $self->sql->insert(
                    table => "contact_message_services",
                    data => {
                        contact_id => $row->{id},
                        message_service => "sms",
                        enabled => $row->{sms_notifications_enabled},
                        send_to => $row->{sms_to},
                        notification_level => $row->{sms_notification_level}
                    }
                )
            ) if $row->{sms_to};
        }

        $sth->finish;
    };


    { # copy contact_timeperiod_old to contact_timeperiod
        my $sth = $self->dbi->dbh->prepare("select * from contact_timeperiod_old");
        $sth->execute;

        while (my $row = $sth->fetchrow_hashref) {
            if ($row->{type} eq "send_only_mail") {
                $row->{message_service} = "mail";
            } elsif ($row->{type} eq "send_only_sms") {
                $row->{message_service} = "sms";
            } elsif ($row->{type} eq "exclude") {
                $row->{message_service} = "all";
                $row->{exclude} = 1;
            } else {
                $row->{message_service} = "all";
            }

            delete $row->{id};
            delete $row->{type};

            $self->dbi->do(
                $self->sql->insert(
                    table => "contact_timeperiod",
                    data => $row
                )
            );
        }

        $sth->finish;
    };

    $self->upgrade("drop table contact_timeperiod_old");
    $self->upgrade("alter table contact add column escalation_time integer not null default '0'");
    $self->upgrade("update contact set escalation_time = 900 where escalation_level = 1");
    $self->upgrade("update contact set escalation_time = 1200 where escalation_level = 2");
    $self->upgrade("update contact set escalation_time = 1800 where escalation_level = 3");
    $self->upgrade("update contact set escalation_time = 3600 where escalation_level >= 4");
    $self->upgrade("alter table contact drop column escalation_level");
    $self->upgrade("alter table contact drop column mail_to");
    $self->upgrade("alter table contact drop column mail_notifications_enabled");
    $self->upgrade("alter table contact drop column mail_notification_level");
    $self->upgrade("alter table contact drop column sms_to");
    $self->upgrade("alter table contact drop column sms_notifications_enabled");
    $self->upgrade("alter table contact drop column sms_notification_level");
    $self->upgrade("alter table service add column next_check bigint default 0");
    $self->upgrade("alter table service add column next_timeout bigint default 0");
    $self->upgrade("alter table service drop column last_sms");
    $self->upgrade("alter table service drop column last_sms_time");

    if ($self->dbi->{driver} eq "Pg") {
        $self->upgrade("alter table service rename column last_mail to last_notification_1");
        $self->upgrade("alter table service rename column last_mail_time to last_notification_2");
        $self->upgrade("alter table service_parameter rename column mail_soft_interval to notification_interval");
    } elsif ($self->dbi->{driver} eq "mysql") {
        $self->upgrade("alter table service change column last_mail last_notification_1 bigint not null default 0");
        $self->upgrade("alter table service change column last_mail_time last_notification_2 bigint not null default 0");
        $self->upgrade("alter table service_parameter change column mail_soft_interval notification_interval integer not null default 3600");
    }

    $self->upgrade("alter table service_parameter drop column mail_hard_interval");
    $self->upgrade("alter table service_parameter drop column mail_warnings");
    $self->upgrade("alter table service_parameter drop column mail_ok");
    $self->upgrade("alter table service_parameter drop column send_sms");
    $self->upgrade("alter table service_parameter drop column sms_soft_interval");
    $self->upgrade("alter table service_parameter drop column sms_hard_interval");
    $self->upgrade("alter table service_parameter drop column sms_warnings");
    $self->upgrade("alter table service_parameter drop column sms_ok");
    $self->upgrade("alter table service_parameter add column retry_interval integer not null default 0");
    $self->upgrade("alter table host add column notification_interval integer not null default 3600");
    $self->upgrade("alter table host add column retry_interval integer not null default 60");
    $self->upgrade("update service_parameter set notification_interval = 0 where notification_interval = 3600");
    $self->upgrade("drop table roster_host");
    $self->upgrade("drop table roster_contact");
    $self->upgrade("drop table roster_entry");
    $self->upgrade("drop table roster");
    $self->upgrade("create table lock_srvchk (locked char(1))");

    if ($self->dbi->{driver} eq "Pg") {
        $self->upgrade("drop sequence roster_id_seq");
        $self->upgrade("drop sequence roster_entry_id_seq");
        $self->upgrade("drop sequence roster_contact_id_seq");
    }

    { # update next_check and next_timeout
        my $sth = $self->dbi->dbh->prepare(qq{
            select service.id, service.last_check,
                   service_parameter.interval as service_interval, service_parameter.timeout as service_timeout,
                   host.interval as host_interval, host.timeout as host_timeout
            from service
            inner join service_parameter on service.service_parameter_id = service_parameter.ref_id
            inner join host on service.host_id = host.id
        });
        $sth->execute;

        while (my $row = $sth->fetchrow_hashref) {
            my $interval = $row->{service_interval} || $row->{host_interval};
            my $timeout = $row->{service_timeout} || $row->{host_timeout};

            if ($row->{last_check}) {
                $self->dbi->dbh->do(
                    "update service set next_check = ?, next_timeout = ? where id = ?",
                    undef, $row->{last_check} + $interval, $row->{last_check} + $interval + $timeout, $row->{id}
                );
            }
        }
    };
}

sub v9 {
    my $self = shift;

    $self->upgrade("alter table service add column force_event char(1) not null default '0'");
}

sub v10 {
    my $self = shift;

    if ($self->dbi->{driver} eq "Pg") {
        $self->upgrade("alter table host rename column device_class to host_class");
    } elsif ($self->dbi->{driver} eq "mysql") {
        $self->upgrade("alter table host change column device_class host_class varchar(100) not null default ''");
    }

    $self->upgrade("alter table host add column system_class varchar(100) not null default ''");
    $self->upgrade("alter table host add column location_class varchar(100) not null default ''");
}

sub v11 {
    my $self = shift;

    $self->upgrade("alter table host add column os_class varchar(100) not null default ''");
    $self->upgrade("alter table host add column hw_class varchar(100) not null default ''");
    $self->upgrade("alter table host add column env_class varchar(100) not null default ''");
    $self->upgrade("alter table host add column ipaddr6 varchar(45)");

    if ($self->dbi->{driver} eq "Pg") {
        $self->upgrade("alter table dependency alter column host_id drop not null");
        $self->upgrade("alter table dependency alter column service_id drop not null");
        $self->upgrade("alter table dependency alter column on_host_id drop not null");
        $self->upgrade("alter table dependency alter column on_service_id drop not null");
        $self->upgrade("alter table host alter column ipaddr drop not null");
    } elsif ($self->dbi->{driver} eq "mysql") {
        $self->upgrade("alter table dependency change host_id host_id bigint null");
        $self->upgrade("alter table dependency change service_id service_id bigint null");
        $self->upgrade("alter table dependency change on_host_id on_host_id bigint null");
        $self->upgrade("alter table dependency change on_service_id on_service_id bigint null");
        $self->upgrade("alter table host change ipaddr ipaddr varchar(159) null");
    }
}

sub v12 {
    my $self = shift;

    if ($self->dbi->{driver} eq "Pg") {
        $self->upgrade("alter table host_template add column tags text not null default ''");
    } elsif ($self->dbi->{driver} eq "mysql") {
        $self->upgrade("alter table host_template add column tags text not null");
    }

    $self->upgrade("alter table company add column max_hosts_in_reg_queue bigint not null default 1000");
    $self->upgrade("alter table company add column host_reg_authkey varchar(1000) not null default ''");
    $self->upgrade("alter table company add column host_reg_enabled char(1) not null default '0'");
    $self->upgrade("alter table company add column host_reg_allow_from varchar(300) not null default 'all'");
    $self->upgrade("alter table host add column register char(1) not null default '0'");
    $self->upgrade("alter table location add column authkey varchar(1024) not null default ''");
    $self->upgrade("alter table service_parameter add column sum_services smallint not null default '1'");

    my $sth = $self->dbi->dbh->prepare("select ref_id, location_options from service_parameter where location_options != ?");
    $sth->execute(0);

    while (my $row = $sth->fetchrow_hashref) {
        if ($row->{location_options}) {
            my $location_options = $self->c->json->decode($row->{location_options});
            if ($location_options->{check_type} eq "multiple") {
                my $sum = @{$location_options->{locations}};
                if ($sum > 1) {
                    $self->dbi->dbh->do(
                        "update service_parameter set sum_services = ? where ref_id = ?",
                        undef, $sum, $row->{ref_id}
                    );
                }
            }
        }
    }

    $sth->finish;
}

sub v13 {
    my $self = shift;

    $self->upgrade("alter table host drop column hw_manufacturer");
    $self->upgrade("alter table host drop column hw_product");
    $self->upgrade("alter table host drop column os_manufacturer");
    $self->upgrade("alter table host drop column os_product");
    $self->upgrade("alter table host drop column virt_manufacturer");
    $self->upgrade("alter table host drop column virt_product");
    $self->upgrade("alter table host drop column location");
    $self->upgrade("alter table location drop column authkey");
}

sub v14 {
    my $self = shift;

    $self->upgrade("alter table service add column agent_dead char(1) default '0'");
}

1;
