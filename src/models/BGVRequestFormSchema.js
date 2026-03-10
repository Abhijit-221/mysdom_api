const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/db2.config");
const BGVRequestService = require("./BGVRequestServiceSchema");

const BGVRequestForm = sequelize.define('bgv_request_form', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false
    },
    req_service_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: BGVRequestService,
            key: 'id'
        }
    },
    field_name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    field_value: {
        type: DataTypes.TEXT,
        allowNull: false
    }
}, {
    timestamps: true,
    paranoid: true,
    tableName: 'bgv_request_forms'
});

module.exports = BGVRequestForm;