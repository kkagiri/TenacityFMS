#!/bin/bash
# Define Paths (adjusted for Cygwin)
REACT_BUILD_PATH="/cygdrive/e/source/Hyoung.FMS/fms.frontend/build"
WEBAPI_BUILD_PATH="/cygdrive/e/source/Hyoung.FMS/FMS.WebClient/publish"
REACT_DEPLOYMENT_PATH="/cygdrive/c/inetpub/wwwroot/hyoungFMS/reactApp"
WEBAPI_DEPLOYMENT_PATH="/cygdrive/c/inetpub/wwwroot/hyoungFMS/webAPI"

# Function to deploy React app
deploy_react() {
  ENV=$1
  echo "Deploying React app to $REACT_DEPLOYMENT_PATH"
  ssh administrator@10.0.10.153 "rm -rf \"$REACT_DEPLOYMENT_PATH\""
  ssh administrator@10.0.10.153 "mkdir -p \"$REACT_DEPLOYMENT_PATH\""
  rsync -avz --exclude 'web.config' "$REACT_BUILD_PATH/" administrator@10.0.10.153:"$REACT_DEPLOYMENT_PATH"
}

# Function to deploy Web API
deploy_webapi() {
  echo "Deploying Web API to $WEBAPI_DEPLOYMENT_PATH"
  ssh administrator@10.0.10.153 "rm -rf \"$WEBAPI_DEPLOYMENT_PATH\""
  ssh administrator@10.0.10.153 "mkdir -p \"$WEBAPI_DEPLOYMENT_PATH\""
  rsync -avz --exclude 'web.config' "$WEBAPI_BUILD_PATH/" administrator@10.0.10.153:"$WEBAPI_DEPLOYMENT_PATH"
}

# Check for environment argument (internal/external)
if [ "$1" == "internal" ]; then
  npm.cmd run build:internal
  deploy_react "internal"
elif [ "$1" == "external" ]; then
  npm.cmd run build:external
  deploy_react "external"
else
  echo "Usage: deploy.sh [internal|external]"
  exit 1
fi

# Deploy Web API
dotnet.exe publish -c Release -o "$WEBAPI_BUILD_PATH"
deploy_webapi

echo "Deployment completed for $1 environment."