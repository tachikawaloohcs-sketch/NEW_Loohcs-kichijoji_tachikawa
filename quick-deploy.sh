#!/bin/bash

echo "Starting deployment to Cloud Run..."

gcloud run deploy reservation-service \
  --source . \
  --region asia-northeast1 \
  --platform managed \
  --allow-unauthenticated \
  --project project-bfeb0bc9-9bbc-4920-965 \
  --update-env-vars "DATABASE_URL=postgresql://postgres.gubmbkybqkmyrzdtheya:Yamamoto_Hasegawa2525@aws-1-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true" \
  --update-env-vars "AUTH_SECRET=vhQzYpGX9dlG4DYdrxZ9dlr86f+mFzdn9fJhquHB0Ng=" \
  --update-env-vars "AUTH_TRUST_HOST=true" \
  --update-env-vars "NEXTAUTH_URL=https://reservation-service-1062807300473.asia-northeast1.run.app" \
  --update-env-vars "NEXT_PUBLIC_APP_URL=https://reservation-service-1062807300473.asia-northeast1.run.app" \
  --update-env-vars "LINE_CHANNEL_ID=2009135338" \
  --update-env-vars "LINE_CHANNEL_SECRET=bbbedca8284bf903b3db2aa7b240ecf0" \
  --update-env-vars "LINE_ACCESS_TOKEN=DxDgHOVr/qCVCALX1VaaIcvtpcfPaCSP2iGJE6fJ4ZxyYM79gcopHR2sd6vWLQPTEkD08Qs13GvE4pPzRCAxEgrj2300Xu/szhRRMtBl2MOtSyRI0FUTDeCK7GisSRlZa7bp5LhXkeh+k2unOyO37wdB04t89/1O/w1cDnyilFU=" \
  --update-env-vars "NEXT_PUBLIC_LINE_LOGIN_ID=2009135380" \
  --update-env-vars "LINE_LOGIN_SECRET=fee5809a97a361dc3d50fb720fb40925" \
  --memory 1Gi \
  --timeout 600

echo "Deployment complete!"
