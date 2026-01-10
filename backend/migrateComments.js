// Database Migration Script - Run this once to migrate old comments to new format
// Usage: node migrateComments.js

const mongoose = require('mongoose');
const Recipe = require('./models/Recipe');
require('dotenv').config();

const migrateComments = async () => {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        // Find all recipes with comments
        const recipes = await Recipe.find({ 'comments.0': { $exists: true } });
        console.log(`Found ${recipes.length} recipes with comments`);

        let migratedCount = 0;
        let totalComments = 0;

        for (const recipe of recipes) {
            let needsSave = false;

            recipe.comments.forEach(comment => {
                totalComments++;

                // Migrate old 'comment' field to new 'text' field
                if (comment.comment && !comment.text) {
                    comment.text = comment.comment;
                    needsSave = true;
                    migratedCount++;
                }

                // Ensure at least one field exists
                if (!comment.text && !comment.comment) {
                    comment.text = '';
                    needsSave = true;
                }
            });

            if (needsSave) {
                await recipe.save();
                console.log(`Migrated comments for recipe: ${recipe.title}`);
            }
        }

        console.log('\n=== Migration Complete ===');
        console.log(`Total recipes processed: ${recipes.length}`);
        console.log(`Total comments found: ${totalComments}`);
        console.log(`Comments migrated: ${migratedCount}`);

        await mongoose.connection.close();
        console.log('Database connection closed');

    } catch (error) {
        console.error('Migration error:', error);
        process.exit(1);
    }
};

// Run migration
migrateComments();
