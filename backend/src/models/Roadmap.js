import mongoose from 'mongoose';

const roadmapSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  topic: {
    type: String,
    required: true,
    trim: true
  },
  roadmapData: {
    type: mongoose.Schema.Types.Mixed, // Stores the full structured week-by-week JSON array
    required: true
  },
  progress: {
    type: Number,
    default: 0 // Percentage completion from 0 to 100
  }
}, {
  timestamps: true
});

const Roadmap = mongoose.model('Roadmap', roadmapSchema);
export default Roadmap;
