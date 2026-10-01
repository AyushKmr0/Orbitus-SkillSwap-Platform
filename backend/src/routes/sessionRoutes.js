import express from 'express';
import {
  bookSession,
  respondToSession,
  getSessionHistory,
  updateMeetingLink,
  startSession,
  endSession
} from '../controllers/sessionController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.post('/book', bookSession);
router.put('/:id/meeting-link', updateMeetingLink);
router.post('/:id/start', startSession);
router.post('/:id/end', endSession);
router.put('/:id/respond', respondToSession);
router.get('/history', getSessionHistory);

export default router;
