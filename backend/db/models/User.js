// backend/db/models/User.js
// SQLite User model with bcrypt hashing

const bcrypt = require('bcrypt');
const { getDb } = require('../database');

class User {
  /**
   * Create a new user
   */
  static async create({ username, password, isAdmin = false }) {
    const db = getDb();

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    try {
      const stmt = db.prepare(`
        INSERT INTO users (username, password_hash, is_admin)
        VALUES (?, ?, ?)
      `);

      const result = stmt.run(username, password_hash, isAdmin ? 1 : 0);

      return {
        id: result.lastInsertRowid,
        username,
        isAdmin,
        createdAt: new Date()
      };
    } catch (error) {
      if (error.message.includes('UNIQUE constraint failed')) {
        throw new Error('Username already exists');
      }
      throw error;
    }
  }

  /**
   * Find user by username
   */
  static findByUsername(username) {
    const db = getDb();
    const stmt = db.prepare(`
      SELECT id, username, password_hash, is_admin as isAdmin,
             created_at as createdAt, updated_at as updatedAt
      FROM users
      WHERE username = ?
    `);

    return stmt.get(username);
  }

  /**
   * Find user by ID
   */
  static findById(id) {
    const db = getDb();
    const stmt = db.prepare(`
      SELECT id, username, password_hash, is_admin as isAdmin,
             created_at as createdAt, updated_at as updatedAt
      FROM users
      WHERE id = ?
    `);

    return stmt.get(id);
  }

  /**
   * Find all users
   */
  static findAll() {
    const db = getDb();
    const stmt = db.prepare(`
      SELECT id, username, is_admin as isAdmin,
             created_at as createdAt, updated_at as updatedAt
      FROM users
      ORDER BY created_at DESC
    `);

    return stmt.all();
  }

  /**
   * Compare password
   */
  static async comparePassword(candidatePassword, hash) {
    return bcrypt.compare(candidatePassword, hash);
  }

  /**
   * Update user
   */
  static async update(id, updates) {
    const db = getDb();
    const allowedFields = ['username', 'password', 'isAdmin'];
    const fields = [];
    const values = [];

    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key)) {
        if (key === 'password') {
          const salt = await bcrypt.genSalt(10);
          const password_hash = await bcrypt.hash(value, salt);
          fields.push('password_hash = ?');
          values.push(password_hash);
        } else if (key === 'isAdmin') {
          fields.push('is_admin = ?');
          values.push(value ? 1 : 0);
        } else {
          fields.push(`${key} = ?`);
          values.push(value);
        }
      }
    }

    if (fields.length === 0) {
      return null;
    }

    fields.push('updated_at = datetime("now")');
    values.push(id);

    const stmt = db.prepare(`
      UPDATE users
      SET ${fields.join(', ')}
      WHERE id = ?
    `);

    stmt.run(...values);
    return this.findById(id);
  }

  /**
   * Delete user
   */
  static delete(id) {
    const db = getDb();
    const stmt = db.prepare('DELETE FROM users WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }

  /**
   * Count users
   */
  static count() {
    const db = getDb();
    const stmt = db.prepare('SELECT COUNT(*) as count FROM users');
    return stmt.get().count;
  }

  /**
   * Record login attempt
   */
  static recordLoginAttempt(username, ipAddress, success) {
    const db = getDb();
    const stmt = db.prepare(`
      INSERT INTO login_attempts (username, ip_address, success)
      VALUES (?, ?, ?)
    `);
    stmt.run(username, ipAddress, success ? 1 : 0);
  }

  /**
   * Get recent failed login attempts
   */
  static getFailedLoginAttempts(username, minutes = 15) {
    const db = getDb();
    const stmt = db.prepare(`
      SELECT COUNT(*) as count
      FROM login_attempts
      WHERE username = ?
        AND success = 0
        AND attempted_at > datetime('now', '-${minutes} minutes')
    `);
    return stmt.get(username).count;
  }

  /**
   * Clear old login attempts
   */
  static clearOldLoginAttempts(hours = 24) {
    const db = getDb();
    const stmt = db.prepare(`
      DELETE FROM login_attempts
      WHERE attempted_at < datetime('now', '-${hours} hours')
    `);
    return stmt.run().changes;
  }
}

module.exports = User;
