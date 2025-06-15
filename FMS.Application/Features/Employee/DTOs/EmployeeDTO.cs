#nullable disable
using FMS.Application.Features.Vehicle.DTOs;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Text.Json.Serialization;
using System.Threading.Tasks;

namespace FMS.Application.Features.Employee.DTOs
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

        //<todo> this is wrong: change from SimplevehicleDto to Vehicle
        //</todo>
        /// <summary>
        /// this is wrong
        /// </summary>
        [JsonPropertyName("vehicles")]
        public ICollection<SimpleVehicleDto> Vehicles { get; set; } = new List<SimpleVehicleDto>();
    }
}
