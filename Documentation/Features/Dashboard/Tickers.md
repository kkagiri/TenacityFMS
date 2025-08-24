📍 Primary Sources:
├── TankStockController API
│   ├── /api/tankstock - Tank stock levels
│   ├── /api/tankstock/adjustments - Stock adjustments
│   ├── /api/tankstock/discrepancies - Stock discrepancies
│   └── /api/tankstock/dashboard-metrics - Tank metrics
├── Tank Volume History API
│   ├── Real-time tank levels
│   ├── Historical volume data
│   └── Volume trend statistics
└── Tank Measurement Processing
    ├── Continuous PTS device data
    ├── Fuel grade integration
    └── Alarm processing




    📍 VehicleController API:
├── /api/vehicle/dashboard - Main vehicle metrics
├── /api/vehicle/dashboard/metrics - Fleet KPIs
├── /api/vehicle/dashboard/status-distribution - Vehicle status breakdown
├── /api/vehicle/dashboard/fleet-utilization - Utilization analytics
├── /api/vehicle/dashboard/maintenance-alerts - Maintenance data
├── /api/vehicle/dashboard/recent-activities - Recent activities
└── /api/vehicle/dashboard/performance-metrics - Performance stats


📍 ConsumptionController API:
├── Fuel consumption reports
├── Vehicle efficiency calculations
├── Consumption trend analysis
└── Fuel efficiency metrics



📍 ActiveAlarmController API:
├── /api/active-alarms - Active alarms list
├── /api/active-alarms/statistics - Alarm statistics
└── /api/notifications/statistics - Notification statistics

📍 NotificationController API:
├── Alarm handler data
├── Alert processing metrics
└── Real-time notification stats


📍 PTSDeviceController API:
├── /api/PTSDevice/dashboard-metrics - Device metrics
├── Device connection status
├── Pump transaction data
└── Hardware status monitoring


🔄 DATA FLOW ARCHITECTURE
PTS Devices → SignalR Hub → Frontend Components
    ├── Tank measurements
    ├── Pump transactions
    ├── Device status
    └── Alarm events

Redux Store ← API Controllers ← Database
    ├── Authentication state
    ├── Tank data cache
    ├── Vehicle metrics
    └── Dashboard state

Statistics Aggregation Points:
1. TANK STATISTICS:
   ├── Current stock levels (TankFilterPanel.js calculations)
   ├── Fill percentages & capacity utilization
   ├── Low stock alerts (< 30% capacity)
   ├── Negative/above capacity warnings
   └── Site-level aggregations

2. VEHICLE STATISTICS:
   ├── Fleet metrics (VehicleDashboardMetricsDTO)
   ├── Status distribution (Active/Offline/Issues)
   ├── Utilization rates & health scores
   ├── GPS-enabled vs unassigned vehicles
   └── Maintenance alerts & scheduling

3. OPERATIONAL STATISTICS:
   ├── Daily tank reconciliation data
   ├── Pump transaction summaries
   ├── Stock adjustment tracking
   └── Discrepancy reporting

4. ALARM STATISTICS:
   ├── Active alarm counts by priority
   ├── Resolution time metrics
   ├── Escalation tracking
   └── Site/device breakdown


📈 DASHBOARD INTEGRATION STRATEGY
For Your Role-Based Dashboard:

ADMIN ROLE - Full Statistics:
├── Fleet Overview (Total/Active/Issues)
├── Tank Capacity Utilization
├── Critical Alarms Count
├── System Health Metrics
└── Financial/Operational KPIs

USER ROLE - Operational Focus:
├── Vehicle Status (their assigned vehicles)
├── Tank Levels (their site/area)
├── Recent Transactions
└── Basic Alerts

MANAGEMENT ROLE - Strategic View:
├── Fleet Utilization Trends
├── Fuel Efficiency Metrics
├── Cost Analysis
├── Performance Benchmarks
└── Predictive Analytics

GUEST ROLE - Summary Only:
├── System Status Overview
├── Basic Metrics (totals)
└── Public Information

Key Statistics Components Already Available:


✅ TankLevelGauge.js - Individual tank monitoring
✅ VehicleMetricsTiles.js - Vehicle KPI display
✅ TankFilterPanel.js - Tank statistics calculations
✅ VehicleDashboard.js - Complete vehicle analytics
✅ ConsumptionController - Fuel efficiency data
✅ ActiveAlarmStatistics - Alarm metrics



Phase 1: Core Metrics Integration
Tank Statistics Service - Aggregate tank data from multiple sources
Vehicle Metrics Service - Centralize vehicle statistics
Alarm Statistics Service - Real-time alarm monitoring
Dashboard Data Provider - Role-based data filtering
*Phase 2: Real-time Updates
SignalR Integration - Live data streaming
Redux State Management - Centralized state updates
WebSocket Connections - Real-time device status
Cache Management - Performance optimization

#EXISTING API ENDPOINTS TO LEVERAGE
The system already has robust APIs ready for statistics integration:

Tank Management: Complete tank stock and volume history APIs
Vehicle Management: Comprehensive vehicle dashboard APIs with caching
Alarm System: Full alarm lifecycle and statistics APIs
Device Monitoring: PTS device metrics and connection status
Notifications: Statistics and alert processing APIs