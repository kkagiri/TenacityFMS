/**
 * File: RecipientCandidateDto.cs
 * Purpose: DTO returned by the recipient-candidates API endpoint.
 *          Contains user info enriched with site/department data for the dual-pane DataGrid.
 * Dependencies: None
 * Last Modified: 2026-02-25
 *
 * Key Classes:
 * - RecipientCandidateDto: Flat user record with site assignments and department info
 */
using System.Collections.Generic;

namespace FMS.Application.Features.Notification.DTOs.RecipientRules
{
    public class RecipientCandidateDto
    {
        public string Id { get; set; } = null!;
        public string? UserName { get; set; }
        public string? Email { get; set; }
        public int? DepartmentId { get; set; }
        public string? DepartmentName { get; set; }

        /// <summary>
        /// Whether this user is the SiteAdministrator for any site
        /// </summary>
        public bool IsSiteAdmin { get; set; }

        /// <summary>
        /// Sites where this user is the administrator
        /// </summary>
        public List<SiteInfoDto> AdminOfSites { get; set; } = new();

        /// <summary>
        /// All sites this user is assigned to via UserSites
        /// </summary>
        public List<SiteInfoDto> AssignedSites { get; set; } = new();
    }
}
