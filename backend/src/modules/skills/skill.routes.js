import express from 'express';
import {
  getSkills,
  createSkill,
  updateSkill,
  deleteSkill,
  requestSkill,
  getSkillRequests,
  approveSkillRequest,
  rejectSkillRequest
} from './skill.controller.js';
import { protect, adminOnly } from '../../middlewares/authMiddleware.js';
import { validateRequest } from '../../shared/validation/validate-request.js';
import { requireFeatureFlag } from '../../config/featureFlags.js';
import { requireAdminPermission } from '../../middlewares/adminPermissions.js';
import { auditAdminMutation } from '../../services/adminAuditService.js';
import {
  createSkillSchema,
  updateSkillSchema,
  skillIdParamSchema,
  requestSkillSchema,
  rejectSkillRequestSchema
} from './skill.schema.js';

const router = express.Router();

router.route('/')
  .get(protect, getSkills)
  .post(protect, adminOnly, requireAdminPermission('content.manage'), auditAdminMutation('create_skill', 'skill'), validateRequest(createSkillSchema), createSkill);

router.post('/request', protect, requireFeatureFlag('skillRequestsEnabled'), validateRequest(requestSkillSchema), requestSkill);
router.get('/requests', protect, getSkillRequests);
router.put('/requests/:id/approve', protect, adminOnly, requireAdminPermission('content.manage'), auditAdminMutation('approve_skill_request', 'skill_request'), validateRequest(skillIdParamSchema), approveSkillRequest);
router.put('/requests/:id/reject', protect, adminOnly, requireAdminPermission('content.manage'), auditAdminMutation('reject_skill_request', 'skill_request'), validateRequest(rejectSkillRequestSchema), rejectSkillRequest);

router.route('/:id')
  .put(protect, adminOnly, requireAdminPermission('content.manage'), auditAdminMutation('update_skill', 'skill'), validateRequest(updateSkillSchema), updateSkill)
  .delete(protect, adminOnly, requireAdminPermission('content.manage'), auditAdminMutation('delete_skill', 'skill'), validateRequest(skillIdParamSchema), deleteSkill);

export default router;
