-- ============================================================================
-- Server-Side Delivery Detection Configuration
-- Seeds the systemconfiguration table with the 6 config keys used by
-- ServerSideDeliveryDetectionService's Redis state machine.
-- Run once per environment.  Safe to re-run (INSERT IGNORE).
-- ============================================================================

INSERT IGNORE INTO systemconfiguration (`Key`, `Value`, `Description`, `CreatedAt`)
VALUES
('ITD.ServerDetection.Enabled',              'false', 'Enable server-side in-tank delivery detection from UploadStatus probe readings',  NOW()),
('ITD.ServerDetection.NoiseBandLiters',      '10',    'Volume noise band (L) – changes within this band are ignored',                      NOW()),
('ITD.ServerDetection.MinRiseThresholdLiters','50',   'Minimum total volume rise (L) to qualify as a delivery',                             NOW()),
('ITD.ServerDetection.StableReadingsRequired','5',    'Consecutive stable readings at peak level before confirming delivery',                NOW()),
('ITD.ServerDetection.MaxDurationMinutes',   '120',   'Maximum duration (min) of a single delivery detection cycle before timeout reset',    NOW()),
('ITD.ServerDetection.DuplicateWindowMinutes','10',   'Time window (min) for duplicate check against firmware-detected ITD records',          NOW());
