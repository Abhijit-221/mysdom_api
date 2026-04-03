
// const mongoose = require('mongoose');
// const serviceSchema = new mongoose.Schema({
//   name: { type: String, required: true },
//   description: {
//     type: String,
//     required: true
//   },
//   createdBy: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'User',
//     required: true
//   },
//   updatedBy: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'User'
//   },
//   isActive:{
//     type: Boolean,
//     default: true
//   },
//   is_deleted:{
//     type: Boolean,
//     default: false
//   }
// }, { timestamps: true });


// module.exports = mongoose.model('Service', serviceSchema);

const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/db2.config");
const User = require("./UserSchema");


const Service = sequelize.define('service', {

  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
    allowNull: false
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    required: true,
  },
  description: {
    type: DataTypes.STRING,
    allowNull: false,
    required: true,
  },
  moredetails:{
  type: DataTypes.JSON,
    allowNull: true,
    required: false,
  },
  createdBy: {
    type: DataTypes.UUID,
    references: {
      model: User,
      key: 'id'
    }
  },
  updatedBy: {
    type: DataTypes.UUID,
    references: {
      model: User,
      key: 'id'
    }
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
}, {
  tableName: 'services',
  timestamps: true,
  paranoid: true, // Enable soft deletes
});

module.exports = Service;