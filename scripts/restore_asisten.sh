#!/bin/bash
# =============================================================================
# ASISTEN Restore Script - Disaster Recovery
# =============================================================================
#
# Usage:
#   ./restore_asisten.sh <BACKUP_FILE> [TARGET_SCHEMA]
#
# Arguments:
#   BACKUP_FILE:    Path to backup file (.sql.gz)
#   TARGET_SCHEMA:  Schema to restore to (default: asisten_restore)
#
# Environment Variables:
#   PGHOST, PGPORT, PGDATABASE, PGUSER, PGPASSWORD
#
# IMPORTANT: This script restores to a SEPARATE schema by default
#            to prevent accidental data loss. Manual promotion required.
#
# =============================================================================

set -euo pipefail

# Configuration
BACKUP_FILE="${1:-}"
TARGET_SCHEMA="${2:-asisten_restore}"

# Database connection
DB_HOST="${PGHOST:-localhost}"
DB_PORT="${PGPORT:-5432}"
DB_NAME="${PGDATABASE:-asisten}"
DB_USER="${PGUSER:-asisten}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

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

# Usage help
usage() {
    echo "Usage: $0 <BACKUP_FILE> [TARGET_SCHEMA]"
    echo ""
    echo "Arguments:"
    echo "  BACKUP_FILE    Path to backup file (.sql.gz)"
    echo "  TARGET_SCHEMA  Schema to restore to (default: asisten_restore)"
    echo ""
    echo "Example:"
    echo "  $0 /var/backups/asisten/2025/asisten_full_2025_20250115_120000.sql.gz"
    echo "  $0 /var/backups/asisten/2025/asisten_full_2025_20250115_120000.sql.gz asisten_test"
    exit 1
}

# Verify backup file
verify_backup() {
    log_info "Verifying backup file..."

    if [ ! -f "$BACKUP_FILE" ]; then
        log_error "Backup file not found: $BACKUP_FILE"
        exit 1
    fi

    # Check if manifest exists
    local manifest_file="${BACKUP_FILE%.sql.gz}.manifest"
    if [ -f "$manifest_file" ]; then
        log_info "Found manifest file: $manifest_file"

        # Verify hash
        local expected_hash=$(grep -o '"backup_hash": "[^"]*"' "$manifest_file" | cut -d'"' -f4)
        local actual_hash=$(sha256sum "$BACKUP_FILE" | cut -d' ' -f1)

        if [ "$expected_hash" = "$actual_hash" ]; then
            log_info "Hash verification: PASSED"
        else
            log_error "Hash verification: FAILED"
            log_error "Expected: $expected_hash"
            log_error "Actual:   $actual_hash"
            read -p "Continue anyway? (y/N) " -n 1 -r
            echo
            if [[ ! $REPLY =~ ^[Yy]$ ]]; then
                exit 1
            fi
        fi
    else
        log_warn "Manifest file not found - skipping hash verification"
    fi
}

# Prepare target schema
prepare_schema() {
    log_info "Preparing target schema: ${TARGET_SCHEMA}..."

    # Check if target schema exists
    local schema_exists=$(psql -h "$DB_HOST" -p "$DB_PORT" -d "$DB_NAME" -U "$DB_USER" -t -A -c "
        SELECT EXISTS(SELECT 1 FROM information_schema.schemata WHERE schema_name = '${TARGET_SCHEMA}');
    ")

    if [ "$schema_exists" = "t" ]; then
        log_warn "Schema '${TARGET_SCHEMA}' already exists!"

        if [ "$TARGET_SCHEMA" = "asisten" ]; then
            log_error "DANGER: Refusing to overwrite production schema 'asisten'"
            log_error "Use a different target schema or manually handle this"
            exit 1
        fi

        read -p "Drop existing schema '${TARGET_SCHEMA}'? (y/N) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            log_info "Dropping existing schema..."
            psql -h "$DB_HOST" -p "$DB_PORT" -d "$DB_NAME" -U "$DB_USER" -c "
                DROP SCHEMA IF EXISTS \"${TARGET_SCHEMA}\" CASCADE;
            "
        else
            log_error "Restore aborted"
            exit 1
        fi
    fi

    # Create target schema
    log_info "Creating schema '${TARGET_SCHEMA}'..."
    psql -h "$DB_HOST" -p "$DB_PORT" -d "$DB_NAME" -U "$DB_USER" -c "
        CREATE SCHEMA IF NOT EXISTS \"${TARGET_SCHEMA}\";
    "
}

# Perform restore
perform_restore() {
    log_info "Starting restore to schema '${TARGET_SCHEMA}'..."

    # Create temporary file with schema replacement
    local temp_file="/tmp/asisten_restore_$$.sql"

    log_info "Extracting and transforming backup..."
    gunzip -c "$BACKUP_FILE" | \
        sed "s/\"asisten\"\./\"${TARGET_SCHEMA}\"./g" | \
        sed "s/SET search_path = asisten/SET search_path = ${TARGET_SCHEMA}/g" > "$temp_file"

    log_info "Restoring data..."
    psql -h "$DB_HOST" -p "$DB_PORT" -d "$DB_NAME" -U "$DB_USER" \
        -v ON_ERROR_STOP=1 \
        -f "$temp_file" \
        2>&1 | tee "/tmp/asisten_restore_$$.log"

    # Clean up
    rm -f "$temp_file"

    log_info "Restore completed!"
}

# Verify restore
verify_restore() {
    log_info "Verifying restore..."

    # Count tables
    local table_count=$(psql -h "$DB_HOST" -p "$DB_PORT" -d "$DB_NAME" -U "$DB_USER" -t -A -c "
        SELECT COUNT(*) FROM information_schema.tables
        WHERE table_schema = '${TARGET_SCHEMA}';
    ")

    # Count records in key tables
    local paket_count=$(psql -h "$DB_HOST" -p "$DB_PORT" -d "$DB_NAME" -U "$DB_USER" -t -A -c "
        SELECT COUNT(*) FROM \"${TARGET_SCHEMA}\".paket WHERE is_deleted = FALSE;
    " 2>/dev/null || echo "0")

    local doc_count=$(psql -h "$DB_HOST" -p "$DB_PORT" -d "$DB_NAME" -U "$DB_USER" -t -A -c "
        SELECT COUNT(*) FROM \"${TARGET_SCHEMA}\".dokumen_versi WHERE is_deleted = FALSE;
    " 2>/dev/null || echo "0")

    log_info "Restore verification:"
    log_info "  Tables restored: ${table_count}"
    log_info "  Paket records:   ${paket_count}"
    log_info "  Document versions: ${doc_count}"
}

# Promote restored schema (optional)
promote_schema() {
    if [ "$TARGET_SCHEMA" = "asisten" ]; then
        log_info "Already restored to production schema"
        return
    fi

    echo ""
    log_warn "The data has been restored to schema '${TARGET_SCHEMA}'"
    log_warn "To promote this to production, you would need to:"
    echo ""
    echo "  1. Backup current production schema:"
    echo "     ALTER SCHEMA asisten RENAME TO asisten_backup_\$(date +%Y%m%d);"
    echo ""
    echo "  2. Promote restored schema:"
    echo "     ALTER SCHEMA ${TARGET_SCHEMA} RENAME TO asisten;"
    echo ""
    echo "  3. Verify application connectivity"
    echo ""
    log_warn "This requires manual intervention for safety!"
}

# Main execution
main() {
    log_info "============================================="
    log_info "ASISTEN Restore Script"
    log_info "============================================="

    # Check arguments
    if [ -z "$BACKUP_FILE" ]; then
        usage
    fi

    log_info "Backup File:   ${BACKUP_FILE}"
    log_info "Target Schema: ${TARGET_SCHEMA}"
    log_info "============================================="

    # Safety check for production schema
    if [ "$TARGET_SCHEMA" = "asisten" ]; then
        log_warn "WARNING: You are about to restore directly to production schema!"
        read -p "Are you absolutely sure? Type 'yes' to continue: " confirm
        if [ "$confirm" != "yes" ]; then
            log_error "Restore aborted"
            exit 1
        fi
    fi

    verify_backup
    prepare_schema
    perform_restore
    verify_restore
    promote_schema

    log_info "============================================="
    log_info "Restore process completed!"
    log_info "============================================="
}

# Run main function
main
