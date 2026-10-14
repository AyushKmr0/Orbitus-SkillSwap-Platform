import feedbackService from './feedback.service.js';
import { asyncHandler, ApiResponse } from '../../shared/index.js';

export const submitFeedback = asyncHandler(async (req, res) => {
  const { category, rating, subject, message } = req.body;
  const feedback = await feedbackService.submitFeedback({
    userId: req.user._id,
    userName: req.user.name,
    category,
    rating,
    subject,
    message
  });

  return res.status(201).json(
    new ApiResponse(201, { feedback }, 'Thank you! Your feedback has been sent directly to the admin team.')
  );
});

export const getMyFeedbacks = asyncHandler(async (req, res) => {
  const feedbacks = await feedbackService.getMyFeedbacks(req.user._id);

  return res.status(200).json(
    new ApiResponse(200, { feedbacks }, 'Your feedback history retrieved')
  );
});

export const getAdminFeedbacks = asyncHandler(async (req, res) => {
  const { status, category } = req.query;
  const result = await feedbackService.getAdminFeedbacks({ status, category });

  return res.status(200).json({
    success: true,
    feedbacks: result.feedbacks,
    unreadCount: result.unreadCount
  });
});

export const updateFeedbackStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status, adminNotes } = req.body;

  const feedback = await feedbackService.updateFeedbackStatus(id, {
    status,
    adminNotes,
    adminId: req.user._id
  });

  return res.status(200).json(
    new ApiResponse(200, { feedback }, 'Feedback updated successfully.')
  );
});

export const deleteFeedback = asyncHandler(async (req, res) => {
  const { id } = req.params;
  await feedbackService.deleteFeedback(id);

  return res.status(200).json(
    new ApiResponse(200, null, 'Feedback entry deleted successfully.')
  );
});
