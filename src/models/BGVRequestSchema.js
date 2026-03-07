// const mongoose = require('mongoose');

// const bgvRequestSchema = new mongoose.Schema({
//   clientId: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'Client',
//     required: true
//   },

//   candidate: {
//     name: {
//         type:String,
//         required:true
//     },
//     email: {
//         type:String,
//         required:true
//     },
//     phone: {
//         type:String,
//         required:true
//     }
//   },

//   status: {
//     type: String,
//     enum: ['NEW', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETED', 'CLOSED'],
//     default: 'NEW'
//   },

//   priority: {
//     type: String,
//     enum: ['LOW', 'MEDIUM', 'HIGH'],
//     default: 'MEDIUM'
//   },

//   submittedBy: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'User'
//   },

//   assignedTo: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'User'
//   },

//   slaDueDate: Date,
//   is_deleted:{
//     type: Boolean,
//     default: false
//   }

// }, { timestamps: true });

// module.exports = mongoose.model('BGVRequest', bgvRequestSchema);


const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/db2.config");
const Client = require("./ClientSchema");
const { all } = require("../routes/ClientService.routes");
const User = require("./UserSchema");

const BGVRequest = sequelize.define('bgv_request', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
    allowNull: false
  },
   clientId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: Client,
      key: 'id'
    }
  },
    candidate_name: {
        type:DataTypes.STRING,
        required:true,
        allowNull: false
    },
    candidate_email: {
        type:DataTypes.STRING,
        required:true,
        allowNull: false
    },
    candidate_phone: {
        type:DataTypes.STRING,
        required:true,
        allowNull: false
    },
  status: {
    type: DataTypes.ENUM('NEW', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETED', 'CLOSED'),
    // enum: ['NEW', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETED', 'CLOSED'],
    allowNull: false,
    default: 'NEW'
  },

  priority: {
    type: DataTypes.ENUM('LOW', 'MEDIUM', 'HIGH'),
    allowNull: false,
    default: 'MEDIUM'
  },

  submittedBy: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: User,
      key: 'id'
    }
  },

  assignedTo: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: User,
      key: 'id'
    }
  },

  slaDueDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
}, { 
  timestamps: true,
  paranoid: true,
  tableName: 'bgv_requests'
 });