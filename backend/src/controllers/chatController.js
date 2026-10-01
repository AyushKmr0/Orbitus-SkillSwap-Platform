import path from 'path';
import Message from '../models/Message.js';
import User from '../models/User.js';
import ChatPreference from '../models/ChatPreference.js';
import {
  asyncHandler,
  ApiError,
  ApiResponse,
  uploadOnCloudinary
} from '../utils/index.js';

const getPartnerIdFromRoom = (chatRoomId, currentUserId) => {
  const current = currentUserId.toString();
  return String(chatRoomId || '').split('_').find((id) => id !== current) || '';
};

const ensureCanViewChat = async (currentUserId, partnerId) => {
  if (!partnerId) {
    throw new ApiError(400, 'Invalid chat room');
  }

  const [ownPreference, partnerPreference] = await Promise.all([
    ChatPreference.findOne({ owner: currentUserId, partner: partnerId }).lean(),
    ChatPreference.findOne({ owner: partnerId, partner: currentUserId, isBlocked: true }).lean()
  ]);

  if (ownPreference?.isBlocked || partnerPreference?.isBlocked) {
    throw new ApiError(403, 'Chat is blocked');
  }

  return true;
};

export const uploadChatFile = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new ApiError(400, 'No file uploaded');
  }

  const extension = path.extname(req.file.originalname).toLowerCase();
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
  const fileType = imageExtensions.includes(extension) ? 'image' : 'pdf';

  let fileUrl = '';
  const cloudinaryResult = await uploadOnCloudinary(req.file.path, {
    folder: 'orbitus/chats',
    resource_type: fileType === 'image' ? 'image' : 'raw'
  });

  if (cloudinaryResult?.secure_url) {
    fileUrl = cloudinaryResult.secure_url;
  } else {
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    fileUrl = `${baseUrl}/uploads/${req.file.filename}`;
  }

  return res.status(201).json(
    new ApiResponse(201, {
      fileUrl,
      fileType,
      fileName: req.file.originalname
    }, 'File uploaded successfully')
  );
});

export const getMessageHistory = asyncHandler(async (req, res) => {
  const { chatRoomId } = req.params;
  const partnerId = getPartnerIdFromRoom(chatRoomId, req.user._id);

  await ensureCanViewChat(req.user._id, partnerId);

  const messages = await Message.find({
    chatRoomId,
    deletedFor: { $ne: req.user._id }
  })
    .populate('sender recipient', 'name profileImage')
    .populate('reactions.user', 'name profileImage')
    .populate({
      path: 'replyTo',
      select: 'content sender deletedAt',
      populate: { path: 'sender', select: 'name' }
    })
    .sort({ createdAt: 1 })
    .lean();

  return res.status(200).json(
    new ApiResponse(200, { messages }, 'Message logs retrieved')
  );
});

export const getActiveChats = asyncHandler(async (req, res) => {
  const currentUserId = req.user._id;

  const [sentTo, receivedFrom] = await Promise.all([
    Message.distinct('recipient', { sender: currentUserId }),
    Message.distinct('sender', { recipient: currentUserId })
  ]);

  const [hiddenPreferences, blockedByUsers] = await Promise.all([
    ChatPreference.find({
      owner: currentUserId,
      $or: [{ isRemoved: true }, { isBlocked: true }]
    }).select('partner').lean(),
    ChatPreference.find({
      partner: currentUserId,
      isBlocked: true
    }).select('owner').lean()
  ]);

  const hiddenIds = new Set([
    ...hiddenPreferences.map((item) => item.partner.toString()),
    ...blockedByUsers.map((item) => item.owner.toString())
  ]);

  const activeIds = [...new Set([...sentTo, ...receivedFrom])]
    .filter((id) => id.toString() !== currentUserId.toString())
    .filter((id) => !hiddenIds.has(id.toString()));

  const activeUsers = await User.find({ _id: { $in: activeIds } })
    .select('name profileImage bio experienceLevel points')
    .lean();

  const chatsList = await Promise.all(activeUsers.map(async (partner) => {
    const chatRoomId = [currentUserId.toString(), partner._id.toString()].sort().join('_');
    const lastMessage = await Message.findOne({
      chatRoomId,
      deletedFor: { $ne: currentUserId }
    })
      .sort({ createdAt: -1 })
      .select('content fileType isSeen sender createdAt')
      .lean();

    const unreadCount = await Message.countDocuments({
      chatRoomId,
      recipient: currentUserId,
      isSeen: false,
      deletedFor: { $ne: currentUserId }
    });

    return {
      partner,
      chatRoomId,
      unreadCount,
      lastMessage: lastMessage || { content: 'No messages yet', createdAt: partner.createdAt, isSeen: true }
    };
  }));

  chatsList.sort((a, b) => new Date(b.lastMessage.createdAt) - new Date(a.lastMessage.createdAt));

  return res.status(200).json(
    new ApiResponse(200, { chats: chatsList }, 'Active chat list retrieved')
  );
});

export const getBlockedChatPartners = asyncHandler(async (req, res) => {
  const blockedPreferences = await ChatPreference.find({
    owner: req.user._id,
    isBlocked: true
  })
    .populate('partner', 'name profileImage bio experienceLevel points')
    .sort({ blockedAt: -1 })
    .lean();

  const blockedUsers = blockedPreferences
    .filter((item) => item.partner)
    .map((item) => ({
      partner: item.partner,
      blockedAt: item.blockedAt
    }));

  return res.status(200).json(
    new ApiResponse(200, { blockedUsers }, 'Blocked partners retrieved')
  );
});

export const markAsSeen = asyncHandler(async (req, res) => {
  const { chatRoomId } = req.params;
  const partnerId = getPartnerIdFromRoom(chatRoomId, req.user._id);

  await ensureCanViewChat(req.user._id, partnerId);

  await Message.updateMany(
    { chatRoomId, recipient: req.user._id, isSeen: false },
    { $set: { isSeen: true } }
  );

  return res.status(200).json(
    new ApiResponse(200, null, 'Messages marked as read')
  );
});

export const removeChatPartner = asyncHandler(async (req, res) => {
  if (req.params.partnerId === req.user._id.toString()) {
    throw new ApiError(400, 'You cannot remove yourself from chats');
  }

  const partner = await User.findById(req.params.partnerId).select('_id');
  if (!partner) {
    throw new ApiError(404, 'User not found');
  }

  await ChatPreference.findOneAndUpdate(
    { owner: req.user._id, partner: partner._id },
    { $set: { isRemoved: true, removedAt: new Date() } },
    { upsert: true, new: true }
  );

  return res.status(200).json(
    new ApiResponse(200, null, 'User removed from chats')
  );
});

export const blockChatPartner = asyncHandler(async (req, res) => {
  if (req.params.partnerId === req.user._id.toString()) {
    throw new ApiError(400, 'You cannot block yourself');
  }

  const partner = await User.findById(req.params.partnerId).select('_id');
  if (!partner) {
    throw new ApiError(404, 'User not found');
  }

  await ChatPreference.findOneAndUpdate(
    { owner: req.user._id, partner: partner._id },
    {
      $set: {
        isRemoved: true,
        isBlocked: true,
        removedAt: new Date(),
        blockedAt: new Date()
      }
    },
    { upsert: true, new: true }
  );

  return res.status(200).json(
    new ApiResponse(200, null, 'User blocked')
  );
});

export const unblockChatPartner = asyncHandler(async (req, res) => {
  await ChatPreference.findOneAndUpdate(
    { owner: req.user._id, partner: req.params.partnerId },
    { $set: { isBlocked: false, isRemoved: false, blockedAt: null, removedAt: null } },
    { new: true }
  );

  return res.status(200).json(
    new ApiResponse(200, null, 'User unblocked')
  );
});

export const deleteConversationForMe = asyncHandler(async (req, res) => {
  const { chatRoomId } = req.params;
  const partnerId = getPartnerIdFromRoom(chatRoomId, req.user._id);

  await Message.updateMany(
    {
      chatRoomId,
      deletedFor: { $ne: req.user._id },
      $or: [{ sender: req.user._id }, { recipient: req.user._id }]
    },
    { $addToSet: { deletedFor: req.user._id } }
  );

  if (partnerId) {
    await ChatPreference.findOneAndUpdate(
      { owner: req.user._id, partner: partnerId },
      { $set: { isRemoved: true, removedAt: new Date() } },
      { upsert: true, new: true }
    );
  }

  return res.status(200).json(
    new ApiResponse(200, null, 'Conversation deleted for you')
  );
});
