-- =============================================================================
-- SM08 VEHICLE FUEL AUDIT DIAGNOSTIC QUERIES
-- Purpose: Investigate GPS data display issues, duplicates, and N/A values
-- Date: 2025-12-12
-- Version: 2.0 - Added specific date analysis
--
-- ISSUE REPORTED:
-- 02/09/2025  FT02  -     -      N/A    +150.0  -  -    (DUPLICATE)
-- 02/09/2025  FT02  -     -      N/A    +150.0  -  -    (DUPLICATE)
-- 09/09/2025  -     601.8 763.2  +132.0 +0.0    -  -    (GPS DATA EXISTS)
--
-- ROOT CAUSE ANALYSIS:
-- 1. 02/09 shows N/A for GPS - no gpsgate_report_entries for that date
-- 2. 02/09 has TWO manual refill rows in fuelrefill table (duplicate entries)
-- 3. 09/09 has GPS data (FuelBefore=601.8, FuelAfter=763.2, Volume=+132.0)
-- =============================================================================

-- =============================================================================
-- STEP 1: Find SM08 Vehicle and its provider mapping
-- =============================================================================

-- 1.1 Get vehicle details for SM08
SELECT
    v.VehicleId,
    v.VehicleCode AS VehicleName,
    v.NumberPlate,
    v.WorkingSiteId,
    v.IsActive,
    v.IsCompanyVehicle,
    v.HasGPSInstalled,
    v.DeviceId AS LegacyDeviceId,
    v.FuelTankCapacity,
    v.IsFullTankPolicy,
    v.AverageKmL AS IsKmL,
    s.SiteName
FROM vehicles v
LEFT JOIN sites s ON v.WorkingSiteId = s.SiteId
WHERE v.VehicleCode LIKE '%SM08%' OR v.NumberPlate LIKE '%SM08%'
ORDER BY v.VehicleId;

-- 1.2 Get provider mapping for SM08 (modern GPS tracking)
SELECT
    vpm.Id AS MappingId,
    vpm.VehicleId,
    v.VehicleCode AS VehicleName,
    vpm.ProviderId,
    pc.Name AS ProviderName,
    vpm.ExternalDeviceId AS GPSGateDeviceId,
    vpm.DeviceName AS GPSGateDeviceName,
    vpm.IsActive,
    vpm.MappingMethod,
    vpm.LastVerifiedAt
FROM vehicle_provider_mappings vpm
INNER JOIN vehicles v ON vpm.VehicleId = v.VehicleId
LEFT JOIN provider_configurations pc ON vpm.ProviderId = pc.ProviderId
WHERE v.VehicleCode LIKE '%SM08%' OR v.NumberPlate LIKE '%SM08%'
ORDER BY vpm.IsActive DESC, vpm.Id;

-- =============================================================================
-- STEP 2: Get GPS Report Entries (SOAP Report 212 data) for SM08
-- =============================================================================

-- 2.1 All GPS refill events for SM08 in September 2025
SELECT
    gre.Id,
    gre.ReportId,
    gre.VehicleId,
    v.VehicleCode AS VehicleName,
    DATE(gre.DispenseDate) AS RefillDate,
    gre.StartTime,
    gre.Duration,
    gre.FuelBefore,
    gre.FuelAfter,
    gre.RefillVolume,
    gre.OriginalVolume,
    gre.ModifiedVolume,
    gre.IsDeleted,
    gre.MatchedManualRefillId,
    gre.CreatedAt
FROM gpsgate_report_entries gre
INNER JOIN vehicles v ON gre.VehicleId = v.VehicleId
WHERE v.VehicleCode LIKE '%SM08%'
  AND gre.DispenseDate BETWEEN '2025-09-01' AND '2025-09-30'
  AND gre.IsDeleted = 0
ORDER BY gre.DispenseDate, gre.StartTime;

-- 2.2 Check for DUPLICATE GPS entries on same date (potential issue)
SELECT
    DATE(gre.DispenseDate) AS RefillDate,
    gre.VehicleId,
    v.VehicleCode AS VehicleName,
    COUNT(*) AS EntryCount,
    GROUP_CONCAT(gre.RefillVolume ORDER BY gre.StartTime SEPARATOR ', ') AS Volumes,
    GROUP_CONCAT(gre.FuelBefore ORDER BY gre.StartTime SEPARATOR ', ') AS FuelBeforeValues,
    GROUP_CONCAT(gre.FuelAfter ORDER BY gre.StartTime SEPARATOR ', ') AS FuelAfterValues,
    GROUP_CONCAT(TIME(gre.StartTime) ORDER BY gre.StartTime SEPARATOR ', ') AS StartTimes
FROM gpsgate_report_entries gre
INNER JOIN vehicles v ON gre.VehicleId = v.VehicleId
WHERE v.VehicleCode LIKE '%SM08%'
  AND gre.DispenseDate BETWEEN '2025-09-01' AND '2025-09-30'
  AND gre.IsDeleted = 0
GROUP BY DATE(gre.DispenseDate), gre.VehicleId, v.VehicleCode
HAVING COUNT(*) > 1
ORDER BY RefillDate;

-- =============================================================================
-- STEP 3: Get Manual FuelRefill Records for SM08
-- =============================================================================

-- 3.1 All manual refills for SM08 in September 2025
SELECT
    fr.Id AS RefillId,
    fr.VehicleId,
    v.VehicleCode AS VehicleName,
    DATE(fr.Date) AS RefillDate,
    TIME(fr.Date) AS RefillTime,
    fr.ManualFuelrefillAmount AS FuelAmount,
    fr.TankId,
    t.TankName,
    fr.SiteId,
    s.SiteName,
    fr.FuelBy,
    fr.Comment,
    fr.IsDeleted,
    fr.IsCorrection,
    fr.DateCreated
FROM fuelrefill fr
INNER JOIN vehicles v ON fr.VehicleId = v.VehicleId
LEFT JOIN tanks t ON fr.TankId = t.TankId
LEFT JOIN sites s ON fr.SiteId = s.SiteId
WHERE v.VehicleCode LIKE '%SM08%'
  AND fr.Date BETWEEN '2025-09-01' AND '2025-09-30'
  AND fr.IsDeleted = 0
ORDER BY fr.Date;

-- 3.2 Check for DUPLICATE manual refills on same date
SELECT
    DATE(fr.Date) AS RefillDate,
    fr.VehicleId,
    v.VehicleCode AS VehicleName,
    COUNT(*) AS EntryCount,
    SUM(fr.ManualFuelrefillAmount) AS TotalAmount,
    GROUP_CONCAT(fr.ManualFuelrefillAmount ORDER BY fr.Date SEPARATOR ', ') AS Amounts,
    GROUP_CONCAT(TIME(fr.Date) ORDER BY fr.Date SEPARATOR ', ') AS Times
FROM fuelrefill fr
INNER JOIN vehicles v ON fr.VehicleId = v.VehicleId
WHERE v.VehicleCode LIKE '%SM08%'
  AND fr.Date BETWEEN '2025-09-01' AND '2025-09-30'
  AND fr.IsDeleted = 0
GROUP BY DATE(fr.Date), fr.VehicleId, v.VehicleCode
HAVING COUNT(*) > 1
ORDER BY RefillDate;

-- =============================================================================
-- STEP 3.3: GLOBAL DUPLICATES (ALL VEHICLES) FROM 01/09/2025 UNTIL TODAY
-- Purpose: Find any same-day duplicate fuelrefill rows per vehicle.
-- Notes:
-- - Uses MySQL CURDATE() for "today".
-- - Add additional filters if needed:
--   AND fr.IsCorrection = 0
--   AND fr.SiteId = <siteId>
-- =============================================================================

-- 3.3.1 Same-day duplicates per vehicle (broad)
SELECT
        DATE(fr.Date) AS RefillDate,
        fr.VehicleId,
        v.VehicleCode AS VehicleName,
        COUNT(*) AS EntryCount,
        SUM(fr.ManualFuelrefillAmount) AS TotalAmount,
        GROUP_CONCAT(fr.Id ORDER BY fr.Date SEPARATOR ', ') AS RefillIds,
        GROUP_CONCAT(fr.ManualFuelrefillAmount ORDER BY fr.Date SEPARATOR ', ') AS Amounts,
        GROUP_CONCAT(TIME(fr.Date) ORDER BY fr.Date SEPARATOR ', ') AS Times,
        GROUP_CONCAT(COALESCE(fr.FuelBy, '') ORDER BY fr.Date SEPARATOR ', ') AS FuelBy,
        GROUP_CONCAT(COALESCE(fr.Comment, '') ORDER BY fr.Date SEPARATOR ' | ') AS Comments
FROM fuelrefill fr
INNER JOIN vehicles v ON fr.VehicleId = v.VehicleId
WHERE fr.Date >= '2025-09-01'
    AND fr.Date < DATE_ADD(CURDATE(), INTERVAL 1 DAY)
    AND fr.IsDeleted = 0
GROUP BY DATE(fr.Date), fr.VehicleId, v.VehicleCode
HAVING COUNT(*) > 1
ORDER BY RefillDate DESC, VehicleName;

-- 3.3.2 Exact duplicates: same vehicle + same day + same amount (narrower)
-- This is useful when users accidentally submit the same refill twice.
SELECT
        DATE(fr.Date) AS RefillDate,
        fr.VehicleId,
        v.VehicleCode AS VehicleName,
        fr.ManualFuelrefillAmount AS Amount,
        COUNT(*) AS DuplicateCount,
        GROUP_CONCAT(fr.Id ORDER BY fr.Date SEPARATOR ', ') AS RefillIds,
        GROUP_CONCAT(TIME(fr.Date) ORDER BY fr.Date SEPARATOR ', ') AS Times
FROM fuelrefill fr
INNER JOIN vehicles v ON fr.VehicleId = v.VehicleId
WHERE fr.Date >= '2025-09-01'
    AND fr.Date < DATE_ADD(CURDATE(), INTERVAL 1 DAY)
    AND fr.IsDeleted = 0
GROUP BY DATE(fr.Date), fr.VehicleId, v.VehicleCode, fr.ManualFuelrefillAmount
HAVING COUNT(*) > 1
ORDER BY RefillDate DESC, VehicleName, Amount;

-- =============================================================================
-- STEP 4: COMPARE GPS vs Manual Refills (Full Comparison)
-- =============================================================================

-- 4.1 Side-by-side comparison of GPS and Manual refills by date
WITH gps_daily AS (
    SELECT
        DATE(gre.DispenseDate) AS RefillDate,
        gre.VehicleId,
        SUM(gre.RefillVolume) AS GPS_TotalVolume,
        COUNT(*) AS GPS_EntryCount,
        GROUP_CONCAT(CONCAT(gre.FuelBefore, '->', gre.FuelAfter) ORDER BY gre.StartTime SEPARATOR '; ') AS GPS_Levels,
        MIN(gre.FuelBefore) AS GPS_FirstFuelBefore,
        MAX(gre.FuelAfter) AS GPS_LastFuelAfter
    FROM gpsgate_report_entries gre
    INNER JOIN vehicles v ON gre.VehicleId = v.VehicleId
    WHERE v.VehicleCode LIKE '%SM08%'
      AND gre.DispenseDate BETWEEN '2025-09-01' AND '2025-09-30'
      AND gre.IsDeleted = 0
    GROUP BY DATE(gre.DispenseDate), gre.VehicleId
),
manual_daily AS (
    SELECT
        DATE(fr.Date) AS RefillDate,
        fr.VehicleId,
        SUM(fr.ManualFuelrefillAmount) AS Manual_TotalAmount,
        COUNT(*) AS Manual_EntryCount,
        GROUP_CONCAT(fr.ManualFuelrefillAmount ORDER BY fr.Date SEPARATOR ', ') AS Manual_Amounts
    FROM fuelrefill fr
    INNER JOIN vehicles v ON fr.VehicleId = v.VehicleId
    WHERE v.VehicleCode LIKE '%SM08%'
      AND fr.Date BETWEEN '2025-09-01' AND '2025-09-30'
      AND fr.IsDeleted = 0
    GROUP BY DATE(fr.Date), fr.VehicleId
)
SELECT
    COALESCE(g.RefillDate, m.RefillDate) AS Date,
    v.VehicleCode AS VehicleName,
    -- GPS Data
    COALESCE(g.GPS_TotalVolume, 0) AS GPS_Volume,
    COALESCE(g.GPS_FirstFuelBefore, 0) AS GPS_FuelBefore,
    COALESCE(g.GPS_LastFuelAfter, 0) AS GPS_FuelAfter,
    g.GPS_EntryCount,
    g.GPS_Levels,
    -- Manual Data
    COALESCE(m.Manual_TotalAmount, 0) AS Manual_Volume,
    m.Manual_EntryCount,
    m.Manual_Amounts,
    -- Variance
    ROUND(COALESCE(g.GPS_TotalVolume, 0) - COALESCE(m.Manual_TotalAmount, 0), 2) AS Variance,
    -- Data Status
    CASE
        WHEN g.RefillDate IS NULL THEN 'GPS_MISSING'
        WHEN m.RefillDate IS NULL THEN 'MANUAL_MISSING'
        WHEN ABS(COALESCE(g.GPS_TotalVolume, 0) - COALESCE(m.Manual_TotalAmount, 0)) <= 5 THEN 'MATCHED'
        ELSE 'VARIANCE'
    END AS Status
FROM gps_daily g
FULL OUTER JOIN manual_daily m ON g.RefillDate = m.RefillDate AND g.VehicleId = m.VehicleId
JOIN vehicles v ON COALESCE(g.VehicleId, m.VehicleId) = v.VehicleId
ORDER BY COALESCE(g.RefillDate, m.RefillDate);

-- 4.2 Alternative for MySQL (no FULL OUTER JOIN support) - LEFT + RIGHT UNION
SELECT
    COALESCE(g.RefillDate, m.RefillDate) AS Date,
    v.VehicleCode AS VehicleName,
    g.GPS_TotalVolume AS GPS_Volume,
    g.GPS_FirstFuelBefore AS GPS_FuelBefore,
    g.GPS_LastFuelAfter AS GPS_FuelAfter,
    g.GPS_EntryCount,
    m.Manual_TotalAmount AS Manual_Volume,
    m.Manual_EntryCount,
    ROUND(COALESCE(g.GPS_TotalVolume, 0) - COALESCE(m.Manual_TotalAmount, 0), 2) AS Variance,
    CASE
        WHEN g.RefillDate IS NULL THEN 'GPS_MISSING'
        WHEN m.RefillDate IS NULL THEN 'MANUAL_MISSING (GPS Only)'
        WHEN ABS(COALESCE(g.GPS_TotalVolume, 0) - COALESCE(m.Manual_TotalAmount, 0)) <= 5 THEN 'MATCHED'
        ELSE 'VARIANCE'
    END AS Status
FROM (
    SELECT
        DATE(gre.DispenseDate) AS RefillDate,
        gre.VehicleId,
        SUM(gre.RefillVolume) AS GPS_TotalVolume,
        COUNT(*) AS GPS_EntryCount,
        MIN(gre.FuelBefore) AS GPS_FirstFuelBefore,
        MAX(gre.FuelAfter) AS GPS_LastFuelAfter
    FROM gpsgate_report_entries gre
    INNER JOIN vehicles v ON gre.VehicleId = v.VehicleId
    WHERE v.VehicleCode LIKE '%SM08%'
      AND gre.DispenseDate BETWEEN '2025-09-01' AND '2025-09-30'
      AND gre.IsDeleted = 0
    GROUP BY DATE(gre.DispenseDate), gre.VehicleId
) g
LEFT JOIN (
    SELECT
        DATE(fr.Date) AS RefillDate,
        fr.VehicleId,
        SUM(fr.ManualFuelrefillAmount) AS Manual_TotalAmount,
        COUNT(*) AS Manual_EntryCount
    FROM fuelrefill fr
    INNER JOIN vehicles v ON fr.VehicleId = v.VehicleId
    WHERE v.VehicleCode LIKE '%SM08%'
      AND fr.Date BETWEEN '2025-09-01' AND '2025-09-30'
      AND fr.IsDeleted = 0
    GROUP BY DATE(fr.Date), fr.VehicleId
) m ON g.RefillDate = m.RefillDate AND g.VehicleId = m.VehicleId
JOIN vehicles v ON g.VehicleId = v.VehicleId

UNION

SELECT
    COALESCE(g.RefillDate, m.RefillDate) AS Date,
    v.VehicleCode AS VehicleName,
    g.GPS_TotalVolume AS GPS_Volume,
    g.GPS_FirstFuelBefore AS GPS_FuelBefore,
    g.GPS_LastFuelAfter AS GPS_FuelAfter,
    g.GPS_EntryCount,
    m.Manual_TotalAmount AS Manual_Volume,
    m.Manual_EntryCount,
    ROUND(COALESCE(g.GPS_TotalVolume, 0) - COALESCE(m.Manual_TotalAmount, 0), 2) AS Variance,
    CASE
        WHEN g.RefillDate IS NULL THEN 'GPS_MISSING (Manual Only)'
        ELSE 'MATCHED'
    END AS Status
FROM (
    SELECT
        DATE(fr.Date) AS RefillDate,
        fr.VehicleId,
        SUM(fr.ManualFuelrefillAmount) AS Manual_TotalAmount,
        COUNT(*) AS Manual_EntryCount
    FROM fuelrefill fr
    INNER JOIN vehicles v ON fr.VehicleId = v.VehicleId
    WHERE v.VehicleCode LIKE '%SM08%'
      AND fr.Date BETWEEN '2025-09-01' AND '2025-09-30'
      AND fr.IsDeleted = 0
    GROUP BY DATE(fr.Date), fr.VehicleId
) m
LEFT JOIN (
    SELECT
        DATE(gre.DispenseDate) AS RefillDate,
        gre.VehicleId,
        SUM(gre.RefillVolume) AS GPS_TotalVolume,
        COUNT(*) AS GPS_EntryCount,
        MIN(gre.FuelBefore) AS GPS_FirstFuelBefore,
        MAX(gre.FuelAfter) AS GPS_LastFuelAfter
    FROM gpsgate_report_entries gre
    INNER JOIN vehicles v ON gre.VehicleId = v.VehicleId
    WHERE v.VehicleCode LIKE '%SM08%'
      AND gre.DispenseDate BETWEEN '2025-09-01' AND '2025-09-30'
      AND gre.IsDeleted = 0
    GROUP BY DATE(gre.DispenseDate), gre.VehicleId
) g ON m.RefillDate = g.RefillDate AND m.VehicleId = g.VehicleId
JOIN vehicles v ON m.VehicleId = v.VehicleId
WHERE g.RefillDate IS NULL

ORDER BY Date;

-- =============================================================================
-- STEP 5: Check GPSGate Report Generation Status
-- =============================================================================

-- 5.1 Recent GPSGate reports (SOAP 212)
SELECT
    r.ReportId,
    r.HandleId,
    r.ReportTypeId,
    r.Status,
    r.StartDate,
    r.EndDate,
    r.GeneratedAt,
    r.EntriesCount,
    r.UnmappedVehicleCount
FROM gpsgate_reports r
WHERE r.StartDate <= '2025-09-30' AND r.EndDate >= '2025-09-01'
ORDER BY r.GeneratedAt DESC
LIMIT 10;

-- 5.2 Count of entries per report
SELECT
    r.ReportId,
    r.HandleId,
    r.StartDate,
    r.EndDate,
    r.Status,
    COUNT(gre.Id) AS ActualEntries,
    r.EntriesCount AS ReportedEntries
FROM gpsgate_reports r
LEFT JOIN gpsgate_report_entries gre ON r.ReportId = gre.ReportId
WHERE r.StartDate <= '2025-09-30' AND r.EndDate >= '2025-09-01'
GROUP BY r.ReportId, r.HandleId, r.StartDate, r.EndDate, r.Status, r.EntriesCount
ORDER BY r.GeneratedAt DESC;

-- =============================================================================
-- STEP 6: Check for N/A data (vehicles without GPS data on dates with manual refills)
-- =============================================================================

-- 6.1 Find manual refill dates where GPS data is missing
SELECT
    DATE(fr.Date) AS RefillDate,
    v.VehicleId,
    v.VehicleCode AS VehicleName,
    SUM(fr.ManualFuelrefillAmount) AS Manual_Amount,
    COUNT(*) AS Manual_Count,
    (
        SELECT COUNT(*)
        FROM gpsgate_report_entries gre
        WHERE gre.VehicleId = v.VehicleId
          AND DATE(gre.DispenseDate) = DATE(fr.Date)
          AND gre.IsDeleted = 0
    ) AS GPS_Count,
    CASE
        WHEN (
            SELECT COUNT(*)
            FROM gpsgate_report_entries gre
            WHERE gre.VehicleId = v.VehicleId
              AND DATE(gre.DispenseDate) = DATE(fr.Date)
              AND gre.IsDeleted = 0
        ) = 0 THEN 'N/A - NO GPS DATA'
        ELSE 'Has GPS Data'
    END AS GPS_Status
FROM fuelrefill fr
INNER JOIN vehicles v ON fr.VehicleId = v.VehicleId
WHERE v.VehicleCode LIKE '%SM08%'
  AND fr.Date BETWEEN '2025-09-01' AND '2025-09-30'
  AND fr.IsDeleted = 0
GROUP BY DATE(fr.Date), v.VehicleId, v.VehicleCode
ORDER BY RefillDate;

-- =============================================================================
-- STEP 7: Debug FetchAndStore - Check for issues in stored data
-- =============================================================================

-- 7.1 Check if SM08 has correct ExternalDeviceId in provider mappings
SELECT
    vpm.*,
    v.VehicleCode,
    v.DeviceId AS LegacyDeviceId
FROM vehicle_provider_mappings vpm
INNER JOIN vehicles v ON vpm.VehicleId = v.VehicleId
WHERE v.VehicleCode LIKE '%SM08%';

-- 7.2 Check all GPS entries for SM08 (including deleted)
SELECT
    gre.*,
    v.VehicleCode AS VehicleName,
    r.HandleId AS ReportHandle,
    r.StartDate AS ReportStartDate,
    r.EndDate AS ReportEndDate
FROM gpsgate_report_entries gre
INNER JOIN vehicles v ON gre.VehicleId = v.VehicleId
LEFT JOIN gpsgate_reports r ON gre.ReportId = r.ReportId
WHERE v.VehicleCode LIKE '%SM08%'
  AND gre.DispenseDate BETWEEN '2025-09-01' AND '2025-09-30'
ORDER BY gre.DispenseDate, gre.StartTime;

-- =============================================================================
-- STEP 8: Identify the 02/09/2025 duplicate issue specifically
-- =============================================================================

-- 8.1 All entries for September 2, 2025 (the duplicate date mentioned)
SELECT
    'GPS' AS Source,
    gre.Id,
    v.VehicleCode AS VehicleName,
    gre.DispenseDate,
    gre.StartTime,
    gre.FuelBefore,
    gre.FuelAfter,
    gre.RefillVolume AS Amount,
    gre.IsDeleted,
    gre.MatchedManualRefillId
FROM gpsgate_report_entries gre
INNER JOIN vehicles v ON gre.VehicleId = v.VehicleId
WHERE v.VehicleCode LIKE '%SM08%'
  AND DATE(gre.DispenseDate) = '2025-09-02'

UNION ALL

SELECT
    'MANUAL' AS Source,
    fr.Id,
    v.VehicleCode AS VehicleName,
    fr.Date,
    TIME(fr.Date) AS StartTime,
    NULL AS FuelBefore,
    NULL AS FuelAfter,
    fr.ManualFuelrefillAmount AS Amount,
    fr.IsDeleted,
    NULL AS MatchedManualRefillId
FROM fuelrefill fr
INNER JOIN vehicles v ON fr.VehicleId = v.VehicleId
WHERE v.VehicleCode LIKE '%SM08%'
  AND DATE(fr.Date) = '2025-09-02'

ORDER BY DispenseDate, StartTime;

-- 8.2 All entries for September 9, 2025 (the date with GPS data)
SELECT
    'GPS' AS Source,
        gre.Id,
            v.VehicleCode AS VehicleName,
                gre.DispenseDate,
                    gre.StartTime,
                        gre.FuelBefore,
                            gre.FuelAfter,
                                gre.RefillVolume AS Amount,
                                    gre.IsDeleted,
                                        gre.MatchedManualRefillId
                                        FROM gpsgate_report_entries gre
                                        INNER JOIN vehicles v ON gre.VehicleId = v.VehicleId
                                        WHERE v.VehicleCode LIKE '%SM08%'
                                          AND DATE(gre.DispenseDate) = '2025-09-09'

                                          UNION ALL

                                          SELECT
                                              'MANUAL' AS Source,
                                                  fr.Id,
                                                      v.VehicleCode AS VehicleName,
                                                          fr.Date,
                                                              TIME(fr.Date) AS StartTime,
                                                                  NULL AS FuelBefore,
                                                                      NULL AS FuelAfter,
                                                                          fr.ManualFuelrefillAmount AS Amount,
                                                                              fr.IsDeleted,
                                                                                  NULL AS MatchedManualRefillId
                                                                                  FROM fuelrefill fr
                                                                                  INNER JOIN vehicles v ON fr.VehicleId = v.VehicleId
                                                                                  WHERE v.VehicleCode LIKE '%SM08%'
                                                                                    AND DATE(fr.Date) = '2025-09-09'

                                                                                    ORDER BY DispenseDate, StartTime;

-- =============================================================================
-- STEP 9: Summary Statistics for Category 1 vehicles (GPS Fleet)
-- =============================================================================

-- 9.1 Count of GPS entries vs Manual entries per vehicle per day
SELECT
    v.VehicleCode AS VehicleName,
    DATE(COALESCE(gre.DispenseDate, fr.Date)) AS RefillDate,
    COUNT(DISTINCT gre.Id) AS GPS_Entries,
    SUM(DISTINCT COALESCE(gre.RefillVolume, 0)) AS GPS_Total,
    COUNT(DISTINCT fr.Id) AS Manual_Entries,
    SUM(DISTINCT COALESCE(fr.ManualFuelrefillAmount, 0)) AS Manual_Total
FROM vehicles v
LEFT JOIN gpsgate_report_entries gre ON v.VehicleId = gre.VehicleId
    AND gre.DispenseDate BETWEEN '2025-09-01' AND '2025-09-30'
    AND gre.IsDeleted = 0
LEFT JOIN fuelrefill fr ON v.VehicleId = fr.VehicleId
    AND fr.Date BETWEEN '2025-09-01' AND '2025-09-30'
    AND fr.IsDeleted = 0
WHERE v.VehicleCode LIKE '%SM08%'
GROUP BY v.VehicleCode, DATE(COALESCE(gre.DispenseDate, fr.Date))
ORDER BY RefillDate;

-- =============================================================================
-- STEP 10: SPECIFIC DATE ANALYSIS (02/09/2025 and 09/09/2025)
-- =============================================================================

-- 10.1 Detailed analysis for 02/09/2025 (the duplicate N/A date)
-- Check if there are duplicate manual refills in the fuelrefill table
SELECT
    'ISSUE ANALYSIS: 02/09/2025' AS Analysis,
    '---' AS Separator;

SELECT
    fr.Id AS RefillId,
    v.VehicleId,
    v.VehicleCode,
    fr.Date AS RefillDateTime,
    fr.ManualFuelrefillAmount AS Amount,
    fr.TankId,
    t.TankName,
    fr.FuelBy,
    fr.Comment,
    fr.DateCreated,
    fr.IsDeleted,
    fr.IsCorrection,
    fr.CorrectsRecordId,
    'MANUAL_REFILL' AS DataType
FROM fuelrefill fr
INNER JOIN vehicles v ON fr.VehicleId = v.VehicleId
LEFT JOIN tanks t ON fr.TankId = t.TankId
WHERE v.VehicleCode LIKE '%SM08%'
  AND DATE(fr.Date) = '2025-09-02'
ORDER BY fr.Date;

-- Check GPS entries for 02/09/2025
SELECT
    gre.Id AS EntryId,
    v.VehicleId,
    v.VehicleCode,
    gre.DispenseDate,
    gre.StartTime,
    gre.FuelBefore,
    gre.FuelAfter,
    gre.RefillVolume,
    gre.IsDeleted,
    'GPS_ENTRY' AS DataType
FROM gpsgate_report_entries gre
INNER JOIN vehicles v ON gre.VehicleId = v.VehicleId
WHERE v.VehicleCode LIKE '%SM08%'
  AND DATE(gre.DispenseDate) = '2025-09-02';

-- 10.2 Detailed analysis for 09/09/2025 (date with GPS data)
SELECT
    'ISSUE ANALYSIS: 09/09/2025' AS Analysis,
    '---' AS Separator;

SELECT
    fr.Id AS RefillId,
    v.VehicleId,
    v.VehicleCode,
    fr.Date AS RefillDateTime,
    fr.ManualFuelrefillAmount AS Amount,
    fr.TankId,
    t.TankName,
    fr.FuelBy,
    fr.DateCreated,
    fr.IsDeleted,
    'MANUAL_REFILL' AS DataType
FROM fuelrefill fr
INNER JOIN vehicles v ON fr.VehicleId = v.VehicleId
LEFT JOIN tanks t ON fr.TankId = t.TankId
WHERE v.VehicleCode LIKE '%SM08%'
  AND DATE(fr.Date) = '2025-09-09'
ORDER BY fr.Date;

-- Check GPS entries for 09/09/2025
SELECT
    gre.Id AS EntryId,
    v.VehicleId,
    v.VehicleCode,
    gre.DispenseDate,
    gre.StartTime,
    gre.FuelBefore,
    gre.FuelAfter,
    gre.RefillVolume,
    gre.IsDeleted,
    'GPS_ENTRY' AS DataType
FROM gpsgate_report_entries gre
INNER JOIN vehicles v ON gre.VehicleId = v.VehicleId
WHERE v.VehicleCode LIKE '%SM08%'
  AND DATE(gre.DispenseDate) = '2025-09-09';

-- =============================================================================
-- STEP 11: CHECK DATE RANGE COVERAGE FOR GPS REPORTS
-- =============================================================================

-- 11.1 Find all GPS reports that should cover September 2025
SELECT
    r.ReportId,
    r.HandleId,
    r.StartDate,
    r.EndDate,
    r.Status,
    r.GeneratedAt,
    r.EntriesCount,
    CONCAT(r.StartDate, ' to ', r.EndDate) AS DateRange,
    CASE
        WHEN r.StartDate <= '2025-09-02' AND r.EndDate >= '2025-09-02' THEN 'COVERS 02/09'
        ELSE 'DOES NOT COVER 02/09'
    END AS Covers_Sep02,
    CASE
        WHEN r.StartDate <= '2025-09-09' AND r.EndDate >= '2025-09-09' THEN 'COVERS 09/09'
        ELSE 'DOES NOT COVER 09/09'
    END AS Covers_Sep09
FROM gpsgate_reports r
WHERE (r.StartDate <= '2025-09-30' AND r.EndDate >= '2025-09-01')
   OR r.StartDate BETWEEN '2025-09-01' AND '2025-09-30'
ORDER BY r.GeneratedAt DESC;

-- =============================================================================
-- STEP 12: IDENTIFY THE ROOT CAUSE - POSSIBLE REASONS
-- =============================================================================

-- 12.1 Check if 02/09/2025 was a date when vehicle was NOT refueled via GPSGate sensor
-- (i.e., manual refill but GPS didn't detect the fuel level change)
-- This could happen if:
-- a) Vehicle GPS was offline on that date
-- b) Fuel sensor malfunction
-- c) GPSGate report was not generated for that date range

-- Check if SM08 has ANY GPS entries in September
SELECT
    v.VehicleId,
    v.VehicleCode,
    COUNT(gre.Id) AS GPS_Entry_Count,
    MIN(DATE(gre.DispenseDate)) AS First_GPS_Date,
    MAX(DATE(gre.DispenseDate)) AS Last_GPS_Date,
    GROUP_CONCAT(DISTINCT DATE(gre.DispenseDate) ORDER BY gre.DispenseDate) AS All_GPS_Dates
FROM vehicles v
LEFT JOIN gpsgate_report_entries gre ON v.VehicleId = gre.VehicleId
    AND gre.DispenseDate BETWEEN '2025-09-01' AND '2025-09-30'
    AND gre.IsDeleted = 0
WHERE v.VehicleCode LIKE '%SM08%'
GROUP BY v.VehicleId, v.VehicleCode;

-- 12.2 Check all manual refill dates vs GPS entry dates for SM08
SELECT
    DATE(fr.Date) AS Manual_Refill_Date,
    SUM(fr.ManualFuelrefillAmount) AS Manual_Total,
    COUNT(*) AS Manual_Count,
    (
        SELECT COUNT(*)
        FROM gpsgate_report_entries gre
        WHERE gre.VehicleId = v.VehicleId
          AND DATE(gre.DispenseDate) = DATE(fr.Date)
          AND gre.IsDeleted = 0
    ) AS GPS_Entry_Count,
    CASE
        WHEN (
            SELECT COUNT(*)
            FROM gpsgate_report_entries gre
            WHERE gre.VehicleId = v.VehicleId
              AND DATE(gre.DispenseDate) = DATE(fr.Date)
              AND gre.IsDeleted = 0
        ) = 0 THEN '⚠️ NO GPS DATA - SHOWS N/A'
        ELSE '✅ GPS DATA EXISTS'
    END AS Status
FROM fuelrefill fr
INNER JOIN vehicles v ON fr.VehicleId = v.VehicleId
WHERE v.VehicleCode LIKE '%SM08%'
  AND fr.Date BETWEEN '2025-09-01' AND '2025-09-30'
  AND fr.IsDeleted = 0
GROUP BY DATE(fr.Date), v.VehicleId, v.VehicleCode
ORDER BY Manual_Refill_Date;

-- =============================================================================
-- STEP 13: FIX RECOMMENDATIONS
-- =============================================================================

-- If Step 12.2 shows dates without GPS data:
-- 1. Run FetchAndStoreGpsData for the date range that includes 02/09/2025
-- 2. Check if the GPSGate Report 212 for that date range returns data for SM08
-- 3. Verify vehicle_provider_mappings has correct ExternalDeviceId for SM08

-- Check the ExternalDeviceId mapping
SELECT
    '=== SM08 GPS MAPPING ===' AS Section,
    vpm.ExternalDeviceId AS GPSGate_Device_ID,
    vpm.DeviceName AS GPSGate_Device_Name,
    vpm.IsActive,
    'This ID should match the Vehicle column in GPSGate Report 212' AS Note
FROM vehicle_provider_mappings vpm
INNER JOIN vehicles v ON vpm.VehicleId = v.VehicleId
WHERE v.VehicleCode LIKE '%SM08%';
