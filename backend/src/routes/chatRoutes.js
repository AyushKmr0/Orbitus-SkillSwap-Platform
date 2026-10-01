import express from 'express';
import {
  blockChatPartner,
  deleteConversationForMe,
  getActiveChats,
  getBlockedChatPartners,
  getMessageHistory,
  markAsSeen,
  removeChatPartner,
  unblockChatPartner,
  uploadChatFile
} from '../controllers/chatController.js';
import { protect } from '../middlewares/authMiddleware.js';
import { uploadChatMedia } from '../middlewares/multer.js';

const router = express.Router();

router.use(protect);

router.get('/active', getActiveChats);
router.get('/blocked', getBlockedChatPartners);
router.post('/upload', uploadChatMedia.single('file'), uploadChatFile);
router.put('/users/:partnerId/remove', removeChatPartner);
router.put('/users/:partnerId/block', blockChatPartner);
router.put('/users/:partnerId/unblock', unblockChatPartner);
router.get('/:chatRoomId', getMessageHistory);
router.put('/:chatRoomId/seen', markAsSeen);
router.delete('/:chatRoomId', deleteConversationForMe);

export default router;
