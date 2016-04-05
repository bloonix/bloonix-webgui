package Bloonix::Model::REST::Stats;

use strict;
use warnings;

sub get {
    my ($self, %opts) = @_;
    my $termkey = ref $opts{service_id}
        ? "terms"
        : "term";

    my $request = {
        from => 0,
        size => 10000,
        filter => {
            and => [
                { $termkey => { service_id => $opts{service_id} } },
                { range => { time => { from => $opts{from_time}, to => $opts{to_time} } } }
            ]
        }, 
    };

    if ($opts{fields}) {
        $request->{fields} = $opts{fields};
    }

    if ($opts{subkey}) {
        push @{$request->{filter}->{and}}, {
            term => { subkey => $opts{subkey} }
        };
    }

    my $result = $self->schema->base->getall(
        from_time => $opts{from_time},
        to_time => $opts{to_time},
        request => $request,
        type => "stats"
    );

    return $result->{hits};
}

1;
