-- ============================================================================
-- Seed: Issue Template Workflows
-- Date: 2026-04-23
-- Purpose: Seed the staged completion workflow model for the 8 baseline issue
--          templates. This replaces the legacy action-only seed script.
-- Notes:
--   * MySQL 5.5 / 5.6 safe
--   * Creates missing workflows and stages idempotently
--   * Upserts the 29 baseline template actions and assigns them to stages
-- ============================================================================

SET @next_workflow_id := (SELECT IFNULL(MAX(`ID`), 0) FROM `gpsdata`.`issuetemplateworkflow`);

INSERT INTO `gpsdata`.`issuetemplateworkflow` (`ID`, `IssueTemplateID`, `Name`, `IsActive`, `RowVersion`, `CreatedAt`, `UpdatedAt`)
SELECT
    @next_workflow_id := @next_workflow_id + 1,
    template_seed.TemplateId,
    template_seed.WorkflowName,
    1,
    1,
    UTC_TIMESTAMP(),
    UTC_TIMESTAMP()
FROM (
    SELECT 1 AS TemplateId, 'No Ignition workflow' AS WorkflowName
    UNION ALL SELECT 2, 'Sensor Complete Disconnection workflow'
    UNION ALL SELECT 3, 'Calibration workflow'
    UNION ALL SELECT 4, 'Sensor Keeps Disconnecting workflow'
    UNION ALL SELECT 5, 'Replacement Sensor workflow'
    UNION ALL SELECT 6, 'GPS Offline workflow'
    UNION ALL SELECT 7, 'Fuel Activity While GPS Offline workflow'
    UNION ALL SELECT 8, 'RCS Fuel Sensor Cover Removed workflow'
) template_seed
LEFT JOIN `gpsdata`.`issuetemplateworkflow` existing_workflow
    ON existing_workflow.`IssueTemplateID` = template_seed.TemplateId
WHERE existing_workflow.`ID` IS NULL;

SET @next_stage_id := (SELECT IFNULL(MAX(`ID`), 0) FROM `gpsdata`.`issuetemplateworkflowstage`);

INSERT INTO `gpsdata`.`issuetemplateworkflowstage` (`ID`, `WorkflowID`, `Name`, `Description`, `Color`, `SortOrder`, `IsActive`, `CreatedAt`, `UpdatedAt`)
SELECT
    @next_stage_id := @next_stage_id + 1,
    workflow_seed.WorkflowId,
    workflow_seed.StageName,
    workflow_seed.StageDescription,
    workflow_seed.StageColor,
    workflow_seed.SortOrder,
    1,
    UTC_TIMESTAMP(),
    UTC_TIMESTAMP()
FROM (
    SELECT workflow.`ID` AS WorkflowId, 'Diagnose' AS StageName, 'Initial diagnosis and problem scoping' AS StageDescription, '#0078d4' AS StageColor, 0 AS SortOrder
    FROM `gpsdata`.`issuetemplateworkflow` workflow
    WHERE workflow.`IssueTemplateID` BETWEEN 1 AND 8
    UNION ALL
    SELECT workflow.`ID`, 'Repair', 'Physical repair, replacement, or installation work', '#ca5010', 1
    FROM `gpsdata`.`issuetemplateworkflow` workflow
    WHERE workflow.`IssueTemplateID` BETWEEN 1 AND 8
    UNION ALL
    SELECT workflow.`ID`, 'Verify', 'Final validation and sign-off checks', '#107c10', 2
    FROM `gpsdata`.`issuetemplateworkflow` workflow
    WHERE workflow.`IssueTemplateID` BETWEEN 1 AND 8
) workflow_seed
LEFT JOIN `gpsdata`.`issuetemplateworkflowstage` existing_stage
    ON existing_stage.`WorkflowID` = workflow_seed.WorkflowId
   AND existing_stage.`Name` = workflow_seed.StageName
WHERE existing_stage.`ID` IS NULL;

INSERT INTO `gpsdata`.`issuetemplateaction`
(
    `ID`,
    `IssueTemplateID`,
    `Name`,
    `ActionType`,
    `Description`,
    `RequiresDeviceDetails`,
    `RequiresSourceVehicle`,
    `RequiresCameraDetails`,
    `StageID`,
    `PositionX`,
    `PositionY`,
    `SortOrder`,
    `IsActive`,
    `CreatedAt`,
    `UpdatedAt`
)
SELECT
    action_seed.ActionId,
    action_seed.TemplateId,
    action_seed.ActionName,
    action_seed.ActionType,
    action_seed.ActionDescription,
    action_seed.RequiresDeviceDetails,
    action_seed.RequiresSourceVehicle,
    action_seed.RequiresCameraDetails,
    stage.`ID` AS StageID,
    action_seed.PositionX,
    action_seed.PositionY,
    action_seed.SortOrder,
    1,
    UTC_TIMESTAMP(),
    UTC_TIMESTAMP()
FROM (
    SELECT 1 AS ActionId, 1 AS TemplateId, 'Check Power Supply' AS ActionName, 'General' AS ActionType, 'Inspect vehicle battery, fuse box, and wiring to the GPS device' AS ActionDescription, 0 AS RequiresDeviceDetails, 0 AS RequiresSourceVehicle, 0 AS RequiresCameraDetails, 'Diagnose' AS StageName, 48 AS PositionX, 52 AS PositionY, 1 AS SortOrder
    UNION ALL SELECT 2, 1, 'Reset GPS Device', 'General', 'Power-cycle or factory-reset the GPS tracking device', 0, 0, 0, 'Repair', 348, 272, 2
    UNION ALL SELECT 3, 1, 'Replace GPS Device', 'DeviceChange', 'Swap out the faulty GPS device with a new or refurbished unit', 1, 1, 0, 'Repair', 648, 272, 3

    UNION ALL SELECT 4, 2, 'Check Wiring & Connections', 'General', 'Inspect sensor wiring, connectors, and harness for damage or loose contacts', 0, 0, 0, 'Diagnose', 48, 52, 1
    UNION ALL SELECT 5, 2, 'Reconnect Sensor', 'General', 'Re-seat or reconnect the fuel sensor plug and verify signal', 0, 0, 0, 'Repair', 348, 272, 2
    UNION ALL SELECT 6, 2, 'Replace Fuel Sensor', 'DeviceChange', 'Replace the disconnected fuel sensor with a new unit', 1, 0, 0, 'Repair', 648, 272, 3
    UNION ALL SELECT 7, 2, 'Install Surveillance Camera', 'CameraInstall', 'Install a camera to monitor for tampering or intentional disconnection', 0, 0, 1, 'Verify', 48, 492, 4

    UNION ALL SELECT 8, 3, 'Perform Full Calibration', 'General', 'Run the complete fuel sensor calibration procedure with reference volumes', 0, 0, 0, 'Repair', 48, 272, 1
    UNION ALL SELECT 9, 3, 'Replace Fuel Sensor', 'DeviceChange', 'Replace sensor if calibration fails or sensor is faulty', 1, 0, 0, 'Repair', 348, 272, 2
    UNION ALL SELECT 10, 3, 'Verify Readings', 'General', 'Compare sensor readings against known fuel volumes to confirm accuracy', 0, 0, 0, 'Verify', 48, 492, 3

    UNION ALL SELECT 11, 4, 'Inspect Wiring Harness', 'General', 'Check for chafed wires, loose connectors, or vibration-related intermittent contacts', 0, 0, 0, 'Diagnose', 48, 52, 1
    UNION ALL SELECT 12, 4, 'Secure Sensor Mount', 'General', 'Tighten or replace the sensor mounting bracket to prevent movement', 0, 0, 0, 'Repair', 348, 272, 2
    UNION ALL SELECT 13, 4, 'Replace Fuel Sensor', 'DeviceChange', 'Replace the intermittently failing sensor with a new unit', 1, 0, 0, 'Repair', 648, 272, 3
    UNION ALL SELECT 14, 4, 'Install Surveillance Camera', 'CameraInstall', 'Install a camera to detect if disconnections are caused by tampering', 0, 0, 1, 'Verify', 48, 492, 4

    UNION ALL SELECT 15, 5, 'Remove Old Sensor', 'DeviceChange', 'Disconnect and remove the existing fuel sensor, recording its IMEI/serial', 1, 0, 0, 'Diagnose', 48, 52, 1
    UNION ALL SELECT 16, 5, 'Install New Sensor', 'DeviceChange', 'Install and connect the replacement fuel sensor', 1, 1, 0, 'Repair', 348, 272, 2
    UNION ALL SELECT 17, 5, 'Calibrate New Sensor', 'General', 'Run calibration procedure on the newly installed sensor', 0, 0, 0, 'Verify', 48, 492, 3

    UNION ALL SELECT 18, 6, 'Check Device Power', 'General', 'Verify the GPS device is receiving power from the vehicle', 0, 0, 0, 'Diagnose', 48, 52, 1
    UNION ALL SELECT 19, 6, 'Check SIM Card & Signal', 'General', 'Inspect SIM card seating and verify cellular signal strength', 0, 0, 0, 'Diagnose', 348, 52, 2
    UNION ALL SELECT 20, 6, 'Reset GPS Device', 'General', 'Power-cycle or factory-reset the GPS device', 0, 0, 0, 'Repair', 48, 272, 3
    UNION ALL SELECT 21, 6, 'Replace GPS Device', 'DeviceChange', 'Swap out the offline GPS device with a working unit', 1, 1, 0, 'Repair', 348, 272, 4

    UNION ALL SELECT 22, 7, 'Investigate Fuel Records', 'General', 'Review fuel transaction records and cross-reference with vehicle location data', 0, 0, 0, 'Diagnose', 48, 52, 1
    UNION ALL SELECT 23, 7, 'Check GPS Device', 'General', 'Inspect the GPS device for power issues, SIM failure, or antenna damage', 0, 0, 0, 'Diagnose', 348, 52, 2
    UNION ALL SELECT 24, 7, 'Replace GPS Device', 'DeviceChange', 'Replace the GPS device if confirmed faulty', 1, 1, 0, 'Repair', 48, 272, 3
    UNION ALL SELECT 25, 7, 'Install Surveillance Camera', 'CameraInstall', 'Install a camera if fuel theft or GPS tampering is suspected', 0, 0, 1, 'Verify', 48, 492, 4

    UNION ALL SELECT 26, 8, 'Reattach Sensor Cover', 'General', 'Reinstall and secure the RCS fuel sensor protective cover', 0, 0, 0, 'Repair', 48, 272, 1
    UNION ALL SELECT 27, 8, 'Check Sensor Integrity', 'General', 'Verify the sensor still reads correctly after cover removal', 0, 0, 0, 'Verify', 48, 492, 2
    UNION ALL SELECT 28, 8, 'Replace Fuel Sensor', 'DeviceChange', 'Replace the sensor if damaged by the cover removal', 1, 0, 0, 'Repair', 348, 272, 3
    UNION ALL SELECT 29, 8, 'Install Surveillance Camera', 'CameraInstall', 'Install a camera to catch who is removing the sensor cover', 0, 0, 1, 'Verify', 348, 492, 4
) action_seed
INNER JOIN `gpsdata`.`issuetemplateworkflow` workflow
    ON workflow.`IssueTemplateID` = action_seed.TemplateId
INNER JOIN `gpsdata`.`issuetemplateworkflowstage` stage
    ON stage.`WorkflowID` = workflow.`ID`
   AND stage.`Name` = action_seed.StageName
ON DUPLICATE KEY UPDATE
    `IssueTemplateID` = VALUES(`IssueTemplateID`),
    `Name` = VALUES(`Name`),
    `ActionType` = VALUES(`ActionType`),
    `Description` = VALUES(`Description`),
    `RequiresDeviceDetails` = VALUES(`RequiresDeviceDetails`),
    `RequiresSourceVehicle` = VALUES(`RequiresSourceVehicle`),
    `RequiresCameraDetails` = VALUES(`RequiresCameraDetails`),
    `StageID` = VALUES(`StageID`),
    `PositionX` = VALUES(`PositionX`),
    `PositionY` = VALUES(`PositionY`),
    `SortOrder` = VALUES(`SortOrder`),
    `IsActive` = VALUES(`IsActive`),
    `UpdatedAt` = UTC_TIMESTAMP();

-- Verification queries
-- SELECT ID, IssueTemplateID, Name, RowVersion FROM gpsdata.issuetemplateworkflow WHERE IssueTemplateID BETWEEN 1 AND 8 ORDER BY IssueTemplateID;
-- SELECT WorkflowID, Name, SortOrder FROM gpsdata.issuetemplateworkflowstage WHERE WorkflowID IN (SELECT ID FROM gpsdata.issuetemplateworkflow WHERE IssueTemplateID BETWEEN 1 AND 8) ORDER BY WorkflowID, SortOrder;
-- SELECT ID, IssueTemplateID, Name, ActionType, StageID, PositionX, PositionY, SortOrder FROM gpsdata.issuetemplateaction WHERE IssueTemplateID BETWEEN 1 AND 8 ORDER BY IssueTemplateID, SortOrder;