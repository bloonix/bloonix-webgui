package Bloonix::Plugin::Error;

use strict;
use warnings;

sub new {
    my ($class, $c) = @_;

    return bless { c => $c }, $class;
}

sub bad_login {
    my $self = shift;
    $self->_error("err-400");
}

sub session_expired {
    my $self = shift;
    $self->_error("err-405");
}

sub site_does_not_exists {
    my $self = shift;
    $self->_error("err-410");
}

sub service_not_available {
    my $self = shift;
    $self->_error("err-411");
}

sub max_host_req_exceeded {
    my $self = shift;
    $self->_error("err-412");
}

sub host_reg_id_1_not_allowed {
    my $self = shift;
    $self->_error("err-413");
}

sub noauth_access {
    my $self = shift;
    $self->_error("err-415");
}

sub no_privileges {
    my $self = shift;
    $self->_error("err-416");
}

sub no_privileges_on_action {
    my $self = shift;
    my $action = shift;
    my $objects = ref $_[0] eq "ARRAY" ? shift : [@_];
    my $c = $self->{c};
    my $err;

    if ($action eq "create") {
        $err = "err-417";
    } elsif ($action eq "modify") {
        $err = "err-418";
    } elsif ($action eq "delete") {
        $err = "err-419";
    }

    $c->stash->{status} = $err;
    $c->stash->{data}->{failed} = $objects;
    $c->stash->{data}->{message} = $c->lang->get($err);
    return $c->view->render->json;
}

sub action_failed {
    my ($self, %action) = @_;
    my $c = $self->{c};
    $c->log->trace(warning => "err-420");
    $c->log->dump(warning => \%action);
    $self->_error("err-420");
}

sub token_expired {
    my $self = shift;
    $self->_error("err-425");
}

sub token_required {
    my $self = shift;
    $self->_error("err-426");
}

sub cannot_update_host_template_object {
    my $self = shift;
    $self->_error("err-427");
}

sub cannot_delete_host_template_object {
    my $self = shift;
    $self->_error("err-427");
}

sub cannot_delete_location {
    my ($self, $services) = @_;
    my $c = $self->{c};
    $c->stash->{status} = "err-428";
    $c->stash->{data}->{message} = $c->lang->get("err-428");
    $c->stash->{data}->{failed} = $services;
    return $c->view->render->json;
}

sub internal_error {
    my $self = shift;
    $self->_error("err-500");
}

sub object_does_not_exists {
    my $self = shift;
    $self->_error("err-600");
}

sub objects_does_not_exists {
    my $self = shift;
    my $c = $self->{c};
    $c->stash->{status} = "err-601";
    $c->stash->{data}->{message} = $c->lang->get("err-601");
    $c->stash->{data}->{failed} = ref $_[0] eq "ARRAY" ? shift : [@_];
    return $c->view->render->json;
}

sub no_objects_selected {
    my $self = shift;
    my $c = $self->{c};
    $c->stash->{status} = "err-605";
    $c->stash->{data}->{message} = $c->lang->get("err-605");
    return $c->view->render->json;
}

sub form_parse_errors {
    my $self = shift;
    my $c = $self->{c};
    $c->stash->{status} = "err-610";
    $c->stash->{data}->{message} = $c->lang->get("err-610");
    $c->stash->{data}->{failed} = ref $_[0] eq "ARRAY" ? shift : [@_];
    return $c->view->render->json;
}

sub duplicate_params {
    my $self = shift;
    my $c = $self->{c};
    $c->stash->{status} = "err-620";
    $c->stash->{data}->{message} = $c->lang->get("err-620");
    $c->stash->{data}->{failed} = ref $_[0] eq "ARRAY" ? shift : [@_];
    return $c->view->render->json;
}

sub json_parse_params_error {
    my $self = shift;
    my $c = $self->{c};
    $c->stash->{status} = "err-630";
    $c->stash->{data}->{message} = $c->lang->get("err-630");
    $c->stash->{data}->{failed} = ref $_[0] eq "ARRAY" ? shift : [@_];
    return $c->view->render->json;
}

sub no_report_data_available {
    my $self = shift;
    $self->_error("err-640");
}

sub password_must_be_changed {
    my $self = shift;
    $self->_error("err-700");
}

sub password_is_not_correct {
    my $self = shift;
    $self->_error("err-701");
}

sub password_is_too_long {
    my $self = shift;
    $self->_error("err-702");
}

sub password_is_too_short {
    my $self = shift;
    $self->_error("err-703");
}

sub passwords_does_not_match {
    my $self = shift;
    $self->_error("err-704");
}

sub passwords_must_be_different {
    my $self = shift;
    $self->_error("err-705");
}

sub limit_error {
    my $self = shift;
    $self->_error(@_);
}

sub feature_not_available {
    my $self = shift;
    $self->_error("err-802");
}

sub _error {
    my ($self, $code, @str) = @_;
    my $c = $self->{c};
    my $message = $c->lang->get($code, @str);
    $c->log->warning($message);
    $c->stash->{status} = $code;
    $c->stash->{data}->{message} = $message;
    return $c->view->render->json;
}

1;
