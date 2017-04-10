package Bloonix::Controller::Plugins;

use strict;
use warnings;

sub startup {
    my ($self, $c) = @_;

    $c->route->map("/plugins")->to("list");
    $c->route->map("/plugins/search")->to("list");
    $c->route->map("/plugins/:plugin_id")->to("view");
    $c->route->map("/plugin-stats/:plugin_id")->to("stats");
    $c->route->map("/plugin-stats/:plugin_id/:statkey/services")->to("services_by_plugin_statkey");
}

sub list {
    my ($self, $c) = @_;

    my $request = $c->plugin->defaults->request
        or return 1;

    my ($count, $data) = $c->model->database->plugin->query(
        offset => $request->{offset},
        limit => $request->{limit},
        query => $request->{query},
        user => $c->user,
        sort => $request->{sort},
        order => [ asc  => "plugin" ]
    );

    foreach my $plugin (@$data) {
        $plugin->{info} = $c->json->utf8(0)->decode($plugin->{info});
    }

    $c->stash->offset($request->{offset});
    $c->stash->total($count);
    $c->stash->data($data);
    $c->view->render->json;
}

sub view {
    my ($self, $c, $opts) = @_;

    my $plugin = $c->model->database->plugin->find(
        condition => [
            id => $opts->{plugin_id},
            company_id => [ 1, $c->user->{company_id} ]
        ]
    ) or return $c->plugin->error->object_does_not_exists;

    $plugin->{info} = $c->json->utf8(0)->decode($plugin->{info});
    $c->stash->data($plugin);
    $c->view->render->json;
}

sub stats {
    my ($self, $c, $opts) = @_;

    my $plugin = $c->model->database->plugin->find(
        condition => [ 
            id => $opts->{plugin_id}, 
            company_id => [ 1, $c->user->{company_id} ] 
        ]
    ) or return $c->plugin->error->object_does_not_exists;

    my $stats = $c->model->database->plugin_stats->search(
        condition => [ plugin_id => $opts->{plugin_id} ],
        order => [ asc => "alias" ]
    );

    $c->stash->data($stats);
    $c->view->render->json;
}

sub services_by_plugin_statkey {
    my ($self, $c, $opts) = @_;

    my $plugin = $c->model->database->plugin->find(
        condition => [ 
            id => $opts->{plugin_id}, 
            company_id => [ 1, $c->user->{company_id} ] 
        ]
    ) or return $c->plugin->error->object_does_not_exists;

    $c->model->database->plugin_stats->find(
        condition => [
            plugin_id => $opts->{plugin_id},
            statkey => $opts->{statkey}
        ]
    ) or return $c->plugin->error->object_does_not_exists;

    my $request = $c->plugin->defaults->request
        or return 1;

    my ($count, $data) = $c->model->database->service->by_user_id(
        user_id => $c->user->{id},
        offset => $request->{offset},
        limit => $request->{limit},
        query => $request->{query},
        sort => $request->{sort},
        condition => {
            table => "service_parameter",
            column => "plugin_id",
            value => $opts->{plugin_id}
        },
        order => [
            desc => "priority",
            asc  => [ "hostname", "service_name" ],
        ],
    );

    $c->stash->offset($request->{offset});
    $c->stash->total($count);
    $c->stash->data($data);
    $c->view->render->json;
}

1;
