#!/bin/sh
# Fix cache permission issues for npx/npm
export HOME=/tmp

# Run migration
echo "Running prisma db push via global CLI..."
if [ -z "$DATABASE_URL" ]; then
  echo "Error: DATABASE_URL is not set."
  exit 1
fi

# Use global prisma command
prisma db push --accept-data-loss --schema=./prisma/schema.prisma
