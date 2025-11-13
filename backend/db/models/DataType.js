// backend/db/models/DataType.js
// SQLite DataType model (keys configuration)

const { getDb } = require('../database');

class DataType {
  /**
   * Create a new data type
   */
  static create({
    keyName,
    dataType,
    normalRange = null,
    warningRange = null,
    missingDataAllowance = null,
    emailAlertRange = null
  }) {
    const db = getDb();

    try {
      const stmt = db.prepare(`
        INSERT INTO data_types (
          key_name, data_type,
          normal_min, normal_max,
          warning_min, warning_max,
          missing_data_allowance,
          email_alert_min, email_alert_max
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const result = stmt.run(
        keyName,
        dataType,
        normalRange?.min ?? null,
        normalRange?.max ?? null,
        warningRange?.min ?? null,
        warningRange?.max ?? null,
        missingDataAllowance,
        emailAlertRange?.min ?? null,
        emailAlertRange?.max ?? null
      );

      return {
        id: result.lastInsertRowid,
        keyName,
        dataType,
        normalRange,
        warningRange,
        missingDataAllowance,
        emailAlertRange,
        createdAt: new Date()
      };
    } catch (error) {
      if (error.message.includes('UNIQUE constraint failed')) {
        throw new Error('Key name already exists');
      }
      throw error;
    }
  }

  /**
   * Find data type by key name
   */
  static findByKeyName(keyName) {
    const db = getDb();
    const stmt = db.prepare(`
      SELECT id, key_name as keyName, data_type as dataType,
             normal_min, normal_max,
             warning_min, warning_max,
             missing_data_allowance as missingDataAllowance,
             email_alert_min, email_alert_max,
             created_at as createdAt, updated_at as updatedAt
      FROM data_types
      WHERE key_name = ?
    `);

    const row = stmt.get(keyName);
    if (!row) return null;

    return this._formatRow(row);
  }

  /**
   * Find data types by key names (multiple)
   */
  static findByKeyNames(keyNames) {
    const db = getDb();
    const placeholders = keyNames.map(() => '?').join(',');
    const stmt = db.prepare(`
      SELECT id, key_name as keyName, data_type as dataType,
             normal_min, normal_max,
             warning_min, warning_max,
             missing_data_allowance as missingDataAllowance,
             email_alert_min, email_alert_max,
             created_at as createdAt, updated_at as updatedAt
      FROM data_types
      WHERE key_name IN (${placeholders})
    `);

    const rows = stmt.all(...keyNames);
    return rows.map(row => this._formatRow(row));
  }

  /**
   * Find all data types
   */
  static findAll() {
    const db = getDb();
    const stmt = db.prepare(`
      SELECT id, key_name as keyName, data_type as dataType,
             normal_min, normal_max,
             warning_min, warning_max,
             missing_data_allowance as missingDataAllowance,
             email_alert_min, email_alert_max,
             created_at as createdAt, updated_at as updatedAt
      FROM data_types
      ORDER BY created_at DESC
    `);

    const rows = stmt.all();
    return rows.map(row => this._formatRow(row));
  }

  /**
   * Update data type
   */
  static update(keyName, updates) {
    const db = getDb();
    const fields = [];
    const values = [];

    const fieldMap = {
      dataType: 'data_type',
      missingDataAllowance: 'missing_data_allowance'
    };

    for (const [key, value] of Object.entries(updates)) {
      if (key === 'normalRange' && value) {
        fields.push('normal_min = ?', 'normal_max = ?');
        values.push(value.min ?? null, value.max ?? null);
      } else if (key === 'warningRange' && value) {
        fields.push('warning_min = ?', 'warning_max = ?');
        values.push(value.min ?? null, value.max ?? null);
      } else if (key === 'emailAlertRange' && value) {
        fields.push('email_alert_min = ?', 'email_alert_max = ?');
        values.push(value.min ?? null, value.max ?? null);
      } else if (key !== 'keyName') {
        const dbField = fieldMap[key] || key;
        fields.push(`${dbField} = ?`);
        values.push(value);
      }
    }

    if (fields.length === 0) {
      return null;
    }

    fields.push('updated_at = datetime("now")');
    values.push(keyName);

    const stmt = db.prepare(`
      UPDATE data_types
      SET ${fields.join(', ')}
      WHERE key_name = ?
    `);

    stmt.run(...values);
    return this.findByKeyName(keyName);
  }

  /**
   * Delete data type
   */
  static delete(keyName) {
    const db = getDb();
    const stmt = db.prepare('DELETE FROM data_types WHERE key_name = ?');
    const result = stmt.run(keyName);
    return result.changes > 0;
  }

  /**
   * Count data types
   */
  static count() {
    const db = getDb();
    const stmt = db.prepare('SELECT COUNT(*) as count FROM data_types');
    return stmt.get().count;
  }

  /**
   * Format row to include range objects
   */
  static _formatRow(row) {
    const formatted = { ...row };

    // Format normalRange
    if (row.normal_min !== null || row.normal_max !== null) {
      formatted.normalRange = {
        min: row.normal_min,
        max: row.normal_max
      };
    } else {
      formatted.normalRange = null;
    }

    // Format warningRange
    if (row.warning_min !== null || row.warning_max !== null) {
      formatted.warningRange = {
        min: row.warning_min,
        max: row.warning_max
      };
    } else {
      formatted.warningRange = null;
    }

    // Format emailAlertRange
    if (row.email_alert_min !== null || row.email_alert_max !== null) {
      formatted.emailAlertRange = {
        min: row.email_alert_min,
        max: row.email_alert_max
      };
    } else {
      formatted.emailAlertRange = null;
    }

    // Remove individual fields
    delete formatted.normal_min;
    delete formatted.normal_max;
    delete formatted.warning_min;
    delete formatted.warning_max;
    delete formatted.email_alert_min;
    delete formatted.email_alert_max;

    return formatted;
  }
}

module.exports = DataType;
