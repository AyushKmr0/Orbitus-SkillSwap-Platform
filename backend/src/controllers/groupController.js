import Group from '../models/Group.js';
import GroupMessage from '../models/GroupMessage.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
import { emitGroupMessage } from '../socket/socketHandler.js';
import {
  asyncHandler,
  ApiError,
  ApiResponse
} from '../utils/index.js';

const getDocumentId = (val) => (val?._id || val)?.toString();

export const createGroup = asyncHandler(async (req, res) => {
  const { name, description, image, privacy, category, tags } = req.body;

  if (!name || !name.trim()) {
    throw new ApiError(400, 'Group name is required');
  }

  const trimmedName = name.trim();
  const defaultImage = image?.trim() || `https://ui-avatars.com/api/?name=${encodeURIComponent(trimmedName)}&background=4f46e5&color=fff`;

  const group = await Group.create({
    name: trimmedName,
    description: description?.trim() || '',
    image: defaultImage,
    privacy: privacy === 'private' ? 'private' : 'public',
    category: category?.trim() || 'General Learning',
    tags: Array.isArray(tags) ? tags.map((t) => String(t).trim()).filter(Boolean) : [],
    creator: req.user._id,
    admins: [req.user._id],
    members: [req.user._id],
    pendingRequests: []
  });

  const populated = await Group.findById(group._id)
    .populate('creator', 'name username profileImage')
    .populate('admins', 'name username profileImage')
    .populate('members', 'name username profileImage');

  return res.status(201).json(
    new ApiResponse(201, { group: populated }, 'Group created successfully!')
  );
});

export const getGroups = asyncHandler(async (req, res) => {
  const { search, category, filter } = req.query;
  const currentUserId = req.user._id.toString();
  const query = {};

  if (filter === 'joined') {
    query.members = req.user._id;
  } else if (filter === 'admin') {
    query.admins = req.user._id;
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

  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 50);
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const skip = (page - 1) * limit;

  const total = await Group.countDocuments(query);
  const groups = await Group.find(query)
    .populate('creator', 'name username profileImage')
    .populate('admins', 'name username profileImage')
    .sort({ lastActivity: -1, createdAt: -1 })
    .skip(skip)
    .limit(limit);

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

  const shouldShuffle = req.query.shuffle === 'true';
  const finalGroups = shouldShuffle && formatted.length > 1
    ? [...formatted].sort(() => Math.random() - 0.5)
    : formatted;

  const hasMore = skip + groups.length < total;

  return res.status(200).json({
    success: true,
    statusCode: 200,
    groups: finalGroups,
    data: { groups: finalGroups, page, limit, total, hasMore },
    hasMore,
    page,
    total
  });
});

export const getGroupById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const currentUserId = req.user._id.toString();

  const group = await Group.findById(id)
    .populate('creator', 'name username profileImage bio experienceLevel')
    .populate('admins', 'name username profileImage bio experienceLevel')
    .populate('members', 'name username profileImage bio experienceLevel')
    .populate('pendingRequests', 'name username profileImage bio experienceLevel')
    .populate({
      path: 'pinnedMessages.message',
      populate: { path: 'sender', select: 'name username profileImage' }
    });

  if (!group) {
    throw new ApiError(404, 'Group not found');
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

  return res.status(200).json(
    new ApiResponse(200, {
      group: {
        ...group.toObject(),
        members: membersList,
        admins: adminsList,
        isMember,
        isAdmin,
        isPending,
        pendingRequests: isAdmin ? group.pendingRequests : []
      }
    }, 'Group details retrieved')
  );
});

export const updateGroup = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, description, image, privacy, category, tags } = req.body;
  const currentUserId = req.user._id.toString();

  const group = await Group.findById(id);
  if (!group) {
    throw new ApiError(404, 'Group not found');
  }

  const adminIds = (group.admins || []).map((a) => a.toString());
  if (!adminIds.includes(currentUserId)) {
    throw new ApiError(403, 'Only group admins can update settings');
  }

  if (name && name.trim()) group.name = name.trim();
  if (description !== undefined) group.description = description.trim();
  if (image !== undefined) group.image = image.trim();
  if (privacy && ['public', 'private'].includes(privacy)) group.privacy = privacy;
  if (category) group.category = category.trim();
  if (Array.isArray(tags)) group.tags = tags.map((t) => String(t).trim()).filter(Boolean);

  await group.save();

  return res.status(200).json(
    new ApiResponse(200, { group }, 'Group settings updated successfully!')
  );
});

export const joinGroup = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const currentUserId = req.user._id.toString();

  const group = await Group.findById(id);
  if (!group) {
    throw new ApiError(404, 'Group not found');
  }

  const memberIds = (group.members || []).map((m) => m.toString());
  const pendingIds = (group.pendingRequests || []).map((p) => p.toString());
  const kickedIds = (group.kickedUsers || []).map((k) => k.toString());
  const bannedIds = (group.bannedUsers || []).map((b) => b.toString());
  const providedCode = req.query.inviteCode || req.body.inviteCode;

  if (bannedIds.includes(currentUserId)) {
    throw new ApiError(403, 'You have been banned from this group by an administrator and cannot rejoin.');
  }

  if (kickedIds.includes(currentUserId)) {
    if (!providedCode || providedCode.toUpperCase() !== (group.inviteCode || '').toUpperCase()) {
      return res.status(403).json({
        success: false,
        requiresInvite: true,
        message: 'You were previously removed from this group by an admin. You cannot rejoin directly without an invitation link or valid invite code.'
      });
    }
    group.kickedUsers = group.kickedUsers.filter((k) => k.toString() !== currentUserId);
  }

  if (memberIds.includes(currentUserId)) {
    throw new ApiError(400, 'You are already a member of this group');
  }

  if (group.privacy === 'public' || (providedCode && providedCode.toUpperCase() === (group.inviteCode || '').toUpperCase())) {
    group.members.push(req.user._id);
    group.lastActivity = new Date();
    await group.save();

    try {
      const sysMsg = await GroupMessage.create({
        group: group._id,
        sender: req.user._id,
        content: `${req.user.name} joined the group`,
        fileType: 'system',
        isSystem: true
      });
      const populated = await GroupMessage.findById(sysMsg._id)
        .populate('sender', 'name username profileImage');
      emitGroupMessage(group._id, populated);
    } catch (sysErr) {
      console.error('System join message error:', sysErr.message);
    }

    return res.status(200).json(
      new ApiResponse(200, {
        isMember: true,
        isPending: false
      }, `Joined ${group.name} successfully!`)
    );
  }

  if (pendingIds.includes(currentUserId)) {
    throw new ApiError(400, 'Join request already submitted');
  }

  group.pendingRequests.push(req.user._id);
  await group.save();

  for (const adminId of group.admins) {
    await Notification.create({
      recipient: adminId,
      sender: req.user._id,
      type: 'Follow',
      content: `${req.user.name} requested to join your private group "${group.name}".`,
      link: `/groups/${group._id}`
    });
  }

  return res.status(200).json(
    new ApiResponse(200, {
      isMember: false,
      isPending: true
    }, 'Join request submitted! Group admin will review your request.')
  );
});

export const leaveGroup = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const currentUserId = req.user._id.toString();

  const group = await Group.findById(id);
  if (!group) {
    throw new ApiError(404, 'Group not found');
  }

  group.members = group.members.filter((m) => m.toString() !== currentUserId);
  group.admins = group.admins.filter((a) => a.toString() !== currentUserId);

  if (group.members.length === 0) {
    await GroupMessage.deleteMany({ group: group._id });
    await Group.findByIdAndDelete(group._id);
    return res.status(200).json(
      new ApiResponse(200, { groupDeleted: true }, `You left ${group.name}. Since you were the last member, the group has been deleted.`)
    );
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
    const sysMsg = await GroupMessage.create({
      group: group._id,
      sender: req.user._id,
      content: `${req.user.name} left the group`,
      fileType: 'system',
      isSystem: true
    });
    const populated = await GroupMessage.findById(sysMsg._id)
      .populate('sender', 'name username profileImage');
    emitGroupMessage(group._id, populated);
  } catch (sysErr) {
    console.error('System leave message error:', sysErr.message);
  }

  return res.status(200).json(
    new ApiResponse(200, { groupDeleted: false }, `You left ${group.name}`)
  );
});

export const deleteGroup = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const currentUserId = req.user._id.toString();

  const group = await Group.findById(id);
  if (!group) {
    throw new ApiError(404, 'Group not found');
  }

  const isCreator = group.creator.toString() === currentUserId;
  const isAdmin = (group.admins || []).some((a) => a.toString() === currentUserId);

  if (!isCreator && !isAdmin) {
    throw new ApiError(403, 'Only group admins or the creator can delete this group');
  }

  await GroupMessage.deleteMany({ group: id });
  await Group.findByIdAndDelete(id);

  return res.status(200).json(
    new ApiResponse(200, null, `Group "${group.name}" was deleted successfully.`)
  );
});

export const respondJoinRequest = asyncHandler(async (req, res) => {
  const { id, userId } = req.params;
  const { action } = req.body;
  const currentUserId = req.user._id.toString();

  const group = await Group.findById(id);
  if (!group) {
    throw new ApiError(404, 'Group not found');
  }

  const adminIds = (group.admins || []).map((a) => a.toString());
  if (!adminIds.includes(currentUserId)) {
    throw new ApiError(403, 'Only group admins can manage join requests');
  }

  group.pendingRequests = group.pendingRequests.filter((p) => p.toString() !== userId);

  if (action === 'accept') {
    if (!group.members.some((m) => m.toString() === userId)) {
      group.members.push(userId);
    }
    group.lastActivity = new Date();

    try {
      const acceptedUser = await User.findById(userId).select('name');
      const sysMsg = await GroupMessage.create({
        group: group._id,
        sender: userId,
        content: `${acceptedUser?.name || 'A new member'} joined the group`,
        fileType: 'system',
        isSystem: true
      });
      const populated = await GroupMessage.findById(sysMsg._id)
        .populate('sender', 'name username profileImage');
      emitGroupMessage(group._id, populated);
    } catch (sysErr) {
      console.error('System join message error:', sysErr.message);
    }

    await Notification.create({
      recipient: userId,
      sender: req.user._id,
      type: 'SessionBooked',
      content: `Your request to join "${group.name}" was approved!`,
      link: `/groups/${group._id}`
    });
  }

  await group.save();

  return res.status(200).json(
    new ApiResponse(200, { group }, action === 'accept' ? 'User accepted into group' : 'Request rejected')
  );
});

export const manageMemberRole = asyncHandler(async (req, res) => {
  const { id, userId } = req.params;
  const { action } = req.body;
  const currentUserId = req.user._id.toString();

  const group = await Group.findById(id);
  if (!group) {
    throw new ApiError(404, 'Group not found');
  }

  const adminIds = (group.admins || []).map((a) => a.toString());
  if (!adminIds.includes(currentUserId)) {
    throw new ApiError(403, 'Only group admins can manage member roles');
  }

  if (userId === group.creator.toString() && action !== 'make_admin') {
    throw new ApiError(400, 'Group creator cannot be demoted or removed');
  }

  if (action === 'make_admin') {
    if (!group.admins.some((a) => a.toString() === userId)) {
      group.admins.push(userId);
    }
  } else if (action === 'remove_admin') {
    group.admins = group.admins.filter((a) => a.toString() !== userId);
  } else if (action === 'kick') {
    group.members = group.members.filter((m) => m.toString() !== userId);
    group.admins = group.admins.filter((a) => a.toString() !== userId);
    if (!group.kickedUsers) group.kickedUsers = [];
    if (!group.kickedUsers.some((k) => k.toString() === userId)) {
      group.kickedUsers.push(userId);
    }

    try {
      const kickedUser = await User.findById(userId).select('name');
      const sysMsg = await GroupMessage.create({
        group: group._id,
        sender: req.user._id,
        content: `${kickedUser?.name || 'A member'} was removed from the group`,
        fileType: 'system',
        isSystem: true
      });
      const populated = await GroupMessage.findById(sysMsg._id)
        .populate('sender', 'name username profileImage');
      emitGroupMessage(group._id, populated);
    } catch (sysErr) {
      console.error('System kick message error:', sysErr.message);
    }
  } else if (action === 'ban') {
    group.members = group.members.filter((m) => m.toString() !== userId);
    group.admins = group.admins.filter((a) => a.toString() !== userId);
    if (!group.bannedUsers) group.bannedUsers = [];
    if (!group.bannedUsers.some((b) => b.toString() === userId)) {
      group.bannedUsers.push(userId);
    }

    try {
      const bannedUser = await User.findById(userId).select('name');
      const sysMsg = await GroupMessage.create({
        group: group._id,
        sender: req.user._id,
        content: `${bannedUser?.name || 'A member'} was banned from the group`,
        fileType: 'system',
        isSystem: true
      });
      const populated = await GroupMessage.findById(sysMsg._id)
        .populate('sender', 'name username profileImage');
      emitGroupMessage(group._id, populated);
    } catch (sysErr) {
      console.error('System ban message error:', sysErr.message);
    }
  } else if (action === 'unban') {
    group.bannedUsers = (group.bannedUsers || []).filter((b) => b.toString() !== userId);
    group.kickedUsers = (group.kickedUsers || []).filter((k) => k.toString() !== userId);
  }

  await group.save();

  return res.status(200).json(
    new ApiResponse(200, { group }, 'Member updated successfully')
  );
});

export const updateGroupMeetingLink = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { meetingLink, meetingLinkProvider } = req.body;
  const currentUserId = req.user._id.toString();

  const group = await Group.findById(id);
  if (!group) {
    throw new ApiError(404, 'Group not found');
  }

  const memberIds = (group.members || []).map((m) => m.toString());
  if (!memberIds.includes(currentUserId)) {
    throw new ApiError(403, 'Only group members can share or update video call links');
  }

  group.meetingLink = (meetingLink || '').trim();
  if (meetingLinkProvider) {
    group.meetingLinkProvider = meetingLinkProvider;
  }
  group.meetingLinkUpdatedBy = req.user._id;
  group.meetingLinkUpdatedAt = new Date();
  group.lastActivity = new Date();
  await group.save();

  return res.status(200).json(
    new ApiResponse(200, {
      meetingLink: group.meetingLink,
      meetingLinkProvider: group.meetingLinkProvider
    }, 'Group video call link updated!')
  );
});

export const getGroupMessages = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const currentUserId = req.user._id.toString();

  const group = await Group.findById(id);
  if (!group) {
    throw new ApiError(404, 'Group not found');
  }

  const memberIds = (group.members || []).map((m) => m.toString());
  if (group.privacy === 'private' && !memberIds.includes(currentUserId)) {
    throw new ApiError(403, 'Private group messages are only visible to members');
  }

  const messages = await GroupMessage.find({
    group: id,
    deletedFor: { $ne: req.user._id }
  })
    .populate('sender', 'name username profileImage')
    .populate('reactions.user', 'name username profileImage')
    .populate('pinnedBy', 'name username')
    .populate({
      path: 'replyTo',
      populate: { path: 'sender', select: 'name username' }
    })
    .sort({ createdAt: 1 })
    .limit(200)
    .lean();

  return res.status(200).json(
    new ApiResponse(200, { messages }, 'Group messages retrieved')
  );
});

export const sendGroupMessage = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { content, fileUrl, fileType, replyTo } = req.body;
  const currentUserId = req.user._id.toString();

  const group = await Group.findById(id);
  if (!group) {
    throw new ApiError(404, 'Group not found');
  }

  const memberIds = (group.members || []).map((m) => m.toString());
  if (!memberIds.includes(currentUserId)) {
    throw new ApiError(403, 'You must be a member of this group to send messages');
  }

  if (!content?.trim() && !fileUrl) {
    throw new ApiError(400, 'Message content or file required');
  }

  const message = await GroupMessage.create({
    group: id,
    sender: req.user._id,
    content: content?.trim() || '',
    fileUrl: fileUrl || '',
    fileType: fileType || 'none',
    replyTo: replyTo || undefined
  });

  group.lastActivity = new Date();
  await group.save();

  const populated = await GroupMessage.findById(message._id)
    .populate('sender', 'name username profileImage')
    .populate({
      path: 'replyTo',
      populate: { path: 'sender', select: 'name username' }
    });

  return res.status(201).json(
    new ApiResponse(201, { message: populated }, 'Message sent')
  );
});

export const togglePinMessage = asyncHandler(async (req, res) => {
  const { id, msgId } = req.params;
  const currentUserId = req.user._id.toString();

  const group = await Group.findById(id);
  if (!group) {
    throw new ApiError(404, 'Group not found');
  }

  const adminIds = (group.admins || []).map((a) => a.toString());
  if (!adminIds.includes(currentUserId)) {
    throw new ApiError(403, 'Only group admins can pin or unpin messages');
  }

  const message = await GroupMessage.findOne({ _id: msgId, group: id });
  if (!message) {
    throw new ApiError(404, 'Message not found');
  }

  const newPinnedState = !message.isPinned;
  message.isPinned = newPinnedState;
  message.pinnedBy = newPinnedState ? req.user._id : undefined;
  await message.save();

  if (newPinnedState) {
    group.pinnedMessages.push({
      message: message._id,
      pinnedBy: req.user._id,
      pinnedAt: new Date()
    });
  } else {
    group.pinnedMessages = group.pinnedMessages.filter((p) => p.message.toString() !== msgId);
  }

  await group.save();

  return res.status(200).json(
    new ApiResponse(200, {
      isPinned: newPinnedState
    }, newPinnedState ? 'Message pinned to group chat' : 'Message unpinned')
  );
});

export const deleteGroupMessage = asyncHandler(async (req, res) => {
  const { id, msgId } = req.params;
  const currentUserId = req.user._id.toString();

  const group = await Group.findById(id);
  if (!group) {
    throw new ApiError(404, 'Group not found');
  }

  const message = await GroupMessage.findOne({ _id: msgId, group: id });
  if (!message) {
    throw new ApiError(404, 'Message not found');
  }

  const mode = req.query.mode || req.body?.mode;

  if (mode === 'me' || message.deletedAt) {
    if (!message.deletedFor) {
      message.deletedFor = [];
    }
    if (!message.deletedFor.some((u) => u.toString() === currentUserId)) {
      message.deletedFor.push(req.user._id);
      await message.save();
    }
    return res.status(200).json(
      new ApiResponse(200, { mode: 'me', messageId: msgId }, 'Message removed from your view')
    );
  }

  const isSender = message.sender.toString() === currentUserId;
  const isAdmin = (group.admins || []).some((a) => a.toString() === currentUserId);

  if (!isSender && !isAdmin) {
    throw new ApiError(403, 'Not authorized to delete this message');
  }

  message.deletedAt = new Date();
  message.deletedBy = req.user._id;
  await message.save();

  return res.status(200).json(
    new ApiResponse(200, { mode: 'everyone', messageId: msgId }, 'Message marked as deleted')
  );
});

export const clearGroupChat = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const currentUserId = req.user._id;

  const group = await Group.findById(id);
  if (!group) {
    throw new ApiError(404, 'Group not found');
  }

  await GroupMessage.updateMany(
    { group: id, deletedFor: { $ne: currentUserId } },
    { $addToSet: { deletedFor: currentUserId } }
  );

  return res.status(200).json(
    new ApiResponse(200, null, 'Chat cleared successfully')
  );
});

export const addMemberToGroup = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { userId } = req.body;
  const currentUserId = req.user._id.toString();

  const group = await Group.findById(id);
  if (!group) {
    throw new ApiError(404, 'Group not found');
  }

  const adminIds = (group.admins || []).map((a) => a.toString());
  const memberIds = (group.members || []).map((m) => m.toString());
  const isMember = memberIds.includes(currentUserId);
  const isAdmin = adminIds.includes(currentUserId);

  if (!isMember && !isAdmin) {
    throw new ApiError(403, 'Only group members can add new users');
  }

  const targetUser = await User.findById(userId);
  if (!targetUser) {
    throw new ApiError(404, 'User not found');
  }

  if (memberIds.includes(userId)) {
    throw new ApiError(400, `${targetUser.name} is already a member of this group`);
  }

  group.kickedUsers = (group.kickedUsers || []).filter((k) => k.toString() !== userId);
  group.pendingRequests = (group.pendingRequests || []).filter((p) => p.toString() !== userId);
  group.members.push(userId);
  group.lastActivity = new Date();
  await group.save();

  try {
    await GroupMessage.create({
      group: group._id,
      sender: req.user._id,
      content: `${req.user.name} added ${targetUser.name} to the group`,
      isSystem: true,
      fileType: 'system'
    });
  } catch (sysErr) {
    console.error('System message error:', sysErr.message);
  }

  return res.status(200).json(
    new ApiResponse(200, { memberId: userId }, `${targetUser.name} added to the group`)
  );
});

