package Bloonix::Model::Schema::Location;

use strict;
use warnings;
use base qw(Bloonix::DBI::Base);
use base qw(Bloonix::DBI::CRUD);

sub init {
    my $self = shift;

    $self->validator->set(
        ipaddr => {
            regex => $self->validator->regex->ipaddr
        },
        hostname => {
            regex => qr/^[\w\.\-]{3,64}\z/
        },
        city => {
            min_size => 2,
            max_size => 50
        },
        country => {
            options => $self->c->plugin->ccodes->country
        },
        continent => {
            options => $self->c->plugin->ccodes->continent
        },
        coordinates => {
            regex => qr/^-{0,1}\d{1,20},-{0,1}\d{1,20}\z/,
            default => "0,0"
        },
        description => {
            min_size => 0,
            max_size => 500,
            optional => 1
        }
    );
}

sub as_object {
    my $self = shift;

    my $locations = $self->all;
    my %locations;

    foreach my $location (@$locations) {
        $locations{$location->{id}} = $location;
        $locations{$location->{hostname}} = $location;
    }

    return \%locations;
}

1;
