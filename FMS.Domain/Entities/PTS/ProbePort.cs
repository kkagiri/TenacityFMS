namespace FMS.Domain.Entities.PTS
{
    /// <summary>
    /// ProbePort class
    /// </summary>
    public class ProbePort
    {
        public string? Id { get; set; }
        public int Protocol { get; set; }
        public int BaudRate { get; set; }
    }
}