const express = require('express');
const cors = require('cors');

const app = express();

// Middlewares cơ bản
app.use(cors());
app.use(express.json());

// Route kiểm tra sức khỏe server (Health Check)
app.get('/', (req, res) => {
  res.status(200).json({ message: 'SESS Backend API is running smoothly!' });
});

module.exports = app;