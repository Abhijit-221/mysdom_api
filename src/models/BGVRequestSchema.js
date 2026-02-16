const mongoose = require('mongoose');

const bgvRequestSchema = new mongoose.Schema({
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client',
    required: true
  },

  candidate: {
    name: {
        type:String,
        required:true
    },
    email: {
        type:String,
        required:true
    },
    phone: {
        type:String,
        required:true
    }
  },

  status: {
    type: String,
    enum: ['NEW', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETED', 'CLOSED'],
    default: 'NEW'
  },

  priority: {
    type: String,
    enum: ['LOW', 'MEDIUM', 'HIGH'],
    default: 'MEDIUM'
  },

  submittedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },

  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },

  slaDueDate: Date,
  is_deleted:{
    type: Boolean,
    default: false
  }

}, { timestamps: true });

module.exports = mongoose.model('BGVRequest', bgvRequestSchema);
