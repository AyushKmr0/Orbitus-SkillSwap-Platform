import mongoose from 'mongoose';

const certificateSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  skill: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Skill',
    required: true
  },
  uniqueId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  issueDate: {
    type: Date,
    default: Date.now
  },
  verificationQrCode: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

const Certificate = mongoose.model('Certificate', certificateSchema);
export default Certificate;
