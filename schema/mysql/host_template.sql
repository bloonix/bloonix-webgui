CREATE TABLE `host_template` (
    `id`          BIGINT NOT NULL PRIMARY KEY AUTO_INCREMENT,
    `company_id`  BIGINT NOT NULL,
    `name`        VARCHAR(100) NOT NULL,
    `description` VARCHAR(100) NOT NULL DEFAULT '',
    `variables`   TEXT NOT NULL,
    `tags`        TEXT NOT NULL,
    FOREIGN KEY (`company_id`) REFERENCES `company`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE INDEX `host_template_name_index` ON `host_template` (`name`);
