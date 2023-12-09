#!/bin/bash

echo "Waiting for LocalStack to be ready..."
until wget --spider --quiet http://localstack:4566/_localstack/health; do
  printf '.'
  sleep 5
done

export NAME="test-localstack-hot-reload"
export NODE_ENV="production"
export AWS_ACCESS_KEY_ID="$AWS_ACCESS_KEY_ID"
export AWS_SECRET_ACCESS_KEY="$AWS_SECRET_ACCESS_KEY"
export AWS_DEFAULT_REGION="$CDK_DEFAULT_REGION"
export AWS_ACCOUNT_ID="000000000000"
export AWS_ENDPOINT_URL=$AWS_ENDPOINT_URL

cdklocal bootstrap
cdklocal deploy $NAME --require-approval never
