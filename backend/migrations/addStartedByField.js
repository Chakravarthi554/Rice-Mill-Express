/**
 * Database Migration Script
 * 
 * Purpose: Add 'startedBy' field to existing Conversation documents
 * 
 * This migration is REQUIRED before deploying the chat system fixes.
 * It ensures all existing conversations have a 'startedBy' field,
 * which is now mandatory in the Conversation schema.
 * 
 * Run this ONCE before starting the server with new chat code.
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Conversation = require('../models/Conversation');
const User = require('../models/User');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB Connected for migration');
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    process.exit(1);
  }
};

const migrateConversations = async () => {
  console.log('\n🔄 Starting Conversation Migration...\n');

  try {
    // Find all conversations without startedBy field
    const conversations = await Conversation.find({
      startedBy: { $exists: false }
    }).populate('participants', 'role name email');

    console.log(`📊 Found ${conversations.length} conversations to migrate\n`);

    if (conversations.length === 0) {
      console.log('✅ No conversations need migration. All done!\n');
      return;
    }

    let successCount = 0;
    let errorCount = 0;
    const errors = [];

    for (const conv of conversations) {
      try {
        // Strategy: Set startedBy to the admin participant if one exists,
        // otherwise set to the first participant
        const admin = conv.participants.find(p => p.role === 'admin');

        if (admin) {
          conv.startedBy = admin._id;
          console.log(`✅ Setting startedBy to admin: ${admin.name} (${admin.email})`);
        } else {
          // No admin found - this is unusual but we'll set to first participant
          conv.startedBy = conv.participants[0]._id;
          console.warn(`⚠️  No admin in conversation ${conv._id}, setting startedBy to: ${conv.participants[0].name}`);
        }

        await conv.save();
        successCount++;

      } catch (error) {
        errorCount++;
        const errorMsg = `Failed to migrate conversation ${conv._id}: ${error.message}`;
        console.error(`❌ ${errorMsg}`);
        errors.push(errorMsg);
      }
    }

    console.log('\n📈 Migration Summary:');
    console.log(`   ✅ Successfully migrated: ${successCount}`);
    console.log(`   ❌ Failed: ${errorCount}`);

    if (errors.length > 0) {
      console.log('\n⚠️  Errors encountered:');
      errors.forEach(err => console.log(`   - ${err}`));
    }

    console.log('\n✨ Migration complete!\n');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
};

const verifyMigration = async () => {
  console.log('🔍 Verifying migration...\n');

  try {
    const conversationsWithoutStartedBy = await Conversation.countDocuments({
      startedBy: { $exists: false }
    });

    const totalConversations = await Conversation.countDocuments();

    console.log(`📊 Total conversations: ${totalConversations}`);
    console.log(`📊 Conversations without startedBy: ${conversationsWithoutStartedBy}`);

    if (conversationsWithoutStartedBy === 0) {
      console.log('\n✅ Verification passed! All conversations have startedBy field.\n');
      return true;
    } else {
      console.log('\n⚠️  Verification failed! Some conversations still missing startedBy field.\n');
      return false;
    }
  } catch (error) {
    console.error('❌ Verification failed:', error.message);
    return false;
  }
};

const main = async () => {
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║     Conversation Schema Migration Script              ║');
  console.log('║     Adding "startedBy" field to existing data         ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');

  await connectDB();

  await migrateConversations();

  const verificationPassed = await verifyMigration();

  await mongoose.disconnect();
  console.log('🔌 MongoDB disconnected\n');

  if (verificationPassed) {
    console.log('✅ Migration successful! You can now start the server.\n');
    process.exit(0);
  } else {
    console.log('❌ Migration incomplete. Please review errors and try again.\n');
    process.exit(1);
  }
};

// Run migration
main();
