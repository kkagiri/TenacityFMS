# Quick Start: Correcting Tank Volume Data

## 🚨 Emergency Fix (5 Minutes)

If you need to fix the ST7 spike **right now**:

```bash
# Step 1: Verify the problem exists
curl -X GET "https://your-server/api/tankvolumedatacorrection/validate-tank/7?fromDate=2025-11-05&toDate=2025-11-05" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"

# You should see:
# "isValid": false
# "variance": 646.00
# "severity": "HIGH"

# Step 2: Execute the fix
curl -X POST "https://your-server/api/tankvolumedatacorrection/correct-recalculate" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "tankId": 7,
    "fromDate": "2025-11-05",
    "toDate": "2025-11-05"
  }'

# You should see:
# "success": true
# "transactionsCorrected": 3
# "message": "Successfully recalculated 87 transactions, corrected 3 volumes..."

# Step 3: Verify it's fixed
curl -X GET "https://your-server/api/tankvolumedatacorrection/validate-tank/7?fromDate=2025-11-05&toDate=2025-11-05" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"

# You should now see:
# "isValid": true
# "sequenceBreaks": []
```

---

## 📋 Complete Correction Workflow (30 Minutes)

### For All Affected Tanks

```bash
# PHASE 1: DETECT
# Find all tanks with corruption

curl -X GET "https://your-server/api/tankvolumedatacorrection/detect-breaks?fromDate=2025-11-01" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  > breaks.json

# Open breaks.json and note:
# - How many tanks affected
# - Which dates have breaks
# - Severity of each break

# PHASE 2: ANALYZE
# Create correction plan

curl -X POST "https://your-server/api/tankvolumedatacorrection/generate-plan" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d @breaks.json \
  > correction_plan.json

# Review correction_plan.json to understand:
# - Total breaks: X
# - Affected tanks: Y
# - Steps needed: Z

# PHASE 3: CORRECT
# Execute corrections for each affected tank

# Create correction_requests.json with format:
cat > correction_requests.json << 'EOF'
[
  {
    "correctionType": "RECALCULATE",
    "tankId": 7,
    "fromDate": "2025-11-05",
    "toDate": "2025-11-05"
  },
  {
    "correctionType": "RECALCULATE",
    "tankId": 5,
    "fromDate": "2025-11-05",
    "toDate": "2025-11-05"
  },
  {
    "correctionType": "RECALCULATE",
    "tankId": 15,
    "fromDate": "2025-11-04",
    "toDate": "2025-11-04"
  }
]
EOF

# Execute all corrections
curl -X POST "https://your-server/api/tankvolumedatacorrection/correct-bulk" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d @correction_requests.json \
  > correction_results.json

# Check results
cat correction_results.json | grep "successfulCorrectionCount"
# Should show: "successfulCorrectionCount": 3

# PHASE 4: VERIFY
# Confirm all breaks are resolved

curl -X GET "https://your-server/api/tankvolumedatacorrection/detect-breaks?fromDate=2025-11-01" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  > after_breaks.json

# Should show much fewer or zero breaks
```

---

## 🔧 Using the API from Code

### From C# Application

```csharp
// Inject the services
public class TankDataMaintenanceService
{
    private readonly ITankVolumeHistoryValidationService _validationService;
    private readonly ITankVolumeCorrectionService _correctionService;

    public TankDataMaintenanceService(
        ITankVolumeHistoryValidationService validationService,
        ITankVolumeCorrectionService correctionService)
    {
        _validationService = validationService;
        _correctionService = correctionService;
    }

    // Quick fix for a single tank
    public async Task QuickFixTankAsync(int tankId, DateTime date)
    {
        // Detect
        var validation = await _validationService.ValidateTankVolumeSequenceAsync(
            tankId, date, date);

        if (!validation.IsValid)
        {
            // Correct
            var result = await _correctionService.RecalculateTankVolumesAsync(
                tankId, date, date, "System", CancellationToken.None);

            Console.WriteLine(result.Message);
        }
    }

    // Detect all problems across system
    public async Task ScanForCorruptionAsync()
    {
        var breaks = await _validationService.DetectAllSequenceBreaksAsync();

        if (breaks.Any())
        {
            Console.WriteLine($"Found {breaks.Count} breaks:");
            foreach (var b in breaks)
            {
                Console.WriteLine(
                    $"Tank {b.TankId} Txn {b.AffectedTransactionId}: " +
                    $"Expected {b.ExpectedVolume}L, got {b.ActualVolume}L");
            }
        }
    }

    // Fix everything at once
    public async Task FixAllCorruptionAsync()
    {
        // Detect
        var breaks = await _validationService.DetectAllSequenceBreaksAsync();

        if (!breaks.Any())
        {
            Console.WriteLine("No corruption found");
            return;
        }

        // Analyze
        var plan = await _validationService.GenerateCorrectionPlanAsync(breaks);

        // Create correction requests
        var corrections = new List<BulkCorrectionRequest>();

        foreach (var tank in plan.CorrectionSteps.Keys)
        {
            var tankBreaks = plan.BreaksByTank[tank];
            var minDate = tankBreaks.Min(b => b.TransactionTimestamp).Date;
            var maxDate = tankBreaks.Max(b => b.TransactionTimestamp).Date;

            corrections.Add(new BulkCorrectionRequest
            {
                CorrectionType = "RECALCULATE",
                TankId = tank,
                FromDate = minDate,
                ToDate = maxDate
            });
        }

        // Correct
        var result = await _correctionService.ExecuteBulkCorrectionAsync(
            corrections, "System", CancellationToken.None);

        Console.WriteLine($"Correction complete: {result.SuccessfulCorrectionCount} successful, " +
                         $"{result.FailedCorrectionCount} failed");
    }
}
```

---

## 🎯 Decision Matrix

### Which correction strategy should I use?

```
Do you have valid                YES        Use RECALCULATE
opening stock for                          (Bulk rebuild from baseline)
affected date?
                           NO → Manual check/create opening stock first

Do you know EXACTLY             YES       Use MANUAL
what one transaction's                    (Override with your verified value)
volume should be?
                           NO → Use RECALCULATE

Is only ONE                     YES       Use RECALCULATE_SINGLE
transaction broken?                       (Fix one, cascade downstream)

                           NO → Use RECALCULATE or FROM_POINT

Does corruption span             YES      Use RECALCULATE_FROM_POINT
multiple dates and you           (Fix from known corruption point forward)
know where it starts?
                           NO → Use RECALCULATE for each date

Multiple different issues        YES      Use correct-bulk
on different tanks?              (Execute multiple corrections in sequence)
```

---

## ⚠️ Before You Start

### Mandatory Checklist

- [ ] **BACKUP DATABASE** - This is critical!
  ```bash
  # SQL Server example
  sqlcmd -S your-server -d GpsData -Q "BACKUP DATABASE GpsData TO DISK='C:\Backups\GpsData_PreCorrection.bak'"
  ```

- [ ] **Check opening stock exists** for affected dates
  ```bash
  curl -X GET "https://your-server/api/tankstock/openingstock/tank/7?date=2025-11-05" \
    -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
  ```

- [ ] **Disable automated jobs** during correction
  - Pause TankMonitoringService
  - Pause AutomatedReconciliationBackgroundService
  - Stop any bulk import jobs

- [ ] **Notify users** that tank reports will be offline
  - Example: "Tank stock reports being maintained 2-3 PM, please plan accordingly"

### Post-Correction Checklist

- [ ] **Re-run DETECT** to confirm all breaks resolved
- [ ] **Check closing stocks** match expected values
- [ ] **Review reconciliation analysis** for affected dates
- [ ] **Validate any dependent reports** (fuel reports, variance analysis)
- [ ] **Re-enable automated jobs**
- [ ] **Audit log** who made what corrections and when

---

## 🐛 Troubleshooting

### Problem: "No opening stock found"

```bash
# Check if opening stock exists
curl -X GET "https://your-server/api/tankstock/openingstock?tankId=7&date=2025-11-05" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"

# If not found, create one manually using the app, or:
# POST to /api/tankstock/opening with:
# { "tankId": 7, "date": "2025-11-05", "quantity": 41652.00 }
```

### Problem: Negative volumes after correction

```bash
# Immediately check your data
curl -X GET "https://your-server/api/tankvolumedatacorrection/validate-tank/7" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"

# This indicates VolumeChange signs are wrong
# Dispensing should be NEGATIVE, Delivery should be POSITIVE
# Contact backend team to investigate
```

### Problem: Correction says "success" but volumes still wrong

```bash
# Re-run validation
curl -X GET "https://your-server/api/tankvolumedatacorrection/validate-tank/7" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"

# If still showing breaks:
# - Opening stock might be wrong
# - VolumeChange values might be corrupted
# - Multiple issues might need sequential fixes
```

---

## 📊 Monitoring Corrections

### Check what corrections were made

```bash
# View audit logs (if implemented)
SELECT * FROM CorrectionAuditLog
WHERE TankId = 7
  AND CorrectionDate >= '2025-11-05'
ORDER BY CorrectionDate DESC

# View before/after
SELECT Id, TankId, Timestamp, VolumeChange, NewVolume, ChangeReason
FROM TankVolumeHistory
WHERE TankId = 7
  AND Timestamp >= '2025-11-05 00:00:00'
  AND Timestamp < '2025-11-06 00:00:00'
ORDER BY Timestamp, Id
```

### Monitor correction jobs

```bash
# Check application logs
grep "RECALCULATE" /var/log/fms/app.log | tail -20
grep "Successfully recalculated" /var/log/fms/app.log
grep "Corrected.*transactions" /var/log/fms/app.log
```

---

## 🎓 Understanding What Got Fixed

### Your Specific Case (ST7 on 05/11/2025)

**Before Correction:**
```
Transaction ID | Reason      | Change  | Expected Volume | Actual Volume | Status
1023          | KCQ148A -40 | -40.00  | 41,652.00       | 41,612.00     | ✓ Correct
...
1028          | KBH797Q -51 | -51.00  | 41,721.00       | 42,367.00     | ✗ BROKEN (+646L)
1029          | TP107 -100  | -100.00 | 41,621.00       | 42,267.00     | ✗ CASCADED
```

**After RECALCULATE Correction:**
```
Transaction ID | Reason      | Change  | Expected Volume | Actual Volume | Status
1023          | KCQ148A -40 | -40.00  | 41,652.00       | 41,612.00     | ✓ Correct
...
1028          | KBH797Q -51 | -51.00  | 41,721.00       | 41,721.00     | ✓ FIXED
1029          | TP107 -100  | -100.00 | 41,621.00       | 41,621.00     | ✓ FIXED
```

The 3 corrupted transactions were:
1. KBH797Q dispensing (variance: 646L)
2. TP107 dispensing (variance: 646L)
3. Closing stock (adjusted for cascade)

---

## 📞 Getting Help

If corrections fail:
1. Check logs: `/var/log/fms/app.log` or Application Insights
2. Verify opening stock exists and is correct
3. Ensure you have admin permissions
4. Try single tank correction before bulk
5. Contact: `support@fms-system.local` with:
   - Tank ID and dates affected
   - Screenshot of validation output
   - Error message from correction attempt

---

## ✅ Success Criteria

After corrections are complete, you should see:

✓ All sequence breaks detected before → Now resolved
✓ Closing stock = Opening + Deliveries - Dispensing - TransfersOut + TransfersIn
✓ No reconciliation discrepancies for corrected dates
✓ Tank volume trend is smooth (no unexplained jumps)
✓ Report reconciliation analysis shows balanced variance

