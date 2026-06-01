const mongoose = require('mongoose');
require('dotenv').config();

let mongoAvailable = false;

async function initDB() {
  try {
    const mongoURI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/c2c_b2c_ecommerce';
    console.log("Connecting to MongoDB in Chatbot Service at", mongoURI);
    
    mongoose.set('strictQuery', false);
    await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 3000
    });
    
    mongoAvailable = true;
    console.log("Chatbot Service MongoDB connected successfully.");
  } catch (error) {
    console.warn("MongoDB is not available for Chatbot Service. Running in fallback mode (local memory).");
    mongoAvailable = false;
  }
}

module.exports = {
  initDB,
  isMongoAvailable: () => mongoAvailable
};
