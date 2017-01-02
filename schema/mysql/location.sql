CREATE TABLE `location` (
    `id`           BIGINT NOT NULL PRIMARY KEY AUTO_INCREMENT,
    `ipaddr`       VARCHAR(159) NOT NULL,
    `port`         SMALLINT NOT NULL DEFAULT '5464',
    `hostname`     VARCHAR(50) NOT NULL,
    `city`         VARCHAR(50) NOT NULL,
    `country`      VARCHAR(50) NOT NULL,
    `continent`    VARCHAR(13) NOT NULL,
    `coordinates`  VARCHAR(500) NOT NULL DEFAULT '0,0',
    `description`  VARCHAR(500)
) ENGINE=InnoDB;
