# Vehicle Dashboard System - Product Requirements Document

## Executive Summary

The Vehicle Dashboard System provides a comprehensive fleet management interface that combines vehicle monitoring, consumption analysis, maintenance tracking, and real-time GPS data integration into a unified dashboard experience.

## 1. Product Overview

### 1.1 Vision

Create a modern, responsive vehicle management dashboard that provides fleet managers with real-time insights, streamlined vehicle operations, and comprehensive consumption analytics.

### 1.2 Key Objectives

- **Operational Efficiency**: Reduce time spent on vehicle management tasks by 40%
- **Data Visibility**: Provide real-time vehicle metrics and consumption analytics
- **Maintenance Optimization**: Proactive maintenance scheduling based on GPS data
- **Cost Control**: Track fuel consumption and identify inefficiencies

## 2. Feature Requirements

### 2.1 Vehicle Dashboard (`/vehicles`)

#### 2.1.1 Quick Actions Section

- **Add Vehicle Button**: Primary CTA for adding new vehicles
- **Bulk Operations**: Import/Export functionality
- **Filter Controls**: Site, status, vehicle type filters

#### 2.1.2 Fleet Metrics Tiles

```
┌─────────────┬─────────────┬─────────────┬─────────────┐
│ Total       │ Active      │ Under       │ Fuel        │
│ Vehicles    │ Vehicles    │ Maintenance │ Alerts      │
│ 124         │ 118         │ 6           │ 3           │
└─────────────┴─────────────┴─────────────┴─────────────┘
```

#### 2.1.3 Vehicle Data Grid

- **Simplified Interface**: Remove top toolbar, keep filtering and print
- **Screen-Friendly Design**: Responsive columns, optimized spacing
- **Click Navigation**: Row click leads to vehicle edit page
- **Quick Actions**: Inline edit, assignment buttons

### 2.2 Vehicle Edit Page (`/vehicles/:id/edit`)

#### 2.2.1 Action Bar

```
┌─────────────────────────────────────────────────────────┐
│ [Save] [Edit] [Cancel]                     [Delete]     │
└─────────────────────────────────────────────────────────┘
```

#### 2.2.2 Vehicle Metrics Tiles (1-Day Filter)

```
┌─────────────┬─────────────┬─────────────┬─────────────┐
│ Total       │ Total Fuel  │ Fuel        │ Active      │
│ Miles/Hours │ Used        │ Issues      │ Issues      │
│ 250 km      │ 45.2 L      │ 2           │ 1           │
└─────────────┴─────────────┴─────────────┴─────────────┘
```

#### 2.2.3 Vehicle Information Form

Based on `Vehicle.cs` entity:

- **Basic Information**: Tenacity No, Number Plate, YOM
- **Technical Details**: Vehicle Type, Model, Manufacturer
- **Operational Data**: Working Site, Default Employee, Capacity
- **GPS Configuration**: GPS Installation status, GPS Gate ID
- **Status Flags**: Active status, Company vehicle flag

#### 2.2.4 Tag Assignment Section

- **Current Tags Display**: List of assigned tags
- **Add Tag Button**: Opens popup for tag assignment
- **Tag Management**: Assign/unassign tags with date ranges

#### 2.2.5 Consumption History Section

- **Default Filter**: 5 days consumption history
- **GPS Integration**: For vehicles with gpsgate ID
- **Chart Navigation**: Click consumption row → detailed chart page

### 2.3 Consumption Analysis Page (`/vehicles/:id/consumption/:consumptionId/details`)

#### 2.3.1 Navigation Tabs

```
┌─────────────┬─────────────┬─────────────┬─────────────┐
│ Charts      │ Raw Data    │ Maintenance │ Inspection  │
│ (Active)    │             │ Schedule    │ Schedule    │
└─────────────┴─────────────┴─────────────┴─────────────┘
```

#### 2.3.2 Chart Visualizations

- **Fuel Consumption**: Line chart with efficiency metrics
- **Speed Analysis**: Max/avg speed over time
- **Engine Performance**: Engine hours, load analysis
- **Route Mapping**: GPS track visualization
- **Temperature Monitoring**: Engine/ambient temperature

#### 2.3.3 Maintenance Schedule (Tab 2)

- **Real-time GPS Data**: Engine hours, mileage tracking
- **Scheduled Maintenance**: Based on usage thresholds
- **Alerts**: Upcoming maintenance notifications
- **History**: Completed maintenance records

#### 2.3.4 Inspection Schedule (Tab 3)

- **Inspection Planning**: Scheduled inspections calendar
- **Compliance Tracking**: Regulatory inspection requirements
- **Checklist Management**: Digital inspection forms
- **Document Storage**: Inspection certificates and reports

## 3. Technical Architecture

### 3.1 Component Structure

```
src/
├── pages/
│   ├── vehicles/
│   │   ├── vehicleDashboard.js          // Main dashboard
│   │   ├── vehicleEdit.js               // Edit page
│   │   └── vehicleConsumptionDetails.js // Analysis page
├── components/
│   ├── vehicle/
│   │   ├── VehicleDashboardTiles.js     // Metrics tiles
│   │   ├── VehicleDataGrid.js           // Enhanced grid
│   │   ├── VehicleEditForm.js           // Edit form
│   │   ├── VehicleMetricsTiles.js       // Individual metrics
│   │   └── TagAssignmentPopup.js        // Tag management
│   ├── consumption/
│   │   ├── ConsumptionChart.js          // Chart component
│   │   ├── ConsumptionDataGrid.js       // Data grid
│   │   └── ConsumptionAnalytics.js      // Analytics panel
│   └── maintenance/
│       ├── MaintenanceSchedule.js       // Schedule component
│       └── InspectionPlanner.js         // Inspection component
```

### 3.2 Data Models

#### 3.2.1 Vehicle Dashboard Data

```typescript
interface VehicleDashboardData {
  totalVehicles: number;
  activeVehicles: number;
  maintenanceCount: number;
  fuelAlerts: number;
  vehicles: Vehicle[];
}
```

#### 3.2.2 Vehicle Metrics Data

```typescript
interface VehicleMetrics {
  totalDistance: number; // km
  totalFuel: number; // liters
  fuelIssues: number;
  activeIssues: number;
  dateRange: string;
}
```

### 3.3 API Endpoints

#### 3.3.1 Dashboard APIs

- `GET /api/vehicles/dashboard` - Dashboard metrics
- `GET /api/vehicles` - Vehicle list with filters
- `POST /api/vehicles` - Create new vehicle

#### 3.3.2 Vehicle Management APIs

- `GET /api/vehicles/:id` - Vehicle details
- `PUT /api/vehicles/:id` - Update vehicle
- `DELETE /api/vehicles/:id` - Delete vehicle
- `GET /api/vehicles/:id/metrics` - Vehicle metrics

#### 3.3.3 Consumption APIs

- `GET /api/consumption/vehicle/:id` - Consumption history
- `GET /api/consumption/:id/details` - Detailed consumption data
- `GET /api/gpsgate/track/:vehicleId/:date` - GPS track data

#### 3.3.4 Maintenance APIs

- `GET /api/maintenance/schedule/:vehicleId` - Maintenance schedule
- `POST /api/maintenance/schedule` - Create maintenance
- `GET /api/inspection/schedule/:vehicleId` - Inspection schedule

### 3.4 GPS Gate Integration

#### 3.4.1 API Service Structure

```javascript
// src/services/gpsgateApiService.js
class GPSGateApiService {
  async login() {
    /* Authentication */
  }
  async fetchTrackData(vehicleId, date) {
    /* Track data */
  }
  async fetchVehicleMetrics(vehicleId, dateRange) {
    /* Metrics */
  }
  async fetchMaintenanceData(vehicleId) {
    /* Maintenance data */
  }
}
```

#### 3.4.2 Data Processing Pipeline

1. **Authentication**: Login to GPS Gate API
2. **Data Fetching**: Retrieve vehicle tracking data
3. **Data Processing**: Convert to chart-friendly format
4. **Caching**: Store processed data for performance
5. **Real-time Updates**: WebSocket connection for live data

## 4. User Experience Requirements

### 4.1 Performance Requirements

- **Page Load Time**: < 2 seconds for dashboard
- **Chart Rendering**: < 1 second for consumption charts
- **Grid Pagination**: Support 1000+ vehicles with virtual scrolling
- **Real-time Updates**: GPS data updates every 30 seconds

### 4.2 Responsive Design

- **Desktop**: Full dashboard layout (1920x1080)
- **Tablet**: Stacked tiles, simplified grid (768x1024)
- **Mobile**: Single column, touch-friendly (375x667)

### 4.3 Accessibility

- **WCAG 2.1 AA Compliance**: Screen reader support
- **Keyboard Navigation**: Full keyboard accessibility
- **Color Contrast**: 4.5:1 minimum contrast ratio
- **Focus Management**: Clear focus indicators

## 5. Implementation Phases

### Phase 1: Dashboard Foundation (Week 1-2)

- [ ] Create vehicle dashboard page structure
- [ ] Implement fleet metrics tiles
- [ ] Update vehicle data grid (remove toolbar, add navigation)
- [ ] Add routing for vehicle edit page
- [ ] Basic vehicle edit form structure

### Phase 2: Vehicle Edit Page (Week 3-4)

- [ ] Implement vehicle metrics tiles with filtering
- [ ] Complete vehicle edit form based on Vehicle.cs
- [ ] Add tag assignment popup functionality
- [ ] Create consumption history section
- [ ] Implement save/edit/cancel functionality

### Phase 3: Consumption Analysis (Week 5-6)

- [ ] Create consumption details page with tabs
- [ ] Implement GPS Gate API integration
- [ ] Build consumption chart components
- [ ] Add variable selection and filtering
- [ ] Create data export functionality

### Phase 4: Maintenance & Inspection (Week 7-8)

- [ ] Implement maintenance schedule component
- [ ] Add real-time GPS data integration
- [ ] Create inspection planning interface
- [ ] Build notification system for schedules
- [ ] Add document management features

### Phase 5: Enhancement & Testing (Week 9-10)

- [ ] Performance optimization
- [ ] Mobile responsiveness testing
- [ ] Accessibility compliance testing
- [ ] User acceptance testing
- [ ] Documentation completion

## 6. Success Metrics

### 6.1 User Adoption

- **Dashboard Usage**: 90% of users access dashboard daily
- **Feature Adoption**: 70% use consumption analysis within 30 days
- **Task Completion**: 95% vehicle edit completion rate

### 6.2 Performance Metrics

- **Load Time**: < 2s dashboard load time
- **Error Rate**: < 1% API error rate
- **Uptime**: 99.9% system availability

### 6.3 Business Impact

- **Time Savings**: 40% reduction in vehicle management tasks
- **Fuel Efficiency**: 15% improvement in fuel consumption tracking
- **Maintenance Cost**: 20% reduction through predictive maintenance

## 7. Risk Mitigation

### 7.1 Technical Risks

- **GPS API Reliability**: Implement fallback mechanisms and caching
- **Performance**: Use virtual scrolling and lazy loading
- **Data Consistency**: Implement proper error handling and validation

### 7.2 User Adoption Risks

- **Training**: Comprehensive user training program
- **Change Management**: Gradual rollout with user feedback
- **Support**: Dedicated support team during transition

## 8. TODO List

### Immediate (Week 1)

- [ ] Set up project structure and routing
- [ ] Create basic dashboard layout
- [ ] Implement vehicle metrics API endpoints
- [ ] Design vehicle edit form UI

### Short Term (Week 2-4)

- [ ] Complete vehicle CRUD operations
- [ ] Implement tag assignment functionality
- [ ] Build consumption data grid
- [ ] Add basic GPS Gate API integration

### Medium Term (Week 5-8)

- [ ] Advanced chart visualizations
- [ ] Maintenance scheduling system
- [ ] Inspection planning interface
- [ ] Mobile optimization

### Long Term (Week 9-12)

- [ ] Advanced analytics and reporting
- [ ] Predictive maintenance algorithms
- [ ] Integration with external systems
- [ ] Performance monitoring and optimization

## 9. Appendix

### 9.1 Related Documents

- `Vehicle.cs` - Entity model reference
- `FMSResponse.cs` - API response format
- `TankStockPageRedesign_PRD.md` - Related dashboard patterns

### 9.2 API Documentation References

- GPS Gate API documentation
- DevExtreme components documentation
- React Router v6 documentation

### 9.3 Design Assets

- UI mockups and wireframes
- Icon library and color palette
- Component style guide
