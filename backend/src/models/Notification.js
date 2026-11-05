const mongoose = require('mongoose');
const notificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  title: { type: String, required: true },
  content: { type: String, default: '' },
  read: { type: Boolean, default: false, index: true },
}, { timestamps: true });
module.exports = mongoose.model('Notification', notificationSchema);