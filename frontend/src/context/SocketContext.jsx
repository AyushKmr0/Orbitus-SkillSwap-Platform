import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { addMessage, updateMessage, updateMessageReactions, removeMessageForMe, setActiveChats } from '../features/chatSlice.js';
import { updateProfileSuccess } from '../features/authSlice.js';
import apiClient from '../services/apiClient.js';
import { socketUrl, backendUrl } from '../config/env.js';

const SocketContext = createContext(null);

export const useSocket = () => useContext(SocketContext);

export const playNotificationChime = () => {
  if (localStorage.getItem('orbitus_pref_sound') === 'false') return;
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.12);

    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.35);
  } catch {
    // Autoplay fallback
  }
};

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
  const socketRef = useRef(null);

  const fetchNotificationSummary = useCallback(async () => {
    if (!token) return;

    try {
      const res = await apiClient.get('/api/notifications/summary');
      const payload = res.data?.data || res.data || {};
      setNotificationSummary({
        totalUnread: payload.totalUnread ?? res.data?.totalUnread ?? 0,
        byLink: payload.byLink || res.data?.byLink || {}
      });
    } catch (err) {
      if (err.code === 'ERR_NETWORK' || !err.response) {
        if (import.meta.env.DEV) {
          console.warn('[OFFLINE NOTICE]: Backend service is unreachable at', backendUrl);
        }
      } else {
        console.error('Error loading notification summary:', err);
      }
    }
  }, [token]);

  const fetchActiveChats = useCallback(async () => {
    if (!token) return;

    try {
      const res = await apiClient.get('/api/messages/active');
      const payload = res.data?.data || res.data || {};
      const chats = payload.chats || res.data?.chats || [];
      dispatch(setActiveChats(Array.isArray(chats) ? chats : []));
    } catch (err) {
      if (err.code === 'ERR_NETWORK' || !err.response) {
        if (import.meta.env.DEV) {
          console.warn('[OFFLINE NOTICE]: Chat notifications unreachable at', backendUrl);
        }
      } else {
        console.error('Error refreshing chat notifications:', err);
      }
    }
  }, [token, dispatch]);

  useEffect(() => {
    currentRoomIdRef.current = currentRoomId;
  }, [currentRoomId]);

  useEffect(() => {
    userRef.current = user;
  }, [user]);

  useEffect(() => {
    let isCancelled = false;
    let localSocket = null;

    if (isAuthenticated && user && token) {
      import('socket.io-client').then(({ io }) => {
        if (isCancelled) return;

        const preferredTransports = import.meta.env.VITE_SOCKET_TRANSPORTS
          ? import.meta.env.VITE_SOCKET_TRANSPORTS.split(',').map((t) => t.trim())
          : ['polling', 'websocket'];

        // Connect to Socket Server with JWT auth
        const socketConn = io(socketUrl, {
          auth: { token },
          extraHeaders: {
            Authorization: `Bearer ${token}`
          },
          transports: preferredTransports,
          reconnectionAttempts: 10,
          reconnectionDelay: 1000,
          reconnectionDelayMax: 5000,
          timeout: 10000
        });

        localSocket = socketConn;
        socketRef.current = socketConn;
        setSocket(socketConn);

        socketConn.on('connect_error', (err) => {
          console.warn('[SOCKET CONNECT NOTICE]: Real-time connection handshake notice:', err.message);
        });

        // Bind setup user handshake with privacy presence check
        const hideOnline = localStorage.getItem('orbitus_pref_online') === 'false';
        if (!hideOnline) {
          socketConn.emit('setup_user', user._id);
        }

        // Listen to real-time message streams
        socketConn.on('receive_private_message', (message) => {
          playNotificationChime();
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

        socketConn.on('message_reaction_updated', (payload) => {
          dispatch(updateMessageReactions(payload));
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

          playNotificationChime();
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
      });

      return () => {
        isCancelled = true;
        if (localSocket) {
          localSocket.disconnect();
        }
        if (socketRef.current) {
          socketRef.current.disconnect();
          socketRef.current = null;
        }
        setSocket(null);
      };
    } else {
      setNotifications([]);
      setNotificationSummary({ totalUnread: 0, byLink: {} });
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setSocket(null);
      }
      setOnlineUsersList({});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, user?._id, token, dispatch, fetchNotificationSummary, fetchActiveChats]);


  const markNotificationsRead = async (payload) => {
    if (!token) return;

    try {
      await apiClient.put('/api/notifications/read', payload);
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
      }, 60000);

      return () => window.clearInterval(intervalId);
    }
  }, [isAuthenticated, token, fetchNotificationSummary, fetchActiveChats]);


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
