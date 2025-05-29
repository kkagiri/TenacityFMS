# FMS (Fleet Management System)

A comprehensive fleet management system with real-time tracking, fuel management, and device monitoring capabilities.

## 🚀 Quick Start

**New to this repository?** Start here: [`docs/setup/NEXT-STEPS.md`](docs/setup/NEXT-STEPS.md)

**Complete setup guide:** [`docs/setup/CLONING-GUIDE.md`](docs/setup/CLONING-GUIDE.md)

## 📋 Project Structure

```
FMS/
├── docs/                           # Documentation
│   ├── setup/                      # Setup and installation guides
│   └── deployment/                 # Deployment documentation
├── scripts/                        # Automation scripts
│   ├── environment/                # Environment configuration scripts
│   ├── redis/                      # Redis management scripts
│   └── verification/               # Verification and testing scripts
├── FMS.WebClient/                  # Main web API (.NET 8.0)
├── FMS.frontend/                   # React frontend application
├── FMS.PTS.WindowsService/         # PTS Windows Service for device communication
├── FMS.Application/                # Core business logic and CQRS
├── FMS.Domain/                     # Domain entities and models
├── FMS.Persistence/                # Data access and repositories
└── FMS.Infrastructure/             # Infrastructure services
```

## 🛠️ Technology Stack

### Backend
- **.NET 8.0** - Core framework
- **Entity Framework Core** - Data access
- **MediatR** - CQRS implementation
- **SignalR** - Real-time communication
- **Redis** - Caching and SignalR backplane
- **MySQL** - Primary database
- **AutoMapper** - Object mapping

### Frontend
- **React** - UI framework
- **Redux** - State management
- **DevExtreme** - UI components
- **Axios** - HTTP client

### Infrastructure
- **Docker** - Containerization
- **Redis** - Caching and messaging
- **WebSocket** - Real-time device communication

## 📚 Documentation

### Setup & Installation
- [`docs/setup/NEXT-STEPS.md`](docs/setup/NEXT-STEPS.md) - **Start here for new environments**
- [`docs/setup/CLONING-GUIDE.md`](docs/setup/CLONING-GUIDE.md) - Complete setup guide
- [`docs/setup/INSTALL-DOCKER-MANUALLY.md`](docs/setup/INSTALL-DOCKER-MANUALLY.md) - Docker installation
- [`docs/setup/install-redis-windows.md`](docs/setup/install-redis-windows.md) - Redis on Windows
- [`docs/setup/ENVIRONMENT-SETUP.md`](docs/setup/ENVIRONMENT-SETUP.md) - Environment variables guide

### Deployment
- [`docs/deployment/deploy.ps1`](docs/deployment/deploy.ps1) - Deployment script
- [`docs/deployment/azure-pipelines.yml`](docs/deployment/azure-pipelines.yml) - CI/CD pipeline

## 🔧 Available Scripts

### Environment Setup
| Script | Purpose |
|--------|---------|
| `scripts/environment/setup-environment.bat` | Configure backend environment (with Redis) |
| `scripts/environment/setup-environment-no-redis.bat` | Configure backend environment (without Redis) |
| `scripts/environment/setup-frontend-env.ps1` | Configure frontend environment |
| `scripts/environment/setup-pts-env.bat` | Configure PTS Windows Service |

### Redis Management
| Script | Purpose |
|--------|---------|
| `scripts/redis/start-redis.bat` | Start Redis Docker container |
| `scripts/redis/stop-redis.bat` | Stop Redis Docker container |
| `scripts/redis/docker-compose.redis.yml` | Redis Docker Compose configuration |

### Verification & Testing
| Script | Purpose |
|--------|---------|
| `scripts/verification/check-docker.ps1` | Check Docker installation status |
| `scripts/verification/verify-environment.ps1` | Verify backend environment variables |
| `scripts/verification/verify-pts-env.ps1` | Verify PTS service environment variables |

## 🏗️ Architecture Overview

### Core Components

1. **FMS.WebClient** - Main API server
   - REST APIs for frontend communication
   - SignalR hubs for real-time updates
   - Authentication and authorization
   - Business logic orchestration

2. **FMS.frontend** - React application
   - Modern responsive UI
   - Real-time dashboard
   - Device monitoring
   - Fuel management interface

3. **FMS.PTS.WindowsService** - Device communication service
   - WebSocket server for device connections
   - Real-time data processing
   - Device status monitoring
   - Command processing

### Key Features

- **Real-time Device Tracking** - Live monitoring of fleet vehicles and fuel dispensers
- **Fuel Management** - Track fuel consumption, refills, and inventory
- **Device Communication** - WebSocket-based communication with PTS devices
- **User Management** - Role-based access control and permissions
- **Reporting** - Comprehensive reporting and analytics
- **Multi-tenancy** - Support for multiple organizations/sites

## 🚀 Development Workflow

### First Time Setup
1. **Clone the repository**
2. **Follow**: [`docs/setup/NEXT-STEPS.md`](docs/setup/NEXT-STEPS.md)
3. **Install Docker Desktop** (recommended for Redis)
4. **Run environment setup scripts**
5. **Start development**

### Daily Development
```powershell
# Start Redis (if using Docker)
scripts/redis/start-redis.bat

# Backend development
# Open solution in Visual Studio/VS Code and run FMS.WebClient

# Frontend development
cd FMS.frontend
npm start
```

### Testing
```powershell
# Verify environment
scripts/verification/verify-environment.ps1

# Check Docker status
scripts/verification/check-docker.ps1
```

## 🔐 Security & Configuration

- **Environment Variables**: All sensitive configuration is stored in environment variables
- **No Credentials in Code**: Database connections and API keys are never committed
- **Secure Defaults**: Production-ready security settings by default

## 📝 Contributing

1. **Follow the setup guide** to configure your development environment
2. **Create feature branches** from `main`
3. **Test thoroughly** using provided verification scripts
4. **Update documentation** for any new features or changes

## 🆘 Support & Troubleshooting

### Common Issues
- **Docker not starting**: See [`docs/setup/INSTALL-DOCKER-MANUALLY.md`](docs/setup/INSTALL-DOCKER-MANUALLY.md)
- **Environment variables not set**: Run verification scripts in `scripts/verification/`
- **Redis connection issues**: Check if Redis is running via `scripts/verification/check-docker.ps1`

### Getting Help
1. **Check the documentation** in the `docs/` folder
2. **Run verification scripts** to identify issues
3. **Review error logs** in application log directories

## 📄 License

This project is proprietary software. All rights reserved.

---

**Ready to start?** → [`docs/setup/NEXT-STEPS.md`](docs/setup/NEXT-STEPS.md)