import Message from '../../models/Message.js';
import User from '../../models/User.js';
import ChatPreference from '../../models/ChatPreference.js';

export class ChatRepository {
  async findChatPreference(query) {
    return ChatPreference.findOne(query).lean();
  }

  async findChatPreferences(query, select = '') {
    const q = ChatPreference.find(query);
    if (select) q.select(select);
    return q.lean();
  }

  async findBlockedPreferences(ownerId) {
    return ChatPreference.find({
      owner: ownerId,
      isBlocked: true
    })
      .populate('partner', 'name profileImage bio experienceLevel points')
      .sort({ blockedAt: -1 })
      .lean();
  }

  async upsertChatPreference(owner, partner, update) {
    return ChatPreference.findOneAndUpdate(
      { owner, partner },
      update,
      { upsert: true, new: true }
    );
  }

  async findMessages(query, limit) {
    return Message.find(query)
      .populate('sender recipient', 'name profileImage')
      .populate('reactions.user', 'name profileImage')
      .populate({
        path: 'replyTo',
        select: 'content sender deletedAt',
        populate: { path: 'sender', select: 'name' }
      })
      .sort({ createdAt: -1, _id: -1 })
      .limit(limit)
      .lean();
  }

  async aggregateActiveChats(currentUserId) {
    return Message.aggregate([
      {
        $match: {
          $or: [{ sender: currentUserId }, { recipient: currentUserId }],
          deletedFor: { $ne: currentUserId }
        }
      },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: '$chatRoomId',
          lastMessage: { $first: '$$ROOT' },
          unreadCount: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ['$recipient', currentUserId] },
                    { $eq: ['$isSeen', false] }
                  ]
                },
                1,
                0
              ]
            }
          }
        }
      }
    ]);
  }

  async findUsersByIds(ids, select = 'name profileImage bio experienceLevel points') {
    return User.find({ _id: { $in: ids } })
      .select(select)
      .lean();
  }

  async findUserById(id, select = '_id') {
    return User.findById(id).select(select);
  }

  async markMessagesSeen(chatRoomId, recipientId) {
    return Message.updateMany(
      { chatRoomId, recipient: recipientId, isSeen: false },
      { $set: { isSeen: true } }
    );
  }

  async markMessagesDeletedForUser(chatRoomId, userId) {
    return Message.updateMany(
      { chatRoomId, deletedFor: { $ne: userId } },
      { $addToSet: { deletedFor: userId } }
    );
  }
}

export const chatRepository = new ChatRepository();
