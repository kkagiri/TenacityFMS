# Pump Transaction Report Template

This document describes the pre-built pump transaction report template.

## Template Location

```
FMS.WebClient/App_Data/ReportTemplates/pump-transaction-report.html
```

## Data Structure

The pump transaction report expects the following data structure:

```typescript
interface PumpTransactionReportData {
  // Report Metadata
  reportTitle: string;
  generatedAt: string;
  generatedBy: string;
  dateFrom: string;
  dateTo: string;
  reportId: string;

  // Filters Applied
  filters: {
    siteName: string | null;
    tankName: string | null;
    vehicleName: string | null;
    fuelGrade: string | null;
  };

  // Summary Statistics
  summary: {
    totalTransactions: number;
    totalVolume: string;
    totalAmount: string;
    uniqueVehicles: number;
    avgVolumePerTransaction: string;
    currency: string;
  };

  // Transaction Data
  transactions: PumpTransactionDto[];

  // Breakdown by Fuel Grade
  fuelGradeBreakdown: {
    fuelGradeName: string;
    transactionCount: number;
    totalVolume: string;
    totalAmount: string;
    percentage: string;
  }[];
}

interface PumpTransactionDto {
  rowNumber: number;
  dateTime: string;
  dateTimeStart: string;
  ptsName: string;
  pump: number;
  nozzle: number;
  transaction: string;
  vehicleName: string;
  vehicleNumberPlate: string;
  tankName: string;
  isTransferMode: boolean;
  fuelGradeName: string;
  volume: string;
  price: string;
  amount: string;
  odometer: string;
  employeeName: string;
  tag: string;
}
```

## API Endpoint

### Request

```http
POST /api/v1/reportgenerator/pump-transactions
Content-Type: application/json

{
  "dateFrom": "2026-01-01",
  "dateTo": "2026-01-21",
  "siteId": 1,
  "vehicleId": null,
  "tankId": null,
  "fuelGradeId": null,
  "format": "pdf"
}
```

### Response

Returns binary content with appropriate content-type:
- PDF: `application/pdf`
- Excel: `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
- HTML: `text/html`

## Frontend Usage

### Using Report Viewer

1. Navigate to `/reports/viewer`
2. Select "pump-transaction-report" from template dropdown
3. Set date range and optional filters
4. Click "Generate Report"

### Using Service Directly

```javascript
import reportingService from '../services/reportingService';

const generateReport = async () => {
  const result = await reportingService.generatePumpTransactionReport({
    dateFrom: '2026-01-01',
    dateTo: '2026-01-21',
    siteId: 1,
    format: 'pdf'
  });

  if (result.success) {
    reportingService.downloadReportFile(result.blob, result.fileName);
  }
};
```

## Template Sections

### 1. Header Section
- Report title
- Generation timestamp
- Date range
- Report ID

### 2. Filter Summary
- Shows which filters were applied
- Only displays non-null filter values

### 3. Summary Cards
- Total Transactions
- Total Volume (L)
- Total Amount ($)
- Unique Vehicles
- Average Volume per Transaction

### 4. Transactions Table
Columns:
| # | Date/Time | Start Time | PTS | Pump | Nozzle | Txn# | Vehicle | Plate | Tank | Mode | Fuel | Volume | Price | Amount | Odometer | Operator | Tag |

### 5. Fuel Grade Breakdown
Summary by fuel grade showing:
- Transaction count
- Total volume
- Total amount
- Percentage of total

### 6. Footer
- Report ID
- FMS Reporting System branding

## Customization

To modify the pump transaction report:

1. Navigate to `/reports/designer/pump-transaction-report`
2. Edit the HTML/Handlebars template
3. Use sample data to test changes
4. Save when satisfied

## Sample Output

### PDF Preview
The PDF output includes:
- A4 page size (default)
- Print-optimized styling
- Page breaks between sections if needed
- Corporate color scheme (blue headers)

### Excel Export
Excel export includes:
- All transaction data in tabular format
- Formatted headers
- Data types preserved (numbers, dates)

## Database Query

The report data is fetched using:

```csharp
var query = new GetPumpTransactionQuery
{
    StartDate = filters.DateFrom ?? DateTime.Today.AddDays(-30),
    EndDate = filters.DateTo ?? DateTime.Today,
    SiteId = filters.SiteId,
    VehicleId = filters.VehicleId,
    TankId = filters.TankId
};

var result = await _mediator.Send(query);
```

The query retrieves from the `pumptransactions` table with related entities:
- Vehicle details
- Tank information
- PTS configuration
- Fuel grade data

---

*Last Updated: January 21, 2026*
