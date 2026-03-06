/**
 * File: RecipientCandidateDto.cs
 * Purpose: DTO for users returned by the recipient-candidates endpoint.
 * Dependencies: System.Collections.Generic
 * Last Modified: 2026-03-05
 *
 * Key Types:
 * - RecipientCandidateDto: Enriched user record with site assignments, department, and admin status.
 * - RecipientCandidateSiteDto: Lightweight site reference (id + name).
 */
using System.Collections.Generic;

namespace FMS.Application.Features.Notification.DTOs
{
    public class RecipientCandidateDto
    {
        public string Id { get; set; } = null!;
        public string? UserName { get; set; }
        public string? Email { get; set; }
        public int? DepartmentId { get; set; }
        public string? DepartmentName { get; set; }
        public bool IsSiteAdmin { get; set; }
        public List<RecipientCandidateSiteDto> AdminOfSites { get; set; } = new();
        public List<RecipientCandidateSiteDto> AssignedSites { get; set; } = new();
    }

    public class RecipientCandidateSiteDto
    {
        public int Id { get; set; }
        public string? Name { get; set; }
    }
}
