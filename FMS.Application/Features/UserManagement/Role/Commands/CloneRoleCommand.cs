/**
 * File: CloneRoleCommand.cs
 * Purpose: CQRS command to clone an existing role with its permissions and navigation items.
 * Dependencies: MediatR, FMSResponse
 * Last Modified: 2026-02-24
 *
 * Key Functions:
 * - CloneRoleCommand: Defines the clone request (source role ID + new name/description)
 */
using FMS.Application.Common;
using MediatR;

namespace FMS.Application.Features.UserManagement.Role.Commands
{
    /// <summary>
    /// Clones an existing role, copying its permissions and navigation assignments.
    /// Users are NOT copied — the new role starts with zero users assigned.
    /// </summary>
    public record CloneRoleCommand(
        string SourceRoleId,
        string NewRoleName,
        string? NewDescription = null
    ) : IRequest<FMSResponse<CloneRoleResult>>;

    public class CloneRoleResult
    {
        public string RoleId { get; set; } = string.Empty;
        public string RoleName { get; set; } = string.Empty;
        public int PermissionsCopied { get; set; }
        public int NavigationsCopied { get; set; }
    }
}
