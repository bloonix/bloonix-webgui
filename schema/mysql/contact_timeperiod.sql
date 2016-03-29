CREATE TABLE `contact_timeperiod` (
    `id`                BIGINT NOT NULL PRIMARY KEY AUTO_INCREMENT,
    `contact_id`        BIGINT NOT NULL,
    `timeperiod_id`     BIGINT NOT NULL,
    `message_service`   VARCHAR(20) NOT NULL DEFAULT 'all',
    `exclude`           CHAR(1) NOT NULL DEFAULT '0',
    `timezone`          VARCHAR(40) NOT NULL DEFAULT 'Europe/Berlin',
    FOREIGN KEY (`contact_id`) REFERENCES `contact`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`timeperiod_id`) REFERENCES `timeperiod`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB;
