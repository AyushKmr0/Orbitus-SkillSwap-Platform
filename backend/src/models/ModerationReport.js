import mongoose from 'mongoose';

const moderationReportSchema = new mongoose.Schema(
  {
    reporter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    targetType: {
      type: String,
      enum: ['post', 'group'],
      required: true
    },
    targetId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true
    },
    reason: {
      type: String,
      enum: ['spam', 'harassment', 'inappropriate', 'misinformation', 'other'],
      required: true
    },
    details: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: ''
    },
    status: {
      type: String,
      enum: ['pending', 'resolved', 'dismissed'],
      default: 'pending',
      index: true
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    reviewedAt: {
      type: Date,
      default: null
    },
    resolutionNote: {
      type: String,
      trim: true,
      maxlength: 500,
      default: ''
    }
  },
  { timestamps: true }
);

moderationReportSchema.index(
  { reporter: 1, targetType: 1, targetId: 1, status: 1 },
  { unique: true, partialFilterExpression: { status: 'pending' } }
);
moderationReportSchema.index({ status: 1, createdAt: -1 });

const ModerationReport =
  mongoose.models.ModerationReport ||
  mongoose.model('ModerationReport', moderationReportSchema);

export default ModerationReport;
