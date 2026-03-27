/**
 * File: BulkTankVolumeHistoryDeleteResultDto.cs
 * Purpose: DTOs for bulk tank volume history validation and deletion summaries.
 * Dependencies: VolumeChangeReasonEnum
 * Last Modified: 2026-03-27
 *
 * Key Functions:
 * - BulkTankVolumeHistoryDeleteResultDto: Returns aggregate validation and deletion impact details.
 * - BulkTankVolumeHistoryDeleteItemDto: Describes a blocked or warning transaction item in the bulk workflow.
 */
using System;
using System.Collections.Generic;
using FMS.Domain.Entities.enums;

namespace FMS.Application.Features.TankManagement.TankVolumeHistory.DTOs
{
    public class BulkTankVolumeHistoryDeleteResultDto
    {
        public int SelectedCount { get; set; }
        public int TotalTransactionsToDelete { get; set; }
        public int DeletedTransactionCount { get; set; }
        public bool CanDelete { get; set; }
        public bool RequiresUserConfirmation { get; set; }
        public int BlockedCount { get; set; }
        public int WarningCount { get; set; }
        public int DeletedReferenceCount { get; set; }
        public int UpdatedReferenceCount { get; set; }
        public int PreservedReferenceCount { get; set; }
        public int PreservedPumpTransactionCount { get; set; }
        public int PreservedPtsTransferCount { get; set; }
        public string SummaryMessage { get; set; } = string.Empty;
        public List<int> AffectedTankIds { get; set; } = new();
        public List<int> DeletedTransactionIds { get; set; } = new();
        public List<BulkTankVolumeHistoryDeleteItemDto> BlockedItems { get; set; } = new();
        public List<BulkTankVolumeHistoryDeleteItemDto> WarningItems { get; set; } = new();
        public List<string> RecalculationWarnings { get; set; } = new();

        public int AdditionalTransferTransactionCount => Math.Max(0, TotalTransactionsToDelete - SelectedCount);
    }

    public class BulkTankVolumeHistoryDeleteItemDto
    {
        public int TransactionId { get; set; }
        public int? TankId { get; set; }
        public DateTime Timestamp { get; set; }
        public VolumeChangeReasonEnum ChangeReason { get; set; }
        public string Message { get; set; } = string.Empty;
        public string RecommendedAction { get; set; } = string.Empty;
    }
}