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
  req_code:{
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  candidate_name: {
    type: DataTypes.STRING,
    required: true,
    allowNull: false
  },
  candidate_email: {
    type: DataTypes.STRING,
    required: true,
    allowNull: true
  },
  candidate_phone: {
    type: DataTypes.STRING,
    required: true,
    allowNull: true
  },
  designation: {
    type: DataTypes.STRING,
    allowNull: true
  },

  department: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  /* ---------------- IDENTITY CHECK ---------------- */

  id_type: {
    type: DataTypes.STRING,
    allowNull: true
  },

  id_number: {
    type: DataTypes.STRING,
    allowNull: true
  },
  id_doc: {
    type: DataTypes.STRING,
    allowNull: true
  },
  /* ---------------- CURRENT ADDRESS ---------------- */

  current_address: {
    type: DataTypes.TEXT,
    allowNull: true
  },

  current_landmark: {
    type: DataTypes.STRING,
    allowNull: true
  },

  current_residency: {
    type: DataTypes.STRING,
    allowNull: true
  },

  current_duration: {
    type: DataTypes.STRING,
    allowNull: true
  },
  /* ---------------- PERMANENT ADDRESS ---------------- */

  permanent_address: {
    type: DataTypes.TEXT,
    allowNull: true
  },

  permanent_landmark: {
    type: DataTypes.STRING,
    allowNull: true
  },

  permanent_residency: {
    type: DataTypes.STRING,
    allowNull: true
  },

  permanent_duration: {
    type: DataTypes.STRING,
    allowNull: true
  },

  /* ---------------- CRIMINAL CHECK ---------------- */

  father_name: {
    type: DataTypes.STRING,
    allowNull: true
  },

  mother_name: {
    type: DataTypes.STRING,
    allowNull: true
  },

  gender: {
    type: DataTypes.STRING,
    allowNull: true
  },

  dob: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },

  /* ---------------- EMPLOYMENT CHECK ---------------- */

  // company_name: {
  //   type: DataTypes.STRING,
  //   allowNull: true
  // },

  // employee_id: {
  //   type: DataTypes.STRING,
  //   allowNull: true
  // },

  // employment_start: {
  //   type: DataTypes.DATEONLY,
  //   allowNull: true
  // },

  // employment_end: {
  //   type: DataTypes.DATEONLY,
  //   allowNull: true
  // },

  // job_title: {
  //   type: DataTypes.STRING,
  //   allowNull: true
  // },

  // leaving_reason: {
  //   type: DataTypes.STRING,
  //   allowNull: true
  // },
  // job_doc: {
  //   type: DataTypes.STRING,
  //   allowNull: true
  // },
  /* ---------------- EDUCATION CHECK ---------------- */

  institute_name: {
    type: DataTypes.STRING,
    allowNull: true
  },

  university: {
    type: DataTypes.STRING,
    allowNull: true
  },

  education_start: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },

  education_end: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },

  roll_number: {
    type: DataTypes.STRING,
    allowNull: true
  },

  qualification: {
    type: DataTypes.STRING,
    allowNull: true
  },

  specialization: {
    type: DataTypes.STRING,
    allowNull: true
  },

  passing_year: {
    type: DataTypes.STRING,
    allowNull: true
  },
  edu_doc: {
    type: DataTypes.STRING,
    allowNull: true
  },

  status: {
    type: DataTypes.ENUM('NEW', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETED', 'REJECTED','CLOSED'),
    // enum: ['NEW', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETED', 'CLOSED'],
    allowNull: false,
    defaultValue: 'NEW'
  },

  priority: {
    type: DataTypes.ENUM('LOW', 'MEDIUM', 'HIGH'),
    allowNull: false,
    defaultValue: 'MEDIUM'
  },

  submittedBy: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: User,
      key: 'id'
    }
  },

  updatedBy: {
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
module.exports = BGVRequest;