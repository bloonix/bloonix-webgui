CREATE TABLE `user_chart` (
    `id`          BIGINT NOT NULL PRIMARY KEY AUTO_INCREMENT,
    `user_id`     BIGINT NOT NULL DEFAULT 1,
    `public`      CHAR(1) DEFAULT 0,
    `title`       VARCHAR(50) DEFAULT 'n/a',
    `subtitle`    VARCHAR(50) NULL,
    `yaxis_label` VARCHAR(30) NULL,
    `description` VARCHAR(100) NULL,
    `options`     TEXT,
    FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE INDEX `user_chart_title_index` ON `user_chart` (`title`);
