import express from 'express';
import { getSkills, createSkill, updateSkill, deleteSkill } from '../controllers/skillController.js';
import { protect, adminOnly } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.route('/')
  .get(protect, getSkills)
  .post(protect, adminOnly, createSkill);

router.route('/:id')
  .put(protect, adminOnly, updateSkill)
  .delete(protect, adminOnly, deleteSkill);

export default router;
