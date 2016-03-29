CREATE TABLE `service_downtime` (
    `id`            BIGINT NOT NULL PRIMARY KEY AUTO_INCREMENT,
    `host_id`       BIGINT NOT NULL,
    `service_id`    BIGINT NOT NULL,
    `begin`         DATETIME,
    `end`           DATETIME,
    `timeslice`     VARCHAR(200),
    `flag`          VARCHAR(100),
    `timezone`      VARCHAR(40) NOT NULL DEFAULT 'Europe/Berlin',
    `username`      VARCHAR(50) NOT NULL,
    `description`   VARCHAR(300) NOT NULL,
    FOREIGN KEY (`host_id`) REFERENCES `host`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`service_id`) REFERENCES `service`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE INDEX `service_downtime_index` ON `service_downtime` (`host_id`, `begin`, `end`);
