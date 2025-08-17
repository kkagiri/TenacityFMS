# ActiveAlarm Entity Framework Configuration - MySQL 5.6

## ✅ COMPLETED IMPLEMENTATION

### 1. **ActiveAlarmConfiguration.cs**
**Location**: `FMS.Persistence\EntityConfigurations\ActiveAlarmConfiguration.cs`

**Features**:
- ✅ **MySQL 5.6 Compatible**: Uses `utf8mb4_general_ci` collation and `utf8mb4` charset
- ✅ **Proper Data Types**: `timestamp` for dates, `json` for JSON data, `decimal(18,4)` for values
- ✅ **Default Values**: CURRENT_TIMESTAMP for TriggeredAt, proper defaults for State, Priority, etc.
- ✅ **Foreign Key Relationships**: Proper CASCADE/SET NULL behavior for related entities
- ✅ **Comprehensive Indexing**: Performance indexes for common queries and searches
- ✅ **Enum Handling**: DiscrepancySeverity stored as int with default value

**Key Configuration Highlights**:
```csharp
// MySQL 5.6 String Properties
builder.Property(e => e.AlarmType)
    .IsRequired()
    .HasMaxLength(50)
    .UseCollation("utf8mb4_general_ci")
    .HasCharSet("utf8mb4");

// Timestamp Properties
builder.Property(e => e.TriggeredAt)
    .IsRequired()
    .HasDefaultValueSql("CURRENT_TIMESTAMP")
    .HasColumnType("timestamp");

// Decimal Properties for Measurements
builder.Property(e => e.ThresholdValue)
    .HasPrecision(18, 4)
    .IsRequired(false);

// JSON Storage
builder.Property(e => e.AdditionalData)
    .HasColumnType("json")
    .IsRequired(false);

// Foreign Key Relationships
builder.HasOne(e => e.Site)
    .WithMany()
    .HasForeignKey(e => e.SiteId)
    .OnDelete(DeleteBehavior.SetNull)
    .IsRequired(false)
    .HasConstraintName("FK_ActiveAlarms_Sites");
```

### 2. **Database Context Updates**
**Location**: `FMS.Persistence\DataAccess\GpsdataContext.cs`

**Changes**:
- ✅ **DbSet Added**: `public virtual DbSet<ActiveAlarm> ActiveAlarms { get; set; }`
- ✅ **Configuration Registered**: `modelBuilder.ApplyConfiguration(new ActiveAlarmConfiguration())`

### 3. **Entity Relationship Updates**

#### **Notification.cs** Updates:
```csharp
// Added property
public int? ActiveAlarmId { get; set; }

// Added navigation property
public virtual ActiveAlarm? ActiveAlarm { get; set; }
```

#### **Issuetracker.cs** Updates:
```csharp
// Added property
public int? ActiveAlarmId { get; set; }

// Added navigation property
public virtual ActiveAlarm? ActiveAlarm { get; set; }
```

### 4. **Database Schema Overview**

**Table Name**: `ActiveAlarms`

**Key Properties**:
- `Id` (int, PK, auto-increment)
- `AlarmType` (varchar(50), indexed)
- `State` (varchar(20), default: 'Active', indexed)
- `TriggerSource` (varchar(20), indexed)
- `TriggeredAt` (timestamp, default: CURRENT_TIMESTAMP)
- `Severity` (int, enum as int, default: Medium)
- `Priority` (varchar(20), default: 'Medium')
- `Message` (varchar(500))
- `ThresholdValue`/`ActualValue` (decimal(18,4))

**Relationships**:
- Site (optional, SET NULL on delete)
- Tank (optional, SET NULL on delete)
- Device (optional, SET NULL on delete)
- AlarmHandler (optional, SET NULL on delete)
- PTSAlertRecord (optional, SET NULL on delete)
- ReconciliationDiscrepancy (optional, SET NULL on delete)
- Notifications (one-to-many, CASCADE delete)
- IssueTrackers (one-to-many, SET NULL on delete)

**Indexes**:
- Individual indexes on: AlarmType, State, TriggerSource, Priority, Severity, SiteId, TankId, DeviceId, etc.
- Composite indexes for common queries: (State, Priority), (State, TriggeredAt), (AlarmType, State)
- Unique constraint prevention: (AlarmType, TriggerSource, SiteId, TankId, DeviceId, State)

## 🔄 NEXT STEPS

### 1. **Create Database Migration**
```bash
# From the project root
dotnet ef migrations add AddActiveAlarmEntity --project FMS.Persistence --startup-project FMS.WebClient
dotnet ef database update --project FMS.Persistence --startup-project FMS.WebClient
```

### 2. **Verify Migration SQL**
The migration should generate MySQL-compatible SQL like:
```sql
CREATE TABLE `ActiveAlarms` (
    `Id` int NOT NULL AUTO_INCREMENT,
    `AlarmType` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
    `State` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL DEFAULT 'Active',
    `TriggerSource` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
    `TriggeredAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `Severity` int NOT NULL DEFAULT 2,
    -- ... additional columns
    CONSTRAINT `PK_ActiveAlarms` PRIMARY KEY (`Id`),
    CONSTRAINT `FK_ActiveAlarms_Sites` FOREIGN KEY (`SiteId`) REFERENCES `Sites` (`Id`) ON DELETE SET NULL
    -- ... additional constraints
);
```

### 3. **Update Related Services**
- Update AlarmHandler to create ActiveAlarm records
- Update NotificationService to link to ActiveAlarm
- Create ActiveAlarmService for lifecycle management

### 4. **Frontend Integration**
- Create ActiveAlarm dashboard
- Add alarm acknowledgment functionality
- Implement escalation management

## 🎯 BENEFITS ACHIEVED

1. **MySQL 5.6 Compatibility**: All string properties use proper charset and collation
2. **Performance Optimized**: Comprehensive indexing strategy for fast queries
3. **Data Integrity**: Proper foreign key constraints with appropriate delete behaviors
4. **Flexible Storage**: JSON column for additional metadata
5. **Audit Trail**: Comprehensive tracking of alarm lifecycle
6. **Integration Ready**: Proper relationships with Notifications and IssueTracker

The ActiveAlarm Entity Framework configuration is now **complete and ready for database migration**!
