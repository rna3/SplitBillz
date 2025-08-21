const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();
const uri = process.env.MONGO_URI;

//Debuggin Atlas connection
console.log('MONGO_URI:', process.env.MONGO_URI); // Add this
console.log('JWT_SECRET:', process.env.JWT_SECRET);
console.log('PORT:', process.env.PORT);

const authRoutes = require('./routes/auth');
const groupRoutes = require('./routes/groups');
const expenseRoutes = require('./routes/expenses');
const userRoutes = require('./routes/users');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({ origin: 'http://localhost:19006' }));
app.use(express.json());

// Routes
app.get('/', (req, res) => res.send('SplitBill API'));
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));
app.use('/api/auth', authRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/users', userRoutes);

// MongoDB Atlas connection
mongoose.connection.on('error', err => console.error('Mongoose error:', err));
mongoose.connection.on('disconnected', () => console.warn('Mongoose disconnected'));

async function startServer() {
  try {
    await mongoose.connect(uri);
    console.log('Connected to MongoDB Atlas!');
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
    });
  } catch (err) {
    console.error('Error connecting to MongoDB:', err.message);
    process.exit(1);
  }
}

startServer();

// Graceful shutdown
process.on('SIGINT', async () => {
  await mongoose.connection.close();
  console.log('MongoDB connection closed');
  process.exit(0);
});
