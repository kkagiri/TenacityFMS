namespace FMS.Domain.ATGStatus.PumpStatus
{
    public class FillingStatus
    {
        public List<int>? Ids { get; set; }
        public List<int>? Nozzles { get; set; }
        public List<int>? FuelGradeIds { get; set; }
        public List<string>? FuelGradeNames { get; set; }
        public List<int>? Transactions { get; set; }
        public List<decimal>? Volumes { get; set; }
        public List<decimal>?  Amounts { get; set; }
        public List<decimal>? Prices { get; set; }
        public List<string>? Tags { get; set; }
    }
}