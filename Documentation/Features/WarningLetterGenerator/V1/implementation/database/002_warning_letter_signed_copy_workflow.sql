-- =============================================================
-- Migration: Warning Letter Signed Copy Workflow
-- MySQL 5.5/5.6 compatible
-- =============================================================

SET @signatureRequestRecipientUserIdExists = (
    SELECT COUNT(*)
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'warning_letter'
      AND COLUMN_NAME = 'SignatureRequestRecipientUserId'
);

SET @signatureRequestRecipientUserIdSql = IF(
    @signatureRequestRecipientUserIdExists = 0,
    'ALTER TABLE warning_letter ADD COLUMN SignatureRequestRecipientUserId VARCHAR(100) NULL AFTER EmailRecipient',
    'SELECT ''warning_letter.SignatureRequestRecipientUserId already exists'''
);
PREPARE stmt FROM @signatureRequestRecipientUserIdSql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @signatureRequestRecipientExists = (
    SELECT COUNT(*)
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'warning_letter'
      AND COLUMN_NAME = 'SignatureRequestRecipient'
);

SET @signatureRequestRecipientSql = IF(
    @signatureRequestRecipientExists = 0,
    'ALTER TABLE warning_letter ADD COLUMN SignatureRequestRecipient VARCHAR(255) NULL AFTER SignatureRequestRecipientUserId',
    'SELECT ''warning_letter.SignatureRequestRecipient already exists'''
);
PREPARE stmt FROM @signatureRequestRecipientSql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @signatureRequestedAtExists = (
    SELECT COUNT(*)
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'warning_letter'
      AND COLUMN_NAME = 'SignatureRequestedAt'
);

SET @signatureRequestedAtSql = IF(
    @signatureRequestedAtExists = 0,
    'ALTER TABLE warning_letter ADD COLUMN SignatureRequestedAt DATETIME NULL AFTER SignatureRequestRecipient',
    'SELECT ''warning_letter.SignatureRequestedAt already exists'''
);
PREPARE stmt FROM @signatureRequestedAtSql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @signatureRequestedByExists = (
    SELECT COUNT(*)
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'warning_letter'
      AND COLUMN_NAME = 'SignatureRequestedBy'
);

SET @signatureRequestedBySql = IF(
    @signatureRequestedByExists = 0,
    'ALTER TABLE warning_letter ADD COLUMN SignatureRequestedBy VARCHAR(100) NULL AFTER SignatureRequestedAt',
    'SELECT ''warning_letter.SignatureRequestedBy already exists'''
);
PREPARE stmt FROM @signatureRequestedBySql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @signedCopyFileNameExists = (
    SELECT COUNT(*)
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'warning_letter'
      AND COLUMN_NAME = 'SignedCopyFileName'
);

SET @signedCopyFileNameSql = IF(
    @signedCopyFileNameExists = 0,
    'ALTER TABLE warning_letter ADD COLUMN SignedCopyFileName VARCHAR(255) NULL AFTER SignatureRequestedBy',
    'SELECT ''warning_letter.SignedCopyFileName already exists'''
);
PREPARE stmt FROM @signedCopyFileNameSql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @signedCopyStoredFileNameExists = (
    SELECT COUNT(*)
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'warning_letter'
      AND COLUMN_NAME = 'SignedCopyStoredFileName'
);

SET @signedCopyStoredFileNameSql = IF(
    @signedCopyStoredFileNameExists = 0,
    'ALTER TABLE warning_letter ADD COLUMN SignedCopyStoredFileName VARCHAR(255) NULL AFTER SignedCopyFileName',
    'SELECT ''warning_letter.SignedCopyStoredFileName already exists'''
);
PREPARE stmt FROM @signedCopyStoredFileNameSql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @signedCopyFilePathExists = (
    SELECT COUNT(*)
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'warning_letter'
      AND COLUMN_NAME = 'SignedCopyFilePath'
);

SET @signedCopyFilePathSql = IF(
    @signedCopyFilePathExists = 0,
    'ALTER TABLE warning_letter ADD COLUMN SignedCopyFilePath VARCHAR(500) NULL AFTER SignedCopyStoredFileName',
    'SELECT ''warning_letter.SignedCopyFilePath already exists'''
);
PREPARE stmt FROM @signedCopyFilePathSql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @signedCopyContentTypeExists = (
    SELECT COUNT(*)
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'warning_letter'
      AND COLUMN_NAME = 'SignedCopyContentType'
);

SET @signedCopyContentTypeSql = IF(
    @signedCopyContentTypeExists = 0,
    'ALTER TABLE warning_letter ADD COLUMN SignedCopyContentType VARCHAR(100) NULL AFTER SignedCopyFilePath',
    'SELECT ''warning_letter.SignedCopyContentType already exists'''
);
PREPARE stmt FROM @signedCopyContentTypeSql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @signedCopyFileSizeExists = (
    SELECT COUNT(*)
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'warning_letter'
      AND COLUMN_NAME = 'SignedCopyFileSize'
);

SET @signedCopyFileSizeSql = IF(
    @signedCopyFileSizeExists = 0,
    'ALTER TABLE warning_letter ADD COLUMN SignedCopyFileSize BIGINT NULL AFTER SignedCopyContentType',
    'SELECT ''warning_letter.SignedCopyFileSize already exists'''
);
PREPARE stmt FROM @signedCopyFileSizeSql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @signedCopyUploadedAtExists = (
    SELECT COUNT(*)
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'warning_letter'
      AND COLUMN_NAME = 'SignedCopyUploadedAt'
);

SET @signedCopyUploadedAtSql = IF(
    @signedCopyUploadedAtExists = 0,
    'ALTER TABLE warning_letter ADD COLUMN SignedCopyUploadedAt DATETIME NULL AFTER SignedCopyFileSize',
    'SELECT ''warning_letter.SignedCopyUploadedAt already exists'''
);
PREPARE stmt FROM @signedCopyUploadedAtSql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @signedCopyUploadedByExists = (
    SELECT COUNT(*)
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'warning_letter'
      AND COLUMN_NAME = 'SignedCopyUploadedBy'
);

SET @signedCopyUploadedBySql = IF(
    @signedCopyUploadedByExists = 0,
    'ALTER TABLE warning_letter ADD COLUMN SignedCopyUploadedBy VARCHAR(100) NULL AFTER SignedCopyUploadedAt',
    'SELECT ''warning_letter.SignedCopyUploadedBy already exists'''
);
PREPARE stmt FROM @signedCopyUploadedBySql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;