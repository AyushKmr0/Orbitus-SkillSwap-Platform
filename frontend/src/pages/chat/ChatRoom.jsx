import React, { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Link, useLocation } from 'react-router-dom';
import { setActiveChats, setCurrentRoom, setMessages, removeMessageForMe, chatStart, chatFailure } from '../../features/chatSlice.js';
import { useSocket } from '../../context/SocketContext.jsx';
import apiClient from '../../services/apiClient.js';
import {
  Send,
  Image,
  Paperclip,
  Check,
  CheckCheck,
  Smile,
  ChevronLeft,
  ChevronDown,
  MoreVertical,
  Reply,
  Copy,
  Pencil,
  Trash2,
  X,
  CheckSquare,
  Ban,
  Plus,
  MessageSquare
} from 'lucide-react';

const ChatRoom = () => {
  const { user, token } = useSelector((state) => state.auth);
  const { activeChats, currentRoomId, messages, chatPartner, loading } = useSelector((state) => state.chat);
  const dispatch = useDispatch();
  const location = useLocation();

  const { socket, sendMessage, sendTypingStatus, onlineUsersList } = useSocket();

  const [typedMessage, setTypedMessage] = useState('');
  const [peerIsTyping, setPeerIsTyping] = useState(false);
  const [mobileShowSidebar, setMobileShowSidebar] = useState(true);
  const [openMessageMenu, setOpenMessageMenu] = useState('');
  const [menuPlacement, setMenuPlacement] = useState('down');
  const [activeReactionMsgId, setActiveReactionMsgId] = useState(null);
  const closeConvMenuTimerRef = useRef(null);

  const handleConvMenuMouseEnter = (menuId) => {
    if (closeConvMenuTimerRef.current) {
      clearTimeout(closeConvMenuTimerRef.current);
      closeConvMenuTimerRef.current = null;
    }
    setOpenConversationMenu(menuId);
  };

  const handleConvMenuMouseLeave = () => {
    if (closeConvMenuTimerRef.current) clearTimeout(closeConvMenuTimerRef.current);
    closeConvMenuTimerRef.current = setTimeout(() => {
      setOpenConversationMenu('');
    }, 200);
  };
  const [replyTarget, setReplyTarget] = useState(null);
  const [editingMessage, setEditingMessage] = useState(null);
  const [selectedMessageIds, setSelectedMessageIds] = useState([]);
  const [selectionMode, setSelectionMode] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [openConversationMenu, setOpenConversationMenu] = useState('');
  const [showBlockedModal, setShowBlockedModal] = useState(false);
  const [blockedUsers, setBlockedUsers] = useState([]);

  const messagesEndRef = useRef(null);
  const messageInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const imageInputRef = useRef(null);
  const documentInputRef = useRef(null);

  useEffect(() => {
    fetchActiveChats();
  }, [token]);

  useEffect(() => {
    if (currentRoomId) {
      socket?.emit('join_room', currentRoomId);
      fetchMessageLogs(currentRoomId);
      markMessagesSeen(currentRoomId);
      if (location.state?.directChat) {
        setMobileShowSidebar(false);
      }
    }
  }, [currentRoomId, socket]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Setup Socket listeners for typing and seen logs
  useEffect(() => {
    if (socket) {
      socket.on('typing_status', ({ userId, isTyping }) => {
        if (chatPartner && userId === chatPartner._id) {
          setPeerIsTyping(isTyping);
        }
      });

      socket.on('messages_marked_seen', ({ chatRoomId }) => {
        if (chatRoomId === currentRoomId) {
          // Re-load histories to see CheckCheck double ticks
          fetchMessageLogs(chatRoomId);
        }
      });

    }

    return () => {
      if (socket) {
        socket.off('typing_status');
        socket.off('messages_marked_seen');
      }
    };
  }, [socket, chatPartner, currentRoomId]);

  const fetchActiveChats = async () => {
    try {
      const res = await apiClient.get('/api/messages/active');
      const serverChats = res.data.chats || [];
      const hasSelectedDraft = currentRoomId && chatPartner && !serverChats.some(chat => chat.chatRoomId === currentRoomId);
      dispatch(setActiveChats(hasSelectedDraft ? [
        {
          partner: chatPartner,
          chatRoomId: currentRoomId,
          lastMessage: {
            content: 'Start the conversation',
            fileType: 'none',
            isSeen: true,
            sender: user._id,
            createdAt: new Date().toISOString()
          }
        },
        ...serverChats
      ] : serverChats));
    } catch (err) {
      console.error('Error loading active chat partners:', err);
    }
  };

  const fetchBlockedUsers = async () => {
    try {
      const res = await apiClient.get('/api/messages/blocked');
      setBlockedUsers(res.data.blockedUsers || []);
    } catch (err) {
      console.error('Error loading blocked chat users:', err);
    }
  };

  const fetchMessageLogs = async (roomId) => {
    dispatch(chatStart());
    try {
      const res = await apiClient.get(`/api/messages/${roomId}`);
      dispatch(setMessages(res.data.messages));
    } catch (err) {
      dispatch(chatFailure(err.response?.data?.message || 'Error loading messages'));
    }
  };

  const markMessagesSeen = async (roomId) => {
    try {
      await apiClient.put(`/api/messages/${roomId}/seen`, {});
      if (socket) {
        socket.emit('mark_seen', { chatRoomId: roomId, userId: user._id });
      }
      fetchActiveChats();
    } catch (err) {
      console.error('Error updating seen ticks:', err);
    }
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!typedMessage.trim() || !chatPartner) return;

    if (editingMessage) {
      const fiveMinutes = 5 * 60 * 1000;
      if (Date.now() - new Date(editingMessage.createdAt).getTime() > fiveMinutes) {
        alert('Messages can only be edited within 5 minutes of sending.');
        setEditingMessage(null);
        setTypedMessage('');
        return;
      }
      socket?.emit('edit_message', {
        messageId: editingMessage._id,
        senderId: user._id,
        chatRoomId: currentRoomId,
        content: typedMessage.trim()
      });
      setEditingMessage(null);
    } else {
      sendMessage(typedMessage.trim(), chatPartner._id, '', 'none', replyTarget?._id || null);
      setReplyTarget(null);
    }
    
    setTypedMessage('');
    sendTypingStatus(chatPartner._id, false);
    fetchActiveChats();
  };

  const handleComposerKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };

  const startReply = (message) => {
    setReplyTarget(message);
    setEditingMessage(null);
    setOpenMessageMenu('');
    setTimeout(() => messageInputRef.current?.focus(), 80);
  };

  // Touch gestures for mobile WhatsApp-style swipe-to-reply and double-tap
  const touchStartXRef = useRef(0);
  const touchStartYRef = useRef(0);
  const isSwipingRef = useRef(false);
  const swipingBubbleRef = useRef(null);
  const lastTapTimeRef = useRef({});
  const hasVibratedRef = useRef(false);

  const handleBubbleTouchStart = (e, msg) => {
    if (msg.deletedAt) return;
    touchStartXRef.current = e.touches[0].clientX;
    touchStartYRef.current = e.touches[0].clientY;
    isSwipingRef.current = false;
    hasVibratedRef.current = false;
    swipingBubbleRef.current = e.currentTarget;
  };

  const handleBubbleTouchMove = (e, msg) => {
    if (msg.deletedAt || !swipingBubbleRef.current) return;
    const currentX = e.touches[0].clientX;
    const currentY = e.touches[0].clientY;
    const deltaX = currentX - touchStartXRef.current;
    const deltaY = Math.abs(currentY - touchStartYRef.current);

    if (deltaX > 8 && deltaX > deltaY) {
      isSwipingRef.current = true;
      const clamped = Math.min(Math.max(0, deltaX), 65);
      swipingBubbleRef.current.style.transform = `translateX(${clamped}px)`;
      swipingBubbleRef.current.style.transition = 'none';

      const replyIcon = swipingBubbleRef.current.parentElement?.querySelector(`.swipe-reply-icon-${msg._id}`);
      if (replyIcon) {
        const progress = Math.min(1, clamped / 45);
        replyIcon.style.opacity = `${progress}`;
        replyIcon.style.transform = `translateY(-50%) scale(${0.5 + progress * 0.5})`;
        if (clamped >= 45) {
          replyIcon.classList.add('!bg-indigo-600', '!text-white');
          if (!hasVibratedRef.current) {
            hasVibratedRef.current = true;
            if (navigator?.vibrate) navigator.vibrate(35);
          }
        } else {
          replyIcon.classList.remove('!bg-indigo-600', '!text-white');
        }
      }
    }
  };

  const handleBubbleTouchEnd = (e, msg) => {
    if (msg.deletedAt || !swipingBubbleRef.current) return;
    const bubble = swipingBubbleRef.current;
    const deltaX = e.changedTouches[0].clientX - touchStartXRef.current;
    const deltaY = Math.abs(e.changedTouches[0].clientY - touchStartYRef.current);

    bubble.style.transition = 'transform 0.25s cubic-bezier(0.2, 0.8, 0.2, 1)';
    bubble.style.transform = 'translateX(0px)';

    const replyIcon = bubble.parentElement?.querySelector(`.swipe-reply-icon-${msg._id}`);
    if (replyIcon) {
      replyIcon.style.transition = 'all 0.2s ease';
      replyIcon.style.opacity = '0';
      replyIcon.style.transform = 'translateY(-50%) scale(0.5)';
      replyIcon.classList.remove('!bg-indigo-600', '!text-white');
    }

    if (isSwipingRef.current && deltaX >= 45 && deltaY < 50) {
      startReply(msg);
      swipingBubbleRef.current = null;
      return;
    }

    const now = Date.now();
    const lastTap = lastTapTimeRef.current[msg._id] || 0;
    if (now - lastTap < 320 && Math.abs(deltaX) < 15 && deltaY < 15) {
      if (navigator?.vibrate) navigator.vibrate(30);
      startReply(msg);
      lastTapTimeRef.current[msg._id] = 0;
    } else {
      lastTapTimeRef.current[msg._id] = now;
    }

    swipingBubbleRef.current = null;
  };

  const handleToggleReaction = (messageId, emoji) => {
    if (!socket || !currentRoomId) return;
    socket.emit('react_message', {
      messageId,
      userId: user._id,
      emoji,
      chatRoomId: currentRoomId
    });
    setOpenMessageMenu('');
    setActiveReactionMsgId(null);
  };

  const handleQuickReaction = (message, emoji) => {
    handleToggleReaction(message._id, emoji);
  };

  const startEdit = (message) => {
    const fiveMinutes = 5 * 60 * 1000;
    if (Date.now() - new Date(message.createdAt).getTime() > fiveMinutes) {
      alert('Messages can only be edited within 5 minutes of sending.');
      return;
    }
    setEditingMessage(message);
    setReplyTarget(null);
    setTypedMessage(message.content);
    setOpenMessageMenu('');
  };

  const performDeleteMessage = (message, mode = 'everyone') => {
    socket?.emit('delete_message', {
      messageId: message._id,
      senderId: user._id,
      chatRoomId: currentRoomId,
      mode
    });
    if (mode === 'me') {
      dispatch(removeMessageForMe({ messageId: message._id }));
    }
    setOpenMessageMenu('');
    setTimeout(fetchActiveChats, 250);
  };

  const requestDeleteMessage = (message, mode = 'everyone') => {
    setConfirmAction({
      title: mode === 'everyone' ? 'Delete message for everyone?' : 'Delete message for you?',
      message: mode === 'everyone'
        ? 'This message will be removed from the chat for both users.'
        : 'This message will be hidden only from your chat history.',
      confirmLabel: mode === 'everyone' ? 'Delete for everyone' : 'Delete for me',
      onConfirm: () => performDeleteMessage(message, mode)
    });
    setOpenMessageMenu('');
  };

  const selectedMessages = messages.filter((message) => selectedMessageIds.includes(message._id));
  const canDeleteSelectedForEveryone = selectedMessages.length > 0 && selectedMessages.every((message) => {
    const isOutgoing = (message.sender._id || message.sender) === user._id;
    return isOutgoing && !message.deletedAt;
  });

  const toggleMessageSelection = (messageId) => {
    setOpenMessageMenu('');
    setSelectedMessageIds((prev) => {
      const next = prev.includes(messageId)
        ? prev.filter((id) => id !== messageId)
        : [...prev, messageId];
      setSelectionMode(next.length > 0);
      return next;
    });
  };

  const clearSelection = () => {
    setSelectionMode(false);
    setSelectedMessageIds([]);
  };

  const deleteSelectedMessages = (mode) => {
    setConfirmAction({
      title: mode === 'everyone' ? 'Delete selected messages for everyone?' : 'Delete selected messages for you?',
      message: `${selectedMessages.length} selected message${selectedMessages.length === 1 ? '' : 's'} will be deleted.`,
      confirmLabel: mode === 'everyone' ? 'Delete for everyone' : 'Delete for me',
      onConfirm: () => {
        selectedMessages.forEach((message) => performDeleteMessage(message, mode));
        clearSelection();
      }
    });
  };

  const handleFileUpload = async (file) => {
    if (!file || !chatPartner) return;

    setUploadingFile(true);
    try {
      const formData = new window.FormData();
      formData.append('file', file);
      const res = await apiClient.post('/api/messages/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      sendMessage(file.name, chatPartner._id, res.data.fileUrl, res.data.fileType, replyTarget?._id || null);
      setReplyTarget(null);
    } catch (err) {
      console.error('Error uploading chat file:', err);
    } finally {
      setUploadingFile(false);
    }
  };

  const addEmoji = (emoji) => {
    setTypedMessage((value) => `${value}${emoji}`);
    setShowEmojiPicker(false);
  };

  const deleteCurrentConversation = async () => {
    if (!currentRoomId) return;

    try {
      await apiClient.delete(`/api/messages/${currentRoomId}`);
      dispatch(setMessages([]));
      dispatch(setCurrentRoom({ partner: null, roomId: '' }));
      setMobileShowSidebar(true);
      fetchActiveChats();
    } catch (err) {
      console.error('Error deleting conversation:', err);
    }
  };

  const deleteConversationByRoom = async (roomId) => {
    try {
      await apiClient.delete(`/api/messages/${roomId}`);
      if (roomId === currentRoomId) {
        dispatch(setMessages([]));
        dispatch(setCurrentRoom({ partner: null, roomId: '' }));
        setMobileShowSidebar(true);
      }
      fetchActiveChats();
    } catch (err) {
      console.error('Error deleting conversation:', err);
    }
  };

  const blockConversationPartner = async (partnerId, roomId) => {
    try {
      await apiClient.put(`/api/messages/users/${partnerId}/block`, {});
      if (roomId === currentRoomId) {
        dispatch(setMessages([]));
        dispatch(setCurrentRoom({ partner: null, roomId: '' }));
        setMobileShowSidebar(true);
      }
      fetchActiveChats();
    } catch (err) {
      console.error('Error blocking chat partner:', err);
    }
  };

  const unblockConversationPartner = async (partnerId) => {
    try {
      await apiClient.put(`/api/messages/users/${partnerId}/unblock`, {});
      await Promise.all([fetchActiveChats(), fetchBlockedUsers()]);
    } catch (err) {
      console.error('Error unblocking chat partner:', err);
    }
  };

  const requestDeleteConversationByRoom = (roomId, partnerName) => {
    setOpenConversationMenu('');
    setConfirmAction({
      title: `Delete ${partnerName} from chats?`,
      message: 'This removes the conversation from your chat list and hides the history for your account only.',
      confirmLabel: 'Delete user',
      onConfirm: () => deleteConversationByRoom(roomId)
    });
  };

  const requestDeleteCurrentConversation = () => {
    setOpenConversationMenu('');
    setConfirmAction({
      title: 'Delete this chat history?',
      message: 'This will remove the full conversation from your account only. The other user will still keep their copy.',
      confirmLabel: 'Delete chat',
      onConfirm: deleteCurrentConversation
    });
  };

  const requestBlockConversation = (partner, roomId) => {
    setOpenConversationMenu('');
    setConfirmAction({
      title: `Block ${partner.name}?`,
      message: 'This hides the chat from your list and stops new messages from this user. Your chat history is not deleted.',
      confirmLabel: 'Block user',
      onConfirm: () => blockConversationPartner(partner._id, roomId)
    });
  };

  const openBlockedUsersModal = () => {
    setShowBlockedModal(true);
    fetchBlockedUsers();
  };

  const runConfirmedAction = async () => {
    const action = confirmAction;
    setConfirmAction(null);
    await action?.onConfirm?.();
  };

  const clearComposerMode = () => {
    setReplyTarget(null);
    setEditingMessage(null);
    setTypedMessage('');
  };

  const handleInputChange = (e) => {
    setTypedMessage(e.target.value);
    
    if (chatPartner) {
      sendTypingStatus(chatPartner._id, true);
      
      // Clear timeout if typing continues
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      
      // Set idle typing timeout
      typingTimeoutRef.current = setTimeout(() => {
        sendTypingStatus(chatPartner._id, false);
      }, 2000);
    }
  };

  const selectConversation = (partner, roomId) => {
    clearSelection();
    setOpenConversationMenu('');
    dispatch(setCurrentRoom({ partner, roomId }));
    setMobileShowSidebar(false);
    if (roomId) {
      socket?.emit('join_room', roomId);
      fetchMessageLogs(roomId);
      markMessagesSeen(roomId);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const isUserOnline = (userId) => {
    return onlineUsersList[userId?.toString()] === true;
  };

  const renderMessageText = (content) => {
    const parts = String(content || '').split(/(https?:\/\/[^\s]+)/g);
    return parts.map((part, index) => {
      if (/^https?:\/\//.test(part)) {
        return (
          <a key={`${part}-${index}`} href={part} target="_blank" rel="noreferrer" className="font-bold text-blue-700 underline underline-offset-2 dark:text-blue-300">
            {part}
          </a>
        );
      }
      return <React.Fragment key={`${part}-${index}`}>{part}</React.Fragment>;
    });
  };

  return (
    <div className="flex h-full w-full min-h-0 p-0 overflow-hidden text-app">
      <div className="relative flex h-full w-full min-h-0 overflow-hidden border-t border-slate-200 dark:border-slate-800">
        {/* Chats Sidebar */}
        <div className={`h-full w-full flex-shrink-0 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-[#22242a] md:w-80 lg:w-[22rem] flex-col ${
          mobileShowSidebar ? 'flex' : 'hidden md:flex'
        }`}>
          {/* Header search */}
          <div className="p-4 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="font-bold text-app font-outfit">Messages</h3>
                <p className="text-[10px] text-muted mt-0.5">Direct messages and study chats</p>
              </div>
              <button
                type="button"
                onClick={openBlockedUsersModal}
                className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-900/5 hover:text-app dark:hover:bg-white/5"
                title="Blocked users"
              >
                <Ban size={16} />
              </button>
            </div>
          </div>

          {/* List items */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-900/60 p-2 space-y-1">
            {activeChats.length === 0 ? (
              <div className="text-center py-20 text-slate-500 text-xs">
                No active conversations. Visit Suggested Peers to find learning partners and say hi!
              </div>
            ) : (
              activeChats.map((chat) => {
                const partner = chat.partner;
                const isSelected = currentRoomId === chat.chatRoomId;
                const online = isUserOnline(partner._id);
                const unread = (chat.unreadCount || 0) > 0;

                return (
                  <div
                    key={chat.chatRoomId}
                    className={`relative w-full flex items-center gap-2 rounded-2xl p-2 transition-all sm:gap-3 sm:p-3 ${
                      isSelected
                        ? 'bg-blue-600 border border-blue-600 text-white shadow-sm'
                        : 'hover:bg-slate-100 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300 border border-transparent'
                    }`}
                  >
                    <button type="button" onClick={() => selectConversation(partner, chat.chatRoomId)} className="flex min-w-0 flex-1 items-center gap-2 text-left sm:gap-3">
                    <div className="relative flex-shrink-0">
                      <img src={partner.profileImage} alt={partner.name} className="h-9 w-9 rounded-full bg-slate-200 dark:bg-slate-800 sm:h-10 sm:w-10 object-cover" />
                      <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white dark:border-slate-950 ${
                        online ? 'bg-emerald-500' : 'bg-slate-400 dark:bg-slate-700'
                      }`} />
                      {unread && (
                        <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full border-2 border-white bg-red-500 dark:border-slate-950" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0 text-left">
                      <div className="flex justify-between items-center">
                        <span className={`truncate text-xs font-semibold ${isSelected ? 'text-white' : 'text-slate-800 dark:text-slate-100'}`}>{partner.name}</span>
                        <span className={`text-[9px] font-mono ${isSelected ? 'text-blue-100' : 'text-muted'}`}>
                          {new Date(chat.lastMessage.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className={`text-[10px] truncate mt-1 ${unread ? 'font-bold text-blue-600 dark:text-white' : isSelected ? 'text-white/80' : 'text-muted'}`}>
                        {chat.lastMessage.content}
                      </p>
                    </div>
                    </button>
                  <div
                    className="relative shrink-0"
                    onMouseEnter={() => handleConvMenuMouseEnter(chat.chatRoomId)}
                    onMouseLeave={handleConvMenuMouseLeave}
                  >
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (closeConvMenuTimerRef.current) clearTimeout(closeConvMenuTimerRef.current);
                        setOpenConversationMenu(openConversationMenu === chat.chatRoomId ? '' : chat.chatRoomId);
                      }}
                      className={`group/dots rounded-lg p-1.5 transition-all duration-200 sm:p-2 active:scale-95 ${
                        isSelected
                          ? 'text-white/80 hover:bg-white/20 hover:text-white'
                          : 'text-slate-500 hover:bg-blue-50/80 dark:hover:bg-blue-950/40 hover:text-blue-600 dark:hover:text-blue-400'
                      }`}
                      title={`${partner.name} options`}
                    >
                      <MoreVertical
                        size={16}
                        className="transition-transform duration-200 group-hover/dots:scale-110"
                      />
                    </button>
                    {openConversationMenu === chat.chatRoomId && (
                      <div
                        className="absolute right-3 top-10 z-30 w-44 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#2a2c34] p-1.5 text-xs shadow-2xl animate-in fade-in zoom-in-95 duration-150"
                        onMouseEnter={() => handleConvMenuMouseEnter(chat.chatRoomId)}
                        onMouseLeave={handleConvMenuMouseLeave}
                      >
                        <button type="button" onClick={() => requestDeleteConversationByRoom(chat.chatRoomId, partner.name)} className="flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-left font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors">
                          <Trash2 size={13} /> Delete
                        </button>
                        <button type="button" onClick={() => requestBlockConversation(partner, chat.chatRoomId)} className="flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-left font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors">
                          <Ban size={13} /> Block
                        </button>
                      </div>
                    )}
                  </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Message Window Panel */}
        <div className={`h-full min-w-0 flex-1 flex-col overflow-hidden bg-slate-50 dark:bg-slate-950/20 ${
          !mobileShowSidebar ? 'flex' : 'hidden md:flex'
        }`}>
          {chatPartner ? (
            <>
              {/* Partner details bar - pinned on mobile and desktop */}
              <div className="sticky top-0 z-30 shrink-0 flex items-center justify-between gap-1.5 sm:gap-2 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-[#22242a] p-2 sm:px-5 sm:py-3.5 backdrop-blur-md">
                <div className="flex min-w-0 items-center gap-1.5 sm:gap-3.5">
                  <button
                    onClick={() => setMobileShowSidebar(true)}
                    className="md:hidden text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 p-1 sm:p-1.5 border border-slate-200 dark:border-slate-800 rounded-lg shrink-0"
                    title="Back to conversations"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <div className="relative shrink-0">
                    <Link to={`/profile/${chatPartner._id}`} title={`View ${chatPartner.name}'s profile`}>
                      <img src={chatPartner.profileImage} alt={chatPartner.name} className="w-8 h-8 sm:w-11 sm:h-11 rounded-full bg-slate-200 dark:bg-slate-850 object-cover shadow-sm" />
                    </Link>
                    <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-full border-2 border-white dark:border-slate-950 ${
                      isUserOnline(chatPartner._id) ? 'bg-emerald-500' : 'bg-slate-400 dark:bg-slate-700'
                    }`} />
                  </div>
                  <div className="min-w-0">
                    <Link to={`/profile/${chatPartner._id}`} className="font-bold text-xs sm:text-base text-slate-800 dark:text-slate-100 hover:text-blue-600 truncate block">{chatPartner.name}</Link>
                    <p className="text-[10px] sm:text-xs text-muted truncate">
                      {isUserOnline(chatPartner._id) ? 'Active Now' : 'Offline'}
                    </p>
                  </div>
                </div>

                <div className="relative flex flex-shrink-0 items-center gap-0.5 sm:gap-1">
                  <button
                    type="button"
                    onClick={() => setSelectionMode(true)}
                    className="rounded-lg p-1.5 sm:p-2 text-muted transition-colors hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-white/5 dark:hover:text-slate-100"
                    title="Select messages"
                  >
                    <CheckSquare size={16} />
                  </button>
                  <div
                    className="relative"
                    onMouseEnter={() => handleConvMenuMouseEnter('current')}
                    onMouseLeave={handleConvMenuMouseLeave}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        if (closeConvMenuTimerRef.current) clearTimeout(closeConvMenuTimerRef.current);
                        setOpenConversationMenu(openConversationMenu === 'current' ? '' : 'current');
                      }}
                      className="group/dots rounded-lg p-1.5 sm:p-2 text-muted transition-all duration-200 hover:bg-blue-50/80 dark:hover:bg-blue-950/40 hover:text-blue-600 dark:hover:text-blue-400 active:scale-95"
                      title="Chat options"
                    >
                      <MoreVertical
                        size={16}
                        className="transition-transform duration-200 group-hover/dots:scale-110"
                      />
                    </button>
                    {openConversationMenu === 'current' && (
                      <div
                        className="absolute right-0 top-10 sm:top-11 z-50 w-40 sm:w-44 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#2a2c34] p-1.5 text-xs shadow-2xl animate-in fade-in zoom-in-95 duration-150"
                        onMouseEnter={() => handleConvMenuMouseEnter('current')}
                        onMouseLeave={handleConvMenuMouseLeave}
                      >
                        <button type="button" onClick={requestDeleteCurrentConversation} className="flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-left font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors">
                          <Trash2 size={13} /> Delete chat
                        </button>
                        <button type="button" onClick={() => requestBlockConversation(chatPartner, currentRoomId)} className="flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-left font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors">
                          <Ban size={13} /> Block user
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {selectionMode && (
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-850 bg-slate-900/5 px-3 py-2 text-sm sm:px-4">
                  <span className="font-semibold text-app">{selectedMessageIds.length} selected</span>
                  <div className="flex flex-wrap items-center gap-2">
                    <button type="button" onClick={() => deleteSelectedMessages('me')} disabled={selectedMessageIds.length === 0} className="btn-secondary min-h-0 px-3 py-1.5 text-xs disabled:opacity-50">
                      Delete for me
                    </button>
                    {canDeleteSelectedForEveryone && (
                      <button type="button" onClick={() => deleteSelectedMessages('everyone')} className="btn-secondary min-h-0 px-3 py-1.5 text-xs text-red-600">
                        Delete for everyone
                      </button>
                    )}
                    <button type="button" onClick={clearSelection} className="rounded-lg p-1.5 text-muted hover:text-app">
                      <X size={16} />
                    </button>
                  </div>
                </div>
              )}

              {/* Chat Stream Bubble list */}
              <div className="min-h-0 flex-1 space-y-3 overflow-y-auto bg-[#efeae2] p-3 pt-5 sm:p-4 dark:bg-[#1a1c22]">
                {loading ? (
                  <div className="flex justify-center items-center py-20">
                    <div className="w-8 h-8 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isOutgoing = (msg.sender._id || msg.sender) === user._id;
                    const dateObj = new Date(msg.createdAt);
                    const isDeleted = Boolean(msg.deletedAt);
                    const canEdit = isOutgoing && !isDeleted && (Date.now() - dateObj.getTime()) <= 5 * 60 * 1000;
                    const isMenuOpen = openMessageMenu === msg._id;

                    const renderReactionTrigger = () => {
                      if (isDeleted) return null;
                      const isReactionOpen = activeReactionMsgId === msg._id;
                      return (
                        <div className="relative self-center shrink-0">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveReactionMsgId(isReactionOpen ? null : msg._id);
                            }}
                            className={`p-1.5 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-black/5 dark:hover:bg-white/10 transition-all ${
                              isReactionOpen ? 'opacity-100 pointer-events-auto' : 'opacity-70 sm:opacity-0 sm:group-hover:opacity-100 pointer-events-auto sm:pointer-events-none sm:group-hover:pointer-events-auto'
                            }`}
                            title="React"
                          >
                            <Smile size={18} />
                          </button>

                          {isReactionOpen && (
                            <>
                              <div className="fixed inset-0 z-40" onClick={(e) => { e.stopPropagation(); setActiveReactionMsgId(null); }} />
                              <div className={`absolute bottom-full mb-1.5 ${isOutgoing ? 'right-0' : 'left-0'} z-50 flex items-center gap-1.5 rounded-full bg-white dark:bg-[#22242a] px-3 py-1.5 shadow-2xl border border-slate-200 dark:border-slate-700 animate-in fade-in zoom-in-95 duration-150`}>
                                {['👍', '❤️', '😂', '😮', '😢', '🙏'].map((emoji) => (
                                  <button
                                    key={emoji}
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleToggleReaction(msg._id, emoji);
                                    }}
                                    className="text-lg hover:scale-130 transition-transform p-0.5 active:scale-95"
                                    title={emoji}
                                  >
                                    {emoji}
                                  </button>
                                ))}
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setShowEmojiPicker(true);
                                    setActiveReactionMsgId(null);
                                  }}
                                  className="w-6 h-6 flex items-center justify-center rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                                  title="More emojis"
                                >
                                  <Plus size={14} />
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      );
                    };

                    return (
                      <div
                        key={msg._id}
                        onDoubleClick={(e) => {
                          e.stopPropagation();
                          if (!isDeleted) {
                            startReply(msg);
                          }
                        }}
                        onClick={(e) => {
                          if (selectionMode) {
                            toggleMessageSelection(msg._id);
                          }
                        }}
                        className={`group relative flex cursor-default items-center gap-2 rounded-lg px-1 py-1 sm:px-2 ${isOutgoing ? 'justify-end' : 'justify-start'} animate-fade-in ${
                          selectedMessageIds.includes(msg._id) ? 'bg-[#d9fdd3]/80 dark:bg-emerald-900/30' : ''
                        } ${isMenuOpen || activeReactionMsgId === msg._id ? 'z-50 relative' : 'relative z-0'} ${
                          msg.reactions?.length > 0 ? 'mb-2.5' : ''
                        }`}
                      >
                        {/* WhatsApp-style Swipe-to-reply icon indicator */}
                        <div
                          className={`swipe-reply-icon-${msg._id} pointer-events-none absolute ${
                            isOutgoing ? 'right-full mr-2' : 'left-0'
                          } top-1/2 -translate-y-1/2 z-20 flex h-7 w-7 items-center justify-center rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 opacity-0 shadow-md transition-colors`}
                        >
                          <Reply size={14} />
                        </div>

                        {isOutgoing && renderReactionTrigger()}
                        <div
                          onTouchStart={(e) => handleBubbleTouchStart(e, msg)}
                          onTouchMove={(e) => handleBubbleTouchMove(e, msg)}
                          onTouchEnd={(e) => handleBubbleTouchEnd(e, msg)}
                          className={`relative max-w-[94%] space-y-1 rounded-2xl px-3 py-1.5 sm:px-4 sm:py-2.5 shadow-sm sm:max-w-[86%] lg:max-w-[80%] touch-pan-y ${
                          msg.replyTo && !isDeleted ? 'min-w-[260px] sm:min-w-[300px]' : 'min-w-[100px]'
                        } ${
                          isOutgoing
                            ? 'bg-[#d9fdd3] text-slate-900 rounded-br-sm dark:bg-[#1f3a2b] dark:text-slate-100'
                            : 'border border-slate-200 bg-white text-slate-900 dark:border-neutral-700 dark:bg-[#22242a] dark:text-slate-100 rounded-bl-sm'
                        } ${isMenuOpen ? 'z-50' : 'z-auto'}`}>
                          <div className="absolute right-1.5 top-1.5 z-30">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                const rect = e.currentTarget.getBoundingClientRect();
                                const openUp = window.innerHeight - rect.bottom < 320;
                                setMenuPlacement(openUp ? 'up' : 'down');
                                setOpenMessageMenu(isMenuOpen ? '' : msg._id);
                              }}
                              className={`rounded-full p-1 text-slate-500 transition-all hover:bg-black/10 dark:hover:bg-white/10 ${
                                isMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-70 sm:opacity-0 sm:group-hover:opacity-100 pointer-events-auto sm:pointer-events-none sm:group-hover:pointer-events-auto'
                              }`}
                              title="Message actions"
                            >
                              <ChevronDown size={15} />
                            </button>

                            {isMenuOpen && (
                              <>
                                <div
                                  className="fixed inset-0 z-40"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setOpenMessageMenu('');
                                  }}
                                />
                                {isDeleted ? (
                                  <div className={`absolute ${menuPlacement === 'up' ? 'bottom-full mb-1.5' : 'top-full mt-1'} right-0 z-50 w-44 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#22242a] p-1.5 text-xs shadow-2xl`}>
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        toggleMessageSelection(msg._id);
                                      }}
                                      className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                    >
                                      <CheckSquare size={14} className="text-slate-400" /> Select
                                    </button>
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        performDeleteMessage(msg, 'me');
                                      }}
                                      className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                                    >
                                      <Trash2 size={14} /> Delete
                                    </button>
                                  </div>
                                ) : (
                                  <div className={`absolute ${menuPlacement === 'up' ? 'bottom-full mb-1.5' : 'top-full mt-1'} right-0 z-50 w-52 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#22242a] p-1.5 text-xs shadow-2xl`}>
                                  {/* Quick Reaction Bar */}
                                  <div className="flex items-center justify-between px-2 py-1.5 mb-1 border-b border-slate-200 dark:border-slate-700">
                                    {['👍', '❤️', '😂', '😮', '😢', '🙏'].map((emoji) => (
                                      <button
                                        key={emoji}
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleQuickReaction(msg, emoji);
                                        }}
                                        className="text-base hover:scale-125 transition-transform p-0.5 active:scale-95"
                                        title={`React ${emoji}`}
                                      >
                                        {emoji}
                                      </button>
                                    ))}
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setShowEmojiPicker(true);
                                        setOpenMessageMenu('');
                                      }}
                                      className="w-5 h-5 flex items-center justify-center rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                                      title="More emojis"
                                    >
                                      <Plus size={13} />
                                    </button>
                                  </div>

                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      startReply(msg);
                                    }}
                                    className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                  >
                                    <Reply size={14} className="text-slate-400" /> Reply
                                  </button>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      navigator.clipboard.writeText(msg.content || '');
                                      setOpenMessageMenu('');
                                    }}
                                    className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                  >
                                    <Copy size={14} className="text-slate-400" /> Copy
                                  </button>
                                  {canEdit && (
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        startEdit(msg);
                                      }}
                                      className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                    >
                                      <Pencil size={14} className="text-slate-400" /> Edit
                                    </button>
                                  )}
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      toggleMessageSelection(msg._id);
                                    }}
                                    className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                  >
                                    <CheckSquare size={14} className="text-slate-400" /> Select
                                  </button>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      requestDeleteMessage(msg, 'me');
                                    }}
                                    className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                                  >
                                    <Trash2 size={14} /> Delete for me
                                  </button>
                                  {isOutgoing && (
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        requestDeleteMessage(msg, 'everyone');
                                      }}
                                      className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                                    >
                                      <Trash2 size={14} /> Delete for everyone
                                    </button>
                                  )}
                                </div>
                              )}
                            </>
                          )}
                        </div>

                          {msg.replyTo && (
                            <div className="mb-1 mr-7 rounded-lg border-l-4 border-blue-500 bg-black/5 dark:bg-white/5 px-2.5 py-1.5 text-[11px] leading-4">
                              <p className="font-bold text-blue-600 dark:text-blue-400 truncate">{msg.replyTo.sender?.name || 'Message'}</p>
                              <p className="line-clamp-2 opacity-70">{msg.replyTo.deletedAt ? 'This message was deleted' : msg.replyTo.content}</p>
                            </div>
                          )}

                          {isDeleted ? (
                            <div className="flex items-center gap-1.5 italic text-slate-500 dark:text-slate-400 select-none pr-6 py-0.5">
                              <Ban size={14} className="shrink-0 opacity-70" />
                              <span className="text-xs sm:text-sm">This message was deleted</span>
                            </div>
                          ) : (
                            <p className="whitespace-pre-wrap break-words pr-5 text-xs sm:text-[14.5px] leading-relaxed">
                              {renderMessageText(msg.content)}
                            </p>
                          )}
                          {!isDeleted && msg.fileUrl && (
                            msg.fileType === 'image' ? (
                              <img src={msg.fileUrl} alt={msg.content} className="mt-2 max-h-64 rounded-xl object-cover" />
                            ) : (
                              <a href={msg.fileUrl} target="_blank" rel="noreferrer" className="mt-2 block rounded-xl border border-slate-200 bg-white/70 px-3.5 py-2 text-xs font-semibold text-blue-700 dark:bg-slate-800">
                                Open document: {msg.content}
                              </a>
                            )
                          )}
                          <div className="flex items-center justify-end gap-1.5 mt-1.5">
                            {msg.isEdited && !isDeleted && <span className="text-[10px] opacity-50">edited</span>}
                            <span className="font-mono text-[10px] sm:text-[11px] opacity-60">
                              {dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            {isOutgoing && (
                              <span className="text-[11px]">
                                {msg.isSeen ? <CheckCheck size={12} className="text-emerald-500" /> : <Check size={12} className="opacity-50" />}
                              </span>
                            )}
                          </div>

                          {/* Reaction badge attached to the bottom edge of the bubble */}
                          {msg.reactions && msg.reactions.length > 0 && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                const myReaction = msg.reactions.find((r) => (r.user?._id || r.user) === user._id);
                                if (myReaction) {
                                  handleToggleReaction(msg._id, myReaction.emoji);
                                }
                              }}
                              className={`absolute -bottom-3 ${
                                isOutgoing ? 'right-2' : 'left-2'
                              } z-20 flex items-center gap-1 rounded-full px-1.5 py-0.5 text-xs shadow-md border cursor-pointer transition-all hover:scale-110 active:scale-95 select-none ${
                                msg.reactions.some((r) => (r.user?._id || r.user) === user._id)
                                  ? 'bg-slate-100 dark:bg-[#1a1c22] border-indigo-400 dark:border-indigo-500'
                                  : 'bg-white dark:bg-[#1a1c22] border-slate-200 dark:border-neutral-700'
                              }`}
                              title={msg.reactions.map((r) => (r.user?.name || (r.user === user._id ? 'You' : 'Someone'))).join(', ')}
                            >
                              {Array.from(new Set(msg.reactions.map((r) => r.emoji))).slice(0, 3).map((emoji) => (
                                <span key={emoji} className="text-xs leading-none">{emoji}</span>
                              ))}
                              {msg.reactions.length > 1 && (
                                <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                                  {msg.reactions.length}
                                </span>
                              )}
                            </button>
                          )}
                        </div>
                        {!isOutgoing && renderReactionTrigger()}
                      </div>
                    );
                  })
                )}
                {/* Typing alert */}
                {peerIsTyping && (
                  <div className="flex justify-start items-center gap-2 text-xs text-slate-500 animate-pulse">
                    <div className="flex gap-1">
                      <div className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                    <span>{chatPartner.name} is writing...</span>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Chat Send console */}
              {(replyTarget || editingMessage) && (
                <div className="border-t border-slate-850 bg-slate-900/5 px-4 py-2">
                  <div className="flex items-center justify-between rounded-lg border bg-white px-3 py-2 text-xs dark:bg-slate-900" style={{ borderColor: 'var(--app-border)' }}>
                    <div className="min-w-0">
                      <p className="font-bold text-blue-600">{editingMessage ? 'Editing message' : `Replying to ${(replyTarget.sender?.name || chatPartner.name)}`}</p>
                      <p className="truncate text-muted">{editingMessage ? editingMessage.content : replyTarget.content}</p>
                    </div>
                    <button type="button" onClick={clearComposerMode} className="rounded p-1 text-muted hover:text-app">
                      <X size={16} />
                    </button>
                  </div>
                </div>
              )}

              <form onSubmit={handleSendMessage} className="sticky bottom-0 z-20 shrink-0 flex items-end gap-1.5 sm:gap-2.5 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-[#22242a] p-2 sm:p-4">
                <input ref={documentInputRef} type="file" className="hidden" accept=".pdf,.doc,.docx,.txt" onChange={(e) => handleFileUpload(e.target.files?.[0])} />
                <input ref={imageInputRef} type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e.target.files?.[0])} />
                <button type="button" onClick={() => documentInputRef.current?.click()} className="rounded-xl p-1.5 sm:p-2.5 text-slate-500 transition-colors hover:text-slate-700 dark:hover:text-slate-300" title="Attach document">
                  <Paperclip size={18} />
                </button>
                <button type="button" onClick={() => imageInputRef.current?.click()} className="rounded-xl p-1.5 sm:p-2.5 text-slate-500 transition-colors hover:text-slate-700 dark:hover:text-slate-300" title="Attach image">
                  <Image size={18} />
                </button>
                
                <textarea
                  ref={messageInputRef}
                  value={typedMessage}
                  onChange={handleInputChange}
                  onKeyDown={handleComposerKeyDown}
                  placeholder="Type a message..."
                  rows={1}
                  className="field-input max-h-36 min-h-10 min-w-0 flex-1 resize-none px-3 py-2 text-xs sm:text-[15px] rounded-xl"
                />

                <div className="relative">
                  {showEmojiPicker && (
                    <div className="absolute bottom-12 right-0 z-20 grid w-52 grid-cols-6 gap-1 rounded-2xl border bg-white p-1.5 shadow-xl sm:w-60 dark:bg-slate-900" style={{ borderColor: 'var(--app-border)' }}>
                      {['😀', '😂', '😊', '🔥', '👍', '🙏', '🎉', '💡', '✅', '⭐', '🚀', '❤️'].map((emoji) => (
                        <button key={emoji} type="button" onClick={() => addEmoji(emoji)} className="rounded-lg p-1 text-lg sm:text-xl hover:bg-slate-100 dark:hover:bg-white/5 transition-transform hover:scale-110">
                          {emoji}
                        </button>
                      ))}
                    </div>
                  )}
                  <button type="button" onClick={() => setShowEmojiPicker((value) => !value)} className="rounded-xl p-1.5 sm:p-2.5 text-slate-500 transition-colors hover:text-slate-700 dark:hover:text-slate-300" title="Emoji">
                    <Smile size={18} />
                  </button>
                </div>
                <button
                  type="submit"
                  disabled={!typedMessage.trim() || uploadingFile}
                  className="flex items-center justify-center rounded-xl bg-indigo-600 p-2 sm:p-3 text-white shadow transition-all hover:bg-indigo-500 disabled:opacity-40 disabled:hover:bg-indigo-600 shrink-0"
                >
                  <Send size={16} />
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col justify-center items-center p-6 text-center space-y-2">
              <span className="text-4xl">💬</span>
              <h3 className="font-extrabold text-lg text-app font-outfit">Open a Conversation</h3>
              <p className="text-xs text-muted max-w-xs">Select a learning partner from the sidebar to chat, share resources, and study together in real-time!</p>
            </div>
          )}
        </div>
      </div>

      {confirmAction && (
        <div role="dialog" data-modal="true" className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-lg border bg-white p-5 shadow-2xl dark:bg-slate-900" style={{ borderColor: 'var(--app-border)' }}>
            <h3 className="text-base font-bold text-app">{confirmAction.title}</h3>
            <p className="mt-2 text-sm leading-6 text-muted">{confirmAction.message}</p>
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={() => setConfirmAction(null)} className="btn-secondary min-h-0 px-4 py-2 text-sm">
                Cancel
              </button>
              <button type="button" onClick={runConfirmedAction} className="rounded-lg bg-red-600 px-4 py-2 text-sm font-bold text-white hover:bg-red-500">
                {confirmAction.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}

      {showBlockedModal && (
        <div role="dialog" data-modal="true" className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-lg border bg-white p-5 shadow-2xl dark:bg-slate-900" style={{ borderColor: 'var(--app-border)' }}>
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-app">Blocked Users</h3>
                <p className="mt-1 text-xs text-muted">Unblock users to allow messages again.</p>
              </div>
              <button type="button" onClick={() => setShowBlockedModal(false)} className="rounded-lg p-1.5 text-muted hover:bg-slate-100 hover:text-app dark:hover:bg-white/5">
                <X size={17} />
              </button>
            </div>

            <div className="mt-4 max-h-80 space-y-2 overflow-y-auto">
              {blockedUsers.length === 0 ? (
                <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted" style={{ borderColor: 'var(--app-border)' }}>
                  No blocked users.
                </div>
              ) : (
                blockedUsers.map(({ partner, blockedAt }) => (
                  <div key={partner._id} className="flex items-center gap-3 rounded-lg border p-3" style={{ borderColor: 'var(--app-border)' }}>
                    <img src={partner.profileImage} alt={partner.name} className="h-10 w-10 rounded-full bg-slate-100 dark:bg-slate-800 object-cover" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-app">{partner.name}</p>
                      <p className="text-[10px] text-muted">
                        Blocked {blockedAt ? new Date(blockedAt).toLocaleDateString() : 'recently'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => unblockConversationPartner(partner._id)}
                      className="rounded-lg border px-3 py-1.5 text-xs font-bold text-blue-600 transition-colors hover:bg-blue-50 dark:hover:bg-blue-500/10"
                      style={{ borderColor: 'var(--app-border)' }}
                    >
                      Unblock
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatRoom;
