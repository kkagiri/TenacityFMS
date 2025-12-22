-- Backfill missing gpsdata.dailytankreconciliation rows for 2025 based on gpsdata.tankstock.
--
-- Notes / assumptions (based on observed 2025 data):
-- - One tankstock row per (TankID, date) in 2025.
-- - dailytankreconciliation uses date at 00:00:00.
-- - TotalTransfersOut is stored as NEGATIVE of tankstock.TransferOutAmount.
-- - TotalRefills appears to be computed (often negative) from the balance equation:
--     TotalRefills = -(Opening + Deliveries + TransfersIn - Closing - TransfersOut)
--
-- IMPORTANT: Review the PREVIEW query results before running INSERT.
-- Recommended workflow:
--   1) Run PREVIEW (limit/order tweak as needed)
--   2) Run the CONSERVATIVE INSERT (only days with any real data)
--   3) Validate counts

-- ============================================================
-- 1) PREVIEW candidates (missing in dailytankreconciliation)
-- ============================================================

SELECT
  ts.TankID AS TankId,
  DATE(ts.EntryDate) AS d,
  CAST(DATE(ts.EntryDate) AS DATETIME) AS ReconciliationDate,
  ROUND(inf.opening_raw, 0) AS OpeningLevel,
  ROUND(inf.closing_raw, 0) AS ClosingLevel,
  -ROUND(inf.opening_raw + COALESCE(ts.DeliveryAmount,0) + COALESCE(ts.TransferInAmount,0) - inf.closing_raw - COALESCE(ts.TransferOutAmount,0), 0) AS TotalRefills,
  ROUND(COALESCE(ts.DeliveryAmount,0), 0) AS TotalDeliveries,
  ROUND(COALESCE(ts.TransferInAmount,0), 0) AS TotalTransfersIn,
  -ROUND(COALESCE(ts.TransferOutAmount,0), 0) AS TotalTransfersOut,
  (COALESCE(ts.ManualOpeningLevel, ts.SensorOpeningLevel) IS NULL) AS InferredOpening,
  (COALESCE(ts.ManualClosingLevel, ts.SensorClosingLevel) IS NULL) AS InferredClosing,
  inf.opening_raw,
  inf.closing_raw,
  ts.ManualOpeningLevel,
  ts.ManualClosingLevel,
  ts.SensorOpeningLevel,
  ts.SensorClosingLevel,
  ts.DeliveryAmount,
  ts.TransferInAmount,
  ts.TransferOutAmount
FROM gpsdata.tankstock ts
LEFT JOIN gpsdata.dailytankreconciliation r
  ON r.TankId = ts.TankID
 AND DATE(r.ReconciliationDate) = DATE(ts.EntryDate)
JOIN (
  SELECT
    tsx.EntryID,
    -- Opening: prefer same-day opening level; else last known level; else next known level
    COALESCE(
      tsx.ManualOpeningLevel,
      tsx.SensorOpeningLevel,
      (
        SELECT COALESCE(ts2.ManualClosingLevel, ts2.SensorClosingLevel, ts2.ManualOpeningLevel, ts2.SensorOpeningLevel)
        FROM gpsdata.tankstock ts2
        WHERE ts2.IsDeleted = 0
          AND ts2.TankID = tsx.TankID
          AND ts2.EntryDate < tsx.EntryDate
          AND COALESCE(ts2.ManualClosingLevel, ts2.SensorClosingLevel, ts2.ManualOpeningLevel, ts2.SensorOpeningLevel) IS NOT NULL
        ORDER BY ts2.EntryDate DESC
        LIMIT 1
      ),
      (
        SELECT COALESCE(ts3.ManualOpeningLevel, ts3.SensorOpeningLevel, ts3.ManualClosingLevel, ts3.SensorClosingLevel)
        FROM gpsdata.tankstock ts3
        WHERE ts3.IsDeleted = 0
          AND ts3.TankID = tsx.TankID
          AND ts3.EntryDate > tsx.EntryDate
          AND COALESCE(ts3.ManualOpeningLevel, ts3.SensorOpeningLevel, ts3.ManualClosingLevel, ts3.SensorClosingLevel) IS NOT NULL
        ORDER BY ts3.EntryDate ASC
        LIMIT 1
      )
    ) AS opening_raw,

    -- Closing: prefer same-day closing; else next known level; else opening
    COALESCE(
      tsx.ManualClosingLevel,
      tsx.SensorClosingLevel,
      (
        SELECT COALESCE(ts3.ManualOpeningLevel, ts3.SensorOpeningLevel, ts3.ManualClosingLevel, ts3.SensorClosingLevel)
        FROM gpsdata.tankstock ts3
        WHERE ts3.IsDeleted = 0
          AND ts3.TankID = tsx.TankID
          AND ts3.EntryDate > tsx.EntryDate
          AND COALESCE(ts3.ManualOpeningLevel, ts3.SensorOpeningLevel, ts3.ManualClosingLevel, ts3.SensorClosingLevel) IS NOT NULL
        ORDER BY ts3.EntryDate ASC
        LIMIT 1
      ),
      COALESCE(
        tsx.ManualOpeningLevel,
        tsx.SensorOpeningLevel,
        (
          SELECT COALESCE(ts2.ManualClosingLevel, ts2.SensorClosingLevel, ts2.ManualOpeningLevel, ts2.SensorOpeningLevel)
          FROM gpsdata.tankstock ts2
          WHERE ts2.IsDeleted = 0
            AND ts2.TankID = tsx.TankID
            AND ts2.EntryDate < tsx.EntryDate
            AND COALESCE(ts2.ManualClosingLevel, ts2.SensorClosingLevel, ts2.ManualOpeningLevel, ts2.SensorOpeningLevel) IS NOT NULL
          ORDER BY ts2.EntryDate DESC
          LIMIT 1
        ),
        (
          SELECT COALESCE(ts3.ManualOpeningLevel, ts3.SensorOpeningLevel, ts3.ManualClosingLevel, ts3.SensorClosingLevel)
          FROM gpsdata.tankstock ts3
          WHERE ts3.IsDeleted = 0
            AND ts3.TankID = tsx.TankID
            AND ts3.EntryDate > tsx.EntryDate
            AND COALESCE(ts3.ManualOpeningLevel, ts3.SensorOpeningLevel, ts3.ManualClosingLevel, ts3.SensorClosingLevel) IS NOT NULL
          ORDER BY ts3.EntryDate ASC
          LIMIT 1
        )
      )
    ) AS closing_raw
  FROM gpsdata.tankstock tsx
) inf
  ON inf.EntryID = ts.EntryID
WHERE ts.IsDeleted = 0
  AND ts.EntryDate >= '2025-01-01' AND ts.EntryDate < '2026-01-01'
  AND r.Id IS NULL
ORDER BY ts.EntryDate DESC
LIMIT 200;

-- ============================================================
-- 2) CONSERVATIVE INSERT
--    Only insert when tankstock has ANY real data:
--      - opening/closing present OR
--      - delivery/transfer amount present
-- ============================================================

INSERT INTO gpsdata.dailytankreconciliation
(
  TankId,
  ReconciliationDate,
  OpeningLevel,
  ClosingLevel,
  TotalRefills,
  TotalDeliveries,
  TotalTransfersIn,
  TotalTransfersOut,
  CreatedOn
)
SELECT
  ts.TankID AS TankId,
  CAST(DATE(ts.EntryDate) AS DATETIME) AS ReconciliationDate,
  ROUND(inf.opening_raw, 0) AS OpeningLevel,
  ROUND(inf.closing_raw, 0) AS ClosingLevel,
  -ROUND(inf.opening_raw + COALESCE(ts.DeliveryAmount,0) + COALESCE(ts.TransferInAmount,0) - inf.closing_raw - COALESCE(ts.TransferOutAmount,0), 0) AS TotalRefills,
  ROUND(COALESCE(ts.DeliveryAmount,0), 0) AS TotalDeliveries,
  ROUND(COALESCE(ts.TransferInAmount,0), 0) AS TotalTransfersIn,
  -ROUND(COALESCE(ts.TransferOutAmount,0), 0) AS TotalTransfersOut,
  NOW() AS CreatedOn
FROM gpsdata.tankstock ts
LEFT JOIN gpsdata.dailytankreconciliation r
  ON r.TankId = ts.TankID
 AND DATE(r.ReconciliationDate) = DATE(ts.EntryDate)
JOIN (
  SELECT
    tsx.EntryID,
    COALESCE(
      tsx.ManualOpeningLevel,
      tsx.SensorOpeningLevel,
      (
        SELECT COALESCE(ts2.ManualClosingLevel, ts2.SensorClosingLevel, ts2.ManualOpeningLevel, ts2.SensorOpeningLevel)
        FROM gpsdata.tankstock ts2
        WHERE ts2.IsDeleted = 0
          AND ts2.TankID = tsx.TankID
          AND ts2.EntryDate < tsx.EntryDate
          AND COALESCE(ts2.ManualClosingLevel, ts2.SensorClosingLevel, ts2.ManualOpeningLevel, ts2.SensorOpeningLevel) IS NOT NULL
        ORDER BY ts2.EntryDate DESC
        LIMIT 1
      ),
      (
        SELECT COALESCE(ts3.ManualOpeningLevel, ts3.SensorOpeningLevel, ts3.ManualClosingLevel, ts3.SensorClosingLevel)
        FROM gpsdata.tankstock ts3
        WHERE ts3.IsDeleted = 0
          AND ts3.TankID = tsx.TankID
          AND ts3.EntryDate > tsx.EntryDate
          AND COALESCE(ts3.ManualOpeningLevel, ts3.SensorOpeningLevel, ts3.ManualClosingLevel, ts3.SensorClosingLevel) IS NOT NULL
        ORDER BY ts3.EntryDate ASC
        LIMIT 1
      )
    ) AS opening_raw,
    COALESCE(
      tsx.ManualClosingLevel,
      tsx.SensorClosingLevel,
      (
        SELECT COALESCE(ts3.ManualOpeningLevel, ts3.SensorOpeningLevel, ts3.ManualClosingLevel, ts3.SensorClosingLevel)
        FROM gpsdata.tankstock ts3
        WHERE ts3.IsDeleted = 0
          AND ts3.TankID = tsx.TankID
          AND ts3.EntryDate > tsx.EntryDate
          AND COALESCE(ts3.ManualOpeningLevel, ts3.SensorOpeningLevel, ts3.ManualClosingLevel, ts3.SensorClosingLevel) IS NOT NULL
        ORDER BY ts3.EntryDate ASC
        LIMIT 1
      ),
      COALESCE(
        tsx.ManualOpeningLevel,
        tsx.SensorOpeningLevel,
        (
          SELECT COALESCE(ts2.ManualClosingLevel, ts2.SensorClosingLevel, ts2.ManualOpeningLevel, ts2.SensorOpeningLevel)
          FROM gpsdata.tankstock ts2
          WHERE ts2.IsDeleted = 0
            AND ts2.TankID = tsx.TankID
            AND ts2.EntryDate < tsx.EntryDate
            AND COALESCE(ts2.ManualClosingLevel, ts2.SensorClosingLevel, ts2.ManualOpeningLevel, ts2.SensorOpeningLevel) IS NOT NULL
          ORDER BY ts2.EntryDate DESC
          LIMIT 1
        ),
        (
          SELECT COALESCE(ts3.ManualOpeningLevel, ts3.SensorOpeningLevel, ts3.ManualClosingLevel, ts3.SensorClosingLevel)
          FROM gpsdata.tankstock ts3
          WHERE ts3.IsDeleted = 0
            AND ts3.TankID = tsx.TankID
            AND ts3.EntryDate > tsx.EntryDate
            AND COALESCE(ts3.ManualOpeningLevel, ts3.SensorOpeningLevel, ts3.ManualClosingLevel, ts3.SensorClosingLevel) IS NOT NULL
          ORDER BY ts3.EntryDate ASC
          LIMIT 1
        )
      )
    ) AS closing_raw
  FROM gpsdata.tankstock tsx
) inf
  ON inf.EntryID = ts.EntryID
WHERE ts.IsDeleted = 0
  AND ts.EntryDate >= '2025-01-01' AND ts.EntryDate < '2026-01-01'
  AND r.Id IS NULL
  AND (
    COALESCE(ts.ManualOpeningLevel, ts.SensorOpeningLevel, ts.ManualClosingLevel, ts.SensorClosingLevel) IS NOT NULL
    OR COALESCE(ts.DeliveryAmount, ts.TransferInAmount, ts.TransferOutAmount) IS NOT NULL
  );

-- ============================================================
-- 3) VALIDATION
-- ============================================================

-- Remaining missing tank-days in 2025 after insert (should drop from 1789)
SELECT
  COUNT(*) AS MissingDaily_2025
FROM (
  SELECT ts.TankID, DATE(ts.EntryDate) AS d
  FROM gpsdata.tankstock ts
  LEFT JOIN gpsdata.dailytankreconciliation r
    ON r.TankId = ts.TankID
   AND DATE(r.ReconciliationDate) = DATE(ts.EntryDate)
  WHERE ts.IsDeleted = 0
    AND ts.EntryDate >= '2025-01-01' AND ts.EntryDate < '2026-01-01'
    AND r.Id IS NULL
  GROUP BY ts.TankID, DATE(ts.EntryDate)
) x;
