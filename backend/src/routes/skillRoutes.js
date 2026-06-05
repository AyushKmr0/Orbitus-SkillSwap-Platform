import express from 'express';
import { getSkills, createSkill } from '../controllers/skillController.js';
import { protect, adminOnly } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.route('/')
  .get(protect, getSkills)
  .post(protect, adminOnly, createSkill);

export default router;
