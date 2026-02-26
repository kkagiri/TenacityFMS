/**
 * File: SiteInfoDto.cs
 * Purpose: Lightweight site reference used in RecipientCandidateDto
 * Dependencies: None
 * Last Modified: 2026-02-25
 */
namespace FMS.Application.Features.Notification.DTOs.RecipientRules
{
    public class SiteInfoDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = null!;
    }
}
