import express from 'express';
import { getNotificationSummary, getNotifications, markNotificationsRead } from '../controllers/notificationController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.get('/summary', getNotificationSummary);
router.get('/', getNotifications);
router.put('/read', markNotificationsRead);

export default router;
