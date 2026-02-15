#!/bin/bash

echo "========================================================"
echo "   Google Cloud Run Easy Deploy Script"
echo "========================================================"
echo ""

# 1. Ask for Project ID
read -p "Enter your Google Cloud Project ID: " PROJECT_ID
if [ -z "$PROJECT_ID" ]; then echo "Project ID is required."; exit 1; fi

# 2. Ask for Region
read -p "Enter Region (default: asia-northeast1): " REGION
REGION=${REGION:-asia-northeast1}

echo ""
echo "Are you using Google Cloud SQL? (y/n)"
read -p "Database Type: " IS_CLOUDSQL

if [[ "$IS_CLOUDSQL" =~ ^[Yy]$ ]]; then
  # 3. Ask for Cloud SQL Connection Name
  echo ""
  echo "Find this in Cloud SQL Overview (Example: project-id:asia-northeast1:my-db)"
  read -p "Enter Cloud SQL Connection Name: " INSTANCE_CONNECTION_NAME
  if [ -z "$INSTANCE_CONNECTION_NAME" ]; then echo "Connection Name is required."; exit 1; fi

  # 4. Ask for DB Password
  echo ""
  read -s -p "Enter DB Password for 'postgres' user: " DB_PASSWORD
  echo ""
  
  DATABASE_URL_ENV="DATABASE_URL=postgresql://postgres:$DB_PASSWORD@localhost/reservation-db?host=/cloudsql/$INSTANCE_CONNECTION_NAME"
  CLOUDSQL_FLAG="--add-cloudsql-instances $INSTANCE_CONNECTION_NAME"
  
else
  # External DB (Supabase, Neon, etc.)
  echo ""
  echo "Enter your full Database connection string (e.g., postgresql://user:pass@host:port/dbname)"
  read -s -p "Database URL: " EXTERNAL_DB_URL
  echo ""
  if [ -z "$EXTERNAL_DB_URL" ]; then echo "Database URL is required."; exit 1; fi
  
  # Auto-append ?pgbouncer=true if using Supabase Pooler (port 6543)
  if [[ "$EXTERNAL_DB_URL" == *":6543"* ]] && [[ "$EXTERNAL_DB_URL" != *"pgbouncer=true"* ]]; then
    if [[ "$EXTERNAL_DB_URL" == *"?"* ]]; then
      EXTERNAL_DB_URL="${EXTERNAL_DB_URL}&pgbouncer=true"
    else
      EXTERNAL_DB_URL="${EXTERNAL_DB_URL}?pgbouncer=true"
    fi
    echo "Notice: Detected Supabase Pooler port 6543. Added ?pgbouncer=true to the URL."
  fi

  DATABASE_URL_ENV="DATABASE_URL=$EXTERNAL_DB_URL"
  CLOUDSQL_FLAG=""
fi

# 5. Generate Auth Secret if not provided
AUTH_SECRET=$(openssl rand -base64 32)
echo ""
echo "Generated a secure AUTH_SECRET for you."

echo ""
echo "========================================================"
echo "Starting Deployment..."
echo "Target: $PROJECT_ID / $REGION"
if [[ "$IS_CLOUDSQL" =~ ^[Yy]$ ]]; then
  echo "Database: Cloud SQL ($INSTANCE_CONNECTION_NAME)"
else
  echo "Database: External DB"
fi
echo "========================================================"
echo ""

# Construct the command
CMD="gcloud run deploy reservation-service \
  --source . \
  --region $REGION \
  --platform managed \
  --allow-unauthenticated \
  --project $PROJECT_ID \
  --set-env-vars \"$DATABASE_URL_ENV\" \
  --set-env-vars \"AUTH_SECRET=$AUTH_SECRET\" \
  --set-env-vars \"AUTH_TRUST_HOST=true\" \
  --set-env-vars \"NEXTAUTH_URL=https://reservation-service-1062807300473.asia-northeast1.run.app\" \
  --set-env-vars \"NEXT_PUBLIC_APP_URL=https://reservation-service-1062807300473.asia-northeast1.run.app\" \
  --set-env-vars \"LINE_CHANNEL_ID=2009135338\" \
  --set-env-vars \"LINE_CHANNEL_SECRET=bbbedca8284bf903b3db2aa7b240ecf0\" \
  --set-env-vars \"LINE_ACCESS_TOKEN=DxDgHOVr/qCVCALX1VaaIcvtpcfPaCSP2iGJE6fJ4ZxyYM79gcopHR2sd6vWLQPTEkD08Qs13GvE4pPzRCAxEgrj2300Xu/szhRRMtBl2MOtSyRI0FUTDeCK7GisSRlZa7bp5LhXkeh+k2unOyO37wdB04t89/1O/w1cDnyilFU=\" \
  --set-env-vars \"NEXT_PUBLIC_LINE_LOGIN_ID=2009135380\" \
  --set-env-vars \"LINE_LOGIN_SECRET=fee5809a97a361dc3d50fb720fb40925\" \
  --memory 1Gi \
  --timeout 600"

# Add Cloud SQL flag only if needed
if [ -n "$CLOUDSQL_FLAG" ]; then
  CMD="$CMD $CLOUDSQL_FLAG"
fi

# Execute
eval $CMD

echo ""
echo "Done!"
