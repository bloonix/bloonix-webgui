CREATE TABLE `host_secret` (
    `host_id`   BIGINT NOT NULL,
    `password`  VARCHAR(128) NOT NULL,
    FOREIGN KEY (`host_id`) REFERENCES `host`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE INDEX `host_secret_host_id` ON `host_secret` (`host_id`);
