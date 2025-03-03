namespace FMS.Application.ModelsDTOs.PTS
{
    public class PtsNetworkSettingsDTO
    {
        public int[] IpAddress { get; set; }
        public int[] NetMask { get; set; }
        public int[] Gateway { get; set; }
        public int HttpPort { get; set; }
        public int HttpsPort { get; set; }
        public int[] Dns1 { get; set; }
        public int[] Dns2 { get; set; }
    }
}