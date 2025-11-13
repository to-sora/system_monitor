// backend/utils/backup.js
// Automated backup system

const fs = require('fs');
const path = require('path');
const { backup: dbBackup } = require('../db/database');

const BACKUP_DIR = process.env.BACKUP_DIR || path.join(__dirname, '../../backups');
const BACKUP_RETENTION_DAYS = parseInt(process.env.BACKUP_RETENTION_DAYS || '7', 10);

/**
 * Create a database backup
 */
function createBackup() {
  try {
    // Ensure backup directory exists
    if (!fs.existsSync(BACKUP_DIR)) {
      fs.mkdirSync(BACKUP_DIR, { recursive: true, mode: 0o700 });
    }

    // Create backup filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.resolve(BACKUP_DIR, `backup_${timestamp}.db`);

    // Perform backup
    dbBackup(backupPath);

    console.log(`[Backup] Successfully created backup: ${backupPath}`);

    // Clean up old backups
    cleanupOldBackups();

    return backupPath;
  } catch (error) {
    console.error('[Backup] Error creating backup:', error);
    throw error;
  }
}

/**
 * Clean up old backups
 */
function cleanupOldBackups() {
  try {
    const files = fs.readdirSync(BACKUP_DIR);
    const now = Date.now();
    const retentionMs = BACKUP_RETENTION_DAYS * 24 * 60 * 60 * 1000;

    let deletedCount = 0;

    for (const file of files) {
      if (!file.startsWith('backup_') || !file.endsWith('.db')) {
        continue;
      }

      const filePath = path.join(BACKUP_DIR, file);
      const stats = fs.statSync(filePath);
      const age = now - stats.mtime.getTime();

      if (age > retentionMs) {
        fs.unlinkSync(filePath);
        deletedCount++;
        console.log(`[Backup] Deleted old backup: ${file}`);
      }
    }

    if (deletedCount > 0) {
      console.log(`[Backup] Cleaned up ${deletedCount} old backup(s)`);
    }
  } catch (error) {
    console.error('[Backup] Error cleaning up old backups:', error);
  }
}

/**
 * List all backups
 */
function listBackups() {
  try {
    if (!fs.existsSync(BACKUP_DIR)) {
      return [];
    }

    const files = fs.readdirSync(BACKUP_DIR);
    const backups = [];

    for (const file of files) {
      if (!file.startsWith('backup_') || !file.endsWith('.db')) {
        continue;
      }

      const filePath = path.join(BACKUP_DIR, file);
      const stats = fs.statSync(filePath);

      backups.push({
        filename: file,
        path: filePath,
        size: stats.size,
        sizeHuman: `${(stats.size / 1024 / 1024).toFixed(2)} MB`,
        created: stats.mtime
      });
    }

    // Sort by creation date (newest first)
    backups.sort((a, b) => b.created - a.created);

    return backups;
  } catch (error) {
    console.error('[Backup] Error listing backups:', error);
    return [];
  }
}

/**
 * Schedule automatic backups
 */
function scheduleBackups() {
  const intervalHours = parseInt(process.env.BACKUP_INTERVAL_HOURS || '6', 10);
  const intervalMs = intervalHours * 60 * 60 * 1000;

  console.log(`[Backup] Scheduling automatic backups every ${intervalHours} hour(s)`);

  // Create initial backup
  try {
    createBackup();
  } catch (error) {
    console.error('[Backup] Initial backup failed:', error);
  }

  // Schedule recurring backups
  setInterval(() => {
    try {
      createBackup();
    } catch (error) {
      console.error('[Backup] Scheduled backup failed:', error);
    }
  }, intervalMs);
}

module.exports = {
  createBackup,
  cleanupOldBackups,
  listBackups,
  scheduleBackups
};
