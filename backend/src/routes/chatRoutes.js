import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
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

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    fs.mkdirSync('uploads', { recursive: true });
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const safeName = file.originalname.replace(/[^a-z0-9.]+/gi, '-').toLowerCase();
    cb(null, `${Date.now()}-${safeName}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.pdf', '.doc', '.docx', '.txt'];
    const extension = path.extname(file.originalname).toLowerCase();
    cb(null, allowed.includes(extension));
  }
});

router.use(protect); // Guard all message endpoints

router.get('/active', getActiveChats);
router.get('/blocked', getBlockedChatPartners);
router.post('/upload', upload.single('file'), uploadChatFile);
router.put('/users/:partnerId/remove', removeChatPartner);
router.put('/users/:partnerId/block', blockChatPartner);
router.put('/users/:partnerId/unblock', unblockChatPartner);
router.get('/:chatRoomId', getMessageHistory);
router.put('/:chatRoomId/seen', markAsSeen);
router.delete('/:chatRoomId', deleteConversationForMe);

export default router;
