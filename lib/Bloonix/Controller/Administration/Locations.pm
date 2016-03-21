package Bloonix::Controller::Administration::Locations;

use strict;
use warnings;

sub startup {
    my ($self, $c) = @_;

    $c->route->map("/administration/locations")->to("list");
    $c->route->map("/administration/locations/list")->to("list");
    $c->route->map("/administration/locations/create")->to("create");
    $c->route->map("/administration/locations/options")->to("options");
    $c->route->map("/administration/locations/:id")->to("view");
    $c->route->map("/administration/locations/:id/options")->to("options");
    $c->route->map("/administration/locations/:id/update")->to("update");
    $c->route->map("/administration/locations/:id/delete")->to("delete");
}

sub auto {
    my ($self, $c, $opts) = @_;

    if ($c->user->{role} ne "admin") {
        $c->plugin->error->noauth_access;
        return undef;
    }

    if ($opts->{id}) {
        $c->stash->object($c->model->database->location->get($opts->{id}));

        if (!$c->stash->object) {
            $c->plugin->error->object_does_not_exists;
            return undef;
        }
    }

    return 1;
}

sub list {
    my ($self, $c) = @_;

    $c->stash->data(
        $c->model->database->location->all(
            order => [ asc => "hostname" ]
        )
    );
}

sub view {
    my ($self, $c) = @_;

    $c->stash->data($c->stash->object);
}

sub options {
    my ($self, $c) = @_;

    $c->plugin->action->options("location", $c->stash->object);
}

sub create {
    my ($self, $c) = @_;

    $c->plugin->action->store_simple("location");
}

sub update {
    my ($self, $c) = @_;

    $c->plugin->action->store(location => $c->stash->object);
}

sub delete {
    my ($self, $c, $opts) = @_;

    my $services = $c->model->database->service->find_configured_location($opts->{id});

    if (@$services) {
        return $c->plugin->error->cannot_delete_location($services);
    }

    $c->plugin->action->delete(location => $c->stash->object);
}

1;
