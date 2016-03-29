CREATE TABLE `host_downtime` (
    `id`            BIGINT NOT NULL PRIMARY KEY AUTO_INCREMENT,
    `host_id`       BIGINT NOT NULL,
    `begin`         DATETIME,
    `end`           DATETIME,
    `timeslice`     VARCHAR(200),
    `flag`          VARCHAR(100) DEFAULT 'none',
    `timezone`      VARCHAR(40) NOT NULL DEFAULT 'Europe/Berlin',
    `username`      VARCHAR(50) NOT NULL,
    `description`   VARCHAR(300) NOT NULL,
    FOREIGN KEY (`host_id`) REFERENCES `host`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE INDEX `host_downtime_index` ON `host_downtime` (`host_id`, `begin`, `end`);
