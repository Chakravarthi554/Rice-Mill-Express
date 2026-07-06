/**
 * Database Migration Runner
 * 
 * Usage:
 *   node migrations/runner.js up    - Run all pending migrations
 *   node migrations/runner.js down  - Rollback the last migration
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// Schema to track applied migrations
const migrationSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  appliedAt: { type: Date, default: Date.now },
});

const Migration = mongoose.model('Migration', migrationSchema);

async function getMigrationFiles() {
  const files = fs.readdirSync(__dirname)
    .filter(f => f.endsWith('.js') && f !== 'runner.js')
    .sort();
  return files;
}

async function up() {
  const files = await getMigrationFiles();
  const applied = await Migration.find({}).lean();
  const appliedNames = new Set(applied.map(m => m.name));

  const pending = files.filter(f => !appliedNames.has(f));

  if (pending.length === 0) {
    console.log('✅ No pending migrations.');
    return;
  }

  for (const file of pending) {
    console.log(`⬆️  Running migration: ${file}`);
    const migration = require(path.join(__dirname, file));
    await migration.up(mongoose.connection.db);
    await Migration.create({ name: file });
    console.log(`✅ Applied: ${file}`);
  }
}

async function down() {
  const lastApplied = await Migration.findOne({}).sort({ appliedAt: -1 }).lean();

  if (!lastApplied) {
    console.log('✅ No migrations to rollback.');
    return;
  }

  const file = lastApplied.name;
  console.log(`⬇️  Rolling back: ${file}`);
  const migration = require(path.join(__dirname, file));
  await migration.down(mongoose.connection.db);
  await Migration.deleteOne({ name: file });
  console.log(`✅ Rolled back: ${file}`);
}

async function main() {
  const command = process.argv[2];

  if (!['up', 'down'].includes(command)) {
    console.log('Usage: node migrations/runner.js [up|down]');
    process.exit(1);
  }

  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('📦 Connected to MongoDB');

    if (command === 'up') await up();
    if (command === 'down') await down();
  } catch (err) {
    console.error('❌ Migration error:', err.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

main();
