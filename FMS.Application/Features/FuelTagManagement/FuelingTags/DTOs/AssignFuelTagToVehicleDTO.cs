using System.ComponentModel.DataAnnotations;

namespace FMS.Application.Features.FuelTagManagement.FuelingTags.DTOs;

public class AssignFuelTagToVehicleDTO {
    [Required]
    public int TagId { get; set; }

    [Required]
    public int VehicleId { get; set; }
}