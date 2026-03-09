require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { testConnection } = require('./db');
const authRoutes = require('./routes/auth');
const tweetsRoutes = require('./routes/tweets');
const usersRoutes = require('./routes/users');
const feedRoutes = require('./routes/feed');

const app = express();
app.use(cors());
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/tweets', tweetsRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/feed', feedRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'Server is running' });
});

app.get('/api/health', async (req, res) => {
  try {
    await testConnection();
    res.status(200).json({ status: 'ok', database: 'connected' });
  } catch (err) {
    res.status(500).json({ status: 'error', database: 'disconnected' });
  }
});

const PORT = process.env.PORT || 3000;
let server;

if (require.main === module) {
  server = app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
  });
} else {
  server = { close: (cb) => (cb ? cb() : undefined) };
}

module.exports = { app, server };
