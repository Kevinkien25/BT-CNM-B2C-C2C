const express = require('express');
const cors = require('cors');
const proxy = require('express-http-proxy');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());

// Health check endpoint for API Gateway
app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy', service: 'API Gateway', message: 'All systems operational' });
});

// Proxy definitions
app.use('/api/auth', proxy('http://localhost:5001', {
  proxyReqPathResolver: (req) => {
    return '/api/auth' + req.url;
  }
}));

app.use('/api/shop', proxy('http://localhost:5002', {
  proxyReqPathResolver: (req) => {
    return '/api/shop' + req.url;
  }
}));

app.use('/api/products', proxy('http://localhost:5002', {
  proxyReqPathResolver: (req) => {
    return '/api/products' + req.url;
  }
}));

app.use('/api/orders', proxy('http://localhost:5003', {
  proxyReqPathResolver: (req) => {
    return '/api/orders' + req.url;
  }
}));

app.use('/api/chatbot', proxy('http://localhost:5004', {
  proxyReqPathResolver: (req) => {
    return '/api/chatbot' + req.url;
  }
}));

app.use('/api/analytics', proxy('http://localhost:5004', {
  proxyReqPathResolver: (req) => {
    return '/api/analytics' + req.url;
  }
}));

app.listen(PORT, () => {
  console.log(`==================================================`);
  console.log(`  API Gateway is running on port ${PORT}`);
  console.log(`  Routing traffic to ports 5001, 5002, 5003, 5004`);
  console.log(`==================================================`);
});
