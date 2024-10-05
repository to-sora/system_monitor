// controllers/userController.js
const User = require('../models/User');
const bcrypt = require('bcrypt');

// List All Users (Admin Only)
const listUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password'); // Exclude passwords
    res.status(200).json({ users });
  } catch(err) {
    console.error(err);
    res.status(500).json({ message: 'Server error.' });
  }
};

// Update User Password (Admin Only)
const updateUserPassword = async (req, res) => {
  console.log(req.body);
  try {
    const { username, newPassword } = req.body;

    if (!username || !newPassword) {
      return res.status(400).json({ message: 'Username and newPassword are required.' });
    }

    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    user.password = newPassword; // This will trigger the pre-save hook for hashing
    await user.save();

    res.status(200).json({ message: 'Password updated successfully.' });
  } catch(err) {
    console.error(err);
    res.status(500).json({ message: 'Server error.' });
  }
};

// Delete a User (Admin Only)
const deleteUser = async (req, res) => {
  try {
    const { username } = req.body;
    console.log(req.body);
    if (!username) {
      return res.status(400).json({ message: 'Username is required.' });
    }

    const user = await User.findOneAndDelete({ username });
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    res.status(200).json({ message: 'User deleted successfully.' });
  } catch(err) {
    console.error(err);
    res.status(500).json({ message: 'Server error.' });
  }
};

module.exports = { listUsers, updateUserPassword, deleteUser };
