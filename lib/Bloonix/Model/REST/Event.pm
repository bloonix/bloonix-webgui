package Bloonix::Model::REST::Event;

use strict;
use warnings;

sub by_host_ids {
    my ($self, %opts) = @_;
    my $query = $opts{query};

    # Default the last 31 days
    if (!$opts{from_time} || !$opts{to_time}) {
        my $time = time;
        $opts{to_time} = $time * 1000;
        $opts{from_time} = ($time - 2678400) * 1000;
    }

    my $request = { filter => { and => [] } };

    push @{$request->{filter}->{and}}, (
        ref $opts{host_id}
            ? { terms => { host_id => $opts{host_id} } }
            : { term => { host_id => $opts{host_id} } }
    );

    push @{$request->{filter}->{and}}, {
        range => {
            time => { from => $opts{from_time}, to => $opts{to_time} }
        }
    };

    if ($query) {
        if (ref $query ne "HASH") {
            $query = { message => $query };
        }

        if ($query->{status}) {
            $query->{status} = ref $query->{status} eq "ARRAY"
                ? join(" OR ", @{$query->{status}})
                : $query->{status};
        }

        foreach my $string (qw/message tags status/) {
            next unless $query->{$string};
            $query->{$string} =~ s/^\s+//;
            $query->{$string} =~ s/\s+\z//;
            $query->{$string} =~ s/^(AND\s+|OR\s+)*//gi;
            $query->{$string} =~ s/(\s+AND|\s+OR)*\z//gi;
            while ($query->{$string} =~ s/(\s+AND\s+(OR|AND)\s+|\s+OR\s+(OR|AND)\s+)/ /gi){}
            #$query->{$string} = join(" ", map { $_ =~ /^(?:AND|OR)\z/ ? $_ : "$_*" } split(/\s+/, $query->{$string}) );
            $query->{$string} = join(" ", split(/\s+/, $query->{$string}));

            push @{$request->{filter}->{and}}, {
                query => {
                    query_string => {
                        fields => [ $string eq "message" ? ("message","tags") : $string ],
                        query => $query->{$string}
                    }
                }
            };
        }

        if ($query->{duration} && $query->{duration} =~ /^\s*(le|ge|lt|gt)(\d+)([dhms]{0,1})\s*\z/) {
            my ($op, $value, $unit) = ($1, $2, $3);
            $unit //= "s";

            if ($unit eq "d") {
                $value *= 24 * 60 * 60;
            } elsif ($unit eq "h") {
                $value *= 60 * 60;
            } elsif ($unit eq "m") {
                $value *= 60;
            }

            if ($op eq "lt") {
                $op = "to";
                $value--;
            } elsif ($op eq "gt") {
                $op = "from";
                $value++;
            } elsif ($op eq "le") {
                $op = "to";
            } else {
                $op = "from";
            }

            push @{$request->{filter}->{and}}, { range => { duration => { $op => $value } } };
        }

        if ($query->{services}) {
            if (ref $query->{services} ne "ARRAY") {
                $query->{services} = [ $query->{services} ];
            }
            my @services;
            foreach my $service_id (@{$query->{services}}) {
                if ($service_id && $service_id =~ /^\d+\z/) {
                    push @services, $service_id;
                }
            }
            if (@services) {
                push @{$request->{filter}->{and}}, {
                    terms => {
                        # It is not necessary to validate if the user
                        # is allowed to request the services, because
                        # the host id is in the and filter.
                        service_id => \@services
                    }
                };
            }
        }
    }

    my $result = $self->schema->base->getall(
        from_time => $opts{from_time},
        to_time => $opts{to_time},
        request => $request,
        type => "event",
        routing => $opts{host_id},
        order => $opts{order} // "desc",
        from => $opts{from} // 0,
        size => $opts{size} // 15
    );

    return { hits => $result };
}

1;
