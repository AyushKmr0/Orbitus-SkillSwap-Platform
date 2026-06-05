import express from 'express';
import {
  getAiMatches,
  generateRoadmap,
  updateRoadmap,
  deleteRoadmap,
  generateResume,
  startMockInterview,
  evaluateInterview
} from '../controllers/aiController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.use(protect); // Guard all AI endpoints

router.get('/match', getAiMatches);
router.post('/roadmap', generateRoadmap);
router.put('/roadmap/:id', updateRoadmap);
router.delete('/roadmap/:id', deleteRoadmap);
router.post('/resume', generateResume);
router.post('/mock-interview/start', startMockInterview);
router.post('/mock-interview/evaluate', evaluateInterview);

export default router;
