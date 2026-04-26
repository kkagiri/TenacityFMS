// using Microsoft.EntityFrameworkCore;
// using Microsoft.EntityFrameworkCore.Metadata.Builders;
// using FMS.Domain.Entities;

// namespace FMS.Persistence.EntityConfigurations
// {
//     /// <summary>
//     /// Configuration for the PendingCommand entity
//     /// </summary>
//     public class PendingCommandConfiguration : EntityTypeConfiguration<PendingCommand>
//     {
//         /// <summary>
//         /// Configures the entity
//         /// </summary>
//         /// <param name="builder">The entity type builder</param>
//         public override void Configure(EntityTypeBuilder<PendingCommand> builder)
//         {
//             try
//             {
//                 builder.HasKey(e => e.Id).HasName("PRIMARY");

//                 builder.ToTable("pendingcommand");

//                 builder.HasIndex(e => e.PTSDeviceId, "FK_PendingCommand_Ptsdevice_idx");

//                 builder.Property(e => e.Id);
//                 builder.Property(e => e.PTSDeviceId).HasMaxLength(50).IsRequired();
//                 builder.Property(e => e.CommandType).HasMaxLength(50).IsRequired();
//                 builder.Property(e => e.CommandDataJson).IsRequired();
//                 builder.Property(e => e.CreatedAt);

//                 // builder.HasOne(d => d.Ptsdevice)
//                 //     .WithMany(p => p.PendingCommands)
//                 //     .HasForeignKey(d => d.PTSDeviceId)
//                 //     .OnDelete(DeleteBehavior.ClientSetNull)
//                 //     .HasConstraintName("FK_PendingCommand_Ptsdevice");
//             }

//             catch (Exception ex)
//             {
//                 Console.WriteLine($"Error configuring  : {ex.Message}");

//                 throw new Exception($"Error configuring PendingCommandConfiguration: {ex.Message}", ex);
//             }
//         }
//     }
// }
