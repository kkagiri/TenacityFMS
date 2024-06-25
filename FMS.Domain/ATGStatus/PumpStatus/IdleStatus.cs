namespace FMS.Domain.ATGStatus.PumpStatus
{
    public class IdleStatus
    {
        public List<int>? Ids { get; set; }
        public List<int>? NozzlesUp { get; set; }

        public List<int>? LastNozzles { get; set; }

        public List<int>? LastTransactions { get; set; }

        public List<decimal>? LastVolumes { get; set; }

        public List<decimal>? LastAmounts { get; set; }

        public List<decimal>? LastPrices { get; set; }


        /// <summary>
        /// array of strings, which mean tag identifiers currently brought to pump reader 
        /// </summary>
        public List<string>? Tags { get; set; }

        /// <summary>
        /// array of strings, which mean presently executed requests on pumps
        /// </summary>
        public List<string>? Requests { get; set; }



    }
}