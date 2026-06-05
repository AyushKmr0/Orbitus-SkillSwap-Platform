import Review from '../models/Review.js';
import Session from '../models/Session.js';

export const createReview = async (req, res) => {
  const { sessionId, rating, feedback } = req.body;

  try {
    if (!sessionId || !rating || !feedback?.trim()) {
      return res.status(400).json({ success: false, message: 'Session, rating and feedback are required' });
    }

    const session = await Session.findById(sessionId);
    if (!session) {
      return res.status(404).json({ success: false, message: 'Session not found' });
    }

    const isLearner = session.learner.toString() === req.user._id.toString();
    if (!isLearner) {
      return res.status(403).json({ success: false, message: 'Only the learner can review this session' });
    }

    if (session.status !== 'Completed') {
      return res.status(400).json({ success: false, message: 'Only completed sessions can be reviewed' });
    }

    const review = await Review.findOneAndUpdate(
      { session: session._id, reviewer: req.user._id },
      {
        session: session._id,
        reviewer: req.user._id,
        reviewee: session.mentor,
        rating: Math.max(1, Math.min(5, Number(rating))),
        feedback: feedback.trim()
      },
      { new: true, upsert: true, runValidators: true }
    );

    res.status(201).json({ success: true, message: 'Review published successfully', review });
  } catch (error) {
    console.error('Create Review Error:', error.message);
    res.status(500).json({ success: false, message: 'Server error publishing review' });
  }
};
