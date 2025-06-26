using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace FMS.Domain.Entities;

///
///<summary>
////// This class represent GPS Device .. Should not be confused with PTSdevice
/// </summary>
public partial class Device {
    [Key]
    public int DeviceImei { get; set; }

    public int DeviceMakerId { get; set; }

    public int DevicePhoneNumber { get; set; }

    public int DeviceType { get; set; }

    public virtual Devicetype DeviceTypeNavigation { get; set; } = null!;

    public virtual ICollection<Notification> Notifications { get; set; } = new List<Notification> ();

    public virtual ICollection<Vehicle> Vehicles { get; set; } = new List<Vehicle> ();
}