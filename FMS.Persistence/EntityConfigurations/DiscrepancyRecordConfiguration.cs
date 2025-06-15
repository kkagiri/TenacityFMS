
// using Microsoft.EntityFrameworkCore;
// using Microsoft.EntityFrameworkCore.Metadata.Builders;

// namespace FMS.Persistence.EntityConfigurations;

// //Cursor - Entity configuration for DiscrepancyRecord
// public class DiscrepancyRecordConfiguration : IEntityTypeConfiguration<DiscrepancyRecord>
// {
//     public void Configure(EntityTypeBuilder<DiscrepancyRecord> builder)
//     {
//         builder.ToTable("DiscrepancyRecords");

//         builder.HasKey(e => e.Id);

//         builder.Property(e => e.VarianceLiters)
//             .IsRequired()
//             .HasColumnType("decimal(18,2)");

//         builder.Property(e => e.VariancePercentage)
//             .IsRequired()
//             .HasColumnType("decimal(5,2)");

//         builder.Property(e => e.ExpectedVolume)
//             .HasColumnType("decimal(18,2)");

//         builder.Property(e => e.ActualVolume)
//             .HasColumnType("decimal(18,2)");

//         builder.Property(e => e.ResolutionMethod)
//             .HasMaxLength(50);

//         builder.Property(e => e.ResolutionDetails)
//             .HasMaxLength(1000);

//         builder.Property(e => e.ErrorMessage)
//             .HasMaxLength(1000);

//         builder.Property(e => e.Severity)
//             .HasMaxLength(20);

//         // Relationships
//         builder.HasOne(e => e.Tank)
//             .WithMany()
//             .HasForeignKey(e => e.TankId)
//             .OnDelete(DeleteBehavior.Restrict);

//         builder.HasOne(e => e.Policy)
//             .WithMany(e => e.DiscrepancyRecords)
//             .HasForeignKey(e => e.PolicyId)
//             .OnDelete(DeleteBehavior.Cascade);

//         builder.HasOne(e => e.Execution)
//             .WithMany()
//             .HasForeignKey(e => e.ExecutionId)
//             .OnDelete(DeleteBehavior.Cascade);

//         // Indexes
//         builder.HasIndex(e => e.TankId);
//         builder.HasIndex(e => e.PolicyId);
//         builder.HasIndex(e => e.ExecutionId);
//         builder.HasIndex(e => e.DetectedAt);
//         builder.HasIndex(e => e.IsResolved);
//         builder.HasIndex(e => e.Severity);
//     }
// }