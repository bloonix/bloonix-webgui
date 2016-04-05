package Bloonix::Model::REST::Results;

use strict;
use warnings;

sub get {
    my ($self, %opts) = @_;

    my $request = {
        from => 0,
        size => 10000,
        filter => {
            and => [
                { term => { service_id => $opts{service_id} } },
                { range => { time => { from => $opts{from_time}, to => $opts{to_time} } } }
            ]
        }, 
    };

    my $result = $self->schema->base->getall(
        from_time => $opts{from_time},
        to_time => $opts{to_time},
        request => $request,
        type => "results",
        order => $opts{order} // "desc",
        from => $opts{from} // 0,
        size => $opts{size} // 25
    );

    return { hits => $result };
}

1;
