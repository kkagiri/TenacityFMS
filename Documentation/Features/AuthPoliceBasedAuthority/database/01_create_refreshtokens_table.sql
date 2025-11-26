-- =====================================================
-- RefreshTokens Table Creation Script for MySQL 5.5.6
-- =====================================================
-- Description: Creates the refreshtokens table for storing JWT refresh tokens
-- Author: System
-- Date: 2025-11-26
-- MySQL Version: 5.5.6+
-- =====================================================

-- Check if table exists and drop if needed (optional - comment out for production)
-- DROP TABLE IF EXISTS `refreshtokens`;

-- Create refreshtokens table
CREATE TABLE IF NOT EXISTS `refreshtokens` (
    `Id` INT NOT NULL AUTO_INCREMENT,

    -- Core token information
    `token` VARCHAR(500) NOT NULL COMMENT 'The refresh token string (cryptographically secure random value)',
    `user_id` VARCHAR(450) NOT NULL COMMENT 'User ID that owns this refresh token',

    -- Timestamps
    `created_at` DATETIME NOT NULL COMMENT 'When this refresh token was created',
    `expires_at` DATETIME NOT NULL COMMENT 'When this refresh token expires (typically 30 days)',

    -- Revocation tracking
    `is_revoked` TINYINT(1) NOT NULL DEFAULT 0 COMMENT 'Whether this refresh token has been revoked',
    `revoked_at` DATETIME NULL DEFAULT NULL COMMENT 'When this token was revoked (if applicable)',
    `revocation_reason` VARCHAR(200) NULL DEFAULT NULL COMMENT 'Reason for revocation (e.g., User logout, Security breach)',

    -- IP tracking
    `created_by_ip` VARCHAR(50) NULL DEFAULT NULL COMMENT 'IP address from which this token was created',
    `last_used_at` DATETIME NULL DEFAULT NULL COMMENT 'When this token was last used to refresh an access token',
    `last_used_by_ip` VARCHAR(50) NULL DEFAULT NULL COMMENT 'IP address from which this token was last used',

    -- Token rotation tracking
    `replaced_by_token_id` INT NULL DEFAULT NULL COMMENT 'For token rotation: ID of the token that replaced this one',

    -- Primary Key
    PRIMARY KEY (`Id`),

    -- Indexes for performance
    UNIQUE INDEX `idx_refreshtoken_token` (`token` ASC) COMMENT 'Unique index for fast token lookup',
    INDEX `idx_refreshtoken_userid` (`user_id` ASC) COMMENT 'Index for fast user token lookups',
    INDEX `idx_refreshtoken_expiresat` (`expires_at` ASC) COMMENT 'Index for efficient cleanup of expired tokens',
    INDEX `idx_refreshtoken_active` (`user_id` ASC, `is_revoked` ASC, `expires_at` ASC) COMMENT 'Composite index for finding active tokens',

    -- Foreign Keys
    CONSTRAINT `FK_refreshtokens_AspNetUsers_user_id`
        FOREIGN KEY (`user_id`)
        REFERENCES `aspnetusers` (`Id`)
        ON DELETE CASCADE
        ON UPDATE NO ACTION,

    CONSTRAINT `FK_refreshtokens_refreshtokens_replaced_by_token_id`
        FOREIGN KEY (`replaced_by_token_id`)
        REFERENCES `refreshtokens` (`Id`)
        ON DELETE RESTRICT
        ON UPDATE NO ACTION

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Stores JWT refresh tokens for long-lived user sessions';

-- =====================================================
-- Verification Query
-- =====================================================
-- Run this to verify the table was created successfully
-- DESCRIBE `refreshtokens`;

-- =====================================================
-- Sample Queries for Testing
-- =====================================================

-- Find all active tokens for a user
-- SELECT * FROM `refreshtokens`
-- WHERE `user_id` = 'USER_ID_HERE'
-- AND `is_revoked` = 0
-- AND `expires_at` > NOW();

-- Count expired tokens that need cleanup
-- SELECT COUNT(*) as expired_tokens
-- FROM `refreshtokens`
-- WHERE `expires_at` < NOW();

-- Find tokens created from a specific IP
-- SELECT * FROM `refreshtokens`
-- WHERE `created_by_ip` = 'IP_ADDRESS_HERE';

-- =====================================================
-- Cleanup Script (Run periodically)
-- =====================================================
-- Delete expired tokens older than 30 days
-- DELETE FROM `refreshtokens`
-- WHERE `expires_at` < DATE_SUB(NOW(), INTERVAL 30 DAY);

-- =====================================================
-- Rollback Script (Use with caution)
-- =====================================================
-- DROP TABLE IF EXISTS `refreshtokens`;
