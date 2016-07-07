package Bloonix::Controller::Root;

use strict;
use warnings;
use Time::HiRes;

sub auto {
    my ($self, $c) = @_;

    $c->version->{js} = 123;

    my $addr = $c->req->remote_addr || "n/a";
    my $lang = $c->req->cookie("lang");

    $self->{runtime} = Time::HiRes::gettimeofday();
    $c->log->notice("start processing", $c->action_path, "addr $addr");
    $c->model->database->reconnect;

    if (!$lang || !exists $c->plugin->lang->{$lang}) {
        $lang = "en";
    }

    $c->lang($c->plugin->lang->{$lang});
    $c->stash->{lang} = $c->plugin->lang->{$lang};

    # Set some defaults
    $c->stash->{meta}->{lang} = $lang;
    $c->stash->{meta}->{hostname} = $c->req->server_name;
    $c->stash->{meta}->{ipaddr} = $addr;
    $c->stash->{meta}->{chart_library} = $c->config->{webapp}->{chart_library};
    $c->stash->{meta}->{debugjs} = $c->req->param("debugjs");
    $c->stash->{meta}->{maintenance} = $c->model->database->maintenance->get_status;

    if ($c->req->is_json) {
        $c->view->render->json;
    }

    if ($c->action_path eq "login" || $c->action_path eq "register/host") {
        return 1;
    }

    my $sid = $c->req->cookie("sid") || $c->req->param("sid");
    my ($user, $do_not_check_expire_date);

    if ($sid) {
        $user = $c->model->database->session->get_user($sid, time);
    } elsif ($c->action_path =~ m!^(screen\z|screen/|hosts/charts/info/|whoami)!) {
        my $username = $c->req->param("username");
        my $authkey = $c->req->param("authkey");
        if ($authkey && $username) {
            $user = $c->model->database->user->by_authkey($username, $authkey);
            $c->stash->{meta}->{authkey} = $authkey;
            $do_not_check_expire_date = 1;
        }
    }

    if ($user) {
        my $company = $c->model->database->company->get($user->{company_id});
        $c->session->set(delete $user->{session_stash});

        if ($c->session->stash->{admin_id}) {
            my $admin_user = $c->model->database->user->get($c->session->stash->{admin_id});
            $user->{admin_id} = $admin_user->{id};
            $user->{admin_username} = $admin_user->{username};
            $c->log->set_pattern("%X", "user_id", "$user->{admin_id} ACTS AS $user->{id}");
            $c->log->set_pattern("%Y", "username", "$user->{admin_username} ACTS AS $user->{username} ($addr)");
            $c->log->notice(
                "admin user $user->{admin_username}($user->{admin_id})",
                "acts as $user->{username}($user->{id})"
            );
        } else {
            $c->log->set_pattern("%X", "user_id", $user->{id});
            $c->log->set_pattern("%Y", "username", "$user->{username} ($addr)");

            if ($company->{active} != 1) {
                $c->log->notice("company of user $user->{username} not active");
                $c->plugin->error->noauth_access;
                $c->res->redirect("/login");
                return undef;
            }

            if (!$self->_is_allowed($c, $user)) {
                $c->log->notice("user $user->{username} is not allowed to access from addr $addr");
                $c->res->redirect("/login");
                $c->plugin->error->noauth_access;
                return undef;
            }
        }

        $user->{stash} = $c->json->decode($user->{stash});
        $user->{stash}->{table_config} //= {};
        $user->{company_data_retention} = $company->{data_retention};

        # Delete secrets!
        delete $user->{password};
        delete $user->{authkey};

        $c->user($user);
        $c->stash->{user} = $user;

        $c->log->notice(
            "process path",
            $c->action_path,
            "content length",
            $c->req->content_length,
            "lang $lang",
            "addr $addr"
        );

        if ($user->{password_changed} == 0 && $c->action_path !~ m!^(?:user/passwd|whoami|index|token/csrf|logout)\z!) {
            if (!$c->session->stash->{admin_id}) {
                $c->plugin->error->password_must_be_changed;
                if (!$c->req->is_json) {
                    $c->res->redirect("/");
                }
                return undef;
            }
        }

        if (!$do_not_check_expire_date && $c->user->{expire} - time < $c->config->{webapp}->{sid_refresh_time}) {
            $c->model->database->session->update_by_sid($sid, time + $c->config->{webapp}->{sid_expire_time});
        }

        if ($c->user->{username} eq "demo" && $c->config->{webapp}->{is_demo} && $c->action =~ /^(create|update|delete|add|remove)\z/) {
            $c->plugin->error->no_privileges;
            return undef;
        }

        return 1;
    }

    if ($c->req->is_json) {
        $c->plugin->error->session_expired;
        return undef;
    }

    $self->login($c);
    return undef;
}

sub startup {
    my ($self, $c) = @_;

    $c->route->map("/")->to("index");
    $c->route->map("/lang/:lang(en|de|it)")->to("lang");
    $c->route->map("/operateas/:id")->to("operateas");
    $c->route->map("/whoami")->to("whoami");
    $c->route->map("/login")->to("login");
    $c->route->map("/logout")->to("logout");
    $c->route->map("/maintenance/:action(enable|disable)")->to("maintenance");
}

sub default {
    my ($self, $c) = @_;

    $c->plugin->error->site_does_not_exists;

    if (!$c->req->is_json) {
        $c->res->redirect("/");
    }
}

sub error {
    my ($self, $c) = @_;

    $c->stash->destroy;
    $c->plugin->error->internal_error;
    $c->res->content_type("text/html");
    $c->res->body(
        join("\n",
            '<!DOCTYPE html>',
            '<html lang="en">',
            '<head>',
            '    <title>Internal error</title>',
            '    <meta http-equiv="content-type" content="text/html; charset=UTF-8">',
            '</head>',
            '<body style="background-color: #bbbbbb; padding: 1em;">',
            '<div style="background-color: #775555; padding: 1em;">',
            '<div style="background-color: #eeeeee; padding: 1em;">',
            '<pre>',
            '(en) Please come back later',
            '(fr) SVP veuillez revenir plus tard',
            '(es) Por favor, vuelva más tarde',
            '(de) Bitte versuchen sie es spaeter nocheinmal',
            "(at) Konnten's bitt'schoen spaeter nochmal reinschauen",
            '(no) Vennligst prov igjen senere',
            '(dk) Venligst prov igen senere',
            '(pl) Prosze sprobowac pozniej',
            '(pt) Por favor volte mais tarde',
            '(ru) Попробуйте еще раз позже',
            '(ua) Спробуйте ще раз пізніше',
            '(cn) 請稍後再來',
            '</pre>',
            '</div>',
            '</div>',
            '</body>',
            '</html>',
        )
    );

    return 1;
}

sub index {
    my ($self, $c) = @_;

    if (!$c->req->is_json) {
        $c->stash->{template} = $c->req->http_host =~ /^mobile/
            ? "mobile.tt"
            : "index.tt";

        $c->stash->{data} = {
            init => $c->json->encode({
                chartLibrary => $c->config->{webapp}->{chart_library},
                version => $c->version->{js},
                showCostInfo => $c->config->{webapp}->{show_cost_info}
            }),
            version => $c->version->{js}
        };
    }

    $c->view->render->template;
}

sub maintenance {
    my ($self, $c, $opts) = @_;

    if ($c->user->{role} ne "admin") {
        return $c->plugin->error->noauth_access;
    }

    if ($opts->{action} eq "enable") {
        $c->model->database->maintenance->status("enable", $c->req->param("message"));
    } elsif ($opts->{action} eq "disable") {
        $c->model->database->maintenance->status("disable", "");
    }

    $c->view->render->json;
}

sub whoami {
    my ($self, $c) = @_;

    my %clone = %{$c->user};
    delete $clone{sid};
    delete $clone{comment};

    $c->stash->data(\%clone);
    $c->view->render->json;
}

sub lang {
    my ($self, $c, $opts) = @_;
    my $ref = $c->req->referrer || "/";

    $c->res->cookie(
        -name    => "lang",
        -value   => $opts->{lang},
        -expires => "+2160h",
    );

    $c->stash->data(lang => $opts->{lang});
    $c->view->render->json;
}

sub operateas {
    my ($self, $c, $opts) = @_;

    if ($c->user->{role} ne "admin") {
        $c->plugin->error->site_does_not_exists;
        $c->res->header(status => "302 Found");
        $c->res->header(location => "/");
        return $c->view->render->json;
    }

    my $user = $c->model->database->user->get($opts->{id});

    if (!$user || $user->{role} eq "admin") {
        $c->plugin->error->object_does_not_exists;
        $c->res->header(status => "302 Found");
        $c->res->header(location => "/");
        return $c->view->render->json;
    }

    $c->model->database->session->update(
        data => {
            user_id => $opts->{id},
            stash => $c->json->encode({ admin_id => $c->user->{id} })
        },
        condition => [
            sid => $c->user->{sid}
        ]
    );

    $c->res->header(status => "302 Found");
    $c->res->header(location => "/");
    $c->view->render->json;
}

sub login {
    my ($self, $c) = @_;

    if ($c->req->param("lang")) {
        my $lang = $c->req->param("lang");

        if (exists $c->plugin->lang->{$lang}) {
            $c->res->cookie(
                -name    => "lang",
                -value   => $lang,
                -expires => "+2160h",
            );
        }
    }

    my $hostname = $c->config->{webapp}->{hostname};
    my $username = $c->req->param("username");
    my $password = $c->req->param("password");
    my $req_pwd = $c->req->param("req_new_pwd");
    my $failed_login = 0;
    my $expires = $c->req->param("expires");
    my $time = $c->plugin->util->timestamp;
    my $ipaddr = $c->req->remote_addr;
    my $redirect = $c->req->param("redirect");

    if ($req_pwd && $c->config->{email}->{flags} =~ /password-request/) {
        $c->plugin->util->quickmail(
            sendmail => $c->config->{email}->{sendmail},
            from => $c->config->{email}->{from},
            to => $c->config->{email}->{to},
            subject => sprintf($c->config->{email}->{subject}, "User request for new password"),
            message => join("\n",
                "User: ".$c->req->param("req_new_pwd"),
                "Address: $ipaddr",
                "Time: $time",
                "", "The user forgots his password and request to set a new one."
            ),
        );
        $username = undef;
        $password = undef;
    }

    if (defined $username && defined $password) {
        $username =~ s/^[\s\n\r]//;
        $username =~ s/[\s\n\r]+\z//;
        $username = lc($username);
        $password =~ s/^[\s\n\r]//;
        $password =~ s/[\s\n\r]+\z//;
    }

    if ($username && $password) {
        my $user = $c->model->database->user->password($username);
        my $addr = $c->req->remote_addr || "n/a";
        my $company;

        if ($user) {
            $company = $c->model->database->company->get($user->{company_id});
        }

        if ($company && $company->{active} == 1 && $user && $user->{locked} == 0 && $user->{password}) {
            my $hash = $c->plugin->util->pbkdf2_sha512_base64($password, $user->{salt}, $user->{rounds});

            if ($hash ne $user->{password} && !$user->{crypt_type}) {
                my $shaXXX = length($user->{password}) == 64
                    ? $c->plugin->util->sha256($password)
                    : $c->plugin->util->sha512($password);

                if ($shaXXX eq $user->{password}) {
                    # The user has a sha256/sha512 password
                    $c->log->notice(
                        "changed password from sha256/sha512 to pbkdf2",
                        "for user $user->{username} ($user->{id})",
                    );

                    my %secret = (crypt_type => 1);
                    @secret{qw(password salt rounds)} = $c->plugin->util->pbkdf2_sha512_base64($password);

                    # Update the password hash
                    $c->model->database->user_secret->update(
                        data => \%secret,
                        condition => [ user_id  => $user->{id} ],
                    );

                    # Fetch it again
                    $user = $c->model->database->user->password($username);
                    $hash = $c->plugin->util->pbkdf2_sha512_base64($password, $user->{salt}, $user->{rounds});
                }
            }

            if ($hash eq $user->{password}) {
                my $sid = $c->plugin->util->sha512($username.time.$c->plugin->util->pwgen(64));
                $c->stash->data(sid => $sid);
                delete $user->{salt};
                delete $user->{rounds};
                delete $user->{password};
                delete $user->{authkey};
                $c->user($user);
                $c->model->database->session->delete_expired($user->{id}, time);

                $c->plugin->log_action->login(
                    target => "user", 
                    data => { 
                        user_id => $c->user->{id},
                        username => $c->user->{username},
                        ipaddr => $ipaddr,
                    }
                );

                ### THE COOKIE HANDLING MUST BE IMPROVED :-)
                # time + sid_expire_time => +hours
                if (defined $expires && $expires eq "0") {
                    $c->model->database->session->create(
                        sid     => $sid,
                        user_id => $user->{id},
                        expire  => time + 315_360_000,
                    );
                    $c->res->cookie(
                        -name    => "sid",
                        -value   => $sid,
                        -expires => "+87600h",
                    );
                } else {
                    $c->model->database->session->create(
                        sid     => $sid,
                        user_id => $user->{id},
                        expire  => time + $c->config->{webapp}->{sid_expire_time},
                    );
                    my $hours = int($c->config->{webapp}->{sid_expire_time}/60);
                    $c->res->cookie(
                        -name  => "sid",
                        -value => $sid,
                        -expires => "+${hours}h",
                    );
                }

                if ($c->config->{email}->{flags} =~ /success-login/) {
                    my $uname = $username;
                    $uname =~ s/\W/-/g;
                    $c->plugin->util->quickmail(
                        sendmail => $c->config->{email}->{sendmail},
                        from => $c->config->{email}->{from},
                        to => $c->config->{email}->{to},
                        subject => sprintf($c->config->{email}->{subject}, "User logged in: $uname"),
                        message => join("\n",
                            "Login: success",
                            "User: $username",
                            "IP-Address: $ipaddr",
                            "Time: $time"
                        )
                    );
                }

                $c->model->database->user->update(
                    $user->{id},
                    last_login => time,
                );

                if ($c->req->is_json) {
                    $c->stash->data(sid => $sid);
                    return $c->view->render->json;
                }

                if ($redirect && $redirect !~ m!create|update|delete|add|remove|modify|edit! && $redirect =~ /^#/) {
                    $c->res->redirect("/".$redirect);
                } else {
                    $c->res->redirect("/");
                }

                return 1;
            } else {
                $failed_login = 1;
            }
        } else {
            $failed_login = 1;
        }

        if ($failed_login && $c->config->{email}->{flags} =~ /failed-login/) {
            $c->plugin->util->quickmail(
                sendmail => $c->config->{email}->{sendmail},
                from => $c->config->{email}->{from},
                to => $c->config->{email}->{to},
                subject => sprintf($c->config->{email}->{subject}, "WARNING ($hostname)! FAILED LOGIN from $ipaddr"),
                message => join("\n",
                    "Login: failed",
                    "User: $username",
                    "IP-Address: $ipaddr",
                    "Time: $time"
                )
            );
        }
    }

    if (defined $username || defined $password) {
        if ($c->req->is_json) {
            $c->plugin->error->bad_login;
            return $c->view->render->json;
        }
        $c->stash->{error} = [ $c->lang->get("site.login.error") ];
    }

    $c->stash->{title} = "Login";

    $c->stash->{template} = $c->req->http_host =~ /^mobile/
        ? "mobile-login.tt"
        : "login.tt";

    if ($c->config->{webapp}->{is_demo}) {
        $c->stash->{user} = "demo";
        $c->stash->{password} = "demo";
    }

    $c->view->render->template;
}

sub logout {
    my ($self, $c) = @_;
    my $ipaddr = $c->req->remote_addr || "n/a";

    if ($c->session->stash->{admin_id}) {
        $c->model->database->session->update(
            data => { user_id => $c->session->stash->{admin_id}, stash => "" },
            condition => [ sid => $c->user->{sid} ]
        );
        if ($c->req->is_json) {
            $c->res->header(status => "302 Found");
            $c->res->header(location => "/");
            return $c->view->render->json;
        }
        return $c->res->redirect("/");
    }

    $c->model->database->session->delete(
        sid => $c->user->{sid},
        user_id => $c->user->{id},
    );

    $c->plugin->log_action->logout(
        target => "user",
        data => {
            user_id => $c->user->{id},
            username => $c->user->{username},
            ipaddr => $ipaddr
        }
    );

    $c->res->cookie(
        -name    => "sid",
        -value   => $c->user->{sid},
        -expires => "-1m"
    );

    if ($c->req->is_json) {
        $c->res->header(status => "302 Found");
        $c->res->header(location => "/login");
        return $c->view->render->json;
    }

    $c->res->redirect("/login");
}

sub end {
    my ($self, $c) = @_;

    $self->{runtime} = sprintf("%.6f", Time::HiRes::gettimeofday() - $self->{runtime});
    $c->log->notice("process finished (total $self->{runtime})");
}

sub _is_allowed {
    my ($self, $c, $user) = @_;
    my $addr = $c->req->remote_addr || "n/a";
    my $allow_from = $user->{allow_from} || "all";
    return $c->plugin->util->ip_in_range($addr, $allow_from);
}

1;
