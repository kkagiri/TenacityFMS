using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace FMS.Domain.Entities.Features.UserManagement
{
    /// <summary>
    /// Refresh token entity for implementing JWT refresh token pattern
    /// Enables long-lived sessions without exposing long-lived JWTs
    /// </summary>
    public class RefreshToken
    {
        [Key]
        public int Id { get; set; }

        /// <summary>
        /// The refresh token string (cryptographically secure random value)
        /// </summary>
        [Required]
        [StringLength(500)]
        public string Token { get; set; }

        /// <summary>
        /// User ID that owns this refresh token
        /// </summary>
        [Required]
        public string UserId { get; set; }

        /// <summary>
        /// Navigation property to User
        /// </summary>
        [ForeignKey(nameof(UserId))]
        public virtual User User { get; set; }

        /// <summary>
        /// When this refresh token was created
        /// </summary>
        public DateTime CreatedAt { get; set; }

        /// <summary>
        /// When this refresh token expires
        /// Typically 30 days from creation
        /// </summary>
        public DateTime ExpiresAt { get; set; }

        /// <summary>
        /// Whether this refresh token has been revoked
        /// Revoked tokens cannot be used even if not expired
        /// </summary>
        public bool IsRevoked { get; set; }

        /// <summary>
        /// When this token was revoked (if applicable)
        /// </summary>
        public DateTime? RevokedAt { get; set; }

        /// <summary>
        /// Reason for revocation (e.g., "User logout", "Security breach", "Token rotation")
        /// </summary>
        [StringLength(200)]
        public string? RevocationReason { get; set; }

        /// <summary>
        /// IP address from which this token was created
        /// </summary>
        [StringLength(50)]
        public string? CreatedByIp { get; set; }

        /// <summary>
        /// When this token was last used to refresh an access token
        /// </summary>
        public DateTime? LastUsedAt { get; set; }

        /// <summary>
        /// IP address from which this token was last used
        /// </summary>
        [StringLength(50)]
        public string? LastUsedByIp { get; set; }

        /// <summary>
        /// For token rotation: ID of the token that replaced this one
        /// </summary>
        public int? ReplacedByTokenId { get; set; }

        /// <summary>
        /// Check if this refresh token is currently valid
        /// </summary>
        [NotMapped]
        public bool IsActive => !IsRevoked && DateTime.UtcNow < ExpiresAt;

        /// <summary>
        /// Check if this token is expired
        /// </summary>
        [NotMapped]
        public bool IsExpired => DateTime.UtcNow >= ExpiresAt;
    }
}
