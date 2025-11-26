using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace FMS.Domain.Entities.Features.Reporting
{
    [Table("report_categories")]
    public class ReportCategory
    {
        [Key]
        [Column("ReportCategoryId")]
        public int ReportCategoryId { get; set; }

        [Required]
        [Column("CategoryName")]
        [StringLength(100)]
        public string CategoryName { get; set; } = string.Empty;

        [Column("Description")]
        [StringLength(500)]
        public string? Description { get; set; }

        [Column("Icon")]
        [StringLength(100)]
        public string? Icon { get; set; } = "fa-light fa-folder";

        [Column("DisplayOrder")]
        public int DisplayOrder { get; set; } = 0;

        [Column("IsActive")]
        public bool IsActive { get; set; } = true;

        [Column("CreatedAt")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [Column("CreatedBy")]
        [StringLength(100)]
        public string? CreatedBy { get; set; }
    }
}
