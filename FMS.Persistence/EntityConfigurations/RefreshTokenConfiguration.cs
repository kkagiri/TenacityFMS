using FMS.Domain.Entities.Features.UserManagement;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FMS.Persistence.EntityConfigurations
{
    /// <summary>
    /// Entity Framework configuration for RefreshToken entity
    /// Configures the database mapping for JWT refresh tokens
    /// </summary>
    public class RefreshTokenConfiguration : IEntityTypeConfiguration<RefreshToken>
    {
        public void Configure(EntityTypeBuilder<RefreshToken> builder)
        {
            // Table name
            builder.ToTable("refreshtokens");

            // Primary key
            builder.HasKey(rt => rt.Id);

            // Token property - required, indexed for fast lookups
            builder.Property(rt => rt.Token)
                .HasColumnName("token")
                .HasMaxLength(500)
                .IsRequired();

            builder.HasIndex(rt => rt.Token)
                .IsUnique()
                .HasDatabaseName("idx_refreshtoken_token");

            // UserId - required, indexed for fast user token lookups
            builder.Property(rt => rt.UserId)
                .HasColumnName("user_id")
                .HasMaxLength(450)
                .IsRequired();

            builder.HasIndex(rt => rt.UserId)
                .HasDatabaseName("idx_refreshtoken_userid");

            // Relationship to User
            builder.HasOne(rt => rt.User)
                .WithMany()
                .HasForeignKey(rt => rt.UserId)
                .OnDelete(DeleteBehavior.Cascade); // Delete tokens when user is deleted

            // CreatedAt
            builder.Property(rt => rt.CreatedAt)
                .HasColumnName("created_at")
                .HasColumnType("datetime")
                .IsRequired();

            // ExpiresAt - indexed for efficient cleanup of expired tokens
            builder.Property(rt => rt.ExpiresAt)
                .HasColumnName("expires_at")
                .HasColumnType("datetime")
                .IsRequired();

            builder.HasIndex(rt => rt.ExpiresAt)
                .HasDatabaseName("idx_refreshtoken_expiresat");

            // IsRevoked
            builder.Property(rt => rt.IsRevoked)
                .HasColumnName("is_revoked")
                .HasDefaultValue(false)
                .IsRequired();

            // Index for finding active tokens (not revoked and not expired)
            builder.HasIndex(rt => new { rt.UserId, rt.IsRevoked, rt.ExpiresAt })
                .HasDatabaseName("idx_refreshtoken_active");

            // RevokedAt
            builder.Property(rt => rt.RevokedAt)
                .HasColumnName("revoked_at")
                .HasColumnType("datetime")
                .IsRequired(false);

            // RevocationReason
            builder.Property(rt => rt.RevocationReason)
                .HasColumnName("revocation_reason")
                .HasMaxLength(200)
                .IsRequired(false);

            // CreatedByIp
            builder.Property(rt => rt.CreatedByIp)
                .HasColumnName("created_by_ip")
                .HasMaxLength(50)
                .IsRequired(false);

            // LastUsedAt
            builder.Property(rt => rt.LastUsedAt)
                .HasColumnName("last_used_at")
                .HasColumnType("datetime")
                .IsRequired(false);

            // LastUsedByIp
            builder.Property(rt => rt.LastUsedByIp)
                .HasColumnName("last_used_by_ip")
                .HasMaxLength(50)
                .IsRequired(false);

            // ReplacedByTokenId - for token rotation tracking
            builder.Property(rt => rt.ReplacedByTokenId)
                .HasColumnName("replaced_by_token_id")
                .IsRequired(false);

            // Self-referencing relationship for token rotation
            builder.HasOne<RefreshToken>()
                .WithMany()
                .HasForeignKey(rt => rt.ReplacedByTokenId)
                .OnDelete(DeleteBehavior.Restrict); // Don't cascade delete replacement chain
        }
    }
}
