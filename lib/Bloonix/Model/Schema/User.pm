package Bloonix::Model::Schema::User;

use strict;
use warnings;
use base qw(Bloonix::DBI::Base);
use base qw(Bloonix::DBI::CRUD);
use Bloonix::Timezone;

sub init {
    my $self = shift;

    $self->set_unique(or => [ "username" ]);

    $self->action(
        pre_create => sub {
            my ($self, $data) = @_;
            $data->{stash} = '{}';
        }
    );
}

sub set {
    my ($self, $user) = @_; 

    if (!$user || ref $user ne "HASH") {
        die "missing user";
    }

    my $username_regex;
    my $username_min_len;

    if ($self->c->config->{webapp}->{allow_simple_usernames}) {
        $username_regex = qr/^[^\s].*[^\s]\z/;
        $username_min_len = 2;
    } else {
        $username_regex = qr/^(:?[\w\-.\+]+\@[\w\-.]+\.[a-z]+|admin)\z/;
        $username_min_len = 5;
    }

    $self->validator->set(
        company_id => {
            options => $self->schema->company->get_companies_for_selection,
            default => $user->{company_id},
        },
        timezone => {
            options => $self->c->plugin->timezone->form,
            default => "Europe/Berlin",
        },
        username => {
            min_size => $username_min_len,
            max_size => 50,
            regex => $username_regex
        },
        name => {
            min_size => 1,
            max_size => 50,
        },
        phone => {
            max_size => 100,
            optional => 1,
        },
        password => {
            min_size => 8,
            max_size => 300,
        },
        password_changed => {
            options => [0,1],
            default => 0,
        },
        authentication_key => {
            regex => qr/^(.{30,128}|\*+|)\z/,
            optional => 1,
        },
        locked => {
            options => [1,0],
            default => 0,
        },
        role => {
            options => [ $user->{role} eq "admin" ? qw(user operator admin) : qw(user operator) ],
            default => "user",
        },
        manage_contacts => {
            options => [1,0],
            default => 0,
        },
        manage_templates => {
            options => [1,0],
            default => 0,
        },
        comment => {
            max_size => 200,
            optional => 1,
        },
        allow_from =>  {
            min_size => 3,
            max_size => 300,
            regexcl => $self->validator->regex->ipaddrnet_all,
            default => "all"
        }
    );
}

sub password {
    my ($self, $username) = @_;

    my ($stmt, @bind) = $self->sql->select(
        table => [
            user => "*",
            user_secret => [ "password", "salt", "rounds" ],
        ],
        join => [
            inner => {
                table => "user_secret",
                left  => "user.id",
                right => "user_secret.user_id",
            },
        ],
        condition => [
            "user.username" => $username,
        ],
    );

    return $self->dbi->unique($stmt, @bind);
}

sub by_user {
    my ($self, $opts) = (shift, {@_});

    my @select = (
        table => [
            user => "*",
            company => "company"
        ],
        join => [
            inner => {
                table => "company",
                left => "user.company_id",
                right => "company.id"
            }
        ],
    );

    if ($opts->{user}->{role} ne "admin") {
        push @select, condition => [
            where => {
                column => "company_id",
                value => $opts->{user}->{company_id}
            }
        ];
    }

    if ($opts->{sort}) {
        push @select, order => [ $opts->{sort}->{type} => $opts->{sort}->{by} ];
    } elsif ($opts->{order}) {
        push @select, order => $opts->{order};
    }

    my ($count, $data) = $self->dbi->query(
        offset => $opts->{offset},
        limit => $opts->{limit},
        query => $opts->{query},
        concat => [qw(
                user.id user.username user.name
                user.role user.company_id company.company
        )],
        delimiter => " ",
        count => "user.id",
        select => \@select
    );

    return ($count, $data);
}

sub by_authkey {
    my ($self, $username, $authkey) = @_;

    my ($stmt, @bind) = $self->sql->select(
        table => "user",
        column => "*",
        join => [
            inner => {
                table => "user_secret",
                left  => "user.id",
                right => "user_secret.user_id",
            },
        ],
        condition => [
            "user.username" => $username,
            "user_secret.authentication_key" => $authkey,
        ],
    );

    return $self->dbi->unique($stmt, @bind);
}

sub get_group_member {
    my ($self, $op, $user, $group_id) = @_;

    my %select = (
        table => [
            user_group => "*",
            user => "username",
        ],
        join => [
            inner => {
                table => "user",
                left  => "user_group.user_id",
                right => "user.id",
            },
        ],
        condition => [
            where => {
                table => "user_group",
                column => "group_id",
                value => $group_id
            }
        ],
        order => [
            asc => "user.username",
        ]
    );

    if ($user->{role} ne "admin") {
        push @{$select{condition}}, and => {
            table => "user",
            column => "company_id",
            value => $user->{company_id}
        };
    }

    my ($stmt, @bind) = $self->sql->select(%select);
    my $users = $self->dbi->fetch($stmt, @bind);

    if ($op eq "in") {
        return $users;
    }

    my $user_ids = [ map { $_->{user_id} } @$users ];

    if (!@$user_ids) {
        push @$user_ids, 0;
    }

    %select = (
        table => "user",
        column => [ "id", "username" ],
        condition => [
            where => {
                table => "user",
                column => "id",
                op => "not in",
                value => $user_ids
            }
        ],
        order => [ asc => "username" ]
    );

    if ($user->{role} ne "admin") {
        push @{$select{condition}}, and => {
            table => "user",
            column => "company_id",
            value => $user->{company_id}
        };
    }

    ($stmt, @bind) = $self->sql->select(%select);
    return $self->dbi->fetch($stmt, @bind);
}

sub validate_user_ids_by_company_id {
    my ($self, $company_id, $user_ids) = @_;

    my ($stmt, @bind) = $self->sql->select(
        count => "id",
        table => "user",
        condition => [
            where => {
                table => "user",
                column => "company_id",
                value => $company_id
            },
            and => {
                table => "user",
                column => "id",
                value => $user_ids
            },
        ]
    );

    my $count = $self->dbi->count($stmt, @bind);

    return $count == @$user_ids;
}

1;
