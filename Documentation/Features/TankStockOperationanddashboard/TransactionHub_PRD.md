# Transaction Hub - Product Requirements Document (PRD)

**Document Information**
- Document Type: Product Requirements Document
- Version: 1.0
- Date: December 2024
- Author: Development Team
- Status: Planning Phase

## Executive Summary

The Transaction Hub is a centralized interface within the Stock Management page that provides comprehensive transaction management capabilities for fuel operations. It consolidates all transaction types (deliveries, transfers, adjustments, stock entries) into a unified management interface with advanced filtering, editing, approval workflows, and bulk operations.

## Problem Statement

### Current Challenges
1. **Scattered Transaction Management**: Different transaction types are managed in separate interfaces
2. **Limited Transaction History**: Difficult to get comprehensive view of all tank-related transactions
3. **No Bulk Operations**: Users must process transactions individually
4. **Limited Filtering**: Basic filtering capabilities don't meet operational needs
5. **No Transaction Approval Workflow**: All transactions are immediately processed
6. **Audit Trail Gaps**: Difficult to track transaction modifications and approvals

## Solution Overview

**Transaction Hub Features**:
1. **Unified Transaction Grid** - Single interface for all transaction types
2. **Advanced Filtering System** - Multi-dimensional filtering and search
3. **Transaction Edit Workflow** - Structured editing with validation and approval
4. **Bulk Import/Export** - CSV/Excel support for batch operations
5. **Approval Workflow** - Multi-level approval for sensitive transactions
6. **Audit Trail** - Complete transaction lifecycle tracking

## Current System Analysis

### Existing Transaction Types
Based on current system architecture:

1. **Deliveries** (`DeliveryDTO`)
   - Tank fuel deliveries from suppliers
   - Fields: TankId, DeliveryDate, ManualDeliveryAmount, SupplierId, LpoNumber
   - Endpoint: `POST /api/tankstock` (UpdateDelivery)

2. **Tank Transfers** (`TankTransferDTO`)
   - Inter-tank fuel transfers
   - Fields: SourceTankId, DestinationTankId, Amount, Date
   - Endpoint: `POST /api/tankstock/transfer`

3. **Opening/Closing Stock** (`TankStockDTO`)
   - Daily stock readings
   - Fields: TankId, EntryDate, ManualOpeningLevel, ManualClosingLevel
   - Endpoints: `POST /api/tankstock/openingstock`, `POST /api/tankstock/closingstock`

4. **Stock Adjustments** (`StockAdjustmentDTO`)
   - Manual stock corrections
   - Fields: TankId, AdjustmentDate, NewVolume, ReasonCode
   - Endpoint: `POST /api/tankstock/adjustments`

5. **Pump Transactions** (`TankVolumeHistoryDTO`)
   - Automated fuel dispensing
   - Auto-generated from PTS system

### Integration Points
- All transactions flow through `TankVolumeHistoryIntegrationService`
- Volume history maintains chronological transaction chain
- SignalR provides real-time updates via `FrontEndHub`

## Functional Requirements

### Core Features

#### 1. Transaction Display Grid
```javascript
// Transaction Grid Columns
const columns = [
  { field: 'id', caption: 'ID', width: 80 },
  { field: 'transactionType', caption: 'Type', width: 120 },
  { field: 'transactionDate', caption: 'Date', dataType: 'datetime', width: 150 },
  { field: 'tankName', caption: 'Tank', width: 120 },
  { field: 'siteName', caption: 'Site', width: 120 },
  { field: 'amount', caption: 'Amount (L)', dataType: 'number', format: '#,##0.00' },
  { field: 'balanceAfter', caption: 'Balance After', dataType: 'number', format: '#,##0.00' },
  { field: 'recordedBy', caption: 'Recorded By', width: 120 },
  { field: 'status', caption: 'Status', width: 100 },
  { field: 'actions', caption: 'Actions', width: 100 }
];
```

#### 2. Advanced Filtering System
```javascript
// Filter Configuration
const filterConfig = {
  transactionType: ['Delivery', 'Transfer', 'Opening Stock', 'Closing Stock', 'Adjustment', 'Dispensing'],
  dateRange: { start: Date, end: Date },
  siteIds: [1, 2, 3], // Multi-select
  tankIds: [1, 2, 3], // Multi-select
  status: ['Pending', 'Approved', 'Rejected'],
  amountRange: { min: Number, max: Number },
  recordedBy: String // User search
};
```

#### 3. Transaction Edit Workflow
- **Edit Modal**: Context-aware form based on transaction type
- **Validation**: Business rule validation before save
- **Approval Required**: Transactions above threshold require approval
- **Version Control**: Track all modifications with timestamps

#### 4. Bulk Operations
- **CSV Import**: Template-based bulk transaction import
- **Excel Export**: Filtered transaction export
- **Bulk Approval**: Select multiple transactions for approval
- **Bulk Status Update**: Change status for multiple transactions

## Technical Implementation

### Backend Requirements

#### New API Endpoints for TankStockController
```csharp
// Unified transaction endpoint
[HttpGet("transactions")]
public async Task<IActionResult> GetTransactions(
    [FromQuery] TransactionFilterDTO filter)

// Transaction details by ID and type
[HttpGet("transactions/{type}/{id}")]
public async Task<IActionResult> GetTransactionDetails(string type, int id)

// Update transaction
[HttpPut("transactions/{type}/{id}")]
public async Task<IActionResult> UpdateTransaction(string type, int id,
    [FromBody] object transactionData)

// Bulk operations
[HttpPost("transactions/bulk-import")]
public async Task<IActionResult> BulkImportTransactions(IFormFile file)

[HttpPost("transactions/bulk-approve")]
public async Task<IActionResult> BulkApproveTransactions([FromBody] int[] transactionIds)

// Transaction approval workflow
[HttpPost("transactions/{type}/{id}/approve")]
public async Task<IActionResult> ApproveTransaction(string type, int id)

[HttpPost("transactions/{type}/{id}/reject")]
public async Task<IActionResult> RejectTransaction(string type, int id,
    [FromBody] string reason)
```

#### New DTOs Required
```csharp
// Unified transaction view
public class UnifiedTransactionDTO
{
    public int Id { get; set; }
    public string TransactionType { get; set; }
    public DateTime TransactionDate { get; set; }
    public int TankId { get; set; }
    public string TankName { get; set; }
    public int SiteId { get; set; }
    public string SiteName { get; set; }
    public decimal Amount { get; set; }
    public decimal BalanceAfter { get; set; }
    public string RecordedBy { get; set; }
    public string Status { get; set; }
    public DateTime CreatedOn { get; set; }
    public string? ApprovedBy { get; set; }
    public DateTime? ApprovedOn { get; set; }
    public object OriginalData { get; set; } // Type-specific data
}

// Filter DTO
public class TransactionFilterDTO
{
    public string[]? TransactionTypes { get; set; }
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public int[]? SiteIds { get; set; }
    public int[]? TankIds { get; set; }
    public string[]? Status { get; set; }
    public decimal? MinAmount { get; set; }
    public decimal? MaxAmount { get; set; }
    public string? RecordedBy { get; set; }
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 50;
}
```

#### New CQRS Commands/Queries
```csharp
// Queries
public record GetUnifiedTransactionsQuery(TransactionFilterDTO Filter) : IRequest<FMSResponse<PagedResult<UnifiedTransactionDTO>>>;
public record GetTransactionDetailsQuery(string Type, int Id) : IRequest<FMSResponse<object>>;

// Commands
public record UpdateTransactionCommand(string Type, int Id, object Data) : IRequest<FMSResponse>;
public record BulkImportTransactionsCommand(IFormFile File) : IRequest<FMSResponse<BulkImportResultDTO>>;
public record ApproveTransactionCommand(string Type, int Id, string ApprovedBy) : IRequest<FMSResponse>;
```

### Frontend Implementation

#### File Structure