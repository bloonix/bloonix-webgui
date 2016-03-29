CREATE TABLE `host_template_host` (
    `host_template_id`  BIGINT NOT NULL,
    `host_id`           BIGINT NOT NULL,
    UNIQUE (`host_template_id`, `host_id`),
    FOREIGN KEY (`host_template_id`) REFERENCES `host_template`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`host_id`) REFERENCES `host`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB;
