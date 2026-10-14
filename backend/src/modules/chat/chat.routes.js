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
} from './chat.controller.js';
import { protect } from '../../middlewares/authMiddleware.js';
import { uploadChatMedia } from '../../middlewares/multer.js';
import { validateObjectIdParam } from '../../shared/validation/validate-request.js';
import { validateRequest } from '../../shared/validation/validate-request.js';
import {
  chatRoomIdParamSchema,
  getMessageHistorySchema
} from './chat.schema.js';

const router = express.Router();

router.use(protect);

router.get('/active', getActiveChats);
router.get('/blocked', getBlockedChatPartners);
router.post('/upload', uploadChatMedia.single('file'), uploadChatFile);

router.put('/users/:partnerId/remove', validateObjectIdParam('partnerId'), removeChatPartner);
router.put('/users/:partnerId/block', validateObjectIdParam('partnerId'), blockChatPartner);
router.put('/users/:partnerId/unblock', validateObjectIdParam('partnerId'), unblockChatPartner);

router.get('/:chatRoomId', validateRequest(getMessageHistorySchema), getMessageHistory);
router.put('/:chatRoomId/seen', validateRequest(chatRoomIdParamSchema), markAsSeen);
router.delete('/:chatRoomId', validateRequest(chatRoomIdParamSchema), deleteConversationForMe);

export default router;
