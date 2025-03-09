namespace FMS.Application.ModelsDTOs.PTS
{
    public class ParameterDTO
    {
        // Identifier of parameter object: "PTS", "Pump", or "Probe"
        public string Device { get; set; }

        // Device number; required for "Pump" or "Probe"
        public int? Number { get; set; }

        // Parameter address
        public int Address { get; set; }

        // Parameter value (string, up to 8 hexadecimal digits)
        public string Value { get; set; }
    }
}