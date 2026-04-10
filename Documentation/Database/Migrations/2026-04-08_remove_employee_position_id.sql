-- Align employee position schema with the production model.
-- MySQL 5.5 / 5.6 compatible.
-- Employee position stays in employee.Trade as text; employee_position is lookup/master data only.

SET @schema_name = DATABASE();

SELECT COUNT(*) INTO @employee_has_position_id
FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA = @schema_name
    AND TABLE_NAME = 'employee'
    AND COLUMN_NAME = 'position_id';

SET @sql_backfill_trade = IF(
        @employee_has_position_id > 0,
        'UPDATE employee employee_row INNER JOIN employee_position position_row ON employee_row.position_id = position_row.id SET employee_row.Trade = CASE WHEN employee_row.Trade IS NULL OR TRIM(employee_row.Trade) = '''' THEN position_row.name ELSE employee_row.Trade END',
        'SELECT ''employee.position_id not present; skipping Trade backfill'''
);
PREPARE stmt_backfill_trade FROM @sql_backfill_trade;
EXECUTE stmt_backfill_trade;
DEALLOCATE PREPARE stmt_backfill_trade;

SELECT COUNT(*) INTO @employee_has_position_fk
FROM information_schema.TABLE_CONSTRAINTS
WHERE TABLE_SCHEMA = @schema_name
    AND TABLE_NAME = 'employee'
    AND CONSTRAINT_NAME = 'fk_employee_position_id'
    AND CONSTRAINT_TYPE = 'FOREIGN KEY';

SET @sql_drop_position_fk = IF(
        @employee_has_position_fk > 0,
        'ALTER TABLE employee DROP FOREIGN KEY fk_employee_position_id',
        'SELECT ''fk_employee_position_id not present'''
);
PREPARE stmt_drop_position_fk FROM @sql_drop_position_fk;
EXECUTE stmt_drop_position_fk;
DEALLOCATE PREPARE stmt_drop_position_fk;

SELECT COUNT(*) INTO @employee_has_position_index
FROM information_schema.STATISTICS
WHERE TABLE_SCHEMA = @schema_name
    AND TABLE_NAME = 'employee'
    AND INDEX_NAME = 'ix_employee_position_id';

SET @sql_drop_position_index = IF(
        @employee_has_position_index > 0,
        'ALTER TABLE employee DROP INDEX ix_employee_position_id',
        'SELECT ''ix_employee_position_id not present'''
);
PREPARE stmt_drop_position_index FROM @sql_drop_position_index;
EXECUTE stmt_drop_position_index;
DEALLOCATE PREPARE stmt_drop_position_index;

SET @sql_drop_position_column = IF(
        @employee_has_position_id > 0,
        'ALTER TABLE employee DROP COLUMN position_id',
        'SELECT ''employee.position_id not present'''
);
PREPARE stmt_drop_position_column FROM @sql_drop_position_column;
EXECUTE stmt_drop_position_column;
DEALLOCATE PREPARE stmt_drop_position_column;