=head1 NAME

Bloonix - The main heaven controller.

=head1 DESCRIPTION

=head1 PREREQUISITES

=head1 REPORT BUGS

Please report all bugs to <support(at)bloonix.de>.

=head1 AUTHOR

Jonny Schulz <support(at)bloonix.de>.

=head1 COPYRIGHT

Copyright (C) 2010-2013 by Jonny Schulz. All rights reserved.

=cut

package Bloonix;

use strict;
use warnings;
use base qw(Bloonix::Heaven);
use Params::Validate qw();
use Sys::Hostname;

sub init {
    my $self = shift;

    #if (!-e "/usr/sbin/sendmail") {
        #die "no /usr/sbin/sendmail found";
    #}

    $self->_validate;
    $self->_init_plugins;
    $self->_init_routes;
}

sub _init_plugins {
    my $self = shift;

    $self->plugin->load("Action");
    $self->plugin->load("Chart");
    $self->plugin->load("CCodes");
    $self->plugin->load("Defaults");
    $self->plugin->load("Downtime");
    $self->plugin->load("Error");
    $self->plugin->load("Lang");
    $self->plugin->load("LogAction");
    $self->plugin->load("Report");
    $self->plugin->load("Service");
    $self->plugin->load("Template");
    $self->plugin->load("Timezone");
    $self->plugin->load("Timeperiod");
    $self->plugin->load("Transaction");
    $self->plugin->load("Token");
    $self->plugin->load("Validate");
    $self->plugin->load("Util");
    $self->plugin->load("WTRM");
}

sub _init_routes {
    my $self = shift;

    $self->load("Administration");
    $self->load("Administration::Companies");
    $self->load("Administration::Groups");
    $self->load("Administration::Groups::Members");
    $self->load("Administration::Hosts");
    $self->load("Administration::Locations");
    $self->load("Administration::Users");
    $self->load("Administration::Variables");
    $self->load("Contactgroups");
    $self->load("Contactgroups::Member");
    $self->load("Contacts");
    $self->load("Contacts::MessageServices");
    $self->load("Contacts::Timeperiods");
    $self->load("Events");
    $self->load("Help");
    $self->load("Hosts");
    $self->load("Hosts::Charts");
    $self->load("Hosts::Charts::View");
    $self->load("Hosts::Dependencies");
    $self->load("Hosts::Downtimes");
    $self->load("Hosts::Events");
    $self->load("Hosts::Mtr");
    $self->load("Hosts::Register");
    $self->load("Hosts::Report");
    $self->load("Hosts::Services");
    $self->load("Hosts::Templates");
    $self->load("Locations");
    $self->load("Plugins");
    $self->load("Root");
    $self->load("Register");
    $self->load("Rosters");
    $self->load("Screen");
    $self->load("Services");
    $self->load("Templates");
    $self->load("Templates::Member");
    $self->load("Timeperiods");
    $self->load("Token");
    $self->load("User");
    $self->load("User::Charts");
    $self->load("WTRM");
}

sub _validate {
    my $self = shift;
    my $config = $self->config;

    $config->{webapp} = $self->_validate_webapp($config->{webapp});
    $config->{email} = $self->_validate_email($config->{email});
}

sub _validate_webapp {
    my $self = shift;

    my %config = Params::Validate::validate(@_, {
        sid_expire_time => {
            type => Params::Validate::SCALAR,
            regex => qr/^[1-9]\d*\z/,
            default => 3600
        },
        sid_refresh_time => {
            type => Params::Validate::SCALAR,
            regex => qr/^[1-9]\d*\z/,
            default => 300
        },
        html_path => {
            type => Params::Validate::SCALAR,
            default => "/srv/bloonix/webgui/templates/html"
        },
        chart_library => {
            type => Params::Validate::SCALAR,
            default => "other",
            regex => qr/^(highcharts|other)\z/
        },
        hostname => {
            type => Params::Validate::SCALAR,
            default => Sys::Hostname::hostname()
        },
        check_frequency => {
            type => Params::Validate::SCALAR,
            regex => qr/^(sleepy|low|mid|high)\z/,
            default => "low"
        },
        cloudapp => {
            type => Params::Validate::SCALAR,
            regex => qr/^(yes|no|0|1)\z/,
            default => 0
        },
        show_cost_info => {
            type => Params::Validate::SCALAR,
            regex => qr/^(yes|no|0|1)\z/,
            default => 0
        },
        is_demo => {
            type => Params::Validate::SCALAR,
            regex => qr/^(yes|no|0|1)\z/,
            default => 0
        },
        allow_simple_usernames => {
            type => Params::Validate::SCALAR,
            regex => qr/^(yes|no|0|1)\z/,
            default => 0
        },
        enable_user_tracking => {
            type => Params::Validate::SCALAR,
            regex => qr/^(yes|no|0|1)\z/,
            default => 0
        },
        enable_check_token => {
            type => Params::Validate::SCALAR,
            regex => qr/^(yes|no|0|1)\z/,
            default => 1
        }
    });

    foreach my $key (qw/cloudapp show_cost_info show_locations is_demo allow_simple_usernames check_token enable_user_tracking/) {
        $config{$key} = $config{$key} =~ /0|no/ ? 0 : 1;
    }

    if ($config{hostname} eq "yourdomain.test") {
        $config{hostname} = Sys::Hostname::hostname();
    }

    return \%config;
}

sub _validate_email {
    my $self = shift;

    my %config = Params::Validate::validate(@_, {
        from => {
            type => Params::Validate::SCALAR,
            default => 'root@localhost'
        },
        to => { 
            type => Params::Validate::SCALAR, 
            default => 'root@localhost'
        },
        subject => {
            type => Params::Validate::SCALAR,
            default => "[BLOONIX-WEBGUI] %s"
        },
        flags => {
            type => Params::Validate::SCALAR,
            default => "none"
        }
    });

    return \%config;
}

1;
