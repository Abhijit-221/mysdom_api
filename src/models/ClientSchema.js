const mongoose = require('mongoose');
const clientSchema = new mongoose.Schema({
    companyName: { type: String, required: true },
    contactEmail: {
        type: String,
        required: true,
        // unique: true,
        lowercase: true,
        trim: true
    },
    contactPhone: {
        type: String,
        required: true,
        // unique: false,
        trim: true
    },
    address: {
        type: String,
        required: false,
        trim: true
    },

    slaDays: {
        type: String,
        required: false,
        trim: true
    },

    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    updateddBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },  
    isActive:{
        type: Boolean,
        default: true
    },
    is_deleted:{
        type: Boolean,
        default: false
    }

}, { timestamps: true });
clientSchema.index({ companyName: 'text', contactEmail: 'text',contactPhone: 'text' });
const Client = mongoose.model('Client', clientSchema);
module.exports = Client;
