#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

if [ -f "${SCRIPT_DIR}/.env" ]; then
  set -a
  source "${SCRIPT_DIR}/.env"
  set +a
fi

: "${S3_BUCKET:?S3_BUCKET is not set. Add it to .env or export it.}"
: "${CF_DISTRIBUTION_ID:?CF_DISTRIBUTION_ID is not set. Add it to .env or export it.}"

echo "Building frontend..."
cd "${SCRIPT_DIR}/frontend"
npm run build

echo "Deploying to S3..."
aws s3 sync dist/ "s3://${S3_BUCKET}" --delete

echo "Invalidating CloudFront cache..."
aws cloudfront create-invalidation \
  --distribution-id "${CF_DISTRIBUTION_ID}" \
  --paths "/*" \
  --query 'Invalidation.Id' \
  --output text

echo "Deploy complete!"
