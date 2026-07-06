# Database Migrations

This directory contains versioned database migration scripts for the Rice Mill Express backend.

## Convention

- Each migration file is named with a timestamp prefix: `YYYYMMDD_HHMMSS_description.js`
- Migrations are applied in chronological order
- Each migration exports `up()` (apply) and `down()` (rollback) functions

## Usage

```bash
# Run all pending migrations
node migrations/runner.js up

# Rollback last migration
node migrations/runner.js down
```

## Creating a New Migration

1. Create a new file in this directory following the naming convention
2. Export `up` and `down` functions
3. Test locally before committing

## Example

```javascript
module.exports = {
  up: async (db) => {
    await db.collection('orders').createIndex({ user: 1, orderStatus: 1 });
  },
  down: async (db) => {
    await db.collection('orders').dropIndex('user_1_orderStatus_1');
  }
};
```
