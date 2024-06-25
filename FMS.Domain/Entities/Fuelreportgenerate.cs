using System;
using System.Collections.Generic;

namespace FMS.Domain.Entities;

public partial class Fuelreportgenerate
{
    public int Id { get; set; }

    public DateTime CreatedDate { get; set; }

    public DateTime? ModifiedDate { get; set; }

    public DateTime? ApprovedDate { get; set; }

    public string? ApprovedBy { get; set; }

    public string CreatedBy { get; set; } = null!;

    public string? ModfifiedBy { get; set; }
}
