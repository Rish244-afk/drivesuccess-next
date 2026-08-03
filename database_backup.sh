#!/bin/bash
# DriveSuccess Academy - Automated PostgreSQL Backup Script
# Run this via a daily Cron job (e.g., 0 3 * * * /path/to/database_backup.sh)

# Load environment variables
if [ -f .env ]; then
  export $(cat .env | xargs)
fi

BACKUP_DIR="./backups"
TIMESTAMP=$(date +"%Y-%m-%d_%H-%M-%S")
FILENAME="$BACKUP_DIR/db_backup_$TIMESTAMP.sql"

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Perform backup
echo "Starting PostgreSQL backup..."
if [ -z "$DATABASE_URL" ]; then
  echo "Error: DATABASE_URL is not set in .env"
  exit 1
fi

pg_dump $DATABASE_URL > $FILENAME

if [ $? -eq 0 ]; then
  echo "✅ Backup successfully created: $FILENAME"
else
  echo "❌ Backup failed!"
  exit 1
fi

# Keep only the last 7 days of backups to save disk space
find $BACKUP_DIR -type f -name "*.sql" -mtime +7 -exec rm {} \;
echo "🧹 Old backups cleaned up."
