class Sentiment {
  static async create({ message_id, sentiment_score, sentiment_label }) {
    const text = `
      INSERT INTO chat_sentiments(message_id, sentiment_score, sentiment_label)
      VALUES($1, $2, $3) RETURNING *
    `;
    const { rows } = await require('../config/db').query(text, [message_id, sentiment_score, sentiment_label]);
    return rows[0];
  }

  static async getForMessages(messageIds) {
    const placeholders = messageIds.map((_, i) => `$${i + 1}`).join(',');
    const { rows } = await require('../config/db').query(
      `SELECT * FROM chat_sentiments WHERE message_id IN (${placeholders})`,
      messageIds
    );
    return rows;
  }
}

module.exports = Sentiment;