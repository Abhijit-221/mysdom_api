const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/db2.config");
const BGVRequest = require("./BGVRequestSchema");

const BGVEmployment = sequelize.define("bgv_request_employments", {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },

  bgvRequestId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: BGVRequest,
      key: "id"
    }
  },

  company_name: {
    type: DataTypes.STRING,
    allowNull:false,
  },

  employee_id: {
    type: DataTypes.STRING,
    allowNull:false
  },

  employment_start: {
    type: DataTypes.DATEONLY,
    allowNull:true
  },
  isCurrent:{
    type: DataTypes.BOOLEAN,
    allowNull:true,
    defaultValue:false
  },
  employment_end: {
    type: DataTypes.DATEONLY,
    allowNull:true
  },

  job_title: {
    type: DataTypes.STRING,
    allowNull:true
  },

  leaving_reason: {
    type: DataTypes.STRING,
    allowNull:true
  },

  job_doc: {
    type: DataTypes.STRING,
    allowNull:true
  }

}, {
  timestamps: true,
  paranoid:true,
  tableName: "bgv_request_employments"
});

module.exports = BGVEmployment;

