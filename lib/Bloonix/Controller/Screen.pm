package Bloonix::Controller::Screen;

use strict;
use warnings;

sub startup {
    my ($self, $c) = @_;

    $c->route->map("/screen")->to("index");
    $c->route->map("/screen/stats")->to("stats");
    $c->route->map("/screen/charts")->to("charts");
    $c->route->map("/screen/charts/data")->to("Hosts::Charts::data");
    $c->route->map("/screen/charts/view/:view_id")->to("chart_view");
}

sub auto {
    my ($self, $c, $opts) = @_;

    if ($opts && $opts->{host_id}) {
        $c->stash->object(
            $c->model->database->host->by_host_and_user_id(
                $opts->{host_id}, $c->user->{id}
            )
        );
        if (!$c->stash->object) {
            $c->plugin->error->object_does_not_exists;
            return undef;
        }
    }

    return 1;
}

sub index {
    my ($self, $c) = @_;

    $c->stash->{data}->{init} = $c->json->utf8(1)->encode({
        version => $c->version->{js},
        screen => 1,
        dashboard => 1,
        chartLibrary => $c->config->{webapp}->{chart_library}
    });

    $c->stash->{template} = "index.tt";
    $c->view->render->template;
}

sub stats {
    my ($self, $c) = @_;
    my $stash = $c->json->utf8(1)->decode($c->user->{stash})->{screen} // {};

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

    $status->{TOTAL} = $status->{OK}
        + $status->{WARNING}
        + $status->{CRITICAL}
        + $status->{UNKNOWN}
        + $status->{INFO};

    $c->stash->data(overall_service_status => $status);
    $c->stash->data(
        service_status_by_host => $c->model->database->service->warnings_by_user_id(
            user_id => $c->user->{id},
            sort_by_sla => $stash->{sort_by_sla} // "none"
        )
    );

    $c->view->render->json;
}

sub charts {
    my ($self, $c, $opts) = @_;

    $c->stash->{data}->{init} = $c->json->utf8(1)->encode({
        version => $c->version->{js},
        screen => 1,
        charts => 1,
        chartLibrary => $c->config->{webapp}->{chart_library}
    });

    $c->stash->{template} = "index.tt";
    $c->view->render->template;
}

sub chart_view {
    my ($self, $c, $opts) = @_;

    my $chart_view = $c->model->database->chart_view->find(
        condition => [
            id => $opts->{view_id},
            user_id => $c->user->{id}
        ]
    ) or return $c->plugin->error->object_does_not_exists;

    #$chart_view->{options} = $c->json->utf8(0)->decode($chart_view->{options});

    my $options = $chart_view->{options} = $c->json->utf8(0)->decode($chart_view->{options});
    my $selected = delete $options->{selected};
    $options->{selected} = { };

    foreach my $sel (@$selected) {
        my $chart_opts = $c->model->database->chart->by_user_chart_and_service_id(
            $c->user->{id}, $sel->{chart_id}, $sel->{service_id}
        ) or next;

        my $chart_key = join(":", $chart_opts->{service_id}, $chart_opts->{chart_id});
        $chart_opts->{options} = $c->json->utf8(0)->decode($chart_opts->{options});
        $options->{selected}->{$chart_key} = $chart_opts;
    }

    $c->stash->data($chart_view);
    $c->view->render->json;
}

1;
