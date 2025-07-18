using System.Collections.Generic;
using FMS.Application.Common;

namespace FMS.Application.Features.TaskManagement.Helpers {
    public static class TaskValidationHelper {
        /// <summary>
        /// Validates common required fields for task operations
        /// </summary>
        /// <param name="updatedBy">User performing the update</param>
        /// <returns>Validation errors if any</returns>
        public static List<string> ValidateRequiredFields (string? updatedBy) {
            var errors = new List<string> ();

            if (string.IsNullOrWhiteSpace (updatedBy)) {
                errors.Add ("UpdatedBy/User information is required");
            }

            return errors;
        }

        /// <summary>
        /// Validates task assignment fields
        /// </summary>
        /// <param name="assignedTo">User being assigned to</param>
        /// <param name="assignedBy">User performing the assignment</param>
        /// <returns>Validation errors if any</returns>
        public static List<string> ValidateAssignmentFields (string? assignedTo, string? assignedBy) {
            var errors = new List<string> ();

            if (string.IsNullOrWhiteSpace (assignedTo)) {
                errors.Add ("AssignedTo is required");
            }

            if (string.IsNullOrWhiteSpace (assignedBy)) {
                errors.Add ("AssignedBy is required");
            }

            return errors;
        }

        /// <summary>
        /// Validates task completion fields
        /// </summary>
        /// <param name="completedBy">User completing the task</param>
        /// <param name="completionNotes">Completion notes</param>
        /// <returns>Validation errors if any</returns>
        public static List<string> ValidateCompletionFields (string? completedBy, string? completionNotes) {
            var errors = new List<string> ();

            if (string.IsNullOrWhiteSpace (completedBy)) {
                errors.Add ("CompletedBy is required");
            }

            if (string.IsNullOrWhiteSpace (completionNotes)) {
                errors.Add ("CompletionNotes is required");
            }

            return errors;
        }

        /// <summary>
        /// Validates task deletion fields
        /// </summary>
        /// <param name="deletedBy">User deleting the task</param>
        /// <returns>Validation errors if any</returns>
        public static List<string> ValidateDeletionFields (string? deletedBy) {
            var errors = new List<string> ();

            if (string.IsNullOrWhiteSpace (deletedBy)) {
                errors.Add ("DeletedBy is required");
            }

            return errors;
        }
    }
}