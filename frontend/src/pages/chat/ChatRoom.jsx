import React, { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Link } from 'react-router-dom';
import { setActiveChats, setCurrentRoom, setMessages, chatStart, chatFailure } from '../../features/chatSlice.js';
import { useSocket } from '../../context/SocketContext.jsx';
import axios from 'axios';
import {
  Send,
  Image,
  Paperclip,
  Check,
  CheckCheck,
  Smile,
  ChevronLeft,
  MoreVertical,
  Reply,
  Pencil,
  Trash2,
  X,
  CheckSquare,
  Ban
} from 'lucide-react';

const ChatRoom = () => {
  const { user, token } = useSelector((state) => state.auth);
  const { activeChats, currentRoomId, messages, chatPartner, loading } = useSelector((state) => state.chat);
  const dispatch = useDispatch();

  const { socket, sendMessage, sendTypingStatus, onlineUsersList } = useSocket();

  const [typedMessage, setTypedMessage] = useState('');
  const [peerIsTyping, setPeerIsTyping] = useState(false);
  const [mobileShowSidebar, setMobileShowSidebar] = useState(true);
  const [openMessageMenu, setOpenMessageMenu] = useState('');
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
      setMobileShowSidebar(false);
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
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const res = await axios.get('/api/messages/active', config);
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
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const res = await axios.get('/api/messages/blocked', config);
      setBlockedUsers(res.data.blockedUsers || []);
    } catch (err) {
      console.error('Error loading blocked chat users:', err);
    }
  };

  const fetchMessageLogs = async (roomId) => {
    dispatch(chatStart());
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const res = await axios.get(`/api/messages/${roomId}`, config);
      dispatch(setMessages(res.data.messages));
    } catch (err) {
      dispatch(chatFailure(err.response?.data?.message || 'Error loading messages'));
    }
  };

  const markMessagesSeen = async (roomId) => {
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      await axios.put(`/api/messages/${roomId}/seen`, {}, config);
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
  };

  const startEdit = (message) => {
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
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      };
      const res = await axios.post('/api/messages/upload', formData, config);
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
      const config = { headers: { Authorization: `Bearer ${token}` } };
      await axios.delete(`/api/messages/${currentRoomId}`, config);
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
      const config = { headers: { Authorization: `Bearer ${token}` } };
      await axios.delete(`/api/messages/${roomId}`, config);
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
      const config = { headers: { Authorization: `Bearer ${token}` } };
      await axios.put(`/api/messages/users/${partnerId}/block`, {}, config);
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
      const config = { headers: { Authorization: `Bearer ${token}` } };
      await axios.put(`/api/messages/users/${partnerId}/unblock`, {}, config);
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
    <div className="page-shell flex min-h-0 p-2 sm:p-4 lg:p-8">
      <div className="section-panel relative flex h-[calc(100dvh-5rem)] min-h-0 w-full max-w-full overflow-hidden lg:h-[calc(100vh-4rem)]">
        {/* Chats Sidebar */}
        <div className={`h-full w-full flex-shrink-0 border-r border-slate-850 bg-slate-950/40 md:w-80 lg:w-[22rem] flex-col ${
          mobileShowSidebar ? 'flex' : 'hidden md:flex'
        }`}>
          {/* Header search */}
          <div className="p-4 border-b border-slate-850">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="font-bold text-slate-100 font-outfit">Messages</h3>
                <p className="text-[10px] text-slate-500 mt-0.5">Live chat with matching tutors</p>
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
          <div className="flex-1 overflow-y-auto divide-y divide-slate-900/60 p-2 space-y-1">
            {activeChats.length === 0 ? (
              <div className="text-center py-20 text-slate-500 text-xs">
                No active conversations. Go to AI Matches to find suggestions and say hi!
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
                        ? 'bg-blue-600 border border-blue-600 text-white'
                        : 'hover:bg-slate-900/40 text-slate-400 border border-transparent'
                    }`}
                  >
                    <button type="button" onClick={() => selectConversation(partner, chat.chatRoomId)} className="flex min-w-0 flex-1 items-center gap-2 text-left sm:gap-3">
                    <div className="relative flex-shrink-0">
                      <img src={partner.profileImage} alt={partner.name} className="h-9 w-9 rounded-xl bg-slate-800 sm:h-10 sm:w-10" />
                      <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-slate-950 ${
                        online ? 'bg-emerald-500' : 'bg-slate-700'
                      }`} />
                      {unread && (
                        <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full border-2 border-white bg-red-500 dark:border-slate-950" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0 text-left">
                      <div className="flex justify-between items-center">
                        <span className={`truncate text-xs font-semibold ${isSelected ? 'text-white' : 'text-slate-200'}`}>{partner.name}</span>
                        <span className="text-[8px] text-slate-500 font-mono">
                          {new Date(chat.lastMessage.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className={`text-[10px] truncate mt-1 ${unread ? 'font-bold text-white' : isSelected ? 'text-white/80' : 'text-slate-500'}`}>
                        {chat.lastMessage.content}
                      </p>
                    </div>
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenConversationMenu(openConversationMenu === chat.chatRoomId ? '' : chat.chatRoomId);
                      }}
                      className={`rounded-lg p-1.5 transition-colors sm:p-2 ${isSelected ? 'text-white/80 hover:bg-white/10' : 'text-slate-500 hover:bg-slate-900/5 hover:text-app dark:hover:bg-white/5'}`}
                      title={`${partner.name} options`}
                    >
                      <MoreVertical size={16} />
                    </button>
                    {openConversationMenu === chat.chatRoomId && (
                      <div className="absolute right-3 top-12 z-20 w-40 rounded-lg border bg-white p-1 text-xs text-app shadow-xl dark:bg-slate-900" style={{ borderColor: 'var(--app-border)' }}>
                        <button type="button" onClick={() => requestDeleteConversationByRoom(chat.chatRoomId, partner.name)} className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10">
                          <Trash2 size={13} /> Delete
                        </button>
                        <button type="button" onClick={() => requestBlockConversation(partner, chat.chatRoomId)} className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10">
                          <Ban size={13} /> Block
                        </button>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Message Window Panel */}
        <div className={`h-full min-w-0 flex-1 flex-col bg-slate-950/20 ${
          !mobileShowSidebar ? 'flex' : 'hidden md:flex'
        }`}>
          {chatPartner ? (
            <>
              {/* Partner details bar */}
              <div className="flex items-center justify-between gap-2 border-b border-slate-850 bg-slate-900/10 p-3 backdrop-blur-md sm:p-4">
                <div className="flex min-w-0 items-center gap-2 sm:gap-3">
                  <button
                    onClick={() => setMobileShowSidebar(true)}
                    className="md:hidden text-slate-400 hover:text-slate-100 p-1 border border-slate-800 rounded-lg"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <div className="relative">
                    <Link to={`/profile/${chatPartner._id}`} title={`View ${chatPartner.name}'s profile`}>
                      <img src={chatPartner.profileImage} alt={chatPartner.name} className="w-10 h-10 rounded-xl bg-slate-850" />
                    </Link>
                    <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-slate-950 ${
                      isUserOnline(chatPartner._id) ? 'bg-emerald-500' : 'bg-slate-700'
                    }`} />
                  </div>
                  <div className="min-w-0">
                    <Link to={`/profile/${chatPartner._id}`} className="font-bold text-xs text-slate-200 hover:text-blue-500">{chatPartner.name}</Link>
                    <p className="text-[9px] text-slate-500">
                      {isUserOnline(chatPartner._id) ? 'Active Now' : 'Offline'}
                    </p>
                  </div>
                </div>

                <div className="relative flex flex-shrink-0 items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setSelectionMode(true)}
                    className="rounded-lg p-2 text-muted transition-colors hover:bg-slate-900/5 hover:text-app dark:hover:bg-white/5"
                    title="Select messages"
                  >
                    <CheckSquare size={17} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setOpenConversationMenu(openConversationMenu === 'current' ? '' : 'current')}
                    className="rounded-lg p-2 text-muted transition-colors hover:bg-slate-900/5 hover:text-app dark:hover:bg-white/5"
                    title="Chat options"
                  >
                    <MoreVertical size={17} />
                  </button>
                  {openConversationMenu === 'current' && (
                    <div className="absolute right-0 top-10 z-20 w-44 rounded-lg border bg-white p-1 text-xs text-app shadow-xl dark:bg-slate-900" style={{ borderColor: 'var(--app-border)' }}>
                      <button type="button" onClick={requestDeleteCurrentConversation} className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10">
                        <Trash2 size={13} /> Delete chat
                      </button>
                      <button type="button" onClick={() => requestBlockConversation(chatPartner, currentRoomId)} className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10">
                        <Ban size={13} /> Block user
                      </button>
                    </div>
                  )}
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
              <div className="min-h-0 flex-1 space-y-3 overflow-y-auto bg-[#efeae2] p-2 sm:p-4 dark:bg-[#101318]">
                {loading ? (
                  <div className="flex justify-center items-center py-20">
                    <div className="w-8 h-8 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isOutgoing = (msg.sender._id || msg.sender) === user._id;
                    const dateObj = new Date(msg.createdAt);
                    const isDeleted = Boolean(msg.deletedAt);

                    return (
                      <div
                        key={msg._id}
                        onClick={() => toggleMessageSelection(msg._id)}
                        className={`flex cursor-default items-center gap-2 rounded-lg px-1 py-1 sm:px-2 ${isOutgoing ? 'justify-end' : 'justify-start'} animate-fade-in ${
                          selectedMessageIds.includes(msg._id) ? 'bg-[#d9fdd3]/80 dark:bg-emerald-900/30' : ''
                        }`}
                      >
                        <div className={`group relative max-w-[88%] space-y-1 rounded-lg px-3 py-2 shadow-sm sm:max-w-[78%] ${
                          isOutgoing
                            ? 'bg-[#d9fdd3] text-slate-900'
                            : 'border border-slate-200 bg-white text-slate-900 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100'
                        }`}>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenMessageMenu(openMessageMenu === msg._id ? '' : msg._id);
                            }}
                            className="absolute right-1 top-1 rounded p-1 text-slate-500 opacity-0 transition-opacity hover:bg-black/5 group-hover:opacity-100"
                            title="Message actions"
                          >
                            <MoreVertical size={14} />
                          </button>

                          {openMessageMenu === msg._id && (
                            <div className={`absolute top-7 z-20 w-40 rounded-lg border bg-white p-1 text-xs text-app shadow-xl dark:bg-slate-900 ${isOutgoing ? 'right-1' : 'left-1'}`} style={{ borderColor: 'var(--app-border)' }}>
                              <button type="button" onClick={(e) => { e.stopPropagation(); toggleMessageSelection(msg._id); }} className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-app hover:bg-slate-100 dark:hover:bg-white/5">
                                <CheckSquare size={13} /> Select
                              </button>
                              <button type="button" onClick={(e) => { e.stopPropagation(); startReply(msg); }} className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-app hover:bg-slate-100 dark:hover:bg-white/5">
                                <Reply size={13} /> Reply
                              </button>
                              {isOutgoing && !isDeleted && (
                                <button type="button" onClick={(e) => { e.stopPropagation(); startEdit(msg); }} className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-app hover:bg-slate-100 dark:hover:bg-white/5">
                                  <Pencil size={13} /> Edit
                                </button>
                              )}
                              <button type="button" onClick={(e) => { e.stopPropagation(); requestDeleteMessage(msg, 'me'); }} className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10">
                                <Trash2 size={13} /> Delete for me
                              </button>
                              {isOutgoing && !isDeleted && (
                                <button type="button" onClick={(e) => { e.stopPropagation(); requestDeleteMessage(msg, 'everyone'); }} className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10">
                                  <Trash2 size={13} /> Delete for everyone
                                </button>
                              )}
                            </div>
                          )}

                          {msg.replyTo && (
                            <div className="mb-1 rounded-md border-l-4 border-blue-500 bg-black/5 px-2 py-1 text-[10px] leading-4">
                              <p className="font-bold">{msg.replyTo.sender?.name || 'Message'}</p>
                              <p className="line-clamp-2 opacity-70">{msg.replyTo.deletedAt ? 'This message was deleted' : msg.replyTo.content}</p>
                            </div>
                          )}

                          <p className={`whitespace-pre-wrap break-words pr-5 text-sm leading-relaxed ${isDeleted ? 'italic text-slate-500' : ''}`}>
                            {isDeleted ? 'This message was deleted' : renderMessageText(msg.content)}
                          </p>
                          {!isDeleted && msg.fileUrl && (
                            msg.fileType === 'image' ? (
                              <img src={msg.fileUrl} alt={msg.content} className="mt-2 max-h-56 rounded-lg object-cover" />
                            ) : (
                              <a href={msg.fileUrl} target="_blank" rel="noreferrer" className="mt-2 block rounded-lg border border-slate-200 bg-white/70 px-3 py-2 text-xs font-semibold text-blue-700 dark:bg-slate-800">
                                Open document: {msg.content}
                              </a>
                            )
                          )}
                          <div className="flex items-center justify-end gap-1.5 mt-1">
                            {msg.isEdited && !isDeleted && <span className="text-[9px] opacity-50">edited</span>}
                            <span className="font-mono text-[9px] opacity-60">
                              {dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            {isOutgoing && (
                              <span className="text-[10px]">
                                {msg.isSeen ? <CheckCheck size={10} className="text-emerald-300" /> : <Check size={10} className="opacity-50" />}
                              </span>
                            )}
                          </div>
                        </div>
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

              <form onSubmit={handleSendMessage} className="flex items-end gap-1.5 border-t border-slate-850 bg-slate-900/10 p-2 sm:gap-2 sm:p-4">
                <input ref={documentInputRef} type="file" className="hidden" accept=".pdf,.doc,.docx,.txt" onChange={(e) => handleFileUpload(e.target.files?.[0])} />
                <input ref={imageInputRef} type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e.target.files?.[0])} />
                <button type="button" onClick={() => documentInputRef.current?.click()} className="rounded-xl p-2 text-slate-500 transition-colors hover:text-slate-300" title="Attach document">
                  <Paperclip size={18} />
                </button>
                <button type="button" onClick={() => imageInputRef.current?.click()} className="rounded-xl p-2 text-slate-500 transition-colors hover:text-slate-300" title="Attach image">
                  <Image size={18} />
                </button>
                
                <textarea
                  value={typedMessage}
                  onChange={handleInputChange}
                  onKeyDown={handleComposerKeyDown}
                  placeholder="Type a message..."
                  rows={1}
                  className="field-input max-h-32 min-h-11 min-w-0 flex-1 resize-none px-3 py-2.5 text-sm sm:px-4"
                />

                <div className="relative">
                  {showEmojiPicker && (
                    <div className="absolute bottom-12 right-0 z-20 grid w-56 grid-cols-6 gap-1 rounded-lg border bg-white p-2 shadow-xl sm:w-60 dark:bg-slate-900" style={{ borderColor: 'var(--app-border)' }}>
                      {['😀', '😂', '😊', '🔥', '👍', '🙏', '🎉', '💡', '✅', '⭐', '🚀', '❤️'].map((emoji) => (
                        <button key={emoji} type="button" onClick={() => addEmoji(emoji)} className="rounded p-1 text-lg hover:bg-slate-100 dark:hover:bg-white/5">
                          {emoji}
                        </button>
                      ))}
                    </div>
                  )}
                  <button type="button" onClick={() => setShowEmojiPicker((value) => !value)} className="rounded-xl p-2 text-slate-500 transition-colors hover:text-slate-300" title="Emoji">
                  <Smile size={18} />
                  </button>
                </div>
                <button
                  type="submit"
                  disabled={!typedMessage.trim() || uploadingFile}
                  className="flex items-center justify-center rounded-xl bg-indigo-600 p-2.5 text-white shadow transition-all hover:bg-indigo-500 disabled:bg-slate-900 disabled:text-slate-600"
                >
                  <Send size={16} />
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col justify-center items-center p-6 text-center space-y-2">
              <span className="text-4xl">💬</span>
              <h3 className="font-extrabold text-lg text-slate-200 font-outfit">Open Conversation</h3>
              <p className="text-xs text-slate-500 max-w-xs">Select a tutor from the sidebar list to exchange coding knowledge in real-time!</p>
            </div>
          )}
        </div>
      </div>

      {confirmAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
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
                    <img src={partner.profileImage} alt={partner.name} className="h-10 w-10 rounded-lg bg-slate-100 dark:bg-slate-800" />
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
