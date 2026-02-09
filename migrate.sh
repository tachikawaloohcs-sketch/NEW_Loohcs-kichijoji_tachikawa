#!/bin/sh
# Fix cache permission issues for npx/npm
export HOME=/tmp

echo "=== STARTING CONTAINER STARTUP SCRIPT ==="
echo "PORT: $PORT"
echo "DATABASE_URL is set: $(if [ -z "$DATABASE_URL" ]; then echo "NO"; else echo "YES"; fi)"

# Check prisma availability
echo "Checking prisma CLI..."
which prisma || echo "Prisma not found in path"
prisma --version || echo "Prisma version check failed"

# Run migration (Allow failure to let app start)
echo "Running prisma db push via global CLI..."
prisma db push --accept-data-loss --schema=./prisma/schema.prisma || echo "WARNING: Migration failed, but continuing application startup..."

echo "=== STARTING SERVER ==="
