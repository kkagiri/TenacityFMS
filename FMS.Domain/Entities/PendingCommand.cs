namespace FMS.Domain.Entities;


public partial class PendingCommand
{
    public int Id { get; set; }
    /// <summary>
    /// PTS ID Device
    /// </summary>
    public string PTSDeviceId { get; set; } = string.Empty;
    public string CommandType { get; set; } = string.Empty;
    //CommandData stored as JSON string
    public string CommandDataJson { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;


    public virtual ICollection<PtsDeviceCommand> PtsDeviceCommands { get; set; } = new List<PtsDeviceCommand>();

    public virtual Ptsdevice Ptsdevice { get; set; } = null!;

}

