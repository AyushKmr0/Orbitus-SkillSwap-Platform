import express from 'express';
import { protect, adminOnly } from '../../middlewares/authMiddleware.js';
import { requireAdminPermission } from '../../middlewares/adminPermissions.js';
import { auditAdminMutation } from '../../services/adminAuditService.js';
import { validateRequest } from '../../shared/validation/validate-request.js';
import {
  createReport,
  getReports,
  reviewReport
} from './moderation.controller.js';
import {
  createModerationReportSchema,
  listModerationReportsSchema,
  reviewModerationReportSchema
} from './moderation.schema.js';

const router = express.Router();

router.post('/reports', protect, validateRequest(createModerationReportSchema), createReport);
router.get(
  '/admin/reports',
  protect,
  adminOnly,
  requireAdminPermission('moderation.manage'),
  validateRequest(listModerationReportsSchema),
  getReports
);
router.put(
  '/admin/reports/:id',
  protect,
  adminOnly,
  requireAdminPermission('moderation.manage'),
  auditAdminMutation('review_moderation_report', 'moderation_report'),
  validateRequest(reviewModerationReportSchema),
  reviewReport
);

export default router;
