const express = require('express');
const db = require('../config/db');
const router = express.Router();

router.post('/start', async (req, res) => {
  try {
    const userId = req.user.id;
    // End any lingering active sessions
    await db.query('UPDATE sessions SET is_active=false, ended_at=NOW() WHERE user_id=$1 AND is_active=true', [userId]);
    const { rows } = await db.query('INSERT INTO sessions(user_id) VALUES($1) RETURNING *', [userId]);
    res.json({ session: rows[0] });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/end', async (req, res) => {
  try {
    const userId = req.user.id;
    await db.query('UPDATE sessions SET is_active=false, ended_at=NOW() WHERE user_id=$1 AND is_active=true', [userId]);
    res.json({ message: 'Session ended' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/stats', async (req, res) => {
  try {
    const userId = req.user.id;

    // Sessions completed
    const sessionsCountRes = await db.query(
      'SELECT COUNT(*)::int AS count FROM sessions WHERE user_id=$1',
      [userId]
    );
    const sessionsCompleted = sessionsCountRes.rows[0]?.count || 0;

    // Total hours (sum of session durations)
    const totalSecsRes = await db.query(
      `SELECT COALESCE(SUM(EXTRACT(EPOCH FROM (COALESCE(ended_at, NOW()) - started_at))), 0) AS secs
       FROM sessions WHERE user_id=$1`,
      [userId]
    );
    const totalHours = Math.round((Number(totalSecsRes.rows[0]?.secs || 0) / 3600) * 10) / 10;

    // Mood improvement: compare last session avg vs previous 5 sentiments
    const lastSessionRes = await db.query(
      'SELECT id, started_at FROM sessions WHERE user_id=$1 ORDER BY started_at DESC LIMIT 1',
      [userId]
    );
    let moodImprovementPercent = null;
    if (lastSessionRes.rows[0]) {
      const lastSessionId = lastSessionRes.rows[0].id;

      const lastAvgRes = await db.query(
        `SELECT AVG(s.sentiment_score) AS avg
         FROM chat_sentiments s
         JOIN chat_messages m ON m.id = s.message_id
         WHERE m.user_id=$1 AND m.session_id=$2`,
        [userId, lastSessionId]
      );
      const lastAvg = Number(lastAvgRes.rows[0]?.avg);

      const preAvgRes = await db.query(
        `WITH pre AS (
           SELECT s.sentiment_score
           FROM chat_sentiments s
           JOIN chat_messages m ON m.id = s.message_id
           WHERE m.user_id=$1 AND m.session_id <> $2
           ORDER BY m.created_at DESC
           LIMIT 5
         )
         SELECT AVG(sentiment_score) AS avg FROM pre`,
        [userId, lastSessionId]
      );
      const preAvg = Number(preAvgRes.rows[0]?.avg);

      if (!Number.isNaN(lastAvg) && !Number.isNaN(preAvg) && preAvg !== 0) {
        moodImprovementPercent = Math.round(((lastAvg - preAvg) / Math.abs(preAvg)) * 100);
      } else if (!Number.isNaN(lastAvg) && Number.isNaN(preAvg)) {
        moodImprovementPercent = Math.round(lastAvg * 100);
      } else {
        moodImprovementPercent = 0;
      }
    }

    res.json({ sessionsCompleted, totalHours, moodImprovementPercent });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/reset', async (req, res) => {
  try {
    const userId = req.user.id; // Use req.user.id for authentication
    // Delete all sessions for the user
    await db.query('DELETE FROM sessions WHERE user_id=$1', [userId]);
    // Delete related chat messages
    await db.query('DELETE FROM chat_messages WHERE user_id=$1', [userId]);
    // Delete related chat sentiments
    await db.query('DELETE FROM chat_sentiments WHERE message_id IN (SELECT id FROM chat_messages WHERE user_id=$1)', [userId]);
    res.status(200).json({ message: 'Session data reset successfully' });
  } catch (e) {
    console.error('Error resetting sessions:', e);
    res.status(500).json({ error: 'Failed to reset session data' });
  }
});

module.exports = router;