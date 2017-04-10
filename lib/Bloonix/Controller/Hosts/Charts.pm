package Bloonix::Controller::Hosts::Charts;

use strict;
use warnings;

sub startup {
    my ($self, $c) = @_;

    $c->route->map("/hosts/charts/options")->to("options");
    $c->route->map("/hosts/charts/data")->to("data");
    $c->route->map("/hosts/charts")->to("list");
    $c->route->map("/hosts/charts/info/:plugin_id")->to("info");
    $c->route->map("/hosts/charts/search")->to("list");
    $c->route->map("/hosts/:id/charts")->to("list");
    $c->route->map("/hosts/:id/charts/search")->to("list");
}

sub begin {
    my ($self, $c) = @_;

    $c->validator->set(
        preset => {
            options => [qw/3h 6h 12h 18h 1d 3d 5d 7d 15d 30d 60d 90d/],
            default => "3h"
        },
        refresh => {
            options => [ 60, 120, 180, 240 ],
            default => 180
        },
        from => {
            constraint => $c->validator->constraint->datehourmin,
            optional => 1
        },
        to => {
            constraint => $c->validator->constraint->datehourmin,
            optional => 1
        },
        service_id => {
            regex => qr!^\d+\z!,
            optional => 1
        },
        chart_id => {
            regex => qr!^\d+\z!
        },
        avg => {
            # m = minutes, h = hours, p = data points / pixel
            regex => qr!^([1-9]\d*[mhp]|0)\z!,
            default => "auto"
        }
    );

    return 1;
}

sub list {
    my ($self, $c, $opts) = @_;

    my $request = $c->plugin->defaults->request
        or return 1;

    my ($count, $data) = $c->model->database->chart->by_user_id(
        user_id => $c->user->{id},
        host_id => $opts->{id},
        offset => $request->{offset},
        limit => $request->{limit},
        query => $request->{query}
    );

    foreach my $chart (@$data) {
        if ($chart->{options}) {
            $chart->{options} = $c->json->utf8(0)->decode($chart->{options});
        }
    }

    $c->stash->offset($request->{offset});
    $c->stash->total($count);
    $c->stash->data($data);
    $c->view->render->json;
}

sub info {
    my ($self, $c, $opts) = @_;

    my $plugin_stats = $c->model->database->plugin_stats->get_plugin_by_statkey($opts->{plugin_id})
        or return $c->plugin->error->object_does_not_exists;

    $c->stash->data($plugin_stats);
    $c->view->render->json;
}

sub data {
    my ($self, $c) = @_;

    my $params = $c->req->params($c->validator->params);
    my $result = $c->validator->validate($params, force_defaults => 1);
    my $data = $result->data;
    my ($from, $to);

    $c->log->info("chart request:", $c->req->postdata);

    if ($result->has_failed) {
        return $c->plugin->error->form_parse_errors($result->failed);
    }

    if (($data->{from} || $data->{to}) && (!$data->{from} || !$data->{to})) {
        return $c->plugin->error->form_parse_errors("from", "to");
    }

    if ($data->{from} && $data->{to}) {
        $from = $c->plugin->util->time2msecs($data->{from});
        $to = $c->plugin->util->time2msecs($data->{to});
    } elsif ($data->{preset} =~ /^(\d+)([hdmy])\z/) {
        my %c = (h => 3600, d => 86400, m => 2592000, y => 31536000);
        $from = (time - ($1 * $c{$2})) * 1000;
        $to = time * 1000;
    }

    if ($from > $to) {
        return $c->plugin->error->form_parse_errors("from", "to");
    }

    if ($data->{avg} =~ /^(\d+)p{0,1}\z/ && $1 > 0) {
        my $avg = $1 > 5000 ? 5000 : $1;
        $data->{avg} = int(($to - $from) / $avg);
    } elsif ($data->{avg} =~ /^(\d+)m\z/) {
        $data->{avg} = $1 * 60;
    } elsif ($data->{avg} =~ /^(\d+)h\z/) {
        $data->{avg} = $1 * 3600;
    } elsif ($data->{avg} eq "auto") {
        if ($to - $from >= 86400000) {
            # to - from = delta in milli seconds
            #   / 1000 = seconds
            #   / 60 = (minutes) data points
            #   / 1000 = max data points
            $data->{avg} = int(($to - $from) / 1000);
        } else {
            $data->{avg} = 0;
        }
    }

    $data->{from} = $from;
    $data->{to} = $to;

    if ($data->{service_id}) {
        return $self->get_service_chart_data($c, $data);
    }

    $self->get_user_chart_data($c, $data);
}

sub get_service_chart_data {
    my ($self, $c, $data) = @_;

    my $subkey = $c->req->param("subkey");

    my $chart = $c->model->database->chart->by_user_chart_and_service_id(
        $c->user->{id}, $data->{chart_id}, $data->{service_id}
    ) or return $c->plugin->error->form_parse_errors("service_id", "chart_id");

    $chart->{timeout} ||= $chart->{host_timeout};
    $chart->{interval} ||= $chart->{host_interval};
    my $timeout = ($chart->{timeout} + $chart->{interval}) * 1000;
    my $plugin_stats = $c->model->database->plugin_stats->get_plugin_by_statkey($chart->{plugin_id});

    $chart->{subkey} = $subkey;
    $chart->{options} = $c->json->utf8(0)->decode($chart->{options});

    if ($c->log->is_debug) {
        $c->log->debug("request chart data for:");
        $c->log->dump(debug => { chart_config => $chart, request => $data });
    }

    my $rows = $c->model->rest->stats->get(
        service_id => $chart->{service_id},
        subkey => $subkey,
        from_time => $data->{from},
        to_time => $data->{to}
    );

    $c->log->info("got", scalar @$rows, "rows of raw data");
    $c->log->info("start averaging rest data");
    my %opposite;

    foreach my $series (@{$chart->{options}->{series}}) {
        if ($series->{opposite} && $series->{opposite} eq "true") {
            $opposite{$series->{name}} = 1;
        }
        my $pstats = $plugin_stats->{ $series->{name} };
        my $alias = $pstats->{alias};
        if ($alias) {
            $series->{alias} = $alias;
        }
        $series->{description} = $pstats->{description};
    }

    my ($avgstats, $minstats, $maxstats) = $c->plugin->chart->shrink(
        rows => $rows,
        avg => $data->{avg},
        opposite => \%opposite,
        timeout => $timeout
    );

    $c->log->info("finished averaging rest data");
    $c->stash->data(service => $chart);
    $c->stash->data(stats => $avgstats);
    $c->view->render->json;
}

sub get_user_chart_data {
    my ($self, $c, $data) = @_;

    my $chart = $c->model->database->user_chart->find(
        condition => [
            id => $data->{chart_id},
            user_id => $c->user->{id}
        ]
    ) or return $c->plugin->error->form_parse_errors("chart_id");

    $chart->{options} = $c->json->utf8(0)->decode($chart->{options});

    my (%time, %services);

    foreach my $opt (@{$chart->{options}}) {
        push @{$services{$opt->{service_id}}}, $opt->{statkey};
    }

    if ($c->log->is_info) {
        $c->log->info("request chart data for:");
        $c->log->dump(info => { chart_config => $chart, request => $data, services => [ keys %services ] });
    }

    my $rows = $c->model->rest->stats->get(
        service_id => [ keys %services ],
        from_time => $data->{from},
        to_time => $data->{to}
    );

    $c->log->info("got", scalar @$rows, "rows of raw data");
    $c->log->info("start averaging rest data");

    foreach my $row (@$rows) {
        my $source = $row->{_source};
        my $time = $source->{time} - ($source->{time} % 120000);
        my $data = $source->{data};

        foreach my $statkey (@{$services{$source->{service_id}}}) {
            my $key = join(":", $source->{service_id}, $statkey);

            if (defined $data->{$statkey}) {
                push @{$time{$time}}, {
                    _source => {
                        time => $time,
                        data => { $key => $data->{$statkey} } 
                    }
                };
            }
        }
    }

    my ($avgstats, $minstats, $maxstats) = $c->plugin->chart->shrink(
        rows => [ map { @{$time{$_}} } sort keys %time ],
        avg => $data->{avg},
        timeout => 360 * 1000
    );

    $c->stash->data(service => $c->model->database->service->by_service_ids_as_hash([ keys %services ]));
    $c->stash->data(stats => $avgstats);
    $c->view->render->json;
}

sub options {
    my ($self, $c) = @_;

    $c->stash->data(options => $c->validator->options);
    $c->stash->data(defaults => $c->validator->defaults);
    $c->stash->data(
        views => $c->model->database->chart_view->search(
            column => [ qw(id alias) ],
            condition => [ user_id => $c->user->{id} ],
            order => [ asc => "alias" ]
        )
    );

    $c->view->render->json;
}

1;
