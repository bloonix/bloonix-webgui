package Bloonix::Controller::Hosts;

use strict;
use warnings;

sub startup {
    my ($self, $c) = @_;

    $c->route->map("/hosts")->to("list");
    $c->route->map("/hosts/search")->to("search");
    $c->route->map("/hosts/top")->to("top");
    $c->route->map("/hosts/cats")->to("cats");
    $c->route->map("/hosts/classes/:class(host|system|location|os|hw|env)")->to("classes");
    $c->route->map("/hosts/stats/status")->to("stats_status");
    $c->route->map("/hosts/stats/country")->to("stats_country");
    $c->route->map("/hosts/:id")->to("view");
    $c->route->map("/hosts/:id/services")->to("services");
    $c->route->map("/hosts/:action(activate|deactivate|enable-notification|disable-notification|update-multiple)")->to("action");
    $c->route->map("/hosts/create-downtime")->to("create_downtime");
    $c->route->map("/hosts/delete-downtime")->to("delete_downtime");
    $c->route->map("/hosts/:id/notifications")->to("notifications");
}

sub auto {
    my ($self, $c, $opts) = @_;

    if ($opts && $opts->{id}) {
        $c->stash->object(
            $c->model->database->host->by_host_and_user_id(
                $opts->{id}, $c->user->{id}
            )
        );
        if (!$c->stash->object) {
            $c->plugin->error->object_does_not_exists;
            return undef;
        }
        $self->_de_serialize($c, $c->stash->object);
    }

    return 1;
}

sub view {
    my ($self, $c) = @_;

    $c->stash->data($c->stash->object);
    $c->plugin->util->json_to_pv(variables => $c->stash->data);
    $c->view->render->json;
}

sub services {
    my ($self, $c, $opts) = @_;

    my $services = $c->model->database->service->by_host_and_user_id($opts->{id}, $c->user->{id});
    my %seen;

    foreach my $service (@$services) {
        $service->{nok_time_delta} = time - $service->{status_nok_since};
        foreach my $key (qw/result debug command_options location_options/) {
            if ($service->{$key} && $service->{$key} =~ /^[\[\{].*[\]\}]$/) {
                $service->{$key} = $c->json->utf8(0)->decode($service->{$key});
                if ($key eq "result" && ref $service->{result} eq "ARRAY" && ref $service->{result}->[0] eq "ARRAY") {
                    # bug fix for check-by-satellite from bloonix-plugins-basic 0.42
                    $service->{result} = $service->{result}->[0];
                }
            }
        }
        my $host_template_id = $service->{host_template_id};
        if ($host_template_id) {
            if (!exists $seen{$host_template_id}) {
                $seen{$host_template_id} = $c->model->database->host_template->get($host_template_id);
            }
            $service->{host_template_name} = $seen{$host_template_id}->{name};
        }
    }

    $c->stash->data($services);
    $c->view->render->json;
}

sub classes {
    my ($self, $c, $opts) = @_;

    my $classes = $c->model->database->host->group_by_host_class(
        $c->user->{id}, $opts->{class}
    );

    my $grouped = {
        All => {
            total => 0,
            status => { OK => 0, INFO => 0, WARNING => 0, CRITICAL => 0, UNKNOWN => 0 },
            classes => {}
        }
    };

    # Default classes
    #my @default_classes;

    #if ($opts->{class} eq "host") {
    #    @default_classes = ("/Server", "/vServer", "/Printer", "/Network", "/Database", "/Power");
    #} elsif ($opts->{class} eq "system") {
    #    @default_classes = ("/Linux", "/Windows");
    #} elsif ($opts->{class} eq "location") {
    #    @default_classes = ("/AF", "/AN", "/AS", "/EU", "/NA", "/OC", "/SA");
    #}

    #foreach my $class (@default_classes) {
    #    push @$classes, { count => 0, class => $class };
    #}

    foreach my $row (@$classes) {
        $grouped->{All}->{total} += $row->{count};

        if ($row->{status}) {
            $grouped->{All}->{status}->{$row->{status}} += $row->{count};
        }

        my $classes = $grouped->{All}->{classes};
        $row->{class} =~ s!^/!!;

        foreach my $part (split m!/!, $row->{class}) {
            if (!exists $classes->{$part}) {
                $classes->{$part} = {
                    total => 0,
                    status => { OK => 0, INFO => 0, WARNING => 0, CRITICAL => 0, UNKNOWN => 0 },
                    classes => {}
                };
            }

            if ($row->{status}) {
                $classes->{$part}->{status}->{$row->{status}} += $row->{count};
            }

            $classes->{$part}->{total} += $row->{count};
            $classes = $classes->{$part}->{classes};
        }

    }

    $c->stash->data($grouped);
    $c->view->render->json;
}

sub list {
    my ($self, $c) = @_;

    my $util = $c->plugin->util;
    my $request = $c->plugin->defaults->request
        or return 1;

    my ($count, $data) = $c->model->database->host->by_user_id(
        user => $c->user,
        offset => $request->{offset},
        limit => $request->{limit},
        query => $request->{query},
        sort => $request->{sort},
        order => [
            desc => [ "status_priority.priority", "host.status_nok_since" ],
            asc  => "host.hostname"
            #desc => "priority",
            #asc  => "hostname",
        ]
    );

    my @host_ids = (0);

    foreach my $host (@$data) {
        $host->{nok_time_delta} = time - $host->{status_nok_since};
        $c->plugin->util->json_to_pv(variables => $host);
        $self->_de_serialize($c, $host);

        $host->{duration} = sprintf(
            "%sd %sh %sm %ss",
            $util->secs2str(time - $host->{last_check})
        );

        push @host_ids, $host->{id};
    }

    my $services = $c->model->database->service->by_host_ids_as_hash_by_host_id(
        id => \@host_ids,
        order => [ asc => "service_parameter.service_name" ]
    );

    foreach my $host (@$data) {
        $host->{services} = $services->{ $host->{id} } // {};
    }

    $c->stash->offset($request->{offset});
    $c->stash->total($count);
    $c->stash->data($data);
    $c->view->render->json;
}

sub top {
    my ($self, $c) = @_;

    my ($count, $hosts) = $c->model->database->host->by_user_id(
        user => $c->user,
        offset => 0,
        limit => 100,
        query => $c->req->param("query"),
        order => [
            desc => [ "priority", "status_nok_since" ],
            #desc => "last_check"
        ]
    );

    my @host_ids = (0);

    foreach my $host (@$hosts) {

        $self->_de_serialize($c, $host);

        $host->{last_check} = $c->plugin->util->timestamp(
            $host->{last_check}, $c->user->{timezone}
        );

        push @host_ids, $host->{id};
    }

    my $services = $c->model->database->service->by_host_ids_as_hash_by_host_id(
        id => \@host_ids,
        order => [ asc => "service_parameter.service_name" ]
    );

    foreach my $host (@$hosts) {
        $host->{services} = $services->{ $host->{id} } // {};
    }

    $c->stash->data($hosts);
    $c->view->render->json;
}

sub cats {
    my ($self, $c) = @_;

    $c->stash->data(
        $c->model->database->host->system_categories($c->user->{company_id})
    );

    $c->view->render->json;
}

sub search {
    my ($self, $c) = @_;

    if ($c->req->param("simple")) {
        return $self->simple_search($c);
    }

    return $self->list($c);
}

sub simple_search {
    my ($self, $c) = @_;
    my $search = $c->req->param("search");
    $c->stash->data(
        $c->model->database->host->simple_search(
            $c->user->{id},
            $search
        )
    );
    $c->view->render->json;
}

sub stats_status {
    my ($self, $c) = @_;

    my $status = {
        OK => 0,
        WARNING => 0,
        CRITICAL => 0,
        UNKNOWN => 0,
        INFO => 0,
    };

    my $stats = $c->model->database->host->stats_count_by_user_id($c->user->{id}, "status");

    foreach my $row (@$stats) {
        $status->{ $row->{status} } = $row->{count};
    }

    $status->{TOTAL} = $status->{OK} + $status->{WARNING} + $status->{CRITICAL} + $status->{UNKNOWN} + $status->{INFO};
    $c->stash->data($status);
    $c->view->render->json;
}

sub stats_country {
    my ($self, $c) = @_;

    my $stats = $c->model->database->host->stats_count_country_by_user_id($c->user->{id});

    $c->stash->data($stats);
    $c->view->render->json;
}

sub action {
    my ($self, $c, $opts) = @_;

    $c->plugin->token->check
        or return;

    my $host_ids = [ $c->req->param("host_id") ];

    if (!@$host_ids) {
        return $c->plugin->error->no_objects_selected;
    }

    my $invalid = $c->model->database->host->get_invalid_host_ids_by_user_id($c->user->{id}, $host_ids);

    if ($opts->{action} eq "update-multiple" && $c->user->{role} !~ /^(operator|admin)\z/) {
        return $c->plugin->error->no_privileges_on_action(modify => $host_ids);
    }

    if ($invalid) {
        return $c->plugin->error->objects_does_not_exists($invalid);
    }

    my $noauth = $c->model->database->host->no_privileges_to_modify_service($c->user->{id}, $host_ids);

    if ($noauth) {
        return $c->plugin->error->no_privileges_on_action(modify => $noauth);
    }

    my ($key, $value, $comment_key, $comment_value, $data);
    my $user_id = $c->user->{admin_id} || $c->user->{user_id};
    my $username = $c->user->{admin_username} || $c->user->{username};
    my $timestamp = $c->plugin->util->timestamp;

    if ($opts->{action} eq "activate") {
        ($key, $value) = (active => 1);
        $comment_key = "active_comment";
        $comment_value = "host activated by $username($user_id) at $timestamp";
    } elsif ($opts->{action} eq "deactivate") {
        ($key, $value) = (active => 0);
        $comment_key = "active_comment";
        $comment_value = "host deactivated by $username($user_id) at $timestamp";
    } elsif ($opts->{action} eq "enable-notification") {
        ($key, $value) = (notification => 1);
        $comment_key = "notification_comment";
        $comment_value = "host notification enabled by $username($user_id) at $timestamp";
    } elsif ($opts->{action} eq "disable-notification") {
        ($key, $value) = (notification => 0);
        $comment_key = "notification_comment";
        $comment_value = "host notification disabled by $username($user_id) at $timestamp";
    } elsif ($opts->{action} eq "update-multiple") {
        $c->model->database->host->set($c->user);
        my $form = $c->plugin->action->check_form(update => "host")
            or return;
        $data = $form->data;
        foreach my $key (keys %$data) {
            if (!defined $data->{$key} || $data->{$key} =~ /^\s+\z/) {
                delete $data->{$key};
            }
        }
    }

    if (@$host_ids) {
        if ($data && scalar keys %$data) {
            $c->model->database->host->update(
                data => $data,
                condition => [ id => $host_ids ]
            );
            $c->plugin->log_action->update(
                target => "host",
                data => { data => $data, host_ids => $host_ids },
                old => { }
            );
        } elsif (!$data) {
            $c->model->database->host->update(
                data => { $key => $value, $comment_key => $comment_value },
                condition => [ id => $host_ids ]
            );
            $c->plugin->log_action->update(
                target => "host",
                data => { data => { $key => $value, $comment_key => $comment_value }, host_ids => $host_ids },
                old => { }
            );
        }
    }

    $c->view->render->json;
}

sub create_downtime {
    my ($self, $c) = @_;

    $c->plugin->token->check
        or return;

    my $data = $c->plugin->downtime->validate
        or return;

    my $host_ids = $self->validate_hosts($c)
        or return;

    $c->model->database->begin_transaction
        or return $c->plugin->error->action_failed;

    eval {
        local $SIG{__DIE__} = "DEFAULT";

        foreach my $host_id (@$host_ids) {
            my $count_downtimes = $c->model->database->host->count_downtimes($host_id);

            if ($count_downtimes >= $c->user->{max_downtimes_per_host}) {
                die $c->plugin->error->limit_error("err-823" => $c->user->{max_downtimes_per_host}, $host_id);
            }

            $data->{host_id} = $host_id;
            $c->model->database->host_downtime->create($data)
                or die $c->plugin->error->action_failed;
        }
    };

    if ($@) {
        $c->model->database->rollback_transaction
            or return $c->plugin->error->action_failed;
    } else {
        $c->model->database->end_transaction
            or return $c->plugin->error->action_failed;
    }

    $c->view->render->json;
}

sub delete_downtime {
    my ($self, $c) = @_;

    $c->plugin->token->check
        or return;

    my $host_ids = $self->validate_hosts($c)
        or return;

    my $flag = $c->req->param("flag")
        or return $c->plugin->error->form_parse_errors("flag");

    $c->model->database->host_downtime->delete(
        host_id => $host_ids,
        flag => $flag
    ) or return $c->plugin->error->action_failed;

    $c->view->render->json;
}

sub validate_hosts {
    my ($self, $c) = @_;

    my $host_ids = [ $c->req->param("host_id") ];
    my $invalid = $c->model->database->host->get_invalid_host_ids_by_user_id($c->user->{id}, $host_ids);

    if ($invalid) {
        $c->plugin->error->objects_does_not_exists($invalid);
        return undef;
    }

    my $noauth = $c->model->database->host->no_privileges_to_modify_service(
        $c->user->{id}, $host_ids
    );

    if ($noauth) {
        $c->plugin->error->no_privileges_on_action(modify => $noauth);
        return undef;
    }

    return $host_ids;
}

sub notifications {
    my ($self, $c, $opts) = @_;

    my $request = $c->plugin->defaults->request
        or return 1;

    my $from = $c->req->param("from");
    my $to = $c->req->param("to");
    my $type = $c->req->param("type");
    my @errors;

    if ($from) {
        $from = $c->plugin->util->time2secs($from)
            or push @errors, "from";
    }

    if ($to) {
        $to = $c->plugin->util->time2secs($to)
            or push @errors, "to";
    }

    if ($from && $to && $to < $from) {
        push @errors, "from", "to";
    }

    if (@errors) {
        return $c->plugin->error->form_parse_errors(@errors);
    }

    my ($count, $data) = $c->model->database->notification->by_query(
        offset => $request->{offset},
        limit => $request->{limit},
        query => $request->{query},
        host_id => $opts->{id},
        from_time => $from,
        to_time => $to,
        type => $type
    );

    $c->stash->offset($request->{offset});
    $c->stash->total($count);
    $c->stash->data($data);
    $c->view->render->json;
}

sub _de_serialize {
    my ($self, $c, $host) = @_;

    foreach my $key (qw/options agent_options facts/) {
        if (exists $host->{$key}) {
            eval {
                local $SIG{__DIE__};
                $host->{$key} = $c->json->utf8(0)->decode($host->{$key});
            };
        }
    }
}

1;
