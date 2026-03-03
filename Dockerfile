FROM node:20-slim

WORKDIR /app

# Install openssl for Prisma
RUN apt-get update -y && apt-get install -y openssl

# Dependencies
COPY package*.json ./
COPY prisma ./prisma

# Install dependencies using npm ci for consistency
RUN DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy" npm ci

# Copy source
COPY . .

# Generate Prisma Client
RUN DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy" npx prisma generate

# Build Next.js app with comprehensive dummy environment
# Provide all necessary keys to avoid module evaluation errors during build
RUN DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy" \
    AUTH_SECRET="vhQzYpGX9dlG4DYdrxZ9dlr86f+mFzdn9fJhquHB0Ng=" \
    NEXTAUTH_SECRET="vhQzYpGX9dlG4DYdrxZ9dlr86f+mFzdn9fJhquHB0Ng=" \
    NEXT_PUBLIC_APP_URL="https://reservation-service-1062807300473.asia-northeast1.run.app" \
    LINE_CHANNEL_ID="2009135338" \
    LINE_CHANNEL_SECRET="bbbedca8284bf903b3db2aa7b240ecf0" \
    LINE_ACCESS_TOKEN="DxDgHOVr/qCVCALX1VaaIcvtpcfPaCSP2iGJE6fJ4ZxyYM79gcopHR2sd6vWLQPTEkD08Qs13GvE4pPzRCAxEgrj2300Xu/szhRRMtBl2MOtSyRI0FUTDeCK7GisSRlZa7bp5LhXkeh+k2unOyO37wdB04t89/1O/w1cDnyilFU=" \
    NEXT_PUBLIC_LINE_LOGIN_ID="2009135380" \
    LINE_LOGIN_SECRET="fee5809a97a361dc3d50fb720fb40925" \
    NEXT_TELEMETRY_DISABLED=1 \
    NODE_ENV=production \
    NODE_OPTIONS="--max-old-space-size=4096" \
    npm run build

# Expose port
EXPOSE 3000

# Make migrate script executable
RUN chmod +x migrate.sh

# Start command
ENV TZ="Asia/Tokyo"
CMD ["/bin/sh", "-c", "./migrate.sh && npm start"]
