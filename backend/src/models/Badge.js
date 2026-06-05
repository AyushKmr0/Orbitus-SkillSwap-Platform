import mongoose from 'mongoose';

const badgeSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true,
    enum: ['Beginner Mentor', 'Skilled Mentor', 'Master Mentor', 'Top Contributor']
  },
  unlockedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Avoid duplicate badges for same user
badgeSchema.index({ user: 1, name: 1 }, { unique: true });

const Badge = mongoose.model('Badge', badgeSchema);
export default Badge;
