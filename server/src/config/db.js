const mongoose = require('mongoose');

let connected = false;

async function connectDB() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI missing');
  mongoose.set('strictQuery', true);
  await mongoose.connect(uri);
  connected = true;
  console.log('MongoDB connected');
}

function dbState() {
  return {
    connected,
    readyState: mongoose.connection.readyState
  };
}

module.exports = { connectDB, dbState };