using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace FMS.Application.Features.FMS.Supplier {
    public class SupplierDTO {
        public int Id { get; set; }
        public string Name { get; set; } = null!;
        public string? Contacts { get; set; }
    }
}