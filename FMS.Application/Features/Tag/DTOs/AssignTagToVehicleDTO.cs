using System.ComponentModel.DataAnnotations;

namespace FMS.Application.ModelsDTOs.FMS.Tag;

public class AssignTagToVehicleDTO
{
    [Required]
    public int TagId { get; set; }

    [Required]
    public int VehicleId { get; set; }
}