# DevExtreme Reporting Module - Installation & Configuration

## Prerequisites

- .NET Core 6.0+ (Backend)
- React 18+ (Frontend)
- DevExtreme React 23.2.8+ (Already installed)
- ExcelJS 4.4.0+ (Already installed)
- MediatR (For CQRS pattern)

## Backend Installation

### Step 1: Register Services

In your `FMS.WebClient/Extensions/FmsServiceCollectionExtensions.cs` or `Program.cs`, add:

```csharp
using FMS.Application.Features.Reporting.Services;

// Add to ConfigureServices or builder.Services
services.AddSingleton<IReportDefinitionService, ReportDefinitionService>();
services.AddScoped<IReportGenerationService, ReportGenerationService>();

// Register HttpClient for internal API calls (if using ReportGenerationService)
services.AddHttpClient("InternalApi", client =>
{
    client.BaseAddress = new Uri("https://localhost:5001"); // Your API base URL
    // Add authentication if needed
});

// MediatR should already be registered, but if not:
services.AddMediatR(cfg => cfg.RegisterServicesFromAssembly(typeof(GenerateReportCommand).Assembly));
```

### Step 2: Verify Controller Registration

The `ReportingController` should be auto-discovered by ASP.NET Core. Verify it's accessible:

```bash
GET https://your-api-url/api/v1/Reporting/definitions
```

### Step 3: Configure Permissions (Optional)

If using permission-based access, ensure these permissions exist in your system:
- `_Read_tankVolumeHistory`
- `_Read_tankStock`
- Or create custom permissions for your reports

### Step 4: Configure Built-in Reports

Edit `FMS.Application/Features/Reporting/Services/ReportDefinitionService.cs`:

```csharp
private void InitializeBuiltInReports()
{
    // Tank Volume History Report is already included

    // Add your custom reports here:
    _reportDefinitions.Add(new ReportDefinitionDTO
    {
        ReportId = "your-report-id",
        ReportName = "Your Report Name",
        // ... configuration
    });
}
```

### Step 5: Build Backend

```bash
cd FMS.WebClient
dotnet build
dotnet run
```

Verify the API is running and accessible.

## Frontend Installation

### Step 1: Verify Dependencies

Check `package.json` has these packages (they should already be installed):

```json
{
  "dependencies": {
    "devextreme": "23.2.8",
    "devextreme-react": "23.2.8",
    "devextreme-exceljs-fork": "^4.4.2",
    "exceljs": "^4.4.0",
    "file-saver": "^2.0.5"
  }
}
```

If any are missing:

```bash
cd fms.frontend
npm install devextreme devextreme-react exceljs file-saver
```

### Step 2: Configure Routes

Add routes to your React Router configuration (e.g., `App.js` or `Routes.js`):

```javascript
import { ReportGallery, TankVolumeHistoryReport } from './pages/reports/ReportsIndex';

// In your routes configuration:
<Route path="/reports" element={<ReportGallery />} />
<Route path="/reports/tank-volume-history" element={<TankVolumeHistoryReport />} />

// Add more report routes as needed
```

### Step 3: Add Navigation Menu Items

Add to your navigation menu (e.g., in your sidebar component):

```javascript
{
  path: '/reports',
  icon: 'fa-light fa-chart-mixed',
  label: 'Reports',
  permission: '_Read_tankVolumeHistory', // Or appropriate permission
  children: [
    { path: '/reports', label: 'Report Gallery', icon: 'fa-light fa-th' },
    { path: '/reports/tank-volume-history', label: 'Tank Volume History', icon: 'fa-light fa-gas-pump' }
  ]
}
```

### Step 4: Configure API Base URL

Ensure your `axiosInstance.js` is configured correctly:

```javascript
// src/services/axiosInstance.js
import axios from 'axios';

const instance = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'https://localhost:5001',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add authentication interceptor if needed
instance.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default instance;
```

### Step 5: Build and Run Frontend

```bash
cd fms.frontend
npm start
```

Navigate to `http://localhost:3000/reports` to see the Report Gallery.

## Verification Checklist

After installation, verify these items:

### Backend Verification

- [ ] API endpoint accessible: `GET /api/v1/Reporting/definitions`
- [ ] Returns list of report definitions (should include at least 2 built-in reports)
- [ ] No errors in backend logs
- [ ] Authentication working (if enabled)

Test with:
```bash
curl https://localhost:5001/api/v1/Reporting/definitions
```

### Frontend Verification

- [ ] Report Gallery page loads: `/reports`
- [ ] Shows at least 2 built-in reports
- [ ] No console errors
- [ ] Report cards are clickable
- [ ] Navigation works

### Report Functionality Verification

- [ ] Open Tank Volume History Report: `/reports/tank-volume-history`
- [ ] Filters panel loads
- [ ] Date pickers work
- [ ] "Apply Filters" button works
- [ ] Report loads data
- [ ] Export to Excel works
- [ ] No console errors

## Troubleshooting

### Issue: "Report definitions not found"

**Solution:**
1. Check that `ReportDefinitionService` is registered in DI container
2. Verify `InitializeBuiltInReports()` is being called
3. Check API endpoint is accessible
4. Look for errors in backend logs

### Issue: "CORS errors" in browser console

**Solution:** Add CORS policy in `Program.cs`:

```csharp
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins("http://localhost:3000", "https://localhost:3000")
              .AllowAnyMethod()
              .AllowAnyHeader()
              .AllowCredentials();
    });
});

// After app is built:
app.UseCors("AllowFrontend");
```

### Issue: "Export to Excel not working"

**Solution:**
1. Check that ExcelJS is installed: `npm install exceljs file-saver`
2. Clear browser cache
3. Check browser console for errors
4. Verify data is loading before attempting export

### Issue: "401 Unauthorized" errors

**Solution:**
1. Check authentication token is valid
2. Verify user has required permissions
3. Check `RequiredPermission` in report definition matches user's permissions

### Issue: "No data loading" in report

**Solution:**
1. Verify the `DataSourceEndpoint` in report definition is correct
2. Check that endpoint returns data (test in Swagger or Postman)
3. Verify filters are being passed correctly
4. Check browser network tab for API call details
5. Look for errors in backend logs

## Configuration Options

### Backend Configuration

#### Custom Report Storage

To store reports in database instead of in-memory:

1. Create database table for report definitions
2. Implement database repository
3. Update `ReportDefinitionService` to use repository

#### Custom Authentication

To add custom authentication to report endpoints:

```csharp
[Authorize(Policy = "ReportAccess")]
public class ReportingController : ControllerBase
{
    // ...
}
```

### Frontend Configuration

#### Custom Report Styling

Create a custom SCSS file:

```scss
// custom-reports.scss
.report-builder {
  &__header {
    background: linear-gradient(to right, #your-color, #your-color-2);
  }
}
```

Import in your component:

```javascript
import './custom-reports.scss';
```

#### Custom Export Settings

Modify export settings in `ReportBuilder.js`:

```javascript
const exportOptions = {
  fileName: `custom-name-${Date.now()}`,
  format: 'xlsx',
  // Add more custom options
};
```

## Performance Optimization

### Backend

1. **Enable Response Caching:**
```csharp
[ResponseCache(Duration = 300)] // Cache for 5 minutes
[HttpGet("definitions")]
public async Task<IActionResult> GetReportDefinitions()
```

2. **Use Pagination:**
```csharp
// In your data queries
.Skip(page * pageSize)
.Take(pageSize)
```

3. **Add Indexes:**
```sql
CREATE INDEX IX_TankVolumeHistory_RecordedDate ON TankVolumeHistory(RecordedDate);
```

### Frontend

1. **Lazy Load Reports:**
```javascript
const ReportGallery = React.lazy(() => import('./pages/reports/ReportGallery'));
```

2. **Memoize Components:**
```javascript
const MemoizedReportBuilder = React.memo(ReportBuilder);
```

3. **Enable Virtual Scrolling:**
```javascript
<DataGrid
  dataSource={data}
  height={600}
  scrolling={{ mode: 'virtual' }}
/>
```

## Security Considerations

1. **Always validate permissions** on backend
2. **Sanitize user inputs** in filters
3. **Use HTTPS** in production
4. **Implement rate limiting** for report generation
5. **Log report access** for audit purposes

## Next Steps

After successful installation:

1. ✅ Test all built-in reports
2. ✅ Create your first custom report
3. ✅ Configure permissions
4. ✅ Add to navigation menu
5. ✅ Train users on report features
6. ✅ Monitor performance
7. ✅ Review [Complete Guide](./DEVEXTREME_REPORTING_GUIDE.md)

## Support

For installation issues:
1. Check this guide
2. Review error logs (backend and browser console)
3. Check [Troubleshooting section](#troubleshooting)
4. Contact development team

## Version History

- **v1.0.0** (2024-01-24): Initial release
