#!/bin/bash
# Daily database backup script

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/path/to/backups"
DB_NAME="rhymebox"

# Backup database
pg_dump $DATABASE_URL > "$BACKUP_DIR/rhymebox_$DATE.sql"

# Keep only last 7 days of backups
find $BACKUP_DIR -name "rhymebox_*.sql" -mtime +7 -delete

echo "Backup completed: rhymebox_$DATE.sql"
