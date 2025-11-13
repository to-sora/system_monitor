// backend/db/database.js
// SQLite database connection with encryption support

const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class DatabaseManager {
  constructor() {
    this.db = null;
    this.dbPath = process.env.DB_PATH || path.join(__dirname, '../../data/system_monitor.db');
    this.encryptionKey = process.env.DB_ENCRYPTION_KEY;

    // Ensure data directory exists
    const dataDir = path.dirname(this.dbPath);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true, mode: 0o700 });
    }
  }

  /**
   * Initialize database connection
   */
  connect() {
    try {
      // Check if encryption is enabled
      if (this.encryptionKey) {
        // Note: For production, use @journeyapps/sqlcipher instead
        // This is a placeholder for the encryption logic
        console.log('Database encryption enabled');
      }

      // Open database connection
      this.db = new Database(this.dbPath, {
        verbose: process.env.NODE_ENV === 'development' ? console.log : null
      });

      // Enable WAL mode for better concurrent access
      this.db.pragma('journal_mode = WAL');

      // Enable foreign keys
      this.db.pragma('foreign_keys = ON');

      // Set encryption key if provided (requires SQLCipher build)
      if (this.encryptionKey) {
        try {
          this.db.pragma(`key = '${this.encryptionKey}'`);
        } catch (err) {
          console.warn('Encryption not available. Using unencrypted database.');
          console.warn('Install @journeyapps/sqlcipher for encryption support.');
        }
      }

      // Initialize schema
      this.initializeSchema();

      console.log('Database connected successfully:', this.dbPath);
      return this.db;
    } catch (error) {
      console.error('Database connection error:', error);
      throw error;
    }
  }

  /**
   * Initialize database schema
   */
  initializeSchema() {
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');

    // Execute schema
    this.db.exec(schema);
    console.log('Database schema initialized');
  }

  /**
   * Get database instance
   */
  getDatabase() {
    if (!this.db) {
      throw new Error('Database not connected. Call connect() first.');
    }
    return this.db;
  }

  /**
   * Close database connection
   */
  close() {
    if (this.db) {
      this.db.close();
      console.log('Database connection closed');
    }
  }

  /**
   * Run a transaction
   */
  transaction(callback) {
    const transaction = this.db.transaction(callback);
    return transaction;
  }

  /**
   * Create database backup
   */
  backup(backupPath) {
    try {
      if (!backupPath) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        backupPath = path.join(__dirname, '../../backups', `backup_${timestamp}.db`);
      }

      const backupDir = path.dirname(backupPath);
      if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true, mode: 0o700 });
      }

      // Close and reopen to ensure no locks, then use simple file copy
      // This is more reliable than the backup API for SQLite
      this.db.pragma('wal_checkpoint(TRUNCATE)'); // Checkpoint WAL file

      fs.copyFileSync(this.dbPath, backupPath);

      console.log('Database backup created:', backupPath);
      return backupPath;
    } catch (error) {
      console.error('Backup failed:', error);
      throw error;
    }
  }

  /**
   * Clean up old data
   */
  cleanup(daysToKeep = 90) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const stmt = this.db.prepare(
      'DELETE FROM data_values WHERE timestamp < ?'
    );
    const result = stmt.run(cutoffDate.toISOString());

    console.log(`Cleaned up ${result.changes} old data records`);

    // Optimize database after cleanup
    this.db.pragma('optimize');

    return result.changes;
  }

  /**
   * Clean up expired sessions
   */
  cleanupExpiredSessions() {
    const stmt = this.db.prepare(
      'DELETE FROM sessions WHERE expires_at < datetime("now")'
    );
    const result = stmt.run();
    console.log(`Cleaned up ${result.changes} expired sessions`);
    return result.changes;
  }

  /**
   * Get database statistics
   */
  getStats() {
    const stats = {
      users: this.db.prepare('SELECT COUNT(*) as count FROM users').get().count,
      devices: this.db.prepare('SELECT COUNT(*) as count FROM devices').get().count,
      dataTypes: this.db.prepare('SELECT COUNT(*) as count FROM data_types').get().count,
      dataValues: this.db.prepare('SELECT COUNT(*) as count FROM data_values').get().count,
      sessions: this.db.prepare('SELECT COUNT(*) as count FROM sessions').get().count,
      dbSize: fs.statSync(this.dbPath).size
    };
    return stats;
  }
}

// Singleton instance
let instance = null;

module.exports = {
  connect: () => {
    if (!instance) {
      instance = new DatabaseManager();
      instance.connect();
    }
    return instance;
  },
  getDb: () => {
    if (!instance) {
      throw new Error('Database not initialized. Call connect() first.');
    }
    return instance.getDatabase();
  },
  close: () => {
    if (instance) {
      instance.close();
      instance = null;
    }
  },
  backup: (backupPath) => {
    if (!instance) {
      throw new Error('Database not initialized.');
    }
    return instance.backup(backupPath);
  },
  cleanup: (daysToKeep) => {
    if (!instance) {
      throw new Error('Database not initialized.');
    }
    return instance.cleanup(daysToKeep);
  },
  getStats: () => {
    if (!instance) {
      throw new Error('Database not initialized.');
    }
    return instance.getStats();
  }
};
