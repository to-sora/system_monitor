// backend/db/models/Device.js
// SQLite Device model

const { getDb } = require('../database');

class Device {
  /**
   * Create a new device
   */
  static create({ deviceId, name, description = '' }) {
    const db = getDb();

    try {
      const stmt = db.prepare(`
        INSERT INTO devices (device_id, name, description)
        VALUES (?, ?, ?)
      `);

      const result = stmt.run(deviceId, name, description);

      return {
        id: result.lastInsertRowid,
        deviceId,
        name,
        description,
        createdAt: new Date()
      };
    } catch (error) {
      if (error.message.includes('UNIQUE constraint failed')) {
        throw new Error('Device ID already exists');
      }
      throw error;
    }
  }

  /**
   * Find device by deviceId
   */
  static findByDeviceId(deviceId) {
    const db = getDb();
    const stmt = db.prepare(`
      SELECT id, device_id as deviceId, name, description,
             created_at as createdAt, updated_at as updatedAt
      FROM devices
      WHERE device_id = ?
    `);

    return stmt.get(deviceId);
  }

  /**
   * Find device by ID
   */
  static findById(id) {
    const db = getDb();
    const stmt = db.prepare(`
      SELECT id, device_id as deviceId, name, description,
             created_at as createdAt, updated_at as updatedAt
      FROM devices
      WHERE id = ?
    `);

    return stmt.get(id);
  }

  /**
   * Find all devices
   */
  static findAll() {
    const db = getDb();
    const stmt = db.prepare(`
      SELECT id, device_id as deviceId, name, description,
             created_at as createdAt, updated_at as updatedAt
      FROM devices
      ORDER BY created_at DESC
    `);

    return stmt.all();
  }

  /**
   * Update device
   */
  static update(deviceId, updates) {
    const db = getDb();
    const allowedFields = ['name', 'description'];
    const fields = [];
    const values = [];

    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key)) {
        fields.push(`${key} = ?`);
        values.push(value);
      }
    }

    if (fields.length === 0) {
      return null;
    }

    fields.push('updated_at = CURRENT_TIMESTAMP');
    values.push(deviceId);

    const stmt = db.prepare(`
      UPDATE devices
      SET ${fields.join(', ')}
      WHERE device_id = ?
    `);

    stmt.run(...values);
    return this.findByDeviceId(deviceId);
  }

  /**
   * Delete device
   */
  static delete(deviceId) {
    const db = getDb();
    const stmt = db.prepare('DELETE FROM devices WHERE device_id = ?');
    const result = stmt.run(deviceId);
    return result.changes > 0;
  }

  /**
   * Count devices
   */
  static count() {
    const db = getDb();
    const stmt = db.prepare('SELECT COUNT(*) as count FROM devices');
    return stmt.get().count;
  }

  /**
   * Check if device exists
   */
  static exists(deviceId) {
    return this.findByDeviceId(deviceId) !== undefined;
  }
}

module.exports = Device;
