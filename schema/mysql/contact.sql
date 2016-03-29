CREATE TABLE `contact` (
    `id`                            BIGINT NOT NULL PRIMARY KEY AUTO_INCREMENT,
    `company_id`                    BIGINT NOT NULL,
    `name`                          VARCHAR(100) NOT NULL,
    `escalation_time`               INTEGER NOT NULL DEFAULT '0',
    `creation_time`                 TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`company_id`) REFERENCES `company`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB;
