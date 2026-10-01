import mongoose from 'mongoose';

const sessionSchema = new mongoose.Schema({
  mentor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  learner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  skill: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Skill',
    required: false
  },
  topic: {
    type: String,
    default: 'Skill Exchange Session'
  },
  startTime: {
    type: Date,
    required: true
  },
  endTime: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['Pending', 'Accepted', 'Rejected', 'Rescheduled', 'Completed', 'Cancelled'],
    default: 'Pending'
  },
  acceptedAt: {
    type: Date
  },
  // VC Meeting link fields
  meetingLink: {
    type: String,
    default: ''
  },
  meetingLinkProvider: {
    type: String,
    enum: ['Google Meet', 'Zoom', 'Microsoft Teams', 'Discord', 'Custom Link', 'Other'],
    default: 'Google Meet'
  },
  meetingLinkSharedBy: {
    type: String,
    enum: ['mentor', 'learner', 'either'],
    default: 'either'
  },
  meetingLinkAddedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  meetingLinkAddedAt: {
    type: Date
  },
  notes: {
    type: String,
    default: ''
  },
  remindersSent: {
    type: Boolean,
    default: false
  },
  pointsAwarded: {
    type: Boolean,
    default: false
  },
  sessionStartedAt: {
    type: Date
  },
  sessionEndedAt: {
    type: Date
  },
  actualDurationMinutes: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

sessionSchema.index({ mentor: 1, status: 1, startTime: -1 });
sessionSchema.index({ learner: 1, status: 1, startTime: -1 });

const Session = mongoose.model('Session', sessionSchema);
export default Session;
