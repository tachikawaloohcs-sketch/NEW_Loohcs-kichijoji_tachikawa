#!/bin/sh
# Fix cache permission issues for npx/npm
export HOME=/tmp

echo "=== STARTING CONTAINER STARTUP SCRIPT ==="
echo "PORT: $PORT"
echo "DATABASE_URL is set: $(if [ -z "$DATABASE_URL" ]; then echo "NO"; else echo "YES"; fi)"

# Check prisma availability
echo "Checking prisma CLI..."
npx prisma --version || echo "Prisma version check failed"

# Run migration using DIRECT connection (not pooler)
# Supabase Transaction Pooler (port 6543) doesn't support schema changes
# We need to use Direct Connection (port 5432) for migrations
echo "Running prisma db push via npx..."
MIGRATION_URL=$(echo "$DATABASE_URL" | sed 's/:6543\//:5432\//' | sed 's/?pgbouncer=true//')
echo "Using direct connection for migration (port 5432)..."
DATABASE_URL="$MIGRATION_URL" npx prisma db push --accept-data-loss --schema=./prisma/schema.prisma

echo "=== STARTING SERVER ==="
