using System.ComponentModel;

namespace FMS.Domain.Entities.Features.FuelRule
{
    public class FuelingContext
    {
        public Vehicle Vehicle { get; set; }

        public Tag? Tag { get; set; }
        public string? TagName { get; set; }

        public decimal FuelTakenToday { get; set; }

        public decimal FuelTakenThisMonth { get; set; }

        public int VehicleType { get; set; }

        public int NoOfRefillToday { get; set; }

        public int NoOfRefillThisWeek { get; set; }

        public int NoOfRefillThisMonth { get; set; }





        public int SiteId { get; set; }


    }
}