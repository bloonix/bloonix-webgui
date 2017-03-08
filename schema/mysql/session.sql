CREATE TABLE `session` (
    `sid`       VARCHAR(255) NOT NULL,
    `user_id`   BIGINT NOT NULL,
    `expire`    BIGINT NOT NULL,
    `stash`     TEXT,
    UNIQUE(`sid`),
    FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE INDEX `session_sid_index` on `session` (`sid`);
