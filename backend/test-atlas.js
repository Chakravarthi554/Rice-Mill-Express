const mongoose = require("mongoose");

mongoose.connect(
    "mongodb+srv://riceMillUser:63004538%40Ab@cluster0.m05jbda.mongodb.net/riceMillDB?retryWrites=true&w=majority&appName=Cluster0"
)
    .then(() => {
        console.log("CONNECTED");
        process.exit(0);
    })
    .catch(err => {
        console.log("ERROR:");
        console.dir(err, { depth: null });
        process.exit(1);
    });