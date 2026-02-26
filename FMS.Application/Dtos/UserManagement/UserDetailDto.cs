using System;
using System.Collections.Generic;

namespace FMS.Application.Dtos.UserManagement
{
    public class UserDetailDto
    {
        public string Id { get; set; }
        public string? FirstName { get; set; }
        public string? LastName { get; set; }
        public string UserName { get; set; }
        public string Email { get; set; }
        public bool IsDeleted { get; set; }
        public string PhoneNumber { get; set; }
        public int MasterRFIDTag { get; set; }

        // Department Information
        public int? DepartmentId { get; set; }
        public string? DepartmentName { get; set; }

        // Master Tag Information
        public string? MasterTagName { get; set; }
        public bool? MasterTagIsEnabled { get; set; }
        public bool? HasMasterTag { get; set; }

        /// <summary>
        /// When true, this user can bypass GPS/location validation during mobile fueling.
        /// Useful for users operating in areas with poor GPS/network coverage.
        /// </summary>
        public bool BypassLocationValidation { get; set; }

        public List<string> Roles { get; set; } = new List<string>();
        // public List<string> Permissions { get; set; } = new List<string>();
        //Cursor
    }
}