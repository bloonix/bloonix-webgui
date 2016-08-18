package Bloonix::Model::REST;

use strict;
use warnings;
use Bloonix::REST;
use JSON;
use base qw(Bloonix::Accessor);

sub new {
    my ($class, $c) = @_;

    my $self = bless {
        config => $c->config->{elasticsearch},
        rest => Bloonix::REST->new($c->config->{elasticsearch}),
        log => $c->log,
        c => $c,
    }, $class;

    $self->{rest}->utf8(1);

    $self->_load(
        base => "Bloonix::Model::REST::Base",
        event => "Bloonix::Model::REST::Event",
        stats => "Bloonix::Model::REST::Stats",
        results => "Bloonix::Model::REST::Results",
    );

    if (open my $fh, "<", "/srv/bloonix/webgui/schema/es-template.json") {
        my $es_template = do { local $/; <$fh> };
        close $fh;
        eval {
            $self->{rest}->put(
                path => "_template/template_bloonix/",
                data => JSON->new->decode($es_template)
            );
        };
        if ($@) {
            $self->log->error("unable to update elasticsearch template", $@);
        } else {
            $self->fix_max_result_window_size;
        }
    }

    return $self;
}

sub fix_max_result_window_size {
    my $self = shift;
    my $result = $self->{rest}->get(path => "_aliases");

    foreach my $index (keys %$result) {
        next unless $index =~ /^bloonix-\d\d\d\d-\d\d\z/;
        $self->{rest}->put(
            path => "/$index/_settings",
            data => {
                index => {
                    max_result_window => 1000000
                }
            }
        );
    }
}

sub _load {
    my $self = shift;
    my $class = ref $self;

    while (@_) {
        my $accessor = shift;
        my $module = shift;
        eval "use $module";
        die $@ if $@;

        $self->{$accessor} = bless {
            schema => $self,
            rest => $self->{rest},
            log => $self->{log},
            c => $self->{c}
         }, $module;

        foreach my $method (qw/schema rest log c/) {
            no strict 'refs';
            *{"${module}::${method}"} = sub {
                my $self = shift;
                return $self->{$method};
            };
        }

        if ($module->can("init")) {
            $self->{$accessor}->init();
        }

        $class->mk_accessors($accessor);
    }
}

1;
