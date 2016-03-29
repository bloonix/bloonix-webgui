CREATE TABLE `contact_message_services` (
    `id`                 BIGINT NOT NULL PRIMARY KEY AUTO_INCREMENT,
    `contact_id`         BIGINT NOT NULL,
    `message_service`    VARCHAR(20) NOT NULL,
    `enabled`            CHAR(1) NOT NULL DEFAULT 1,
    `send_to`            VARCHAR(100),
    `notification_level` VARCHAR(40) NOT NULL DEFAULT 'all',
    `creation_time`      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`contact_id`) REFERENCES `contact`(`id`) ON DELETE CASCADE
)  ENGINE=InnoDB;
