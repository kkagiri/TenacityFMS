/**
 * File: IssueFollowerSchemaGuard.cs
 * Purpose: Ensures issue follower storage schema exists for follow feature operations
 * Dependencies: GpsdataContext, EF Core
 * Last Modified: 2026-02-10
 *
 * Key Functions:
 * - EnsureTableExistsAsync(): Creates issue_follower table if missing
 */
using System.Threading;
using System.Threading.Tasks;
using FMS.Persistence.DataAccess;
using Microsoft.EntityFrameworkCore;

namespace FMS.Application.Features.IssueTracker.Services
{
    public static class IssueFollowerSchemaGuard
    {
        public static async Task EnsureTableExistsAsync(
            GpsdataContext context,
            CancellationToken cancellationToken = default)
        {
            const string sql = @"
CREATE TABLE IF NOT EXISTS `issue_follower` (
    `id` INT(11) NOT NULL AUTO_INCREMENT,
    `issue_id` INT(11) NOT NULL,
    `user_id` VARCHAR(100) NOT NULL,
    `user_name` VARCHAR(200) NULL,
    `followed_date` DATETIME NOT NULL,
    `notify_by_email` TINYINT(1) NOT NULL DEFAULT 1,
    `notify_by_push` TINYINT(1) NOT NULL DEFAULT 1,
    PRIMARY KEY (`id`),
    INDEX `idx_issue_follower_issue_id` (`issue_id`),
    INDEX `idx_issue_follower_user_id` (`user_id`),
    UNIQUE KEY `uq_issue_follower_issue_user` (`issue_id`, `user_id`),
    CONSTRAINT `fk_issue_follower_issue`
        FOREIGN KEY (`issue_id`)
        REFERENCES `issuetracker` (`id`)
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;";

            await context.Database.ExecuteSqlRawAsync(sql, cancellationToken);
        }
    }
}
