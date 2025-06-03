using System.ComponentModel.DataAnnotations;

namespace FMS.Application.Models
{
    public class CreateSiteDTO
    {
        [Required(ErrorMessage = "Site name is required")]
        [MaxLength(255, ErrorMessage = "Site name must not exceed 255 characters")]
        public string Name { get; set; } = null!;
    }
}