import Group from '../../models/Group.js';
import GroupMessage from '../../models/GroupMessage.js';
import User from '../../models/User.js';
import Notification from '../../models/Notification.js';

export class GroupRepository {
  async createGroup(data) {
    return Group.create(data);
  }

  async findGroupById(id) {
    return Group.findById(id);
  }

  async findGroupByIdWithPopulated(id) {
    return Group.findById(id)
      .populate('creator', 'name username profileImage bio experienceLevel')
      .populate('admins', 'name username profileImage bio experienceLevel')
      .populate('members', 'name username profileImage bio experienceLevel')
      .populate('pendingRequests', 'name username profileImage bio experienceLevel')
      .populate({
        path: 'pinnedMessages.message',
        populate: { path: 'sender', select: 'name username profileImage' }
      });
  }

  async countGroups(query) {
    return Group.countDocuments(query);
  }

  async findGroups(query, { skip = 0, limit = 20, sort = { lastActivity: -1, createdAt: -1 } } = {}) {
    return Group.find(query)
      .populate('creator', 'name username profileImage')
      .populate('admins', 'name username profileImage')
      .sort(sort)
      .skip(skip)
      .limit(limit);
  }

  async deleteGroupAndMessages(id) {
    await GroupMessage.deleteMany({ group: id });
    return Group.findByIdAndDelete(id);
  }

  async findUserById(id) {
    return User.findById(id);
  }

  async createNotification(data) {
    return Notification.create(data);
  }

  async createGroupMessage(data) {
    return GroupMessage.create(data);
  }

  async findGroupMessageById(id) {
    return GroupMessage.findById(id)
      .populate('sender', 'name username profileImage')
      .populate({
        path: 'replyTo',
        populate: { path: 'sender', select: 'name username' }
      });
  }

  async findGroupMessage(query) {
    return GroupMessage.findOne(query);
  }

  async findGroupMessages(groupId, currentUserId, limit = 200) {
    return GroupMessage.find({
      group: groupId,
      deletedFor: { $ne: currentUserId }
    })
      .populate('sender', 'name username profileImage')
      .populate('reactions.user', 'name username profileImage')
      .populate('pinnedBy', 'name username')
      .populate({
        path: 'replyTo',
        populate: { path: 'sender', select: 'name username' }
      })
      .sort({ createdAt: 1 })
      .limit(limit)
      .lean();
  }

  async clearGroupMessagesForUser(groupId, currentUserId) {
    return GroupMessage.updateMany(
      { group: groupId, deletedFor: { $ne: currentUserId } },
      { $addToSet: { deletedFor: currentUserId } }
    );
  }
}

export const groupRepository = new GroupRepository();
