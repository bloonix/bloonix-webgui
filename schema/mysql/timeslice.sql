CREATE TABLE `timeslice` (
    `id`            BIGINT NOT NULL PRIMARY KEY AUTO_INCREMENT,
    `timeperiod_id` BIGINT NOT NULL,
    `timeslice`     VARCHAR(200) NOT NULL,
    FOREIGN KEY (`timeperiod_id`) REFERENCES `timeperiod`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB;
