# Tank Measurement Implementation

## Overview

This document describes the implementation of tank measurement functionality in the FMS system, designed to handle continuous tank measurement data from PTS devices similar to how pump transactions are processed.

## Architecture Changes

### 1. Entity Model Updates

#### Tank Entity (`FMS.Domain/Entities/Tank.cs`)
- **Added Properties:**
  - `FuelGradeId` (int?) - Links tank to fuel grade
  - `FuelGradeName` (string?) - Cached fuel grade name
  - `Tankmeasurements` navigation property

#### Tankmeasurement Entity (`FMS.Domain/Entities/Tankmeasurement.cs`)
- **Added Properties:**
  - `FuelGradeName` (string?) - Cached fuel grade name from PTS
  - `TankId` (int?) - Foreign key to Tank entity
  - `TankNavigation` navigation property

### 2. Database Schema Changes

#### Tank Table Updates
```sql
ALTER TABLE `tank`
ADD COLUMN `FuelGradeId` INT(11) NULL,
ADD COLUMN `FuelGradeName` VARCHAR(45) NULL;
```

#### Tankmeasurement Table Updates
```sql
ALTER TABLE `tankmeasurement`
ADD COLUMN `FuelGradeName` VARCHAR(45) NULL,
ADD COLUMN `TankId` INT(11) NULL;
```

#### Foreign Key Relationships
```sql
ALTER TABLE `tankmeasurement`
ADD CONSTRAINT `fk_tankmeasurement_tank`
  FOREIGN KEY (`TankId`) REFERENCES `tank` (`Id`)
  ON DELETE SET NULL;
```

### 3. Handler Implementation

#### UploadTankMeasurementHandler
- **Location:** `FMS.Application/Handlers/UploadTankMeasurementHandler.cs`
- **Packet Type:** `UploadTankMeasurement`
- **Features:**
  - Validates incoming tank measurement data
  - Enriches data with device context
  - Links measurements to Tank entities
  - Processes alarms associated with measurements

#### UploadInTankDeliveryHandler
- **Location:** `FMS.Application/Handlers/UploadInTankDeliveryHandler.cs`
- **Packet Type:** `UploadInTankDelivery`
- **Features:**
  - Handles in-tank delivery events
  - Tracks start and end values
  - Records absolute delivery values

### 4. Command Implementation

#### CreateTankMeasurementCommand
- **Location:** `FMS.Application/Command/DatabaseCommand/PTSCommands/TankMeasurementsCommand/CreateTankMeasurementCommand.cs`
- **Features:**
  - Comprehensive validation
  - Tank entity linking
  - Fuel grade management
  - Alarm processing
  - Uses FMSResponse pattern

#### CreateInTankDeliveryCommand
- **Location:** `FMS.Application/Command/DatabaseCommand/PTSCommands/InTankDeliveryCommand/CreateInTankDeliveryCommand.cs`
- **Features:**
  - Validates delivery data structure
  - Links to Tank entities
  - Processes start/end/absolute values

### 5. DTO Updates

#### TankMeasurementDto
- **Location:** `FMS.Application/ModelsDTOs/PTS/TankMeasurementDto.cs`
- **Added Properties:**
  - `FuelGradeName` - Optional fuel grade name
  - `PtsId` - Device identification
  - `PacketId` - Packet identification
  - `TankId` - Tank entity link

#### InTankDeliveryDto
- **Location:** `FMS.Application/ModelsDTOs/PTS/InTankDeliveryDto.cs`
- **Structure:**
  - `StartValues` - Delivery start measurements
  - `EndValues` - Delivery end measurements
  - `AbsoluteValues` - Calculated delivery values

## Key Features

### 1. Continuous Measurement Processing
- Tank measurements are processed as continuous input from PTS devices
- Each measurement is stored with timestamp and device context
- Tank entity remains static with only CurrentStock updates

### 2. Fuel Grade Integration
- Tank entities can be linked to fuel grades from PTS configuration
- Fuel grade information is cached in both Tank and Tankmeasurement entities
- Automatic fuel grade assignment from measurement data

### 3. Device-Tank Linking
- Measurements are automatically linked to Tank entities via PtsId
- TankId foreign key provides direct relationship
- Supports multiple tanks per PTS device

### 4. Alarm Processing
- Tank measurement alarms are processed and stored
- Many-to-many relationship between measurements and alarms
- Alarm context preserved for analysis

### 5. Validation and Error Handling
- Comprehensive validation for all measurement data
- FMSResponse pattern for consistent error handling
- Detailed logging for troubleshooting

## Usage Examples

### Tank Measurement Processing Flow
1. PTS device sends `UploadTankMeasurement` packet
2. `UploadTankMeasurementHandler` receives and validates data
3. Device context is enriched (PtsId, PacketId)
4. Tank entity is located via PtsId
5. `CreateTankMeasurementCommand` processes the measurement
6. Measurement is stored with Tank relationship
7. Response is sent back to PTS device

### In-Tank Delivery Processing Flow
1. PTS device sends `UploadInTankDelivery` packet
2. `UploadInTankDeliveryHandler` receives and validates data
3. Start, End, and Absolute values are processed
4. Tank entity is linked via device context
5. Delivery record is created and stored

## Database Indexes

### Performance Optimization
```sql
-- Tank fuel grade lookup
CREATE INDEX idx_tank_fuelgrade ON tank(FuelGradeId);

-- Tank measurement queries
CREATE INDEX idx_tankmeasurement_device_tank_datetime
ON tankmeasurement(PTSId, Tank, DateTime DESC);

-- Tank relationship lookup
CREATE INDEX fk_tankmeasurement_tank_idx ON tankmeasurement(TankId);
```

## Configuration Requirements

### Entity Framework Configuration
- `TankConfiguration` updated with new properties and relationships
- `TankmeasurementConfiguration` updated with Tank relationship
- Foreign key constraints properly configured

### Dependency Injection
- Handlers automatically registered via PacketType attribute
- Commands registered through MediatR
- Logging configured for all components

## Data Migration

### Existing Data Updates
```sql
-- Link existing measurements to tanks
UPDATE tankmeasurement tm
INNER JOIN tank t ON t.PtsId = tm.PTSId
SET tm.TankId = t.Id
WHERE tm.TankId IS NULL;

-- Set fuel grades from measurements
UPDATE tank t
INNER JOIN (
    SELECT Tank, FuelGradeId, Ptsid,
           ROW_NUMBER() OVER (PARTITION BY Tank, Ptsid ORDER BY DateTime DESC) as rn
    FROM tankmeasurement
    WHERE FuelGradeId > 0
) latest ON t.PtsId = latest.Ptsid AND latest.rn = 1
SET t.FuelGradeId = latest.FuelGradeId
WHERE t.FuelGradeId IS NULL;
```

## Testing Considerations

### Unit Tests
- Test measurement validation logic
- Test Tank-Tankmeasurement relationship
- Test alarm processing
- Test fuel grade assignment

### Integration Tests
- Test end-to-end packet processing
- Test database constraint enforcement
- Test performance with large datasets

## Monitoring and Logging

### Key Metrics
- Measurement processing rate
- Validation failure rate
- Tank linking success rate
- Alarm frequency by tank

### Log Messages
- Successful measurement processing
- Validation failures with details
- Tank linking results
- Performance metrics

## Future Enhancements

### Potential Improvements
1. **Real-time Analytics**: Stream processing for live tank monitoring
2. **Predictive Maintenance**: ML models for equipment health
3. **Advanced Alarms**: Complex alarm rules and escalation
4. **Historical Analysis**: Trend analysis and reporting
5. **Mobile Integration**: Real-time notifications and monitoring

## Troubleshooting

### Common Issues
1. **Tank Not Found**: Check PtsId matching between Tank and device
2. **Validation Failures**: Verify data format and required fields
3. **Alarm Processing**: Ensure alarm entities exist in database
4. **Performance Issues**: Monitor database indexes and query performance

### Debug Steps
1. Check handler registration and packet type matching
2. Verify database schema and constraints
3. Review validation logic and error messages
4. Monitor logging for processing details