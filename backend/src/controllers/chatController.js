import Message from '../models/Message.js';
import User from '../models/User.js';
import ChatPreference from '../models/ChatPreference.js';
import path from 'path';

const getPartnerIdFromRoom = (chatRoomId, currentUserId) => {
  const current = currentUserId.toString();
  return String(chatRoomId || '').split('_').find(id => id !== current) || '';
};

const ensureCanViewChat = async (currentUserId, partnerId) => {
  if (!partnerId) return { allowed: false, status: 400, message: 'Invalid chat room' };

  const [ownPreference, partnerPreference] = await Promise.all([
    ChatPreference.findOne({ owner: currentUserId, partner: partnerId }).lean(),
    ChatPreference.findOne({ owner: partnerId, partner: currentUserId, isBlocked: true }).lean()
  ]);

  if (ownPreference?.isBlocked || partnerPreference?.isBlocked) {
    return { allowed: false, status: 403, message: 'Chat is blocked' };
  }

  return { allowed: true };
};

export const uploadChatFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const extension = path.extname(req.file.originalname).toLowerCase();
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    const fileType = imageExtensions.includes(extension) ? 'image' : 'pdf';

    const baseUrl = `${req.protocol}://${req.get('host')}`;

    res.status(201).json({
      success: true,
      fileUrl: `${baseUrl}/uploads/${req.file.filename}`,
      fileType,
      fileName: req.file.originalname
    });
  } catch (error) {
    console.error('Chat File Upload Error:', error.message);
    res.status(500).json({ success: false, message: 'Server error uploading file' });
  }
};

// @desc    Get message history for a specific room
// @route   GET /api/messages/:chatRoomId
// @access  Private
export const getMessageHistory = async (req, res) => {
  const { chatRoomId } = req.params;

  try {
    const partnerId = getPartnerIdFromRoom(chatRoomId, req.user._id);
    const access = await ensureCanViewChat(req.user._id, partnerId);
    if (!access.allowed) {
      return res.status(access.status).json({ success: false, message: access.message });
    }

    const messages = await Message.find({
      chatRoomId,
      deletedFor: { $ne: req.user._id }
    })
      .populate('sender recipient', 'name profileImage')
      .populate({
        path: 'replyTo',
        select: 'content sender deletedAt',
        populate: { path: 'sender', select: 'name' }
      })
      .sort({ createdAt: 1 });

    res.status(200).json({ success: true, messages });
  } catch (error) {
    console.error('Fetch Message History Error:', error.message);
    res.status(500).json({ success: false, message: 'Server error fetching message logs' });
  }
};

// @desc    Get all active chat partners for current user
// @route   GET /api/messages/active
// @access  Private
export const getActiveChats = async (req, res) => {
  try {
    const currentUserId = req.user._id;

    // Find all distinct users who have sent or received messages with current user
    const sentTo = await Message.distinct('recipient', { sender: currentUserId });
    const receivedFrom = await Message.distinct('sender', { recipient: currentUserId });

    const hiddenPreferences = await ChatPreference.find({
      owner: currentUserId,
      $or: [{ isRemoved: true }, { isBlocked: true }]
    }).select('partner').lean();

    const blockedByUsers = await ChatPreference.find({
      partner: currentUserId,
      isBlocked: true
    }).select('owner').lean();

    const hiddenIds = new Set([
      ...hiddenPreferences.map(item => item.partner.toString()),
      ...blockedByUsers.map(item => item.owner.toString())
    ]);

    const activeIds = [...new Set([...sentTo, ...receivedFrom])]
      .filter(id => id.toString() !== currentUserId.toString())
      .filter(id => !hiddenIds.has(id.toString()));

    const activeUsers = await User.find({ _id: { $in: activeIds } })
      .select('name profileImage bio experienceLevel points');

    // Compile last message details for each user
    const chatsList = await Promise.all(activeUsers.map(async (user) => {
      const chatRoomId = [currentUserId.toString(), user._id.toString()].sort().join('_');
      const lastMessage = await Message.findOne({
        chatRoomId,
        deletedFor: { $ne: currentUserId }
      })
        .sort({ createdAt: -1 })
        .select('content fileType isSeen sender createdAt');
      const unreadCount = await Message.countDocuments({
        chatRoomId,
        recipient: currentUserId,
        isSeen: false,
        deletedFor: { $ne: currentUserId }
      });

      return {
        partner: user,
        chatRoomId,
        unreadCount,
        lastMessage: lastMessage || { content: 'No messages yet', createdAt: user.createdAt, isSeen: true }
      };
    }));

    // Sort by last message date descending
    chatsList.sort((a, b) => new Date(b.lastMessage.createdAt) - new Date(a.lastMessage.createdAt));

    res.status(200).json({ success: true, chats: chatsList });
  } catch (error) {
    console.error('Fetch Active Chats Error:', error.message);
    res.status(500).json({ success: false, message: 'Server error fetching active chat list' });
  }
};

// @desc    Get blocked chat partners for current user
// @route   GET /api/messages/blocked
// @access  Private
export const getBlockedChatPartners = async (req, res) => {
  try {
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

    res.status(200).json({ success: true, blockedUsers });
  } catch (error) {
    console.error('Fetch Blocked Chat Partners Error:', error.message);
    res.status(500).json({ success: false, message: 'Server error fetching blocked users' });
  }
};

// @desc    Mark room messages as seen
// @route   PUT /api/messages/:chatRoomId/seen
// @access  Private
export const markAsSeen = async (req, res) => {
  const { chatRoomId } = req.params;

  try {
    const partnerId = getPartnerIdFromRoom(chatRoomId, req.user._id);
    const access = await ensureCanViewChat(req.user._id, partnerId);
    if (!access.allowed) {
      return res.status(access.status).json({ success: false, message: access.message });
    }

    await Message.updateMany(
      { chatRoomId, recipient: req.user._id, isSeen: false },
      { $set: { isSeen: true } }
    );

    res.status(200).json({ success: true, message: 'Messages marked as read' });
  } catch (error) {
    console.error('Seen Status Update Error:', error.message);
    res.status(500).json({ success: false, message: 'Server error updating message seen status' });
  }
};

// @desc    Remove a chat partner from current user's chat list
// @route   PUT /api/messages/users/:partnerId/remove
// @access  Private
export const removeChatPartner = async (req, res) => {
  try {
    if (req.params.partnerId === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'You cannot remove yourself from chats' });
    }

    const partner = await User.findById(req.params.partnerId).select('_id');
    if (!partner) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    await ChatPreference.findOneAndUpdate(
      { owner: req.user._id, partner: partner._id },
      { $set: { isRemoved: true, removedAt: new Date() } },
      { upsert: true, new: true }
    );

    res.status(200).json({ success: true, message: 'User removed from chats' });
  } catch (error) {
    console.error('Remove Chat Partner Error:', error.message);
    res.status(500).json({ success: false, message: 'Server error removing chat partner' });
  }
};

// @desc    Block a chat partner for current user
// @route   PUT /api/messages/users/:partnerId/block
// @access  Private
export const blockChatPartner = async (req, res) => {
  try {
    if (req.params.partnerId === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'You cannot block yourself' });
    }

    const partner = await User.findById(req.params.partnerId).select('_id');
    if (!partner) {
      return res.status(404).json({ success: false, message: 'User not found' });
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

    res.status(200).json({ success: true, message: 'User blocked' });
  } catch (error) {
    console.error('Block Chat Partner Error:', error.message);
    res.status(500).json({ success: false, message: 'Server error blocking user' });
  }
};

// @desc    Unblock a chat partner for current user
// @route   PUT /api/messages/users/:partnerId/unblock
// @access  Private
export const unblockChatPartner = async (req, res) => {
  try {
    await ChatPreference.findOneAndUpdate(
      { owner: req.user._id, partner: req.params.partnerId },
      { $set: { isBlocked: false, isRemoved: false, blockedAt: null, removedAt: null } },
      { new: true }
    );

    res.status(200).json({ success: true, message: 'User unblocked' });
  } catch (error) {
    console.error('Unblock Chat Partner Error:', error.message);
    res.status(500).json({ success: false, message: 'Server error unblocking user' });
  }
};

// @desc    Hide an entire chat thread for the current user only
// @route   DELETE /api/messages/:chatRoomId
// @access  Private
export const deleteConversationForMe = async (req, res) => {
  const { chatRoomId } = req.params;

  try {
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

    res.status(200).json({ success: true, message: 'Conversation deleted for you' });
  } catch (error) {
    console.error('Delete Conversation Error:', error.message);
    res.status(500).json({ success: false, message: 'Server error deleting conversation' });
  }
};
