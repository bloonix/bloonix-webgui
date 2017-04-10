package Bloonix::Controller::Hosts::Charts::View;

use strict;
use warnings;

sub startup {
    my ($self, $c) = @_;

    $c->route->map("/hosts/charts/view/save")->to("save");
    $c->route->map("/hosts/charts/view/:view_id")->to("view");
    $c->route->map("/hosts/charts/view/:view_id/delete")->to("delete");
}

sub begin {
    my ($self, $c) = @_;

    $c->validator->set(
        preset => {
            options => [qw/3h 6h 12h 18h 1d 3d 5d 7d 15d 30d 60d 90d/],
            optional => 1
        },
        refresh => {
            options => [ 60, 120, 180, 240 ],
            optional => 1
        },
        from => {
            constraint => $c->validator->constraint->datehourmin,
            optional => 1
        },
        to => {
            constraint => $c->validator->constraint->datehourmin,
            optional => 1
        },
        alias => {
            min_size => 1,
            max_size => 200
        },
        alignment => {
            options => [ 1, 2, 3, 4, 5, 6, 7, 8 ],
            default => 1
        },
        public => {
            regex => qr/^[01]\z/,
            default => 0
        },
        selected => {
            type => "array"
        }
    );

    return 1;
}

sub view {
    my ($self, $c, $opts) = @_;

    my $chart_view = $c->model->database->chart_view->find(
        condition => [
            id => $opts->{view_id},
            user_id => $c->user->{id}
        ]
    ) or return $c->plugin->error->object_does_not_exists;

    my $options = $chart_view->{options} = $c->json->utf8(0)->decode($chart_view->{options});
    my $charts = {};
    my @plugin_ids;

    foreach my $sel (@{$options->{selected}}) {
        my ($chart_key, $chart_type) = $sel->{service_id}
            ? (join(":", $sel->{service_id}, $sel->{chart_id}), "service_charts")
            : ($sel->{chart_id}, "user_charts");

        if (!$charts->{$chart_key}) {
            if ($sel->{service_id}) {
                $charts->{$chart_key} = $c->model->database->chart->by_user_chart_and_service_id(
                    $c->user->{id}, $sel->{chart_id}, $sel->{service_id}
                ) or next;
            } else {
                $charts->{$chart_key} = $c->model->database->user_chart->find(
                    condition => [
                        id => $sel->{chart_id},
                        user_id => $c->user->{id}
                    ]
                ) or next;
            }

            $charts->{$chart_key}->{options} = $c->json->utf8(0)->decode($charts->{$chart_key}->{options});

            if (!$sel->{service_id}) {
                foreach my $opt (@{$charts->{$chart_key}->{options}}) {
                    push @plugin_ids, $opt->{plugin_id};
                }
            }
        }

        $options->{$chart_type}->{$chart_key} = $charts->{$chart_key};
    }

    if (@plugin_ids) {
        my $plugins = $c->model->database->plugin_stats->as_hash_by_plugin_ids(\@plugin_ids);
        foreach my $plugin_id (keys %{$options->{user_charts}}) {
            foreach my $opt (@{$options->{user_charts}->{$plugin_id}->{options}}) {
                $opt->{statkey_options} = $plugins->{$opt->{plugin_id}}->{$opt->{statkey}};
            }
        }
    }

    $c->stash->data($chart_view);
    $c->view->render->json;
}

sub save {
    my ($self, $c) = @_;

    my $params = $c->req->params($c->validator->params);
    $params->{selected} = [ $c->req->param("selected") ];
    my $result = $c->validator->validate($params, force_defaults => 1);

    if ($result->has_failed) {
        return $c->plugin->error->form_parse_errors($result->failed);
    }

    my $data = $result->data;

    if (($data->{from} || $data->{to}) && (!$data->{from} || !$data->{to})) {
        return $c->plugin->error->form_parse_errors("from", "to");
    }

    if (!$self->validate($c, $data->{selected})) {
        return $c->plugin->error->form_parse_errors("selected");
    }

    my $alias = delete $data->{alias};
    my $public = delete $data->{public};
    my $options = $c->json->utf8(1)->encode($data);

    my $chart_view = $c->model->database->chart_view->find(
        condition => [
            user_id => $c->user->{id},
            alias => $alias
        ]
    );

    if ($chart_view) {
        $c->model->database->chart_view->update(
            $chart_view->{id} => {
                alias => $alias,
                public => $public,
                options => $options
            }
        );

        $c->plugin->log_action->update(
            target => "chart_view",
            old => $chart_view,
            data => {
                user_id => $c->user->{id},
                alias => $alias,
                public => $public,
                options => $options
            }
        );
    } else {
        my $count = $c->model->database->chart_view->count(
            user_id => condition => [ user_id => $c->user->{id} ]
        );

        if ($count >= $c->user->{max_chart_views_per_user}) {
            return $c->plugin->error->limit_error("err-817" => $c->user->{max_chart_views_per_user});
        }

        $c->model->database->chart_view->create(
            user_id => $c->user->{id},
            alias => $alias,
            public => $public,
            options => $options
        );

        $c->plugin->log_action->create(
            target => "chart_view",
            data => {
                user_id => $c->user->{id},
                alias => $alias,
                public => $public,
                options => $options
            }
        );

        $c->stash->data(
            $c->model->database->chart_view->find(
                condition => [ user_id => $c->user->{id}, alias => $alias ]
            )
        );

        $c->log->dump(notice => $c->stash->{data});
    }

    $c->view->render->json;
}

sub delete {
    my ($self, $c, $opts) = @_;

    my $chart_view = $c->model->database->chart_view->find(
        condition => [ 
            id => $opts->{view_id},
            user_id => $c->user->{id}
        ]
    ) or return $c->plugin->error->object_does_not_exists;

    $c->model->database->chart_view->delete($opts->{view_id});
    $c->view->render->json;
}

sub validate {
    my ($self, $c, $selected) = @_;

    foreach my $sel (@$selected) {
        # service chart
        # {
        #    chart_id => num,
        #    service_id => num,
        #    position => optional num
        # }
        # user chart
        # {
        #    chart_id => num,
        #    position => optional num
        # }

        if (ref $sel ne "HASH") {
            return undef;
        }

        if (!defined $sel->{chart_id} || $sel->{chart_id} !~ /^\d+\z/) {
            return undef;
        }

        if (exists $sel->{position} && (!defined $sel->{position} || $sel->{position} !~ /^[1-9]\d*\z/)) {
            return undef;
        }

        if (exists $sel->{service_id} && (!defined $sel->{service_id} || $sel->{service_id} !~ /^[1-9]\d*\z/)) {
            return undef;
        }

        if ($sel->{service_id}) {
            $c->model->database->chart->check_by_chart_service_and_user_id(
                $sel->{chart_id},
                $sel->{service_id},
                $c->user->{id}
            ) or return undef;
        } else {
            $c->model->database->user_chart->find(
                condition => [
                    id => $sel->{chart_id},
                    user_id => $c->user->{id}
                ]
            ) or return undef;
        }

        foreach my $key (keys %$sel) {
            if ($key !~ /^(chart_id|service_id|subkey|position)\z/) {
                return undef;
            }
        }
    }

    return 1;
}

1;
