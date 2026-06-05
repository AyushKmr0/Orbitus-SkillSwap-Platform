import mongoose from 'mongoose';

const skillSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    index: true
  },
  category: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  tags: [{
    type: String,
    trim: true
  }],
  description: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

const Skill = mongoose.model('Skill', skillSchema);
export default Skill;
