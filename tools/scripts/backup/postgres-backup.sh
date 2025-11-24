#!/usr/bin/env bash
set -euo pipefail

# PostgreSQL Backup Script for Political Sphere
# Creates automated backups of the PostgreSQL database

# Configuration
BACKUP_DIR="${BACKUP_DIR:-/var/backups/political-sphere}"
RETENTION_DAYS="${RETENTION_DAYS:-30}"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_NAME="political_sphere_backup_${TIMESTAMP}"

# Database connection details
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-15432}"
DB_NAME="${DB_NAME:-political_dev}"
DB_USER="${DB_USER:-political}"
DB_PASSWORD="${DB_PASSWORD:-changeme}"

# Ensure backup directory exists
mkdir -p "$BACKUP_DIR"

echo "🚀 Starting PostgreSQL backup: $BACKUP_NAME"
echo "📁 Backup directory: $BACKUP_DIR"
echo "🗃️  Database: $DB_NAME"

# Create backup using pg_dump
PGPASSWORD="$DB_PASSWORD" pg_dump \
  --host="$DB_HOST" \
  --port="$DB_PORT" \
  --username="$DB_USER" \
  --dbname="$DB_NAME" \
  --format=custom \
  --compress=9 \
  --verbose \
  --file="$BACKUP_DIR/$BACKUP_NAME.backup"

# Verify backup integrity
echo "🔍 Verifying backup integrity..."
PGPASSWORD="$DB_PASSWORD" pg_restore \
  --host="$DB_HOST" \
  --port="$DB_PORT" \
  --username="$DB_USER" \
  --dbname="$DB_NAME" \
  --list "$BACKUP_DIR/$BACKUP_NAME.backup" > /dev/null

# Create compressed archive
echo "📦 Creating compressed archive..."
gzip "$BACKUP_DIR/$BACKUP_NAME.backup"

# Calculate backup size
BACKUP_SIZE=$(du -h "$BACKUP_DIR/$BACKUP_NAME.backup.gz" | cut -f1)
echo "✅ Backup completed successfully: $BACKUP_SIZE"

# Clean up old backups
echo "🧹 Cleaning up backups older than $RETENTION_DAYS days..."
find "$BACKUP_DIR" -name "political_sphere_backup_*.backup.gz" -mtime +"$RETENTION_DAYS" -delete

# Log backup information
echo "$TIMESTAMP - Backup completed: $BACKUP_NAME.backup.gz ($BACKUP_SIZE)" >> "$BACKUP_DIR/backup.log"

# Optional: Upload to cloud storage (uncomment and configure as needed)
# echo "☁️  Uploading to cloud storage..."
# aws s3 cp "$BACKUP_DIR/$BACKUP_NAME.backup.gz" "s3://your-backup-bucket/$BACKUP_NAME.backup.gz"

echo "🎉 Backup process completed successfully!"