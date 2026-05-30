const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const db = require('./db');
const seed = require('./seed');

const authRoutes = require('./routes/auth');
const shopRoutes = require('./routes/shop');
const productRoutes = require('./routes/products');
const orderRoutes = require('./routes/orders');
const adminRoutes = require('./routes/admin');

const app = express();
const PORT = process.env.PORT || 5000;

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

// Enable CORS for frontend client
app.use(cors({
  origin: '*', // For development, allow all origins
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
// Serve uploads folder as static route
app.use('/uploads', express.static(uploadsDir));

// Base check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy', message: 'C2C B2C E-commerce API is active' });
});

// Register Routes
app.use('/api/auth', authRoutes);
app.use('/api/shop', shopRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/admin', adminRoutes);

// Database initialization and server boot
async function startServer() {
  console.log("Initializing database connection...");
  await db.initDB();
  
  console.log("Checking database seeds...");
  await seed.seedData();

  app.listen(PORT, () => {
    console.log(`==================================================`);
    console.log(`  API Server is running on port ${PORT}`);
    console.log(`  Health Check: http://localhost:${PORT}/api/health`);
    console.log(`==================================================`);
  });
}

startServer();
