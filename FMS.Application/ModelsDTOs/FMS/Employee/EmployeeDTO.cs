#nullable disable
using FMS;
using FMS.Application.ModelsDTOs.FMS.Vehicle;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Text.Json.Serialization;
using System.Threading.Tasks;

namespace FMS.Application.ModelsDTOs.FMS.Employee
{
    public class EmployeeDto
    {

        [JsonPropertyName("id")]
        public int Id { get; set; }

        [JsonPropertyName("fullName")]
        public string FullName { get; set; }

        [JsonPropertyName("employeeWorkNo")]
        public string EmployeeWorkNo { get; set; } = string.Empty;

        [JsonPropertyName("employeephoneNumber")]
        public string EmployeephoneNumber { get; set; } = string.Empty;



        [JsonPropertyName("employeestatus")]
        public string Employeestatus { get; set; } = "Active";

        [JsonPropertyName("siteId")]
        public int? SiteId { get; set; }

        [JsonPropertyName("vehicles")]
        public ICollection<int> Vehicles { get; set; } = new List<int>();
        [JsonPropertyName("dateCreated")]
        public DateTime? DateCreated { get; set; } = DateTime.Now;

        [JsonPropertyName("dateModified")]
        public DateTime? DateModified { get; set; }

        private DateTime? _dateCreated;
        [JsonPropertyName("createdBy")]
        public string? CreatedBy { get; set; }

        [JsonPropertyName("isModified")]
        public bool IsModified { get; set; }

        [JsonPropertyName("modifiedBy")]
        public string? ModifiedBy { get; set; }
    }

}
