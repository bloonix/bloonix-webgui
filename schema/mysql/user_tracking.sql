CREATE TABLE `user_tracking` (
    `id`            BIGINT NOT NULL PRIMARY KEY AUTO_INCREMENT,
    `company_id`    BIGINT NOT NULL,
    `time`          DATETIME NOT NULL,
    `user_id`       BIGINT NOT NULL,
    `username`      VARCHAR(50) NOT NULL,
    `action`        VARCHAR(10) NOT NULL,
    `target`        VARCHAR(200) NOT NULL DEFAULT 'n/a',
    `message`       TEXT NOT NULL,
    FOREIGN KEY (`company_id`) REFERENCES `company`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE INDEX `user_tracking_company_id_index` ON `user_tracking`(`company_id`);
CREATE INDEX `user_tracking_time_index` ON `user_tracking`(`time`);
