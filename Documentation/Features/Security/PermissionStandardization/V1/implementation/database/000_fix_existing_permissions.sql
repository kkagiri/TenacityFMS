-- ============================================================
-- FMS Permission Standardization - Phase 5: Database Migration
-- ============================================================
-- File: 000_fix_existing_permissions.sql
-- Purpose: Fix data quality issues in existing permissions table
--
-- ⚠️ DO NOT RUN AGAINST LIVE DB WITHOUT REVIEW
-- ⚠️ Test in development environment first
-- ⚠️ Back up the permissions table before running
--
-- Issues Fixed:
--   1. Tab characters in _Update_Delivery and _Delete_Delivery names
--   2. These tab chars cause silent permission check failures
-- ============================================================

-- Step 1: Verify the issue exists (run this SELECT first)
SELECT Id, Name, HEX(Name) as HexName, LENGTH(Name) as NameLength
FROM permissions
WHERE Id IN (71, 72);

-- Expected output should show:
--   Id 71: Name contains \t (0x09) at end, length > 16
--   Id 72: Name contains \t (0x09) at end, length > 16

-- Step 2: Fix the tab characters
UPDATE permissions SET Name = '_Update_Delivery' WHERE Id = 71;
UPDATE permissions SET Name = '_Delete_Delivery' WHERE Id = 72;

-- Step 3: Verify the fix
SELECT Id, Name, HEX(Name) as HexName, LENGTH(Name) as NameLength
FROM permissions
WHERE Id IN (71, 72);

-- Expected output:
--   Id 71: _Update_Delivery (length=16)
--   Id 72: _Delete_Delivery (length=16)
