CREATE TABLE `contact_contactgroup` (
    `contactgroup_id`   BIGINT NOT NULL,
    `contact_id`        BIGINT NOT NULL,
    UNIQUE (`contactgroup_id`, `contact_id`),
    FOREIGN KEY (`contactgroup_id`) REFERENCES `contactgroup`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`contact_id`) REFERENCES `contact`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB;
