CREATE TABLE `service_contactgroup` (
    `contactgroup_id`   BIGINT NOT NULL,
    `service_id`        BIGINT NOT NULL,
    UNIQUE (`contactgroup_id`, `service_id`),
    FOREIGN KEY (`contactgroup_id`) REFERENCES `contactgroup`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`service_id`) REFERENCES `service`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB;
