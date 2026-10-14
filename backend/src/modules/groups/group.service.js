import { AppError } from '../../shared/errors/app-error.js';
import { groupRepository } from './group.repository.js';
import { emitGroupMessage } from '../../socket/socketHandler.js';

const getDocumentId = (val) => (val?._id || val)?.toString();

export class GroupService {
  constructor(repo = groupRepository) {
    this.repo = repo;
  }

  async createGroup(userId, data) {
    const { name, description, image, privacy, category, tags } = data;

    if (!name || !name.trim()) {
      throw new AppError('Group name is required', 400);
    }

    const trimmedName = name.trim();
    const defaultImage =
      image?.trim() ||
      `https://ui-avatars.com/api/?name=${encodeURIComponent(trimmedName)}&background=4f46e5&color=fff`;

    const group = await this.repo.createGroup({
      name: trimmedName,
      description: description?.trim() || '',
      image: defaultImage,
      privacy: privacy === 'private' ? 'private' : 'public',
      category: category?.trim() || 'General Learning',
      tags: Array.isArray(tags) ? tags.map((t) => String(t).trim()).filter(Boolean) : [],
      creator: userId,
      admins: [userId],
      members: [userId],
      pendingRequests: []
    });

    const populated = await this.repo.findGroupById(group._id);
    await populated.populate([
      { path: 'creator', select: 'name username profileImage' },
      { path: 'admins', select: 'name username profileImage' },
      { path: 'members', select: 'name username profileImage' }
    ]);

    return populated;
  }

  async getGroups(userId, queryParams = {}) {
    const { search, category, filter, shuffle } = queryParams;
    const currentUserId = userId.toString();
    const query = {};

    if (filter === 'joined') {
      query.members = userId;
    } else if (filter === 'admin') {
      query.admins = userId;
    }

    if (category && category !== 'All') {
      query.category = category;
    }

    if (search && search.trim()) {
      const safeSearch = search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      query.$or = [
        { name: { $regex: safeSearch, $options: 'i' } },
        { description: { $regex: safeSearch, $options: 'i' } },
        { tags: { $in: [new RegExp(safeSearch, 'i')] } }
      ];
    }

    const limit = Math.min(Math.max(parseInt(queryParams.limit, 10) || 20, 1), 50);
    const page = Math.max(1, parseInt(queryParams.page, 10) || 1);
    const skip = (page - 1) * limit;

    const total = await this.repo.countGroups(query);
    const groups = await this.repo.findGroups(query, { skip, limit });

    const formatted = groups.map((g) => {
      const memberIds = (g.members || []).map((id) => id.toString());
      const adminIds = (g.admins || []).map((id) => id.toString());
      const pendingIds = (g.pendingRequests || []).map((id) => id.toString());

      return {
        _id: g._id,
        name: g.name,
        description: g.description,
        image: g.image,
        privacy: g.privacy,
        category: g.category,
        tags: g.tags,
        creator: g.creator,
        membersCount: memberIds.length,
        adminsCount: adminIds.length,
        meetingLink: g.meetingLink,
        meetingLinkProvider: g.meetingLinkProvider,
        lastActivity: g.lastActivity,
        createdAt: g.createdAt,
        updatedAt: g.updatedAt,
        isMember: memberIds.includes(currentUserId),
        isAdmin: adminIds.includes(currentUserId),
        isPending: pendingIds.includes(currentUserId)
      };
    });

    const shouldShuffle = shuffle === 'true';
    const finalGroups =
      shouldShuffle && formatted.length > 1
        ? [...formatted].sort(() => Math.random() - 0.5)
        : formatted;

    const hasMore = skip + groups.length < total;

    return {
      groups: finalGroups,
      page,
      limit,
      total,
      hasMore
    };
  }

  async getGroupById(groupId, user) {
    const currentUserId = user._id.toString();
    const group = await this.repo.findGroupByIdWithPopulated(groupId);

    if (!group) {
      throw new AppError('Group not found', 404);
    }

    const creatorId = getDocumentId(group.creator);
    let membersList = [...(group.members || [])];
    let adminsList = [...(group.admins || [])];

    if (creatorId && !membersList.some((m) => getDocumentId(m) === creatorId)) {
      membersList.unshift(group.creator);
    }
    if (creatorId && !adminsList.some((a) => getDocumentId(a) === creatorId)) {
      adminsList.unshift(group.creator);
    }

    const memberIds = membersList.map((m) => getDocumentId(m));
    const adminIds = adminsList.map((a) => getDocumentId(a));
    const isMember = memberIds.includes(currentUserId);
    const isAdmin = adminIds.includes(currentUserId);
    const isPending = (group.pendingRequests || []).some((p) => getDocumentId(p) === currentUserId);

    return {
      ...group.toObject(),
      members: membersList,
      admins: adminsList,
      isMember,
      isAdmin,
      isPending,
      pendingRequests: isAdmin ? group.pendingRequests : []
    };
  }

  async updateGroup(groupId, userId, data) {
    const currentUserId = userId.toString();
    const group = await this.repo.findGroupById(groupId);
    if (!group) {
      throw new AppError('Group not found', 404);
    }

    const adminIds = (group.admins || []).map((a) => a.toString());
    if (!adminIds.includes(currentUserId)) {
      throw new AppError('Only group admins can update settings', 403);
    }

    const { name, description, image, privacy, category, tags } = data;
    if (name && name.trim()) group.name = name.trim();
    if (description !== undefined) group.description = description.trim();
    if (image !== undefined) group.image = image.trim();
    if (privacy && ['public', 'private'].includes(privacy)) group.privacy = privacy;
    if (category) group.category = category.trim();
    if (Array.isArray(tags)) group.tags = tags.map((t) => String(t).trim()).filter(Boolean);

    await group.save();
    return group;
  }

  async joinGroup(groupId, user, { inviteCode } = {}) {
    const currentUserId = user._id.toString();
    const group = await this.repo.findGroupById(groupId);
    if (!group) {
      throw new AppError('Group not found', 404);
    }

    const memberIds = (group.members || []).map((m) => m.toString());
    const pendingIds = (group.pendingRequests || []).map((p) => p.toString());
    const kickedIds = (group.kickedUsers || []).map((k) => k.toString());
    const bannedIds = (group.bannedUsers || []).map((b) => b.toString());

    if (bannedIds.includes(currentUserId)) {
      throw new AppError('You have been banned from this group by an administrator and cannot rejoin.', 403);
    }

    if (kickedIds.includes(currentUserId)) {
      if (!inviteCode || inviteCode.toUpperCase() !== (group.inviteCode || '').toUpperCase()) {
        const error = new AppError('You were previously removed from this group by an admin. You cannot rejoin directly without an invitation link or valid invite code.', 403);
        error.requiresInvite = true;
        throw error;
      }
      group.kickedUsers = group.kickedUsers.filter((k) => k.toString() !== currentUserId);
    }

    if (memberIds.includes(currentUserId)) {
      throw new AppError('You are already a member of this group', 400);
    }

    if (group.privacy === 'public' || (inviteCode && inviteCode.toUpperCase() === (group.inviteCode || '').toUpperCase())) {
      group.members.push(user._id);
      group.lastActivity = new Date();
      await group.save();

      try {
        const sysMsg = await this.repo.createGroupMessage({
          group: group._id,
          sender: user._id,
          content: `${user.name} joined the group`,
          fileType: 'system',
          isSystem: true
        });
        const populated = await this.repo.findGroupMessageById(sysMsg._id);
        emitGroupMessage(group._id, populated);
      } catch (sysErr) {
        console.error('System join message error:', sysErr.message);
      }

      return {
        isMember: true,
        isPending: false,
        message: `Joined ${group.name} successfully!`
      };
    }

    if (pendingIds.includes(currentUserId)) {
      throw new AppError('Join request already submitted', 400);
    }

    group.pendingRequests.push(user._id);
    await group.save();

    for (const adminId of group.admins) {
      await this.repo.createNotification({
        recipient: adminId,
        sender: user._id,
        type: 'Follow',
        content: `${user.name} requested to join your private group "${group.name}".`,
        link: `/groups/${group._id}`
      });
    }

    return {
      isMember: false,
      isPending: true,
      message: 'Join request submitted! Group admin will review your request.'
    };
  }

  async leaveGroup(groupId, user) {
    const currentUserId = user._id.toString();
    const group = await this.repo.findGroupById(groupId);
    if (!group) {
      throw new AppError('Group not found', 404);
    }

    group.members = group.members.filter((m) => m.toString() !== currentUserId);
    group.admins = group.admins.filter((a) => a.toString() !== currentUserId);

    if (group.members.length === 0) {
      await this.repo.deleteGroupAndMessages(group._id);
      return {
        groupDeleted: true,
        message: `You left ${group.name}. Since you were the last member, the group has been deleted.`
      };
    }

    if (group.creator.toString() === currentUserId) {
      if (group.admins.length > 0) {
        group.creator = group.admins[0];
      } else if (group.members.length > 0) {
        group.creator = group.members[0];
        group.admins.push(group.members[0]);
      }
    }

    await group.save();

    try {
      const sysMsg = await this.repo.createGroupMessage({
        group: group._id,
        sender: user._id,
        content: `${user.name} left the group`,
        fileType: 'system',
        isSystem: true
      });
      const populated = await this.repo.findGroupMessageById(sysMsg._id);
      emitGroupMessage(group._id, populated);
    } catch (sysErr) {
      console.error('System leave message error:', sysErr.message);
    }

    return {
      groupDeleted: false,
      message: `You left ${group.name}`
    };
  }

  async deleteGroup(groupId, user) {
    const currentUserId = user._id.toString();
    const group = await this.repo.findGroupById(groupId);
    if (!group) {
      throw new AppError('Group not found', 404);
    }

    const isCreator = group.creator.toString() === currentUserId;
    const isAdmin = (group.admins || []).some((a) => a.toString() === currentUserId);

    if (!isCreator && !isAdmin) {
      throw new AppError('Only group admins or the creator can delete this group', 403);
    }

    await this.repo.deleteGroupAndMessages(groupId);
    return group;
  }

  async respondJoinRequest(groupId, adminUser, targetUserId, action) {
    const currentUserId = adminUser._id.toString();
    const group = await this.repo.findGroupById(groupId);
    if (!group) {
      throw new AppError('Group not found', 404);
    }

    const adminIds = (group.admins || []).map((a) => a.toString());
    if (!adminIds.includes(currentUserId)) {
      throw new AppError('Only group admins can manage join requests', 403);
    }

    group.pendingRequests = group.pendingRequests.filter((p) => p.toString() !== targetUserId);

    if (action === 'accept') {
      if (!group.members.some((m) => m.toString() === targetUserId)) {
        group.members.push(targetUserId);
      }
      group.lastActivity = new Date();

      try {
        const acceptedUser = await this.repo.findUserById(targetUserId);
        const sysMsg = await this.repo.createGroupMessage({
          group: group._id,
          sender: targetUserId,
          content: `${acceptedUser?.name || 'A new member'} joined the group`,
          fileType: 'system',
          isSystem: true
        });
        const populated = await this.repo.findGroupMessageById(sysMsg._id);
        emitGroupMessage(group._id, populated);
      } catch (sysErr) {
        console.error('System join message error:', sysErr.message);
      }

      await this.repo.createNotification({
        recipient: targetUserId,
        sender: adminUser._id,
        type: 'SessionBooked',
        content: `Your request to join "${group.name}" was approved!`,
        link: `/groups/${group._id}`
      });
    }

    await group.save();
    return { group, action };
  }

  async manageMemberRole(groupId, adminUser, targetUserId, action) {
    const currentUserId = adminUser._id.toString();
    const group = await this.repo.findGroupById(groupId);
    if (!group) {
      throw new AppError('Group not found', 404);
    }

    const adminIds = (group.admins || []).map((a) => a.toString());
    if (!adminIds.includes(currentUserId)) {
      throw new AppError('Only group admins can manage member roles', 403);
    }

    if (targetUserId === group.creator.toString() && action !== 'make_admin') {
      throw new AppError('Group creator cannot be demoted or removed', 400);
    }

    if (action === 'make_admin') {
      if (!group.admins.some((a) => a.toString() === targetUserId)) {
        group.admins.push(targetUserId);
      }
    } else if (action === 'remove_admin') {
      group.admins = group.admins.filter((a) => a.toString() !== targetUserId);
    } else if (action === 'kick') {
      group.members = group.members.filter((m) => m.toString() !== targetUserId);
      group.admins = group.admins.filter((a) => a.toString() !== targetUserId);
      if (!group.kickedUsers) group.kickedUsers = [];
      if (!group.kickedUsers.some((k) => k.toString() === targetUserId)) {
        group.kickedUsers.push(targetUserId);
      }

      try {
        const kickedUser = await this.repo.findUserById(targetUserId);
        const sysMsg = await this.repo.createGroupMessage({
          group: group._id,
          sender: adminUser._id,
          content: `${kickedUser?.name || 'A member'} was removed from the group`,
          fileType: 'system',
          isSystem: true
        });
        const populated = await this.repo.findGroupMessageById(sysMsg._id);
        emitGroupMessage(group._id, populated);
      } catch (sysErr) {
        console.error('System kick message error:', sysErr.message);
      }
    } else if (action === 'ban') {
      group.members = group.members.filter((m) => m.toString() !== targetUserId);
      group.admins = group.admins.filter((a) => a.toString() !== targetUserId);
      if (!group.bannedUsers) group.bannedUsers = [];
      if (!group.bannedUsers.some((b) => b.toString() === targetUserId)) {
        group.bannedUsers.push(targetUserId);
      }

      try {
        const bannedUser = await this.repo.findUserById(targetUserId);
        const sysMsg = await this.repo.createGroupMessage({
          group: group._id,
          sender: adminUser._id,
          content: `${bannedUser?.name || 'A member'} was banned from the group`,
          fileType: 'system',
          isSystem: true
        });
        const populated = await this.repo.findGroupMessageById(sysMsg._id);
        emitGroupMessage(group._id, populated);
      } catch (sysErr) {
        console.error('System ban message error:', sysErr.message);
      }
    } else if (action === 'unban') {
      group.bannedUsers = (group.bannedUsers || []).filter((b) => b.toString() !== targetUserId);
      group.kickedUsers = (group.kickedUsers || []).filter((k) => k.toString() !== targetUserId);
    }

    await group.save();
    return group;
  }

  async updateGroupMeetingLink(groupId, user, { meetingLink, meetingLinkProvider }) {
    const currentUserId = user._id.toString();
    const group = await this.repo.findGroupById(groupId);
    if (!group) {
      throw new AppError('Group not found', 404);
    }

    const memberIds = (group.members || []).map((m) => m.toString());
    if (!memberIds.includes(currentUserId)) {
      throw new AppError('Only group members can share or update video call links', 403);
    }

    group.meetingLink = (meetingLink || '').trim();
    if (meetingLinkProvider) {
      group.meetingLinkProvider = meetingLinkProvider;
    }
    group.meetingLinkUpdatedBy = user._id;
    group.meetingLinkUpdatedAt = new Date();
    group.lastActivity = new Date();
    await group.save();

    return {
      meetingLink: group.meetingLink,
      meetingLinkProvider: group.meetingLinkProvider
    };
  }

  async getGroupMessages(groupId, user) {
    const currentUserId = user._id.toString();
    const group = await this.repo.findGroupById(groupId);
    if (!group) {
      throw new AppError('Group not found', 404);
    }

    const memberIds = (group.members || []).map((m) => m.toString());
    if (group.privacy === 'private' && !memberIds.includes(currentUserId)) {
      throw new AppError('Private group messages are only visible to members', 403);
    }

    return this.repo.findGroupMessages(groupId, user._id);
  }

  async sendGroupMessage(groupId, user, data) {
    const { content, fileUrl, fileType, replyTo } = data;
    const currentUserId = user._id.toString();

    const group = await this.repo.findGroupById(groupId);
    if (!group) {
      throw new AppError('Group not found', 404);
    }

    const memberIds = (group.members || []).map((m) => m.toString());
    if (!memberIds.includes(currentUserId)) {
      throw new AppError('You must be a member of this group to send messages', 403);
    }

    if (!content?.trim() && !fileUrl) {
      throw new AppError('Message content or file required', 400);
    }

    const message = await this.repo.createGroupMessage({
      group: groupId,
      sender: user._id,
      content: content?.trim() || '',
      fileUrl: fileUrl || '',
      fileType: fileType || 'none',
      replyTo: replyTo || undefined
    });

    group.lastActivity = new Date();
    await group.save();

    return this.repo.findGroupMessageById(message._id);
  }

  async togglePinMessage(groupId, user, msgId) {
    const currentUserId = user._id.toString();
    const group = await this.repo.findGroupById(groupId);
    if (!group) {
      throw new AppError('Group not found', 404);
    }

    const adminIds = (group.admins || []).map((a) => a.toString());
    if (!adminIds.includes(currentUserId)) {
      throw new AppError('Only group admins can pin or unpin messages', 403);
    }

    const message = await this.repo.findGroupMessage({ _id: msgId, group: groupId });
    if (!message) {
      throw new AppError('Message not found', 404);
    }

    const newPinnedState = !message.isPinned;
    message.isPinned = newPinnedState;
    message.pinnedBy = newPinnedState ? user._id : undefined;
    await message.save();

    if (newPinnedState) {
      group.pinnedMessages.push({
        message: message._id,
        pinnedBy: user._id,
        pinnedAt: new Date()
      });
    } else {
      group.pinnedMessages = group.pinnedMessages.filter((p) => p.message.toString() !== msgId);
    }

    await group.save();
    return newPinnedState;
  }

  async deleteGroupMessage(groupId, user, msgId, mode) {
    const currentUserId = user._id.toString();
    const group = await this.repo.findGroupById(groupId);
    if (!group) {
      throw new AppError('Group not found', 404);
    }

    const message = await this.repo.findGroupMessage({ _id: msgId, group: groupId });
    if (!message) {
      throw new AppError('Message not found', 404);
    }

    if (mode === 'me' || message.deletedAt) {
      if (!message.deletedFor) {
        message.deletedFor = [];
      }
      if (!message.deletedFor.some((u) => u.toString() === currentUserId)) {
        message.deletedFor.push(user._id);
        await message.save();
      }
      return { mode: 'me', messageId: msgId };
    }

    const isSender = message.sender.toString() === currentUserId;
    const isAdmin = (group.admins || []).some((a) => a.toString() === currentUserId);

    if (!isSender && !isAdmin) {
      throw new AppError('Not authorized to delete this message', 403);
    }

    message.deletedAt = new Date();
    message.deletedBy = user._id;
    await message.save();

    return { mode: 'everyone', messageId: msgId };
  }

  async clearGroupChat(groupId, user) {
    const group = await this.repo.findGroupById(groupId);
    if (!group) {
      throw new AppError('Group not found', 404);
    }

    await this.repo.clearGroupMessagesForUser(groupId, user._id);
    return true;
  }

  async addMemberToGroup(groupId, user, targetUserId) {
    const currentUserId = user._id.toString();
    const group = await this.repo.findGroupById(groupId);
    if (!group) {
      throw new AppError('Group not found', 404);
    }

    const adminIds = (group.admins || []).map((a) => a.toString());
    const memberIds = (group.members || []).map((m) => m.toString());
    const isMember = memberIds.includes(currentUserId);
    const isAdmin = adminIds.includes(currentUserId);

    if (!isMember && !isAdmin) {
      throw new AppError('Only group members can add new users', 403);
    }

    const targetUser = await this.repo.findUserById(targetUserId);
    if (!targetUser) {
      throw new AppError('User not found', 404);
    }

    if (memberIds.includes(targetUserId)) {
      throw new AppError(`${targetUser.name} is already a member of this group`, 400);
    }

    group.kickedUsers = (group.kickedUsers || []).filter((k) => k.toString() !== targetUserId);
    group.pendingRequests = (group.pendingRequests || []).filter((p) => p.toString() !== targetUserId);
    group.members.push(targetUserId);
    group.lastActivity = new Date();
    await group.save();

    try {
      await this.repo.createGroupMessage({
        group: group._id,
        sender: user._id,
        content: `${user.name} added ${targetUser.name} to the group`,
        isSystem: true,
        fileType: 'system'
      });
    } catch (sysErr) {
      console.error('System message error:', sysErr.message);
    }

    return { memberId: targetUserId, targetUserName: targetUser.name };
  }
}

export const groupService = new GroupService();
