import Message from '../models/Message.js';
import User from '../models/User.js';
import Leaderboard from '../models/Leaderboard.js';
import ChatPreference from '../models/ChatPreference.js';

// Global map to track online users (userId -> Set<socketId>)
export const onlineUsers = new Map();
let socketServer = null;

const getOnlineUserIds = () => Array.from(onlineUsers.keys());

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
  const recipientSocketIds = onlineUsers.get(recipientId?.toString());
  if (socketServer && recipientSocketIds) {
    recipientSocketIds.forEach((socketId) => {
      socketServer.to(socketId).emit('new_notification', notification);
    });
  }
};

const populateMessage = (message) => message.populate([
  { path: 'sender recipient', select: 'name profileImage' },
  {
    path: 'replyTo',
    select: 'content sender deletedAt',
    populate: { path: 'sender', select: 'name' }
  }
]);

export const socketHandler = (io) => {
  socketServer = io;
  io.on('connection', (socket) => {
    console.log(`[SOCKET]: Client connected (ID: ${socket.id})`);

    // 1. Handshake mapping: Associate userId to active socket connection
    socket.on('setup_user', (userId) => {
      if (userId) {
        const normalizedUserId = userId.toString();
        const wasOffline = !onlineUsers.has(normalizedUserId);
        addUserSocket(normalizedUserId, socket.id);
        socket.userId = normalizedUserId;
        console.log(`[SOCKET]: User ${userId} is now online (Socket ID: ${socket.id})`);

        socket.emit('online_users_list', getOnlineUserIds());

        if (wasOffline) {
          io.emit('user_status_changed', { userId: normalizedUserId, status: 'online' });
        }
      }
    });

    // 2. Join a private chat room
    socket.on('join_room', (chatRoomId) => {
      socket.join(chatRoomId);
      console.log(`[SOCKET]: Socket ${socket.id} joined room ${chatRoomId}`);
    });

    // 3. One-to-one real-time message exchange
    socket.on('send_private_message', async (payload) => {
      const { senderId, recipientId, content, chatRoomId, fileUrl, fileType, replyTo } = payload;
      
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

        // Persist message in MongoDB
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

        if (fileType && fileType !== 'none') {
          const updatedUser = await User.findByIdAndUpdate(
            senderId,
            { $inc: { points: 20 } },
            { new: true, select: 'points' }
          );
          await Leaderboard.findOneAndUpdate(
            { user: senderId },
            { $inc: { points: 20 }, $setOnInsert: { user: senderId } },
            { upsert: true }
          );
          socket.emit('points_awarded', {
            reason: 'resource_share',
            points: 20,
            totalPoints: updatedUser?.points
          });
        }

        // Deliver immediately if recipient is active in room
        io.to(chatRoomId).emit('receive_private_message', populatedMessage);
      } catch (error) {
        console.error('[SOCKET ERROR] message transmission failed:', error.message);
      }
    });

    socket.on('edit_message', async (payload) => {
      const { messageId, senderId, content, chatRoomId } = payload;

      try {
        const message = await Message.findOne({
          _id: messageId,
          sender: senderId,
          deletedAt: null
        });

        if (!message) return;

        message.content = content;
        message.isEdited = true;
        await message.save();

        const populatedMessage = await populateMessage(message);
        io.to(chatRoomId).emit('message_updated', populatedMessage);
      } catch (error) {
        console.error('[SOCKET ERROR] message edit failed:', error.message);
      }
    });

    socket.on('delete_message', async (payload) => {
      const { messageId, senderId, chatRoomId, mode = 'everyone' } = payload;

      try {
        const query = mode === 'me'
          ? { _id: messageId }
          : { _id: messageId, sender: senderId, deletedAt: null };

        const message = await Message.findOne(query);

        if (!message) return;

        if (mode === 'me') {
          if (!message.deletedFor.some(userId => userId.toString() === senderId.toString())) {
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
        console.error('[SOCKET ERROR] message delete failed:', error.message);
      }
    });

    // 4. Client typing indicator
    socket.on('typing', (payload) => {
      const { chatRoomId, userId, isTyping } = payload;
      socket.to(chatRoomId).emit('typing_status', { userId, isTyping });
    });

    // 5. Read seen indicator update
    socket.on('mark_seen', async (payload) => {
      const { chatRoomId, userId } = payload; // userId of recipient viewing messages
      
      try {
        await Message.updateMany(
          { chatRoomId, recipient: userId, isSeen: false },
          { $set: { isSeen: true } }
        );

        socket.to(chatRoomId).emit('messages_marked_seen', { chatRoomId });
      } catch (error) {
        console.error('[SOCKET ERROR] seen status sync failed:', error.message);
      }
    });

    // 6. Generic system notification trigger (for sessions, badges, etc.)
    socket.on('trigger_notification', async (payload) => {
      const { recipientId, type, content, link } = payload;
      const recipientSocketIds = onlineUsers.get(recipientId?.toString());

      if (recipientSocketIds) {
        recipientSocketIds.forEach((socketId) => {
          io.to(socketId).emit('new_notification', payload);
        });
      }
    });

    // 7. Cleanup on client disconnection
    socket.on('disconnect', () => {
      console.log(`[SOCKET]: Client disconnected (ID: ${socket.id})`);
      if (socket.userId) {
        const wentOffline = removeUserSocket(socket.userId, socket.id);

        if (wentOffline) {
          console.log(`[SOCKET]: User ${socket.userId} went offline.`);
          io.emit('user_status_changed', { userId: socket.userId, status: 'offline' });
        }
      }
    });
  });
};
