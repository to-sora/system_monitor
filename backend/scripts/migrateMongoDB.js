#!/usr/bin/env node
// backend/scripts/migrateMongoDB.js
// Migrate data from MongoDB to SQLite

require('dotenv').config();
const mongoose = require('mongoose');
const db = require('../db/database');

// MongoDB models (old)
const MongoUser = require('../models/User');
const MongoDevice = require('../models/Device');
const MongoDataType = require('../models/DataType');
const MongoDataValue = require('../models/DataValue');

// SQLite models (new)
const SqliteUser = require('../db/models/User');
const SqliteDevice = require('../db/models/Device');
const SqliteDataType = require('../db/models/DataType');
const SqliteDataValue = require('../db/models/DataValue');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/system_monitor';
const BATCH_SIZE = 1000;

async function connectMongoDB() {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  });
  console.log('✓ MongoDB connected');
}

async function migrateUsers() {
  console.log('\n=== Migrating Users ===');
  try {
    const users = await MongoUser.find({});
    console.log(`Found ${users.length} users`);

    let migrated = 0;
    for (const user of users) {
      try {
        // Note: Passwords are already hashed in MongoDB, we need to insert them directly
        const sqliteDb = db.getDb();
        const stmt = sqliteDb.prepare(`
          INSERT INTO users (username, password_hash, is_admin, created_at)
          VALUES (?, ?, ?, ?)
        `);

        stmt.run(
          user.username,
          user.password,
          user.isAdmin ? 1 : 0,
          user.createdAt.toISOString()
        );

        migrated++;
        console.log(`✓ Migrated user: ${user.username}`);
      } catch (error) {
        console.error(`✗ Failed to migrate user ${user.username}:`, error.message);
      }
    }

    console.log(`Migrated ${migrated}/${users.length} users`);
  } catch (error) {
    console.error('Error migrating users:', error);
  }
}

async function migrateDevices() {
  console.log('\n=== Migrating Devices ===');
  try {
    const devices = await MongoDevice.find({});
    console.log(`Found ${devices.length} devices`);

    let migrated = 0;
    for (const device of devices) {
      try {
        SqliteDevice.create({
          deviceId: device.deviceId,
          name: device.name,
          description: device.description || ''
        });
        migrated++;
        console.log(`✓ Migrated device: ${device.deviceId}`);
      } catch (error) {
        console.error(`✗ Failed to migrate device ${device.deviceId}:`, error.message);
      }
    }

    console.log(`Migrated ${migrated}/${devices.length} devices`);
  } catch (error) {
    console.error('Error migrating devices:', error);
  }
}

async function migrateDataTypes() {
  console.log('\n=== Migrating Data Types ===');
  try {
    const dataTypes = await MongoDataType.find({});
    console.log(`Found ${dataTypes.length} data types`);

    let migrated = 0;
    for (const dataType of dataTypes) {
      try {
        SqliteDataType.create({
          keyName: dataType.keyName,
          dataType: dataType.dataType,
          normalRange: dataType.normalRange,
          warningRange: dataType.warningRange,
          missingDataAllowance: dataType.missingDataAllowance,
          emailAlertRange: dataType.emailAlertRange
        });
        migrated++;
        console.log(`✓ Migrated data type: ${dataType.keyName}`);
      } catch (error) {
        console.error(`✗ Failed to migrate data type ${dataType.keyName}:`, error.message);
      }
    }

    console.log(`Migrated ${migrated}/${dataTypes.length} data types`);
  } catch (error) {
    console.error('Error migrating data types:', error);
  }
}

async function migrateDataValues() {
  console.log('\n=== Migrating Data Values ===');
  console.log('This may take a while for large datasets...');

  try {
    const count = await MongoDataValue.countDocuments({});
    console.log(`Found ${count} data values`);

    let migrated = 0;
    let skipped = 0;
    let offset = 0;

    while (offset < count) {
      const dataValues = await MongoDataValue.find({})
        .skip(offset)
        .limit(BATCH_SIZE)
        .lean();

      if (dataValues.length === 0) break;

      const batch = dataValues.map(dv => ({
        key: dv.key,
        machine: dv.machine,
        value: dv.value,
        timestamp: dv.timestamp
      }));

      try {
        SqliteDataValue.createMany(batch);
        migrated += batch.length;
        console.log(`✓ Migrated batch: ${offset + batch.length}/${count}`);
      } catch (error) {
        console.error(`✗ Failed to migrate batch at offset ${offset}:`, error.message);
        skipped += batch.length;
      }

      offset += BATCH_SIZE;

      // Progress report every 10 batches
      if (offset % (BATCH_SIZE * 10) === 0) {
        console.log(`  Progress: ${offset}/${count} (${((offset/count)*100).toFixed(1)}%)`);
      }
    }

    console.log(`Migrated ${migrated}/${count} data values (${skipped} skipped)`);
  } catch (error) {
    console.error('Error migrating data values:', error);
  }
}

async function verifyMigration() {
  console.log('\n=== Verification ===');

  const sqliteDb = db.getDb();

  // Count records
  const userCount = sqliteDb.prepare('SELECT COUNT(*) as count FROM users').get().count;
  const deviceCount = sqliteDb.prepare('SELECT COUNT(*) as count FROM devices').get().count;
  const dataTypeCount = sqliteDb.prepare('SELECT COUNT(*) as count FROM data_types').get().count;
  const dataValueCount = sqliteDb.prepare('SELECT COUNT(*) as count FROM data_values').get().count;

  console.log('SQLite Database:');
  console.log(`  Users: ${userCount}`);
  console.log(`  Devices: ${deviceCount}`);
  console.log(`  Data Types: ${dataTypeCount}`);
  console.log(`  Data Values: ${dataValueCount}`);

  // Compare with MongoDB
  const mongoUserCount = await MongoUser.countDocuments({});
  const mongoDeviceCount = await MongoDevice.countDocuments({});
  const mongoDataTypeCount = await MongoDataType.countDocuments({});
  const mongoDataValueCount = await MongoDataValue.countDocuments({});

  console.log('\nMongoDB Database:');
  console.log(`  Users: ${mongoUserCount}`);
  console.log(`  Devices: ${mongoDeviceCount}`);
  console.log(`  Data Types: ${mongoDataTypeCount}`);
  console.log(`  Data Values: ${mongoDataValueCount}`);

  console.log('\nMigration Success Rate:');
  console.log(`  Users: ${((userCount/mongoUserCount)*100).toFixed(1)}%`);
  console.log(`  Devices: ${((deviceCount/mongoDeviceCount)*100).toFixed(1)}%`);
  console.log(`  Data Types: ${((dataTypeCount/mongoDataTypeCount)*100).toFixed(1)}%`);
  console.log(`  Data Values: ${((dataValueCount/mongoDataValueCount)*100).toFixed(1)}%`);
}

async function migrate() {
  console.log('================================================================================');
  console.log('           MongoDB to SQLite Migration Tool');
  console.log('================================================================================\n');

  try {
    // Connect to databases
    await connectMongoDB();
    db.connect();
    console.log('✓ SQLite connected\n');

    // Confirm before proceeding
    console.log('⚠ Warning: This will migrate all data from MongoDB to SQLite');
    console.log('  Existing SQLite data will be preserved');
    console.log('  Duplicate entries will be skipped\n');

    // Perform migration
    const startTime = Date.now();

    await migrateUsers();
    await migrateDevices();
    await migrateDataTypes();
    await migrateDataValues();

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    // Verify
    await verifyMigration();

    console.log('\n================================================================================');
    console.log('✓ Migration completed successfully!');
    console.log(`  Total time: ${duration} seconds`);
    console.log('================================================================================\n');

    console.log('Next steps:');
    console.log('  1. Verify the migrated data in SQLite');
    console.log('  2. Test the application with the new database');
    console.log('  3. Create a backup of the SQLite database');
    console.log('  4. Once verified, you can stop the MongoDB service');
    console.log('');

  } catch (error) {
    console.error('\n✗ Migration failed:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    db.close();
  }
}

// Run migration
migrate().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
