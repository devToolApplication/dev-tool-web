#!/bin/bash
set -e

echo "📁 Checking .env file..."
if [ ! -f .env ]; then
  echo "⚠️ WARNING: .env file not found. Skipping env data append to ConfigMap."
  SKIP_ENV=true
fi

echo "🔄 Rendering ConfigMap template..."
export CONFIGMAP_NAME=${CONFIGMAP_NAME}
export NAMESPACE=${NAMESPACE}
envsubst < cicd/k8s/k8s-configmap.yaml > k8s-configmap.yaml

if [ "$SKIP_ENV" != true ]; then
  echo "🔧 Appending data from .env..."
  echo "data:" >> k8s-configmap.yaml

  declare -A seen_keys

  while IFS='=' read -r key value || [[ -n "$key" ]]; do
    # Bỏ dòng rỗng hoặc comment
    if [[ -z "$key" || "$key" == \#* ]]; then
      continue
    fi

    if [[ -n "${seen_keys[$key]}" ]]; then
      echo "⚠️  Skipped duplicate key: $key"
      continue
    fi

    seen_keys[$key]=1
    escaped_value=$(printf '%s' "$value" | sed 's/"/\\"/g')
    echo "  $key: \"$escaped_value\"" >> k8s-configmap.yaml
  done < .env
else
  echo "ℹ️  Skipped appending .env content to ConfigMap."
fi

echo "📦 Applying ConfigMap..."
kubectl apply -f k8s-configmap.yaml -n ${NAMESPACE}
