import mongoose from 'mongoose';

const feedbackSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    category: {
      type: String,
      enum: ['Bug Report', 'Feature Request', 'Platform Feedback', 'Support / Help', 'Other'],
      default: 'Platform Feedback'
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
      default: 5
    },
    subject: {
      type: String,
      trim: true,
      default: ''
    },
    message: {
      type: String,
      required: [true, 'Feedback message is required'],
      trim: true
    },
    status: {
      type: String,
      enum: ['unread', 'reviewed', 'resolved'],
      default: 'unread'
    },
    adminNotes: {
      type: String,
      default: ''
    }
  },
  {
    timestamps: true
  }
);

export default mongoose.model('Feedback', feedbackSchema);
