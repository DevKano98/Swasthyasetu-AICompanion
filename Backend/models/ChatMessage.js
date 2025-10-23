class ChatMessage {
  static async create({ user_id, sender_type, message, session_active = true }) {
    const text = `
      INSERT INTO chat_messages(user_id, sender_type, message, session_active)
      VALUES($1, $2, $3, $4) RETURNING *
    `;
    const { rows } = await require('../config/db').query(text, [user_id, sender_type, message, session_active]);
    return rows[0];
  }

  static async endSession(user_id) {
    const text = 'UPDATE chat_messages SET session_active = false WHERE user_id = $1 AND session_active = true';
    await require('../config/db').query(text, [user_id]);
  }

  static async getActiveMessages(user_id) {
    const { rows } = await require('../config/db').query(
      'SELECT * FROM chat_messages WHERE user_id = $1 AND session_active = true ORDER BY created_at ASC',
      [user_id]
    );
    return rows;
  }

  static async getMessagesBySession(user_id, active = false) {
    const { rows } = await require('../config/db').query(
      'SELECT * FROM chat_messages WHERE user_id = $1 AND session_active = $2 ORDER BY created_at ASC',
      [user_id, active]
    );
    return rows;
  }
}

module.exports = ChatMessage;