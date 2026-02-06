-- ============================================================================
-- Script 004: Fix self-referencing ParentId on permission ID 1 (ATG)
-- Purpose: Permission ID 1 ("ATG") has ParentId = 1 (points to itself),
--          causing infinite recursion in DevExtreme TreeList recursive selection.
--          Fix: Set ParentId to NULL to make it a proper root module node.
-- Date: 2026-02-06
-- ============================================================================

-- Verify the issue first
SELECT Id, Name, ParentId FROM permissions WHERE Id = ParentId;

-- Fix: Set self-referencing ParentId to NULL
UPDATE permissions SET ParentId = NULL WHERE Id = 1 AND ParentId = 1;

-- Verify the fix
SELECT Id, Name, ParentId FROM permissions WHERE Id = 1;
