CREATE TABLE `user` (
    `id`                BIGINT NOT NULL PRIMARY KEY AUTO_INCREMENT,
    `company_id`        BIGINT NOT NULL DEFAULT 1,
    `username`          VARCHAR(50) UNIQUE NOT NULL,
    `name`              VARCHAR(50),
    `phone`             VARCHAR(100),
    `password_changed`  CHAR(1) NOT NULL DEFAULT 0,
    `manage_contacts`   CHAR(1) NOT NULL DEFAULT 0,
    `manage_templates`  CHAR(1) NOT NULL DEFAULT 0,
    `last_login`        BIGINT NOT NULL DEFAULT 0,
    `locked`            CHAR(1) NOT NULL DEFAULT 0,
    `role`              VARCHAR(8) NOT NULL DEFAULT 'user',
    `comment`           VARCHAR(200),
    `allow_from`        VARCHAR(300) NOT NULL DEFAULT 'all',
    `timezone`          VARCHAR(40) NOT NULL DEFAULT 'Europe/Berlin',
    `stash`             TEXT NOT NULL,
    `creation_time`     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`company_id`) REFERENCES `company`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE INDEX `user_id_index` ON `user` (`id`);
CREATE INDEX `user_username_index` ON `user` (`username`);
