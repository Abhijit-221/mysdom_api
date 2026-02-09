const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        // unique: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        // unique: true,
        lowercase: true,
        trim: true
    },
    phone:{
        type: String,
        required: false,
        unique: false,
        trim: true
    },
    password: {
        type: String,
        required: true,
        minlength: 6
    },
    role: {
        type: String,
        required: true,
        enum: ['user', 'admin', 'moderator'],
        // default: 'user'
    },
    permissions: [{
        type: String,
        enum: ['read', 'write', 'delete', 'manage_users']
    }],
    profilePicture: {
        type: String,
        default: ''
    },
    gender: {
        type: String,
        enum: ['male', 'female', 'other'],
        default: 'other'
    },
    isActive: {
        type: Boolean,
        default: true
    },
    is_deleted:{
        type: Boolean,
        default: false
    }
}, { timestamps: true });


// Hash password before saving
userSchema.pre('save', async function() {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 12);
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);