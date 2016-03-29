CREATE TABLE `host_contactgroup` (
    `contactgroup_id`   BIGINT NOT NULL,
    `host_id`           BIGINT NOT NULL,
    UNIQUE (`contactgroup_id`, `host_id`),
    FOREIGN KEY (`contactgroup_id`) REFERENCES `contactgroup`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`host_id`) REFERENCES `host`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB;
