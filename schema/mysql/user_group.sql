CREATE TABLE `user_group` (
    `user_id`           BIGINT NOT NULL,
    `group_id`          BIGINT NOT NULL,
    `create_service`    CHAR(1) DEFAULT 0,
    `update_service`    CHAR(1) DEFAULT 0,
    `delete_service`    CHAR(1) DEFAULT 0,
    `create_host`       CHAR(1) DEFAULT 0,
    `update_host`       CHAR(1) DEFAULT 0,
    `delete_host`       CHAR(1) DEFAULT 0,
    UNIQUE (`user_id`, `group_id`),
    FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`group_id`) REFERENCES `group`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE INDEX `user_group_user_id_index` ON `user_group` (`user_id`);
CREATE INDEX `user_group_group_id_index` ON `user_group` (`group_id`);
