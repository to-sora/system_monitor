// backend/db/models/DataValue.js
// SQLite DataValue model (time-series data)

const { getDb } = require('../database');

class DataValue {
  /**
   * Create a single data value
   */
  static create({ key, machine, value, timestamp }) {
    const db = getDb();

    const stmt = db.prepare(`
      INSERT INTO data_values (key, machine, value, timestamp)
      VALUES (?, ?, ?, ?)
    `);

    const result = stmt.run(
      key,
      machine,
      String(value),
      timestamp instanceof Date ? timestamp.toISOString() : timestamp
    );

    return {
      id: result.lastInsertRowid,
      key,
      machine,
      value,
      timestamp,
      createdAt: new Date()
    };
  }

  /**
   * Create multiple data values in a transaction (bulk insert)
   */
  static createMany(dataValues) {
    const db = getDb();

    const insert = db.prepare(`
      INSERT INTO data_values (key, machine, value, timestamp)
      VALUES (?, ?, ?, ?)
    `);

    const insertMany = db.transaction((values) => {
      const results = [];
      for (const data of values) {
        const result = insert.run(
          data.key,
          data.machine,
          String(data.value),
          data.timestamp instanceof Date ? data.timestamp.toISOString() : data.timestamp
        );
        results.push(result.lastInsertRowid);
      }
      return results;
    });

    return insertMany(dataValues);
  }

  /**
   * Find data values by criteria
   */
  static find({ key, machine, since, until, limit = null }) {
    const db = getDb();
    const conditions = [];
    const params = [];

    if (key) {
      conditions.push('key = ?');
      params.push(key);
    }

    if (machine) {
      conditions.push('machine = ?');
      params.push(machine);
    }

    if (since) {
      conditions.push('timestamp >= ?');
      params.push(since instanceof Date ? since.toISOString() : since);
    }

    if (until) {
      conditions.push('timestamp <= ?');
      params.push(until instanceof Date ? until.toISOString() : until);
    }

    let query = `
      SELECT id, key, machine, value, timestamp,
             created_at as createdAt
      FROM data_values
    `;

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY timestamp ASC';

    if (limit) {
      query += ' LIMIT ?';
      params.push(limit);
    }

    const stmt = db.prepare(query);
    const rows = stmt.all(...params);

    return rows.map(row => ({
      ...row,
      timestamp: new Date(row.timestamp),
      createdAt: new Date(row.createdAt)
    }));
  }

  /**
   * Find latest data value for a key and machine
   */
  static findLatest(key, machine) {
    const db = getDb();
    const stmt = db.prepare(`
      SELECT id, key, machine, value, timestamp,
             created_at as createdAt
      FROM data_values
      WHERE key = ? AND machine = ?
      ORDER BY timestamp DESC
      LIMIT 1
    `);

    const row = stmt.get(key, machine);
    if (!row) return null;

    return {
      ...row,
      timestamp: new Date(row.timestamp),
      createdAt: new Date(row.createdAt)
    };
  }

  /**
   * Get aggregated statistics for a key and machine
   */
  static getAggregates({ key, machine, since, until }) {
    const db = getDb();
    const params = [key, machine];
    let whereClause = 'WHERE key = ? AND machine = ?';

    if (since) {
      whereClause += ' AND timestamp >= ?';
      params.push(since instanceof Date ? since.toISOString() : since);
    }

    if (until) {
      whereClause += ' AND timestamp <= ?';
      params.push(until instanceof Date ? until.toISOString() : until);
    }

    const stmt = db.prepare(`
      SELECT
        COUNT(*) as count,
        MIN(CAST(value AS REAL)) as min,
        MAX(CAST(value AS REAL)) as max,
        AVG(CAST(value AS REAL)) as avg
      FROM data_values
      ${whereClause}
    `);

    return stmt.get(...params);
  }

  /**
   * Delete data values by criteria
   */
  static delete({ key, machine, before }) {
    const db = getDb();
    const conditions = [];
    const params = [];

    if (key) {
      conditions.push('key = ?');
      params.push(key);
    }

    if (machine) {
      conditions.push('machine = ?');
      params.push(machine);
    }

    if (before) {
      conditions.push('timestamp < ?');
      params.push(before instanceof Date ? before.toISOString() : before);
    }

    if (conditions.length === 0) {
      throw new Error('Delete requires at least one condition');
    }

    const stmt = db.prepare(`
      DELETE FROM data_values
      WHERE ${conditions.join(' AND ')}
    `);

    const result = stmt.run(...params);
    return result.changes;
  }

  /**
   * Count data values
   */
  static count({ key, machine } = {}) {
    const db = getDb();
    const conditions = [];
    const params = [];

    if (key) {
      conditions.push('key = ?');
      params.push(key);
    }

    if (machine) {
      conditions.push('machine = ?');
      params.push(machine);
    }

    let query = 'SELECT COUNT(*) as count FROM data_values';
    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    const stmt = db.prepare(query);
    return stmt.get(...params).count;
  }

  /**
   * Get data value by ID
   */
  static findById(id) {
    const db = getDb();
    const stmt = db.prepare(`
      SELECT id, key, machine, value, timestamp,
             created_at as createdAt
      FROM data_values
      WHERE id = ?
    `);

    const row = stmt.get(id);
    if (!row) return null;

    return {
      ...row,
      timestamp: new Date(row.timestamp),
      createdAt: new Date(row.createdAt)
    };
  }
}

module.exports = DataValue;
