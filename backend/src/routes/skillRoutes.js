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
} from '../controllers/skillController.js';
import { protect, adminOnly } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.route('/')
  .get(protect, getSkills)
  .post(protect, adminOnly, createSkill);

router.post('/request', protect, requestSkill);
router.get('/requests', protect, getSkillRequests);
router.put('/requests/:id/approve', protect, adminOnly, approveSkillRequest);
router.put('/requests/:id/reject', protect, adminOnly, rejectSkillRequest);

router.route('/:id')
  .put(protect, adminOnly, updateSkill)
  .delete(protect, adminOnly, deleteSkill);

export default router;
