# Vehicle Dashboard Database Queries

## MySQL Syntax for Dashboard Queries

### 1. Dashboard Metrics Query
```sql
-- Get vehicle dashboard metrics
SELECT
    COUNT(*) as TotalVehicles,
    COUNT(CASE WHEN IsActive = 1 THEN 1 END) as ActiveVehicles,
    COUNT(CASE WHEN HasGps = 1 THEN 1 END) as GPSEnabledVehicles,
    COUNT(CASE WHEN IsActive = 1 AND LastGPSUpdate > DATE_SUB(NOW(), INTERVAL 30 MINUTE) THEN 1 END) as OnlineVehicles,
    COUNT(CASE WHEN IsActive = 1 AND LastGPSUpdate <= DATE_SUB(NOW(), INTERVAL 30 MINUTE) THEN 1 END) as OfflineVehicles,
    COUNT(CASE WHEN AssignedDriverId IS NULL THEN 1 END) as UnassignedVehicles
FROM Vehicles v;

-- Get vehicles with maintenance due
SELECT COUNT(*)
FROM Vehicles v
INNER JOIN MaintenanceSchedules ms ON v.VehicleId = ms.VehicleId
WHERE ms.DueDate <= CURDATE() AND ms.Status = 'Pending';

-- Get vehicles with issues (alerts)
SELECT COUNT(DISTINCT VehicleId)
FROM VehicleAlerts
WHERE Status = 'Active' AND AlertLevel IN ('High', 'Critical');
```

### 2. Status Distribution Query
```sql
-- Get vehicle status distribution
SELECT
    CASE
        WHEN IsActive = 1 AND Status = 'Active' THEN 'Active'
        WHEN IsActive = 0 THEN 'Inactive'
        WHEN Status = 'Maintenance' THEN 'Maintenance'
        WHEN Status = 'OutOfService' THEN 'Out of Service'
        ELSE 'Unknown'
    END as Status,
    COUNT(*) as Count,
    ROUND((COUNT(*) * 100.0) / (SELECT COUNT(*) FROM Vehicles), 1) as Percentage
FROM Vehicles
GROUP BY
    CASE
        WHEN IsActive = 1 AND Status = 'Active' THEN 'Active'
        WHEN IsActive = 0 THEN 'Inactive'
        WHEN Status = 'Maintenance' THEN 'Maintenance'
        WHEN Status = 'OutOfService' THEN 'Out of Service'
        ELSE 'Unknown'
    END;
```

### 3. Fleet Utilization Query
```sql
-- Get daily utilization for the last 30 days
SELECT
    DATE(trip_date) as Date,
    COUNT(DISTINCT VehicleId) as ActiveVehicles,
    AVG(CASE WHEN TripDuration > 0 THEN TripDuration ELSE 0 END) as AverageHours,
    ROUND((COUNT(DISTINCT VehicleId) * 100.0) / (SELECT COUNT(*) FROM Vehicles WHERE IsActive = 1), 1) as UtilizationPercentage
FROM VehicleTrips
WHERE trip_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
GROUP BY DATE(trip_date)
ORDER BY Date DESC;

-- Get vehicle-specific utilization
SELECT
    v.VehicleId,
    v.VehicleNumber,
    COUNT(vt.TripId) as TotalTrips,
    SUM(CASE WHEN vt.TripDuration > 0 THEN vt.TripDuration ELSE 0 END) as TotalHours,
    ROUND(AVG(CASE WHEN vt.TripDuration > 0 THEN vt.TripDuration ELSE 0 END), 1) as AverageHours,
    MAX(vt.trip_date) as LastUsed,
    ROUND((SUM(CASE WHEN vt.TripDuration > 0 THEN vt.TripDuration ELSE 0 END) / (30 * 8)) * 100, 1) as UtilizationPercentage
FROM Vehicles v
LEFT JOIN VehicleTrips vt ON v.VehicleId = vt.VehicleId
    AND vt.trip_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
WHERE v.IsActive = 1
GROUP BY v.VehicleId, v.VehicleNumber
ORDER BY UtilizationPercentage DESC;
```

### 4. Maintenance Alerts Query
```sql
-- Get maintenance alerts
SELECT
    v.VehicleId,
    v.VehicleNumber,
    ms.MaintenanceType as AlertType,
    ms.DueDate,
    CASE
        WHEN ms.DueDate < CURDATE() THEN 'High'
        WHEN ms.DueDate <= DATE_ADD(CURDATE(), INTERVAL 7 DAY) THEN 'Medium'
        ELSE 'Low'
    END as Priority,
    DATEDIFF(CURDATE(), ms.DueDate) as DaysOverdue,
    ms.Description,
    ms.EstimatedCost,
    ms.LastMaintenanceDate
FROM MaintenanceSchedules ms
INNER JOIN Vehicles v ON ms.VehicleId = v.VehicleId
WHERE ms.Status = 'Pending'
    AND ms.DueDate <= DATE_ADD(CURDATE(), INTERVAL 30 DAY)
    AND v.IsActive = 1
ORDER BY
    CASE
        WHEN ms.DueDate < CURDATE() THEN 1
        WHEN ms.DueDate <= DATE_ADD(CURDATE(), INTERVAL 7 DAY) THEN 2
        ELSE 3
    END,
    ms.DueDate ASC
LIMIT 20;
```

### 5. Recent Activities Query
```sql
-- Get recent vehicle activities
(SELECT
    ft.TransactionId as ActivityId,
    ft.VehicleId,
    v.VehicleNumber,
    'Fuel Transaction' as ActivityType,
    CONCAT('Fuel dispensed: ', ft.Quantity, 'L') as Description,
    ft.TransactionDate as ActivityDate,
    ft.UserId,
    u.UserName,
    ft.Location,
    'Completed' as Status
FROM FuelTransactions ft
INNER JOIN Vehicles v ON ft.VehicleId = v.VehicleId
LEFT JOIN Users u ON ft.UserId = u.UserId
WHERE ft.TransactionDate >= DATE_SUB(NOW(), INTERVAL 3 DAY))

UNION ALL

(SELECT
    vt.TripId as ActivityId,
    vt.VehicleId,
    v.VehicleNumber,
    'Trip Completed' as ActivityType,
    CONCAT('Trip from ', vt.StartLocation, ' to ', vt.EndLocation) as Description,
    vt.EndTime as ActivityDate,
    vt.DriverId as UserId,
    d.DriverName as UserName,
    vt.EndLocation as Location,
    CASE WHEN vt.EndTime IS NOT NULL THEN 'Completed' ELSE 'In Progress' END as Status
FROM VehicleTrips vt
INNER JOIN Vehicles v ON vt.VehicleId = v.VehicleId
LEFT JOIN Drivers d ON vt.DriverId = d.DriverId
WHERE vt.trip_date >= DATE_SUB(CURDATE(), INTERVAL 3 DAY))

UNION ALL

(SELECT
    va.AlertId as ActivityId,
    va.VehicleId,
    v.VehicleNumber,
    'Alert Generated' as ActivityType,
    va.AlertMessage as Description,
    va.CreatedDate as ActivityDate,
    NULL as UserId,
    'System' as UserName,
    va.Location,
    va.Status
FROM VehicleAlerts va
INNER JOIN Vehicles v ON va.VehicleId = v.VehicleId
WHERE va.CreatedDate >= DATE_SUB(NOW(), INTERVAL 3 DAY))

ORDER BY ActivityDate DESC
LIMIT 10;
```

### 6. Performance Metrics Query
```sql
-- Get performance metrics for the last 7 days
SELECT
    -- Fuel efficiency calculation
    ROUND(
        CASE
            WHEN SUM(ft.Quantity) > 0
            THEN SUM(vt.Distance) / SUM(ft.Quantity)
            ELSE 0
        END, 2
    ) as FuelEfficiency,

    -- Average speed
    ROUND(
        CASE
            WHEN SUM(vt.TripDuration) > 0
            THEN SUM(vt.Distance) / SUM(vt.TripDuration)
            ELSE 0
        END, 1
    ) as AverageSpeed,

    -- Total metrics
    ROUND(COALESCE(SUM(vt.Distance), 0), 1) as TotalDistance,
    ROUND(COALESCE(SUM(ft.Quantity), 0), 1) as TotalFuelConsumed,
    ROUND(COALESCE(SUM(vt.TripDuration), 0), 1) as TotalOperatingHours,

    -- Cost efficiency
    ROUND(
        CASE
            WHEN SUM(vt.Distance) > 0
            THEN SUM(ft.Amount) / SUM(vt.Distance)
            ELSE 0
        END, 2
    ) as CostEfficiency,

    -- Additional metrics
    COUNT(DISTINCT vt.VehicleId) as TotalVehiclesTracked,
    COUNT(vt.TripId) as TotalTrips,
    ROUND(COUNT(vt.TripId) / 7.0, 1) as AverageTripsPerDay

FROM VehicleTrips vt
LEFT JOIN FuelTransactions ft ON vt.VehicleId = ft.VehicleId
    AND DATE(ft.TransactionDate) = DATE(vt.trip_date)
INNER JOIN Vehicles v ON vt.VehicleId = v.VehicleId
WHERE vt.trip_date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
    AND v.IsActive = 1;

-- Get idle time metrics
SELECT
    AVG(IdleTimePercentage) as AverageIdleTime
FROM (
    SELECT
        VehicleId,
        (SUM(IdleTime) / SUM(TotalOperatingTime)) * 100 as IdleTimePercentage
    FROM VehicleOperatingData
    WHERE OperatingDate >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
    GROUP BY VehicleId
) idle_data;
```

### 7. Optimization Indexes
```sql
-- Recommended indexes for performance
CREATE INDEX idx_vehicles_active_gps ON Vehicles (IsActive, HasGps);
CREATE INDEX idx_vehicles_status ON Vehicles (Status, IsActive);
CREATE INDEX idx_maintenance_due_date ON MaintenanceSchedules (DueDate, Status, VehicleId);
CREATE INDEX idx_fuel_transaction_date ON FuelTransactions (TransactionDate, VehicleId);
CREATE INDEX idx_vehicle_trips_date ON VehicleTrips (trip_date, VehicleId);
CREATE INDEX idx_vehicle_alerts_active ON VehicleAlerts (Status, AlertLevel, VehicleId, CreatedDate);
CREATE INDEX idx_vehicles_last_gps ON Vehicles (LastGPSUpdate, IsActive);
```

### 8. Materialized Views (for better performance)
```sql
-- Daily vehicle utilization summary
CREATE VIEW daily_vehicle_utilization AS
SELECT
    DATE(trip_date) as UtilizationDate,
    VehicleId,
    COUNT(TripId) as TotalTrips,
    SUM(TripDuration) as TotalHours,
    SUM(Distance) as TotalDistance,
    AVG(TripDuration) as AverageHours
FROM VehicleTrips
WHERE trip_date >= DATE_SUB(CURDATE(), INTERVAL 90 DAY)
GROUP BY DATE(trip_date), VehicleId;

-- Vehicle health summary
CREATE VIEW vehicle_health_summary AS
SELECT
    v.VehicleId,
    v.VehicleNumber,
    COUNT(va.AlertId) as ActiveAlerts,
    COUNT(ms.ScheduleId) as PendingMaintenance,
    CASE
        WHEN v.LastGPSUpdate > DATE_SUB(NOW(), INTERVAL 30 MINUTE) THEN 'Online'
        ELSE 'Offline'
    END as ConnectivityStatus
FROM Vehicles v
LEFT JOIN VehicleAlerts va ON v.VehicleId = va.VehicleId AND va.Status = 'Active'
LEFT JOIN MaintenanceSchedules ms ON v.VehicleId = ms.VehicleId AND ms.Status = 'Pending'
WHERE v.IsActive = 1
GROUP BY v.VehicleId, v.VehicleNumber, v.LastGPSUpdate;
```
