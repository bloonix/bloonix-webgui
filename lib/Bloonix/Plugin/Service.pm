package Bloonix::Plugin::Service;

use strict;
use warnings;
use base qw(Bloonix::Accessor);

__PACKAGE__->mk_accessors(qw/c/);

sub new {
    my ($class, $c) = @_;

    return bless { c => $c }, $class;
}

sub validate {
    my ($self, $service, $template) = @_;
    my $c = $self->c;

    my $plugin = $service
        ? $c->model->database->plugin->get($service->{plugin_id})
        : $self->validate_plugin($c);

    if (!$plugin) {
        return;
    }

    my $form = $self->validate_base_settings($service, $plugin, $service ? "update" : "create", $template)
        or return;

    my $plugin_info = $c->json->decode($plugin->{info});
    my $plugin_options = $plugin_info->{options};
    my $command_options = $self->validate_command_options($plugin, $plugin_info, $plugin_options)
        or return;
    my $location_options = $self->validate_location_options($plugin);
    my $agent_options = $self->validate_agent_options($service)
        or return;

    if (!defined $location_options) {
        return;
    }

    my $data = $form->data;

    if (!$service && !$template) {
        $data->{updated} = 1;
        $data->{host_id} = $c->stash->object->{host}->{id};
        $data->{message} = "waiting for initialization";
        $data->{status} = "INFO";
    }

    $data->{command_options} = $c->json->encode($command_options);
    $data->{agent_options} = $c->json->encode($agent_options);
    $data->{sum_services} = 1;

    if (ref $location_options eq "HASH") {
        $data->{location_options} = $c->json->encode($location_options);
        if (
            $location_options->{check_type} eq "multiple"
            && exists $location_options->{locations}
            && ref $location_options->{locations} eq "ARRAY"
        ) {
            $data->{sum_services} = @{$location_options->{locations}};
        }
    } else {
        $data->{location_options} = $location_options;
    }

    return $data;
}

sub validate_plugin {
    my $self = shift;
    my $c = $self->c;

    my $plugin_id = $c->req->param("plugin_id");
    my $plugin;

    if ($plugin_id) {
        $plugin = $c->model->database->plugin->find(
            condition => [
                id => $plugin_id,
                company_id => [ 1, $c->user->{company_id} ]
            ]
        );
    }

    if (!$plugin) {
        $c->plugin->error->form_parse_errors("plugin_id");
        return undef;
    }

    return $plugin;
}

sub validate_base_settings {
    my ($self, $service, $plugin, $action, $template) = @_;
    my $c = $self->c;

    if (!$template && $service->{host_template_id}) {
        $c->model->database->service->set_small;
    } else {
        $c->model->database->service->set($plugin, $action, $template);
    }

    my $form_option = $action eq "create" ? "force_defaults" : "ignore_missing";

    my $form = $c->model->database->service->validator->validate(
        $c->req, $form_option => 1
    );

    if ($form->has_failed) {
        $c->plugin->error->form_parse_errors($form->failed);
        return undef;
    }

    return $form;
}

sub validate_location_options {
    my ($self, $plugin) = @_;
    my $c = $self->c;

    my $command_options = $c->req->param("command_options");

    if (!$plugin->{netaccess} || !$plugin->{worldwide} || !$command_options->{check_type}) {
        return 0;
    }

    my $location_options = {};
    my (@errors, %save_location_options);

    my @fetch_location_options = qw(
        fixed_checkpoint first_failover_checkpoint second_failover_checkpoint
        check_type multiple_locations rotate_locations concurrency
    );

    foreach my $opt (@fetch_location_options) {
        if (exists $command_options->{$opt}) {
            $location_options->{$opt} = delete $command_options->{$opt};
        }
    }

    # Validate location options
    my $locations = $c->model->database->location->as_object;

    if (
        $location_options->{check_type}
        && $location_options->{check_type} =~ /^(default|failover|rotate|multiple)\z/
    ) {
        my %seen;

        if ($location_options->{check_type} eq "default") {
            return 0;
        }

        $save_location_options{check_type} = $location_options->{check_type};

        if ($location_options->{check_type} eq "failover") {
            foreach my $key (qw/fixed_checkpoint first_failover_checkpoint second_failover_checkpoint/) {
                my $location = $location_options->{$key};
                if (
                    defined $location_options->{$key}
                    && exists $locations->{$location}
                    && !$seen{$locations->{$location}->{id}}
                ) {
                    push @{$save_location_options{locations}}, $locations->{$location}->{id};
                    $seen{$locations->{$location}->{id}} = 1;
                } else {
                    push @errors, "command_options:$key";
                }
            }
        } elsif ($location_options->{check_type} =~ /^(multiple|rotate)\z/) {
            my $parameter = join("_", $location_options->{check_type}, "locations");

            if (
                !exists $location_options->{$parameter}
                || ref $location_options->{$parameter} ne "ARRAY"
                || @{$location_options->{$parameter}} < 3
            ) {
                push @errors, "command_options:$parameter";
            } elsif ($location_options->{$parameter} && ref $location_options->{$parameter} eq "ARRAY") {
                foreach my $location (@{$location_options->{$parameter}}) {
                    if (exists $locations->{$location} && !$seen{$locations->{$location}->{id}}) {
                        push @{$save_location_options{locations}}, $locations->{$location}->{id};
                        $seen{$locations->{$location}->{id}} = 1;
                    } else {
                        push @errors, "command_options:$parameter";
                        last;
                    }
                }

                if ($save_location_options{locations} eq "ARRAY" && @{$save_location_options{locations}} < 3) {
                    push @errors, "command_options:$parameter";
                }
            } else {
                push @errors, "command_options:$parameter";
            }

            if ($location_options->{check_type} eq "multiple") {
                if (!$location_options->{concurrency} || $location_options->{concurrency} !~ /^[1-9]\d{0,1}\z/) {
                    push @errors, "command_options:concurrency";
                } else {
                    $save_location_options{concurrency} = $location_options->{concurrency};
                }
            }
        }
    } else {
        push @errors, "command_options:check_type";
    }

    if (@errors) {
        $c->plugin->error->form_parse_errors(@errors);
        return;
    }

    return \%save_location_options;
}

sub validate_command_options {
    my ($self, $plugin, $plugin_info, $plugin_options) = @_;
    my (@errors, @save_options);
    my $c = $self->c;

    my $command_options = $c->req->param("command_options");

    if (!$command_options || ref $command_options ne "HASH") {
        $c->plugin->error->form_parse_errors("command_options");
        return undef;
    }

    # check-cluster
    if ($plugin->{id} == 2) {
        return $self->validate_check_cluster($command_options);
    }

    # Validate command options
    foreach my $opt (@$plugin_options) {
        my $option = $opt->{option};
        my $values = $command_options->{$option};
        my $value_type = $opt->{value_type} || 0;

        if (!defined $values || !length $values) {
            if ($opt->{mandatory}) {
                push @errors, "command_options:$option";
            }
            next;
        }

        # check-wtrm
        if ($plugin->{id} == 58 && $option eq "workflow") {
            if (!$values || ref $values ne "ARRAY") {
                push @errors, "command_options:$option";
            } else {
                my $errors = $c->plugin->wtrm->validate_steps($values);
                if ($errors) {
                    push @errors, "command_options:$option";
                } else {
                    push @save_options, {
                        option => $option,
                        value => $values
                    };
                }
            }
            next;
        }

        # nagios check
        if ($plugin->{id} == 59 && $option eq "nagios-command" && !$self->parse_command_line($values)) {
            push @errors, "command_options:nagios-command";
        }

        if (!$opt->{multiple} && $value_type =~ /^(hash|array)\z/) {
            if (
                ($value_type eq "hash" && ref $values eq "HASH")
                || ($value_type eq "array" && ref $values eq "ARRAY")
            ) {
                push @save_options, {
                    option => $option,
                    value => $values
                };
            } else {
                push @errors, "command_options:$option";
            }
            next;
        }

        # Non multiple values must be passed as string
        if (!$opt->{multiple} && ref $values) {
            push @errors, "command_options:$option";
            next;
        }

        # Multiple values must be passed as an ARRAY or as a single string
        if ($opt->{multiple} && ref $values !~ /^(ARRAY){0,1}\z/) {
            push @errors, "command_options:$option";
            next;
        }

        # Treat all values in an array
        if (ref $values ne "ARRAY") {
            $values = [ $values ];
        }

        foreach my $value (@$values) {
            # If the value has no type then it's a flag.
            if (!$value_type && !$value) {
                next;
            }

            if (!defined $value) {
                $value = "";
            }

            if ($value_type && $value !~ /^%[a-zA-Z_0-9\-\.]+%\z/) {
                if (
                    ($value_type eq "int" && $value !~ /^\d+\z/)
                    || ($value_type eq "number" && $value !~ /^[1-9]\d*\z/)
                    || ($value_type eq "string" && length $value == 0)
                    || ($value_type eq "hash" && ref $value ne "HASH")
                    || ($value_type eq "array" && ref $value ne "ARRAY")
                    || (!ref $value && $value =~ /[`']/)
                ) {
                    push @errors, "command_options:$option";
                    next;
                }

                # Maybe the value is set to "foobar" ...
                if (!$value_type && $value) {
                    $value = 1;
                }
            }

            push @save_options, {
                option => $option,
                value => $value
            };
        }
    }

    if (@errors) {
        $c->plugin->error->form_parse_errors(@errors);
        return;
    }

    return \@save_options;
}

sub validate_agent_options {
    my ($self, $service) = @_;
    my $c = $self->c;
    my @errors;

    my $service_agent_options = ref $service eq "HASH" && $service->{agent_options}
        ? $c->json->decode($service->{agent_options})
        : {};

    my $agent_options = $c->req->param("agent_options");

    if (!$agent_options || ref $agent_options ne "HASH" || scalar keys %$agent_options == 0) {
        return $service_agent_options;
    }

    foreach my $key (keys %$agent_options) {
        if ($key eq "timeout") {
            if ($agent_options->{$key} =~ /^(0|10|15|30|60|90|120)\z/) {
                if ($agent_options->{$key} == 0) {
                    delete $service_agent_options->{$key};
                } else {
                    $service_agent_options->{$key} = $agent_options->{$key};
                }
            } else {
                push @errors, "agent_options:timeout";
            }
        } elsif ($key eq "set_tags") {
            if (ref $agent_options->{$key} ne "ARRAY") {
                $agent_options->{$key} = [ split /,/, $agent_options->{$key} ];
            }
            my @tags;
            foreach my $tag (@{$agent_options->{$key}}) {
                if ($tag =~ /^\w+\z/) {
                    push @tags, lc($tag);
                } elsif ($tag) { # ignore empty or false tags
                    push @errors, "agent_options:set_tags";
                    last;
                }
            }
            $service_agent_options->{$key} = join(",", @tags);
        }
    }

    if (@errors) {
        $c->plugin->error->form_parse_errors(@errors);
        return;
    }

    return $service_agent_options;
}

sub validate_check_cluster {
    my ($self, $command_options) = @_;
    my (@errors, @save_options, %service_ids);
    my $c = $self->c;

    foreach my $param (qw/warning critical service/) {
        if (!$command_options->{$param}) {
            push @errors, "command_options:$param";
        }
    }

    if (@errors) {
        $c->plugin->error->form_parse_errors(@errors);
        return;
    }

    foreach my $status (qw/warning critical/) {
        if ($command_options->{$status} =~ /^\d+\z/) {
            push @save_options, {
                option => $status,
                value => $command_options->{$status}
            };
        } else {
            push @errors, "command_options:$status";
        }
    }

    if (!ref $command_options->{service}) {
        $command_options->{service} = [ $command_options->{service} ];
    }

    foreach my $service_id (@{$command_options->{service}}) {
        if (!$service_id) {
            next;
        }
        if ($service_id =~ /^(\d+)/) {
            $service_ids{$1}++;
        } else {
            push @errors, "command_options:service";
            last;
        }
    }

    if (@errors) {
        $c->plugin->error->form_parse_errors(@errors);
        return;
    }

    if (
        !scalar keys %service_ids
        || $c->model->database->service->get_invalid_service_ids_by_user_id($c->user->{id}, [ keys %service_ids ])
    ) {
        $c->plugin->error->form_parse_errors("command_options:service");
        return;
    }

    foreach my $id (keys %service_ids) {
        push @save_options, {
            option => "service",
            value => $id
        };
    }

    return \@save_options;
}

sub parse_command_line {
    my ($self, $command) = @_;

    my $regex = qr!^
        (                               # begin capture of the command
            (?:[\w]|[\w][\w\-]+/)*      # sub directories are allowed
            (?:[\w]|[\w][\w\-]+         # the command name
                (?:\.[a-zA-Z]+){0,1}    # file extension of the command
            )
        )                               # end capture of the command
        (?:
            \s+                         # whitespaces between cmd and args
            ([^'`\\]+)                  # capture the arguments
        ){0,1}
    \z!x;

    if ($command =~ $regex) {
        my $arguments = $2;
        return $self->parse_command_line_arguments($arguments);
    }

    return undef;
}

sub parse_command_line_arguments {
    my ($self, $argv) = @_;

    my @args = ();
    my @parts = split /\s/, $argv;

    while (@parts) {
        my $param = shift @parts;
        next if $param =~ /^\s*\z/;

        if ($param !~ /^-{1,2}[a-zA-Z0-9]+(-[a-zA-Z0-9]+){0,}\z/) {
            return undef;
        }

        push @args, $param;
        next if @parts && $parts[0] =~ /^-/;

        my @values;

        while (@parts) {
            my $value = shift @parts;
            push @values, $value;
            last if $value !~ /^"/;

            while (@parts) {
                my $value = shift @parts;
                push @values, $value;
                last if $value =~ /"\z/;
            }
        }

        if (@values) {
            push @args, "'". join(" ", @values) ."'";
        }
    }

    return 1;
}

1;
