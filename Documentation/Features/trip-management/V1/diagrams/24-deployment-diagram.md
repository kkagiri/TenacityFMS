<!--
File: 24-deployment-diagram.md
Purpose: Deployment/infrastructure diagram showing how all services
         and components are deployed.
Dependencies: AGENTS.md, deployment documentation
Last Modified: 2026-03-12
-->

# Deployment Diagram

Physical deployment topology for the FMS application including all services
relevant to vehicle trip management.

```mermaid
graph TD
    subgraph Vehicles["Field Vehicles"]
        GPS1[GPS Device 1]
        GPS2[GPS Device 2]
        GPSN[GPS Device N]
    end

    subgraph Cloud["External Services"]
        GPSGate[GPSGate Server<br/><small>GPS tracking platform</small>]
        Firebase[Firebase Cloud<br/>Messaging<br/><small>Push notifications</small>]
    end

    subgraph IIS["IIS Web Server (Windows Server)"]
        subgraph BackendPool["App Pool: HyoungFMS.WebAPI"]
            WebAPI["FMS.WebClient<br/><small>ASP.NET Core 8.0</small><br/><small>Port 7009</small><br/><br/>Controllers/<br/>SignalR Hubs/<br/>MediatR Pipeline"]
        end

        subgraph FrontendPool["App Pool: HyoungFMS.ReactApp"]
            ReactApp["fms.frontend<br/><small>React 18 SPA</small><br/><small>Port 80</small><br/><br/>Static build files<br/>served by IIS"]
        end
    end

    subgraph WindowsServices["Windows Services"]
        PTS["FMS.PTS.WindowsService<br/><small>WebSocket server</small><br/><small>Device communication</small>"]
        BG["FMS.BackgroundServices<br/><small>(Hosted in WebAPI process)</small>"]
    end

    subgraph BackgroundJobs["Background Services (in WebAPI)"]
        BG1["GPSGateRabbitMQ<br/>ConsumerService<br/><small>GPS point ingestion</small>"]
        BG2["VehicleTripRealtime<br/>RefreshBackgroundService<br/><small>Periodic state refresh</small>"]
        BG3["VehicleTripReconciliation<br/>BackgroundService<br/><small>Nightly reconciliation</small>"]
        BG4["TransferReminder<br/>BackgroundService"]
        BG5["VehicleDocument<br/>NotifierService"]
    end

    subgraph Infrastructure["Infrastructure Services"]
        subgraph DockerRedis["Docker Container"]
            Redis[(Redis<br/><small>Cache + SignalR backplane</small><br/><small>Port 6379</small>)]
        end

        RabbitMQ[(RabbitMQ<br/><small>Message broker</small><br/><small>AMQP</small>)]

        MySQL[(MySQL Server<br/><small>Primary database</small><br/><small>Port 3306</small>)]
    end

    subgraph Users["End Users"]
        Browser[Web Browser<br/><small>Desktop / Tablet</small>]
        Mobile[Mobile App<br/><small>React Native</small>]
    end

    %% Device → GPSGate
    GPS1 & GPS2 & GPSN -->|"Cellular / Satellite"| GPSGate

    %% GPSGate → RabbitMQ
    GPSGate -->|"AMQP publish"| RabbitMQ

    %% RabbitMQ → Consumer
    RabbitMQ -->|"consume"| BG1

    %% Background services are hosted in WebAPI
    BG --> BG1 & BG2 & BG3 & BG4 & BG5

    %% WebAPI connections
    WebAPI -->|"EF Core<br/>Pomelo MySQL"| MySQL
    WebAPI -->|"StackExchange.Redis"| Redis
    WebAPI --> BG

    %% SignalR through Redis
    WebAPI -.->|"SignalR backplane"| Redis

    %% Frontend
    ReactApp -->|"HTTP API calls<br/>Port 7009"| WebAPI
    ReactApp -.->|"WebSocket<br/>/vehicleTrackingHub"| WebAPI

    %% Users
    Browser -->|"HTTPS"| ReactApp
    Browser -.->|"WebSocket (SignalR)"| WebAPI
    Mobile -->|"HTTPS API"| WebAPI
    Mobile -->|"Push"| Firebase

    %% Firebase
    WebAPI -->|"FCM push"| Firebase

    style Vehicles fill:#f3f4f6,stroke:#6b7280
    style Cloud fill:#fef3c7,stroke:#d97706
    style IIS fill:#e0f2fe,stroke:#0284c7
    style WindowsServices fill:#fdf4ff,stroke:#a855f7
    style Infrastructure fill:#fef2f2,stroke:#dc2626
    style Users fill:#f0fdf4,stroke:#16a34a
```

## Server Roles

| Component | Host | Port | Technology |
|---|---|---|---|
| **FMS.WebClient** (API) | IIS App Pool `HyoungFMS.WebAPI` | 7009 | ASP.NET Core 8.0, Kestrel behind IIS |
| **fms.frontend** (SPA) | IIS App Pool `HyoungFMS.ReactApp` | 80 | Static React build files |
| **MySQL** | Database server | 3306 | MySQL with Pomelo EF Core provider |
| **Redis** | Docker container | 6379 | StackExchange.Redis (cache + SignalR backplane) |
| **RabbitMQ** | Message broker server | 5672 (AMQP) | GPS point ingestion from GPSGate |
| **FMS.PTS.WindowsService** | Windows Service | Custom | WebSocket server for fuel device communication |

## Deployment Paths

| Component | Deployment Method |
|---|---|
| **Backend** | `dotnet publish` → copy to `C:\inetpub\wwwroot\hyoungFMS\webAPI` |
| **Frontend** | `npm run build` → copy to `C:\inetpub\wwwroot\hyoungFMS\reactApp` |
| **CI/CD** | GitHub Actions (`.github/workflows/deploy-to-iis.yml`) |
| **Redis** | Docker: `scripts/redis/start-redis.bat` |

## Network Topology

```
Internet                                    Internal Network
─────────────                               ──────────────────
                    ┌─────────────┐
GPS Devices ──────► │  GPSGate    │
                    └──────┬──────┘
                           │ AMQP
                    ┌──────▼──────┐
                    │  RabbitMQ   │◄─────── Internal only
                    └──────┬──────┘
                           │
Browser ──► HTTPS ─► ┌─────▼──────────────┐
                     │  IIS (port 80/7009) │
Mobile  ──► HTTPS ─► │  ├── React SPA     │
                     │  └── .NET API       │──► MySQL :3306
                     │      └── SignalR    │──► Redis :6379
                     └─────────────────────┘
```

## Scaling Considerations

| Component | Current | Scaling Path |
|---|---|---|
| **Web API** | Single instance | Multiple IIS instances behind load balancer (SignalR uses Redis backplane) |
| **Background Services** | Hosted in API process | Extract to standalone worker service for independent scaling |
| **Redis** | Single Docker instance | Redis Sentinel or Redis Cluster for HA |
| **MySQL** | Single instance | Read replicas for query scaling |
| **RabbitMQ** | Single instance | RabbitMQ cluster for HA |
