package Bloonix::Controller::User::Charts;

use strict;
use warnings;

sub startup {
    my ($self, $c) = @_;

    $c->route->map("/user/charts")->to("list");
    $c->route->map("/user/charts/search")->to("list");
    $c->route->map("/user/charts/create")->to("store");
    $c->route->map("/user/charts/:id/update")->to("store");
    $c->route->map("/user/charts/:id/delete")->to("delete");
    $c->route->map("/user/charts/:id")->to("view");
}

sub auto {
    my ($self, $c, $opts) = @_;

    if ($opts && $opts->{id}) {
        $c->stash->object(
            $c->model->database->user_chart->find(
                condition => [
                    id => $opts->{id},
                    user_id => $c->user->{id}
                ]
            )
        );
        if (!$c->stash->object) {
            $c->plugin->error->object_does_not_exists;
            return undef;
        }
    }

    return 1;
}

sub view {
    my ($self, $c, $opts) = @_;

    my $data = $c->model->database->user_chart->find(
        condition => [
            id => $opts->{id},
            user_id => $c->user->{id}
        ]
    ) or return $c->plugin->error->object_does_not_exists;

    $data->{options} = $c->json->utf8(0)->decode($data->{options});

    my @service_ids = (0);
    my @plugin_ids = (0);
    my @options;

    foreach my $opt (@{$data->{options}}) {
        push @service_ids, $opt->{service_id};
    }

    my $services = $c->model->database->service->by_service_ids_as_hash(\@service_ids);

    foreach my $opt (@{$data->{options}}) {
        my $service = $services->{ $opt->{service_id} };
        push @plugin_ids, $opt->{plugin_id};

        if ($service) {
            push @options, $opt;
            $opt->{service_name} = $service->{service_name};
            $opt->{hostname} = $service->{hostname};
        }
    }

    my $plugins = $c->model->database->plugin_stats->as_hash_by_plugin_ids(\@plugin_ids);
    foreach my $opt (@options) {
        $opt->{statkey_options} = $plugins->{$opt->{plugin_id}}->{$opt->{statkey}};
    }

    $data->{options} = \@options;
    $c->stash->data($data);
    $c->view->render->json;
}

sub list {
    my ($self, $c) = @_;

    my $request = $c->plugin->defaults->request
        or return 1;

    my ($count, $rows) = $c->model->database->user_chart->by_user_id(
        offset => $request->{offset},
        limit => $request->{limit},
        query => $request->{query},
        user => $c->user,
        sort => $request->{sort},
        order => [ asc  => "title" ]
    );

    my @plugin_ids = (0);

    foreach my $row (@$rows) {
        $row->{options} = $c->json->utf8(0)->decode($row->{options});

        foreach my $opt (@{$row->{options}}) {
            push @plugin_ids, $opt->{plugin_id};
        }
    }

    my $plugins = $c->model->database->plugin_stats->as_hash_by_plugin_ids(\@plugin_ids);

    foreach my $row (@$rows) {
        foreach my $opt (@{$row->{options}}) {
            $opt->{statkey_options} = $plugins->{$opt->{plugin_id}}->{$opt->{statkey}};
        }
    }

    $c->stash->offset($request->{offset});
    $c->stash->total($count);
    $c->stash->data($rows);
    $c->view->render->json;
}

sub store {
    my ($self, $c, $opts) = @_;

    my $action = $c->stash->object ? "update" : "create";
    my $form = $c->plugin->action->check_form($action => "user_chart")
        or return 1;
    my $data = $form->data;

    if ($action eq "create") {
        my $user_count = $c->model->database->user_chart->count(user_id => condition => [ user_id => $c->user->{id} ]);

        if ($user_count >= $c->user->{max_charts_per_user}) {
            return $c->plugin->error->limit_error("err-815", $c->user->{max_charts_per_user});
        }
    }

    if (scalar @{$data->{options}} > $c->user->{max_metrics_per_chart}) {
        return $c->plugin->error->limit_error("err-816", $c->user->{max_metrics_per_chart});
    }

    foreach my $opt (@{$data->{options}}) {
        my $service = $c->model->database->service->by_service_and_user_id($opt->{service_id}, $c->user->{user_id})
            or return $c->plugin->error->form_parse_errors("options");

        if ($service->{plugin_id} != $opt->{plugin_id}) {
            return $c->plugin->error->form_parse_errors("options");
        }

        $c->model->database->plugin_stats->find(
            condition => [
                plugin_id => $opt->{plugin_id},
                statkey => $opt->{statkey}
            ]
        ) or return $c->plugin->error->form_parse_errors("options");
    }

    $data->{options} = $c->json->utf8(1)->encode($data->{options});
    $data->{user_id} = $c->user->{id};

    my $result = $c->stash->object
        ? $c->model->database->user_chart->update_unique($opts->{id}, $data)
        : $c->model->database->user_chart->create_unique($data);

    $c->plugin->action->check_crud($result)
        or return 1;

    if ($c->stash->object) {
        $c->plugin->log_action->update(
            target => "user_chart",
            data => $result->data,
            old => $c->stash->object
        );
    } else {
        $c->plugin->log_action->create(
            target => "user_chart",
            data => $result->data
        );
    }

    $c->view->render->json;
}

sub delete {
    my ($self, $c, $opts) = @_;

    $c->plugin->action->delete(user_chart => $c->stash->object);
}

1;
