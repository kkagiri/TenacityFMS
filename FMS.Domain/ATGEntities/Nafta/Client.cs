using System;
using System.Collections.Generic;

namespace FMS.Domain.ATGEntities.Nafta;

public partial class Client
{
    public int Id { get; set; }

    public string? Name { get; set; }

    public string? Address { get; set; }

    public string? PhoneNumber { get; set; }

    public int? ClientType { get; set; }

    public string? TaxNumber { get; set; }

    public string? Certificate { get; set; }

    public string? Createtime { get; set; }
}
