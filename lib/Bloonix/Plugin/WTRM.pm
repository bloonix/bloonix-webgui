package Bloonix::Plugin::WTRM;

use strict;
use warnings;

sub new {
    my ($class, $c) = @_;

    my $self = bless { c => $c }, $class;

    my @actions = (
        doAuth => [
            username => 1,
            password => 1
        ],
        doUserAgent => [
            userAgent => 1
        ],
        doUrl => [
            url => 1
        ],
        doFill => [
            parent => 0,
            element => 1,
            value => 1,
            event => 0,
            hidden => 0
        ],
        doTriggerEvent => [
            parent => 0,
            element => 1,
            event => 1
        ],
        doClick => [
            parent => 0,
            element => 1
        ],
        doSubmit => [
            parent => 0,
            element => 1
        ],
        doCheck => [
            parent => 0,
            element => 1,
            value => 0
        ],
        doUncheck => [
            parent => 0,
            element => 1,
            value => 0
        ],
        doSelect => [
            parent => 0,
            element => 1,
            value => 0
        ],
        doWaitForElement => [
            parent => 0,
            element => 1,
            text => 0
        ],
        doSleep => [
            ms => 1
        ],
        doSwitchToFrame => [
            name => 1
        ],
        doSwitchToParentFrame => [
            novalue => 0
        ],
        doSwitchToNewPage => [
            novalue => 0
        ],
        doSwitchToMainPage => [
            novalue => 0
        ],
        doAddCookie => [
            name => 1,
            value => 1,
            domain => 1
        ],
        checkUrl => [
            url => 1,
            status => 0,
            contentType => 0
        ],
        checkIfElementExists => [
            parent => 0,
            element => 1
        ],
        checkIfElementNotExists => [
            parent => 0,
            element => 1
        ],
        checkIfElementHasText => [
            parent => 0,
            element => 1,
            text => 1
        ],
        checkIfElementHasNotText => [
            parent => 0,
            element => 1,
            text => 1
        ],
        checkIfElementHasHTML => [
            parent => 0,
            element => 1,
            html => 1
        ],
        checkIfElementHasNotHTML => [
            parent => 0,
            element => 1,
            html => 1
        ],
        checkIfElementHasValue => [
            parent => 0,
            element => 1,
            value => 1,
            hidden => 0
        ],
        checkIfElementHasNotValue => [
            parent => 0,
            element => 1,
            value => 1,
            hidden => 0
        ],
        checkIfElementIsChecked => [
            parent => 0,
            element => 1,
            value => 0
        ],
        checkIfElementIsNotChecked => [
            parent => 0,
            element => 1,
            value => 0
        ],
        checkIfElementIsSelected => [
            parent => 0,
            element => 1,
            value => 0
        ],
        checkIfElementIsNotSelected => [
            parent => 0,
            element => 1,
            value => 0
        ]
    );

    $self->{actions} = [];
    $self->{actions_by_name} = {};

    while (@actions) {
        my $action = shift @actions;
        my $options = shift @actions;
        my @opts;

        while (@$options) {
            my $name = shift @$options;
            my $mandatory = shift @$options;
            push @opts, {
                name => $name,
                mandatory => $mandatory
            };
            $self->{actions_by_name}->{$action}->{$name} = $mandatory;
        }

        push @{ $self->{actions} }, {
            action => $action,
            options => \@opts,
        };
    }

    return $self;
}

sub actions {
    my $self = shift;

    return $self->{actions};
}

sub validate_steps {
    my ($self, $data) = @_;
    my @errors;

    if (ref $data ne "ARRAY") {
        return undef;
    }

    foreach my $step (@$data) {
        my $err = $self->validate_step($step);

        if ($err) {
            push @errors, [ $step, $err ];
        }
    }

    return wantarray
        ? @errors ? @errors : ()
        : @errors ? \@errors : undef;
}

sub validate_step {
    my ($self, $step) = @_;
    my $actions = $self->{actions_by_name};
    my @errors;

    if (!$step->{action} || !exists $actions->{$step->{action}}) {
        push @errors, "action";
    }

    my $action = $actions->{$step->{action}};

    foreach my $param (keys %$action) {
        push @errors, $param if
            ($action->{$param} == 1 && !defined $step->{$param})
            || ($param eq "ms" && defined $step->{$param} && $step->{$param} !~ /^[1-9]\d{1,4}\z/)
            || ($param eq "url" && defined $step->{$param} && $step->{$param} !~ m!^https{0,1}://[^\s]+\.[^\s+]+\z!)
            || ($param eq "parent" && defined $step->{$param} && $step->{$param} !~ /^#[^\s]+\z/)
            || ($param eq "element" && defined $step->{$param} && $step->{$param} !~ /^(?:[^\s]+|<\s*[a-zA-Z0-9]{1,16}(?:\[\d{1,2}\]){0,1}(?:\s+[a-zA-Z0-9_\-]+=(?:'[^']*'|"[^"]*"))*\s*>)\z/)
            || ($param eq "novalue" && defined $step->{$param} && length $step->{$param})
            || ($param eq "event" && defined $step->{$param} && $step->{$param} !~ /^(change|keyup|keydown|keypress|focus)\z/)
            || ($param eq "domain" && defined $step->{$param} && $step->{$param} !~ /^\.[^\s]+\z/);
    }

    return @errors ? \@errors : undef;
}

1;
