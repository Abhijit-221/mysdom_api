const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/db2.config");
const Client = require("./ClientSchema");

const ClientBatchUploadDocs = sequelize.define('client_batchupload_doc', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false
    },
    client_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: Client,
            key: 'id'
        }
    },
    file_path:{
        type:DataTypes.TEXT,
        allowNull:false
    },
    file_size:{
        type:DataTypes.STRING(45),
        allowNull:false
    },
}, {
    timestamps: true,
    paranoid: true,
    tableName: 'client_batchupload_doc'
});

module.exports = ClientBatchUploadDocs;