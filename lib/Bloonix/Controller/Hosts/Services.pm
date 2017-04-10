package Bloonix::Controller::Hosts::Services;

use strict;
use warnings;

sub startup {
    my ($self, $c) = @_;

    $c->route->map("/hosts/:id/services/options/:plugin_id")->to("options");
    $c->route->map("/hosts/:id/services/create")->to("create");
    $c->route->map("/hosts/:id/services/:service_id")->to("view");
    $c->route->map("/hosts/:id/services/:service_id/options")->to("options");
    $c->route->map("/hosts/:id/services/:service_id/update")->to("update");
    $c->route->map("/hosts/:id/services/:service_id/delete")->to("delete");
    #$c->route->map("/services/options/:plugin_id")->to("options");
    #$c->route->map("/services/create")->to("create");
    #$c->route->map("/services/:service_id")->to("view");
    #$c->route->map("/services/:service_id/options")->to("options");
    #$c->route->map("/services/:service_id/update")->to("update");
    #$c->route->map("/services/:service_id/delete")->to("delete");
}

sub auto {
    my ($self, $c, $opts) = @_;

    my $host = $c->stash->object;
    $c->stash->object({ host => $host });

    if ($opts && $opts->{service_id}) {
        my $service = $c->model->database->service->by_host_and_service_id(
            host_id => $opts->{id},
            id => $opts->{service_id}
        );

        if (!$service) {
            $c->plugin->error->object_does_not_exists;
            return undef;
        }

        $c->stash->object->{service} = $service;
        $c->stash->object->{host} = $c->model->database->host->get($service->{host_id});
        $c->stash->object->{plugin} = $c->model->database->plugin->get($service->{plugin_id});
    }

    if ($opts->{plugin_id}) {
        my $plugin = $c->model->database->plugin->find(
            condition => [
                id => $opts->{plugin_id},
                company_id => [ 1, $c->user->{company_id} ]
            ]
        );

        if (!$plugin) {
            $c->plugin->error->object_does_not_exists;
            return undef;
        }

        $c->stash->object->{plugin} = $plugin;
    }

    return 1;
}

sub options {
    my ($self, $c, $opts) = @_;

    $c->model->database->user_group->can_update_service(
        $c->user->{id}, $opts->{id}
    ) or return $c->plugin->error->no_privileges_on_action(modify => "service");

    $c->model->database->service->set(
        $c->stash->object->{plugin},
        $c->stash->object->{service} ? "update" : "create"
    );

    if ($opts && $opts->{service_id}) {
        my $service = $c->stash->object->{service};
        $service->{command_options} = $c->json->utf8(0)->decode($service->{command_options});
        if ($service->{location_options}) {
            $service->{location_options} = $c->json->utf8(0)->decode($service->{location_options});

            my $locations_form_parameter = join("_",
                $service->{location_options}->{check_type}, 
                "locations"
            );

            $service->{location_options}->{$locations_form_parameter} =
                delete $service->{location_options}->{locations};
        }
        if ($service->{agent_options}) {
            $service->{agent_options} = $c->json->utf8(0)->decode($service->{agent_options});
        } else {
            $service->{agent_options} = {};
        }

        $c->stash->data(values => $c->stash->object->{service});
    } else {
        $c->stash->data(values => $c->model->database->service->validator->defaults);
        $c->stash->data->{values}->{agent_options} = {};
    }

    $c->stash->data(options => $c->model->database->service->validator->options);
    $c->stash->data(mandatory => $c->model->database->service->validator->mandatory);
    $c->stash->data(optional => $c->model->database->service->validator->optional);
    $c->view->render->json;
}

sub view {
    my ($self, $c, $opts) = @_;

    $c->stash->data(
        $c->model->database->service->by_service_id($opts->{service_id})
    );

    $c->view->render->json;
}

sub create {
    my ($self, $c, $opts) = @_;

    $c->plugin->token->check
        or return;

    my $count_services = $c->model->database->service->count_by_company_id($c->user->{company_id});

    if ($c->user->{max_services} && $count_services >= $c->user->{max_services}) {
        return $c->plugin->error->limit_error("err-832" => $c->user->{max_services});
    }

    my $count_services_per_host = $c->model->database->service->count(
        id => condition => [ host_id => $opts->{id} ]
    );

    if ($count_services_per_host >= $c->user->{max_services_per_host}) {
        return $c->plugin->error->limit_error("err-833" => $c->user->{max_services_per_host});
    }

    $c->model->database->user_group->can_create_service(
        $c->user->{id}, $opts->{id}
    ) or return $c->plugin->error->no_privileges_on_action(create => "service");

    my $data = $c->plugin->service->validate
        or return;

    my $service = $c->model->database->service->create_new_service($data)
        or return $c->plugin->error->action_failed;

    $service->{command_options} = $c->json->utf8(0)->decode($service->{command_options});

    if ($service->{location_options}) {
        $service->{location_options} = $c->json->utf8(0)->decode($service->{location_options});
    }

    $c->plugin->log_action->create(
        target => "service",
        data => $service
    );

    $c->stash->data($service);
    $c->view->render->json;
}

sub update {
    my ($self, $c, $opts) = @_;

    $c->plugin->token->check
        or return 1;

    if ($c->stash->object->{service}->{host_template_id}) {
        return $c->plugin->error->cannot_update_host_template_object;
    }

    $c->model->database->user_group->can_update_service(
        $c->user->{id}, $opts->{id}
    ) or return $c->plugin->error->no_privileges_on_action(modify => "service");

    my $host = $c->stash->object->{host};
    my $service = $c->stash->object->{service};
    my $data = $c->plugin->service->validate($service)
        or return;

    if ($data->{sum_services}) {
        my $count_services = $c->model->database->service->count_by_company_id($c->user->{company_id}, $service->{id});

        if ($c->user->{max_services} && $count_services + $data->{sum_services} > $c->user->{max_services}) {
            return $c->plugin->error->limit_error("err-832" => $c->user->{max_services});
        }
    }

    my $username = $c->user->{username};
    my $user_id = $c->user->{id};
    my $timestamp = $c->plugin->util->timestamp;

    if (exists $data->{active} && $service->{active} != $data->{active}) {
        $data->{active_comment} = $data->{active} == 0
            ? "service deactivated by $username($user_id) at $timestamp"
            : "service activated by $username($user_id) at $timestamp";
    }

    if (exists $data->{notification} && $service->{notification} != $data->{notification}) {
        $data->{notification_comment} = $data->{notification} == 0
            ? "service notification disabled by $username($user_id) at $timestamp"
            : "service notification enabled by $username($user_id) at $timestamp";
    }

    if (exists $data->{acknowledged} && $service->{acknowledged} != $data->{acknowledged}) {
        $data->{acknowledged_comment} = $data->{acknowledged} == 0
            ? "service acknowledgement cleared by $username($user_id) at $timestamp"
            : "service acknowledged by $username($user_id) at $timestamp";
    }

    if (exists $data->{volatile_status} && $service->{volatile_status} != $data->{volatile_status}) {
        $data->{volatile_comment} = $data->{volatile_status} == 0
            ? "volatile status cleared by $username($user_id) at $timestamp"
            : "volatile status enabled by $username($user_id) at $timestamp";
    }

    $c->model->database->service->update_service($service->{id}, $service->{service_parameter_id}, $data)
        or return $c->plugin->error->action_failed;

    $service = $c->model->database->service->by_service_id($service->{id});
    $service->{command_options} = $c->json->utf8(0)->decode($service->{command_options});

    if ($service->{location_options}) {
        $service->{location_options} = $c->json->utf8(0)->decode($service->{location_options});
    }

    $c->plugin->log_action->update(
        target => "service", 
        old => $c->stash->object->{service},
        data => $service
    );

    $c->stash->data($service);
    $c->view->render->json;
}

sub delete {
    my ($self, $c, $opts) = @_;

    $c->plugin->token->check
        or return 1;

    if ($c->stash->object->{service}->{host_template_id}) {
        return $c->plugin->error->cannot_delete_host_template_object;
    }

    $c->model->database->user_group->can_delete_service(
        $c->user->{id}, $opts->{id}
    ) or return $c->plugin->error->no_privileges_on_action(delete => "service");

    # DELETE CASCADE should also delete the service
    $c->model->database->service_parameter->delete(
        $c->stash->object->{service}->{service_parameter_id}
    ) or return $c->plugin->error->action_failed;

    #$c->model->database->service->delete($opts->{service_id})
    #    or return $c->plugin->error->action_failed;

    $c->plugin->log_action->delete(
        target => "service",
        data => $c->stash->object->{service}
    );

    $c->view->render->json;
}

1;
