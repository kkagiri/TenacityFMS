using System;
using System.Collections.Generic;

namespace FMS.Domain.ATGEntities.Nafta;

public partial class Operator
{
    public int Operatorid { get; set; }

    public int? Orderno { get; set; }

    public string? Name { get; set; }

    public string? Pswrd { get; set; }

    public long? Permissions { get; set; }

    public string? Createtime { get; set; }

    public string? Idcard { get; set; }
}
