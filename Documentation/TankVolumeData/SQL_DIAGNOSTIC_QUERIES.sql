-- =============================================
-- Tank Volume History Diagnostic Queries
-- =============================================
-- Use these queries to identify corrupted data
-- in your database before running corrections

-- =============================================
-- QUERY 1: Find All Sequence Breaks
-- =============================================
-- Shows all transactions where calculated volume doesn't match actual
-- This is the SQL equivalent of the DETECT phase

SELECT
    h.Id AS TransactionId,
    h.TankId,
    t.Name AS TankName,
    h.Timestamp,
    h.ChangeReason,
    h.VolumeChange,
    h.NewVolume AS ActualNewVolume,
    LAG(h.NewVolume) OVER (PARTITION BY h.TankId ORDER BY h.Timestamp, h.Id) AS PreviousNewVolume,
    (LAG(h.NewVolume) OVER (PARTITION BY h.TankId ORDER BY h.Timestamp, h.Id) + h.VolumeChange) AS ExpectedNewVolume,
    h.NewVolume - (LAG(h.NewVolume) OVER (PARTITION BY h.TankId ORDER BY h.Timestamp, h.Id) + h.VolumeChange) AS Variance,
    CASE
        WHEN ABS(h.NewVolume - (LAG(h.NewVolume) OVER (PARTITION BY h.TankId ORDER BY h.Timestamp, h.Id) + h.VolumeChange)) > 0.01
        THEN 'BROKEN'
        ELSE 'OK'
    END AS Status,
    CASE
        WHEN ABS(h.NewVolume - (LAG(h.NewVolume) OVER (PARTITION BY h.TankId ORDER BY h.Timestamp, h.Id) + h.VolumeChange)) >= 1000 THEN 'CRITICAL'
        WHEN ABS(h.NewVolume - (LAG(h.NewVolume) OVER (PARTITION BY h.TankId ORDER BY h.Timestamp, h.Id) + h.VolumeChange)) >= 500 THEN 'HIGH'
        WHEN ABS(h.NewVolume - (LAG(h.NewVolume) OVER (PARTITION BY h.TankId ORDER BY h.Timestamp, h.Id) + h.VolumeChange)) >= 100 THEN 'MEDIUM'
        WHEN ABS(h.NewVolume - (LAG(h.NewVolume) OVER (PARTITION BY h.TankId ORDER BY h.Timestamp, h.Id) + h.VolumeChange)) >= 10 THEN 'LOW'
        ELSE 'MINIMAL'
    END AS Severity
FROM
    TankVolumeHistory h
    INNER JOIN Tanks t ON h.TankId = t.Id
WHERE
    h.IsDeleted != 1
    AND h.Timestamp >= DATEADD(DAY, -30, CAST(GETDATE() AS DATE))  -- Last 30 days
ORDER BY
    h.TankId, h.Timestamp, h.Id;

-- =============================================
-- QUERY 2: Find Tanks with Broken Sequences
-- =============================================
-- Summary of which tanks have corruption

WITH SequenceBreaks AS (
    SELECT
        h.Id,
        h.TankId,
        h.Timestamp,
        h.VolumeChange,
        h.NewVolume,
        LAG(h.NewVolume) OVER (PARTITION BY h.TankId ORDER BY h.Timestamp, h.Id) AS PreviousNewVolume,
        h.NewVolume - (LAG(h.NewVolume) OVER (PARTITION BY h.TankId ORDER BY h.Timestamp, h.Id) + h.VolumeChange) AS Variance
    FROM
        TankVolumeHistory h
    WHERE
        h.IsDeleted != 1
        AND h.Timestamp >= DATEADD(DAY, -30, CAST(GETDATE() AS DATE))
)
SELECT
    t.Id AS TankId,
    t.Name AS TankName,
    t.SiteId,
    COUNT(*) AS TotalBreaks,
    COUNT(DISTINCT CAST(sb.Timestamp AS DATE)) AS DaysAffected,
    MAX(ABS(sb.Variance)) AS MaxVariance,
    SUM(ABS(sb.Variance)) AS TotalVariance,
    MIN(sb.Timestamp) AS EarliestBreak,
    MAX(sb.Timestamp) AS LatestBreak
FROM
    SequenceBreaks sb
    INNER JOIN Tanks t ON sb.TankId = t.Id
WHERE
    ABS(sb.Variance) > 0.01
GROUP BY
    t.Id, t.Name, t.SiteId
ORDER BY
    MaxVariance DESC, TotalBreaks DESC;

-- =============================================
-- QUERY 3: Find Specific Date Range Issues
-- =============================================
-- Customize this query for your problem date

DECLARE @TankId INT = 7;  -- ST7
DECLARE @StartDate DATETIME = '2025-11-05 00:00:00';
DECLARE @EndDate DATETIME = '2025-11-05 23:59:59';

SELECT
    h.Id AS TransactionId,
    h.Timestamp,
    h.ChangeReason,
    h.VolumeChange,
    h.NewVolume AS ActualVolume,
    LAG(h.NewVolume) OVER (ORDER BY h.Timestamp, h.Id) AS PreviousVolume,
    LAG(h.NewVolume) OVER (ORDER BY h.Timestamp, h.Id) + h.VolumeChange AS CalculatedVolume,
    CASE
        WHEN ABS(h.NewVolume - (LAG(h.NewVolume) OVER (ORDER BY h.Timestamp, h.Id) + h.VolumeChange)) > 0.01
        THEN 'ERROR'
        ELSE 'OK'
    END AS Status,
    h.RecordedBy,
    h.CreatedOn
FROM
    TankVolumeHistory h
WHERE
    h.TankId = @TankId
    AND h.Timestamp >= @StartDate
    AND h.Timestamp <= @EndDate
    AND h.IsDeleted != 1
ORDER BY
    h.Timestamp, h.Id;

-- =============================================
-- QUERY 4: Find Same-Timestamp Transaction Groups
-- =============================================
-- Shows groups of transactions with identical timestamps (prone to ordering issues)

SELECT
    TankId,
    Timestamp,
    COUNT(*) AS TransactionCount,
    STRING_AGG(CAST(Id AS VARCHAR), ', ') AS TransactionIds,
    STRING_AGG(CAST(ChangeReason AS VARCHAR), ', ') AS Reasons
FROM
    TankVolumeHistory
WHERE
    IsDeleted != 1
    AND Timestamp >= DATEADD(DAY, -30, CAST(GETDATE() AS DATE))
GROUP BY
    TankId, Timestamp
HAVING
    COUNT(*) > 1  -- Only groups with multiple transactions at same time
ORDER BY
    TankId, Timestamp DESC;

-- =============================================
-- QUERY 5: Verify Closing Stock Formula
-- =============================================
-- Check: ClosingStock = OpeningStock + Deliveries + TransfersIn - Dispensing - TransfersOut

DECLARE @TankId INT = 7;
DECLARE @Date DATE = '2025-11-05';

WITH DayTransactions AS (
    SELECT
        h.TankId,
        CAST(h.Timestamp AS DATE) AS TransactionDate,
        h.ChangeReason,
        SUM(h.VolumeChange) AS TotalChange
    FROM
        TankVolumeHistory h
    WHERE
        h.TankId = @TankId
        AND CAST(h.Timestamp AS DATE) = @Date
        AND h.IsDeleted != 1
    GROUP BY
        h.TankId, CAST(h.Timestamp AS DATE), h.ChangeReason
),
OpeningStock AS (
    SELECT
        h.TankId,
        h.NewVolume AS OpeningVolume
    FROM
        TankVolumeHistory h
    WHERE
        h.TankId = @TankId
        AND CAST(h.Timestamp AS DATE) = @Date
        AND h.ChangeReason = 1  -- OpeningStock enum value = 1
        AND h.IsDeleted != 1
),
ClosingStock AS (
    SELECT
        h.TankId,
        h.NewVolume AS ClosingVolume
    FROM
        TankVolumeHistory h
    WHERE
        h.TankId = @TankId
        AND CAST(h.Timestamp AS DATE) = @Date
        AND h.ChangeReason = 2  -- ClosingStock enum value = 2
        AND h.IsDeleted != 1
)
SELECT
    os.OpeningVolume,
    ISNULL((SELECT TotalChange FROM DayTransactions WHERE ChangeReason = 3), 0) AS DeliveryVolume,  -- Delivery = 3
    ISNULL((SELECT TotalChange FROM DayTransactions WHERE ChangeReason = 4), 0) AS DispensingVolume,  -- Dispensing = 4
    ISNULL((SELECT TotalChange FROM DayTransactions WHERE ChangeReason = 5), 0) AS TransferInVolume,  -- TransferIn = 5
    ISNULL((SELECT TotalChange FROM DayTransactions WHERE ChangeReason = 6), 0) AS TransferOutVolume,  -- TransferOut = 6
    cs.ClosingVolume AS ActualClosingVolume,
    (os.OpeningVolume
        + ISNULL((SELECT TotalChange FROM DayTransactions WHERE ChangeReason = 3), 0)
        + ISNULL((SELECT TotalChange FROM DayTransactions WHERE ChangeReason = 5), 0)
        + ISNULL((SELECT TotalChange FROM DayTransactions WHERE ChangeReason = 4), 0)
        + ISNULL((SELECT TotalChange FROM DayTransactions WHERE ChangeReason = 6), 0)
    ) AS CalculatedClosingVolume,
    cs.ClosingVolume - (os.OpeningVolume
        + ISNULL((SELECT TotalChange FROM DayTransactions WHERE ChangeReason = 3), 0)
        + ISNULL((SELECT TotalChange FROM DayTransactions WHERE ChangeReason = 5), 0)
        + ISNULL((SELECT TotalChange FROM DayTransactions WHERE ChangeReason = 4), 0)
        + ISNULL((SELECT TotalChange FROM DayTransactions WHERE ChangeReason = 6), 0)
    ) AS Variance
FROM
    OpeningStock os
    CROSS JOIN ClosingStock cs;

-- =============================================
-- QUERY 6: Find Transactions Needing Correction
-- =============================================
-- Returns exact list of transaction IDs that need NewVolume recalculation

WITH BrokenTransactions AS (
    SELECT
        h.Id AS TransactionId,
        h.TankId,
        h.Timestamp,
        h.ChangeReason,
        h.VolumeChange,
        h.NewVolume AS CurrentNewVolume,
        LAG(h.NewVolume) OVER (PARTITION BY h.TankId ORDER BY h.Timestamp, h.Id) AS PreviousNewVolume,
        (LAG(h.NewVolume) OVER (PARTITION BY h.TankId ORDER BY h.Timestamp, h.Id) + h.VolumeChange) AS CorrectNewVolume
    FROM
        TankVolumeHistory h
    WHERE
        h.IsDeleted != 1
        AND h.Timestamp >= DATEADD(DAY, -30, CAST(GETDATE() AS DATE))
)
SELECT
    TransactionId,
    TankId,
    Timestamp,
    ChangeReason,
    VolumeChange,
    CurrentNewVolume,
    CorrectNewVolume,
    (CorrectNewVolume - CurrentNewVolume) AS CorrectionAmount
FROM
    BrokenTransactions
WHERE
    ABS(CurrentNewVolume - CorrectNewVolume) > 0.01
ORDER BY
    TankId, Timestamp, TransactionId;

-- =============================================
-- QUERY 7: Data Integrity Report by Tank and Date
-- =============================================

SELECT
    t.Id AS TankId,
    t.Name AS TankName,
    CAST(h.Timestamp AS DATE) AS Date,
    COUNT(*) AS TransactionCount,
    COUNT(DISTINCT h.ChangeReason) AS ReasonTypeCount,
    SUM(CASE WHEN h.ChangeReason = 1 THEN 1 ELSE 0 END) AS OpeningStocks,
    SUM(CASE WHEN h.ChangeReason = 2 THEN 1 ELSE 0 END) AS ClosingStocks,
    SUM(CASE WHEN h.ChangeReason = 3 THEN 1 ELSE 0 END) AS Deliveries,
    SUM(CASE WHEN h.ChangeReason = 4 THEN 1 ELSE 0 END) AS Dispensing,
    SUM(CASE WHEN h.ChangeReason = 5 THEN 1 ELSE 0 END) AS TransfersIn,
    SUM(CASE WHEN h.ChangeReason = 6 THEN 1 ELSE 0 END) AS TransfersOut,
    MIN(h.NewVolume) AS MinVolume,
    MAX(h.NewVolume) AS MaxVolume,
    CASE
        WHEN COUNT(DISTINCT h.ChangeReason) >= 2 THEN 'Good'
        WHEN COUNT(*) = 0 THEN 'No Data'
        ELSE 'Sparse'
    END AS DataQuality
FROM
    TankVolumeHistory h
    INNER JOIN Tanks t ON h.TankId = t.Id
WHERE
    h.IsDeleted != 1
    AND h.Timestamp >= DATEADD(DAY, -30, CAST(GETDATE() AS DATE))
GROUP BY
    t.Id, t.Name, CAST(h.Timestamp AS DATE)
ORDER BY
    t.Id, CAST(h.Timestamp AS DATE) DESC;

-- =============================================
-- QUERY 8: Before-Correction Snapshot
-- =============================================
-- Run this BEFORE corrections to capture state

CREATE TABLE TankVolumeHistory_PreCorrection_Backup AS
SELECT *
FROM TankVolumeHistory
WHERE TankId = 7  -- Change to your tank ID
  AND Timestamp >= '2025-11-05 00:00:00'
  AND Timestamp <= '2025-11-05 23:59:59';

SELECT
    COUNT(*) AS RecordsBackedUp,
    MIN(Timestamp) AS EarliestRecord,
    MAX(Timestamp) AS LatestRecord
FROM
    TankVolumeHistory_PreCorrection_Backup;

-- =============================================
-- QUERY 9: After-Correction Verification
-- =============================================
-- Run this AFTER corrections to verify they worked

SELECT
    'Status' AS MetricName,
    CASE
        WHEN COUNT(CASE WHEN ABS(NewVolume - (LAG(NewVolume) OVER (ORDER BY Timestamp, Id) + VolumeChange)) > 0.01 THEN 1 END) = 0
        THEN 'OK - No Breaks'
        ELSE 'ERROR - Still Has Breaks'
    END AS Value
FROM
    TankVolumeHistory
WHERE
    TankId = 7
    AND Timestamp >= '2025-11-05 00:00:00'
    AND Timestamp <= '2025-11-05 23:59:59'
    AND IsDeleted != 1;

-- =============================================
-- QUERY 10: Compare Before/After Corrections
-- =============================================
-- Run this after creating backup and correcting data

SELECT
    'TransactionId' AS ComparisonMetric,
    COUNT(DISTINCT b.Id) AS CountBefore,
    COUNT(DISTINCT a.Id) AS CountAfter,
    'Should Match' AS ExpectedResult
FROM
    TankVolumeHistory_PreCorrection_Backup b
    FULL OUTER JOIN TankVolumeHistory a
        ON b.Id = a.Id
UNION ALL
SELECT
    'Changed NewVolume Values',
    COUNT(*),
    COUNT(DISTINCT Id),
    'Count of changed records'
FROM
    TankVolumeHistory a
    INNER JOIN TankVolumeHistory_PreCorrection_Backup b ON a.Id = b.Id
WHERE
    ABS(a.NewVolume - b.NewVolume) > 0.01;

