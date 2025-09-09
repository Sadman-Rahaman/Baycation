// backend/server.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

// Import routes
const userRoutes = require('./routes/userRoutes');
const tripRoutes = require('./routes/tripRoutes');
const travelerRoutes = require('./routes/travelerRoutes');
const storyRoutes = require('./routes/storyRoutes');
const gearRoutes = require('./routes/gearRoutes');
const guideVerificationRoutes = require('./routes/guideVerificationRoutes');
const chatRoutes = require('./routes/chatRoutes');
const adminRoutes = require('./routes/adminRoutes');

// Import socket handler
const setupSocket = require('./socket/socketHandler');

// Load environment variables
dotenv.config();

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5002;

// Setup Socket.IO with CORS
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Setup socket handlers
setupSocket(io);

// Make io accessible in routes
app.set('io', io);

// Middleware
app.use(cors({
  origin: "http://localhost:3000",
  credentials: true
}));
app.use(express.json({ limit: '50mb' })); // Increase limit for base64
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/users', userRoutes);
app.use('/api/trips', tripRoutes);
app.use('/api/travelers', travelerRoutes);
app.use('/api/stories', storyRoutes);
app.use('/api/gear', gearRoutes);
app.use('/api/guide-verification', guideVerificationRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/admin', adminRoutes);

// Test route
app.get('/', (req, res) => {
  res.json({ message: 'Baycation API is running on port ' + PORT + '!' });
});

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/baycation')
  .then(() => {
    console.log('Connected to MongoDB');
    server.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
      console.log(`Socket.IO enabled for real-time collaboration`);
    });
  })
  .catch((error) => {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  });
