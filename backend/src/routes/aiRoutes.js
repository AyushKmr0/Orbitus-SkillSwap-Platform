import express from 'express';
import {
  getAiMatches,
  generateRoadmap,
  updateRoadmap,
  deleteRoadmap,
  getCustomAiKeyStatus,
  saveCustomAiKey
} from '../controllers/aiController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.use(protect); // Guard all AI endpoints

router.get('/match', getAiMatches);
router.post('/roadmap', generateRoadmap);
router.put('/roadmap/:id', updateRoadmap);
router.delete('/roadmap/:id', deleteRoadmap);

// Personal AI connection routes
router.get('/custom-key', getCustomAiKeyStatus);
router.put('/custom-key', saveCustomAiKey);

export default router;
