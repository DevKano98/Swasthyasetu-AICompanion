// routes/mood.js
const express = require('express');
const db = require('../config/db');
const router = express.Router();

router.get('/mood-trends/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;
    // Security check: ensure userId matches authenticated user
    if (userId !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // Get all sessions
    const sessionsRes = await db.query(
      'SELECT id, started_at, ended_at FROM sessions WHERE user_id=$1 ORDER BY started_at ASC',
      [userId]
    );

    const sessions = [];

    for (let session of sessionsRes.rows) {
      const sentimentsRes = await db.query(
        `SELECT s.sentiment_score, m.created_at
         FROM chat_sentiments s
         JOIN chat_messages m ON s.message_id = m.id
         WHERE m.session_id = $1 AND m.user_id = $2
         ORDER BY m.created_at ASC`,
        [session.id, userId]
      );

      const data = sentimentsRes.rows.map((r, idx) => ({
        index: idx + 1, // X-axis = message order
        score: Number(r.sentiment_score),
        timestamp: r.created_at.toISOString(),
      }));

      sessions.push({
        sessionId: session.id,
        startedAt: session.started_at.toISOString(),
        data,
      });
    }

    res.json({ sessions });
  } catch (e) {
    console.error('Error fetching mood trends:', e);
    res.status(500).json({ error: 'Failed to fetch mood trends' });
  }
});

module.exports = router;