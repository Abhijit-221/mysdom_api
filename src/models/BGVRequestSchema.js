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
    type: DataTypes.STRING(50),
    allowNull: false,
    // unique: true
  },
  candidate_name: {
    type: DataTypes.STRING,
    required: true,
    allowNull: false
  },
  candidate_email: {
    type: DataTypes.STRING(100),
    required: true,
    allowNull: true
  },
  candidate_phone: {
    type: DataTypes.STRING(15),
    required: true,
    allowNull: true
  },
  gender: {
    type: DataTypes.STRING(15),
    allowNull: true
  },

  dob: {
    type: DataTypes.DATEONLY,
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
    type: DataTypes.STRING(100),
    allowNull: true
  },

  id_number: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  id_doc: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  /* ---------------- CURRENT ADDRESS ---------------- */

  current_address: {
    type: DataTypes.TEXT,
    allowNull: true
  },

  current_landmark: {
    type: DataTypes.TEXT,
    allowNull: true
  },

  current_residency: {
    type: DataTypes.STRING(100),
    allowNull: true
  },

  current_duration: {
    type: DataTypes.STRING(30),
    allowNull: true
  },
  /* ---------------- PERMANENT ADDRESS ---------------- */

  permanent_address: {
    type: DataTypes.TEXT,
    allowNull: true
  },

  permanent_landmark: {
    type: DataTypes.TEXT,
    allowNull: true
  },

  permanent_residency: {
    type: DataTypes.STRING(100),
    allowNull: true
  },

  permanent_duration: {
    type: DataTypes.STRING(30),
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
  address_detail:{
    type: DataTypes.TEXT,
    allowNull: true
  },
  city:{
    type: DataTypes.STRING(100),
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
    type: DataTypes.TEXT,
    allowNull: true
  },

  university: {
    type: DataTypes.TEXT,
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
    type: DataTypes.STRING(100),
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
    type: DataTypes.STRING(10),
    allowNull: true
  },
  degree_status:{//yes/no
    type: DataTypes.ENUM('yes','no'),
    allowNull: true
  },
  edu_doc: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  /* ---------------- CREDIT CHECK ---------------- */
  pan_card:{
    type: DataTypes.STRING(20),
    allowNull: true
  },
  /* ---------------- SOCIAL MEDIA CHECK ---------------- */
  social_media_type:{
    type: DataTypes.STRING(100),
    allowNull: true
  },
  social_media_id:{
    type: DataTypes.TEXT,
    allowNull: true
  },
  nick_name:{
    type: DataTypes.STRING(100),
    allowNull: true
  },
  
  status: {
    type: DataTypes.ENUM('SUBMITED', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETED', 'REJECTED','CLOSED'),
    // enum: ['NEW', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETED', 'CLOSED'],
    allowNull: false,
    defaultValue: 'SUBMITED'
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
  acknowladge:{
    type:DataTypes.BOOLEAN,
    allowNull:true
  },

  //Verified culomns
  /*---------verified identity check-------- */
  verify_id_type: {
    type: DataTypes.STRING(100),
    allowNull: true
  },

  verify_id_number: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
/* ---------------- CURRENT ADDRESS ---------------- */

  verify_current_address: {
    type: DataTypes.TEXT,
    allowNull: true
  },

  verify_current_landmark: {
    type: DataTypes.TEXT,
    allowNull: true
  },

  verify_current_residency: {
    type: DataTypes.STRING(100),
    allowNull: true
  },

  verify_current_duration: {
    type: DataTypes.STRING(30),
    allowNull: true
  },
/* ---------------- PERMANENT ADDRESS ---------------- */

  verify_permanent_address: {
    type: DataTypes.TEXT,
    allowNull: true
  },

  verify_permanent_landmark: {
    type: DataTypes.TEXT,
    allowNull: true
  },

  verify_permanent_residency: {
    type: DataTypes.STRING(100),
    allowNull: true
  },

  verify_permanent_duration: {
    type: DataTypes.STRING(30),
    allowNull: true
  },
/* ---------------- CRIMINAL CHECK ---------------- */

  verify_father_name: {
    type: DataTypes.STRING,
    allowNull: true
  },

  verify_mother_name: {
    type: DataTypes.STRING,
    allowNull: true
  },
  verify_address_detail:{
    type: DataTypes.TEXT,
    allowNull: true
  },
  verify_city:{
    type: DataTypes.STRING(100),
    allowNull: true
  },
  /* ---------------- EDUCATION CHECK ---------------- */

  verify_institute_name: {
    type: DataTypes.TEXT,
    allowNull: true
  },

  verify_university: {
    type: DataTypes.TEXT,
    allowNull: true
  },

  verify_education_start: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },

  verify_education_end: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },

  verify_roll_number: {
    type: DataTypes.STRING(100),
    allowNull: true
  },

  verify_qualification: {
    type: DataTypes.STRING,
    allowNull: true
  },

  verify_specialization: {
    type: DataTypes.STRING,
    allowNull: true
  },

  verify_passing_year: {
    type: DataTypes.STRING(10),
    allowNull: true
  },
  verify_degree_status:{//yes/no
    type: DataTypes.ENUM('yes','no'),
    allowNull: true
  },

  /* ---------------- CREDIT CHECK ---------------- */
  verify_pan_card:{
    type: DataTypes.STRING(20),
    allowNull: true
  },
/* ---------------- SOCIAL MEDIA CHECK ---------------- */
  verify_social_media_type:{
    type: DataTypes.STRING(100),
    allowNull: true
  },
  verify_social_media_id:{
    type: DataTypes.TEXT,
    allowNull: true
  },
  verify_nick_name:{
    type: DataTypes.STRING(100),
    allowNull: true
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
BGVRequest.beforeValidate((instance) => {
  if (!instance.req_code) {
    const ts = Date.now().toString().slice(-6);
    const rand = String(Math.floor(Math.random() * 1000)).padStart(3, '0');

    instance.req_code = `MYS-TRL-BBS-${ts}${rand}`;
  }
});


BGVRequest.beforeCreate(async (instance) => {
  // Fetch client name using clientId
  const client = await Client.findOne({
    where: { id: instance.clientId },
    attributes: ['companyName'], // fetch only what you need
    raw:true
  });

  console.log("client:",client);

  // Get first 3 chars of client name, uppercase, fallback to 'CLT' if not found
  const clientPrefix = client?.companyName
    ? client.companyName.trim().toUpperCase().replace(/\s+/g, '').slice(0, 3)
    : 'CLT';

  const ts = Date.now().toString().slice(-6);
  const rand = String(Math.floor(Math.random() * 1000)).padStart(3, '0');

  instance.req_code = `MYS-${clientPrefix}-BBS-${ts}${rand}`;
});
module.exports = BGVRequest;