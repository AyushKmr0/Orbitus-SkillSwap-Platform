import express from 'express';
import {
  getNotificationSummary,
  getNotifications,
  markNotificationsRead
} from './notification.controller.js';
import { protect } from '../../middlewares/authMiddleware.js';
import { validateRequest } from '../../shared/validation/validate-request.js';
import {
  getNotificationsQuerySchema,
  markNotificationsReadSchema
} from './notification.schema.js';

const router = express.Router();

router.use(protect);

router.get('/summary', getNotificationSummary);
router.get('/', validateRequest(getNotificationsQuerySchema), getNotifications);
router.put('/read', validateRequest(markNotificationsReadSchema), markNotificationsRead);

export default router;
