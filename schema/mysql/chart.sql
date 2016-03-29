CREATE TABLE `chart` (
    `id`        BIGINT NOT NULL PRIMARY KEY,
    `plugin_id` BIGINT NOT NULL DEFAULT 1,
    `title`     VARCHAR(100) NOT NULL,
    `options`   TEXT,
    FOREIGN KEY (`plugin_id`) REFERENCES `plugin`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE INDEX `chart_title_index` ON `chart` (`title`);
