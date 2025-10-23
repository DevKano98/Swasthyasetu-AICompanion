const bcrypt = require('bcryptjs');

class User {
  static async create({ username, email, password }) {
    const hash = await bcrypt.hash(password, 10);
    const text = 'INSERT INTO users(username, email, password_hash) VALUES($1, $2, $3) RETURNING *';
    const { rows } = await require('../config/db').query(text, [username, email, hash]);
    return rows[0];
  }

  static async findByEmail(email) {
    const { rows } = await require('../config/db').query('SELECT * FROM users WHERE email = $1', [email]);
    return rows[0];
  }

  static async verifyPassword(password, hash) {
    return await bcrypt.compare(password, hash);
  }
}

module.exports = User;