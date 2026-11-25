import { asyncHandler } from '../../shared/http/async-handler.js';
import { ApiResponse } from '../../shared/http/api-response.js';
import { moderationService } from './moderation.service.js';

export const createReport = asyncHandler(async (req, res) => {
  const report = await moderationService.createReport(req.user._id, req.body);
  return res.status(201).json(new ApiResponse(201, { report }, 'Report submitted for review.'));
});

export const getReports = asyncHandler(async (req, res) => {
  const result = await moderationService.listReports(req.query);
  return res.status(200).json(new ApiResponse(200, result, 'Moderation queue retrieved.'));
});

export const reviewReport = asyncHandler(async (req, res) => {
  const report = await moderationService.reviewReport(req.user._id, req.params.id, req.body);
  return res.status(200).json(new ApiResponse(200, { report }, 'Moderation report reviewed.'));
});
