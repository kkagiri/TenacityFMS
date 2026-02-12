/**
 * File: IssueNotesSchemaGuard.cs
 * Purpose: Ensures CompletionNotes and ClosingNotes columns exist on the issuetracker table
 * Dependencies: GpsdataContext, EF Core
 * Last Modified: 2026-02-12
 *
 * Key Functions:
 * - EnsureColumnsExistAsync(): Adds CompletionNotes and ClosingNotes columns if missing
 */
using System;
using System.Threading;
using System.Threading.Tasks;
using FMS.Persistence.DataAccess;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Features.IssueTracker.Services
{
    public static class IssueNotesSchemaGuard
    {
        private static bool _columnsVerified = false;

        public static async Task EnsureColumnsExistAsync(
            GpsdataContext context,
            ILogger? logger = null,
            CancellationToken cancellationToken = default)
        {
            if (_columnsVerified) return;

            try
            {
                const string sql = @"
SET @dbName = DATABASE();

SET @colExists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = @dbName AND TABLE_NAME = 'issuetracker' AND COLUMN_NAME = 'CompletionNotes');
SET @stmt = IF(@colExists = 0,
    'ALTER TABLE `issuetracker` ADD COLUMN `CompletionNotes` VARCHAR(2000) NULL DEFAULT NULL',
    'SELECT 1');
PREPARE addCol FROM @stmt;
EXECUTE addCol;
DEALLOCATE PREPARE addCol;

SET @colExists2 = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = @dbName AND TABLE_NAME = 'issuetracker' AND COLUMN_NAME = 'ClosingNotes');
SET @stmt2 = IF(@colExists2 = 0,
    'ALTER TABLE `issuetracker` ADD COLUMN `ClosingNotes` VARCHAR(2000) NULL DEFAULT NULL',
    'SELECT 1');
PREPARE addCol2 FROM @stmt2;
EXECUTE addCol2;
DEALLOCATE PREPARE addCol2;
";

                await context.Database.ExecuteSqlRawAsync(sql, cancellationToken);
                _columnsVerified = true;
                logger?.LogInformation("IssueNotesSchemaGuard: CompletionNotes and ClosingNotes columns verified/created.");
            }
            catch (Exception ex)
            {
                logger?.LogWarning(ex, "IssueNotesSchemaGuard: Failed to verify/create notes columns. They may already exist.");
                // Don't throw — the columns may already exist
                _columnsVerified = true;
            }
        }
    }
}
