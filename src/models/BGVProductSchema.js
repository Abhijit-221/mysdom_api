
const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/db2.config");
const BGVRequest = require("./BGVRequestSchema");
const User = require("./UserSchema");
const Product = require("./ProductSchema");
const BGVRequestProduct = sequelize.define('bgv_request_product', {
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
  productId: {
    type: DataTypes.UUID,
    references: {
      model: Product,
      key: 'id'
    },
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('SUBMITED', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETED', 'REJECTED','CLOSED'),
    defaultValue: 'SUBMITED'
  },
  doc_1:{
    type: DataTypes.STRING,
    allowNull: true
  },
  doc_2:{
    type: DataTypes.STRING,
    allowNull: true
  },
  mode_of_verification:{
     type: DataTypes.STRING,
    allowNull: true
  },
  verifier_comment:{
    type: DataTypes.TEXT,
    allowNull: true
  },
  final_desc:{
    type: DataTypes.TEXT,
    allowNull: true
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
  tableName: 'bgv_request_product'
});
module.exports = BGVRequestProduct;