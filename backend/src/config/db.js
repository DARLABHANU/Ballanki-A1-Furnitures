const mongoose = require('mongoose');

async function connectDB() {
  if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI is required');
  if (process.env.MONGODB_DNS_SERVERS) {
    require('dns').setServers(process.env.MONGODB_DNS_SERVERS.split(',').map(value => value.trim()).filter(Boolean));
  }
  // Select the application database explicitly instead of inheriting an old URI database name.
  const dbName = (process.env.MONGODB_DB_NAME || 'ballanki').trim();
  if (!dbName) throw new Error('MONGODB_DB_NAME must not be empty');
  await mongoose.connect(process.env.MONGODB_URI, { dbName, serverSelectionTimeoutMS: 10000 });
  return mongoose.connection;
}

module.exports = connectDB;