using System;
using System.Collections.Generic;

namespace FMS.Domain.ATGEntities.Nafta;

public partial class Petrolstationinfo
{
    public string PetrolStationName { get; set; } = null!;

    public string? CompanyName { get; set; }

    public string? CompanyIdCode { get; set; }

    public string? RegistrationCode { get; set; }

    public string? ManagerName { get; set; }

    public string? PetrolStationIdCode { get; set; }

    public string? PetrolStationAddress { get; set; }
}
