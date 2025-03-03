namespace FMS.Application.ModelsDTOs.PTS
{
    public class DailyProcessingTimeDTO
    {
        public string Time { get; set; } // Format: hh:mm
        public bool BackupConfiguration { get; set; }
    }
}