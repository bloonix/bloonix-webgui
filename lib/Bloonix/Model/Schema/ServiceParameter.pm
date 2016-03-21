package Bloonix::Model::Schema::ServiceParameter;

use strict;
use warnings;
use base qw(Bloonix::DBI::Base);
use base qw(Bloonix::DBI::CRUD);

sub init {
    my $self = shift;

    $self->{sequence} = "service_parameter_ref_id_seq";
    $self->{unique_id_column} = "ref_id";
}

1;
