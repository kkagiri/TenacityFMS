using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace FMS.Application.ModelsDTOs.FMS.TankReconciliation
{
    public class TankReconcillationDTO
    {
        public int Id { get; set; }

        public int TankId { get; set; }

        public string TankName { get; set; }

        public string SiteName { get; set; }

        public DateTime ReconciliationDate { get; set; }

        public decimal? OpeningLevel { get; set; }

        public decimal? ClosingLevel { get; set; }

        public decimal? TotalRefills { get; set; }

        public decimal? TotalDeliveries { get; set; }

        public decimal? TotalTransfersIn { get; set; }

        public decimal? TotalTransfersOut { get; set; }



    }
}
