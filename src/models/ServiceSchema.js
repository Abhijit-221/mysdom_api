
const mongoose = require('mongoose');
const serviceSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: {
    type: String,
    required: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  updatedBy: {
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

module.exports = mongoose.model('Service', serviceSchema);