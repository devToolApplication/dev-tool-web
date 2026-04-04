#!/bin/bash

set -e

echo "🛠️  Generating Deployment manifest..."
export IMAGE_TAG=${IMAGE_TAG}
export DOCKER_REGISTRY=${DOCKER_REGISTRY}
export DOCKER_USERNAME=${DOCKER_USERNAME}
export SERVICE_NAME=${SERVICE_NAME}
export NAMESPACE=${NAMESPACE}
export NODE_PORT=${NODE_PORT}
export PORT=${NODE_PORT}

envsubst < "$DEPLOY_FILE" > k8s-deploy-final.yaml

echo "📄 Final YAML:"
cat k8s-deploy-final.yaml
