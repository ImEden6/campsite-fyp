#!/bin/bash

# Database backup script for Campsite Management System
# Usage: ./backup.sh [backup_name]

set -e

# Configuration
DB_NAME="campsite_db"
DB_USER="campsite_user"
DB_HOST="localhost"
DB_PORT="5432"
BACKUP_DIR="./backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_NAME=${1:-"backup_${TIMESTAMP}"}

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Starting database backup...${NC}"

# Check if PostgreSQL is running
if ! pg_isready -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" > /dev/null 2>&1; then
    echo -e "${RED}Error: PostgreSQL is not running or not accessible${NC}"
    exit 1
fi

# Create backup
BACKUP_FILE="$BACKUP_DIR/${BACKUP_NAME}.sql"
echo -e "${YELLOW}Creating backup: $BACKUP_FILE${NC}"

if pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" --no-password --clean --create > "$BACKUP_FILE"; then
    echo -e "${GREEN}Backup created successfully: $BACKUP_FILE${NC}"
    
    # Compress backup
    if gzip "$BACKUP_FILE"; then
        echo -e "${GREEN}Backup compressed: ${BACKUP_FILE}.gz${NC}"
        BACKUP_FILE="${BACKUP_FILE}.gz"
    fi
    
    # Show backup size
    SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
    echo -e "${GREEN}Backup size: $SIZE${NC}"
    
    # Clean up old backups (keep last 10)
    echo -e "${YELLOW}Cleaning up old backups...${NC}"
    cd "$BACKUP_DIR"
    ls -t backup_*.sql.gz 2>/dev/null | tail -n +11 | xargs -r rm --
    echo -e "${GREEN}Cleanup completed${NC}"
    
else
    echo -e "${RED}Error: Backup failed${NC}"
    exit 1
fi

echo -e "${GREEN}Database backup completed successfully!${NC}"
