
const mongoose = require('mongoose');
const requestServiceSchema = new mongoose.Schema({
  requestId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'BGVRequest',
    required: true
  },

  serviceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Service'
  },

  status: {
    type: String,
    enum: ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'FAILED'],
    default: 'PENDING'
  },

  remarks: String,
  completedAt: Date,
  is_deleted:{
    type: Boolean,
    default: false
  }

}, { timestamps: true });

module.exports = mongoose.model('RequestService', requestServiceSchema);
