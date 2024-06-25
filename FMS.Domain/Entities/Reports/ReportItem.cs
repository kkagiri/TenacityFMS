using FMS.Domain.Entities.Common;
using System;

namespace FMS.Domain.Entities.Reports;

public  class ReportItem
{
    public int Id { get; set; }
    public string? Name { get; set; }
    public string? DisplayName { get; set; }
    public byte[]? LayoutData { get; set; }

 


}

