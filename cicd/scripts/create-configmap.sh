#!/bin/sh
set -eu

CONFIG_SOURCE=""
if [ -f cicd/k8s/.env ]; then
  CONFIG_SOURCE="cicd/k8s/.env"
elif [ -f cicd/k8s/.env.example ]; then
  CONFIG_SOURCE="cicd/k8s/.env.example"
fi

echo "Rendering ConfigMap template..."
export CONFIGMAP_NAME="${CONFIGMAP_NAME}"
export NAMESPACE="${NAMESPACE}"
envsubst < cicd/k8s/k8s-configmap.yaml > k8s-configmap.yaml

echo "data:" >> k8s-configmap.yaml

if [ -n "$CONFIG_SOURCE" ]; then
  echo "Appending data from ${CONFIG_SOURCE}..."
  # Strip UTF-8 BOM, carriage returns, and process lines
  sed '1s/^\xef\xbb\xbf//' "$CONFIG_SOURCE" | tr -d '\r' | while IFS='=' read -r key value || [ -n "$key" ]; do
    case "$key" in
      ""|\#*) continue ;;
    esac

    # Sanitize key name for kubernetes configmap (strip non-standard chars)
    clean_key=$(echo "$key" | tr -cd 'a-zA-Z0-9_.-')
    if [ -z "$clean_key" ]; then
      continue
    fi

    escaped_value=$(printf '%s' "$value" | sed 's/"/\\"/g')
    echo "  $clean_key: \"$escaped_value\"" >> k8s-configmap.yaml
  done
else
  echo "No cicd/k8s/.env or cicd/k8s/.env.example file found. Creating an empty ConfigMap data block."
fi

echo "Applying ConfigMap..."
kubectl apply -f k8s-configmap.yaml -n "${NAMESPACE}"