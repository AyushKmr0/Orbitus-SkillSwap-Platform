import express from 'express';
import {
  getAiMatches,
  generateRoadmap,
  updateRoadmap,
  deleteRoadmap,
  getCustomAiKeyStatus,
  saveCustomAiKey
} from './ai.controller.js';
import { protect } from '../../middlewares/authMiddleware.js';

const router = express.Router();

// Guard all AI endpoints with JWT authentication
router.use(protect);

router.get('/match', getAiMatches);
router.post('/roadmap', generateRoadmap);
router.put('/roadmap/:id', updateRoadmap);
router.delete('/roadmap/:id', deleteRoadmap);

// Personal AI provider connection routes
router.get('/custom-key', getCustomAiKeyStatus);
router.put('/custom-key', saveCustomAiKey);

export default router;
