import mongoose from 'mongoose';

const leaderboardSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  points: {
    type: Number,
    required: true,
    default: 0
  },
  weeklyRank: {
    type: Number,
    default: 0
  },
  monthlyRank: {
    type: Number,
    default: 0
  },
  allTimeRank: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

const Leaderboard = mongoose.model('Leaderboard', leaderboardSchema);
export default Leaderboard;
