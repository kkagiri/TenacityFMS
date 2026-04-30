 //Cursor - Entity Framework Configuration for ReconciliationPolicyExecution
 using FMS.Domain.Entities;
 using Microsoft.EntityFrameworkCore.Metadata.Builders;
 using Microsoft.EntityFrameworkCore;

 namespace FMS.Persistence.EntityConfigurations {
     /// <summary>
     /// Configuration for the ReconciliationPolicyExecution entity
     /// </summary>
     public class ReconciliationPolicyExecutionConfiguration : EntityTypeConfiguration<ReconciliationPolicyExecution> {
         /// <summary>
         /// Configures the entity
         /// </summary>
         /// <param name="builder">The entity type builder</param>
         public override void Configure (EntityTypeBuilder<ReconciliationPolicyExecution> builder) {
             try {
                 builder.HasKey (e => e.Id);

                 builder.ToTable ("reconciliationpolicyexecution");

                 // Indexes
                 builder.HasIndex (e => e.PolicyId, "FK_ReconciliationPolicyExecution_Policy_idx");
                 builder.HasIndex (e => e.ExecutionStartTime, "IX_ReconciliationPolicyExecution_ExecutionStartTime");
                 builder.HasIndex (e => e.Status, "IX_ReconciliationPolicyExecution_Status");

                 // Properties
                 builder.Property (e => e.Id);
                 builder.Property (e => e.PolicyId).IsRequired ();
                 builder.Property (e => e.ExecutionStartTime).IsRequired ();
                 builder.Property (e => e.ExecutionEndTime);
                 builder.Property (e => e.Status).IsRequired ();
                 builder.Property (e => e.TanksEvaluated).HasDefaultValue (0);
                 builder.Property (e => e.DiscrepanciesDetected).HasDefaultValue (0);
                 builder.Property (e => e.TanksReconciled).HasDefaultValue (0);
                 builder.Property (e => e.ReconciliationFailures).HasDefaultValue (0);
                 builder.Property (e => e.TotalVolumeVariance).HasPrecision (10, 2);
                 builder.Property (e => e.AveragePercentageVariance).HasPrecision (5, 2);
                 builder.Property (e => e.ExecutionDurationMs).HasColumnType ("bigint");
                 builder.Property (e => e.ErrorMessage).HasMaxLength (1000);
                 builder.Property (e => e.ExecutionResults).HasColumnType ("text");
                 builder.Property (e => e.ExecutionLog).HasColumnType ("text");

                 // Relationships
                 builder.HasOne (d => d.Policy)
                     .WithMany (p => p.PolicyExecutions)
                     .HasForeignKey (d => d.PolicyId)
                     .HasConstraintName ("FK_ReconciliationPolicyExecution_Policy");

                 builder.HasMany (d => d.Discrepancies)
                     .WithOne (p => p.PolicyExecution)
                     .HasForeignKey (p => p.PolicyExecutionId)
                     .HasConstraintName ("FK_ReconciliationDiscrepancy_PolicyExecution");
             } catch (Exception ex) {
                 Console.WriteLine ($"Error configuring ReconciliationPolicyExecution: {ex.Message}");
                 throw;
             }
         }
     }
 }