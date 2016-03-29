CREATE TABLE `chart_view` (
    `id`        BIGINT NOT NULL PRIMARY KEY AUTO_INCREMENT,
    `user_id`   BIGINT NOT NULL DEFAULT 1,
    `public`    CHAR(1) DEFAULT 0,
    `alias`     VARCHAR(200) DEFAULT 'n/a',
    `options`   TEXT,
    FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE INDEX `chart_view_alias_index` ON `chart_view` (`alias`);
