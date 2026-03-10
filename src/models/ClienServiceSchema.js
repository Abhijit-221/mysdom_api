// const mongoose = require('mongoose');
// const clientServiceSchema = new mongoose.Schema({
//     clientId: {
//         type: mongoose.Schema.Types.ObjectId,
//         ref: 'Client',
//         required: true
//     },


//     serviceId: {
//         type: mongoose.Schema.Types.ObjectId,
//         ref: 'Service',
//         required: true
//     },

//     tatDays: {
//         type: Number,
//         required: true
//     },
//     isActive: {
//         type: Boolean, default: true
//     },
//     is_deleted: {
//         type: Boolean,
//         default: false
//     }

// }, { timestamps: true });

// module.exports = mongoose.model('ClientService', clientServiceSchema);

const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/db2.config");
const Client = require("./ClientSchema");
const Service = require("./ServiceSchema");
const ClientService = sequelize.define('client_services', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false
    },
    clientId: {
        type: DataTypes.UUID,
        ref: Client,
        required: true
    },
    serviceId: {
        type: DataTypes.UUID,
        ref: Service,
        required: true
    },

    tatDays: {
        type: DataTypes.INTEGER,
        required: true
    },
    isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    }
}, {
    timestamps: true,
    paranoid: true,
    tableName: 'client_services'
});

module.exports = ClientService;
