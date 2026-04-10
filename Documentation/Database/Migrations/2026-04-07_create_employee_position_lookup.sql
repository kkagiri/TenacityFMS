-- Employee position lookup master data
-- MySQL 5.5 / 5.6 compatible
-- Employee records continue storing the selected value in employee.Trade.
-- Do not add employee.position_id in the current schema.

CREATE TABLE IF NOT EXISTS employee_position (
    id INT NOT NULL AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    description VARCHAR(255) NULL,
    sort_order INT NOT NULL DEFAULT 0,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    date_created DATETIME NULL,
    date_modified DATETIME NULL,
    PRIMARY KEY (id),
    UNIQUE KEY ux_employee_position_name (name),
    KEY ix_employee_position_is_active (is_active),
    KEY ix_employee_position_sort_order (sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO employee_position (name, description, sort_order, is_active, date_created, date_modified)
VALUES
    ('Tipper Driver', 'Driver assigned to tipper trucks.', 10, 1, UTC_TIMESTAMP(), UTC_TIMESTAMP()),
    ('Pickup Driver', 'Driver assigned to pickup vehicles.', 20, 1, UTC_TIMESTAMP(), UTC_TIMESTAMP()),
    ('Operator', 'Heavy equipment or machinery operator.', 30, 1, UTC_TIMESTAMP(), UTC_TIMESTAMP()),
    ('Mechanic', 'Workshop or field mechanic.', 40, 1, UTC_TIMESTAMP(), UTC_TIMESTAMP()),
    ('Supervisor', 'Operational or transport supervisor.', 50, 1, UTC_TIMESTAMP(), UTC_TIMESTAMP())
ON DUPLICATE KEY UPDATE
    description = VALUES(description),
    sort_order = VALUES(sort_order),
    is_active = VALUES(is_active),
    date_modified = VALUES(date_modified);