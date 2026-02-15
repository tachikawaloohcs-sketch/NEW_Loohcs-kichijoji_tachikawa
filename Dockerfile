FROM node:20-slim

WORKDIR /app

# Install openssl for Prisma
RUN apt-get update -y && apt-get install -y openssl

# Dependencies
COPY package*.json ./
COPY prisma ./prisma

# Install dependencies (including production)
RUN rm -f package-lock.json
RUN npm install

# Copy source
COPY . .

# Generate Prisma Client
# Use dummy URL to avoid connection attempt if any
RUN DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy" npx prisma generate

# Build Next.js app
RUN npm run build

# Expose port
EXPOSE 3000

# Start command
CMD ["npm", "start"]
