const mongoose = require('mongoose');
const dotenv = require('dotenv');
path = require('path');

// Load env vars
dotenv.config({ path: path.join(__dirname, '../.env') });

const fixIndexes = async () => {
    try {
        console.log('🔄 Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB');

        const db = mongoose.connection.db;
        const collection = db.collection('users');

        console.log('🔍 Checking indexes for "users" collection...');
        const indexes = await collection.indexes();
        console.log('Current indexes:', indexes.map(i => i.name));

        // Drop phone index if it exists
        if (indexes.find(i => i.name === 'phone_1')) {
            console.log('🗑️ Dropping index: phone_1');
            await collection.dropIndex('phone_1');
            console.log('✅ Index phone_1 dropped');
        }

        // Drop email index if it exists (to ensure it's also sparse if needed)
        if (indexes.find(i => i.name === 'email_1')) {
            console.log('🗑️ Dropping index: email_1');
            await collection.dropIndex('email_1');
            console.log('✅ Index email_1 dropped');
        }

        console.log('\n🚀 Done! Indexes have been cleared.');
        console.log('💡 Mongoose will recreate them correctly with "sparse: true" when you restart the server.');
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Error fixing indexes:', error);
        process.exit(1);
    }
};

fixIndexes();
