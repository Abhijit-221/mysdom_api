
// const mongoose = require('mongoose');
// const requestServiceSchema = new mongoose.Schema({
//   requestId: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'BGVRequest',
//     required: true
//   },



//   serviceId: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'Service'
//   },

//   status: {
//     type: String,
//     enum: ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'FAILED'],
//     default: 'PENDING'
//   },

//   remarks: String,
//   completedAt: Date,
//   is_deleted:{
//     type: Boolean,
//     default: false
//   }

// }, { timestamps: true });

// module.exports = mongoose.model('RequestService', requestServiceSchema);


const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/db2.config");
const BGVRequest = require("./BGVRequestSchema");
const Service = require("./ServiceSchema");
const User = require("./UserSchema");
const BGVRequestService = sequelize.define('bgv_request_service', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
    allowNull: false
  },
  requestId: {
    type: DataTypes.UUID,
    references: {
      model: BGVRequest,
      key: 'id'
    },
    allowNull: false
  },
  serviceId: {
    type: DataTypes.UUID,
    references: {
      model: Service,
      key: 'id'
    },
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('NEW', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETED', 'REJECTED'),
    defaultValue: 'NEW'
  },
  createdBy:{
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: User,
      key: 'id'
    }
  },
  updatedBy:{
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: User,
      key: 'id'
    }
  },
  remark:{
    type: DataTypes.TEXT,
    allowNull: true
  }
  
},{
  timestamps: true,
  paranoid: true,
  tableName: 'bgv_request_service'
});
module.exports = BGVRequestService;