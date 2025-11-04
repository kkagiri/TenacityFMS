# Tank Volume Missing Entry Notification - Workflow Diagrams

## 🔑 Key Concept: Policy vs Notification

```mermaid
graph LR
    subgraph "ONE-TIME SETUP"
        DB[(Database Setup)]
        DB --> Policy[Notification Policy<br/>Created ONCE<br/>Contains email template]
    end

    subgraph "DAILY EXECUTION"
        Check[Daily Check<br/>10:00 AM]
        Check --> N1[Notification 1<br/>Nov 1]
        Check --> N2[Notification 2<br/>Nov 2]
        Check --> N3[Notification 3<br/>Nov 3]
    end

    Policy -.References.-> N1
    Policy -.References.-> N2
    Policy -.References.-> N3

    style Policy fill:#90EE90
    style N1 fill:#87CEEB
    style N2 fill:#87CEEB
    style N3 fill:#87CEEB
```

**Understanding**:
- ✅ **Policy** (green): Created ONCE, defines template & settings
- ✅ **Notifications** (blue): Created DAILY, each references the policy
- ✅ **NotificationPolicyId**: Links notification → policy

---

## System Flow Overview

```mermaid
graph TD
    A[Scheduled Trigger<br/>10:00 AM Daily] --> B[TankVolumeEntryCheckService]
    B --> C{Check Configuration<br/>Is Enabled?}
    C -->|No| D[Skip Execution]
    C -->|Yes| E[GetMissingTankVolumeEntriesQuery]

    E --> F[Query Database<br/>Check Last Entry to Yesterday]
    F --> G{Missing Entries<br/>Found?}

    G -->|No| H[Log: No Missing Entries<br/>End Process]
    G -->|Yes| I[Group by Site<br/>Get Site Administrators]

    I --> J[ProcessMissingEntryNotificationsCommand]
    J --> K[Lookup Existing Policy<br/>'Tank Volume Missing Entry']

    K --> L[For Each Site with Missing Entries]
    L --> M{Site Has<br/>Administrator?}

    M -->|No| N[Log Warning<br/>Skip Site]
    M -->|Yes| O[Create Notification Request<br/>with NotificationPolicyId]

    O --> P[NotificationService.CreateNotificationAsync]
    P --> Q[Use Policy's Email Template]
    Q --> R[Resolve Recipients<br/>via NotificationRecipientResolver]

    R --> S{Admin Has<br/>Valid Email?}
    S -->|No| T[Log Error<br/>Mark Failed]
    S -->|Yes| U[EmailService.SendEmailAsync]

    U --> V{Email Sent<br/>Successfully?}
    V -->|No| W[Log Failure<br/>Retry Logic]
    V -->|Yes| X[Mark Notification Delivered]

    X --> Y[Save Notification Record]
    W --> Y
    T --> Y
    N --> Y

    Y --> Z[Update Statistics]
    X --> Y[Log Summary<br/>End Process]

    style A fill:#498205,color:#fff
    style B fill:#3b82f6,color:#fff
    style E fill:#3b82f6,color:#fff
    style J fill:#3b82f6,color:#fff
    style O fill:#7c3aed,color:#fff
    style S fill:#7c3aed,color:#fff
    style V fill:#22c55e,color:#fff
    style H fill:#22c55e,color:#fff
    style Y fill:#22c55e,color:#fff
    style M fill:#f59e0b,color:#fff
    style R fill:#ef4444,color:#fff
    style U fill:#ef4444,color:#fff
```

## Detailed Query Logic Flow

```mermaid
graph TD
    A[GetMissingTankVolumeEntriesQuery] --> B[Get Yesterday's Date<br/>DateTime.Today.AddDays-1]
    B --> C[Get All Active Tanks<br/>WHERE IsActive = true]

    C --> D[For Each Tank]
    D --> E[Get Last Entry Date<br/>MAX RecordedDate]

    E --> F{Last Entry<br/>Exists?}
    F -->|No| G[New Tank - Skip]
    F -->|Yes| H[Calculate Date Range<br/>LastEntry+1 → Yesterday]

    H --> I{Date Range<br/>Valid?}
    I -->|No dates| J[Last entry is yesterday<br/>Tank OK - Skip]
    I -->|Yes| K[For Each Date in Range]

    K --> L[Check TankVolumeHistory<br/>For This Date]

    L --> M{Has ANY Entry<br/>for This Date?}
    M -->|Opening| N[Date OK - Next Date]
    M -->|Closing| N
    M -->|Transfer| N
    M -->|Dispensing| N
    M -->|None| O[Add Date to Missing List]

    O --> P{More Dates<br/>in Range?}
    N --> P
    P -->|Yes| K
    P -->|No| Q{Has Missing<br/>Dates?}

    Q -->|No| R[Tank Complete - Skip]
    Q -->|Yes| S[Add Tank to Results with:<br/>- All Missing Dates<br/>- Last Entry Date<br/>- Tank Details]

    S --> T{More Tanks?}
    R --> T
    G --> T
    J --> T

    T -->|Yes| D
    T -->|No| U[Group Results by SiteId]

    U --> V[For Each Site Group]
    V --> W[Get Site Administrator<br/>from Site.SiteAdministratorId]

    W --> X[Get Admin Email<br/>from User.Email]

    X --> Y[Create MissingEntriesBySiteDto<br/>with All Missing Dates]
    Y --> Z{More Sites?}
    Z -->|Yes| V
    Z -->|No| AA[Return Results]

    style A fill:#3b82f6,color:#fff
    style O fill:#ef4444,color:#fff
    style N fill:#22c55e,color:#fff
    style R fill:#22c55e,color:#fff
    style G fill:#f59e0b,color:#fff
    style J fill:#22c55e,color:#fff
    style AA fill:#22c55e,color:#fff
```

## Notification Creation Flow

```mermaid
graph TD
    A[ProcessMissingEntryNotificationsCommand] --> B[Receive Missing Entries<br/>Grouped by Site]

    B --> C[For Each Site]
    C --> D{Site Has<br/>Administrator?}

    D -->|No| E[Log Warning:<br/>Site ID, Missing Admin]
    D -->|Yes| F[Validate Admin Email]

    F --> G{Valid Email<br/>Exists?}
    G -->|No| H[Log Error:<br/>Admin ID, No Email]
    G -->|Yes| I[Build Notification Data]

    I --> J[Create Notification Object:<br/>- Title<br/>- Message<br/>- Category<br/>- Priority]

    J --> K[Format Tank List<br/>for Email]

    K --> L[Call NotificationService<br/>CreateNotificationAsync]

    L --> M[NotificationService Processing]
    M --> N[Get Notification Policy<br/>for Data Entry]

    N --> O{Policy<br/>Active?}
    O -->|No| P[Use Default Settings]
    O -->|Yes| Q[Use Policy Settings]

    P --> R[Create Notification Record<br/>in Database]
    Q --> R

    R --> S[Create Recipient Record<br/>for Site Admin]

    S --> T[Resolve Email Template]
    T --> U[Merge Template with Data:<br/>- SiteName<br/>- All Missing Dates per Tank<br/>- TankList with Date Ranges<br/>- Last Entry Dates]

    U --> V[Call EmailService<br/>SendEmailAsync]

    V --> W{Email<br/>Successful?}
    W -->|Yes| X[Update Recipient:<br/>DeliveryStatus = Delivered<br/>DeliveredAt = Now]
    W -->|No| Y[Update Recipient:<br/>DeliveryStatus = Failed<br/>FailureReason = Error]

    X --> Z[Mark Notification Sent]
    Y --> AA[Retry Logic<br/>if Configured]

    AA --> AB[Log Failure Details]
    Z --> AC[Log Success]

    AC --> AD{More Sites?}
    AB --> AD
    AD -->|Yes| C
    AD -->|No| AE[Return Summary:<br/>- Total Sites<br/>- Successful<br/>- Failed]

    style A fill:#3b82f6,color:#fff
    style L fill:#7c3aed,color:#fff
    style V fill:#7c3aed,color:#fff
    style X fill:#22c55e,color:#fff
    style Y fill:#ef4444,color:#fff
    style E fill:#f59e0b,color:#fff
    style H fill:#f59e0b,color:#fff
```

## Background Service Scheduling Flow

```mermaid
graph TD
    A[Service Starts<br/>Application Startup] --> B[Register in DI Container<br/>AddHostedService]

    B --> C[ExecuteAsync Called]
    C --> D[Load Configuration:<br/>- Schedule Time<br/>- Enabled Flag]

    D --> E{Service<br/>Enabled?}
    E -->|No| F[Log: Service Disabled<br/>Wait for Configuration]
    E -->|Yes| G[Calculate Next Run Time]

    G --> H[Current Time]
    H --> I{Current Time<br/>> Schedule Time?}

    I -->|Yes| J[Schedule for Tomorrow]
    I -->|No| K[Schedule for Today]

    J --> L[Calculate Delay<br/>Until Scheduled Time]
    K --> L

    L --> M[Log: Next Run Scheduled]
    M --> N[Wait Delay<br/>Task.Delay]

    N --> O{Cancellation<br/>Requested?}
    O -->|Yes| P[Cleanup Resources<br/>Exit Service]
    O -->|No| Q[Execute Check]

    Q --> R[Create Scope for<br/>Scoped Services]

    R --> S[Get IMediator<br/>from Scope]

    S --> T[Send Query:<br/>GetMissingTankVolumeEntriesQuery]

    T --> U{Query<br/>Successful?}
    U -->|No| V[Log Error<br/>Schedule Next Run]
    U -->|Yes| W{Missing Entries<br/>Found?}

    W -->|No| X[Log: No Missing Entries<br/>Schedule Next Run]
    W -->|Yes| Y[Send Command:<br/>ProcessMissingEntryNotificationsCommand]

    Y --> Z{Command<br/>Successful?}
    Z -->|No| AA[Log Error<br/>Schedule Next Run]
    Z -->|Yes| AB[Log Success<br/>Schedule Next Run]

    AB --> AC[Calculate Next Run<br/>Tomorrow at Schedule Time]
    AA --> AC
    X --> AC
    V --> AC

    AC --> M

    style A fill:#498205,color:#fff
    style Q fill:#3b82f6,color:#fff
    style T fill:#3b82f6,color:#fff
    style Y fill:#3b82f6,color:#fff
    style AB fill:#22c55e,color:#fff
    style X fill:#22c55e,color:#fff
    style AA fill:#ef4444,color:#fff
    style V fill:#ef4444,color:#fff
    style F fill:#f59e0b,color:#fff
```

## Data Flow Diagram

```mermaid
graph LR
    A[(Database<br/>TankVolumeHistory)] --> B[Query Layer<br/>Find Last Entry per Tank<br/>Check All Dates to Yesterday]

    B --> C{Missing<br/>Entries?}

    C -->|No| D[End]
    C -->|Yes| E[Group by Site]

    E --> F[(Database<br/>Sites)]
    F --> G[Get Site Admin]

    G --> H[(Database<br/>Users)]
    H --> I[Get Admin Email]

    I --> J[Command Layer<br/>Process Notifications]

    J --> K[(Database<br/>Notifications)]
    K --> L[Create Notification<br/>Record]

    J --> M[(Database<br/>NotificationRecipients)]
    M --> N[Create Recipient<br/>Record]

    J --> O[Email Service]
    O --> P[SMTP Server]
    P --> Q[Site Administrator<br/>Email Inbox]

    O --> R{Delivery<br/>Status}
    R -->|Success| S[Update Recipient<br/>Delivered]
    R -->|Failed| T[Update Recipient<br/>Failed]

    S --> M
    T --> M

    style A fill:#64748b,color:#fff
    style F fill:#64748b,color:#fff
    style H fill:#64748b,color:#fff
    style K fill:#64748b,color:#fff
    style M fill:#64748b,color:#fff
    style O fill:#7c3aed,color:#fff
    style Q fill:#22c55e,color:#fff
```

## Component Interaction Diagram

```mermaid
graph TB
    subgraph "Background Service Layer"
        A[TankVolumeEntryCheckService]
    end

    subgraph "Application Layer CQRS"
        B[GetMissingTankVolumeEntriesQuery<br/>Handler]
        C[ProcessMissingEntryNotificationsCommand<br/>Handler]
    end

    subgraph "Domain Services"
        D[NotificationService]
        E[EmailService]
    end

    subgraph "Data Access Layer"
        F[GpsdataContext<br/>EF Core]
    end

    subgraph "External Services"
        G[SMTP Server]
    end

    subgraph "Database"
        H[(TankVolumeHistory)]
        I[(Sites)]
        J[(Users)]
        K[(Notifications)]
        L[(NotificationRecipients)]
    end

    A -->|1. Send Query| B
    B -->|2. Query Data| F
    F -->|3. Read| H
    F -->|4. Read| I
    F -->|5. Read| J

    B -->|6. Return Missing Entries| A
    A -->|7. Send Command| C

    C -->|8. Create Notification| D
    D -->|9. Save Notification| F
    F -->|10. Write| K
    F -->|11. Write| L

    D -->|12. Send Email| E
    E -->|13. SMTP| G
    G -->|14. Deliver| M[Site Admin Inbox]

    E -->|15. Update Status| D
    D -->|16. Update Delivery| F
    F -->|17. Update| L

    style A fill:#498205,color:#fff
    style B fill:#3b82f6,color:#fff
    style C fill:#3b82f6,color:#fff
    style D fill:#7c3aed,color:#fff
    style E fill:#7c3aed,color:#fff
    style F fill:#64748b,color:#fff
    style M fill:#22c55e,color:#fff
```

## Error Handling Flow

```mermaid
graph TD
    A[Process Start] --> B{Service<br/>Enabled?}
    B -->|No| C[Log: Service Disabled<br/>Exit Gracefully]

    B -->|Yes| D{Query<br/>Execution}

    D -->|Exception| E[Catch Exception]
    E --> F[Log Error Details:<br/>- Stack Trace<br/>- Inner Exception]
    F --> G[Schedule Retry<br/>Next Day]

    D -->|Success| H{Data<br/>Validation}

    H -->|Invalid| I[Log: Invalid Data<br/>Continue]
    H -->|Valid| J{Site Admin<br/>Exists?}

    J -->|No| K[Log Warning:<br/>Site ID, No Admin]
    K --> L[Skip Site<br/>Continue Next]

    J -->|Yes| M{Admin Email<br/>Valid?}

    M -->|No| N[Log Warning:<br/>Admin ID, No Email]
    N --> L

    M -->|Yes| O{Notification<br/>Creation}

    O -->|Exception| P[Catch Exception]
    P --> Q[Log Error:<br/>Notification Creation Failed]
    Q --> L

    O -->|Success| R{Email<br/>Sending}

    R -->|Exception| S[Catch Exception]
    S --> T[Log Error:<br/>Email Sending Failed]
    T --> U{Retry<br/>Attempts < Max?}

    U -->|Yes| V[Wait Delay<br/>Exponential Backoff]
    V --> R

    U -->|No| W[Mark Failed<br/>Move to Next]

    R -->|Success| X[Mark Success<br/>Update Status]

    W --> L
    X --> L

    L --> Y{More<br/>Sites?}
    Y -->|Yes| J
    Y -->|No| Z[Log Summary:<br/>- Total Processed<br/>- Successful<br/>- Failed]

    Z --> AA[Schedule Next Run]
    G --> AA

    style E fill:#ef4444,color:#fff
    style P fill:#ef4444,color:#fff
    style S fill:#ef4444,color:#fff
    style F fill:#ef4444,color:#fff
    style Q fill:#ef4444,color:#fff
    style T fill:#ef4444,color:#fff
    style K fill:#f59e0b,color:#fff
    style N fill:#f59e0b,color:#fff
    style X fill:#22c55e,color:#fff
    style AA fill:#22c55e,color:#fff
```

## Color Legend

- 🟢 **Green**: Success states, completion
- 🔵 **Blue**: Processing, queries, commands
- 🟣 **Purple**: Notification/Email services
- ⚫ **Gray**: Database/Data access
- 🟡 **Yellow/Orange**: Warnings, skip conditions
- 🔴 **Red**: Errors, failures
- 🟩 **Dark Green**: Background service, entry points

---

**Note**: These diagrams use Mermaid syntax and can be rendered in:
- GitHub Markdown
- VS Code with Mermaid extension
- Documentation tools that support Mermaid
- Online viewers like mermaid.live
