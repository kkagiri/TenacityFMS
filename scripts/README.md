# FMS Scripts Directory

This directory contains all automation scripts for the Fleet Management System (FMS).

## 📁 Directory Structure

```
scripts/
├── environment/        # Environment configuration scripts
├── redis/             # Redis management scripts
├── verification/      # Verification and testing scripts
└── README.md          # This index file
```

## 🚀 Quick Start Scripts

### For New Environments
```powershell
# 1. Check prerequisites
verification/check-docker.ps1

# 2. Set up environment (choose one)
environment/setup-environment.bat              # With Redis (recommended)
environment/setup-environment-no-redis.bat     # Without Redis

# 3. Start Redis (if using Redis option)
redis/start-redis.bat

# 4. Verify everything is working
verification/verify-environment.ps1
```

## 📂 Environment Configuration Scripts

### Primary Setup Scripts
| Script | Purpose | Run As Admin |
|--------|---------|--------------|
| `environment/setup-environment.bat` | Configure backend with Redis support | ✅ Yes |
| `environment/setup-environment-no-redis.bat` | Configure backend without Redis | ✅ Yes |
| `environment/setup-frontend-env.ps1` | Configure React frontend environment | ❌ No |
| `environment/setup-pts-env.bat` | Configure PTS Windows Service | ✅ Yes |
| `environment/setup-pts-env.ps1` | Configure PTS Windows Service (PowerShell) | ✅ Yes |

### Usage Examples
```powershell
# Main backend setup (with Redis)
environment/setup-environment.bat

# Backend setup for development without Redis
environment/setup-environment-no-redis.bat

# Frontend React app setup
powershell -ExecutionPolicy Bypass -File environment/setup-frontend-env.ps1

# PTS Windows Service setup
environment/setup-pts-env.bat
```

## 🔧 Redis Management Scripts

### Docker-based Redis Scripts
| Script | Purpose | Prerequisites |
|--------|---------|---------------|
| `redis/start-redis.bat` | Start Redis Docker container | Docker Desktop installed |
| `redis/stop-redis.bat` | Stop Redis Docker container | Docker Desktop running |
| `redis/docker-compose.redis.yml` | Redis Docker Compose configuration | Used by start/stop scripts |

### Usage Examples
```powershell
# Start Redis for development
redis/start-redis.bat

# Stop Redis when done
redis/stop-redis.bat

# Check Redis status (part of verification)
verification/check-docker.ps1
```

## ✅ Verification & Testing Scripts

### Status Check Scripts
| Script | Purpose | Checks |
|--------|---------|---------|
| `verification/check-docker.ps1` | Check Docker installation and status | Docker installed, daemon running, Redis ready |
| `verification/verify-environment.ps1` | Verify backend environment variables | All required env vars set |
| `verification/verify-pts-env.ps1` | Verify PTS service environment variables | PTS-specific env vars set |

### Usage Examples
```powershell
# Check overall system status
verification/check-docker.ps1

# Verify backend configuration
verification/verify-environment.ps1

# Verify PTS service configuration
verification/verify-pts-env.ps1
```

## 🎯 Common Workflows

### Complete New Environment Setup
```powershell
# 1. Install Docker Desktop manually (see docs/setup/INSTALL-DOCKER-MANUALLY.md)

# 2. Configure environment
environment/setup-environment.bat

# 3. Setup frontend
environment/setup-frontend-env.ps1

# 4. Verify Docker
verification/check-docker.ps1

# 5. Start Redis
redis/start-redis.bat

# 6. Final verification
verification/verify-environment.ps1
```

### Daily Development Workflow
```powershell
# Start Redis
redis/start-redis.bat

# Verify everything is running
verification/check-docker.ps1

# Start development...
# (Open Visual Studio, run npm start, etc.)

# When done, stop Redis (optional)
redis/stop-redis.bat
```

### Troubleshooting Workflow
```powershell
# Check Docker status
verification/check-docker.ps1

# Check environment variables
verification/verify-environment.ps1

# Check PTS configuration (if needed)
verification/verify-pts-env.ps1

# If issues found, re-run setup scripts as needed
```

## 🔐 Security Notes

### Admin Privileges Required
The following scripts require administrator privileges:
- `environment/setup-environment.bat`
- `environment/setup-environment-no-redis.bat`
- `environment/setup-pts-env.bat`
- `environment/setup-pts-env.ps1`

### Safe to Run Multiple Times
All scripts are idempotent and safe to run multiple times:
- Environment scripts will overwrite existing variables
- Redis scripts will recreate containers if needed
- Verification scripts are read-only

## 🆘 Troubleshooting

### Common Issues and Solutions

| Issue | Solution |
|-------|----------|
| "Access Denied" errors | Run script as Administrator |
| "Docker not found" | Install Docker Desktop, see docs/setup/ |
| "Environment variables not set" | Re-run environment setup script as Admin |
| "Redis connection failed" | Check if Redis container is running |
| PowerShell execution policy | Use `-ExecutionPolicy Bypass` flag |

### Script Execution Examples
```powershell
# If PowerShell execution policy blocks scripts
powershell -ExecutionPolicy Bypass -File verification/check-docker.ps1

# If you need to run as Administrator
# Right-click PowerShell -> "Run as Administrator", then:
environment/setup-environment.bat
```

## 📋 Script Dependencies

### Prerequisites by Script Category
- **Environment Scripts**: Windows, PowerShell, Admin privileges
- **Redis Scripts**: Docker Desktop installed and running
- **Verification Scripts**: PowerShell (no admin required)

### Inter-script Dependencies
1. Environment setup → Verification scripts
2. Docker installation → Redis scripts → Verification scripts
3. Frontend setup → No dependencies

---

**Need help?** Check the [documentation](../docs/) or run `verification/check-docker.ps1` to see current status.