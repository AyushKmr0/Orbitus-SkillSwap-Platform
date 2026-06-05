import express from 'express';
import { bookSession, respondToSession, getSessionHistory } from '../controllers/sessionController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.use(protect); // Guard all booking endpoints

router.post('/book', bookSession);
router.put('/:id/respond', respondToSession);
router.get('/history', getSessionHistory);

export default router;
