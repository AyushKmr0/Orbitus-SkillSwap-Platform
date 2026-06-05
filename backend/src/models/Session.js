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
  }
}, {
  timestamps: true
});

const Session = mongoose.model('Session', sessionSchema);
export default Session;
