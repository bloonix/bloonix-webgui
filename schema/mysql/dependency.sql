CREATE TABLE `dependency` (
    `id`                BIGINT NOT NULL PRIMARY KEY AUTO_INCREMENT,
    `host_id`           BIGINT,
    `service_id`        BIGINT,
    `status`            VARCHAR(32) NOT NULL DEFAULT 'CRITICAL,UNKNOWN,INFO',
    `on_host_id`        BIGINT,
    `on_service_id`     BIGINT,
    `on_status`         VARCHAR(32) NOT NULL DEFAULT 'CRITICAL,UNKNOWN,INFO',
    `inherit`           CHAR(1) NOT NULL DEFAULT 0,
    `timezone`          VARCHAR(40) NOT NULL DEFAULT 'Europe/Berlin',
    `timeslice`         TEXT,
    UNIQUE(`service_id`, `on_service_id`),
    FOREIGN KEY (`host_id`) REFERENCES `host`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`service_id`) REFERENCES `service`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`on_host_id`) REFERENCES `host`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`on_service_id`) REFERENCES `service`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE INDEX `dependency_host_id_index` ON `dependency` (`host_id`);
CREATE INDEX `dependency_on_host_id_index` ON `dependency` (`on_host_id`);
CREATE INDEX `dependency_service_id_index` ON `dependency` (`service_id`);
CREATE INDEX `dependency_on_service_id_index` ON `dependency` (`on_service_id`);
CREATE INDEX `dependency_on_status_id_index` ON `dependency` (`on_status`);
