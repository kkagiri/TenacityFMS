using System;
using System.Collections.Generic;

namespace FMS.Domain.Entities;

public partial class UserActivity
{

    public int Id { get; set; }

    public string UserId { get; set; } = null!;

    public string Action { get; set; } = null!;

    public string? Controller { get; set; }

    public string? ActionName { get; set; }

    public string? Parameters { get; set; }

    public string? IpAddress { get; set; }

    public DateTime Timestamp { get; set; }

   public virtual User User { get; set; } = null!;
}
