const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const uri = process.env.MONGO_URI;

console.log('MONGO_URI:', process.env.MONGO_URI);
console.log('JWT_SECRET:', process.env.JWT_SECRET);
console.log('PORT:', process.env.PORT);

const authRoutes = require('./routes/auth');
const groupRoutes = require('./routes/groups');
const expenseRoutes = require('./routes/expenses');
const userRoutes = require('./routes/users');

const app = express();
const PORT = process.env.PORT || 3000;

/** ---------------------------
 *   CORS CONFIGURATION
 * --------------------------- */
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',')
  : [
      'http://localhost:8081',
      'http://localhost:19006',
      'https://split-billz.vercel.app',
      'https://split-billz-q4cq60r83-rna3s-projects.vercel.app/',
    ];

app.use(
  cors({
    origin: function (origin, callback) {
      // allow requests with no origin (like mobile apps or curl)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      } else {
        return callback(new Error('CORS not allowed for this origin: ' + origin), false);
      }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  })
);

// Handle preflight requests for all routes
app.options('*', cors());

app.use(express.json());

/** ---------------------------
 *   ROUTES
 * --------------------------- */
app.get('/', (req, res) => res.send('SplitBill API'));

app.get('/api/health', (req, res) => {
  console.log('Health check accessed');
  res.json({ status: 'ok', mongooseConnected: mongoose.connection.readyState });
});

app.use('/api/auth', authRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/users', userRoutes);

/** ---------------------------
 *   MONGODB CONNECTION
 * --------------------------- */
mongoose.connection.on('error', (err) => console.error('Mongoose error:', err));
mongoose.connection.on('disconnected', () => console.warn('Mongoose disconnected'));
mongoose.connection.on('connected', () => console.log('Mongoose connected'));

async function startServer() {
  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
    console.log('Connected to MongoDB Atlas!');
    app.listen(PORT, () => {
      console.log(
        `Server running on http://localhost:${PORT} in ${
          process.env.NODE_ENV || 'development'
        } mode`
      );
    });
  } catch (err) {
    console.error('Error connecting to MongoDB:', err.message);
    process.exit(1);
  }
}

startServer();

/** ---------------------------
 *   GRACEFUL SHUTDOWN
 * --------------------------- */
process.on('SIGINT', async () => {
  await mongoose.connection.close();
  console.log('MongoDB connection closed');
  process.exit(0);
});
