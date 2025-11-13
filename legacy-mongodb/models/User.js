// models/User.js
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    maxlength: 50
  },
  password: {
    type: String,
    required: true
  },
  permissions: [{
    deviceId: String,
    accessLevel: {
      type: String,
      enum: ['read', 'write', 'admin'],
      default: 'read'
    }
  }],
  isAdmin: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

// Password hashing middleware
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch(err) {
    next(err);
  }
});

// Method to compare password
userSchema.methods.comparePassword = function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
