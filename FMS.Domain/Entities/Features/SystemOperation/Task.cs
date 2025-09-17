//Cursor - Create Task entity in FMS.Domain/Entities/Task.cs
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using FMS.Domain.Entities.enums;
using TaskStatus = FMS.Domain.Entities.enums.TaskStatus;

namespace FMS.Domain.Entities {
    public class TaskEntity {
        [Key]
        public int Id { get; set; }

        [Required]
        [StringLength (255)]
        public string Title { get; set; } = null!;

        [Required]
        public string Description { get; set; } = null!;

        [Required]
        public TaskType Type { get; set; } = TaskType.Manual;

        [Required]
        public TaskPriority Priority { get; set; } = TaskPriority.Medium;

        [Required]
        public TaskStatus Status { get; set; } = TaskStatus.Pending;

        // Assignment
        [StringLength (450)]
        public string? AssignedTo { get; set; }

        [StringLength (450)]
        public string? AssignedBy { get; set; }

        public DateTime? AssignedOn { get; set; }

        public DateTime? DueDate { get; set; }

        // Source tracking
        [StringLength (50)]
        public string? SourceType { get; set; } // "Discrepancy", "Issue", "Manual", "TransactionCorrection"

        public int? SourceId { get; set; }

        public int? SiteId { get; set; }

        public int? TankId { get; set; }

        // Completion
        public DateTime? CompletedOn { get; set; }

        [StringLength (450)]
        public string? CompletedBy { get; set; }

        public string? CompletionNotes { get; set; }

        // Audit
        [Required]
        [StringLength (450)]
        public string CreatedBy { get; set; } = null!;

        [Required]
        public DateTime CreatedOn { get; set; } = DateTime.UtcNow;

        [StringLength (450)]
        public string? UpdatedBy { get; set; }

        public DateTime? UpdatedOn { get; set; }

        // Navigation properties
        [ForeignKey ("AssignedTo")]
        public virtual User? AssignedToNavigation { get; set; }

        [ForeignKey ("AssignedBy")]
        public virtual User? AssignedByNavigation { get; set; }

        [ForeignKey ("CreatedBy")]
        public virtual User CreatedByNavigation { get; set; } = null!;

        [ForeignKey ("UpdatedBy")]
        public virtual User? UpdatedByNavigation { get; set; }

        [ForeignKey ("CompletedBy")]
        public virtual User? CompletedByNavigation { get; set; }

        [ForeignKey ("SiteId")]
        public virtual Site? Site { get; set; }

        [ForeignKey ("TankId")]
        public virtual Tank? Tank { get; set; }
    }
}