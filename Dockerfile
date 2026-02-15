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
RUN DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy" \
    AUTH_SECRET="dummy_secret_for_build_logic_32bytes_long" \
    NEXTAUTH_SECRET="dummy_secret_for_build_logic_32bytes_long" \
    NEXT_TELEMETRY_DISABLED=1 \
    NODE_ENV=production \
    NODE_OPTIONS="--max-old-space-size=4096" \
    npm run build

# Expose port
EXPOSE 3000

# Start command
CMD ["npm", "start"]
