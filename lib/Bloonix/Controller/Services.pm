package Bloonix::Controller::Services;

use strict;
use warnings;

sub startup {
    my ($self, $c) = @_;

    $c->route->maps(qw/list warnings top/);
    $c->route->map("search")->to("list");
    $c->route->map("stats/status")->to("stats_status");
    $c->route->map("stats/notes")->to("stats_notes");
    $c->route->map(":id")->to("get");
    $c->route->map(":id/location-stats")->to("stats");

    my $actions = join("|", qw(
        activate deactivate
        enable-notification disable-notification
        acknowledge clear-acknowledgement
        clear-volatile-status force-next-check
    ));

    # Actions for multiple hosts
    $c->route->map(":action($actions)")->to("action");
    $c->route->map("create-downtime")->to("create_downtime");
}

sub list {
    my ($self, $c) = @_;

    my $util = $c->plugin->util;
    my $request = $c->plugin->defaults->request
        or return 1;

    my ($count, $data) = $c->model->database->service->by_user_id(
        user_id => $c->user->{id},
        offset => $request->{offset},
        limit => $request->{limit},
        query => $request->{query},
        sort => $request->{sort},
        order => [
            desc => [ "status_priority.priority", "service.status_nok_since" ],
            asc  => [ "host.hostname", "service_parameter.service_name" ]
        ],
    );

    my %seen;
    foreach my $service (@$data) {
        $service->{nok_time_delta} = time - $service->{status_nok_since};
        foreach my $key (qw/result debug command_options location_options/) {
            if ($service->{$key} && $service->{$key} =~ /^[\[\{].*[\]\}]$/) {
                $service->{$key} = $c->json->utf8(0)->decode($service->{$key});
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

    $c->stash->offset($request->{offset});
    $c->stash->total($count);
    $c->stash->data($data);
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

    my $stats = $c->model->database->service->stats_count_by_user_id($c->user->{id}, "status");

    foreach my $row (@$stats) {
        $status->{ $row->{status} } = $row->{count};
    }

    $status->{TOTAL} = $status->{OK} + $status->{WARNING} + $status->{CRITICAL} + $status->{UNKNOWN} + $status->{INFO};
    $c->stash->data($status);
    $c->view->render->json;
}

sub stats_notes {
    my ($self, $c) = @_;

    my $status = {
        flapping => { yes => 0, no => 0 },
        acknowledged => { yes => 0, no => 0 },
        scheduled => { yes => 0, no => 0 },
        total => 0
    };

    my $acks = $c->model->database->service->stats_count_by_user_id($c->user->{id}, "acknowledged");
    my $scheds = $c->model->database->service->stats_count_by_user_id($c->user->{id}, "scheduled");
    my $flaps = $c->model->database->service->stats_count_by_user_id($c->user->{id}, "flapping");

    foreach my $ref ($acks, $scheds, $flaps) {
        next unless $ref;

        foreach my $item (@$ref) {
            my $statkey;

            foreach my $key (qw/acknowledged scheduled flapping/) {
                if (exists $item->{$key}) {
                    $statkey = $key;
                    last;
                }
            }

            if ($item->{$statkey} == 1) {
                $status->{$statkey}->{yes} = $item->{count};
                $status->{total} += $item->{count};
            } else {
                $status->{$statkey}->{no} = $item->{count};
                $status->{total} += $item->{count};
            }
        }
    }

    $c->stash->data($status);
    $c->view->render->json;
}

sub warnings {
    my ($self, $c) = @_;

    $c->stash->data($c->model->database->service->warnings_by_user_id(user_id => $c->user->{id}));
    $c->view->render->json;
}

sub get {
    my ($self, $c, $opts) = @_;

    my $service = $c->model->database->service->by_service_and_user_id(
        $opts->{id}, $c->user->{id}
    ) or return $c->plugin->error->object_does_not_exists;

    foreach my $key (qw/command_options location_options agent_options/) {
        if ($service->{$key}) {
            $service->{$key} = $c->json->utf8(0)->decode($service->{$key});
        }
    }

    $c->stash->data($service);
    $c->view->render->json;
}

sub stats {
    my ($self, $c, $opts) = @_;

    my $service = $c->model->database->service->by_service_and_user_id(
        $opts->{id}, $c->user->{id}
    ) or return $c->plugin->error->object_does_not_exists;

    my $host = $c->model->database->host->get($service->{host_id});
    my $from = (time - 86400) * 1000;
    my $to = time * 1000;

    my $event_rows = $c->model->rest->results->get(
        service_id => $service->{id},
        from_time => $from,
        to_time => $to
    );

    my @events;
    foreach my $row (@$event_rows) {
        push @events, $row->{_source};
    }

    my $stat_rows = $c->model->rest->stats->get(
        service_id => $service->{id},
        from_time => $from,
        to_time => $to
    );

    $c->log->info("got", scalar @$stat_rows, "rows of raw data");
    $c->log->info("start averaging rest data");

    my ($avgstats, $minstats, $maxstats) = $c->plugin->chart->shrink(
        rows => $stat_rows,
        avg => int(($to - $from) / 600),
        timeout => ($host->{interval} + $host->{timeout}) * 1000
    );

    $c->stash->data(
        events => \@events,
        avgstats => $avgstats,
        minstats => $minstats,
        maxstats => $maxstats
    );

    $c->view->render->json;
}

sub top {
    my ($self, $c) = @_;

    my ($count, $rows) = $c->model->database->service->by_user_id(
        user_id => $c->user->{id},
        offset => 0,
        limit => 100,
        query => scalar $c->req->param("query"),
        order => [
            desc => [ "status_priority.priority", "service.last_check" ]
        ]
    );

    foreach my $row (@$rows) {
        $row->{last_check} = $c->plugin->util->timestamp(
            $row->{last_check}, $c->user->{timezone}
        );
    }

    $c->stash->data($rows);
    $c->view->render->json;
}

sub action {
    my ($self, $c, $opts) = @_;

    $c->plugin->token->check
        or return;

    my $service_ids = [ $c->req->param("service_id") ];
    my $invalid = $c->model->database->service->get_invalid_service_ids_by_user_id($c->user->{id}, $service_ids);

    if ($invalid) {
        return $c->plugin->error->objects_does_not_exists($invalid);
    }

    my $noauth = $c->model->database->service->no_privileges_to_modify_service(
        $c->user->{id}, $service_ids
    );

    if ($noauth) {
        return $c->plugin->error->no_privileges_on_action(modify => $noauth);
    }

    my %update;
    my $user_id = $c->user->{admin_id} || $c->user->{user_id};
    my $username = $c->user->{admin_username} || $c->user->{username};
    my $timestamp = $c->plugin->util->timestamp;

    if ($opts->{action} eq "activate") {
        $update{active} = 1;
        $update{active_comment} = "service activated by $username($user_id) at $timestamp";
    } elsif ($opts->{action} eq "deactivate") {
        $update{active} = 0;
        $update{active_comment} = "service deactivated by $username($user_id) at $timestamp";
    } elsif ($opts->{action} eq "enable-notification") {
        $update{notification} = 1;
        $update{notification_comment} = "service notification enabled by $username($user_id) at $timestamp";
    } elsif ($opts->{action} eq "disable-notification") {
        $update{notification} = 0;
        $update{notification_comment} = "service notification disabled by $username($user_id) at $timestamp";
    } elsif ($opts->{action} eq "acknowledge") {
        $update{acknowledged} = 1;
        $update{acknowledged_comment} = "service acknowledged by $username($user_id) at $timestamp";
    } elsif ($opts->{action} eq "clear-acknowledgement") {
        $update{acknowledged} = 0;
        $update{acknowledged_comment} = "service acknowledgement cleared by $username($user_id) at $timestamp";
    } elsif ($opts->{action} eq "clear-volatile-status") {
        $update{volatile_status} = 0;
        $update{volatile_comment} = "volatile status cleared by $username($user_id) at $timestamp";
    } elsif ($opts->{action} eq "force-next-check") {
        $update{force_check} = 1;
    }

    $c->plugin->log_action->update(
        target => "service",
        data => { service_id => $service_ids, action => $opts->{action} },
        old => { }
    );

    $c->model->database->service->update(
        data => \%update,
        condition => [ id => $service_ids ]
    );

    $c->view->render->json;
}

sub create_downtime {
    my ($self, $c) = @_;

    my $data = $c->plugin->downtime->validate
        or return;

    my $service_ids = [ $c->req->param("service_id") ];
    my $invalid = $c->model->database->service->get_invalid_service_ids_by_user_id($c->user->{id}, $service_ids);

    if ($invalid) {
        return $c->plugin->error->objects_does_not_exists($invalid);
    }

    my $noauth = $c->model->database->service->no_privileges_to_modify_service(
        $c->user->{id}, $service_ids
    );

    if ($noauth) {
        return $c->plugin->error->no_privileges_on_action(modify => $noauth);
    }

    $c->model->database->begin_transaction
        or return $c->plugin->error->action_failed;

    eval {
        local $SIG{__DIE__} = "DEFAULT";

        # count host downtimes
        my %downtime_counter = ();

        foreach my $service_id (@$service_ids) {
            my $service = $c->model->database->service->by_service_id($service_id);
            my $host_id = $service->{host_id};

            # memory friendly caching
            if (scalar keys %downtime_counter > 10000) {
                %downtime_counter = ();
            }

            # cache the host id
            if (!$downtime_counter{$host_id}) {
                $downtime_counter{$host_id} = $c->model->database->host->count_downtimes($host_id);
            }

            if ($downtime_counter{$host_id} >= $c->user->{max_downtimes_per_host}) {
                $c->plugin->error->limit_error("err-823", $c->user->{max_downtimes_per_host}, $host_id);
                die "max_downtimes_per_host";
            }

            $data->{service_id} = $service_id;
            $data->{host_id} = $host_id;

            $c->model->database->service_downtime->create($data)
                or die $c->plugin->error->action_failed;

            # one more downtime configured
            $downtime_counter{$host_id}++;
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

1;
