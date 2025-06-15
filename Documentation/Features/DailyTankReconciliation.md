
# Daily Tank Reconciliation System

## Overview

The Daily Tank Reconciliation System is an automated solution that processes tank volume history data to generate daily reconciliation records, detect discrepancies, and provide comprehensive reporting for fuel management operations. This system converts the existing Python reconciliation script into a fully integrated C# solution within the FMS application.

## Features

### 1. Automated Daily Processing
- **Scheduled Execution**: Runs daily via background service
- **Policy-Based**: Integrates with the existing automated reconciliation policy system
- **Flexible Scheduling**: Configurable execution times and frequencies
- **Error Handling**: Comprehensive error handling and retry mechanisms

### 2. Comprehensive Reconciliation Logic
- **Opening/Closing Levels**: Calculates daily opening and closing tank levels
- **Transaction Aggregation**: Sums deliveries, transfers, and dispensing activities
- **Variance Detection**: Identifies discrepancies between expected and actual volumes
- **Multi-Tank Processing**: Processes multiple tanks simultaneously

### 3. Advanced Reporting & Analytics
- **Dashboard Integration**: Real-time dashboard with charts and statistics
- **Discrepancy Alerts**: Automated alerts for significant variances
- **Trend Analysis**: Historical variance trends and patterns
- **Export Capabilities**: Data export for external analysis

### 4. API Integration
- **RESTful APIs**: Complete API endpoints for all operations
- **Real-time Data**: Live data updates and processing status
- **Filtering Options**: Advanced filtering by site, tank, date range
- **Pagination Support**: Efficient data retrieval for large datasets

## Architecture

### Backend Components

#### 1. Commands & Queries (CQRS Pattern)
```
FMS.Application/Features/TankManagement/DailyTankReconciliation/
├── Commands/
│   ├── ProcessDailyReconciliationCommand.cs
│   └── ProcessDailyReconciliationCommandHandler.cs
└── Queries/
    ├── GetDailyReconciliationReportQuery.cs
    └── GetDailyReconciliationReportQueryHandler.cs
```

#### 2. Services
```
FMS.Application/Features/AutomatedReconciliation/Services/
└── DailyReconciliationPolicyService.cs
```

#### 3. Controllers
```
FMS.Application/Features/TankManagement/DailyTankReconciliation/Controllers/
└── DailyTankReconciliationController.cs
```

### Frontend Components

#### 1. Dashboard Component
```
FMS.frontend/src/components/DailyTankReconciliation/
├── DailyReconciliationDashboard.jsx
└── DailyReconciliationDashboard.css
```

## Database Schema

### Existing Table: `dailytankreconciliation`
```sql
CREATE TABLE dailytankreconciliation (
    Id INT PRIMARY KEY AUTO_INCREMENT,
    TankId INT NOT NULL,
    ReconciliationDate DATETIME NOT NULL,
    OpeningLevel DECIMAL(10,2),
    ClosingLevel DECIMAL(10,2),
    TotalRefills DECIMAL(10,2),
    TotalDeliveries DECIMAL(10,2),
    TotalTransfersIn DECIMAL(10,2),
    TotalTransfersOut DECIMAL(10,2),
    CreatedOn DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (TankId) REFERENCES tanks(Id)
);
```

## API Endpoints

### 1. Process Daily Reconciliation
```http
POST /api/DailyTankReconciliation/process
Content-Type: application/json

{
    "startDate": "2025-01-15",
    "endDate": "2025-01-15",
    "siteId": 1,
    "tankId": null,
    "forceReprocess": false
}
```

### 2. Get Reconciliation Report
```http
GET /api/DailyTankReconciliation/report?startDate=2025-01-01&endDate=2025-01-15&pageNumber=1&pageSize=50
```

### 3. Process Yesterday's Data
```http
POST /api/DailyTankReconciliation/process-yesterday?siteId=1
```

### 4. Get Summary Statistics
```http
GET /api/DailyTankReconciliation/summary?days=7&siteId=1
```

### 5. Get Discrepancy Alerts
```http
GET /api/DailyTankReconciliation/alerts?days=3&siteId=1
```

## Configuration

### 1. Background Service Configuration
```json
{
  "AutomatedReconciliation": {
    "ExecutionIntervalMinutes": 60,
    "DailyReconciliation": {
      "Enabled": true,
      "ExecutionTime": "02:00",
      "VarianceThreshold": 5.0,
      "CreateDiscrepancyRecords": true
    }
  }
}
```

### 2. Policy Configuration
```csharp
var policy = new ReconciliationPolicy
{
    Name = "Daily Tank Reconciliation",
    PolicyType = "DailyReconciliation",
    ExecutionType = "Scheduled",
    ScheduleFrequencyHours = 24,
    VarianceThresholdLiters = 5.0m,
    Configuration = new Dictionary<string, object>
    {
        ["TargetDateOffset"] = -1, // Process previous day
        ["CreateDiscrepancyRecords"] = true,
        ["AutoResolveSmallVariances"] = true
    }
};
```

## Usage Examples

### 1. Manual Processing via API
```javascript
// Process reconciliation for a specific date range
const response = await fetch('/api/DailyTankReconciliation/process', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        startDate: '2025-01-15',
        endDate: '2025-01-15',
        siteId: 1
    })
});

const result = await response.json();
console.log(`Processed ${result.data.totalTanksProcessed} tanks`);
```

### 2. Dashboard Integration
```javascript
// Load dashboard data
const loadDashboardData = async () => {
    const [report, summary, alerts] = await Promise.all([
        fetch('/api/DailyTankReconciliation/report?startDate=2025-01-01&endDate=2025-01-15'),
        fetch('/api/DailyTankReconciliation/summary?days=7'),
        fetch('/api/DailyTankReconciliation/alerts?days=3')
    ]);

    // Process and display data
};
```

## Business Logic

### 1. Reconciliation Calculation
```
Expected Closing Volume = Opening Volume + Deliveries + Transfers In - Dispensing - Transfers Out
Variance = |Actual Closing Volume - Expected Closing Volume|
Has Discrepancy = Variance > Threshold (default: 1.0L)
```

### 2. Discrepancy Severity Classification
- **Critical**: Variance ≥ 5x threshold
- **High**: Variance ≥ 3x threshold
- **Medium**: Variance ≥ 2x threshold
- **Low**: Variance < 2x threshold

### 3. Business Impact Calculation
```
Business Impact = Variance (L) × Average Fuel Cost per Liter
```

## Integration with Existing Systems

### 1. Automated Reconciliation Policies
- Integrates seamlessly with existing policy engine
- Supports all policy execution types (scheduled, event-driven, manual)
- Creates discrepancy records for automated resolution

### 2. Background Services
- Extends existing `AutomatedReconciliationBackgroundService`
- Shares logging and error handling infrastructure
- Uses same dependency injection container

### 3. Dashboard Integration
- Follows existing UI/UX patterns
- Uses established component library (Ant Design)
- Integrates with existing navigation and authentication

## Monitoring & Alerting

### 1. Logging
- Structured logging with correlation IDs
- Performance metrics and execution times
- Error tracking and stack traces

### 2. Metrics
- Processing success/failure rates
- Average processing times
- Discrepancy detection rates
- System resource utilization

### 3. Alerts
- Real-time discrepancy notifications
- Processing failure alerts
- Performance degradation warnings

## Deployment

### 1. Database Migration
```sql
-- Ensure dailytankreconciliation table exists with proper indexes
CREATE INDEX idx_dailytankreconciliation_tank_date ON dailytankreconciliation(TankId, ReconciliationDate);
CREATE INDEX idx_dailytankreconciliation_date ON dailytankreconciliation(ReconciliationDate);
```

### 2. Service Registration
```csharp
// In Program.cs or Startup.cs
services.AddScoped<DailyReconciliationPolicyService>();
services.AddMediatR(typeof(ProcessDailyReconciliationCommand));
```

### 3. Background Service Configuration
```csharp
services.AddHostedService<AutomatedReconciliationBackgroundService>();
```

## Testing

### 1. Unit Tests
- Command/Query handler tests
- Service logic validation
- Business rule verification

### 2. Integration Tests
- API endpoint testing
- Database integration
- Background service execution

### 3. Performance Tests
- Large dataset processing
- Concurrent execution scenarios
- Memory and CPU utilization

## Maintenance

### 1. Data Retention
- Configure retention policies for historical data
- Archive old reconciliation records
- Cleanup temporary processing data

### 2. Performance Optimization
- Monitor query performance
- Optimize database indexes
- Implement caching where appropriate

### 3. Error Handling
- Implement retry mechanisms
- Dead letter queue for failed processing
- Comprehensive error logging

## Migration from Python Script

### Key Improvements
1. **Performance**: C# implementation with optimized database queries
2. **Integration**: Native integration with existing FMS systems
3. **Scalability**: Supports concurrent processing and large datasets
4. **Monitoring**: Built-in logging, metrics, and alerting
5. **User Interface**: Rich dashboard with real-time updates
6. **API Access**: RESTful APIs for external integrations

### Migration Steps
1. Deploy new C# implementation
2. Run parallel processing to validate results
3. Gradually phase out Python script
4. Update any external dependencies
5. Train users on new dashboard interface

## Support & Troubleshooting

### Common Issues
1. **Processing Failures**: Check logs for database connectivity or data integrity issues
2. **Performance Issues**: Monitor database query performance and optimize indexes
3. **Discrepancy Alerts**: Validate tank volume history data quality
4. **Dashboard Loading**: Check API connectivity and authentication

### Contact Information
- Development Team: [development@fms.com]
- System Administrator: [admin@fms.com]
- Documentation: [Internal Wiki Link]