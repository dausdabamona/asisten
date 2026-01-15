#!/bin/bash
# =============================================================================
# ASISTEN Backup Script - Disaster Recovery & Compliance
# =============================================================================
#
# Usage:
#   ./backup_asisten.sh [BACKUP_TYPE] [TAHUN_ANGGARAN]
#
# Arguments:
#   BACKUP_TYPE:     FULL, INCREMENTAL, DIFFERENTIAL (default: FULL)
#   TAHUN_ANGGARAN:  Fiscal year to backup (default: current year)
#
# Environment Variables:
#   PGHOST, PGPORT, PGDATABASE, PGUSER, PGPASSWORD
#   BACKUP_DIR:      Base directory for backups (default: /var/backups/asisten)
#   ARCHIVE_DIR:     WORM archive directory (default: /archive/asisten)
#   RETENTION_DAYS:  Days to retain backups (default: 2555 ~7 years)
#
# =============================================================================

set -euo pipefail

# Configuration
BACKUP_TYPE="${1:-FULL}"
TAHUN_ANGGARAN="${2:-$(date +%Y)}"
BACKUP_DIR="${BACKUP_DIR:-/var/backups/asisten}"
ARCHIVE_DIR="${ARCHIVE_DIR:-/archive/asisten}"
RETENTION_DAYS="${RETENTION_DAYS:-2555}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_NAME="asisten_${BACKUP_TYPE,,}_${TAHUN_ANGGARAN}_${TIMESTAMP}"

# Database connection (use environment variables or defaults)
DB_HOST="${PGHOST:-localhost}"
DB_PORT="${PGPORT:-5432}"
DB_NAME="${PGDATABASE:-asisten}"
DB_USER="${PGUSER:-asisten}"
DB_SCHEMA="asisten"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${GREEN}[INFO]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1" >&2
}

# Create directories if they don't exist
setup_directories() {
    log_info "Setting up backup directories..."
    mkdir -p "${BACKUP_DIR}/${TAHUN_ANGGARAN}"
    mkdir -p "${ARCHIVE_DIR}/${TAHUN_ANGGARAN}"
    mkdir -p "${BACKUP_DIR}/logs"
}

# Register backup in catalog
register_backup_start() {
    log_info "Registering backup in catalog..."

    BACKUP_ID=$(psql -h "$DB_HOST" -p "$DB_PORT" -d "$DB_NAME" -U "$DB_USER" -t -A -c "
        INSERT INTO ${DB_SCHEMA}.backup_catalog (
            tahun_anggaran, backup_type, backup_name, backup_path,
            backup_hash, status, created_by
        ) VALUES (
            ${TAHUN_ANGGARAN},
            '${BACKUP_TYPE}'::${DB_SCHEMA}.\"BackupType\",
            '${BACKUP_NAME}',
            '${BACKUP_DIR}/${TAHUN_ANGGARAN}/${BACKUP_NAME}',
            'PENDING',
            'PENDING'::${DB_SCHEMA}.\"BackupStatus\",
            NULL
        ) RETURNING id;
    " 2>/dev/null || echo "")

    if [ -z "$BACKUP_ID" ]; then
        log_warn "Could not register backup in catalog (table may not exist yet)"
        BACKUP_ID="manual-$(uuidgen 2>/dev/null || echo $RANDOM)"
    fi

    echo "$BACKUP_ID"
}

# Update backup status in catalog
update_backup_status() {
    local status="$1"
    local hash="${2:-}"
    local size="${3:-}"
    local tables="${4:-}"
    local records="${5:-}"
    local docs="${6:-}"
    local error="${7:-}"

    psql -h "$DB_HOST" -p "$DB_PORT" -d "$DB_NAME" -U "$DB_USER" -q -c "
        UPDATE ${DB_SCHEMA}.backup_catalog
        SET status = '${status}'::${DB_SCHEMA}.\"BackupStatus\",
            backup_hash = COALESCE('${hash}', backup_hash),
            backup_size = COALESCE(${size:-NULL}, backup_size),
            table_count = COALESCE(${tables:-NULL}, table_count),
            record_count = COALESCE(${records:-NULL}, record_count),
            document_count = COALESCE(${docs:-NULL}, document_count),
            completed_at = CASE WHEN '${status}' IN ('COMPLETED', 'FAILED') THEN NOW() ELSE completed_at END,
            error_message = COALESCE('${error}', error_message),
            updated_at = NOW()
        WHERE id = '${BACKUP_ID}'::uuid;
    " 2>/dev/null || log_warn "Could not update backup status in catalog"
}

# Perform database dump
perform_backup() {
    log_info "Starting ${BACKUP_TYPE} backup for fiscal year ${TAHUN_ANGGARAN}..."

    local backup_file="${BACKUP_DIR}/${TAHUN_ANGGARAN}/${BACKUP_NAME}.sql.gz"
    local manifest_file="${BACKUP_DIR}/${TAHUN_ANGGARAN}/${BACKUP_NAME}.manifest"

    # Update status to IN_PROGRESS
    update_backup_status "IN_PROGRESS"

    # Build WHERE clause for fiscal year filtering
    local year_filter=""
    if [ "$BACKUP_TYPE" != "FULL" ]; then
        year_filter="--where=\"tahun_anggaran = ${TAHUN_ANGGARAN}\""
    fi

    # Count tables and records before backup
    local table_count=$(psql -h "$DB_HOST" -p "$DB_PORT" -d "$DB_NAME" -U "$DB_USER" -t -A -c "
        SELECT COUNT(*) FROM information_schema.tables
        WHERE table_schema = '${DB_SCHEMA}';
    " 2>/dev/null || echo "0")

    local record_count=$(psql -h "$DB_HOST" -p "$DB_PORT" -d "$DB_NAME" -U "$DB_USER" -t -A -c "
        SELECT COALESCE(SUM(n_live_tup), 0)::bigint
        FROM pg_stat_user_tables
        WHERE schemaname = '${DB_SCHEMA}';
    " 2>/dev/null || echo "0")

    local doc_count=$(psql -h "$DB_HOST" -p "$DB_PORT" -d "$DB_NAME" -U "$DB_USER" -t -A -c "
        SELECT COUNT(*) FROM ${DB_SCHEMA}.dokumen_versi WHERE is_deleted = FALSE;
    " 2>/dev/null || echo "0")

    log_info "Tables: ${table_count}, Records: ${record_count}, Documents: ${doc_count}"

    # Perform pg_dump
    log_info "Dumping schema ${DB_SCHEMA}..."
    pg_dump -h "$DB_HOST" -p "$DB_PORT" -d "$DB_NAME" -U "$DB_USER" \
        --schema="${DB_SCHEMA}" \
        --format=plain \
        --no-owner \
        --no-privileges \
        --verbose \
        2>"${BACKUP_DIR}/logs/${BACKUP_NAME}.log" | gzip > "$backup_file"

    if [ $? -ne 0 ]; then
        log_error "Backup failed!"
        update_backup_status "FAILED" "" "" "" "" "" "pg_dump failed"
        exit 1
    fi

    # Calculate hashes
    log_info "Calculating integrity hashes..."
    local backup_hash=$(sha256sum "$backup_file" | cut -d' ' -f1)
    local backup_size=$(stat -f%z "$backup_file" 2>/dev/null || stat -c%s "$backup_file")

    # Create manifest
    cat > "$manifest_file" <<EOF
{
    "backup_name": "${BACKUP_NAME}",
    "backup_type": "${BACKUP_TYPE}",
    "tahun_anggaran": ${TAHUN_ANGGARAN},
    "timestamp": "$(date -Iseconds)",
    "database": "${DB_NAME}",
    "schema": "${DB_SCHEMA}",
    "backup_file": "${backup_file}",
    "backup_size": ${backup_size},
    "backup_hash": "${backup_hash}",
    "table_count": ${table_count},
    "record_count": ${record_count},
    "document_count": ${doc_count},
    "retention_days": ${RETENTION_DAYS},
    "expires_at": "$(date -d "+${RETENTION_DAYS} days" -Iseconds 2>/dev/null || date -v+${RETENTION_DAYS}d -Iseconds)"
}
EOF

    local manifest_hash=$(sha256sum "$manifest_file" | cut -d' ' -f1)

    # Update catalog with completion info
    update_backup_status "COMPLETED" "$backup_hash" "$backup_size" "$table_count" "$record_count" "$doc_count"

    # Copy to archive (WORM)
    log_info "Copying to WORM archive..."
    cp "$backup_file" "${ARCHIVE_DIR}/${TAHUN_ANGGARAN}/"
    cp "$manifest_file" "${ARCHIVE_DIR}/${TAHUN_ANGGARAN}/"

    # Make archive files immutable (requires root or CAP_LINUX_IMMUTABLE)
    if [ "$(id -u)" = "0" ]; then
        chattr +i "${ARCHIVE_DIR}/${TAHUN_ANGGARAN}/${BACKUP_NAME}.sql.gz" 2>/dev/null || true
        chattr +i "${ARCHIVE_DIR}/${TAHUN_ANGGARAN}/${BACKUP_NAME}.manifest" 2>/dev/null || true
    fi

    log_info "Backup completed successfully!"
    log_info "  File: ${backup_file}"
    log_info "  Size: ${backup_size} bytes"
    log_info "  Hash: ${backup_hash}"
    log_info "  Manifest: ${manifest_file}"

    # Return backup info
    echo "${backup_file}|${backup_hash}|${backup_size}"
}

# Clean up old backups (respecting retention)
cleanup_old_backups() {
    log_info "Cleaning up backups older than ${RETENTION_DAYS} days..."

    find "${BACKUP_DIR}" -name "asisten_*.sql.gz" -type f -mtime +${RETENTION_DAYS} -delete 2>/dev/null || true
    find "${BACKUP_DIR}" -name "asisten_*.manifest" -type f -mtime +${RETENTION_DAYS} -delete 2>/dev/null || true
    find "${BACKUP_DIR}/logs" -name "asisten_*.log" -type f -mtime +30 -delete 2>/dev/null || true

    log_info "Cleanup completed"
}

# Main execution
main() {
    log_info "============================================="
    log_info "ASISTEN Backup Script"
    log_info "============================================="
    log_info "Backup Type: ${BACKUP_TYPE}"
    log_info "Fiscal Year: ${TAHUN_ANGGARAN}"
    log_info "Backup Dir:  ${BACKUP_DIR}"
    log_info "Archive Dir: ${ARCHIVE_DIR}"
    log_info "============================================="

    # Validate backup type
    case "$BACKUP_TYPE" in
        FULL|INCREMENTAL|DIFFERENTIAL)
            ;;
        *)
            log_error "Invalid backup type: ${BACKUP_TYPE}"
            log_error "Valid types: FULL, INCREMENTAL, DIFFERENTIAL"
            exit 1
            ;;
    esac

    setup_directories
    BACKUP_ID=$(register_backup_start)
    log_info "Backup ID: ${BACKUP_ID}"

    perform_backup
    cleanup_old_backups

    log_info "============================================="
    log_info "Backup process completed!"
    log_info "============================================="
}

# Run main function
main
