// scripts/setupAdmin.js
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const yaml = require('yamljs');
const User = require('../models/User');

// Load Configuration
const config =  yaml.load('./config/config.yaml');

// Connect to MongoDB
mongoose.connect(config.database.uri, config.database.options)
  .then(() => {
    console.log('Connected to MongoDB');
    return createAdminUser();
  })
  .then(() => {
    console.log('Admin user created successfully.');
    mongoose.disconnect();
  })
  .catch(err => {
    console.error('Error:', err);
    mongoose.disconnect();
  });

// Function to Create Admin User
const createAdminUser = async () => {
  const username = '"TODO"';
  const password = '"TODO"'; // Replace with a strong password

  // Check if admin already exists
  const existingAdmin = await User.findOne({ username });
  if (existingAdmin) {
    console.log('Admin user already exists.');
    return;
  }

  // Hash the password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  // Create new admin user
  const admin = new User({
    username,
    password: hashedPassword,
    isAdmin: true,
    permissions: []
  });

  await admin.save();
};
