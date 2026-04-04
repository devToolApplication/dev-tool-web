#!/bin/bash
set -euo pipefail
echo "🔨 Building image with Kaniko..."

exec /kaniko/executor \
  --dockerfile=Dockerfile \
  --context=dir://$(pwd) \
  --destination=${DOCKER_REGISTRY}/${IMAGE_NAME}:${IMAGE_TAG} \
  --destination=${DOCKER_REGISTRY}/${IMAGE_NAME}:latest \
  --cache=true \
  --cache-repo=${DOCKER_REGISTRY}/${CACHE_REPO} \
  --verbosity=info
