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
                 builder.HasKey (e => e.Id).HasName ("PRIMARY");

                 // Indexes
                 builder.HasIndex (e => e.ReportType, "idx_stock_reports_type");
                 builder.HasIndex (e => e.GeneratedDate, "idx_stock_reports_generated_date");
                 builder.HasIndex (e => e.GeneratedBy, "idx_stock_reports_generated_by");
                 builder.HasIndex (e => e.Status, "idx_stock_reports_status");
                 builder.HasIndex (e => e.SiteId, "idx_stock_reports_site_id");
                 builder.HasIndex (e => new { e.ReportType, e.GeneratedDate }, "idx_stock_reports_type_date");
                 builder.HasIndex (e => new { e.GeneratedBy, e.GeneratedDate }, "idx_stock_reports_user_date");

                 // Column configurations
                 builder.Property (e => e.Id)
                     .HasColumnType ("int(11)")
                     .HasColumnName ("id");

                 builder.Property (e => e.ReportType)
                     .HasMaxLength (50)
                     .HasColumnName ("report_type")
                     .IsRequired ();

                 builder.Property (e => e.GeneratedDate)
                     .HasColumnType ("datetime")
                     .HasColumnName ("generated_date");

                 builder.Property (e => e.GeneratedBy)
                     .HasMaxLength (100)
                     .HasColumnName ("generated_by")
                     .IsRequired ();

                 builder.Property (e => e.Status)
                     .HasColumnType ("tinyint(4)")
                     .HasColumnName ("status")
                     .HasDefaultValue (1)
                     .HasComment ("0=Generating, 1=Completed, 2=Failed");

                 builder.Property (e => e.StartDate)
                     .HasColumnType ("datetime")
                     .HasColumnName ("start_date");

                 builder.Property (e => e.EndDate)
                     .HasColumnType ("datetime")
                     .HasColumnName ("end_date");

                 builder.Property (e => e.SiteId)
                     .HasColumnType ("int(11)")
                     .HasColumnName ("site_id");

                 builder.Property (e => e.FilePath)
                     .HasMaxLength (500)
                     .HasColumnName ("file_path");

                 builder.Property (e => e.FileName)
                     .HasMaxLength (255)
                     .HasColumnName ("file_name");

                 builder.Property (e => e.ContentType)
                     .HasMaxLength (100)
                     .HasColumnName ("content_type");

                 builder.Property (e => e.FileSize)
                     .HasColumnType ("bigint(20)")
                     .HasColumnName ("file_size");

                 builder.Property (e => e.Parameters)
                     .HasMaxLength (1000)
                     .HasColumnName ("parameters");

                 builder.Property (e => e.ErrorMessage)
                     .HasMaxLength (500)
                     .HasColumnName ("error_message");

                 builder.Property (e => e.CreatedOn)
                     .HasColumnType ("datetime")
                     .HasColumnName ("created_on")
                     .HasDefaultValueSql ("CURRENT_TIMESTAMP");

                 builder.Property (e => e.UpdatedOn)
                     .HasColumnType ("datetime")
                     .HasColumnName ("updated_on");

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