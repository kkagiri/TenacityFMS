namespace FMS.Application.Features.PTS {
    public class DateTimeResponseDTO {
        public string DateTime { get; set; }
        public bool AutoSynchronize { get; set; }
        public int UTCOffset { get; set; }
    }
}