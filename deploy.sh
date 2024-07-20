#!/bin/bash

set -e  # Exit immediately if a command exits with a non-zero status.

# Source configuration
source ./deploy.config

# Setup logging
LOG_FILE="/var/log/hyoung_fms_deploy.log"
log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Function to stop IIS
stop_iis() {
    log "Stopping IIS..."
    powershell.exe -Command "Stop-IISSite -Name \"$IIS_SITE_NAME\" -Confirm:$false; Stop-WebAppPool -Name \"$IIS_APP_POOL\""
}

# Function to start IIS
start_iis() {
    log "Starting IIS..."
    powershell.exe -Command "Start-WebAppPool -Name \"$IIS_APP_POOL\"; Start-IISSite -Name \"$IIS_SITE_NAME\""
}

# Function to deploy React app
deploy_react() {
    ENV=$1
    log "Deploying React app to $REACT_DEPLOYMENT_PATH"
    cp -r "$REACT_DEPLOYMENT_PATH" "${REACT_DEPLOYMENT_PATH}_backup_$(date +'%Y%m%d_%H%M%S')"
    rm -rf "$REACT_DEPLOYMENT_PATH"
    mkdir -p "$REACT_DEPLOYMENT_PATH"
    rsync -avz --exclude 'web.config' "$REACT_BUILD_PATH/" "$REACT_DEPLOYMENT_PATH"
}

# Function to deploy Web API
deploy_webapi() {
    log "Deploying Web API to $WEBAPI_DEPLOYMENT_PATH"
    cp -r "$WEBAPI_DEPLOYMENT_PATH" "${WEBAPI_DEPLOYMENT_PATH}_backup_$(date +'%Y%m%d_%H%M%S')"
    rm -rf "$WEBAPI_DEPLOYMENT_PATH"
    mkdir -p "$WEBAPI_DEPLOYMENT_PATH"
    rsync -avz --exclude 'web.config' "$WEBAPI_BUILD_PATH/" "$WEBAPI_DEPLOYMENT_PATH"
}

# Function to perform health check
health_check() {
    log "Performing health check..."
    HEALTH_CHECK_URL="http://localhost/health"
    if curl -sSf "$HEALTH_CHECK_URL" > /dev/null; then
        log "Health check passed."
    else
        log "Health check failed. Rolling back..."
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
    if [[ "$1" != "internal" && "$1" != "external" ]]; then
        log "Usage: deploy.sh [internal|external]"
        exit 1
    fi

    log "Starting deployment for $1 environment"

    stop_iis
    deploy_react "$1"
    deploy_webapi
    start_iis
    health_check

    log "Deployment completed for $1 environment"
}

# Run main function
main "$@"
