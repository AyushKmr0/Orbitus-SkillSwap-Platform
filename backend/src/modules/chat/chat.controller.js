import { asyncHandler } from '../../shared/http/async-handler.js';
import { ApiResponse } from '../../shared/http/api-response.js';
import {
  chatService,
  encodeCursor,
  parseCursor,
  getPartnerIdFromRoom
} from './chat.service.js';

export { encodeCursor, parseCursor, getPartnerIdFromRoom };

export class ChatController {
  constructor(service = chatService) {
    this.service = service;
  }

  uploadChatFile = asyncHandler(async (req, res) => {
    const result = await this.service.uploadChatFile(req.file, {
      protocol: req.protocol,
      host: req.get('host')
    });

    return res.status(201).json(
      new ApiResponse(201, result, 'File uploaded successfully')
    );
  });

  getMessageHistory = asyncHandler(async (req, res) => {
    const { chatRoomId } = req.params;
    const cursor = req.query.cursor || req.query.before;
    const limit = req.query.limit;

    const result = await this.service.getMessageHistory(chatRoomId, req.user, {
      limit,
      cursor
    });

    return res.status(200).json(
      new ApiResponse(200, result, 'Message logs retrieved')
    );
  });

  getActiveChats = asyncHandler(async (req, res) => {
    const chats = await this.service.getActiveChats(req.user._id);
    return res.status(200).json(
      new ApiResponse(200, { chats }, 'Active chat list retrieved')
    );
  });

  getBlockedChatPartners = asyncHandler(async (req, res) => {
    const blockedUsers = await this.service.getBlockedChatPartners(req.user._id);
    return res.status(200).json(
      new ApiResponse(200, { blockedUsers }, 'Blocked partners retrieved')
    );
  });

  markAsSeen = asyncHandler(async (req, res) => {
    await this.service.markAsSeen(req.params.chatRoomId, req.user);
    return res.status(200).json(
      new ApiResponse(200, null, 'Messages marked as read')
    );
  });

  removeChatPartner = asyncHandler(async (req, res) => {
    await this.service.removeChatPartner(req.user._id, req.params.partnerId);
    return res.status(200).json(
      new ApiResponse(200, null, 'Chat partner removed from active view')
    );
  });

  toggleBlockUser = asyncHandler(async (req, res) => {
    const isBlocked = await this.service.toggleBlockUser(req.user._id, req.params.partnerId);
    return res.status(200).json(
      new ApiResponse(200, { isBlocked }, isBlocked ? 'User blocked' : 'User unblocked')
    );
  });

  blockChatPartner = asyncHandler(async (req, res) => {
    await this.service.blockChatPartner(req.user._id, req.params.partnerId);
    return res.status(200).json(
      new ApiResponse(200, { isBlocked: true }, 'Chat partner blocked successfully')
    );
  });

  unblockChatPartner = asyncHandler(async (req, res) => {
    await this.service.unblockChatPartner(req.user._id, req.params.partnerId);
    return res.status(200).json(
      new ApiResponse(200, { isBlocked: false }, 'Chat partner unblocked successfully')
    );
  });

  deleteConversationForMe = asyncHandler(async (req, res) => {
    await this.service.deleteConversationForMe(req.params.chatRoomId, req.user._id);
    return res.status(200).json(
      new ApiResponse(200, null, 'Conversation cleared for user')
    );
  });
}

export const chatController = new ChatController();
export const {
  uploadChatFile,
  getMessageHistory,
  getActiveChats,
  getBlockedChatPartners,
  markAsSeen,
  removeChatPartner,
  toggleBlockUser,
  blockChatPartner,
  unblockChatPartner,
  deleteConversationForMe
} = chatController;
