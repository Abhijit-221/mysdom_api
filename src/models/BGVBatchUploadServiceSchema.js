const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/db2.config");
const Service = require("./ServiceSchema");

const BatchUploadService = sequelize.define('batch_upload_service', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false
    },
    service_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: Service,
            key: 'id'
        }
    },
}, {
    timestamps: true,
    paranoid: true,
    tableName: 'batch_upload_service'
});

module.exports = BatchUploadService;