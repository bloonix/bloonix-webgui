CREATE TABLE `service_parameter` (
    `ref_id`                    BIGINT NOT NULL PRIMARY KEY AUTO_INCREMENT,
    `host_template_id`          BIGINT NULL,
    `agent_id`                  VARCHAR(100) NOT NULL DEFAULT 'localhost',
    `service_name`              VARCHAR(100) NOT NULL,
    `host_alive_check`          CHAR(1) NOT NULL DEFAULT '0',
    `passive_check`             CHAR(1) NOT NULL DEFAULT '0',
    `command_options`           TEXT NOT NULL,
    `location_options`          TEXT NOT NULL,
    `agent_options`             TEXT NOT NULL,
    `sum_services`              SMALLINT NOT NULL DEFAULT '1',
    `plugin_id`                 BIGINT NOT NULL,
    `description`               VARCHAR(100) NOT NULL DEFAULT '',
    `comment`                   VARCHAR(200) NOT NULL DEFAULT '',
    `interval`                  INTEGER NOT NULL DEFAULT 0,
    `retry_interval`            INTEGER NOT NULL DEFAULT 0,
    `timeout`                   INTEGER NOT NULL DEFAULT 0,
    `attempt_warn2crit`         CHAR(1) NOT NULL DEFAULT 0,
    `attempt_max`               SMALLINT NOT NULL DEFAULT 3,
    `notification_interval`     INTEGER NOT NULL DEFAULT 3600,
    `fd_enabled`                CHAR(1) NOT NULL DEFAULT 1,
    `fd_time_range`             INTEGER NOT NULL DEFAULT 1800,
    `fd_flap_count`             INTEGER NOT NULL DEFAULT 8,
    `is_volatile`               CHAR(1) NOT NULL DEFAULT 0,
    FOREIGN KEY (`host_template_id`) REFERENCES `host_template`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`plugin_id`) REFERENCES `plugin`(`id`)
) ENGINE=InnoDB;

CREATE INDEX `service_parameter_ref_id_index` ON `service_parameter` (`ref_id`);
CREATE INDEX `service_parameter_service_name` ON `service_parameter` (`service_name`);
