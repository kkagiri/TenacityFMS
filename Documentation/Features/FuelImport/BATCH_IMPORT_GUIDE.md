# Batch Import Feature - Multiple File Upload

## Overview
The Batch Import feature allows users to upload and import multiple fuel report Excel files simultaneously for different sites and months. This significantly improves efficiency when dealing with multiple reports at once.

## Feature Location
- **Main Screen**: FuelReportImporter component
- **Button**: "Batch Import" button in the header (green button next to "Import Calendar")
- **Component**: `BatchImportPopup.js`

## How It Works

### 1. Opening Batch Import
Click the **"Batch Import"** button in the header of the Fuel Report Importer page.

### 2. Adding Files
- Click **"Add Files"** button
- Select multiple Excel files (.xlsx) at once using your file browser
- Files will be added to the grid for configuration

### 3. Automatic Detection
The system automatically detects:

#### Site Detection
Detects site name from filename patterns:
- Example: `Embassy_Jan2025.xlsx` → Detects "Embassy" site
- Example: `KIPEVU_February.xlsx` → Detects "Kipevu" site
- Matches are case-insensitive

#### Month Detection
Detects month from various filename patterns:
- Month names: `January`, `Jan`, `February`, `Feb`, etc.
- Date patterns: `01-2025`, `01_2025`, `2025-01`
- Combined: `Embassy_Jan2025.xlsx` → `2025-01`
- Example: `Report_February_2025.xlsx` → `2025-02`

### 4. Configuration Grid
Each file appears in a grid with the following columns:

| Column | Description | Editable |
|--------|-------------|----------|
| **File Name** | Name of the uploaded file | No |
| **Size** | File size (KB/MB) | No |
| **Site** | Dropdown to select/confirm site | Yes |
| **Report Type** | Select km/l or l/hr | Yes |
| **Month** | Month picker (YYYY-MM format) | Yes |
| **Skip Rows** | Number of header rows to skip | Yes |
| **Status** | Current import status | No |
| **Actions** | Remove file button | Yes |

### 5. Configuring Files
For each file in the grid:
1. **Verify Site**: Check auto-detected site or select manually from dropdown
2. **Select Report Type**: Choose "km/l" or "l/hr"
3. **Set Month**: Verify auto-detected month or select manually
4. **Adjust Skip Rows**: Default is 8 for km/l, 6 for l/hr (can be changed)

### 6. Starting Import
1. Review all files in the grid
2. Ensure all required fields are filled (Site, Report Type)
3. Click **"Start Import"** button
4. Files will be processed **sequentially** (one at a time)

### 7. Import Process
- Files are imported one by one in order
- **Status updates**:
  - 🕐 **Pending** (gray) - Waiting to be processed
  - 🔄 **Processing** (blue, spinning) - Currently importing
  - ✅ **Success** (green) - Imported successfully
  - ❌ **Failed** (red) - Import failed

### 8. Progress Tracking
- Watch status column for real-time updates
- Current file being processed is highlighted
- Import continues even if one file fails
- Can see which files succeeded and which failed

## Features

### Smart Detection
- **Auto-detection** of site from filename
- **Auto-detection** of month from filename patterns
- Reduces manual configuration time

### Flexible Configuration
- Edit any detected value before import
- Different report types per file
- Different sites per file
- Different month per file

### Validation
Before import starts, the system validates:
- ✅ Site is selected for each file
- ✅ Report type is selected for each file
- ✅ km/l reports have a site selected
- ❌ Shows validation errors if any required fields are missing

### Error Handling
- If a file fails, import continues with remaining files
- Error messages displayed in status column
- Can retry failed files individually

### Batch Operations
- **Add Files**: Add multiple files at once
- **Clear All**: Remove all files from the list
- **Remove**: Remove individual files

## File Naming Conventions

### Recommended Patterns
For best auto-detection, name files like:
1. `{SiteName}_{Month}{Year}.xlsx`
   - Example: `Embassy_Jan2025.xlsx`
   - Example: `KIPEVU_February2025.xlsx`

2. `{SiteName}_{MM-YYYY}.xlsx`
   - Example: `Embassy_01-2025.xlsx`
   - Example: `Kipevu_02-2025.xlsx`

3. `{SiteName}_{MonthName}_{Year}.xlsx`
   - Example: `Embassy_January_2025.xlsx`
   - Example: `KIPEVU_Feb_2025.xlsx`

### Month Name Patterns Supported
- Full names: January, February, March, April, May, June, July, August, September, October, November, December
- Short forms: Jan, Feb, Mar, Apr, May, Jun, Jul, Aug, Sep, Oct, Nov, Dec
- Numeric: 01, 02, 03, ..., 12 (when combined with year)

## Use Cases

### Monthly Bulk Import
Upload all sites' reports for a specific month:
```
Embassy_Jan2025.xlsx
Kipevu_Jan2025.xlsx
Olkaria_Jan2025.xlsx
Athi_River_Jan2025.xlsx
```

### Site Quarterly Import
Upload multiple months for one site:
```
Embassy_Jan2025.xlsx
Embassy_Feb2025.xlsx
Embassy_Mar2025.xlsx
```

### Mixed Import
Upload various files from different sites and months:
```
Embassy_Jan2025.xlsx
Kipevu_Feb2025.xlsx
Olkaria_Jan2025.xlsx
Embassy_Mar2025.xlsx
```

## Technical Details

### Frontend Components
- **BatchImportPopup.js**: Main batch import popup component
- **BatchImportPopup.scss**: Styling for batch import
- Integration in **FuelReportImporter.js**

### Data Flow
1. User selects multiple files
2. Files are read using FileReader API
3. Each file is parsed with XLSX library
4. Data is mapped based on report type (km/l or l/hr)
5. Data is validated
6. Files are imported sequentially via Redux action `uploadFuelReport`
7. Status updates in real-time

### Import Order
Files are imported in the order they appear in the grid (typically the order they were selected).

### Performance
- **Sequential processing** prevents server overload
- Each file waits for previous file to complete
- Typical processing time: 5-30 seconds per file depending on size

## Best Practices

### Before Upload
1. ✅ Ensure all Excel files follow the standard template format
2. ✅ Name files with site and month for auto-detection
3. ✅ Verify data quality in Excel before upload
4. ✅ Keep file sizes reasonable (< 5MB recommended)

### During Upload
1. ✅ Review auto-detected values
2. ✅ Correct any misdetected sites or months
3. ✅ Verify skip rows setting matches your file
4. ✅ Remove any incorrect files before starting import

### After Upload
1. ✅ Check status column for any failures
2. ✅ Review import success notifications
3. ✅ Use Import Calendar to verify data was imported
4. ✅ Retry failed files individually if needed

## Troubleshooting

### Site Not Detected
**Problem**: Site shows "Not detected"
**Solution**:
- Manually select site from dropdown
- Or rename file to include site name
- Example: `Embassy_Jan2025.xlsx`

### Month Not Detected
**Problem**: Month field is empty
**Solution**:
- Manually select month using month picker
- Or rename file to include month
- Use format: `SiteName_MonthYear.xlsx`

### Import Failed
**Problem**: Status shows "Failed" with red icon
**Solution**:
- Check error message in status column
- Verify Excel file follows correct template
- Check that skip rows setting is correct
- Ensure vehicles exist in the system
- Try importing file individually for detailed error messages

### Validation Errors Before Import
**Problem**: Can't start import, validation errors shown
**Solution**:
- Review error messages
- Fill in missing required fields (Site, Report Type)
- Ensure km/l reports have site selected

## Limitations

### Current Limitations
1. Files are processed sequentially (not in parallel)
2. Cannot pause/resume batch import once started
3. Duplicate handling applies to all files (cannot be set per-file)
4. Must wait for entire batch to complete

### File Requirements
- Must be .xlsx format (Excel 2007+)
- Must follow standard fuel report template
- Skip rows must match file format
- Vehicles must exist in system

## Future Enhancements

### Potential Improvements
- [ ] Pause/resume batch import
- [ ] Parallel processing for faster imports
- [ ] Per-file duplicate handling settings
- [ ] Drag & drop file upload
- [ ] Import history/log
- [ ] Retry failed files with one click
- [ ] Import from folder (select multiple files from folder structure)
- [ ] Progress bar showing overall completion
- [ ] Export batch configuration for later use

## Summary

The Batch Import feature significantly improves productivity when handling multiple fuel reports:
- **Saves Time**: Upload multiple files at once instead of one by one
- **Smart Detection**: Automatically detects site and month from filenames
- **Flexible**: Edit any configuration before import
- **Reliable**: Sequential processing with status tracking
- **Transparent**: Real-time status updates for each file

Use this feature when you have multiple reports to import, especially during end-of-month processing or when catching up on delayed reports.
