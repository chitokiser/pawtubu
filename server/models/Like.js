
const mongoose = require('mongoose');

const LikeSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Content',
    required: true
  }
}, { timestamps: true });

// Prevent user from liking the same content multiple times
LikeSchema.index({ user: 1, content: 1 }, { unique: true });

module.exports = mongoose.model('Like', LikeSchema);
