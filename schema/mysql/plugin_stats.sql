CREATE TABLE `plugin_stats` (
    `plugin_id`     BIGINT NOT NULL DEFAULT 1,
    `statkey`       VARCHAR(25) NOT NULL,
    `alias`         VARCHAR(100),
    `datatype`      VARCHAR(20) NOT NULL,
    `units`         VARCHAR(20) NOT NULL DEFAULT 'default',
    `stattype`      VARCHAR(10),
    `regex`         VARCHAR(200),
    `substr`        INTEGER,
    `default`       VARCHAR(30) DEFAULT 0,
    `description`   VARCHAR(500) NOT NULL,
    FOREIGN KEY (`plugin_id`) REFERENCES `plugin`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB;
