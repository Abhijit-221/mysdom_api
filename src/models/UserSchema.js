// const mongoose = require('mongoose');
// const bcrypt = require('bcryptjs');
// const userSchema = new mongoose.Schema({
//     username: {
//         type: String,
//         required: true,
//         // unique: true,
//         trim: true
//     },
//     email: {
//         type: String,
//         required: true,
//         // unique: true,
//         lowercase: true,
//         trim: true
//     },
//     phone:{
//         type: String,
//         required: false,
//         unique: false,
//         trim: true
//     },
//     password: {
//         type: String,
//         required: true,
//         minlength: 6
//     },
//     role: {
//         type: String,
//         required: true,
//         enum: ['user','superadmin','admin','moderator'],
//         // default: 'user'
//     },
//     client:{
//         type: mongoose.Schema.Types.ObjectId,
//         ref: 'Client'
//     },
//     permissions: [{
//         type: String,
//         enum: ['read', 'write', 'delete', 'manage_users']
//     }],
//     profilePicture: {
//         type: String,
//         default: ''
//     },
//     gender: {
//         type: String,
//         enum: ['male', 'female', 'other'],
//         default: 'other'
//     },
//     isActive: {
//         type: Boolean,
//         default: true
//     },
//     is_deleted:{
//         type: Boolean,
//         default: false
//     }
// }, { timestamps: true });



// // Hash password before saving
// userSchema.pre('save', async function() {
//   if (!this.isModified('password')) return;
//   this.password = await bcrypt.hash(this.password, 12);
// });

// // Compare password method
// userSchema.methods.comparePassword = async function(candidatePassword) {
//   return await bcrypt.compare(candidatePassword, this.password);
// };

// module.exports = mongoose.model('User', userSchema);
const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/db2.config");

const User = sequelize.define(
    "users",
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
            allowNull: false
        },
        username: {
            type: DataTypes.STRING,
            allowNull: false,
            required: true,
        },
        email: {
            type: DataTypes.STRING,
            allowNull: false,
            required: true,
        },
        phone: {
            type: DataTypes.STRING(12),
            required: false,
            allowNull: true,
        },
        password: {
            type: DataTypes.STRING,
            required: true,
            minlength: 6
        },
        role: {
            type: DataTypes.ENUM('user', 'superadmin', 'admin', 'moderator'),
            required: true,
            // enum: ['user', 'superadmin', 'admin', 'moderator'],
            // default: 'user'
        },
        client: {
            type: DataTypes.UUID,
            allowNull: true,
        },
        profilePicture: {
            type: DataTypes.STRING,
            required: false,
            allowNull: true
        },
        gender: {
            type: DataTypes.ENUM('male', 'female', 'other'),
            required: false,
            allowNull: true,
            // defaultValue: 'other'
        },
        otp:{
            type: DataTypes.STRING,
            allowNull: true,
        },
        otpExpiration: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        isActive: {
            type: DataTypes.BOOLEAN,
            defaultValue: true
        }
    },
    {
        tableName: "users",
        timestamps: true,
        paranoid: true,
    }
);



module.exports = User;