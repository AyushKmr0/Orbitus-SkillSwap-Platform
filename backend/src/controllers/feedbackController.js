import Feedback from '../models/Feedback.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
import { asyncHandler, ApiError } from '../utils/index.js';

export const submitFeedback = asyncHandler(async (req, res) => {
  const { category, rating, subject, message } = req.body;

  if (!message || !message.trim()) {
    throw new ApiError(400, 'Please provide a feedback message.');
  }

  const feedback = await Feedback.create({
    user: req.user._id,
    category: category || 'Platform Feedback',
    rating: Number(rating) || 5,
    subject: subject?.trim() || '',
    message: message.trim()
  });

  // Notify Admins about new user feedback
  try {
    const adminUsers = await User.find({ role: { $in: ['admin', 'Admin'] } }).select('_id');
    const adminNotifications = adminUsers.map((adm) => ({
      recipient: adm._id,
      sender: req.user._id,
      type: 'feedback',
      title: `New User Feedback: ${category || 'General'}`,
      message: `${req.user.name} submitted feedback: "${subject || message.slice(0, 50)}..."`,
      link: '/admin?tab=feedbacks'
    }));

    if (adminNotifications.length > 0) {
      await Notification.insertMany(adminNotifications);
    }
  } catch (notifErr) {
    console.error('Failed to create admin notification for feedback:', notifErr.message);
  }

  res.status(201).json({
    success: true,
    message: 'Thank you! Your feedback has been sent directly to the admin team.',
    feedback
  });
});

export const getMyFeedbacks = asyncHandler(async (req, res) => {
  const feedbacks = await Feedback.find({ user: req.user._id })
    .sort({ createdAt: -1 })
    .limit(30);

  res.status(200).json({
    success: true,
    feedbacks
  });
});

export const getAdminFeedbacks = asyncHandler(async (req, res) => {
  const { status, category } = req.query;
  const filter = {};

  if (status && status !== 'all') {
    filter.status = status;
  }
  if (category && category !== 'all') {
    filter.category = category;
  }

  const feedbacks = await Feedback.find(filter)
    .populate('user', 'name username email profileImage role')
    .sort({ createdAt: -1 });

  const unreadCount = await Feedback.countDocuments({ status: 'unread' });

  res.status(200).json({
    success: true,
    feedbacks,
    unreadCount
  });
});

export const updateFeedbackStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status, adminNotes } = req.body;

  const feedback = await Feedback.findById(id);
  if (!feedback) {
    throw new ApiError(404, 'Feedback entry not found.');
  }

  if (status) feedback.status = status;
  if (adminNotes !== undefined) feedback.adminNotes = adminNotes;

  await feedback.save();

  res.status(200).json({
    success: true,
    message: 'Feedback updated successfully.',
    feedback
  });
});

export const deleteFeedback = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const feedback = await Feedback.findById(id);
  if (!feedback) {
    throw new ApiError(404, 'Feedback entry not found.');
  }

  await feedback.deleteOne();

  res.status(200).json({
    success: true,
    message: 'Feedback entry deleted successfully.'
  });
});
