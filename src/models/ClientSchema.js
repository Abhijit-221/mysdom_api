// const mongoose = require('mongoose');
// const clientSchema = new mongoose.Schema({
//     companyName: { type: String, required: true },
//     contactEmail: {
//         type: String,
//         required: true,
//         // unique: true,
//         lowercase: true,
//         trim: true
//     },
//     contactPhone: {
//         type: String,
//         required: true,
//         // unique: false,
//         trim: true
//     },
//     address: {
//         type: String,
//         required: false,
//         trim: true
//     },


//     slaDays: {
//         type: String,
//         required: false,
//         trim: true
//     },

//     createdBy: {
//         type: mongoose.Schema.Types.ObjectId,
//         ref: 'User'
//     },
//     updateddBy: {
//         type: mongoose.Schema.Types.ObjectId,
//         ref: 'User'
//     },  
//     isActive:{
//         type: Boolean,
//         default: true
//     },
//     is_deleted:{
//         type: Boolean,
//         default: false
//     }

// }, { timestamps: true });
// clientSchema.index({ companyName: 'text', contactEmail: 'text',contactPhone: 'text' });
// const Client = mongoose.model('Client', clientSchema);
// module.exports = Client;

const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/db2.config");
const Client = sequelize.define('client', {
    id:{
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false
    },
    companyName: {
        type: DataTypes.STRING,
        allowNull: false
    },
    contactEmail: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            isEmail: true
        }
    },
    contactPhone: {
        type: DataTypes.STRING,
        allowNull: false
    },
    address: {
        type: DataTypes.STRING,
        allowNull: true
    },
    slaDays: {
        type: DataTypes.STRING,
        allowNull: true
    },
    createdBy: {
        type: DataTypes.UUID,
        allowNull: true,
    },
    updatedBy: {
        type: DataTypes.UUID,
        allowNull: true,
    },
    isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    },
},
    {
        tableName: 'client',
        timestamps: true,
        paranoid: true,
    }
);


// Client.belongsTo(User, { as: 'creator', foreignKey: 'createdBy',targetKey: 'id' });
// Client.belongsTo(User, { as: 'updater', foreignKey: 'updatedBy',targetKey: 'id' });
// User.hasMany(Client, { as: 'createdClients', foreignKey: 'createdBy',sourceKey: 'id' });
// User.hasMany(Client, { as: 'updatedClients', foreignKey: 'updatedBy',sourceKey: 'id' });
module.exports = Client;