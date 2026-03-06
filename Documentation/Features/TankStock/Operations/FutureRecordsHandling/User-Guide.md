# Tank Stock Future Records - User Guide

## Overview

When entering historical tank stock data (for past dates), the FMS system now provides intelligent warnings and controls to prevent data integrity issues. This guide explains how the system works and what to expect when entering historical data.

## What Are "Future Records"?

Future records are tank stock transactions that exist in the system for dates **after** the date you're trying to enter historical data for.

### Example Scenario
- Today is January 30th
- You want to enter opening stock for January 15th
- The system already has records for January 16th-29th
- Those records from January 16th-29th are considered "future records" relative to your January 15th entry

## System Behavior

The system will check for future records when you:
- Select a **past date** for any stock entry
- Enter **opening stock**, **closing stock**, **fuel refills**, or **tank transfers** for historical dates

### When Will You See Warnings?

You'll see warnings when:
1. **Historical Date Selected**: You choose a date before today
2. **Future Records Exist**: There are already stock transactions after your selected date
3. **Policy Requires Warning**: Your organization's policy is set to warn users

## Warning Types

### 🚫 **Entry Blocked**
- **What it means**: Historical entries are not allowed when future records exist
- **What you see**: Red error message with "Entry Blocked" title
- **What you can do**:
  - Change the date to today or a future date
  - Contact your administrator to change the policy
  - Remove future records (if you have permission)

### ⚠️ **Manual Reconciliation Required**
- **What it means**: Entry is allowed but may affect future calculations
- **What you see**: Orange warning with "Confirmation Required" title
- **What you can do**:
  - Click **"Proceed Anyway"** to continue with the entry
  - Click **"Cancel"** to choose a different date
  - **Important**: Manual reconciliation may be needed after entry

### ⚠️ **Automatic Recalculation Warning**
- **What it means**: Entry will automatically recalculate future records
- **What you see**: Yellow warning with recalculation notice
- **What you can do**:
  - Click **"Proceed Anyway"** to continue (system will recalculate)
  - Click **"Cancel"** to choose a different date
  - **Note**: All future calculations will be updated automatically

### ℹ️ **Information Only**
- **What it means**: Entry is allowed with automatic recalculation
- **What you see**: Blue informational message
- **What you can do**: Continue normally - no action required

## Step-by-Step Guide

### Entering Historical Opening Stock

1. **Open the Opening Stock Form**
   - Navigate to Tank Stock → Opening Stock
   - The form will open with today's date selected

2. **Select Historical Date**
   - Change the date to your desired past date
   - **Wait for validation** - you'll see a "Validating..." message briefly

3. **Select Site and Tank**
   - Choose your site from the dropdown
   - Select the specific tank
   - If you change the tank, validation will run again

4. **Review Any Warnings**
   - If warnings appear, read them carefully
   - Understand the impact on future records
   - Decide whether to proceed or choose a different date

5. **Enter Amount and Submit**
   - Enter the stock amount
   - If warnings were shown and you confirmed, the Save button will be enabled
   - Click Save to complete the entry

### Warning Dialog Actions

#### When You See "Confirmation Required"
```
⚠️ Confirmation Required
Warning: 15 future records exist after 2024-01-15. This entry will affect
volume calculations and may require manual reconciliation.
(15 future records affected)

Current policy: WARN_RECONCILE • Manual reconciliation recommended after entry

[Proceed Anyway] [Cancel]
```

**Options:**
- **Proceed Anyway**: Continue with the entry, understanding that you may need to reconcile manually
- **Cancel**: Dismiss the warning and choose a different approach

#### When You See "Entry Blocked"
```
🚫 Entry Blocked
Historical entry blocked: 23 future records exist after 2024-01-10.
Next record: 2024-01-11 08:30 (Delivery). Contact administrator to
change policy or remove future records.

Current policy: BLOCK

[OK]
```

**Options:**
- **OK**: Acknowledge the message and choose a different date or contact administrator

## Best Practices

### ✅ **Recommended Approaches**

1. **Enter Data Chronologically**
   - Enter stock data in date order when possible
   - This avoids future records conflicts

2. **Use Current Date When Possible**
   - For real-time stock taking, use today's date
   - Historical entries should be for genuine corrections only

3. **Understand the Impact**
   - Historical entries affect all subsequent calculations
   - Consider whether manual reconciliation is needed

4. **Check for Existing Records**
   - Review existing data before making historical entries
   - Avoid duplicate or conflicting entries

### ❌ **What to Avoid**

1. **Ignoring Warnings**
   - Don't proceed without understanding the impact
   - Warnings are there to protect data integrity

2. **Excessive Historical Entries**
   - Avoid making many historical entries at once
   - This can complicate reconciliation

3. **Inconsistent Data**
   - Ensure historical entries align with known facts
   - Incorrect historical data can cascade errors

## Understanding Your Organization's Policy

Your system administrator has configured how historical entries are handled:

### **Strict Policy (BLOCK)**
- Maximum data protection
- No historical entries allowed when future records exist
- Requires administrator intervention or data cleanup

### **Controlled Policy (WARN_RECONCILE)**
- Balanced approach with user responsibility
- Allows historical entries with clear warnings
- Recommends manual reconciliation after entry

### **Flexible Policy (WARN_RECALCULATE)**
- Automatic recalculation with user awareness
- Warns about automatic changes to future data
- System handles recalculation automatically

### **Open Policy (ALLOW_RECALCULATE)**
- Maximum flexibility with automatic handling
- Minimal warnings, automatic recalculation
- Suitable for environments with reliable historical data

## Troubleshooting

### **Warning Doesn't Appear**
- **Check Date**: Ensure you selected a past date
- **Check Connection**: Verify your internet connection
- **Refresh Page**: Try refreshing the browser page

### **Cannot Submit After Confirming**
- **Check All Fields**: Ensure all required fields are filled
- **Wait for Validation**: Allow validation to complete
- **Try Again**: Sometimes a second confirmation is needed

### **Validation Takes Too Long**
- **Check Network**: Verify your internet connection is stable
- **Contact Support**: If validation consistently fails or times out

### **Unexpected Blocking**
- **Check Policy**: Your organization's policy may have changed
- **Contact Administrator**: They can explain current settings
- **Use Current Date**: Consider using today's date instead

## Getting Help

### **When to Contact Support**
- Validation errors persist
- Policy seems incorrect for your needs
- System behaves unexpectedly
- Need policy changes for your organization

### **Information to Provide**
- Specific date and tank you're trying to enter
- Exact warning message received
- Your user role and permissions
- Business justification for historical entry

### **Quick Self-Help**
1. Try using today's date instead
2. Check if the data already exists
3. Verify you have the correct permissions
4. Clear browser cache if behavior is inconsistent

## FAQ

### **Q: Why can't I enter historical data like before?**
A: The system now prevents data integrity issues by checking for future records. This protects the accuracy of your tank calculations.

### **Q: Can I turn off these warnings?**
A: Only system administrators can modify the policy. Contact them if the current settings don't suit your workflow.

### **Q: What happens if I proceed with a warning?**
A: Depending on your policy, the system may automatically recalculate future records or require you to manually reconcile the data.

### **Q: How far back can I enter historical data?**
A: This depends on your organization's settings. The default limit is 30 days, but administrators can adjust this.

### **Q: Will this affect my existing data?**
A: No, existing data is not changed. Only new historical entries are subject to these validations.

### **Q: What if I need to enter data from months ago?**
A: Contact your administrator. They can temporarily adjust settings or help you with the data entry process.

## Related Procedures
- [Opening Stock Entry Process](opening-stock-procedure.md)
- [Closing Stock Entry Process](closing-stock-procedure.md)
- [Tank Transfer Process](tank-transfer-procedure.md)
- [Fuel Refill Entry Process](fuel-refill-procedure.md)
- [Data Reconciliation Guide](data-reconciliation-guide.md)
