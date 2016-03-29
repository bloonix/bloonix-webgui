CREATE TABLE `group` (
    `id`            BIGINT NOT NULL PRIMARY KEY AUTO_INCREMENT,
    `company_id`    BIGINT NOT NULL DEFAULT 1,
    `groupname`     VARCHAR(64) NOT NULL,
    `description`   VARCHAR(100),
    `creation_time` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`company_id`) REFERENCES `company`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE INDEX `group_id_index` ON `group` (`id`);
CREATE INDEX `group_groupname_index` ON `group` (`groupname`);
