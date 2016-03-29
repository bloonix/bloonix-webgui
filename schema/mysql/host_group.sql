CREATE TABLE `host_group` (
    `host_id`   BIGINT NOT NULL,
    `group_id`  BIGINT NOT NULL,
    UNIQUE (`host_id`, `group_id`),
    FOREIGN KEY (`host_id`) REFERENCES `host`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`group_id`) REFERENCES `group`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE INDEX `host_group_host_id_index` ON `host_group` (`host_id`);
CREATE INDEX `host_group_group_id_index` ON `host_group` (`group_id`);
