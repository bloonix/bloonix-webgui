INSERT INTO `company` (`company`,`variables`) VALUES ('Bloonix','{}');

INSERT INTO `user` (
    `id`, `company_id`, `username`, `manage_contacts`, `manage_templates`,
    `locked`, `role`, `comment`, `name`, `stash`
) VALUES (
    1, 1, 'admin', 1, 1, 0, 'admin', 'Administrator', 'Administrator', '{}'
);

INSERT INTO `user_secret` (
    `user_id`, `crypt_type`, `salt`, `rounds`, `password`
) VALUES (
    '1',
    '1',
    'H23QZ5c2tBYijITNoz409NNpMr9GiHhF4uE3adX4FyExT6UjWRonye54mSvyOo8V',
    '17775',
    'TYSZ8HM+o8xU05wviSwQUI1avoS816ftBuUy+cxo4n0B3L3SXOC79fARCw2E/Q/2+A9PYgu7MTy3JfluFJS9KA=='
);

INSERT INTO `group` (
    `id`, `company_id`, `groupname`, `description`
) VALUES (
    1, 1, 'Administrator', 'Administration'
);

INSERT INTO `user_group` (
    `user_id`, `group_id`, `create_service`, `update_service`, `delete_service`,
    `create_host`, `update_host`, `delete_host`
) VALUES (
    1, 1, 1, 1, 1, 1, 1, 1
);

INSERT INTO `status_priority` (`priority`, `status`) VALUES (0, 'OK');
INSERT INTO `status_priority` (`priority`, `status`) VALUES (5, 'INFO');
INSERT INTO `status_priority` (`priority`, `status`) VALUES (10, 'WARNING');
INSERT INTO `status_priority` (`priority`, `status`) VALUES (20, 'CRITICAL');
INSERT INTO `status_priority` (`priority`, `status`) VALUES (30, 'UNKNOWN');

insert into `timeperiod` (`company_id`, `name`, `description`)
values (1, '24x7', 'Around the clock');

insert into `timeslice` (`timeperiod_id`, `timeslice`)
values (1, 'Monday - Sunday 00:00 - 23:59');

insert into `timeperiod` (`company_id`, `name`, `description`)
values (1, 'Working time', 'Monday to friday from 9-17');

insert into `timeslice` (`timeperiod_id`, `timeslice`)
values (2, 'Monday - Friday 09:00 - 17:00');

insert into `timeperiod` (`company_id`, `name`, `description`)
values (1, 'Off time', 'The opposite of the working time');

insert into `timeslice` (`timeperiod_id`, `timeslice`)
values (3, 'Monday - Friday 17:01 - 23:59'),
       (3, 'Monday - Friday 00:00 - 08:59'),
       (3, 'Saturday - Sunday 00:00 - 23:59');

INSERT INTO `maintenance` (`version`, `active`) values ('-1', '0');
