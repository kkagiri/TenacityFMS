# Opening/Closing Stock Sequence Validation Fix

## Issue Description
The system was allowing the creation of multiple opening stock entries for the same day without requiring a closing stock first, violating the proper sequence: Opening → Closing → Opening → Closing.

## Root Cause
The `OpeningStockCommand` was missing critical validation logic to:
1. Check if an opening stock already exists for the same day
2. Verify that if an opening stock exists, there must be a closing stock before allowing a new opening stock
3. Ensure proper chronological sequence

## Fix Implementation

### 1. OpeningStockCommand.cs - Added Sequence Validation

**Location**: `FMS.Application\Features\TankManagement\TankStock\Commands\OpeningStockCommand.cs`

**Added validation logic**:
```csharp
if (existingOpeningStock != null) {
    // Check if there's a closing stock after the existing opening stock for the same day
    var closingStockAfterOpening = await _context.TankVolumeHistories
        .Where (x => x.TankId == request.TankId &&
            x.Timestamp > existingOpeningStock.Timestamp &&
            x.Timestamp.Date == entryDate &&
            x.ChangeReason == VolumeChangeReasonEnum.ClosingStock)
        .OrderBy (x => x.Timestamp)
        .FirstOrDefaultAsync (cancellationToken);

    if (closingStockAfterOpening == null) {
        return new FMSResponseMessage (false,
            $"An opening stock already exists for this date {entryDate.Date:yyyy-MM-dd} without a subsequent closing stock. Please create a closing stock before adding another opening stock.");
    }

    // Ensure the new opening stock is after the closing stock
    if (request.EntryDate <= closingStockAfterOpening.Timestamp) {
        return new FMSResponseMessage (false, "New opening stock must be after the previous closing stock.");
    }
}
```

### 2. CreateFuelRrefillCommand.cs - Enhanced Sequence Validation

**Location**: `FMS.Application\Features\TankManagement\FuelRefill\Commands\CreateFuelRrefillCommand.cs`

**Enhanced validation logic**:
```csharp
// Ensure there is a proper sequence: if there's an opening stock, fuel refills should come after it
// but before or after a closing stock if it exists
var closingStockForDay = await _context.TankVolumeHistories
    .Where (x => x.TankId == request.FuelRefilDTO.TankId &&
        x.Timestamp.Date == entryDate.Date &&
        x.ChangeReason == VolumeChangeReasonEnum.ClosingStock)
    .FirstOrDefaultAsync (cancellationToken);

// If there's already a closing stock for the day, and fuel refill is after that closing stock,
// then we need a new opening stock first
if (closingStockForDay != null && fuelRefilDto.Date > closingStockForDay.Timestamp) {
    return new FMSResponseMessage (false,
        $"Cannot add fuel refill after closing stock for {entryDate.Date:yyyy-MM-dd}. Please create a new opening stock first.");
}
```

## Validation Rules Implemented

### 1. Opening Stock Rules
- ✅ **Multiple Opening Stocks Prevention**: Cannot create multiple opening stocks for the same day without a closing stock in between
- ✅ **Sequence Enforcement**: New opening stock must come after the most recent closing stock
- ✅ **First Opening Stock Allowed**: Still allows the very first opening stock without requiring a previous closing stock

### 2. Closing Stock Rules (Already Implemented)
- ✅ **Single Closing Stock**: Only one closing stock allowed per day
- ✅ **Opening Stock Requirement**: Requires opening stock before creating closing stock

### 3. Fuel Refill Rules
- ✅ **Opening Stock Requirement**: Requires opening stock for the day
- ✅ **Sequence Awareness**: Cannot add fuel refills after closing stock without new opening stock

## Proper Sequence Flow

### Correct Sequence:
```
Day 1: Opening Stock → [Fuel Refills] → Closing Stock
Day 2: Opening Stock → [Fuel Refills] → Closing Stock
Day 3: Opening Stock → [Fuel Refills] → Closing Stock
```

### Invalid Sequences Now Prevented:
```
❌ Day 1: Opening Stock → Opening Stock (without closing stock)
❌ Day 1: Opening Stock → Closing Stock → Fuel Refill (without new opening stock)
❌ Day 1: Fuel Refill (without opening stock)
❌ Day 1: Closing Stock (without opening stock)
```

## Error Messages

### Opening Stock Validation Errors:
1. **Duplicate Opening Stock**:
   > "An opening stock already exists for this date [date] without a subsequent closing stock. Please create a closing stock before adding another opening stock."

2. **Chronological Order**:
   > "New opening stock must be after the previous closing stock."

### Fuel Refill Validation Errors:
1. **Missing Opening Stock**:
   > "Opening stock for the tank on [date] not found. Create a new Opening Stock first."

2. **After Closing Stock**:
   > "Cannot add fuel refill after closing stock for [date]. Please create a new opening stock first."

## Benefits

### 1. Data Integrity
- Prevents orphaned opening stocks
- Ensures proper chronological sequence
- Maintains business logic compliance

### 2. User Guidance
- Clear error messages guide users to correct sequence
- Prevents confusion about stock entry order

### 3. System Consistency
- Aligns with business processes
- Supports proper reconciliation
- Enables accurate reporting

## Testing Scenarios

### Test Cases to Verify:
1. **✅ Valid Sequence**: Opening → Closing → Opening → Closing
2. **❌ Invalid Duplicate**: Opening → Opening (should fail)
3. **✅ First Opening**: Opening (first ever, should succeed)
4. **❌ Fuel Refill Before Opening**: Fuel Refill (should fail)
5. **❌ Closing Without Opening**: Closing (should fail)
6. **❌ Fuel Refill After Closing**: Opening → Closing → Fuel Refill (should fail)

### Expected Results:
- Valid sequences: Success with proper volume calculations
- Invalid sequences: Clear error messages with guidance
- System maintains data integrity throughout

## Impact

### Immediate Impact:
- ✅ Prevents creation of invalid stock sequences
- ✅ Provides clear user guidance
- ✅ Maintains data consistency

### Long-term Benefits:
- 📊 Improved reporting accuracy
- 🔄 Better reconciliation processes
- 📈 Enhanced system reliability
- 🎯 Proper business process compliance

## Related Files Updated:
- `OpeningStockCommand.cs` - Added sequence validation
- `CreateFuelRrefillCommand.cs` - Enhanced sequence validation
- `ClosingStockCommand.cs` - Already had proper validation
