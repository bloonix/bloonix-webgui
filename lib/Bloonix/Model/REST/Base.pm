package Bloonix::Model::REST::Base;

use strict;
use warnings;
use JSON;

sub getall {
    my ($self, %opts) = @_;

    my @data = ();
    my $order = $opts{order} // "asc";
    my $type = $opts{type};
    my $indices = $self->get_indices($opts{from_time}, $opts{to_time});
    my $request = $opts{request};

    # The max length of not serialized data to read.
    my $maxlen = 536_870_912;
    my $curlen = 0;

    # Just for debugging
    $self->log->info(JSON->new->pretty->encode($request));
    $self->log->info("start fetching rest data");

    # Request each index separate
    foreach my $index (@$indices) {
        $request->{from} = 0;
        $request->{size} = 10000;

        while ( 1 ) {
            $self->log->info(
                "start rest request $index/$type/_search",
                "from $request->{from} size $request->{size}"
            );

            my $path = $opts{routing} && !ref $opts{routing}
                ? "$index/$type/_search?routing=$opts{routing}"
                : "$index/$type/_search";

            my $result = $self->rest->get(
                path => $path,
                data => $request
            );

            $self->log->info("finished rest request");

            if (!$result->{hits} || !$result->{hits}->{total}) {
                last;
            }

            push @data, @{$result->{hits}->{hits}};
            $curlen += $self->rest->length;

            if (@{$result->{hits}->{hits}} < $request->{size}) {
                last;
            }

            if ($curlen >= $maxlen) {
                $self->log->warning("max byte size of $maxlen reached");
                last;
            }

            $request->{from} += $request->{size};
        }

        $request->{from} = @data;
    }

    $self->log->info("finished fetching rest data");

    @data = $order eq "asc"
        ? sort { $a->{_source}->{time} <=> $b->{_source}->{time} } @data
        : reverse sort { $a->{_source}->{time} <=> $b->{_source}->{time} } @data;

    my $total = @data;

    if (defined $opts{from} && defined $opts{size}) {
        my $from = $opts{from};
        my $size = $opts{size};

        if ($total - $from < $size) {
            $size = $total;
        } else {
            $size = $from + $size;
        }

        if ($from > $total || $size == 0) {
            @data = ();
        } else {
            $size--;
            @data = @data[$from .. $size];
        }
    }

    return { total => $total, hits => \@data, ORDERED => $order };
}

sub get_indices {
    my ($self, $from, $to) = @_;

    my $result = $self->rest->get(path => "_aliases");
    my @indices;
    my %indices;

    foreach my $index (keys %$result) {
        if ($index =~ /^bloonix\-(\d\d\d\d)\-(\d\d)\z/) {
            $indices{$index} = undef;
        } elsif ($result->{$index}->{aliases}) {
            foreach my $index (keys %{$result->{$index}->{aliases}}) {
                if ($index =~ /^bloonix\-(\d\d\d\d)\-(\d\d)\z/) {
                    $indices{$index} = undef;
                }
            }
        }
    }

    if ($from && $to) {
        my $from_time = $self->get_year_month($from);
        my $to_time = $self->get_year_month($to);

        foreach my $index (sort keys %indices) {
            if ($index =~ /^bloonix\-(\d\d\d\d)\-(\d\d)\z/) {
                my $index_time = "$1$2";

                if ($index_time >= $from_time && $index_time <= $to_time) {
                    push @indices, $index;
                }
            }
        }
    }  else {
        @indices = sort keys %indices;
    }

    return wantarray ? @indices : \@indices;
}

sub get_year_month {
    my ($self, $time) = @_;

    $time =~ s/\d\d\d\z//;

    my ($year, $month) = (localtime($time))[5,4];
    $year += 1900;
    $month = sprintf("%02d", $month + 1);

    return "$year$month";
}

1;
