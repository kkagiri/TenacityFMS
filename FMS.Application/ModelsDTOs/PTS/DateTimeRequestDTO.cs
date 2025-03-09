namespace FMS.Application.ModelsDTOs.PTS
{
    public class DateTimeRequestDTO
    {
        public string DateTime { get; set; }
        public bool AutoSynchronize { get; set; }
        public int UTCOffset { get; set; }
    }
}