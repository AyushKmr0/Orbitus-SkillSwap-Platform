import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { useSelector, useDispatch } from 'react-redux';
import { addMessage, updateMessage, removeMessageForMe, setActiveChats } from '../features/chatSlice.js';
import { updateProfileSuccess } from '../features/authSlice.js';
import axios from 'axios';

const SocketContext = createContext(null);

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [onlineUsersList, setOnlineUsersList] = useState({});
  const [notifications, setNotifications] = useState([]);
  const [notificationSummary, setNotificationSummary] = useState({ totalUnread: 0, byLink: {} });
  
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const { token } = useSelector((state) => state.auth);
  const { currentRoomId } = useSelector((state) => state.chat);
  const dispatch = useDispatch();
  const currentRoomIdRef = useRef(currentRoomId);
  const userRef = useRef(user);

  useEffect(() => {
    currentRoomIdRef.current = currentRoomId;
  }, [currentRoomId]);

  useEffect(() => {
    userRef.current = user;
  }, [user]);

  useEffect(() => {
    if (isAuthenticated && user) {
      // Connect to Socket Server
      const socketConn = io('https://orbitus-skillswap-platform.onrender.com', {
        transports: ['polling', 'websocket'],
        reconnectionAttempts: 5,
        timeout: 10000
      });

      setSocket(socketConn);

      // Bind setup user handshake
      socketConn.emit('setup_user', user._id);

      // Listen to real-time message streams
      socketConn.on('receive_private_message', (message) => {
        if (message.chatRoomId === currentRoomIdRef.current) {
          dispatch(addMessage(message));
          
          // Mark seen immediately if active in the room
          socketConn.emit('mark_seen', {
            chatRoomId: message.chatRoomId,
            userId: userRef.current?._id
          });
        }
        fetchActiveChats();
      });

      socketConn.on('message_updated', (message) => {
        if (message.chatRoomId === currentRoomIdRef.current) {
          dispatch(updateMessage(message));
        }
      });

      socketConn.on('message_deleted', (message) => {
        if (message.chatRoomId === currentRoomIdRef.current) {
          dispatch(updateMessage(message));
        }
      });

      socketConn.on('message_deleted_for_me', (payload) => {
        if (payload.chatRoomId === currentRoomIdRef.current) {
          dispatch(removeMessageForMe(payload));
        }
      });

      socketConn.on('points_awarded', (payload) => {
        if (payload?.totalPoints !== undefined) {
          dispatch(updateProfileSuccess({ ...userRef.current, points: payload.totalPoints }));
        }
      });

      // Listen to real-time notification alerts
      socketConn.on('new_notification', (notification) => {
        const recipientId = notification?.recipient?._id || notification?.recipient || notification?.recipientId;
        const senderId = notification?.sender?._id || notification?.sender || notification?.senderId;
        if (!recipientId || recipientId.toString() !== userRef.current?._id?.toString()) return;
        if (senderId && senderId.toString() === userRef.current?._id?.toString()) return;

        setNotifications((prev) => [notification, ...prev]);
        fetchNotificationSummary();
        fetchActiveChats();
        
        // Show HTML5 native alert or visual pop if allowed
        if (Notification.permission === 'granted') {
          new window.Notification('Orbitus Notification', {
            body: notification.content,
            icon: '/favicon.svg'
          });
        }
      });

      // Listen to peer statuses
      socketConn.on('online_users_list', (userIds = []) => {
        setOnlineUsersList(
          userIds.reduce((acc, userId) => {
            acc[userId.toString()] = true;
            return acc;
          }, {})
        );
      });

      socketConn.on('user_status_changed', ({ userId, status }) => {
        setOnlineUsersList((prev) => ({
          ...prev,
          [userId.toString()]: status === 'online'
        }));
      });

      return () => {
        socketConn.disconnect();
      };
    } else {
      setNotifications([]);
      setNotificationSummary({ totalUnread: 0, byLink: {} });
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
      setOnlineUsersList({});
    }
  }, [isAuthenticated, user?._id, dispatch]);

  const fetchNotificationSummary = async () => {
    if (!token) return;

    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const res = await axios.get('/api/notifications/summary', config);
      setNotificationSummary({
        totalUnread: res.data.totalUnread || 0,
        byLink: res.data.byLink || {}
      });
    } catch (err) {
      console.error('Error loading notification summary:', err);
    }
  };

  const fetchActiveChats = async () => {
    if (!token) return;

    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const res = await axios.get('/api/messages/active', config);
      dispatch(setActiveChats(res.data.chats || []));
    } catch (err) {
      console.error('Error refreshing chat notifications:', err);
    }
  };

  const markNotificationsRead = async (payload) => {
    if (!token) return;

    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      await axios.put('/api/notifications/read', payload, config);
      fetchNotificationSummary();
    } catch (err) {
      console.error('Error marking notifications read:', err);
    }
  };

  useEffect(() => {
    if (isAuthenticated && token) {
      fetchNotificationSummary();
      fetchActiveChats();
      const intervalId = window.setInterval(() => {
        fetchNotificationSummary();
        fetchActiveChats();
      }, 15000);

      return () => window.clearInterval(intervalId);
    }
  }, [isAuthenticated, token]);

  const sendMessage = (content, recipientId, fileUrl = '', fileType = 'none', replyTo = null) => {
    if (socket && user) {
      const chatRoomId = [user._id.toString(), recipientId.toString()].sort().join('_');
      socket.emit('send_private_message', {
        senderId: user._id,
        recipientId,
        content,
        chatRoomId,
        fileUrl,
        fileType,
        replyTo
      });
    }
  };

  const sendTypingStatus = (recipientId, isTyping) => {
    if (socket && user) {
      const chatRoomId = [user._id.toString(), recipientId.toString()].sort().join('_');
      socket.emit('typing', {
        chatRoomId,
        userId: user._id,
        isTyping
      });
    }
  };

  return (
    <SocketContext.Provider value={{
      socket,
      sendMessage,
      sendTypingStatus,
      onlineUsersList,
      notifications,
      setNotifications,
      notificationSummary,
      fetchNotificationSummary,
      markNotificationsRead
    }}>
      {children}
    </SocketContext.Provider>
  );
};
