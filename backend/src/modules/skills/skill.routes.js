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
  .post(protect, adminOnly, validateRequest(createSkillSchema), createSkill);

router.post('/request', protect, validateRequest(requestSkillSchema), requestSkill);
router.get('/requests', protect, getSkillRequests);
router.put('/requests/:id/approve', protect, adminOnly, validateRequest(skillIdParamSchema), approveSkillRequest);
router.put('/requests/:id/reject', protect, adminOnly, validateRequest(rejectSkillRequestSchema), rejectSkillRequest);

router.route('/:id')
  .put(protect, adminOnly, validateRequest(updateSkillSchema), updateSkill)
  .delete(protect, adminOnly, validateRequest(skillIdParamSchema), deleteSkill);

export default router;
