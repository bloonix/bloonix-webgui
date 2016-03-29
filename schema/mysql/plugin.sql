CREATE TABLE `plugin` (
    `id`            BIGINT NOT NULL PRIMARY KEY AUTO_INCREMENT,
    `company_id`    BIGINT DEFAULT 1,
    `plugin`        VARCHAR(100) UNIQUE NOT NULL,
    `command`       VARCHAR(100) NOT NULL,
    `category`      VARCHAR(100) NOT NULL,
    `netaccess`     CHAR(1) NOT NULL DEFAULT '0',
    `prefer`        VARCHAR(10) NOT NULL DEFAULT 'localhost',
    `worldwide`     CHAR(1) NOT NULL DEFAULT '0',
    `subkey`        VARCHAR(20) DEFAULT 0,
    `datatype`      VARCHAR(10) NOT NULL,
    `abstract`      VARCHAR(100) NOT NULL,
    `description`   VARCHAR(500) NOT NULL,
    `info`          TEXT,
    FOREIGN KEY (`company_id`) REFERENCES `company`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE INDEX `plugin_plugin_index` ON `plugin` (`plugin`);
CREATE INDEX `plugin_category_index` ON `plugin` (`category`);
