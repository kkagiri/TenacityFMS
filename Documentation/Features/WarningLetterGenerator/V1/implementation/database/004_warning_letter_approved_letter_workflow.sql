-- =============================================================
-- Migration: Warning Letter Approved Letter Workflow
-- MySQL 5.5/5.6 compatible
-- =============================================================

SET @approveLetterFileNameExists = (
    SELECT COUNT(*)
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'warning_letter'
      AND COLUMN_NAME = 'ApproveLetterFileName'
);

SET @approveLetterFileNameSql = IF(
    @approveLetterFileNameExists = 0,
    'ALTER TABLE warning_letter ADD COLUMN ApproveLetterFileName VARCHAR(255) NULL AFTER SignatureRequestedBy',
    'SELECT ''warning_letter.ApproveLetterFileName already exists'''
);
PREPARE stmt FROM @approveLetterFileNameSql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @approveLetterStoredFileNameExists = (
    SELECT COUNT(*)
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'warning_letter'
      AND COLUMN_NAME = 'ApproveLetterStoredFileName'
);

SET @approveLetterStoredFileNameSql = IF(
    @approveLetterStoredFileNameExists = 0,
    'ALTER TABLE warning_letter ADD COLUMN ApproveLetterStoredFileName VARCHAR(255) NULL AFTER ApproveLetterFileName',
    'SELECT ''warning_letter.ApproveLetterStoredFileName already exists'''
);
PREPARE stmt FROM @approveLetterStoredFileNameSql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @approveLetterFilePathExists = (
    SELECT COUNT(*)
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'warning_letter'
      AND COLUMN_NAME = 'ApproveLetterFilePath'
);

SET @approveLetterFilePathSql = IF(
    @approveLetterFilePathExists = 0,
    'ALTER TABLE warning_letter ADD COLUMN ApproveLetterFilePath VARCHAR(500) NULL AFTER ApproveLetterStoredFileName',
    'SELECT ''warning_letter.ApproveLetterFilePath already exists'''
);
PREPARE stmt FROM @approveLetterFilePathSql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @approveLetterContentTypeExists = (
    SELECT COUNT(*)
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'warning_letter'
      AND COLUMN_NAME = 'ApproveLetterContentType'
);

SET @approveLetterContentTypeSql = IF(
    @approveLetterContentTypeExists = 0,
    'ALTER TABLE warning_letter ADD COLUMN ApproveLetterContentType VARCHAR(100) NULL AFTER ApproveLetterFilePath',
    'SELECT ''warning_letter.ApproveLetterContentType already exists'''
);
PREPARE stmt FROM @approveLetterContentTypeSql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @approveLetterFileSizeExists = (
    SELECT COUNT(*)
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'warning_letter'
      AND COLUMN_NAME = 'ApproveLetterFileSize'
);

SET @approveLetterFileSizeSql = IF(
    @approveLetterFileSizeExists = 0,
    'ALTER TABLE warning_letter ADD COLUMN ApproveLetterFileSize BIGINT NULL AFTER ApproveLetterContentType',
    'SELECT ''warning_letter.ApproveLetterFileSize already exists'''
);
PREPARE stmt FROM @approveLetterFileSizeSql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @approveLetterUploadedAtExists = (
    SELECT COUNT(*)
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'warning_letter'
      AND COLUMN_NAME = 'ApproveLetterUploadedAt'
);

SET @approveLetterUploadedAtSql = IF(
    @approveLetterUploadedAtExists = 0,
    'ALTER TABLE warning_letter ADD COLUMN ApproveLetterUploadedAt DATETIME NULL AFTER ApproveLetterFileSize',
    'SELECT ''warning_letter.ApproveLetterUploadedAt already exists'''
);
PREPARE stmt FROM @approveLetterUploadedAtSql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @approveLetterUploadedByExists = (
    SELECT COUNT(*)
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'warning_letter'
      AND COLUMN_NAME = 'ApproveLetterUploadedBy'
);

SET @approveLetterUploadedBySql = IF(
    @approveLetterUploadedByExists = 0,
    'ALTER TABLE warning_letter ADD COLUMN ApproveLetterUploadedBy VARCHAR(100) NULL AFTER ApproveLetterUploadedAt',
    'SELECT ''warning_letter.ApproveLetterUploadedBy already exists'''
);
PREPARE stmt FROM @approveLetterUploadedBySql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;