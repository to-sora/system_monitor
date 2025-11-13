#!/usr/bin/env node
// backend/scripts/setupAdmin.new.js
// Create initial admin user for SQLite database

require('dotenv').config();
const readline = require('readline');
const db = require('../db/database');
const User = require('../db/models/User');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function setupAdmin() {
  console.log('================================================================================');
  console.log('                   System Monitor - Admin Setup');
  console.log('================================================================================\n');

  try {
    // Connect to database
    console.log('Connecting to database...');
    db.connect();
    console.log('✓ Database connected\n');

    // Check if any admin exists
    const existingAdmins = User.findAll().filter(u => u.isAdmin);
    if (existingAdmins.length > 0) {
      console.log('⚠ Warning: Admin user(s) already exist:');
      existingAdmins.forEach(admin => {
        console.log(`  - ${admin.username}`);
      });
      console.log('');
      const proceed = await question('Do you want to create another admin? (yes/no): ');
      if (proceed.toLowerCase() !== 'yes' && proceed.toLowerCase() !== 'y') {
        console.log('Setup cancelled.');
        rl.close();
        db.close();
        return;
      }
      console.log('');
    }

    // Get username
    let username;
    while (true) {
      username = await question('Enter admin username (3-50 characters): ');
      username = username.trim();

      if (username.length < 3 || username.length > 50) {
        console.log('✗ Username must be between 3 and 50 characters\n');
        continue;
      }

      if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
        console.log('✗ Username can only contain letters, numbers, underscores, and hyphens\n');
        continue;
      }

      // Check if username exists
      const existing = User.findByUsername(username);
      if (existing) {
        console.log('✗ Username already exists\n');
        continue;
      }

      break;
    }

    // Get password
    let password;
    while (true) {
      password = await question('Enter admin password (min 8 characters): ');

      if (password.length < 8) {
        console.log('✗ Password must be at least 8 characters long\n');
        continue;
      }

      if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
        console.log('✗ Password must contain at least one uppercase letter, one lowercase letter, and one number\n');
        continue;
      }

      const confirmPassword = await question('Confirm password: ');
      if (password !== confirmPassword) {
        console.log('✗ Passwords do not match\n');
        continue;
      }

      break;
    }

    // Create admin user
    console.log('\nCreating admin user...');
    await User.create({
      username,
      password,
      isAdmin: true
    });

    console.log('');
    console.log('================================================================================');
    console.log('✓ Admin user created successfully!');
    console.log('================================================================================');
    console.log(`  Username: ${username}`);
    console.log(`  Role: Administrator`);
    console.log('');
    console.log('You can now use these credentials to log in to the system.');
    console.log('================================================================================');

  } catch (error) {
    console.error('\n✗ Error creating admin user:', error.message);
    process.exit(1);
  } finally {
    rl.close();
    db.close();
  }
}

// Run setup
setupAdmin().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
