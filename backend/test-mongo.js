const mongoose = require('mongoose');

const uri = "mongodb+srv://riceMillUser:OUq9zDRY1q6u2BBX@cluster0.m05jbda.mongodb.net/riceMillDB?retryWrites=true&w=majority&appName=Cluster0";

mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 })
  .then(() => {
    console.log("SUCCESS: Connected to MongoDB Atlas");
    process.exit(0);
  })
  .catch((err) => {
    console.error("ERROR:", err.message);
    process.exit(1);
  });
