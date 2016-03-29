CREATE TABLE `user_secret` (
    `user_id`               BIGINT NOT NULL,
    `crypt_type`            CHAR(1) DEFAULT 0,
    `salt`                  VARCHAR(128),
    `rounds`                INTEGER DEFAULT 0,
    `password`              VARCHAR(128) NOT NULL,
    `authentication_key`    VARCHAR(128),
    FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE INDEX `user_secret_user_id` ON `user_secret` (`user_id`);
