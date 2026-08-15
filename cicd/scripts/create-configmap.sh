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
  while IFS='=' read -r key value || [ -n "$key" ]; do
    key=$(echo "$key" | tr -d '\r')
    value=$(echo "$value" | tr -d '\r')

    case "$key" in
      ""|\#*) continue ;;
    esac

    escaped_value=$(printf '%s' "$value" | sed 's/"/\\"/g')
    echo "  $key: \"$escaped_value\"" >> k8s-configmap.yaml
  done < "$CONFIG_SOURCE"
else
  echo "No cicd/k8s/.env or cicd/k8s/.env.example file found. Creating an empty ConfigMap data block."
fi

echo "Applying ConfigMap..."
kubectl apply -f k8s-configmap.yaml -n "${NAMESPACE}"