CREATE TABLE `timeperiod` (
    `id`            BIGINT NOT NULL PRIMARY KEY AUTO_INCREMENT,
    `company_id`    BIGINT NOT NULL,
    `name`          VARCHAR(40) NOT NULL,
    `description`   VARCHAR(100),
    FOREIGN KEY (`company_id`) REFERENCES `company`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB;
