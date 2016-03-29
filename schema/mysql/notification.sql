CREATE TABLE `notification` (
    `time`              BIGINT DEFAULT 0,
    `host_id`           BIGINT NOT NULL,
    `company_id`        BIGINT NOT NULL DEFAULT 0,
    `message_service`   VARCHAR(20) NOT NULL DEFAULT 'n/a',
    `send_to`           VARCHAR(100) NOT NULL,
    `subject`           VARCHAR(200) NOT NULL,
    `message`           TEXT NOT NULL
) ENGINE=InnoDB;

CREATE INDEX `notification_time_host_id_index` ON `notification` (`time`, `host_id`);
CREATE INDEX `notification_time_company_id_index` ON `notification` (`time`, `company_id`);
