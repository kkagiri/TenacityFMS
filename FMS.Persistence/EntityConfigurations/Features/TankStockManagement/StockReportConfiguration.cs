 using FMS.Domain.Entities;
 using Microsoft.EntityFrameworkCore.Metadata.Builders;
 using Microsoft.EntityFrameworkCore;

 namespace FMS.Persistence.EntityConfigurations {
     /// <summary>
     /// Configuration for the StockReport entity
     /// </summary>
     //Cursor - Added StockReportConfiguration for database mapping
     public class StockReportConfiguration : EntityTypeConfiguration<StockReport> {
         /// <summary>
         /// Configures the entity
         /// </summary>
         /// <param name="builder">The entity type builder</param>
         public override void Configure (EntityTypeBuilder<StockReport> builder) {
             try {
                 // Table configuration
                 builder.ToTable ("stock_reports");
                 builder.HasKey (e => e.Id);

                 // Indexes
                 builder.HasIndex (e => e.ReportType, "idx_stock_reports_type");
                 builder.HasIndex (e => e.GeneratedDate, "idx_stock_reports_generated_date");
                 builder.HasIndex (e => e.GeneratedBy, "idx_stock_reports_generated_by");
                 builder.HasIndex (e => e.Status, "idx_stock_reports_status");
                 builder.HasIndex (e => e.SiteId, "idx_stock_reports_site_id");
                 builder.HasIndex (e => new { e.ReportType, e.GeneratedDate }, "idx_stock_reports_type_date");
                 builder.HasIndex (e => new { e.GeneratedBy, e.GeneratedDate }, "idx_stock_reports_user_date");

                 // Column configurations
                 builder.Property (e => e.Id);

                 builder.Property (e => e.ReportType)
                     .HasMaxLength (50)
                     .IsRequired ();

                 builder.Property (e => e.GeneratedDate);

                 builder.Property (e => e.GeneratedBy)
                     .HasMaxLength (100)
                     .IsRequired ();

                 builder.Property (e => e.Status)
                     .HasDefaultValue (1)
                     .HasComment ("0=Generating, 1=Completed, 2=Failed");

                 builder.Property (e => e.StartDate);

                 builder.Property (e => e.EndDate);

                 builder.Property (e => e.SiteId);

                 builder.Property (e => e.FilePath)
                     .HasMaxLength (500);

                 builder.Property (e => e.FileName)
                     .HasMaxLength (255);

                 builder.Property (e => e.ContentType)
                     .HasMaxLength (100);

                 builder.Property (e => e.FileSize);

                 builder.Property (e => e.Parameters)
                     .HasMaxLength (1000);

                 builder.Property (e => e.ErrorMessage)
                     .HasMaxLength (500);

                 builder.Property (e => e.CreatedOn)
                     .HasDefaultValueSql ("CURRENT_TIMESTAMP");

                 builder.Property (e => e.UpdatedOn);

                 // Relationships
                 builder.HasOne (d => d.GeneratedByNavigation)
                     .WithMany (p => p.StockReports)
                     .HasForeignKey (d => d.GeneratedBy)
                     .OnDelete (DeleteBehavior.ClientSetNull)
                     .HasConstraintName ("fk_stock_reports_generated_by");

                 builder.HasOne (d => d.Site)
                     .WithMany (p => p.StockReports)
                     .HasForeignKey (d => d.SiteId)
                     .OnDelete (DeleteBehavior.SetNull)
                     .HasConstraintName ("fk_stock_reports_site");
             } catch (Exception ex) {
                 Console.WriteLine ($"Error configuring StockReportConfiguration: {ex.Message}");
                 throw new Exception ($"Error configuring StockReportConfiguration: {ex.Message}", ex);
             }
         }
     }
 }