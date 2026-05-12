using System.ComponentModel.DataAnnotations;

namespace FMS.Application.Features.FuelTagManagement.FuelingTags.DTOs;

public class FuelTagDTO {
    public int Id { get; set; }

    [Required]
    public string Name { get; set; } = string.Empty;
    public bool? IsEnabled { get; set; }
    public int VehicleId { get; set; }
    public int? FuelRuleSetId { get; set; } = 1;

    public bool IsMaster { get; set; }
}