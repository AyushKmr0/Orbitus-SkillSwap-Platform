import mongoose from 'mongoose';

const chatPreferenceSchema = new mongoose.Schema({
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  partner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  isRemoved: {
    type: Boolean,
    default: false
  },
  isBlocked: {
    type: Boolean,
    default: false
  },
  removedAt: {
    type: Date,
    default: null
  },
  blockedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

chatPreferenceSchema.index({ owner: 1, partner: 1 }, { unique: true });
chatPreferenceSchema.index({ owner: 1, isRemoved: 1, isBlocked: 1 });

const ChatPreference = mongoose.model('ChatPreference', chatPreferenceSchema);
export default ChatPreference;
