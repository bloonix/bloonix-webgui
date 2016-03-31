package Bloonix::Controller::Templates;

use strict;
use warnings;

sub startup {
    my ($self, $c) = @_;

    $c->route->map("/templates/hosts")->to("list");
    $c->route->map("/templates/hosts/search")->to("list");
    $c->route->map("/templates/hosts/create")->to("create");
    $c->route->map("/templates/hosts/options")->to("options");
    $c->route->map("/templates/hosts/:id")->to("view");
    $c->route->map("/templates/hosts/:id/options")->to("options");
    $c->route->map("/templates/hosts/:id/update")->to("update");
    $c->route->map("/templates/hosts/:id/delete")->to("delete");
    $c->route->map("/templates/hosts/:id/services")->to("services");
    $c->route->map("/templates/hosts/:id/services/create")->to("create_service");
    $c->route->map("/templates/hosts/:id/services/options/:plugin_id")->to("service_options");
    $c->route->map("/templates/hosts/:id/services/:ref_id/update")->to("update_service");
    $c->route->map("/templates/hosts/:id/services/:ref_id/delete")->to("delete_service");
    $c->route->map("/templates/hosts/:id/services/:ref_id/options")->to("service_options");
    $c->route->map("/templates/hosts/:id/clone")->to("clone");

    $self->{write_callback} = sub {
        my $data = shift;
        $c->plugin->util->pv_to_json(variables => $data);
        if ($data->{tags}) {
            $data->{tags} =~ s!,!/!;
            $data->{tags} = "/$data->{tags}/";
        }
    };

    $self->{read_callback} = sub {
        my $data = shift;
        $c->plugin->util->json_to_pv(variables => $data);
        if ($data->{tags}) {
            $data->{tags} =~ s!\s!!g;
            $data->{tags} =~ s!,+!,!g;
            $data->{tags} =~ s!^/!!;
            $data->{tags} =~ s!/$!!;
            $data->{tags} =~ s!/!,!g;
        }
    };
}

sub auto {
    my ($self, $c, $opts) = @_;

    if ($c->user->{role} !~ /^(operator|admin)\z/) {
        $c->plugin->error->no_privileges;
        return undef;
    }

    if ($opts && $opts->{id}) {
        $c->stash->object({
            template => $c->model->database->host_template->find(
                condition => [
                    id => $opts->{id},
                    company_id => $c->user->{company_id}
                ]
            )
        });
        if (!$c->stash->object->{template}) {
            $c->plugin->error->object_does_not_exists;
            return undef;
        }
        if ($opts->{ref_id}) {
            $c->stash->object->{service} = $c->model->database->service_parameter->find(
                condition => [
                    host_template_id => $opts->{id},
                    ref_id => $opts->{ref_id}
                ]
            );
            if (!$c->stash->object->{service}) {
                $c->plugin->error->object_does_not_exists;
                return undef;
            }
            $c->stash->object->{plugin} = $c->model->database->plugin->get(
                $c->stash->object->{service}->{plugin_id}
            );
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
    }

    return 1;
}

sub view {
    my ($self, $c) = @_;

    $c->stash->data($c->stash->object->{template});
    &{$self->{read_callback}}($c->stash->data);
    $c->view->render->json;
}

sub list {
    my ($self, $c) = @_;

    my $request = $c->plugin->defaults->request
        or return 1;

    my ($count, $data) = $c->model->database->host_template->by_user_id(
        user => $c->user,
        offset => $request->{offset},
        limit => $request->{limit},
        query => $request->{query},
        sort => $request->{sort},
        order => [ asc => "name" ]
    );

    foreach my $row (@$data) {
        $row->{variables} = $c->plugin->util->json_to_pv($row->{variables});
    }

    $c->stash->offset($request->{offset});
    $c->stash->total($count);
    $c->stash->data($data);
    $c->view->render->json;
}

sub options {
    my ($self, $c, $opts) = @_;

    if ($opts && $opts->{id}) {
        $c->plugin->action->options(host_template => $c->stash->object->{template}, $self->{read_callback});
    } else {
        $c->plugin->action->options("host_template", undef, $self->{read_callback});
    }
}

sub create {
    my ($self, $c) = @_;

    my $count_templates = $c->model->database->host_template->count(
        id => condition => [ company_id => $c->user->{company_id} ]
    );

    if ($count_templates >= $c->user->{max_templates}) {
        return $c->plugin->error->limit_error("err-825" => $c->user->{max_templates});
    }

    $c->plugin->action->store_simple("host_template", undef, $self->{write_callback});
}

sub update {
    my ($self, $c, $opts) = @_;

    $c->plugin->action->store_simple(
        host_template => $c->stash->object->{template},
        $self->{write_callback},
        $self->{read_callback}
    );
}

sub delete {
    my ($self, $c) = @_;

    $c->plugin->action->delete(host_template => $c->stash->object->{template});
}

sub services {
    my ($self, $c, $opts) = @_;

    $c->stash->data(
        $c->model->database->service_parameter->search(
            condition => [ host_template_id => $opts->{id} ],
            order => [ asc => "service_name" ]
        )
    );

    $c->view->render->json;
}

sub service_options {
    my ($self, $c, $opts) = @_;

    $c->model->database->service->set(
        $c->stash->object->{plugin},
        $c->stash->object->{service} ? "update" : "create",
        1 # is a template
    );

    if ($opts && $opts->{ref_id}) {
        my $service = $c->stash->object->{service};
        $service->{command_options} = $c->json->decode($service->{command_options});
        if ($service->{location_options}) {
            $service->{location_options} = $c->json->decode($service->{location_options});

            my $locations_form_parameter = join("_",
                $service->{location_options}->{check_type},
                "locations"
            );

            $service->{location_options}->{$locations_form_parameter} = delete $service->{location_options}->{locations};
        }
        if ($service->{agent_options}) {
            $service->{agent_options} = $c->json->decode($service->{agent_options});
        } else {
            $service->{agent_options} = {};
        }
        $c->stash->data(values => $c->stash->object->{service});
    } else {
        $c->stash->data(values => $c->model->database->service->validator->defaults);
        $c->stash->data->{values}->{agent_options} = {};
    }

    $c->stash->data(options => $c->model->database->service->validator->options);
    $c->view->render->json;
}

sub create_service {
    my ($self, $c, $opts) = @_;

    $c->plugin->token->check
        or return;

    my $data = $c->plugin->service->validate(0, 1)
        or return;

    $data->{host_template_id} = $opts->{id};

    # Pre check the current number of services of the company
    my $count_services = $c->model->database->service->count_by_company_id($c->user->{company_id});

    my $hosts = $c->model->database->host_template_host->search(
        condition => [ host_template_id => $opts->{id} ]
    );

    if ($c->user->{max_services} && $count_services + scalar @$hosts > $c->user->{max_services}) {
        return $c->plugin->error->limit_error("err-832" => $c->user->{max_services});
    }

    # Pre check the current number of services of the template
    my $count_services_per_template = $c->model->database->service_parameter->count(
        ref_id => condition => [ host_template_id => $opts->{id} ]
    );

    if ($count_services_per_template >= $c->user->{max_services_per_host}) {
        return $c->plugin->error->limit_error("err-826" => $c->user->{max_services_per_host});
    }

    $c->model->database->begin_transaction
        or return $c->plugin->error->action_failed;

    my $service;

    eval {
        local $SIG{__DIE__} = "DEFAULT";
        $service = $c->model->database->service_parameter->create_and_get($data);
        $service->{command_options} = $c->json->decode($service->{command_options});

        if ($service->{location_options}) {
            $service->{location_options} = $c->json->decode($service->{location_options});
        }

        $c->plugin->log_action->create(
            target => "service_parameter",
            data => $service
        );

        foreach my $host (@$hosts) {
            my $count_services_per_host = $c->model->database->service->count(
                id => condition => [ host_id => $host->{host_id} ]
            );

            if ($count_services_per_host >= $c->user->{max_services_per_host}) {
                $c->plugin->error->limit_error("err-834" => $c->user->{max_services_per_host}, $host->{host_id});
                die "service limit exceeded";
            }

            $c->model->database->service->create(
                service_parameter_id => $service->{ref_id},
                updated => 1,
                host_id => $host->{host_id},
                message => "waiting for initialization",
                status => "INFO",
                last_check => time
            );
        }

        # Post check the current number of services of the company (prevent race conditions)
        my $count_services = $c->model->database->service->count_by_company_id($c->user->{company_id});

        if ($c->user->{max_services} && $count_services > $c->user->{max_services}) {
            $c->plugin->error->limit_error("err-832" => $c->user->{max_services});
            die "service limit exceeded";
        }
    };

    if ($@) {
        $c->model->database->rollback_transaction
            or return $c->plugin->error->action_failed;
    } else {
        $c->model->database->end_transaction
            or return $c->plugin->error->action_failed;
        $c->stash->data($service);
    }

    $c->view->render->json;
}

sub update_service {
    my ($self, $c, $opts) = @_;

    $c->plugin->token->check
        or return;

    my $data = $c->plugin->service->validate($c->stash->object->{service}, 1)
        or return;

    $c->model->database->service_parameter->update(
        data => $data,
        condition => [ ref_id => $opts->{ref_id} ]
    ) or return $c->plugin->error->action_failed;

    my $service = $c->model->database->service_parameter->find(
        condition => [ ref_id => $opts->{ref_id} ]
    );

    $service->{command_options} = $c->json->decode($service->{command_options});

    if ($service->{location_options}) {
        $service->{location_options} = $c->json->decode($service->{location_options});
    }

    $c->plugin->log_action->update(
        target => "service_parameter",
        old => $c->stash->object->{service},
        data => $service
    );

    $c->stash->data($service);
    $c->view->render->json;
}

sub delete_service {
    my ($self, $c, $opts) = @_;

    $c->plugin->token->check
        or return;

    # DELETE CASCADE should also delete the service from all hosts
    $c->model->database->service_parameter->delete($opts->{ref_id})
        or return $c->plugin->error->action_failed;

    $c->plugin->log_action->delete(
        target => "service_parameter",
        data => $c->stash->object->{service}
    );

    $c->view->render->json;
}

sub clone {
    my ($self, $c, $opts) = @_;

    $c->plugin->token->check
        or return 1;

    my @form_errors;
    my $name = $c->req->param("name");
    my $description = $c->req->param("description");

    if (!$name || length $name > 100) {
        push @form_errors, "name";
    }

    if ($description && length $description > 100) {
        push @form_errors, "description";
    }

    if (@form_errors) {
        return $c->plugin->error->form_parse_errors(@form_errors);
    }

    $c->plugin->transaction->begin
        or return;

    eval {
        my $template = $c->model->database->host_template->create_and_get({
            company_id => $c->user->{company_id},
            name => $name,
            description => $description,
            variables => $c->stash->object->{template}->{variables}
        }) or die;

        my $services = $c->model->database->service_parameter->search(
            condition => [ host_template_id => $opts->{id} ]
        );

        foreach my $service (@$services) {
            delete $service->{ref_id};
            $service->{host_template_id} = $template->{id};
            $c->model->database->service_parameter->create($service)
                or die;
        }
    };

    if ($@) {
        return $c->plugin->transaction->rollback;
    }

    $c->plugin->transaction->end
        or return;

    $c->view->render->json;
}

1;
