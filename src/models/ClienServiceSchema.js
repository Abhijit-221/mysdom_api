const mongoose = require('mongoose');
const clientServiceSchema = new mongoose.Schema({
    clientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Client',
        required: true
    },

    serviceId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Service',
        required: true
    },

    tatDays: {
        type: Number,
        required: true
    },
    isActive: {
        type: Boolean, default: true
    },
    is_deleted: {
        type: Boolean,
        default: false
    }

}, { timestamps: true });

module.exports = mongoose.model('ClientService', clientServiceSchema);
