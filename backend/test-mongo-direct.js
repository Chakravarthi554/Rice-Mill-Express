const mongoose = require('mongoose');

const uri = "mongodb://riceMillUser:OUq9zDRY1q6u2BBX@ac-vlmyvm6-shard-00-00.m05jbda.mongodb.net:27017,ac-vlmyvm6-shard-00-01.m05jbda.mongodb.net:27017,ac-vlmyvm6-shard-00-02.m05jbda.mongodb.net:27017/riceMillDB?ssl=true&replicaSet=atlas-vlmyvm-shard-0&authSource=admin&retryWrites=true&w=majority";

mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 })
  .then(() => {
    console.log("SUCCESS: Connected to MongoDB Atlas directly");
    process.exit(0);
  })
  .catch((err) => {
    console.error("ERROR:", err.message);
    process.exit(1);
  });
