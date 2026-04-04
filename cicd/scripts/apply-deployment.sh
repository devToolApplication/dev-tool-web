#!/bin/bash
set -euo pipefail
trap 'echo "❌ Deployment apply failed!"' ERR

echo "🧪 Validating deployment manifest..."
kubectl apply -f k8s-deploy-final.yaml --dry-run=client -n "${NAMESPACE}"

echo "🚀 Applying deployment..."
kubectl apply -f k8s-deploy-final.yaml -n "${NAMESPACE}"

echo "🔁 Restarting deployment..."
kubectl rollout restart deployment/${SERVICE_NAME} -n "${NAMESPACE}"
