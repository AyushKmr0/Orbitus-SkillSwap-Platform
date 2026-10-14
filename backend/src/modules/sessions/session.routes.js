import express from 'express';
import {
  bookSession,
  respondToSession,
  getSessionHistory,
  updateMeetingLink,
  startSession,
  endSession
} from './session.controller.js';
import { protect } from '../../middlewares/authMiddleware.js';
import { validateRequest } from '../../shared/validation/validate-request.js';
import {
  bookSessionSchema,
  updateMeetingLinkSchema,
  sessionIdParamSchema,
  respondToSessionSchema
} from './session.schema.js';

const router = express.Router();

router.use(protect);

router.post('/book', validateRequest(bookSessionSchema), bookSession);
router.put('/:id/meeting-link', validateRequest(updateMeetingLinkSchema), updateMeetingLink);
router.post('/:id/start', validateRequest(sessionIdParamSchema), startSession);
router.post('/:id/end', validateRequest(sessionIdParamSchema), endSession);
router.put('/:id/respond', validateRequest(respondToSessionSchema), respondToSession);
router.get('/history', getSessionHistory);

export default router;
