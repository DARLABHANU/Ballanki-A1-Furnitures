const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const uri = process.env.MONGODB_URI;
    if (!uri) throw new Error("MONGODB_URI is undefined");

    console.log("Attempting to connect to MongoDB...");
    // The family: 4 option forces IPv4 to instantly prevent the dreaded 30-sec Mongoose timeout error on Windows.
    const conn = await mongoose.connect(uri, { family: 4 });
    console.log(`✅ MongoDB Successfully Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
