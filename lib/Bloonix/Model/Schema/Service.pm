package Bloonix::Model::Schema::Service;

use strict;
use warnings;
use base qw(Bloonix::DBI::Base);
use base qw(Bloonix::DBI::CRUD);

sub set {
    my ($self, $plugin, $action, $template) = @_;

    if (!$plugin) {
        die "no plugin set";
    }

    my @params = (
        service_name => {
            min_size => 1,
            max_size => 100
        },
        description => {
            max_size => 100,
            default => ""
        },
        comment => {
            max_size => 100,
            default => ""
        },
        host_alive_check => {
            options => [ 0, 1 ],
            default => 0
        },
        passive_check => {
            options => [ 0, 1 ],
            default => 0
        },
        notification_interval => {
            options => [ 0, 300, 900, 1800, 2700, 3600, 7200, 14400, 28800, 43200, 57600, 86400, 172800 ],
            default => 3600
        },
        attempt_max => {
            options => [ 0 .. 20 ],
            default => 3
        },
        attempt_warn2crit => {
            options => [ 0, 1 ],
            default => 0
        },
        is_volatile => {
            options => [ 0, 1 ],
            default => 0
        },
        fd_enabled => {
            options => [ 0, 1 ],
            default => 1
        },
        fd_time_range => {
            options => [ 300, 900, 1800, 2700, 3600, 7200, 14400, 28800, 43200, 57600, 86400, 172800 ],
            default => 1800
        },
        fd_flap_count => {
            options => [ 1 .. 20 ],
            default => 6
        },
        agent_id => {
            options => $plugin->{netaccess}
                ? [ "localhost", "intranet", "remote" ]
                : [ "localhost" ],
            default => $plugin->{prefer}
        },
        retry_interval => {
            options => [ 0, 15, 30, 60, 120, 180, 300, 600, 900, 1800, 3600 ],
            default => 0
        }
    );

    push @params, $self->get_check_frequency($plugin);

    if (!$template) {
        push @params, (
            status_nok_since => {
                regex => qr/^\d{10}\z/,
                default => time
            },
            active => {
                options => [ 0, 1 ],
                default => 1
            },
            acknowledged => {
                options => [ 0, 1 ],
                default => 0
            },
            notification => {
                options => [ 0, 1 ],
                default => 1
            },
            volatile_status => {
                options => [ 0, 1 ],
                default => 0
            }
        );
    }

    if (ref $plugin ne "HASH") {
        $plugin = $self->schema->plugin->find(condition => [ plugin => $plugin ]);
    }

    if ($action eq "create") {
        push @params, plugin_id => {
            default => $plugin->{id}
        };
    }

    $self->validator->set(@params);
}

sub get_check_frequency {
    my ($self, $plugin) = @_;
    $plugin->{flags} ||= "";

    # check-linux-updates
    if ($plugin->{id} == 23 || $plugin->{flags} =~ /low-check-frequency/) {
        return (
            interval => {
                options => [ 28800, 43200, 57600, 86400 ],
                default => 43200
            },
            timeout => {
                options => [ 300, 600, 900, 1800, 3600 ],
                default => 600
            }
        );
    }

    # check-wtrm
    if ($plugin->{id} == 58 || $plugin->{flags} =~ /mid-check-frequency/) {
        return (
            interval => {
                options => [
                    ($self->c->config->{webapp}->{check_frequency} eq "high" ? (60, 120, 300) : ()),
                    600, 900, 1800, 3600, 7200, 14400, 28800, 43200, 57600, 86400
                ],
                default => 600,
            },
            timeout => {
                options => [
                    ($self->c->config->{webapp}->{check_frequency} eq "high" ? (60, 120) : ()),
                    300, 600, 900, 1800, 3600
                ],
                default => 300,
            }
        );
    }

    # Default frequency
    return (
        interval => {
            options => [
                0, ($self->c->config->{webapp}->{check_frequency} eq "high" ? (15, 30) : ()),
                60, 120, 300, 600, 900, 1800, 3600, 7200, 14400, 28800, 43200, 57600, 86400
            ],
            default => 0,
        },
        timeout => {
            options => [
                0, ($self->c->config->{webapp}->{check_frequency} eq "high" ? (30, 60, 120) : ()),
                180, 300, 600, 900, 1800, 3600
            ],
            default => 0,
        }
    );
}

sub set_small {
    my $self = shift;

    $self->validator->set(
        active => {
            options => [ 0, 1 ],
            default => 1
        },
        acknowledged => {
            options => [ 0, 1 ],
            default => 0
        },
        notification => {
            options => [ 0, 1 ],
            default => 1
        },
        volatile_status => {
            options => [ 0, 1 ],
            default => 0
        }
    );
}

sub stats_count_by_user_id {
    my ($self, $userid, $key) = @_;

    my ($stmt, @bind) = $self->sql->select(
        table => "service",
        column => [
            $key,
            { function => "count", column => $key, "alias" => "count" },
        ],
        condition => [
            where => {
                table => "service",
                column => "host_id",
                op => "in",
                value => {
                    distinct => 1,
                    table => "host",
                    column => "id",
                    join => [
                        inner => {
                            table => "host_group",
                            left  => "host.id",
                            right => "host_group.host_id"
                        },
                        inner => {
                            table => "user_group",
                            left  => "host_group.group_id",
                            right => "user_group.group_id"
                        }
                    ],
                    condition => [
                        "user_group.user_id" => $userid
                    ]
                }
            }
        ],
        group_by => [ $key ]
    );

    return $self->dbi->fetch($stmt, @bind);
}

sub by_service_id {
    my ($self, $id) = @_;

    my ($stmt, @bind) = $self->sql->select(
        table => [
            service => "*",
            service_parameter => "*",
            host => "hostname",
            plugin => "plugin",
        ],
        join => [
            inner => {
                table => "service_parameter",
                left => "service.service_parameter_id",
                right => "service_parameter.ref_id"
            },
            inner => {
                table => "host",
                left => "service.host_id",
                right => "host.id"
            },
            inner => {
                table => "plugin",
                left => "service_parameter.plugin_id",
                right => "plugin.id"
            }
        ],
        condition => [
            where => {
                table => "service",
                column => "id",
                value => $id,
            }
        ]
    );

    return $self->dbi->unique($stmt, @bind);
}

sub by_service_ids_as_hash {
    my ($self, $ids, $user_id) = @_;

    my @join = (
        inner => {
            table => "service_parameter",
            left => "service.service_parameter_id",
            right => "service_parameter.ref_id"
        },
        inner => {
            table => "host",
            left => "service.host_id",
            right => "host.id"
        },
        inner => {
            table => "plugin",
            left => "service_parameter.plugin_id",
            right => "plugin.id"
        }
    );

    my @condition = (
        where => {
            table => "service",
            column => "id",
            op => "in",
            value => $ids,
        }
    );

    my @stmt = (
        distinct => 1,
        table => [
            service => "*",
            service_parameter => "*",
            host => "hostname",
            plugin => "plugin"
        ],
        join => \@join,
        condition => \@condition
    );

    if ($user_id) {
        push @join, (
            inner => {
                table => "host_group",
                left  => "host.id",
                right => "host_group.host_id"
            },
            inner => {
                table => "user_group",
                left  => "host_group.group_id",
                right => "user_group.group_id"
            }
        );

        push @condition, (
            and => {
                table => "user_group",
                column => "user_id",
                value => $user_id
            }
        );
    }

    my ($stmt, @bind) = $self->sql->select(@stmt);
    return $self->dbi->fetchhash("id", $stmt, @bind);
}

sub by_host_id_as_hash {
    my ($self, $id) = @_;

    my ($stmt, @bind) = $self->sql->select(
        table => [
            service => "*",
            service_parameter => "*"
        ],
        join => [
            inner => {
                table => "service_parameter",
                left => "service.service_parameter_id",
                right => "service_parameter.ref_id"
            },
        ],
        condition => [ "service.host_id" => $id ]
    );

    return $self->dbi->fetchhash("id", $stmt, @bind);
}

sub by_host_id {
    my ($self, %opts) = @_;

    my @stmt = (
        table => [
            service => "*",
            service_parameter => "*"
        ],
        join => [
            inner => {
                table => "service_parameter",
                left => "service.service_parameter_id",
                right => "service_parameter.ref_id"
            },
        ],
        condition => [ "service.host_id" => $opts{id} ]
    );

    if ($opts{order}) {
        push @stmt, order => $opts{order};
    }

    return $self->dbi->fetch( $self->sql->select(@stmt) );
}

sub by_host_ids_as_hash_by_host_id {
    my $self = shift;

    my $services = $self->by_host_id(@_);
    my %by_host_id;

    foreach my $service (@$services) {
        push @{$by_host_id{ $service->{host_id} }}, $service;
    }

    return \%by_host_id;
}

sub by_host_and_service_id {
    my ($self, %opts) = @_;

    my ($stmt, @bind) = $self->sql->select(
        table => [
            service => "*",
            service_parameter => "*",
            plugin => "plugin"
        ],
        join => [
            inner => {
                table => "service_parameter",
                left => "service.service_parameter_id",
                right => "service_parameter.ref_id"
            },
            inner => {
                table => "plugin",
                left => "service_parameter.plugin_id",
                right => "plugin.id"
            }
        ],
        condition => [
            where => {
                table => "service",
                column => "id",
                value => $opts{id}
            },
            and => {
                table => "service",
                column => "host_id",
                value => $opts{host_id}
            }
        ]
    );

    return $self->dbi->unique($stmt, @bind);
}

sub by_user_id {
    my ($self, $opts) = (shift, {@_});

    my @condition = (
        where => {
            table => "user_group",
            column => "user_id",
            value => $opts->{user_id}
        }
    );

    if ($opts->{condition}) {
        push @condition, pre => [ and => $opts->{condition} ];
    }

    my @select = (
        distinct => 1,
        table => [
            service => "*",
            service_parameter => "*",
            host => [
                "hostname", "interval", "ipaddr",
                "notification AS host_notification",
                "active AS host_active"
            ],
            company => [ "id AS company_id", "company" ],
            status_priority => "priority",
            plugin => "plugin"
        ],
        join => [
            inner => {
                table => "service_parameter",
                left => "service.service_parameter_id",
                right => "service_parameter.ref_id"
            },
            inner => {
                table => "host",
                left => "service.host_id",
                right => "host.id"
            },
            inner => {
                table => "company",
                left => "host.company_id",
                right => "company.id"
            },
            inner => {
                table => "status_priority",
                left => "service.status",
                right => "status_priority.status"
            },
            inner => {
                table => "host_group",
                left => "host.id",
                right => "host_group.host_id"
            },
            inner => {
                table => "user_group",
                left => "host_group.group_id",
                right => "user_group.group_id"
            },
            inner => {
                table => "plugin",
                left => "service_parameter.plugin_id",
                right => "plugin.id"
            }
        ],
        condition => \@condition
    );

    if ($opts->{sort}) {
        if ($opts->{sort}->{by} eq "plugin") {
            $opts->{sort}->{by} = "plugin.plugin";
        }
        push @select, order => [ $opts->{sort}->{type} => $opts->{sort}->{by} ];
    } elsif ($opts->{order}) {
        push @select, order => $opts->{order};
    }

    my ($count, $services) = $self->dbi->query(
        offset => $opts->{offset},
        limit => $opts->{limit},
        query => $opts->{query},
        count => "service.id",
        maps => {
            h => "host.hostname", hostname => "host.hostname",
            sn => "service_parameter.service_name", service_name => "service_parameter.service_name",
            p => "plugin.plugin", plugin => "plugin.plugin",
            s => "service.status", status => "service.status",
            i => "service_parameter.agent_id", agent_id => "service_parameter.agent_id"
        },
        concat => [
            "host.hostname", "service_parameter.service_name", "service_parameter.plugin_id",
            "service.status", "service.message", "service_parameter.agent_id"
        ],
        delimiter => " ",
        select => \@select,
    );

    return ($count, $services);
}

sub by_host_and_user_id {
    my ($self, $host_id, $user_id) = @_;

    my @stmt = (
        distinct => 1,
        table => [
            service => "*",
            service_parameter => "*",
            plugin => "plugin"
        ],
        join => [
            inner => {
                table => "service_parameter",
                left => "service.service_parameter_id",
                right => "service_parameter.ref_id"
            },
            inner => {
                table => "host_group",
                left  => "service.host_id",
                right => "host_group.host_id"
            },
            inner => {
                table => "user_group",
                left  => "host_group.group_id",
                right => "user_group.group_id"
            },
            inner => {
                table => "plugin",
                left => "service_parameter.plugin_id",
                right => "plugin.id"
            }
        ],
    );

    if ($host_id =~ /^\d+\z/) {
        push @stmt, condition => [
            where => {
                table => "service",
                column => "host_id",
                value => $host_id,
            },
            and => {
                table => "user_group",
                column => "user_id",
                value => $user_id,
            },
        ];
    }

    push @stmt, order => [ asc => "service_name" ];
    my ($stmt, @bind) = $self->sql->select(@stmt);

    return $self->dbi->fetch($stmt, @bind);
}

sub by_host_service_and_user_id {
    my ($self, $host_id, $service_id, $user_id) = @_;

    my ($stmt, @bind) = $self->sql->select(
        distinct => 1,
        table => "service",
        column => "id",
        join => [
            inner => {
                table => "host_group",
                left  => "service.host_id",
                right => "host_group.host_id",
            },
            inner => {
                table => "user_group",
                left  => "host_group.group_id",
                right => "user_group.group_id",
            },
        ],
        condition => [
            where => {
                table => "service",
                column => "id",
                value => $service_id
            },
            and => {
                table => "service",
                column => "host_id",
                value => $host_id
            },
            and => {
                table => "user_group",
                column => "user_id",
                value => $user_id
            }
        ]
    );

    return $self->dbi->unique($stmt, @bind);
}

sub by_service_and_user_id {
    my ($self, $service_id, $user_id) = @_;

    my ($stmt, @bind) = $self->sql->select(
        distinct => 1,
        table => [
            service => "*",
            service_parameter => "*",
            host => [qw(ipaddr hostname)],
            plugin => "plugin"
        ],
        join => [
            inner => {
                table => "service_parameter",
                left => "service.service_parameter_id",
                right => "service_parameter.ref_id"
            },
            inner => {
                table => "host",
                left => "service.host_id",
                right => "host.id"
            },
            inner => {
                table => "host_group",
                left  => "service.host_id",
                right => "host_group.host_id"
            },
            inner => {
                table => "user_group",
                left  => "host_group.group_id",
                right => "user_group.group_id"
            },
            inner => {
                table => "plugin",
                left => "service_parameter.plugin_id",
                right => "plugin.id"
            }
        ],
        condition => [
            where => {
                table => "service",
                column => "id",
                value => $service_id
            },
            and => {
                table => "user_group",
                column => "user_id",
                value => $user_id
            }
        ]
    );

    return $self->dbi->unique($stmt, @bind);
}

sub count_by_company_id {
    my ($self, $id, $skip_service_id) = @_;

    my @condition = (
        where => {
            table => "host",
            column => "company_id",
            value => $id
        }
    );

    if ($skip_service_id) {
        push @condition, (
            and => {
                table => "service",
                column => "id",
                op => "!=",
                value => $skip_service_id
            }
        );
    }

    my ($stmt, @bind) = $self->sql->select(
        table => "service",
        sum => "service_parameter.sum_services",
        join  => [
            inner => {
                table => "service_parameter",
                left => "service.service_parameter_id",
                right => "service_parameter.ref_id"
            },
            inner => {
                table => "host",
                left  => "service.host_id",
                right => "host.id",
            }
        ],
        condition => \@condition
    );

    return $self->dbi->sum($stmt, @bind);
}

sub warnings_by_user_id {
    my ($self, %opts) = @_;

    my $user_id = $opts{user_id};
    my $hosts = $self->schema->host->warnings_by_user_id(%opts);
    my @host_ids = (0, map { $_->{id} } @$hosts);

    my ($stmt, @bind) = $self->sql->select(
        table => [
            service => [qw(id host_id last_check message status)],
            service_parameter => [qw(service_name)]
        ],
        join => [
            inner => {
                table => "service_parameter",
                left => "service.service_parameter_id",
                right => "service_parameter.ref_id"
            },
            inner => {
                table => "status_priority",
                left  => "service.status",
                right => "status_priority.status",
            },
        ],
        condition => [
            where => {
                table => "service",
                column => "host_id",
                op => "in",
                value => \@host_ids,
            },
            and => {
                table => "service",
                column => "active",
                value => 1
            }
        ],
        order => [
            desc => [ "status_priority.priority", "service.host_id" ]
        ],
    );

    my $services = $self->dbi->fetch($stmt, @bind);
    my %by_host_id;

    foreach my $s (@$services) {
        push @{$by_host_id{$s->{host_id}}}, $s;
    }

    foreach my $h (@$hosts) {
        $h->{services} = $by_host_id{$h->{id}} || [];
    }

    return $hosts;
}

sub top {
    my ($self, $host_ids, $offset, $limit) = @_;
    $offset //= 0;
    $limit //= 25;

    my ($stmt, @bind) = $self->sql->select(
        distinct => 1,
        table => [
            service => [ "id", "host_id", "status", "last_check", "message" ],
            service_parameter => "service_name",
            host => "hostname",
            status_priority => "priority"
        ],
        join => [
            inner => {
                table => "service_parameter",
                left => "service.service_parameter_id",
                right => "service_parameter.ref_id"
            },
            inner => {
                table => "host",
                left  => "service.host_id",
                right => "host.id",
            },
            inner => {
                table => "status_priority",
                left  => "host.status",
                right => "status_priority.status",
            },
        ],
        condition => [
            where => {
                table => "host",
                column => "id",
                value => $host_ids,
            },
            and => {
                table => "host",
                column => "active",
                value => 1,
            },
            and => {
                table => "service",
                column => "active",
                value => 1,
            },
        ],
        order => [
            desc => [ "status_priority.priority", "service.last_check" ]
        ],
        offset => $offset,
        limit => $limit
    );

    return $self->dbi->fetch($stmt, @bind);
}

sub get_invalid_service_ids_by_user_id {
    my ($self, $user_id, $service_ids) = @_;
    my %check_ids = map { $_ => 1 } @$service_ids;
    @$service_ids = grep /^\d+\z/, @$service_ids;

    my ($stmt, @bind) = $self->sql->select(
        distinct => 1,
        table => "service",
        column => "id",
        join => [
            inner => {
                table => "host_group",
                left  => "service.host_id",
                right => "host_group.host_id",
            },
            inner => {
                table => "user_group",
                left  => "host_group.group_id",
                right => "user_group.group_id",
            },
        ],
        condition => [
            where => {
                table => "user_group",
                column => "user_id",
                value => $user_id,
            },
            and => {
                table => "service",
                column => "id",
                op => "in",
                value => $service_ids
            }
        ],
    );

    my $sth = $self->dbi->execute($stmt, @bind);

    while (my $row = $sth->fetchrow_hashref) {
        delete $check_ids{ $row->{id} };
    }

    $sth->finish;
    return scalar keys %check_ids ? [ keys %check_ids ] : undef;
}

sub no_privileges_to_modify_service {
    my $self = shift;
    return $self->_no_privileges(update_service => @_);
}

sub no_privileges_to_delete_service {
    my $self = shift;
    return $self->_no_privileges(delete_service => @_);
}

sub _no_privileges {
    my ($self, $action, $user_id, $service_ids) = @_;
    my %check_ids = map { $_ => 1 } @$service_ids;
    @$service_ids = grep /^\d+\z/, @$service_ids;

    my ($stmt, @bind) = $self->sql->select(
        distinct => 1,
        table => "service",
        column => "id",
        join => [
            inner => {
                table => "host",
                left  => "service.host_id",
                right => "host.id",
            },
            inner => {
                table => "host_group",
                left  => "host.id",
                right => "host_group.host_id",
            },
            inner => {
                table => "user_group",
                left  => "host_group.group_id",
                right => "user_group.group_id",
            }
        ],
        condition => [
            where => {
                table => "user_group",
                column => "user_id",
                value => $user_id,
            },
            and => {
                table => "user_group",
                column => $action,
                value => 1
            }
        ]
    );

    my $sth = $self->dbi->execute($stmt, @bind);

    while (my $row = $sth->fetchrow_hashref) {
        delete $check_ids{ $row->{id} };
    }

    $sth->finish;
    return scalar keys %check_ids ? [ keys %check_ids ] : undef;
}

sub _is_contactgroup_member {
    my ($self, $opts) = @_;
    my $user = $opts->{user};

    my %select = (
        distinct => 1,
        table => [
            service => "id",
            service_parameter => "service_name",
            host => "hostname"
        ],
        join => [
            inner => {
                table => "service_parameter",
                left => "service.service_parameter_id",
                right => "service_parameter.ref_id"
            },
            inner => {
                table => "host",
                left  => "service.host_id",
                right => "host.id"
            },
            inner => {
                table => "host_group",
                left  => "host.id",
                right => "host_group.host_id"
            },
            inner => {
                table => "user_group",
                left  => "host_group.group_id",
                right => "user_group.group_id"
            },
            inner => {
                table => "service_contactgroup",
                left  => "service.id",
                right => "service_contactgroup.service_id"
            }
        ],
        condition => [
            where => {
                table => "user_group",
                column => "user_id",
                value => $user->{id}
            },
            and => {
                table => "service_contactgroup",
                column => "contactgroup_id",
                value => $opts->{contactgroup_id}
            }
        ],
        order => [ asc => "id" ]
    );

    if ($user->{role} ne "admin") {
        push @{$select{condition}}, (
            and => {
                table => "host",
                column => "company_id",
                value => $user->{company_id}
            }
        );
    }

    return %select;
}

sub _is_not_contactgroup_member {
    my ($self, $opts) = @_;
    my $user = $opts->{user};

    my %select = (
        distinct => 1,
        table => [
            service => "id",
            service_parameter => "service_name",
            host => "hostname"
        ],
        join => [
            inner => {
                table => "service_parameter",
                left => "service.service_parameter_id",
                right => "service_parameter.ref_id"
            },
            inner => {
                table => "host",
                left  => "service.host_id",
                right => "host.id"
            },
            inner => {
                table => "host_group",
                left  => "host.id",
                right => "host_group.host_id"
            },
            inner => {
                table => "user_group",
                left  => "host_group.group_id",
                right => "user_group.group_id"
            }
        ],
        condition => [
            where => {
                table => "user_group",
                column => "user_id",
                value => $user->{id}
            },
            and => {
                table => "service",
                column => "id",
                op => "not in",
                value => {
                    distinct => 1,
                    table => "service_contactgroup",
                    column => "service_id",
                    condition => [
                        where => {
                            table => "service_contactgroup",
                            column => "contactgroup_id",
                            value => $opts->{contactgroup_id}
                        }
                    ]
                }
            }
        ],
        order => [ asc => "id" ]
    );

    if ($user->{role} ne "admin") {
        push @{$select{condition}}, (
            and => {
                table => "host",
                column => "company_id",
                value => $user->{company_id}
            }
        );
    }

    return %select;
}

sub search_contactgroup_member {
    my ($self, $opts) = (shift, {@_});

    my @select = $opts->{is_in_group} 
        ? $self->_is_contactgroup_member($opts)
        : $self->_is_not_contactgroup_member($opts);

    my ($count, $contacts) = $self->dbi->query(
        offset => $opts->{offset},
        limit => $opts->{limit},
        query => $opts->{query},
        maps => {
            service => "service_parameter.service_name",
            hostname => "host.hostname"
        },
        concat => [
            "service.id", "host.hostname"
        ],
        delimiter => " ",
        count => "service.id",
        select => \@select
    );

    return ($count, $contacts);
}

sub create_new_service {
    my ($self, $service_parameter_options) = @_;
    my $service_options = {};

    foreach my $key (qw/host_id active acknowledged notification message status updated status_nok_since volatile_status/) {
        if (defined $service_parameter_options->{$key}) {
            $service_options->{$key} = delete $service_parameter_options->{$key};
        }
    }

    $service_parameter_options->{command_options} //= "[]";
    $service_parameter_options->{location_options} //= 0;
    $service_parameter_options->{agent_options} //= "{}";

    my $service_parameter = $self->schema->service_parameter->create_and_get($service_parameter_options)
        or return undef;

    $service_options->{service_parameter_id} = $service_parameter->{ref_id};
    $service_options->{message} //= "waiting for initialization";

    my $service = $self->create_and_get($service_options);
    return $self->by_service_id($service->{id});
}

sub update_service {
    my ($self, $service_id, $service_parameter_id, $service_parameter_options) = @_;
    my $service_options = {};

    foreach my $key (qw/
        active active_comment acknowledged acknowledged_comment notification notification_comment volatile_comment
        next_check next_timeout
    /) {
        if (defined $service_parameter_options->{$key}) {
            $service_options->{$key} = delete $service_parameter_options->{$key};
        }
    }

    $self->schema->service_parameter->update(
        data => $service_parameter_options,
        condition => [ ref_id => $service_parameter_id ]
    ) or return undef;

    if (scalar keys %$service_options) {
        return $self->update($service_id => $service_options);
    }

    return 1;
}

sub get_max_status_by_host_id {
    my ($self, $host_id) = @_;

    my ($stmt, @bind) = $self->sql->select(
        distinct => 1,
        table => [
            service => "status",
            status_priority => "priority"
        ],
        join => [
            inner => {
                table => "status_priority",
                left  => "service.status",
                right => "status_priority.status"
            }
        ],
        condition => [
            where => {
                table => "service",
                column => "host_id",
                value => $host_id
            }
        ],
        order => [ desc => "status_priority.priority" ]
    );

    my $res = $self->dbi->unique($stmt, @bind);
    return $res ? $res->{status} : "INFO";
}

sub update_max_host_status {
    my ($self, $host_id) = @_;

    my $status = $self->get_max_status_by_host_id($host_id);

    $self->schema->host->update($host_id => { status => $status });
}

1;
