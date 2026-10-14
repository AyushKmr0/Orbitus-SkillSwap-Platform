import mongoose from 'mongoose';

const userActivitySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    activityType: {
      type: String,
      enum: ['daily_login', 'session_completed', 'resource_shared', 'post_created'],
      required: true,
      index: true
    },
    pointsAwarded: {
      type: Number,
      default: 0
    },
    dateKey: {
      type: String, // 'YYYY-MM-DD'
      required: true,
      index: true
    },
    idempotencyKey: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: () => ({})
    }
  },
  {
    timestamps: true,
    bufferCommands: false
  }
);

userActivitySchema.set('bufferCommands', false);

userActivitySchema.index({ user: 1, dateKey: 1 });
userActivitySchema.index({ user: 1, createdAt: -1 });
userActivitySchema.index({ activityType: 1, createdAt: -1 });
userActivitySchema.index({ createdAt: 1 });

const UserActivity = mongoose.models.UserActivity || mongoose.model('UserActivity', userActivitySchema);

export default UserActivity;
