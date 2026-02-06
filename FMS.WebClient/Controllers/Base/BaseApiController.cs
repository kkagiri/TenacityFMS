/**
 * File: BaseApiController.cs
 * Purpose: Provides shared API controller utilities for auth, validation, and permissions.
 * Dependencies: ASP.NET Core MVC, JWT claims, FMSResponse.
 * Last Modified: 2026-02-04
 *
 * Key Helpers:
 * - TryGetCurrentUserId(): Resolves and validates current user ID from claims.
 * - HandlePermissionCheck(): Performs permission guard checks.
 * - ValidateModelState(): Returns standardized validation responses.
 */
using System.Security.Claims;
using FMS.Application.Common;
using FMS.WebClient.Constants;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FMS.WebClient.Controllers.Base {
    /// <summary>
    /// Base controller for all API v1 controllers
    /// Provides common functionality and ensures consistent patterns
    /// </summary>
    [ApiController]
    [Route (ApiVersions.Routes.V1_BASE + "/[controller]")]
    [Authorize (AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
    public abstract class BaseApiController : ControllerBase {
        /// <summary>
        /// Extracts and validates the user ID claim from JWT token
        /// </summary>
        /// <returns>User ID claim if valid, null otherwise</returns>
        protected Claim? GetUserIdClaim () {
            Claim? userIdClaim = User.FindFirst (ClaimTypes.NameIdentifier) ??
                User.FindFirst ("sub");

            if (userIdClaim == null)
                return null;

            return Guid.TryParse (userIdClaim.Value, out _) ? userIdClaim : null;
        }

        /// <summary>
        /// Gets the current user ID from claims
        /// </summary>
        /// <returns>User ID string or "Unknown" if not found</returns>
        protected string GetUserId () {
            var userIdClaim = GetUserIdClaim ();
            return userIdClaim?.Value ?? "Unknown";
        }

        /// <summary>
        /// Tries to get current user ID from common JWT claim types and validates it as GUID.
        /// </summary>
        /// <param name="userId">Resolved user ID when available</param>
        /// <returns>True when a valid user ID is found, otherwise false</returns>
        protected bool TryGetCurrentUserId (out string userId) {
            userId = User.FindFirstValue (ClaimTypes.NameIdentifier) ??
                User.FindFirstValue ("sub") ??
                string.Empty;

            return Guid.TryParse (userId, out _);
        }

        /// <summary>
        /// Checks if the current user has a specific permission
        /// </summary>
        /// <param name="permission">Permission to check (e.g., "_createVehicle")</param>
        /// <returns>True if user has permission, false otherwise</returns>
        protected bool HasPermission (string permission) {
            return User.HasClaim ("permissions", permission);
        }

        /// <summary>
        /// Performs permission check and returns appropriate response if failed
        /// </summary>
        /// <param name="permission">Permission to check</param>
        /// <returns>Forbid result if permission denied, null if permission granted</returns>
        protected IActionResult? HandlePermissionCheck (string permission) {
            if (!HasPermission (permission))
                return Forbid ();
            return null;
        }

        /// <summary>
        /// Validates that an ID parameter is valid (greater than 0)
        /// </summary>
        /// <param name="id">ID to validate</param>
        /// <param name="resourceName">Name of the resource for error message</param>
        /// <returns>BadRequest result if invalid, null if valid</returns>
        protected IActionResult? ValidateId (int id, string resourceName = "Resource") {
            if (id <= 0)
                return BadRequest (FMSResponse.FailedResponse ($"Invalid {resourceName} ID"));
            return null;
        }

        /// <summary>
        /// Validates that IDs match (for update operations)
        /// </summary>
        /// <param name="routeId">ID from route parameter</param>
        /// <param name="bodyId">ID from request body</param>
        /// <param name="resourceName">Name of the resource for error message</param>
        /// <returns>BadRequest result if mismatch, null if valid</returns>
        protected IActionResult? ValidateIdMatch (int routeId, int bodyId, string resourceName = "Resource") {
            if (routeId != bodyId)
                return BadRequest (FMSResponse.FailedResponse ($"{resourceName} ID mismatch between route and body"));
            return null;
        }

        /// <summary>
        /// Validates ModelState and returns appropriate error response
        /// </summary>
        /// <returns>BadRequest with validation errors if invalid, null if valid</returns>
        protected IActionResult? ValidateModelState () {
            if (!ModelState.IsValid) {
                var errors = ModelState.Values
                    .SelectMany (v => v.Errors)
                    .Select (e => e.ErrorMessage)
                    .ToList ();
                return BadRequest (FMSResponse.ValidationFailed (errors));
            }
            return null;
        }

        /// <summary>
        /// Handles standard validation for update operations
        /// </summary>
        /// <param name="routeId">ID from route</param>
        /// <param name="bodyId">ID from body</param>
        /// <param name="permission">Required permission</param>
        /// <param name="resourceName">Resource name for error messages</param>
        /// <returns>Error response if validation fails, null if valid</returns>
        protected IActionResult? ValidateUpdateOperation (int routeId, int bodyId, string permission, string resourceName = "Resource") {
            // Check permission
            var permissionResult = HandlePermissionCheck (permission);
            if (permissionResult != null) return permissionResult;

            // Validate model state
            var modelStateResult = ValidateModelState ();
            if (modelStateResult != null) return modelStateResult;

            // Validate route ID
            var idResult = ValidateId (routeId, resourceName);
            if (idResult != null) return idResult;

            // Validate ID match
            var matchResult = ValidateIdMatch (routeId, bodyId, resourceName);
            if (matchResult != null) return matchResult;

            return null;
        }

        /// <summary>
        /// Handles standard validation for create operations
        /// </summary>
        /// <param name="permission">Required permission</param>
        /// <returns>Error response if validation fails, null if valid</returns>
        protected IActionResult? ValidateCreateOperation (string permission) {
            // Check permission
            var permissionResult = HandlePermissionCheck (permission);
            if (permissionResult != null) return permissionResult;

            // Validate model state
            var modelStateResult = ValidateModelState ();
            if (modelStateResult != null) return modelStateResult;

            return null;
        }

        /// <summary>
        /// Handles standard validation for delete operations
        /// </summary>
        /// <param name="id">Resource ID to delete</param>
        /// <param name="permission">Required permission</param>
        /// <param name="resourceName">Resource name for error messages</param>
        /// <returns>Error response if validation fails, null if valid</returns>
        protected IActionResult? ValidateDeleteOperation (int id, string permission, string resourceName = "Resource") {
            // Check permission
            var permissionResult = HandlePermissionCheck (permission);
            if (permissionResult != null) return permissionResult;

            // Validate ID
            var idResult = ValidateId (id, resourceName);
            if (idResult != null) return idResult;

            return null;
        }
    }
}
