// Root hook file loaded via --file (Mocha globals like before/after are available here)
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongoServer;

before(async function() {
  process.env.MONGOMS_STARTUP_TIMEOUT = '60000'; // Increase timeout to 60s
  
  // Give mongodb-memory-server some time to download/spin up
  this.timeout(60000);
  
  if (mongoose.connection.readyState === 0) {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);
  }
});

after(async function() {
  this.timeout(15000);
  
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  if (mongoServer) {
    await mongoServer.stop();
  }
});
