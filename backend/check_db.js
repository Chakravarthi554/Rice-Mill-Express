const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
dotenv.config();

async function check() {
  const users = ['riceMillUser', 'Chakravarthi554', 'chakravarthi554', 'udumularahul'];
  const passwords = ['63004538@Ab', 'Chakri333@', 'Chakri12345@'];

  for (const user of users) {
    for (const pwd of passwords) {
      try {
        const uri = `mongodb+srv://${user}:${encodeURIComponent(pwd)}@cluster0.m05jbda.mongodb.net/riceMillDB?retryWrites=true&w=majority`;
        console.log(`Trying ${user}:${pwd}`);
        await mongoose.connect(uri, { serverSelectionTimeoutMS: 3000 });
        console.log(`✅ Connected successfully with ${user}:${pwd}`);
        await mongoose.disconnect();
        return;
      } catch (error) {
        console.error(`❌ Failed for ${user}:`, error.message);
      }
    }
  }
}
check();
