namespace FMS.Domain.Entities.PTS
{
    /// <summary>
    /// Probe class
    /// </summary>
    public class Probe
    {
        public int Id { get; set; }
        public string? Port { get; set; }
        public int Address { get; set; }
    }
}