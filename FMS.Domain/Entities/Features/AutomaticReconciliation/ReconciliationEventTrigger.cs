 using System.ComponentModel.DataAnnotations.Schema;
 using System.ComponentModel.DataAnnotations;
 using System;

 namespace FMS.Domain.Entities.Features.AutomaticReconciliation;

 //Cursor - ReconciliationEventTrigger entity for event-driven policy execution
 public class ReconciliationEventTrigger {
     [Key]
     public int Id { get; set; }

     [Required]
     public int PolicyId { get; set; }

     [Required]
     [StringLength (100)]
     public string TriggerReason { get; set; }

     [Required]
     public DateTime TriggeredAt { get; set; }

     [Required]
     public bool IsProcessed { get; set; } = false;

     public DateTime? ProcessedAt { get; set; }

     [Column (TypeName = "text")]
     public string MetadataJson { get; set; }

     [StringLength (50)]
     public string TriggeredBy { get; set; }

     // Navigation properties
     [ForeignKey ("PolicyId")]
     public virtual ReconciliationPolicy Policy { get; set; }
 }