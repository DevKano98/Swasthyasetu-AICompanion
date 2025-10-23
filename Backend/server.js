require('dotenv').config();
const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const sessionRoutes = require('./routes/session');
const chatRoutes = require('./routes/chat');
const moodRoutes = require('./routes/mood');
const authenticateToken = require('./middleware/auth');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api', authRoutes);
app.use('/api/session', authenticateToken, sessionRoutes);
app.use('/api', authenticateToken, chatRoutes);
// Protect mood routes and avoid duplicate mounts
app.use('/api', authenticateToken, moodRoutes);
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));