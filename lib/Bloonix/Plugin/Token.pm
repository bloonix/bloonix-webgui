package Bloonix::Plugin::Token;

use strict;
use warnings;
use constant TOKEN_EXPIRE_TIME => 30;

sub new {
    my ($class, $c) = @_;

    return bless { c => $c }, $class;
}

sub set {
    my ($self, $action) = @_;
    my $c = $self->{c};

    if ($c->config->{webapp}->{enable_check_token} == 0) {
        return 1;
    }

    my $token = $c->plugin->util->sha256;
    $action //= "n/a";

    $c->model->database->token->create(
        tid => $token,
        sid => $c->user->{sid},
        action => $action,
        expire => time + TOKEN_EXPIRE_TIME
    );

    $c->stash->{token} = $token;

    return $token;
}

sub check {
    my ($self, $action, $token) = @_;
    my $c = $self->{c};

    if ($c->config->{webapp}->{enable_check_token} == 0) {
        return 1;
    }

    $token ||= $c->req->param("token");
    $action ||= "n/a";

    if (!$token) {
        $c->plugin->error->token_required;
        return undef;
    }

    if (length $action > 100) {
        warn "action for session token is too long: '$action'";
        $action = substr($action, 0, 100);
    }

    my $session_token = $c->model->database->token->find(
        condition => [
            tid => $token,
            sid => $c->user->{sid},
            action => $action
        ]
    );

    $c->model->database->token->delete_expired(time);

    if (!$session_token) {
        $c->plugin->error->token_expired;
        return undef;
    }

    if ($session_token->{expire} <= time) {
        $c->plugin->error->token_expired;
        $c->log->notice(
            "token exist, but is expired:",
            "expire[$session_token->{expire}]",
            "action[$action]",
            "token[$token]"
        );
        return undef;
    }

    $c->model->database->token->delete(
        tid => $token,
        sid => $c->user->{sid},
        action => $action
    );

    return 1;
}

1;
