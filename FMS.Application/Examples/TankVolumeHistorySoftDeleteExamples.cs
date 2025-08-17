// // Example: Using the Soft Delete Tank Volume History System

// using FMS.Application.Features.TankManagement.TankVolumeHistory.Commands;
// using FMS.Domain.Entities.enums;
// using MediatR;

// namespace FMS.Application.Examples {
//     /// <summary>
//     /// Examples demonstrating the usage of the soft delete functionality
//     /// for Tank Volume History records
//     /// </summary>
//     public class TankVolumeHistorySoftDeleteExamples {
//         private readonly IMediator _mediator;

//         public TankVolumeHistorySoftDeleteExamples (IMediator mediator) {
//             _mediator = mediator;
//         }

//         /// <summary>
//         /// Example 1: Soft delete a specific tank volume history record by ID
//         /// </summary>
//         public async Task<FMSResponseMessage> DeleteSpecificRecordAsync (int recordId, string deletedBy) {
//             var command = new DeleteTankVolumeHistoryCommand (
//                 DeletedBy: deletedBy,
//                 Id: recordId,
//                 ValidateFutureRecords: true // This will check future records policy
//             );

//             return await _mediator.Send (command);
//         }

//         /// <summary>
//         /// Example 2: Soft delete all records for a specific tank within a date range
//         /// </summary>
//         public async Task<FMSResponseMessage> DeleteTankRecordsInDateRangeAsync (
//             int tankId,
//             DateTime fromDate,
//             DateTime toDate,
//             string deletedBy) {
//             var command = new DeleteTankVolumeHistoryCommand (
//                 DeletedBy: deletedBy,
//                 TankId: tankId,
//                 FromDate: fromDate,
//                 ToDate: toDate,
//                 ValidateFutureRecords: true
//             );

//             return await _mediator.Send (command);
//         }

//         /// <summary>
//         /// Example 3: Soft delete records by reference type and ID (e.g., all delivery records)
//         /// </summary>
//         public async Task<FMSResponseMessage> DeleteDeliveryRecordsAsync (
//             int deliveryId,
//             string deletedBy) {
//             var command = new DeleteTankVolumeHistoryCommand (
//                 DeletedBy: deletedBy,
//                 ReferenceType: VolumeChangeReasonEnum.Delivery.ToString (),
//                 ReferenceId: deliveryId,
//                 ValidateFutureRecords: true
//             );

//             return await _mediator.Send (command);
//         }

//         /// <summary>
//         /// Example 4: Bulk delete with policy bypass (use with caution)
//         /// </summary>
//         public async Task<FMSResponseMessage> BulkDeleteWithPolicyBypassAsync (
//             int tankId,
//             DateTime fromDate,
//             string deletedBy) {
//             // This bypasses future records validation - use carefully!
//             var command = new DeleteTankVolumeHistoryCommand (
//                 DeletedBy: deletedBy,
//                 TankId: tankId,
//                 FromDate: fromDate,
//                 ValidateFutureRecords: false // Bypasses policy validation
//             );

//             return await _mediator.Send (command);
//         }

//         /// <summary>
//         /// Example 5: Safe deletion with comprehensive error handling
//         /// </summary>
//         public async Task<FMSResponseMessage> SafeDeleteWithErrorHandlingAsync (
//             int tankId,
//             DateTime targetDate,
//             string deletedBy) {
//             try {
//                 // First, try to delete the specific record
//                 var command = new DeleteTankVolumeHistoryCommand (
//                     DeletedBy: deletedBy,
//                     TankId: tankId,
//                     FromDate: targetDate,
//                     ToDate: targetDate.AddDays (1), // Single day range
//                     ValidateFutureRecords : true
//                 );

//                 var result = await _mediator.Send (command);

//                 if (!result.Success) {
//                     // Log the error and potentially try alternative approaches
//                     Console.WriteLine ($"Deletion failed: {result.Message}");

//                     // Could implement retry logic or alternative deletion strategies here
//                     return new FMSResponseMessage (false, $"Safe deletion failed: {result.Message}");
//                 }

//                 Console.WriteLine ($"Successfully deleted records: {result.Message}");
//                 return result;
//             } catch (Exception ex) {
//                 Console.WriteLine ($"Exception during deletion: {ex.Message}");
//                 return new FMSResponseMessage (false, $"Exception occurred: {ex.Message}");
//             }
//         }

//         /// <summary>
//         /// Example 6: Creating new records that work with soft delete
//         /// </summary>
//         public async Task<FMSResponseMessage> CreateNewRecordAsync (
//             int tankId,
//             decimal volumeChange,
//             VolumeChangeReasonEnum reason,
//             string recordedBy,
//             int referenceId) {
//             var command = new ProcessTankStockChangeCommand (
//                 TankId: tankId,
//                 Timestamp: DateTime.UtcNow,
//                 VolumeChange: volumeChange,
//                 ChangeReason: reason,
//                 RecordedBy: recordedBy,
//                 ReferenceId: referenceId,
//                 ReferenceType: reason.ToString (),
//                 ActionType: ActionType.Create
//             );

//             return await _mediator.Send (command);
//         }

//         /// <summary>
//         /// Example 7: Updating existing records (soft delete compatible)
//         /// </summary>
//         public async Task<FMSResponseMessage> UpdateExistingRecordAsync (
//             int tankId,
//             decimal newVolumeChange,
//             VolumeChangeReasonEnum reason,
//             string recordedBy,
//             int referenceId) {
//             var command = new ProcessTankStockChangeCommand (
//                 TankId: tankId,
//                 Timestamp: DateTime.UtcNow,
//                 VolumeChange: newVolumeChange,
//                 ChangeReason: reason,
//                 RecordedBy: recordedBy,
//                 ReferenceId: referenceId,
//                 ReferenceType: reason.ToString (),
//                 ActionType: ActionType.Update
//             );

//             return await _mediator.Send (command);
//         }

//         /// <summary>
//         /// Example 8: Soft deleting via ProcessTankStockChangeCommand
//         /// </summary>
//         public async Task<FMSResponseMessage> SoftDeleteViaProcessCommandAsync (
//             int tankId,
//             VolumeChangeReasonEnum reason,
//             string recordedBy,
//             int referenceId) {
//             var command = new ProcessTankStockChangeCommand (
//                 TankId: tankId,
//                 Timestamp: DateTime.UtcNow,
//                 VolumeChange: 0, // Not used for delete operations
//                 ChangeReason : reason,
//                 RecordedBy : recordedBy,
//                 ReferenceId : referenceId,
//                 ReferenceType : reason.ToString (),
//                 ActionType : ActionType.Delete
//             );

//             return await _mediator.Send (command);
//         }
//     }

//     /// <summary>
//     /// Best practices for using the soft delete system
//     /// </summary>
//     public static class SoftDeleteBestPractices {
//         /// <summary>
//         /// Best practice guidelines for soft deletion operations
//         /// </summary>
//         public static class Guidelines {
//             public const string ALWAYS_SPECIFY_DELETED_BY = "Always specify the user performing the deletion for audit purposes";
//             public const string VALIDATE_FUTURE_RECORDS = "Enable future records validation unless you have a specific reason not to";
//             public const string USE_SPECIFIC_FILTERS = "Use specific filters rather than broad date ranges to avoid unintended deletions";
//             public const string HANDLE_ERRORS_GRACEFULLY = "Always handle deletion errors gracefully and provide meaningful feedback";
//             public const string LOG_DELETION_ACTIVITIES = "Log all deletion activities for audit and troubleshooting purposes";
//             public const string TEST_IN_STAGING = "Always test deletion operations in staging environment first";
//             public const string BACKUP_BEFORE_BULK = "Consider backing up data before large bulk deletion operations";
//             public const string UNDERSTAND_CASCADE = "Understand cascade deletion behavior for different volume change reasons";
//         }

//         /// <summary>
//         /// Common error scenarios and their solutions
//         /// </summary>
//         public static class CommonErrors {
//             public const string FUTURE_RECORDS_BLOCKED = "Deletion blocked by future records policy - check policy settings or remove future records first";
//             public const string USER_NOT_SPECIFIED = "DeletedBy parameter is required - ensure user context is available";
//             public const string NO_RECORDS_FOUND = "No records match the specified criteria - verify filters and record existence";
//             public const string VALIDATION_FAILED = "Input validation failed - check all required parameters are provided";
//             public const string CASCADE_FAILURE = "Cascade deletion failed - related entities may need soft delete implementation";
//         }

//         /// <summary>
//         /// Performance considerations for soft delete operations
//         /// </summary>
//         public static class PerformanceConsiderations {
//             public const string USE_SPECIFIC_INDEXES = "Ensure database indexes exist on IsDeleted, TankId, and Timestamp columns";
//             public const string BATCH_LARGE_OPERATIONS = "Consider batching very large deletion operations to avoid timeouts";
//             public const string MONITOR_QUERY_FILTERS = "Monitor the performance impact of global query filters on large datasets";
//             public const string CLEANUP_STRATEGY = "Implement a strategy for eventual hard deletion of old soft-deleted records";
//             public const string CACHE_CONSIDERATIONS = "Clear relevant caches after soft deletion operations";
//         }
//     }
// }