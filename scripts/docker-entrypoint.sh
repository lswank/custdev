#!/bin/sh
set -e

# Initialize Git repo if not present
if [ ! -d /app/.git ]; then
  echo "Initializing Git repository..."
  cd /app
  git init
  git add -A
  git commit -m "Initial wiki setup"
fi

# Validate config files exist
if [ ! -f /app/config/site.yaml ]; then
  echo "WARNING: config/site.yaml not found. Run 'npm run setup' to create config files."
fi

echo "Starting wiki..."
exec "$@"
