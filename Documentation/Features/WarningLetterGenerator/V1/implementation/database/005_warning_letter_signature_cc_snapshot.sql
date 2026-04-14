-- =============================================================
-- Migration: Warning Letter Signature CC Snapshot
-- MySQL 5.5/5.6 compatible
-- =============================================================

SET @signatureRequestCcUserIdsExists = (
    SELECT COUNT(*)
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'warning_letter'
      AND COLUMN_NAME = 'SignatureRequestCcUserIds'
);

SET @signatureRequestCcUserIdsSql = IF(
    @signatureRequestCcUserIdsExists = 0,
    'ALTER TABLE warning_letter ADD COLUMN SignatureRequestCcUserIds TEXT NULL AFTER SignatureRequestRecipient',
    'SELECT ''warning_letter.SignatureRequestCcUserIds already exists'''
);
PREPARE stmt FROM @signatureRequestCcUserIdsSql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @signatureRequestCcRecipientsExists = (
    SELECT COUNT(*)
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'warning_letter'
      AND COLUMN_NAME = 'SignatureRequestCcRecipients'
);

SET @signatureRequestCcRecipientsSql = IF(
    @signatureRequestCcRecipientsExists = 0,
    'ALTER TABLE warning_letter ADD COLUMN SignatureRequestCcRecipients TEXT NULL AFTER SignatureRequestCcUserIds',
    'SELECT ''warning_letter.SignatureRequestCcRecipients already exists'''
);
PREPARE stmt FROM @signatureRequestCcRecipientsSql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;