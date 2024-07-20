#!/bin/bash
set -e  # Exit immediately if a command exits with a non-zero status.

# Setup logging
LOG_FILE="C:/actions-runner/_work/hyoung.fms/deployment.log"
log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Function to stop IIS
stop_iis() {
    log "Stopping IIS service..."
    powershell.exe -Command "Stop-Service -Name W3SVC -Force"
}

# Function to start IIS
start_iis() {
    log "Starting IIS service..."
    powershell.exe -Command "Start-Service -Name W3SVC"
}

# Function to deploy React app
deploy_react() {
    log "Deploying React app to $REACT_DEPLOYMENT_PATH"
    cp -r "$REACT_DEPLOYMENT_PATH" "${REACT_DEPLOYMENT_PATH}_backup_$(date +'%Y%m%d_%H%M%S')"
    rm -rf "$REACT_DEPLOYMENT_PATH"
    mkdir -p "$REACT_DEPLOYMENT_PATH"
    cp -r "$REACT_BUILD_PATH"/* "$REACT_DEPLOYMENT_PATH"
}

# Function to deploy Web API
deploy_webapi() {
    log "Deploying Web API to $WEBAPI_DEPLOYMENT_PATH"
    cp -r "$WEBAPI_DEPLOYMENT_PATH" "${WEBAPI_DEPLOYMENT_PATH}_backup_$(date +'%Y%m%d_%H%M%S')"
    rm -rf "$WEBAPI_DEPLOYMENT_PATH"
    mkdir -p "$WEBAPI_DEPLOYMENT_PATH"
    cp -r "$WEBAPI_BUILD_PATH"/* "$WEBAPI_DEPLOYMENT_PATH"
}

# Function to perform health check
health_check() {
    log "Performing health check..."
    HEALTH_CHECK_URL="http://localhost:7009/api/health"
    
    response=$(curl -s "$HEALTH_CHECK_URL")
    status=$(echo "$response" | grep -o '"status":"[^"]*"' | cut -d'"' -f4)
    
    if [ "$status" = "OK" ]; then
        log "Health check passed. Status: OK"
    else
        log "Health check failed. Status: $status"
        log "Rolling back..."
        rollback
        exit 1
    fi
}

# Function to rollback
rollback() {
    log "Rolling back to previous version..."
    # Implement rollback logic here
}

# Main deployment logic
main() {
    log "Starting deployment"
    stop_iis
    deploy_react
    deploy_webapi
    start_iis
    health_check
    log "Deployment completed successfully"
}

# Run main function
main
