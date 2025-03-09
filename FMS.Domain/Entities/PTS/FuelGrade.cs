using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace FMS.Domain.Entities.PTS
{
    /// <summary>
    /// Fuel grade data
    /// </summary>
    public class FuelGrade
    {
        public int Id { get; set; }
        public string? Name { get; set; }
        public double Price { get; set; }
        public double ExpansionCoefficient { get; set; }
    }
}
