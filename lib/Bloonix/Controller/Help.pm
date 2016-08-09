package Bloonix::Controller::Help;

use strict;
use warnings;

sub startup {
    my ($self, $c) = @_;

    $c->route->map("/help")->to("index");
    $c->route->map("/help/:doc")->to("get");
}

sub new {
    my ($class, $c) = @_;
    my $self = bless { }, $class;

    $self->{docs} = [
        "bloonix-webgui",
        "how-does-bloonix-checks-your-hosts-and-services",
        "add-new-host",
        "host-parameter",
        "host-variables",
        "host-templates",
        "host-classes",
        "add-new-service",
        "service-parameter",
        "host-alive-check",
        "web-transactions",
        "host-and-service-dependencies",
        "scheduled-downtimes",
        "contacts-and-notifications",
        "users-and-groups",
        "bloonix-agent-installation",
        "bloonix-agent-configuration",
        "notification-screen",
        "user-charts",
        "json-api"
    ];

    $self->{docs_by_name} = {
        map { $_ => 1 } @{ $self->{docs} }
    };

    return $self;
}

sub index {
    my ($self, $c) = @_;

    $c->stash->data([@{$self->{docs}}]);
    $c->view->render->json;
}

sub get {
    my ($self, $c, $opts) = @_;
    my $docs_by_name = $self->{docs_by_name};

    if (!exists $docs_by_name->{$opts->{doc}}) {
        return $c->plugin->error->object_does_not_exists;
    }

    my $html_path = $c->config->{webapp}->{html_path};
    my $lang = $c->stash->{meta}->{lang};

    open my $fh, "<", "$html_path/docs/$lang/$opts->{doc}.html"
        or return $c->plugin->error->object_does_not_exists;

    my $html = do { local $/; <$fh> };
    close $fh;

    foreach my $key (qw/server webgui/) {
        my $value = $c->config->{docs}->{$key};
        my $search = uc($key);
        $html =~ s/\@\@$search\@\@/$value/eg;
    }

    if ($c->config->{docs}->{cloudapp}) {
        $html =~ s/%%-.+-%%//eg;
        $html =~ s/[\r\n]*%%\+\s{0,1}//eg;
        $html =~ s/\s{0,1}\+%%[\r\n]*//eg;
    } else {
        $html =~ s/%%\+.+\+%%//eg;
        $html =~ s/[\r\n]*%%-\s{0,1}//eg;
        $html =~ s/\s{0,1}-%%[\r\n]*//eg;
    }

    $html =~ s/%%(.+?)%%/$c->lang->get($1)/eg;

    open my $fha, "<", "$html_path/docs/accordion.html"
        or return $c->plugin->error->object_does_not_exists;
    $html .= do { local $/; <$fha> };
    close $fha;

    $c->stash->data($html);
    $c->view->render->json;
}

1;
