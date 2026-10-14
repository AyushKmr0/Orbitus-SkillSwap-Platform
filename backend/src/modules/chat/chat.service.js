import path from 'path';
import { AppError } from '../../shared/errors/app-error.js';
import { chatRepository } from './chat.repository.js';
import { uploadOnCloudinary } from '../../infrastructure/storage/cloudinary.js';

export const encodeCursor = (createdAt, id) => {
  const iso = new Date(createdAt).toISOString();
  return Buffer.from(`${iso}|${id}`).toString('base64');
};

export const parseCursor = (rawCursor) => {
  if (!rawCursor || typeof rawCursor !== 'string') return null;
  let decoded = rawCursor.trim();

  try {
    const fromBase64 = Buffer.from(decoded, 'base64').toString('utf8');
    if (fromBase64.includes('|')) {
      decoded = fromBase64;
    }
  } catch {
    // not valid base64
  }

  if (decoded.includes('|')) {
    const parts = decoded.split('|');
    if (parts.length >= 2) {
      const dateStr = parts[0];
      const idStr = parts[1];
      const d = new Date(dateStr);
      if (isNaN(d.getTime()) || !idStr) return null;
      return { cursorDate: d, cursorId: idStr };
    }
  }

  if (decoded.includes('_')) {
    const idx = decoded.lastIndexOf('_');
    const dateStr = decoded.substring(0, idx);
    const idStr = decoded.substring(idx + 1);
    const d = new Date(dateStr);
    if (!isNaN(d.getTime()) && idStr) {
      return { cursorDate: d, cursorId: idStr };
    }
  }

  const d = new Date(decoded);
  if (!isNaN(d.getTime())) {
    return { cursorDate: d, cursorId: null };
  }

  return null;
};

export const getPartnerIdFromRoom = (chatRoomId, currentUserId) => {
  const current = currentUserId.toString();
  return String(chatRoomId || '').split('_').find((id) => id !== current) || '';
};

export class ChatService {
  constructor(repo = chatRepository) {
    this.repo = repo;
  }

  async ensureCanViewChat(currentUserId, partnerId) {
    if (!partnerId) {
      throw new AppError('Invalid chat room', 400);
    }

    const [ownPreference, partnerPreference] = await Promise.all([
      this.repo.findChatPreference({ owner: currentUserId, partner: partnerId }),
      this.repo.findChatPreference({ owner: partnerId, partner: currentUserId, isBlocked: true })
    ]);

    if (ownPreference?.isBlocked || partnerPreference?.isBlocked) {
      throw new AppError('Chat is blocked', 403);
    }

    return true;
  }

  async uploadChatFile(file, { protocol, host }) {
    if (!file) {
      throw new AppError('No file uploaded', 400);
    }

    const extension = path.extname(file.originalname).toLowerCase();
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    const fileType = imageExtensions.includes(extension) ? 'image' : 'pdf';

    let fileUrl = '';
    const cloudinaryResult = await uploadOnCloudinary(file.path, {
      folder: 'orbitus/chats',
      resource_type: fileType === 'image' ? 'image' : 'raw'
    });

    if (cloudinaryResult?.secure_url) {
      fileUrl = cloudinaryResult.secure_url;
    } else {
      const baseUrl = `${protocol}://${host}`;
      fileUrl = `${baseUrl}/uploads/${file.filename}`;
    }

    return {
      fileUrl,
      fileType,
      fileName: file.originalname
    };
  }

  async getMessageHistory(chatRoomId, user, { limit = 50, cursor = null } = {}) {
    const parsedLimit = Math.min(100, Math.max(1, parseInt(limit, 10) || 50));
    const partnerId = getPartnerIdFromRoom(chatRoomId, user._id);
    await this.ensureCanViewChat(user._id, partnerId);

    const query = {
      chatRoomId,
      deletedFor: { $ne: user._id }
    };

    if (cursor) {
      const parsed = parseCursor(cursor);
      if (!parsed) {
        throw new AppError('Invalid pagination cursor format', 400);
      }
      const { cursorDate, cursorId } = parsed;
      if (cursorId) {
        query.$or = [
          { createdAt: { $lt: cursorDate } },
          { createdAt: cursorDate, _id: { $lt: cursorId } }
        ];
      } else {
        query.createdAt = { $lt: cursorDate };
      }
    }

    const rawMessages = await this.repo.findMessages(query, parsedLimit + 1);

    const hasMore = rawMessages.length > parsedLimit;
    const messages = hasMore ? rawMessages.slice(0, parsedLimit) : rawMessages;

    // Chronological order for recipient
    messages.reverse();

    const nextCursor =
      hasMore && rawMessages.length > 0
        ? encodeCursor(rawMessages[parsedLimit - 1].createdAt, rawMessages[parsedLimit - 1]._id)
        : null;

    return { messages, hasMore, nextCursor };
  }

  async getActiveChats(userId) {
    const currentUserId = userId;

    const [hiddenPreferences, blockedByUsers] = await Promise.all([
      this.repo.findChatPreferences(
        { owner: currentUserId, $or: [{ isRemoved: true }, { isBlocked: true }] },
        'partner'
      ),
      this.repo.findChatPreferences(
        { partner: currentUserId, isBlocked: true },
        'owner'
      )
    ]);

    const hiddenIds = new Set([
      ...hiddenPreferences.map((item) => item.partner.toString()),
      ...blockedByUsers.map((item) => item.owner.toString())
    ]);

    const chatAggregations = await this.repo.aggregateActiveChats(currentUserId);

    const validAggregations = chatAggregations.filter((chat) => {
      const partnerId = getPartnerIdFromRoom(chat._id, currentUserId);
      return partnerId && !hiddenIds.has(partnerId);
    });

    const partnerIds = validAggregations.map((chat) => getPartnerIdFromRoom(chat._id, currentUserId));
    const partners = await this.repo.findUsersByIds(partnerIds);
    const partnerMap = new Map(partners.map((p) => [p._id.toString(), p]));

    const chatsList = validAggregations
      .map((item) => {
        const partnerId = getPartnerIdFromRoom(item._id, currentUserId);
        const partner = partnerMap.get(partnerId);
        if (!partner) return null;

        return {
          partner,
          chatRoomId: item._id,
          unreadCount: item.unreadCount,
          lastMessage:
            item.lastMessage || { content: 'No messages yet', createdAt: partner.createdAt, isSeen: true }
        };
      })
      .filter(Boolean);

    chatsList.sort((a, b) => new Date(b.lastMessage.createdAt) - new Date(a.lastMessage.createdAt));

    return chatsList;
  }

  async getBlockedChatPartners(userId) {
    const blockedPreferences = await this.repo.findBlockedPreferences(userId);
    return blockedPreferences
      .filter((item) => item.partner)
      .map((item) => ({
        partner: item.partner,
        blockedAt: item.blockedAt
      }));
  }

  async markAsSeen(chatRoomId, user) {
    const partnerId = getPartnerIdFromRoom(chatRoomId, user._id);
    await this.ensureCanViewChat(user._id, partnerId);
    await this.repo.markMessagesSeen(chatRoomId, user._id);
    return true;
  }

  async removeChatPartner(userId, partnerId) {
    if (partnerId === userId.toString()) {
      throw new AppError('You cannot remove yourself from chats', 400);
    }

    const partner = await this.repo.findUserById(partnerId);
    if (!partner) {
      throw new AppError('User not found', 404);
    }

    await this.repo.upsertChatPreference(
      userId,
      partner._id,
      { $set: { isRemoved: true, removedAt: new Date() } }
    );

    return true;
  }

  async toggleBlockUser(userId, partnerId) {
    if (partnerId === userId.toString()) {
      throw new AppError('You cannot block yourself', 400);
    }

    const partner = await this.repo.findUserById(partnerId);
    if (!partner) {
      throw new AppError('User not found', 404);
    }

    const pref = await this.repo.findChatPreference({ owner: userId, partner: partnerId });
    const isCurrentlyBlocked = pref ? pref.isBlocked : false;

    await this.repo.upsertChatPreference(
      userId,
      partnerId,
      {
        $set: {
          isBlocked: !isCurrentlyBlocked,
          blockedAt: !isCurrentlyBlocked ? new Date() : null
        }
      }
    );

    return !isCurrentlyBlocked;
  }

  async blockChatPartner(userId, partnerId) {
    if (partnerId === userId.toString()) {
      throw new AppError('You cannot block yourself', 400);
    }

    const partner = await this.repo.findUserById(partnerId);
    if (!partner) {
      throw new AppError('User not found', 404);
    }

    await this.repo.upsertChatPreference(
      userId,
      partnerId,
      { $set: { isBlocked: true, blockedAt: new Date() } }
    );

    return true;
  }

  async unblockChatPartner(userId, partnerId) {
    await this.repo.upsertChatPreference(
      userId,
      partnerId,
      { $set: { isBlocked: false, blockedAt: null } }
    );

    return false;
  }

  async deleteConversationForMe(chatRoomId, userId) {
    await this.repo.markMessagesDeletedForUser(chatRoomId, userId);

    const partnerId = getPartnerIdFromRoom(chatRoomId, userId);
    if (partnerId) {
      await this.repo.upsertChatPreference(
        userId,
        partnerId,
        { $set: { isRemoved: true, removedAt: new Date() } }
      );
    }

    return true;
  }
}

export const chatService = new ChatService();
