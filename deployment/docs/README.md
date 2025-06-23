# FMS Documentation Index

This directory contains all documentation for the Fleet Management System (FMS).

## 📁 Directory Structure

```
docs/
├── setup/          # Setup and installation guides
├── deployment/     # Deployment and CI/CD documentation
└── README.md       # This index file
```

## 🚀 Getting Started

**New to FMS?** Start with these documents in order:

1. **[NEXT-STEPS.md](setup/NEXT-STEPS.md)** - Quick start guide for new environments
2. **[CLONING-GUIDE.md](setup/CLONING-GUIDE.md)** - Complete setup walkthrough
3. **[ENVIRONMENT-SETUP.md](setup/ENVIRONMENT-SETUP.md)** - Environment variable details

## 📋 Setup Documentation

### Essential Setup Guides
- **[NEXT-STEPS.md](setup/NEXT-STEPS.md)** - ⭐ **Start here for new environments**
- **[CLONING-GUIDE.md](setup/CLONING-GUIDE.md)** - Complete setup guide with all options
- **[ENVIRONMENT-SETUP.md](setup/ENVIRONMENT-SETUP.md)** - Detailed environment variable documentation

### Docker & Redis Setup
- **[INSTALL-DOCKER-MANUALLY.md](setup/INSTALL-DOCKER-MANUALLY.md)** - Docker Desktop installation guide
- **[install-redis-windows.md](setup/install-redis-windows.md)** - Alternative Redis installation methods

## 🚀 Deployment Documentation

### CI/CD & Deployment
- **[deploy.ps1](deployment/deploy.ps1)** - Automated deployment script
- **[deploy.config](deployment/deploy.config)** - Deployment configuration
- **[azure-pipelines.yml](deployment/azure-pipelines.yml)** - Azure DevOps pipeline configuration

## 🔧 Related Scripts

### Environment Configuration
- `../scripts/environment/setup-environment.bat` - Main environment setup (with Redis)
- `../scripts/environment/setup-environment-no-redis.bat` - Environment setup (without Redis)
- `../scripts/environment/setup-frontend-env.ps1` - Frontend environment configuration
- `../scripts/environment/setup-pts-env.bat` - PTS Windows Service setup

### Redis Management
- `../scripts/redis/start-redis.bat` - Start Redis container
- `../scripts/redis/stop-redis.bat` - Stop Redis container
- `../scripts/redis/docker-compose.redis.yml` - Redis Docker configuration

### Verification & Testing
- `../scripts/verification/check-docker.ps1` - Check Docker installation
- `../scripts/verification/verify-environment.ps1` - Verify backend environment
- `../scripts/verification/verify-pts-env.ps1` - Verify PTS service environment

## 📚 Documentation Categories

### By Audience
- **Developers** - Start with [NEXT-STEPS.md](setup/NEXT-STEPS.md)
- **DevOps Engineers** - See [deployment/](deployment/) folder
- **System Administrators** - Focus on environment setup guides

### By Task
- **First-time setup** - [CLONING-GUIDE.md](setup/CLONING-GUIDE.md)
- **Redis configuration** - [INSTALL-DOCKER-MANUALLY.md](setup/INSTALL-DOCKER-MANUALLY.md)
- **Environment troubleshooting** - [ENVIRONMENT-SETUP.md](setup/ENVIRONMENT-SETUP.md)
- **Production deployment** - [deployment/deploy.ps1](deployment/deploy.ps1)

## 🆘 Quick Help

### Common Scenarios
| I want to... | Document to read |
|--------------|------------------|
| Set up a new development environment | [NEXT-STEPS.md](setup/NEXT-STEPS.md) |
| Understand all setup options | [CLONING-GUIDE.md](setup/CLONING-GUIDE.md) |
| Install Docker for Redis | [INSTALL-DOCKER-MANUALLY.md](setup/INSTALL-DOCKER-MANUALLY.md) |
| Skip Redis and develop without it | [CLONING-GUIDE.md](setup/CLONING-GUIDE.md#option-c-development-without-redis) |
| Deploy to production | [deployment/deploy.ps1](deployment/deploy.ps1) |
| Troubleshoot environment issues | [ENVIRONMENT-SETUP.md](setup/ENVIRONMENT-SETUP.md) |

### Scripts Quick Reference
| I need to... | Script to run |
|--------------|---------------|
| Check if everything is working | `../scripts/verification/check-docker.ps1` |
| Start Redis | `../scripts/redis/start-redis.bat` |
| Verify environment variables | `../scripts/verification/verify-environment.ps1` |
| Set up PTS Windows Service | `../scripts/environment/setup-pts-env.bat` |

---

**Not sure where to start?** → [NEXT-STEPS.md](setup/NEXT-STEPS.md)