import express from 'express';
import {
  bookSession,
  respondToSession,
  getSessionHistory,
  joinSession,
  leaveSession
} from '../controllers/sessionController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.use(protect); // Guard all booking endpoints

router.post('/book', bookSession);
router.post('/:id/join', joinSession);
router.post('/:id/leave', leaveSession);
router.put('/:id/respond', respondToSession);
router.get('/history', getSessionHistory);

export default router;
