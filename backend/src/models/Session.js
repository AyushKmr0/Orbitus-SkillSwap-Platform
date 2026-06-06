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
    required: true
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
  jitsiRoomId: {
    type: String,
    required: true
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
  actualStartTime: {
    type: Date
  },
  actualEndTime: {
    type: Date
  },
  actualDurationMinutes: {
    type: Number,
    default: 0
  },
  roomStartedAt: {
    type: Date
  },
  roomStartedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  attendance: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    role: {
      type: String,
      enum: ['mentor', 'learner'],
      required: true
    },
    joinedAt: {
      type: Date,
      required: true
    },
    leftAt: {
      type: Date
    },
    durationMinutes: {
      type: Number,
      default: 0
    }
  }]
}, {
  timestamps: true
});

const Session = mongoose.model('Session', sessionSchema);
export default Session;
