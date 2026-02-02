# Database Migrations

This directory contains database migration scripts for the PPK Assistant application.

## Migration File Naming Convention

Migration files should follow this naming pattern:
```
{version}-{name}.js
```

Where:
- `{version}` is a 3-digit zero-padded number (e.g., `001`, `002`, `003`)
- `{name}` is a descriptive name using kebab-case

Examples:
- `001-initial-schema.js`
- `002-add-vendor-contract-payment-tables.js`
- `003-add-notification-system.js`

## Migration File Structure

Each migration file should export an object with the following structure:

```javascript
module.exports = {
  version: 1,  // Must match the version number in the filename
  name: 'migration-name',

  up(db) {
    // Code to apply the migration
    // `db` is a better-sqlite3 Database instance
  },

  down(db) {
    // Code to rollback the migration (optional but recommended)
  }
};
```

## How Migrations Work

1. On application startup, the database checks the `schema_migrations` table for the current version
2. The system compares the current version against `DB_VERSION` in `database.js`
3. If there are pending migrations, they are executed in order
4. Before each migration, an automatic backup is created
5. Each migration runs within a transaction for atomicity
6. After successful migration, the version is recorded in `schema_migrations`

## Creating a New Migration

1. Increment `DB_VERSION` in `database.js`
2. Create a new migration file with the next version number
3. Implement the `up()` function with your schema changes
4. Implement the `down()` function for rollback capability
5. Test the migration on a development database

## Best Practices

- **Always backup before migrations**: The system does this automatically
- **Use transactions**: Group related changes together
- **Test rollbacks**: Make sure `down()` properly reverses `up()`
- **Be careful with data migrations**: Consider data integrity
- **Don't modify existing migrations**: Create new migrations instead
- **Handle errors gracefully**: Log and re-throw errors for visibility

## Schema Version Tracking

The `schema_migrations` table tracks applied migrations:

```sql
CREATE TABLE schema_migrations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  version INTEGER NOT NULL UNIQUE,
  name TEXT NOT NULL,
  applied_at TEXT DEFAULT (datetime('now', 'localtime'))
);
```

## Example: Adding a New Table

```javascript
// 003-add-notifications.js
module.exports = {
  version: 3,
  name: 'add-notifications',

  up(db) {
    db.exec(`
      CREATE TABLE notifications (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        title TEXT NOT NULL,
        message TEXT,
        read INTEGER DEFAULT 0,
        created_at TEXT DEFAULT (datetime('now', 'localtime')),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );

      CREATE INDEX idx_notifications_user ON notifications(user_id);
      CREATE INDEX idx_notifications_read ON notifications(read);
    `);
  },

  down(db) {
    db.exec('DROP TABLE IF EXISTS notifications');
  }
};
```

## Backup History

All migrations create a backup before execution. These can be found in:
```
{userData}/database/backups/
```

Backups are named with the pattern:
```
ppk-backup-{timestamp}.db
```

The backup scheduler also runs daily at 2 AM and keeps backups for 30 days.
