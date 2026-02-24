INSERT INTO gpsdata.issuetemplateaction (ID, IssueTemplateID, Name, ActionType, Description, RequiresDeviceDetails, RequiresSourceVehicle, RequiresCameraDetails, SortOrder, IsActive, CreatedAt, UpdatedAt) VALUES
-- Template 1: No Ignition (GPS Device)
(1, 1, 'Check Power Supply', 'General', 'Inspect vehicle battery, fuse box, and wiring to the GPS device', 0, 0, 0, 1, 1, NOW(), NOW()),
(2, 1, 'Reset GPS Device', 'General', 'Power-cycle or factory-reset the GPS tracking device', 0, 0, 0, 2, 1, NOW(), NOW()),
(3, 1, 'Replace GPS Device', 'DeviceChange', 'Swap out the faulty GPS device with a new or refurbished unit', 1, 1, 0, 3, 1, NOW(), NOW()),

-- Template 2: Sensor Complete Disconnection (FuelSensor)
(4, 2, 'Check Wiring & Connections', 'General', 'Inspect sensor wiring, connectors, and harness for damage or loose contacts', 0, 0, 0, 1, 1, NOW(), NOW()),
(5, 2, 'Reconnect Sensor', 'General', 'Re-seat or reconnect the fuel sensor plug and verify signal', 0, 0, 0, 2, 1, NOW(), NOW()),
(6, 2, 'Replace Fuel Sensor', 'DeviceChange', 'Replace the disconnected fuel sensor with a new unit', 1, 0, 0, 3, 1, NOW(), NOW()),
(7, 2, 'Install Surveillance Camera', 'CameraInstall', 'Install a camera to monitor for tampering or intentional disconnection', 0, 0, 1, 4, 1, NOW(), NOW()),

-- Template 3: Calibration (FuelSensor)
(8, 3, 'Perform Full Calibration', 'General', 'Run the complete fuel sensor calibration procedure with reference volumes', 0, 0, 0, 1, 1, NOW(), NOW()),
(9, 3, 'Replace Fuel Sensor', 'DeviceChange', 'Replace sensor if calibration fails or sensor is faulty', 1, 0, 0, 2, 1, NOW(), NOW()),
(10, 3, 'Verify Readings', 'General', 'Compare sensor readings against known fuel volumes to confirm accuracy', 0, 0, 0, 3, 1, NOW(), NOW()),

-- Template 4: Sensor Keeps Disconnecting (FuelSensor)
(11, 4, 'Inspect Wiring Harness', 'General', 'Check for chafed wires, loose connectors, or vibration-related intermittent contacts', 0, 0, 0, 1, 1, NOW(), NOW()),
(12, 4, 'Secure Sensor Mount', 'General', 'Tighten or replace the sensor mounting bracket to prevent movement', 0, 0, 0, 2, 1, NOW(), NOW()),
(13, 4, 'Replace Fuel Sensor', 'DeviceChange', 'Replace the intermittently failing sensor with a new unit', 1, 0, 0, 3, 1, NOW(), NOW()),
(14, 4, 'Install Surveillance Camera', 'CameraInstall', 'Install a camera to detect if disconnections are caused by tampering', 0, 0, 1, 4, 1, NOW(), NOW()),

-- Template 5: Replacement Sensor (FuelSensor)
(15, 5, 'Remove Old Sensor', 'DeviceChange', 'Disconnect and remove the existing fuel sensor, recording its IMEI/serial', 1, 0, 0, 1, 1, NOW(), NOW()),
(16, 5, 'Install New Sensor', 'DeviceChange', 'Install and connect the replacement fuel sensor', 1, 1, 0, 2, 1, NOW(), NOW()),
(17, 5, 'Calibrate New Sensor', 'General', 'Run calibration procedure on the newly installed sensor', 0, 0, 0, 3, 1, NOW(), NOW()),

-- Template 6: GPS Offline (GPS Device)
(18, 6, 'Check Device Power', 'General', 'Verify the GPS device is receiving power from the vehicle', 0, 0, 0, 1, 1, NOW(), NOW()),
(19, 6, 'Check SIM Card & Signal', 'General', 'Inspect SIM card seating and verify cellular signal strength', 0, 0, 0, 2, 1, NOW(), NOW()),
(20, 6, 'Reset GPS Device', 'General', 'Power-cycle or factory-reset the GPS device', 0, 0, 0, 3, 1, NOW(), NOW()),
(21, 6, 'Replace GPS Device', 'DeviceChange', 'Swap out the offline GPS device with a working unit', 1, 1, 0, 4, 1, NOW(), NOW()),

-- Template 7: Fuel Activity While GPS Offline (fuel_activity)
(22, 7, 'Investigate Fuel Records', 'General', 'Review fuel transaction records and cross-reference with vehicle location data', 0, 0, 0, 1, 1, NOW(), NOW()),
(23, 7, 'Check GPS Device', 'General', 'Inspect the GPS device for power issues, SIM failure, or antenna damage', 0, 0, 0, 2, 1, NOW(), NOW()),
(24, 7, 'Replace GPS Device', 'DeviceChange', 'Replace the GPS device if confirmed faulty', 1, 1, 0, 3, 1, NOW(), NOW()),
(25, 7, 'Install Surveillance Camera', 'CameraInstall', 'Install a camera if fuel theft or GPS tampering is suspected', 0, 0, 1, 4, 1, NOW(), NOW()),

-- Template 8: RCS Fuel sensor Cover Removed (FuelSensor)
(26, 8, 'Reattach Sensor Cover', 'General', 'Reinstall and secure the RCS fuel sensor protective cover', 0, 0, 0, 1, 1, NOW(), NOW()),
(27, 8, 'Check Sensor Integrity', 'General', 'Verify the sensor still reads correctly after cover removal', 0, 0, 0, 2, 1, NOW(), NOW()),
(28, 8, 'Replace Fuel Sensor', 'DeviceChange', 'Replace the sensor if damaged by the cover removal', 1, 0, 0, 3, 1, NOW(), NOW()),
(29, 8, 'Install Surveillance Camera', 'CameraInstall', 'Install a camera to catch who is removing the sensor cover', 0, 0, 1, 4, 1, NOW(), NOW());
