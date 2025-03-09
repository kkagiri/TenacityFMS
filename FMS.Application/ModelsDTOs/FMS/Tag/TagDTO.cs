using System.ComponentModel.DataAnnotations;

namespace FMS.Application.ModelsDTOs.FMS.Tag;

public class TagDTO
{
    public int Id { get; set; }

    [Required]
    public string Name { get; set; } = string.Empty;
    public bool? IsEnabled { get; set; }
    public int VehicleId { get; set; }
    public int? FuelRuleSetId { get; set; }
}