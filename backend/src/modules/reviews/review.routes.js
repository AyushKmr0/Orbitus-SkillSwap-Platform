import express from 'express';
import { createReview } from './review.controller.js';
import { protect } from '../../middlewares/authMiddleware.js';
import { validateRequest } from '../../shared/validation/validate-request.js';
import { createReviewSchema } from './review.schema.js';

const router = express.Router();

router.use(protect);
router.post('/', validateRequest(createReviewSchema), createReview);

export default router;
