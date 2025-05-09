const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config();

const app = express();

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'https://uk-hikers-fr.vercel.app'], // Add your frontend domains here
  credentials: true
}));
app.use(express.json());

// Routes
const trekRoutes = require('./routes/treks');
const authRoutes = require('./routes/auth'); // <-- NEW

// Root route - basic health check
app.get('/', (req, res) => {
  res.status(200).send('🚀 UkHiker backend is live and connected!');
});

// Mount Routes
app.use('/api/treks', trekRoutes);
app.use('/api/auth', authRoutes); // <-- NEW

// Global error handler
app.use((err, req, res, next) => {
  console.error('🔥 Error:', err.stack);
  res.status(500).json({
    success: false,
    message: 'An unexpected error occurred',
    error: process.env.NODE_ENV === 'development' ? err.message : {}
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `❌ Cannot find ${req.originalUrl} on this server`
  });
});

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('✅ MongoDB connected'))
.catch(err => console.error('❌ MongoDB connection error:', err));

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
