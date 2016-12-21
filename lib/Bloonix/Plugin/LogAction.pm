package Bloonix::Plugin::LogAction;

use strict;
use warnings;
use base qw(Bloonix::Accessor);
use JSON;

__PACKAGE__->mk_accessors(qw/c json/);

sub new {
    my ($class, $c) = @_;

    my $self = bless {
        c => $c,
        json => JSON->new,
    }, $class;

    return $self;
}

sub login {
    my ($self, %log) = @_;

    return $self->log(login => \%log);
}

sub logout {
    my ($self, %log) = @_;

    return $self->log(logout => \%log);
}

sub read {
    my ($self, %log) = @_;

    return $self->log(select => \%log);
}

sub create {
    my ($self, %log) = @_;

    return $self->log(insert => \%log);
}

sub update {
    my ($self, %log) = @_;

    return $self->log(update => \%log);
}

sub delete {
    my ($self, %log) = @_;

    return $self->log(delete => \%log);
}

sub log {
    my ($self, $action, $log) = @_;
    my $c = $self->c;

    if ($c->config->{webapp}->{enable_user_tracking} == 0) {
        return 1;
    }

    my $company_id = $c->user->{company_id};
    my $user_id = $c->user->{admin_id} || $c->user->{id};
    my $username = $c->user->{admin_username} || $c->user->{username};
    my $timestamp = $c->plugin->util->timestamp;
    my $target = $log->{target} || "n/a";
    my $message = "user action $username($user_id) $action $target";
    my $data;

    if ($log->{data} && $log->{old}) {
        my %diff = ();
        my $old = $log->{old};
        my $new = $log->{data};
        my @keys = keys %$old;

        foreach my $key (@keys) {
            my $nv = $new->{$key} // "";
            my $ov = $old->{$key} // "";
            if ($nv ne $ov) {
                $diff{$key} = { new => $ov, old => $nv };
            }
        }

        $data = $self->json->encode({
            new => $new,
            old => $old,
            diff => \%diff,
        });
    } elsif ($log->{data}) {
        $data = $self->json->encode($log->{data});
    }

    $c->model->database->user_tracking->create(
        time       => $timestamp,
        company_id => $c->user->{company_id},
        user_id    => $user_id,
        username   => $username,
        action     => $action,
        target     => $target,
        message    => $data
    );

    #$c->log->debug("$message $data");
}

1;
