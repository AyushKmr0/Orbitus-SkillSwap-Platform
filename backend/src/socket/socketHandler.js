import jwt from 'jsonwebtoken';
import { z } from 'zod';
import Message from '../models/Message.js';
import User from '../models/User.js';

import { activityService } from '../services/activityService.js';
import ChatPreference from '../models/ChatPreference.js';
import Group from '../models/Group.js';
import GroupMessage from '../models/GroupMessage.js';
import { getJwtSecret } from '../config/env.js';
import {
  setUserPresenceOnline,
  setUserPresenceOffline,
  refreshUserPresence,
  getUserPresenceSocketCount,
  getGlobalOnlineUserIds,
  isRedisConnected
} from '../config/redis.js';

export const privateMessageSocketSchema = z.object({
  recipientId: z.string().min(1),
  chatRoomId: z.string().min(1),
  content: z.string().max(5000).optional().default(''),
  fileUrl: z.string().max(500).optional().default(''),
  fileType: z.string().max(50).optional().default('none'),
  replyTo: z.string().optional().nullable()
}).refine((data) => (data.content && data.content.trim().length > 0) || Boolean(data.fileUrl), {
  message: 'Message must have content or file'
});

export const groupMessageSocketSchema = z.object({
  groupId: z.string().min(1),
  content: z.string().max(5000).optional().default(''),
  fileUrl: z.string().max(500).optional().default(''),
  fileType: z.string().max(50).optional().default('none'),
  replyTo: z.string().optional().nullable()
}).refine((data) => (data.content && data.content.trim().length > 0) || Boolean(data.fileUrl), {
  message: 'Group message must have content or file'
});

export const typingSocketSchema = z.object({
  chatRoomId: z.string().min(1),
  isTyping: z.boolean()
});

export const markSeenSocketSchema = z.object({
  chatRoomId: z.string().min(1)
});

export const reactMessageSocketSchema = z.object({
  messageId: z.string().min(1),
  emoji: z.string().min(1).max(10),
  chatRoomId: z.string().min(1)
});

// Global map to track online users (userId -> Set<socketId>)
export const onlineUsers = new Map();
let socketServer = null;

export const getOnlineUserIds = async () => {
  if (isRedisConnected()) {
    try {
      const globalIds = await getGlobalOnlineUserIds();
      if (globalIds && Array.isArray(globalIds)) {
        const merged = new Set([...globalIds, ...onlineUsers.keys()]);
        return Array.from(merged);
      }
    } catch {
      // fallback to in-memory map
    }
  }
  return Array.from(onlineUsers.keys());
};

const addUserSocket = (userId, socketId) => {
  const key = userId?.toString();
  if (!key) return;

  const sockets = onlineUsers.get(key) || new Set();
  sockets.add(socketId);
  onlineUsers.set(key, sockets);
};

const removeUserSocket = (userId, socketId) => {
  const key = userId?.toString();
  if (!key) return false;

  const sockets = onlineUsers.get(key);
  if (!sockets) return false;

  sockets.delete(socketId);
  if (sockets.size === 0) {
    onlineUsers.delete(key);
    return true;
  }

  return false;
};

export const emitNotificationToUser = (recipientId, notification) => {
  const strId = recipientId?.toString();
  if (!strId || !socketServer) return;
  // Authoritative delivery via user room (delivers to all active devices on any cluster node)
  socketServer.to(`user_${strId}`).emit('new_notification', notification);
};

export const emitGroupMessage = (groupId, message) => {
  if (socketServer && groupId) {
    socketServer.to(`group_${groupId}`).emit('receive_group_message', message);
  }
};

export const emitUserFollowUpdate = (userId, payload) => {
  const strId = userId?.toString();
  if (!strId || !socketServer) return;
  // Authoritative delivery via user room
  socketServer.to(`user_${strId}`).emit('user_follow_update', payload);
};

const populateMessage = (message) => message.populate([
  { path: 'sender recipient', select: 'name profileImage' },
  { path: 'reactions.user', select: 'name profileImage' },
  {
    path: 'replyTo',
    select: 'content sender deletedAt',
    populate: { path: 'sender', select: 'name' }
  }
]);

export const socketHandler = (io) => {
  socketServer = io;

  // 0. SOCKET MIDDLEWARE: Authenticate every Socket.IO connection via JWT
  io.use(async (socket, next) => {
    try {
      const authHeader = socket.handshake.headers?.authorization;
      const token = socket.handshake.auth?.token ||
        (authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null);

      if (!token) {
        return next(new Error('Authentication error: Token required for real-time connection'));
      }

      const decoded = jwt.verify(token, getJwtSecret());
      const user = await User.findById(decoded.id).select('-password').lean();

      if (!user) {
        return next(new Error('Authentication error: User not found'));
      }

      socket.user = user;
      socket.userId = user._id.toString();
      return next();
    } catch (err) {
      console.warn('[SOCKET AUTH FAILURE]:', err.message);
      return next(new Error(`Authentication error: ${err.message}`));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.userId;
    console.log(`[SOCKET AUTHENTICATED]: User ${userId} connected (Socket ID: ${socket.id})`);

    // Auto-join per-user room for multi-instance delivery
    socket.join(`user_${userId}`);

    const wasOfflineLocally = !onlineUsers.has(userId);
    addUserSocket(userId, socket.id);

    // Register presence in Redis (with TTL)
    setUserPresenceOnline(userId, socket.id).catch(() => {});

    // Keepalive heartbeat to refresh Redis presence TTL while socket remains active
    const heartbeatInterval = setInterval(() => {
      refreshUserPresence(userId, 120).catch(() => {});
    }, 45000);

    getOnlineUserIds().then((initialOnlineList) => {
      socket.emit('online_users_list', initialOnlineList);
    }).catch(() => {
      socket.emit('online_users_list', Array.from(onlineUsers.keys()));
    });

    if (wasOfflineLocally) {
      io.emit('user_status_changed', { userId, status: 'online' });
    }

    // 1. Setup handler (for backwards compatibility, but identity is derived from verified token)
    socket.on('setup_user', () => {
      getOnlineUserIds().then((currentOnlineList) => {
        socket.emit('online_users_list', currentOnlineList);
      }).catch(() => {
        socket.emit('online_users_list', Array.from(onlineUsers.keys()));
      });
    });

    // 2. Join a private chat room with authorization check
    socket.on('join_room', (chatRoomId) => {
      if (!chatRoomId) return;
      // Chat room ID check: user must be part of the chat room ID or a participant
      const roomParts = chatRoomId.split('_');
      if (roomParts.length === 2 && !roomParts.includes(userId)) {
        console.warn(`[SOCKET DENIED]: User ${userId} attempted to join unauthorized room ${chatRoomId}`);
        return;
      }
      socket.join(chatRoomId);
    });

    // 3. One-to-one real-time message exchange
    socket.on('send_private_message', async (payload) => {
      const parsed = privateMessageSocketSchema.safeParse(payload);
      if (!parsed.success) {
        socket.emit('error_message', { message: 'Invalid message payload' });
        return;
      }
      const senderId = socket.userId; // Enforce authenticated sender identity
      const { recipientId, content, chatRoomId, fileUrl, fileType, replyTo } = parsed.data;

      try {
        const blockingPreference = await ChatPreference.findOne({
          $or: [
            { owner: senderId, partner: recipientId, isBlocked: true },
            { owner: recipientId, partner: senderId, isBlocked: true }
          ]
        }).lean();

        if (blockingPreference) {
          socket.emit('chat_blocked', { chatRoomId, recipientId });
          return;
        }

        await Promise.all([
          ChatPreference.findOneAndUpdate(
            { owner: senderId, partner: recipientId, isBlocked: false },
            { $set: { isRemoved: false, removedAt: null } }
          ),
          ChatPreference.findOneAndUpdate(
            { owner: recipientId, partner: senderId, isBlocked: false },
            { $set: { isRemoved: false, removedAt: null } }
          )
        ]);

        const message = await Message.create({
          sender: senderId,
          recipient: recipientId,
          content,
          chatRoomId,
          fileUrl: fileUrl || '',
          fileType: fileType || 'none',
          replyTo: replyTo || null,
          isSeen: false
        });

        const populatedMessage = await populateMessage(message);

        if (fileUrl && fileType && fileType !== 'none') {
          const shareReward = await activityService.recordResourceShare({
            userId: senderId,
            fileUrl,
            fileType
          });
          if (shareReward.awarded) {
            socket.emit('points_awarded', {
              reason: 'resource_share',
              points: 20,
              totalPoints: shareReward.totalPoints
            });
          }
        }

        // 1. Deliver to active participants in the open chat room
        io.to(chatRoomId).emit('receive_private_message', populatedMessage);

        // 2. Deliver to user rooms of recipient & sender ONLY for sockets not in chatRoomId (avoids duplicate client events)
        io.to(`user_${recipientId}`).except(chatRoomId).emit('receive_private_message', populatedMessage);
        io.to(`user_${senderId}`).except(chatRoomId).emit('receive_private_message', populatedMessage);
      } catch (error) {
        console.error('[SOCKET ERROR] private message failed:', error.message);
      }
    });

    socket.on('edit_message', async (payload) => {
      const senderId = socket.userId;
      const { messageId, content, chatRoomId } = payload;

      try {
        const message = await Message.findOne({
          _id: messageId,
          sender: senderId,
          deletedAt: null
        });

        if (!message) return;

        const fiveMinutes = 5 * 60 * 1000;
        if (Date.now() - new Date(message.createdAt).getTime() > fiveMinutes) {
          socket.emit('error_message', { message: 'Messages can only be edited within 5 minutes of sending' });
          return;
        }

        message.content = content;
        message.isEdited = true;
        await message.save();

        const populatedMessage = await populateMessage(message);
        io.to(chatRoomId).emit('message_updated', populatedMessage);
      } catch (error) {
        console.error('[SOCKET ERROR] edit message failed:', error.message);
      }
    });

    socket.on('delete_message', async (payload) => {
      const senderId = socket.userId;
      const { messageId, chatRoomId, mode = 'everyone' } = payload;

      try {
        const query = mode === 'me'
          ? { _id: messageId }
          : { _id: messageId, sender: senderId, deletedAt: null };

        const message = await Message.findOne(query);

        if (!message) return;

        if (mode === 'me') {
          if (!message.deletedFor.some(id => id.toString() === senderId)) {
            message.deletedFor.push(senderId);
          }
        } else {
          message.content = '';
          message.fileUrl = '';
          message.fileType = 'none';
          message.deletedAt = new Date();
        }

        await message.save();

        const populatedMessage = await populateMessage(message);
        if (mode === 'me') {
          socket.emit('message_deleted_for_me', { messageId, chatRoomId });
        } else {
          io.to(chatRoomId).emit('message_deleted', populatedMessage);
        }
      } catch (error) {
        console.error('[SOCKET ERROR] delete message failed:', error.message);
      }
    });

    socket.on('react_message', async (payload) => {
      const parsed = reactMessageSocketSchema.safeParse(payload);
      if (!parsed.success) return;
      const currentUserId = socket.userId;
      const { messageId, emoji, chatRoomId } = parsed.data;
      try {
        const message = await Message.findById(messageId);
        if (!message) return;

        if (!message.reactions) message.reactions = [];

        const existingIndex = message.reactions.findIndex(
          (r) => r.user?.toString() === currentUserId
        );

        if (existingIndex > -1) {
          if (message.reactions[existingIndex].emoji === emoji) {
            message.reactions.splice(existingIndex, 1);
          } else {
            message.reactions[existingIndex].emoji = emoji;
          }
        } else {
          message.reactions.push({ user: currentUserId, emoji });
        }

        await message.save();
        const populatedMessage = await populateMessage(message);
        io.to(chatRoomId).emit('message_reaction_updated', {
          messageId,
          reactions: populatedMessage.reactions
        });
      } catch (error) {
        console.error('[SOCKET ERROR] message reaction failed:', error.message);
      }
    });

    // 4. Client typing indicator
    socket.on('typing', (payload) => {
      const parsed = typingSocketSchema.safeParse(payload);
      if (!parsed.success) return;
      const { chatRoomId, isTyping } = parsed.data;
      socket.to(chatRoomId).emit('typing_status', { userId: socket.userId, isTyping });
    });

    // 5. Read seen indicator update
    socket.on('mark_seen', async (payload) => {
      const parsed = markSeenSocketSchema.safeParse(payload);
      if (!parsed.success) return;
      const { chatRoomId } = parsed.data;
      const currentUserId = socket.userId;

      try {
        await Message.updateMany(
          { chatRoomId, recipient: currentUserId, isSeen: false },
          { $set: { isSeen: true } }
        );

        socket.to(chatRoomId).emit('messages_marked_seen', { chatRoomId });
      } catch (error) {
        console.error('[SOCKET ERROR] seen status sync failed:', error.message);
      }
    });

    // 6. Group Socket Events (with Group Membership Authorization)
    socket.on('join_group', async (groupId) => {
      if (!groupId) return;
      try {
        const group = await Group.findById(groupId).select('members creator privacy').lean();
        if (!group) return;

        const isMember = group.creator?.toString() === userId ||
          group.members?.some(m => (m.user?.toString() || m.toString()) === userId);

        if (isMember || group.privacy === 'Public') {
          socket.join(`group_${groupId}`);
        } else {
          console.warn(`[SOCKET DENIED]: User ${userId} attempted unauthorized join of group ${groupId}`);
        }
      } catch (err) {
        console.error('[SOCKET ERROR] join_group failed:', err.message);
      }
    });

    socket.on('leave_group', (groupId) => {
      if (groupId) {
        socket.leave(`group_${groupId}`);
      }
    });

    socket.on('send_group_message', async (payload) => {
      const parsed = groupMessageSocketSchema.safeParse(payload);
      if (!parsed.success) {
        socket.emit('error_message', { message: 'Invalid group message payload' });
        return;
      }
      const senderId = socket.userId;
      const { groupId, content, fileUrl, fileType, replyTo } = parsed.data;
      try {
        const group = await Group.findById(groupId).select('members creator').lean();
        if (!group) return;

        const isMember = group.creator?.toString() === senderId ||
          group.members?.some(m => (m.user?.toString() || m.toString()) === senderId);

        if (!isMember) {
          socket.emit('error_message', { message: 'You must be a member of this group to send messages' });
          return;
        }

        const message = await GroupMessage.create({
          group: groupId,
          sender: senderId,
          content: content || '',
          fileUrl: fileUrl || '',
          fileType: fileType || 'none',
          replyTo: replyTo || undefined
        });

        const populated = await GroupMessage.findById(message._id)
          .populate('sender', 'name username profileImage')
          .populate({
            path: 'replyTo',
            populate: { path: 'sender', select: 'name username' }
          });

        io.to(`group_${groupId}`).emit('receive_group_message', populated);
      } catch (err) {
        console.error('[SOCKET ERROR] group message failed:', err.message);
      }
    });

    socket.on('group_vc_link_changed', async (payload) => {
      const { groupId, meetingLink, meetingLinkProvider, updatedByName } = payload;
      try {
        const group = await Group.findById(groupId).select('creator members').lean();
        if (!group) return;
        const isAuthorized = group.creator?.toString() === userId ||
          group.members?.some(m => (m.user?.toString() || m.toString()) === userId && m.role === 'admin');

        if (isAuthorized) {
          io.to(`group_${groupId}`).emit('group_vc_link_updated', {
            groupId,
            meetingLink,
            meetingLinkProvider,
            updatedByName
          });
        }
      } catch (err) {
        console.error('[SOCKET ERROR] VC link change failed:', err.message);
      }
    });

    socket.on('group_message_pinned', async (payload) => {
      const { groupId, messageId, isPinned } = payload;
      try {
        const group = await Group.findById(groupId).select('creator members').lean();
        if (!group) return;
        const isAuthorized = group.creator?.toString() === userId ||
          group.members?.some(m => (m.user?.toString() || m.toString()) === userId && m.role === 'admin');

        if (isAuthorized) {
          io.to(`group_${groupId}`).emit('group_pin_changed', { groupId, messageId, isPinned });
        }
      } catch (err) {
        console.error('[SOCKET ERROR] group pin change failed:', err.message);
      }
    });

    socket.on('group_message_deleted', async (payload) => {
      const { groupId, messageId } = payload;
      try {
        const message = await GroupMessage.findById(messageId);
        if (!message) return;

        const group = await Group.findById(groupId).select('creator members').lean();
        const isSender = message.sender.toString() === userId;
        const isAdmin = group?.creator?.toString() === userId ||
          group?.members?.some(m => (m.user?.toString() || m.toString()) === userId && m.role === 'admin');

        if (isSender || isAdmin) {
          message.content = '';
          message.fileUrl = '';
          message.fileType = 'none';
          message.deletedAt = new Date();
          await message.save();
          io.to(`group_${groupId}`).emit('group_message_removed', { groupId, messageId });
        }
      } catch (err) {
        console.error('[SOCKET ERROR] group message delete failed:', err.message);
      }
    });

    socket.on('react_group_message', async (payload) => {
      const currentUserId = socket.userId;
      const { groupId, messageId, emoji } = payload;
      try {
        const message = await GroupMessage.findById(messageId);
        if (!message) return;

        if (!message.reactions) message.reactions = [];

        const existingIndex = message.reactions.findIndex(
          (r) => r.user?.toString() === currentUserId
        );

        if (existingIndex > -1) {
          if (message.reactions[existingIndex].emoji === emoji) {
            message.reactions.splice(existingIndex, 1);
          } else {
            message.reactions[existingIndex].emoji = emoji;
          }
        } else {
          message.reactions.push({ user: currentUserId, emoji });
        }

        await message.save();
        io.to(`group_${groupId}`).emit('group_message_reaction_updated', {
          groupId,
          messageId,
          reactions: message.reactions
        });
      } catch (err) {
        console.error('[SOCKET ERROR] group message reaction failed:', err.message);
      }
    });

    // 7. Cleanup on client disconnection
    socket.on('disconnect', async () => {
      clearInterval(heartbeatInterval);
      console.log(`[SOCKET]: Client disconnected (ID: ${socket.id}, User ID: ${userId})`);
      if (userId) {
        await setUserPresenceOffline(userId, socket.id).catch(() => {});
        const wentOfflineLocally = removeUserSocket(userId, socket.id);

        // Multi-device safe: verify if user has any active sockets remaining
        let isGloballyOffline = wentOfflineLocally;
        if (isRedisConnected()) {
          const remainingRedisSockets = await getUserPresenceSocketCount(userId);
          isGloballyOffline = (remainingRedisSockets === 0);
        }

        if (isGloballyOffline) {
          console.log(`[SOCKET]: User ${userId} went offline.`);
          io.emit('user_status_changed', { userId, status: 'offline' });
        }
      }
    });
  });
};
