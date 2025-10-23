const express = require('express');
const db = require('../config/db');
const { analyze } = require('../utils/sentiment');
const { getAIResponse } = require('../utils/gemini');
const router = express.Router();
const { synthesizeSpeech } = require('../utils/tts');

async function getOrCreateActiveSession(userId) {
  const { rows } = await db.query('SELECT * FROM sessions WHERE user_id=$1 AND is_active=true ORDER BY started_at DESC LIMIT 1', [userId]);
  if (rows[0]) return rows[0];
  const created = await db.query('INSERT INTO sessions(user_id) VALUES($1) RETURNING *', [userId]);
  return created.rows[0];
}

router.post('/talk', async (req, res) => {
  try {
    const userId = req.user.id;
    const { message } = req.body;
    const session = await getOrCreateActiveSession(userId);

    const userMsg = await db.query(
      'INSERT INTO chat_messages(user_id, session_id, sender_type, message) VALUES($1,$2,$3,$4) RETURNING *',
      [userId, session.id, 'user', message]
    );

    const { score, label } = analyze(message);
    await db.query(
      'INSERT INTO chat_sentiments(message_id, sentiment_score, sentiment_label) VALUES($1,$2,$3)',
      [userMsg.rows[0].id, score, label]
    );

    const history = await db.query(
      'SELECT sender_type, message FROM chat_messages WHERE session_id=$1 ORDER BY created_at ASC',
      [session.id]
    );

    const aiText = await getAIResponse(history.rows, message); // include latest prompt
    const aiMsg = await db.query(
      'INSERT INTO chat_messages(user_id, session_id, sender_type, message) VALUES($1,$2,$3,$4) RETURNING *',
      [userId, session.id, 'AI', aiText]
    );

// Optional TTS
let ttsBase64 = null;
if (req.query && req.query.tts === '1') {
  try {
    // Detect language from AI text (very simple heuristic)
    const isHindi = /[\u0900-\u097F]/.test(aiText);
    const lang = isHindi ? 'hi' : 'en';

    ttsBase64 = await synthesizeSpeech({ text: aiText, language: lang });
  } catch (error) {
    console.error('TTS failed, will use browser TTS:', error);
    ttsBase64 = null;
  }
}


    res.json({ aiResponse: aiMsg.rows[0].message, sentiment: { score, label }, tts: ttsBase64 ? { format: 'mp3', base64: ttsBase64 } : null });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;