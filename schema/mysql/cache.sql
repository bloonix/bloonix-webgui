CREATE TABLE `cache` (
    `id`   BIGINT NOT NULL PRIMARY KEY AUTO_INCREMENT,
    `type` VARCHAR(100) NOT NULL,
    `data` TEXT
) ENGINE=InnoDB;

CREATE INDEX `cache_type_index` ON `cache` (`type`);
