CREATE TABLE `token` (
    `tid`       VARCHAR(255) NOT NULL,
    `sid`       VARCHAR(255) NOT NULL,
    `expire`    BIGINT NOT NULL,
    `action`    VARCHAR(100)
) ENGINE=InnoDB;
