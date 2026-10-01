import React, { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useParams, useNavigate, Link } from 'react-router-dom';
import apiClient from '../../services/apiClient.js';
import { useSocket } from '../../context/SocketContext.jsx';
import { setCurrentRoom, upsertActiveChat } from '../../features/chatSlice.js';
import {
  Users, Send, Video, Pin, MoreVertical, Shield, Trash2, Reply, Copy,
  Check, X, Lock, Globe, Settings, UserCheck, UserX, ExternalLink,
  ChevronLeft, ChevronDown, Plus, Smile, Pencil, Image as ImageIcon, FileText,
  Download, Search, Info, Link2, UserPlus, LogOut, ChevronRight,
  Share2, CheckCheck, Camera, AlertTriangle, Upload, Loader2, Ban,
  MessageSquare, CheckSquare
} from 'lucide-react';

const CATEGORIES = [
  'Programming & Tech', 'Languages & Speaking', 'Design & Creative Arts',
  'Business & Startups', 'Academics & Science', 'Music & Media', 'General Learning'
];

const formatChatDate = (dateVal) => {
  if (!dateVal) return '';
  const d = new Date(dateVal);
  if (isNaN(d.getTime())) return '';
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  if (isToday) {
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  const yesterday = new Date();
  yesterday.setDate(now.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) {
    return 'Yesterday';
  }
  const diffDays = Math.floor((now - d) / (1000 * 60 * 60 * 24));
  if (diffDays < 7) {
    return d.toLocaleDateString([], { weekday: 'short' });
  }
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
};

const GroupDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { socket } = useSocket();

  const [group, setGroup] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [typedMessage, setTypedMessage] = useState('');
  const [replyTarget, setReplyTarget] = useState(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [openMsgMenuId, setOpenMsgMenuId] = useState('');
  const [menuPlacement, setMenuPlacement] = useState('down');
  const [activeReactionMsgId, setActiveReactionMsgId] = useState(null);
  const [selectedMsgIds, setSelectedMsgIds] = useState([]);
  const [selectionMode, setSelectionMode] = useState(false);

  const [joinedGroups, setJoinedGroups] = useState([]);
  const [sidebarSearch, setSidebarSearch] = useState('');
  const [sidebarFilter, setSidebarFilter] = useState('all');
  const [showGroupInfo, setShowGroupInfo] = useState(false);
  const [showInChatSearch, setShowInChatSearch] = useState(false);
  const [inChatSearch, setInChatSearch] = useState('');
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [memberSearchQuery, setMemberSearchQuery] = useState('');
  const [copiedInviteLink, setCopiedInviteLink] = useState(false);
  const [activeMediaTab, setActiveMediaTab] = useState('all');

  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showMeetingModal, setShowMeetingModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [meetingLinkInput, setMeetingLinkInput] = useState('');
  const [meetingProviderInput, setMeetingProviderInput] = useState('Google Meet');

  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editImage, setEditImage] = useState('');
  const [editCategory, setEditCategory] = useState('General Learning');
  const [editPrivacy, setEditPrivacy] = useState('public');
  const [editTags, setEditTags] = useState('');
  const [savingSettings, setSavingSettings] = useState(false);
  const [deletingGroup, setDeletingGroup] = useState(false);
  const [clearingChat, setClearingChat] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [uploadingGroupImg, setUploadingGroupImg] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [searchedUsers, setSearchedUsers] = useState([]);
  const [searchingUsers, setSearchingUsers] = useState(false);
  const [addingUserId, setAddingUserId] = useState(null);
  const [addedUserIds, setAddedUserIds] = useState(new Set());
  const [openMemberMenuId, setOpenMemberMenuId] = useState('');
  const closeMemberMenuTimerRef = useRef(null);

  const handleMemberMenuMouseEnter = (id) => {
    if (closeMemberMenuTimerRef.current) {
      clearTimeout(closeMemberMenuTimerRef.current);
      closeMemberMenuTimerRef.current = null;
    }
    setOpenMemberMenuId(id);
  };

  const handleMemberMenuMouseLeave = () => {
    if (closeMemberMenuTimerRef.current) clearTimeout(closeMemberMenuTimerRef.current);
    closeMemberMenuTimerRef.current = setTimeout(() => {
      setOpenMemberMenuId('');
    }, 200);
  };
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'Confirm',
    cancelText: 'Cancel',
    isDanger: true,
    action: null
  });
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (message, type = 'info') => {
    setToastMessage({ message, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  const messagesEndRef = useRef(null);
  const imageInputRef = useRef(null);
  const documentInputRef = useRef(null);
  const groupImgFileInputRef = useRef(null);
  const chatInputRef = useRef(null);

  // Mobile WhatsApp-style swipe-to-reply and double-tap touch refs & handlers
  const touchStartXRef = useRef(0);
  const touchStartYRef = useRef(0);
  const isSwipingRef = useRef(false);
  const swipingBubbleRef = useRef(null);
  const lastTapTimeRef = useRef({});
  const hasVibratedRef = useRef(false);

  const handleGroupBubbleTouchStart = (e, msg) => {
    if (msg.deletedAt) return;
    touchStartXRef.current = e.touches[0].clientX;
    touchStartYRef.current = e.touches[0].clientY;
    isSwipingRef.current = false;
    hasVibratedRef.current = false;
    swipingBubbleRef.current = e.currentTarget;
  };

  const handleGroupBubbleTouchMove = (e, msg) => {
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

      const replyIcon = swipingBubbleRef.current.parentElement?.querySelector(`.swipe-reply-icon-grp-${msg._id}`);
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

  const handleGroupBubbleTouchEnd = (e, msg) => {
    if (msg.deletedAt || !swipingBubbleRef.current) return;
    const bubble = swipingBubbleRef.current;
    const deltaX = e.changedTouches[0].clientX - touchStartXRef.current;
    const deltaY = Math.abs(e.changedTouches[0].clientY - touchStartYRef.current);

    bubble.style.transition = 'transform 0.25s cubic-bezier(0.2, 0.8, 0.2, 1)';
    bubble.style.transform = 'translateX(0px)';

    const replyIcon = bubble.parentElement?.querySelector(`.swipe-reply-icon-grp-${msg._id}`);
    if (replyIcon) {
      replyIcon.style.transition = 'all 0.2s ease';
      replyIcon.style.opacity = '0';
      replyIcon.style.transform = 'translateY(-50%) scale(0.5)';
      replyIcon.classList.remove('!bg-indigo-600', '!text-white');
    }

    if (isSwipingRef.current && deltaX >= 45 && deltaY < 50) {
      setReplyTarget(msg);
      setTimeout(() => chatInputRef.current?.focus(), 80);
      swipingBubbleRef.current = null;
      return;
    }

    const now = Date.now();
    const lastTap = lastTapTimeRef.current[msg._id] || 0;
    if (now - lastTap < 320 && Math.abs(deltaX) < 15 && deltaY < 15) {
      if (navigator?.vibrate) navigator.vibrate(30);
      setReplyTarget(msg);
      setTimeout(() => chatInputRef.current?.focus(), 80);
      lastTapTimeRef.current[msg._id] = 0;
    } else {
      lastTapTimeRef.current[msg._id] = now;
    }

    swipingBubbleRef.current = null;
  };

  useEffect(() => {
    fetchGroupData();
    fetchMessages();
    fetchJoinedGroups();
  }, [id]);

  const fetchJoinedGroups = async () => {
    try {
      const res = await apiClient.get('/api/groups?filter=joined');
      setJoinedGroups(res.data.groups || []);
    } catch (err) {
      console.error('Fetch joined groups error:', err);
    }
  };

  const [hiddenDeletedMsgIds, setHiddenDeletedMsgIds] = useState(() => {
    try {
      const saved = localStorage.getItem(`orbitus_hidden_group_msgs_${id}`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const handleRemoveDeletedMessage = async (msgId) => {
    setHiddenDeletedMsgIds((prev) => {
      const next = [...new Set([...prev, msgId])];
      try {
        localStorage.setItem(`orbitus_hidden_group_msgs_${id}`, JSON.stringify(next));
      } catch {}
      return next;
    });
    setMessages((prev) => prev.filter((m) => m._id !== msgId));
    setOpenMsgMenuId('');
    try {
      await apiClient.delete(`/api/groups/${id}/messages/${msgId}?mode=me`);
    } catch (err) {
      console.error('Error removing deleted message for me:', err);
    }
    showToast('Deleted message removed from chat', 'info');
  };

  const toggleSelectMessage = (msgId) => {
    setSelectedMsgIds((prev) => {
      const next = prev.includes(msgId) ? prev.filter((item) => item !== msgId) : [...prev, msgId];
      setSelectionMode(next.length > 0);
      return next;
    });
    setOpenMsgMenuId('');
  };

  const handleToggleGroupReaction = (messageId, emoji) => {
    if (!socket || !id) return;
    socket.emit('react_group_message', {
      groupId: id,
      messageId,
      userId: user._id,
      emoji
    });
    setOpenMsgMenuId('');
    setActiveReactionMsgId(null);
  };

  const handleDirectMessageSender = (sender) => {
    const senderId = String(sender?._id || sender?.id || '');
    const myId = String(user?._id || user?.id || '');
    if (!senderId || senderId === myId) return;
    const chatRoomId = [myId, senderId].sort().join('_');
    dispatch(
      upsertActiveChat({
        partner: sender,
        chatRoomId,
        lastMessage: {
          content: 'Hello!',
          fileType: 'none',
          isSeen: true,
          sender: myId,
          createdAt: new Date().toISOString()
        }
      })
    );
    dispatch(setCurrentRoom({ partner: sender, roomId: chatRoomId }));
    navigate('/chat');
  };

  const fetchGroupData = async () => {
    try {
      const res = await apiClient.get(`/api/groups/${id}`);
      const g = res.data.group;
      setGroup(g);
      setEditName(g.name || '');
      setEditDesc(g.description || '');
      setEditImage(g.image || '');
      setEditCategory(g.category || 'General Learning');
      setEditPrivacy(g.privacy || 'public');
      setEditTags((g.tags || []).join(', '));
      setMeetingLinkInput(g.meetingLink || '');
      setMeetingProviderInput(g.meetingLinkProvider || 'Google Meet');
    } catch (err) {
      console.error('Fetch group error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async () => {
    try {
      const res = await apiClient.get(`/api/groups/${id}/messages`);
      setMessages(res.data.messages || []);
    } catch (err) {
      console.error('Fetch group messages error:', err);
    }
  };

  const handleFileUpload = async (file) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert('File size exceeds 5MB limit.');
      return;
    }
    setUploadingFile(true);
    setShowAttachMenu(false);
    try {
      const formData = new window.FormData();
      formData.append('file', file);
      const res = await apiClient.post('/api/messages/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      const { fileUrl, fileType } = res.data;
      if (socket) {
        socket.emit('send_group_message', {
          groupId: id, senderId: user._id, content: file.name, fileUrl, fileType,
          replyTo: replyTarget?._id || undefined
        });
      } else {
        const postRes = await apiClient.post(`/api/groups/${id}/messages`, {
          content: file.name, fileUrl, fileType, replyTo: replyTarget?._id || undefined
        });
        setMessages((prev) => [...prev, postRes.data.message]);
      }
      setReplyTarget(null);
    } catch (err) {
      alert(err.response?.data?.message || 'Error uploading file.');
    } finally {
      setUploadingFile(false);
    }
  };

  useEffect(() => {
    if (!socket || !id) return;
    socket.emit('join_group', id);

    const onMessage = (msg) => {
      if (!msg) return;
      setMessages((prev) => {
        if (msg._id && prev.some((m) => m._id === msg._id)) return prev;
        return [...prev, msg];
      });
      scrollToBottom();
    };
    const onVcLink = (data) => {
      if (data.groupId === id)
        setGroup((prev) => prev ? { ...prev, meetingLink: data.meetingLink, meetingLinkProvider: data.meetingLinkProvider } : prev);
    };
    const onPin = ({ messageId, isPinned }) => {
      setMessages((prev) => prev.map((m) => m._id === messageId ? { ...m, isPinned } : m));
      fetchGroupData();
    };
    const onDeleted = ({ messageId }) => {
      setMessages((prev) => prev.map((m) => m._id === messageId ? { ...m, deletedAt: new Date() } : m));
    };

    const onReaction = ({ messageId, reactions }) => {
      setMessages((prev) => prev.map((m) => m._id === messageId ? { ...m, reactions } : m));
    };

    socket.on('receive_group_message', onMessage);
    socket.on('group_vc_link_updated', onVcLink);
    socket.on('group_pin_changed', onPin);
    socket.on('group_message_removed', onDeleted);
    socket.on('group_message_reaction_updated', onReaction);

    return () => {
      socket.emit('leave_group', id);
      socket.off('receive_group_message', onMessage);
      socket.off('group_vc_link_updated', onVcLink);
      socket.off('group_pin_changed', onPin);
      socket.off('group_message_removed', onDeleted);
      socket.off('group_message_reaction_updated', onReaction);
    };
  }, [socket, id]);

  useEffect(() => { scrollToBottom(); }, [messages]);

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!typedMessage.trim()) return;
    const content = typedMessage.trim();
    setTypedMessage('');
    setShowEmojiPicker(false);
    try {
      if (socket) {
        socket.emit('send_group_message', { groupId: id, senderId: user._id, content, replyTo: replyTarget?._id || undefined });
      } else {
        const res = await apiClient.post(`/api/groups/${id}/messages`, { content, replyTo: replyTarget?._id || undefined });
        setMessages((prev) => [...prev, res.data.message]);
      }
      setReplyTarget(null);
    } catch (err) {
      console.error('Send message error:', err);
    }
  };

  const handleTogglePin = async (msgId) => {
    try {
      const res = await apiClient.put(`/api/groups/${id}/messages/${msgId}/pin`);
      setOpenMsgMenuId('');
      if (socket) socket.emit('group_message_pinned', { groupId: id, messageId: msgId, isPinned: res.data.isPinned });
      setMessages((prev) => prev.map((m) => m._id === msgId ? { ...m, isPinned: res.data.isPinned } : m));
      fetchGroupData();
    } catch (err) { console.error('Pin error:', err); }
  };

  const handleDeleteMessage = (msgId) => {
    setOpenMsgMenuId('');
    setConfirmModal({
      isOpen: true,
      title: 'Delete Message',
      message: 'Are you sure you want to delete this message? This cannot be undone.',
      confirmText: 'Delete',
      isDanger: true,
      action: async () => {
        try {
          await apiClient.delete(`/api/groups/${id}/messages/${msgId}`);
          if (socket) socket.emit('group_message_deleted', { groupId: id, messageId: msgId });
          setMessages((prev) => prev.map((m) => m._id === msgId ? { ...m, deletedAt: new Date() } : m));
          showToast('Message deleted', 'info');
        } catch (err) {
          showToast(err.response?.data?.message || 'Could not delete message', 'error');
        }
      }
    });
  };

  const handleSaveMeetingLink = async (e) => {
    e.preventDefault();
    try {
      await apiClient.put(`/api/groups/${id}/meeting-link`, { meetingLink: meetingLinkInput.trim(), meetingLinkProvider: meetingProviderInput });
      setGroup((prev) => ({ ...prev, meetingLink: meetingLinkInput.trim(), meetingLinkProvider: meetingProviderInput }));
      if (socket) socket.emit('group_vc_link_changed', { groupId: id, meetingLink: meetingLinkInput.trim(), meetingLinkProvider: meetingProviderInput, updatedByName: user.name });
      setShowMeetingModal(false);
      showToast('Meeting link updated', 'success');
    } catch (err) {
      showToast(err.response?.data?.message || 'Could not update meeting link', 'error');
    }
  };

  const handleRemoveMeetingLink = () => {
    setConfirmModal({
      isOpen: true,
      title: 'Remove Meeting Link',
      message: 'Remove meeting link from this group?',
      confirmText: 'Remove',
      isDanger: true,
      action: async () => {
        try {
          await apiClient.put(`/api/groups/${id}/meeting-link`, { meetingLink: '', meetingLinkProvider: 'Google Meet' });
          setGroup((prev) => ({ ...prev, meetingLink: '', meetingLinkProvider: 'Google Meet' }));
          setMeetingLinkInput('');
          setShowMeetingModal(false);
          showToast('Meeting link removed', 'info');
        } catch (err) {
          showToast(err.response?.data?.message || 'Could not remove link', 'error');
        }
      }
    });
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    if (!editName.trim()) {
      showToast('Group name cannot be empty', 'error');
      return;
    }
    setSavingSettings(true);
    try {
      const tagsArray = editTags.split(',').map((t) => t.trim()).filter(Boolean);
      const res = await apiClient.put(`/api/groups/${id}`, {
        name: editName.trim(), description: editDesc.trim(),
        image: editImage.trim() || undefined, category: editCategory,
        privacy: editPrivacy, tags: tagsArray
      });
      setGroup((prev) => ({ ...prev, ...res.data.group }));
      setShowSettingsModal(false);
      showToast('Group settings updated', 'success');
    } catch (err) {
      showToast(err.response?.data?.message || 'Could not update settings', 'error');
    } finally {
      setSavingSettings(false);
    }
  };

  const handleDeleteGroup = async () => {
    setDeletingGroup(true);
    try {
      const res = await apiClient.delete(`/api/groups/${id}`);
      showToast(res.data.message || 'Group deleted.', 'info');
      navigate('/groups');
    } catch (err) {
      showToast(err.response?.data?.message || 'Could not delete group.', 'error');
    } finally {
      setDeletingGroup(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleClearChat = async () => {
    setClearingChat(true);
    try {
      await apiClient.delete(`/api/groups/${id}/messages`);
      setMessages([]);
      setShowClearConfirm(false);
      showToast('Chat history cleared', 'info');
    } catch (err) {
      showToast(err.response?.data?.message || 'Could not clear chat.', 'error');
    } finally {
      setClearingChat(false);
    }
  };

  const handleMemberRoleAction = async (userId, action) => {
    try {
      const res = await apiClient.put(`/api/groups/${id}/members/${userId}`, { action });
      showToast(res.data?.message || 'Member status updated', 'success');
      fetchGroupData();
    } catch (err) {
      showToast(err.response?.data?.message || 'Action failed', 'error');
    }
  };

  const handleJoinRequestAction = async (userId, action) => {
    try {
      await apiClient.put(`/api/groups/${id}/requests/${userId}`, { action });
      showToast(action === 'accept' ? 'Request accepted' : 'Request declined', 'info');
      fetchGroupData();
    } catch (err) {
      console.error('Join request error:', err);
    }
  };

  const handleLeaveGroup = () => {
    setConfirmModal({
      isOpen: true,
      title: `Leave ${group?.name || 'Group'}`,
      message: `Are you sure you want to leave ${group?.name || 'this group'}? You will lose access to member discussions.`,
      confirmText: 'Leave Group',
      isDanger: true,
      action: async () => {
        try {
          const res = await apiClient.post(`/api/groups/${id}/leave`);
          showToast(res.data.message || `You left ${group?.name || 'the group'}`, 'info');
          navigate('/groups');
        } catch (err) {
          showToast(err.response?.data?.message || 'Error leaving group', 'error');
        }
      }
    });
  };

  const copyCallLink = () => {
    if (!group?.meetingLink) return;
    navigator.clipboard.writeText(group.meetingLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const copyInviteLink = () => {
    const url = `${window.location.origin}/groups/${group._id}?inviteCode=${group.inviteCode || ''}`;
    navigator.clipboard.writeText(url);
    setCopiedInviteLink(true);
    setTimeout(() => setCopiedInviteLink(false), 2000);
  };

  useEffect(() => {
    if (!showAddMemberModal) {
      setUserSearchQuery('');
      setSearchedUsers([]);
      return;
    }
    let isCurrent = true;
    setSearchingUsers(true);
    const timer = setTimeout(async () => {
      try {
        const query = userSearchQuery.trim();
        const res = await apiClient.get(`/api/users/search?q=${encodeURIComponent(query)}`);
        if (!isCurrent) return;
        const rawUsers = res.data?.data?.users || res.data?.users || [];
        const currentMemberIds = new Set(
          (group?.members || []).map((m) => (m?._id || m?.user?._id || m?.user || m)?.toString())
        );
        const filtered = rawUsers.filter((u) => !currentMemberIds.has(u._id?.toString()));
        setSearchedUsers(filtered);
      } catch (err) {
        console.error('Error searching users:', err);
      } finally {
        if (isCurrent) setSearchingUsers(false);
      }
    }, 250);

    return () => {
      isCurrent = false;
      clearTimeout(timer);
    };
  }, [showAddMemberModal, userSearchQuery, group?.members]);

  const handleAddMember = async (targetUser) => {
    if (!targetUser?._id) return;
    setAddingUserId(targetUser._id);
    try {
      await apiClient.post(`/api/groups/${id}/members`, { userId: targetUser._id });
      setAddedUserIds((prev) => new Set([...prev, targetUser._id]));
      fetchGroupData();
    } catch (err) {
      alert(err.response?.data?.message || 'Could not add member');
    } finally {
      setAddingUserId(null);
    }
  };

  const handleGroupImgUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert('Image size exceeds 5MB limit.');
      return;
    }
    setUploadingGroupImg(true);
    try {
      const formData = new window.FormData();
      formData.append('image', file);
      const res = await apiClient.post('/api/users/upload-image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      const imageUrl = res.data?.data?.url || res.data?.url;
      if (imageUrl) {
        setEditImage(imageUrl);
        await apiClient.put(`/api/groups/${id}`, { image: imageUrl });
        setGroup((prev) => ({ ...prev, image: imageUrl }));
      }
    } catch (err) {
      console.error('Group image upload error:', err);
      alert(err.response?.data?.message || 'Failed to upload group image');
    } finally {
      setUploadingGroupImg(false);
      if (groupImgFileInputRef.current) groupImgFileInputRef.current.value = '';
    }
  };

  // ── Loading / not found states ──────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center h-screen page-shell text-app gap-3">
        <div className="w-10 h-10 rounded-full border-4 border-indigo-500/20 border-t-indigo-500 animate-spin" />
        <span className="text-sm text-muted font-medium">Loading group…</span>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center h-screen page-shell text-app gap-3">
        <Users size={40} className="text-muted" />
        <p className="font-bold text-base">Group not found or has been deleted.</p>
        <Link to="/groups" className="text-xs text-indigo-600 dark:text-indigo-400 font-bold hover:underline">Browse Groups</Link>
      </div>
    );
  }

  const isMember = group.isMember;
  const isAdmin = group.isAdmin;
  const hasRequestedJoin = (group.pendingRequests || []).some(
    (r) => (r._id || r).toString() === user._id.toString()
  );

  // ── Non-member gate ──────────────────────────────────────────────────────
  if (!isMember) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-screen page-shell p-6">
        <div className="w-full max-w-md bg-white dark:bg-[#22242a] border border-slate-200 dark:border-slate-700 rounded-3xl p-8 text-center shadow-xl space-y-5">
          <img src={group.image} alt={group.name} className="w-24 h-24 rounded-full mx-auto object-cover border-4 border-slate-100 dark:border-slate-800 shadow" />
          <div>
            <h2 className="text-xl font-bold text-app">{group.name}</h2>
            <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 px-2.5 py-0.5 rounded-full mt-1 inline-block capitalize">{group.privacy} Group · {group.members?.length || 0} members</span>
          </div>
          <p className="text-sm text-muted leading-relaxed">{group.description || 'Join this group to connect with peers and start learning together.'}</p>
          <div className="flex gap-3 justify-center pt-1">
            <Link to="/groups" className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-muted hover:text-app transition-colors">Browse Groups</Link>
            {hasRequestedJoin ? (
              <button disabled className="px-5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold text-muted cursor-not-allowed">Request Pending…</button>
            ) : (
              <button
                onClick={async () => {
                  try { const res = await apiClient.post(`/api/groups/${id}/join`); alert(res.data.message || 'Done!'); fetchGroupData(); }
                  catch (err) { alert(err.response?.data?.message || 'Error joining'); }
                }}
                className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-2 transition-all shadow"
              >
                <Users size={14} /> {group.privacy === 'private' ? 'Request to Join' : 'Join Group'}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── Derived values ───────────────────────────────────────────────────────
  const displayedMessages = messages
    .filter((m) => !hiddenDeletedMsgIds.includes(m._id))
    .filter((m) =>
      !inChatSearch.trim() ||
      m.content?.toLowerCase().includes(inChatSearch.toLowerCase()) ||
      m.sender?.name?.toLowerCase().includes(inChatSearch.toLowerCase())
    );

  const pinnedMsg = messages.find((m) => m.isPinned && !m.deletedAt);
  const mediaMessages = messages.filter((m) => m.fileUrl && !m.deletedAt);
  const sharedLinks = messages.flatMap((m) => {
    if (m.deletedAt) return [];
    return (m.content || '').match(/(https?:\/\/[^\s]+)/g) || [];
  });

  const filteredSidebarGroups = joinedGroups.filter((g) =>
    !sidebarSearch.trim() || g.name.toLowerCase().includes(sidebarSearch.toLowerCase())
  );

  const adminIds = new Set([
    ...(group?.admins || []).map((a) => (a?._id || a)?.toString()),
    (group?.creator?._id || group?.creator)?.toString()
  ].filter(Boolean));

  const filteredMembers = (group?.members || []).filter((m) => {
    if (!memberSearchQuery.trim()) return true;
    const name = (m?.name || m?.user?.name || '').toLowerCase();
    return name.includes(memberSearchQuery.toLowerCase());
  });

  // ── RENDER ───────────────────────────────────────────────────────────────
  return (
    <div className="flex h-full w-full min-h-0 overflow-hidden bg-white dark:bg-[#1a1c22] text-app animate-fade-in">

      {/* ═══════════════════════════════════════════════════════════════════
          LEFT COLUMN — Groups list sidebar
      ═══════════════════════════════════════════════════════════════════ */}
      <div className="hidden md:flex flex-col w-80 lg:w-[22rem] shrink-0 bg-white dark:bg-[#22242a] border-r border-slate-200 dark:border-slate-800">

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-800">
          <h2 className="font-bold text-base text-app">Chats</h2>
          <div className="flex items-center gap-1">
            <Link to="/groups" title="Browse groups" className="p-1.5 rounded-lg text-muted hover:text-app hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
              <Plus size={18} />
            </Link>
          </div>
        </div>

        {/* Search */}
        <div className="px-3 py-2 border-b border-slate-200 dark:border-slate-800">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input
              type="text"
              placeholder="Search groups…"
              value={sidebarSearch}
              onChange={(e) => setSidebarSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs text-app placeholder:text-muted outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
          <div className="flex gap-1.5 mt-2">
            {['all', 'unread'].map((f) => (
              <button
                key={f}
                onClick={() => setSidebarFilter(f)}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-all capitalize ${
                  sidebarFilter === f ? 'bg-indigo-600 text-white' : 'text-muted hover:text-app'
                }`}
              >{f}</button>
            ))}
          </div>
        </div>

        {/* Groups list */}
        <div className="flex-1 overflow-y-auto">
          {filteredSidebarGroups.length === 0 ? (
            <p className="text-center text-xs text-muted p-6">No groups joined yet.</p>
          ) : (
            filteredSidebarGroups.map((g) => {
              const active = g._id === id;
              return (
                <Link
                  key={g._id}
                  to={`/groups/${g._id}`}
                  className={`flex items-center gap-3 px-3 py-2.5 border-l-2 transition-colors ${
                    active
                      ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/30'
                      : 'border-transparent hover:bg-slate-50 dark:hover:bg-slate-800/50'
                  }`}
                >
                  {g.image ? (
                    <img
                      src={g.image}
                      alt={g.name}
                      className="w-11 h-11 rounded-full object-cover shrink-0 bg-slate-200 dark:bg-slate-700"
                    />
                  ) : (
                    <div className="w-11 h-11 rounded-full flex items-center justify-center font-bold text-white bg-gradient-to-tr from-indigo-600 to-violet-500 uppercase select-none text-base shrink-0">
                      {g.name?.trim()?.[0]?.toUpperCase() || 'G'}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-sm text-app truncate">{g.name}</span>
                      <span className="text-[10px] text-muted font-mono shrink-0 ml-1">
                        {formatChatDate(g.lastActivity || g.updatedAt || g.createdAt)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 mt-0.5">
                      <p className="text-xs text-muted truncate">{g.category || `${g.members?.length || 0} members`}</p>
                      {g.privacy === 'private' && <Lock size={10} className="text-muted shrink-0" />}
                    </div>
                  </div>
                </Link>
              );
            })
          )}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          CENTER COLUMN — Chat area
      ═══════════════════════════════════════════════════════════════════ */}
      <div className="flex-1 flex flex-col min-w-0 bg-slate-50 dark:bg-[#1a1c22]">

        {/* Chat Header */}
        <div className="flex items-center justify-between px-2.5 sm:px-5 h-12 sm:h-16 bg-white dark:bg-[#22242a] border-b border-slate-200 dark:border-slate-800 shrink-0 sticky top-0 z-20">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <Link
              to="/groups"
              title="Back to Groups"
              className="p-1 sm:p-1.5 rounded-lg sm:rounded-xl text-muted hover:text-app hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-0.5 shrink-0"
            >
              <ChevronLeft size={18} />
              <span className="hidden sm:inline text-xs font-semibold">Back</span>
            </Link>
            <button
              onClick={() => setShowGroupInfo((v) => !v)}
              className="flex items-center gap-2 sm:gap-3 min-w-0 hover:opacity-80 transition-opacity"
            >
              {group.image ? (
                <img
                  src={group.image}
                  alt={group.name}
                  className="w-8 h-8 sm:w-11 sm:h-11 rounded-full object-cover shrink-0 bg-slate-200 dark:bg-slate-700"
                />
              ) : (
                <div className="w-8 h-8 sm:w-11 sm:h-11 rounded-full flex items-center justify-center font-bold text-white bg-gradient-to-tr from-indigo-600 to-violet-500 uppercase select-none text-xs sm:text-base shrink-0">
                  {group.name?.trim()?.[0]?.toUpperCase() || 'G'}
                </div>
              )}
              <div className="text-left min-w-0">
                <h2 className="font-bold text-xs sm:text-lg text-app truncate">{group.name}</h2>
                <p className="text-[10px] sm:text-xs text-muted">Group · {group.members?.length || 0} members</p>
              </div>
            </button>
          </div>

          <div className="flex items-center gap-0.5 sm:gap-1 shrink-0">
            {group.meetingLink ? (
              <a href={group.meetingLink} target="_blank" rel="noreferrer"
                className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] sm:text-xs font-semibold transition-all"
              >
                <Video size={13} /><span className="hidden sm:inline">Join Call</span>
              </a>
            ) : isAdmin && (
              <button onClick={() => setShowMeetingModal(true)}
                className="p-1 sm:p-1.5 rounded-lg text-muted hover:text-app hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title="Set meeting link"
              ><Video size={16} /></button>
            )}
            <button
              onClick={() => setShowInChatSearch((v) => !v)}
              className={`p-1 sm:p-1.5 rounded-lg transition-colors ${showInChatSearch ? 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950/30' : 'text-muted hover:text-app hover:bg-slate-100 dark:hover:bg-slate-800'}`}
            ><Search size={16} /></button>
            <button
              onClick={() => setShowGroupInfo((v) => !v)}
              className={`p-1 sm:p-1.5 rounded-lg transition-colors ${showGroupInfo ? 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950/30' : 'text-muted hover:text-app hover:bg-slate-100 dark:hover:bg-slate-800'}`}
            ><Info size={16} /></button>
          </div>
        </div>

        {/* In-chat search */}
        {showInChatSearch && (
          <div className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-[#22242a] border-b border-slate-200 dark:border-slate-800">
            <Search size={14} className="text-muted" />
            <input
              type="text"
              autoFocus
              placeholder="Search messages…"
              value={inChatSearch}
              onChange={(e) => setInChatSearch(e.target.value)}
              className="flex-1 bg-transparent text-xs text-app placeholder:text-muted outline-none"
            />
            {inChatSearch && <button onClick={() => setInChatSearch('')} className="text-muted hover:text-app"><X size={14} /></button>}
          </div>
        )}

        {/* Pinned message */}
        {pinnedMsg && (
          <div className="flex items-center justify-between gap-3 px-4 py-2 bg-amber-50 dark:bg-amber-950/20 border-b border-amber-200 dark:border-amber-800/40 shrink-0">
            <div className="flex items-center gap-2 min-w-0">
              <Pin size={12} className="text-amber-500 shrink-0" />
              <span className="text-xs font-bold text-amber-600 dark:text-amber-400 shrink-0">Pinned:</span>
              <span className="text-xs text-muted truncate">{pinnedMsg.content}</span>
            </div>
            {isAdmin && (
              <button onClick={() => handleTogglePin(pinnedMsg._id)} className="text-[11px] text-amber-600 hover:underline shrink-0">Unpin</button>
            )}
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-3 pt-5 sm:p-4 space-y-2">
          {displayedMessages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-muted gap-2 py-16">
              <Users size={36} className="opacity-40" />
              <p className="text-sm font-semibold text-app">No messages yet</p>
              <p className="text-xs">Be the first to say something!</p>
            </div>
          ) : (
            displayedMessages.map((msg) => {
              if (msg.isSystem || msg.fileType === 'system') {
                return (
                  <div key={msg._id} className="w-full flex justify-center my-3 select-none">
                    <div className="w-[70%] flex items-center gap-3">
                      <div className="h-px bg-slate-300 dark:bg-slate-700/80 flex-1" />
                      <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 tracking-wider text-center shrink-0 uppercase px-1">
                        {msg.content}
                      </span>
                      <div className="h-px bg-slate-300 dark:bg-slate-700/80 flex-1" />
                    </div>
                  </div>
                );
              }

              const senderId = String(msg.sender?._id || msg.sender?.id || msg.sender || '');
              const myId = String(user?._id || user?.id || '');
              const isMe = Boolean(senderId && myId && senderId === myId);
              const isDeleted = Boolean(msg.deletedAt);
              const menuOpen = openMsgMenuId === msg._id;

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
                        isReactionOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto'
                      }`}
                      title="React"
                    >
                      <Smile size={18} />
                    </button>

                    {isReactionOpen && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={(e) => { e.stopPropagation(); setActiveReactionMsgId(null); }} />
                        <div className={`absolute bottom-full mb-1.5 ${isMe ? 'right-0' : 'left-0'} z-50 flex items-center gap-1.5 rounded-full bg-white dark:bg-[#22242a] px-3 py-1.5 shadow-2xl border border-slate-200 dark:border-slate-700 animate-in fade-in zoom-in-95 duration-150`}>
                          {['👍', '❤️', '😂', '😮', '😢', '🙏'].map((emoji) => (
                            <button
                              key={emoji}
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleToggleGroupReaction(msg._id, emoji);
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
                      setReplyTarget(msg);
                    }
                  }}
                  onClick={(e) => {
                    if (selectionMode) {
                      toggleSelectMessage(msg._id);
                    }
                  }}
                  className={`flex items-end gap-2 group relative ${isMe ? 'justify-end' : 'justify-start'} ${
                    menuOpen || activeReactionMsgId === msg._id ? 'z-50 relative' : 'relative z-0'
                  } ${selectedMsgIds.includes(msg._id) ? 'bg-indigo-50/60 dark:bg-indigo-950/30 rounded-xl' : ''} ${
                    msg.reactions?.length > 0 ? 'mb-2.5' : ''
                  }`}
                >
                  {/* WhatsApp-style Swipe-to-reply icon indicator */}
                  <div
                    className={`swipe-reply-icon-grp-${msg._id} pointer-events-none absolute ${
                      isMe ? 'right-full mr-2' : 'left-0'
                    } top-1/2 -translate-y-1/2 z-20 flex h-7 w-7 items-center justify-center rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 opacity-0 shadow-md transition-colors`}
                  >
                    <Reply size={14} />
                  </div>

                  {!isMe && (
                    <img
                      src={msg.sender?.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(msg.sender?.name || 'User')}&background=6366f1&color=fff`}
                      alt={msg.sender?.name}
                      className="w-8 h-8 sm:w-9 sm:h-9 rounded-full object-cover shrink-0 bg-slate-200 dark:bg-slate-700"
                    />
                  )}

                  {isMe && renderReactionTrigger()}
                  <div className={`relative max-w-[90%] sm:max-w-[84%] lg:max-w-[78%] ${isMe ? 'items-end' : 'items-start'} flex flex-col ${menuOpen ? 'z-50' : 'z-auto'}`}>
                    {!isMe && (
                      <span className="text-xs font-bold text-indigo-500 dark:text-indigo-400 px-1 mb-1">
                        {msg.sender?.name || 'Member'}
                      </span>
                    )}

                    <div
                      onTouchStart={(e) => handleGroupBubbleTouchStart(e, msg)}
                      onTouchMove={(e) => handleGroupBubbleTouchMove(e, msg)}
                      onTouchEnd={(e) => handleGroupBubbleTouchEnd(e, msg)}
                      className={`relative px-4 py-2.5 sm:px-4 sm:py-3 rounded-2xl text-sm sm:text-[14.5px] leading-relaxed shadow-sm touch-pan-y ${
                      msg.replyTo && !isDeleted ? 'min-w-[260px] sm:min-w-[300px]' : 'min-w-[120px]'
                    } ${
                      isDeleted
                        ? 'bg-slate-100 dark:bg-[#1e2026] text-muted'
                        : isMe
                        ? 'bg-indigo-600 text-white rounded-br-sm'
                        : 'bg-white dark:bg-[#22242a] text-app rounded-bl-sm border border-slate-200 dark:border-neutral-700'
                    }`}>
                      {/* Chevron Down Button inside bubble */}
                      <div className="absolute right-1.5 top-1.5 z-30">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            const rect = e.currentTarget.getBoundingClientRect();
                            const openUp = window.innerHeight - rect.bottom < 320;
                            setMenuPlacement(openUp ? 'up' : 'down');
                            setOpenMsgMenuId(menuOpen ? '' : msg._id);
                          }}
                          className={`rounded-full p-1 transition-all ${
                            isDeleted
                              ? 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-black/10 dark:hover:bg-white/10'
                              : isMe
                              ? 'text-white/70 hover:text-white hover:bg-white/20'
                              : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-black/10 dark:hover:bg-white/10'
                          } ${
                            menuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto'
                          }`}
                          title="Message actions"
                        >
                          <ChevronDown size={15} />
                        </button>

                        {/* Context Menu Dropdown */}
                        {menuOpen && (
                          <>
                            <div className="fixed inset-0 z-40" onClick={(e) => { e.stopPropagation(); setOpenMsgMenuId(''); }} />
                            {isDeleted ? (
                              <div className={`absolute ${menuPlacement === 'up' ? 'bottom-full mb-1.5' : 'top-full mt-1'} ${isMe ? 'right-0' : 'left-0'} z-50 w-48 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#22242a] p-1.5 text-xs shadow-2xl`}>
                                {!isMe && msg.sender?._id && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDirectMessageSender(msg.sender);
                                      setOpenMsgMenuId('');
                                    }}
                                    className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                  >
                                    <MessageSquare size={14} className="text-slate-400 shrink-0" />
                                    <span className="truncate">Message {msg.sender?.name || 'Member'}</span>
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleSelectMessage(msg._id);
                                  }}
                                  className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                >
                                  <CheckSquare size={14} className="text-slate-400 shrink-0" /> Select
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleRemoveDeletedMessage(msg._id);
                                  }}
                                  className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                                >
                                  <Trash2 size={14} className="shrink-0" /> Delete
                                </button>
                              </div>
                            ) : (
                              <div className={`absolute ${menuPlacement === 'up' ? 'bottom-full mb-1.5' : 'top-full mt-1'} ${isMe ? 'right-0' : 'left-0'} z-50 w-52 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#22242a] p-1.5 text-xs shadow-2xl`}>
                              {/* Quick Reaction Bar */}
                              <div className="flex items-center justify-between px-2 py-1.5 mb-1 border-b border-slate-200 dark:border-slate-700">
                                {['👍', '❤️', '😂', '😮', '😢', '🙏'].map((emoji) => (
                                  <button
                                    key={emoji}
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleToggleGroupReaction(msg._id, emoji);
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
                                    setOpenMsgMenuId('');
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
                                  setReplyTarget(msg);
                                  setOpenMsgMenuId('');
                                }}
                                className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                              >
                                <Reply size={14} className="text-slate-400 shrink-0" /> Reply
                              </button>

                              {!isMe && msg.sender?._id && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDirectMessageSender(msg.sender);
                                    setOpenMsgMenuId('');
                                  }}
                                  className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                >
                                  <MessageSquare size={14} className="text-slate-400 shrink-0" />
                                  <span className="truncate">Message {msg.sender?.name || 'Member'}</span>
                                </button>
                              )}

                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigator.clipboard.writeText(msg.content || '');
                                  setOpenMsgMenuId('');
                                }}
                                className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                              >
                                <Copy size={14} className="text-slate-400 shrink-0" /> Copy
                              </button>

                              {isAdmin && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleTogglePin(msg._id);
                                  }}
                                  className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                >
                                  <Pin size={14} className="text-slate-400 shrink-0" /> {msg.isPinned ? 'Unpin' : 'Pin'}
                                </button>
                              )}

                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleSelectMessage(msg._id);
                                }}
                                className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                              >
                                <CheckSquare size={14} className="text-slate-400 shrink-0" /> Select
                              </button>

                              {(isMe || isAdmin) && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteMessage(msg._id);
                                  }}
                                  className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                                >
                                  <Trash2 size={14} className="shrink-0" /> Delete
                                </button>
                              )}
                            </div>
                          )}
                        </>
                      )}
                    </div>

                      {/* Reply quote */}
                      {msg.replyTo && !isDeleted && (
                        <div className={`mb-1.5 mr-7 px-2.5 py-1.5 rounded-lg border-l-2 ${isMe ? 'border-white/50 bg-white/10' : 'border-indigo-400 bg-slate-50 dark:bg-[#1a1c22]'}`}>
                          <p className="text-[11px] font-bold opacity-80">{msg.replyTo.sender?.name || 'Member'}</p>
                          <p className="text-xs opacity-70 truncate">{msg.replyTo.content}</p>
                        </div>
                      )}

                      {isDeleted ? (
                        <div className="flex items-center gap-1.5 italic text-slate-500 dark:text-slate-400 select-none pr-7 py-0.5">
                          <Ban size={14} className="shrink-0 opacity-70" />
                          <span className="text-xs sm:text-[13.5px]">This message was deleted</span>
                        </div>
                      ) : msg.fileUrl ? (
                        <div className="pr-7">
                          {msg.fileType === 'image' ? (
                            <img src={msg.fileUrl} alt={msg.content} className="rounded-xl max-w-[280px] object-cover" />
                          ) : (
                            <a href={msg.fileUrl} target="_blank" rel="noreferrer"
                              className={`flex items-center gap-2 font-semibold hover:underline ${isMe ? 'text-white/90' : 'text-indigo-600 dark:text-indigo-400'}`}
                            >
                              <FileText size={16} />{msg.content}
                            </a>
                          )}
                        </div>
                      ) : (
                        <span className="whitespace-pre-wrap break-words pr-7 block">{msg.content}</span>
                      )}

                      {/* Timestamp + read ticks */}
                      {!isDeleted && (
                        <div className={`flex items-center gap-1.5 mt-1.5 ${isMe ? 'justify-end' : 'justify-end'}`}>
                          <span className={`text-[10px] sm:text-[11px] ${isMe ? 'text-white/70' : 'text-muted'}`}>
                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          {isMe && <CheckCheck size={12} className="text-white/80" />}
                        </div>
                      )}

                      {/* Reaction badge attached to the bottom edge of the bubble */}
                      {msg.reactions && msg.reactions.length > 0 && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            const myReaction = msg.reactions.find((r) => (r.user?._id || r.user) === user._id);
                            if (myReaction) {
                              handleToggleGroupReaction(msg._id, myReaction.emoji);
                            }
                          }}
                          className={`absolute -bottom-1 ${
                            isMe ? 'right-2' : 'left-2'
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
                  </div>
                  {!isMe && renderReactionTrigger()}
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Selection mode banner */}
        {selectionMode && (
          <div className="flex items-center justify-between gap-3 px-4 py-2 bg-indigo-50 dark:bg-indigo-950/40 border-t border-indigo-200 dark:border-indigo-800">
            <span className="text-xs font-semibold text-indigo-700 dark:text-indigo-300">
              {selectedMsgIds.length} message{selectedMsgIds.length !== 1 ? 's' : ''} selected
            </span>
            <button
              type="button"
              onClick={() => {
                setSelectedMsgIds([]);
                setSelectionMode(false);
              }}
              className="text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
            >
              Cancel
            </button>
          </div>
        )}

        {/* Reply target bar */}
        {replyTarget && (
          <div className="flex items-center justify-between gap-3 px-4 py-2 bg-white dark:bg-[#22242a] border-t border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2 min-w-0">
              <Reply size={14} className="text-indigo-500 shrink-0" />
              <div className="min-w-0">
                <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">Replying to {replyTarget.sender?.name || 'Member'}: </span>
                <span className="text-xs text-muted ml-1 truncate">{replyTarget.content}</span>
              </div>
            </div>
            <button onClick={() => setReplyTarget(null)} className="text-muted hover:text-app shrink-0"><X size={14} /></button>
          </div>
        )}

        {/* Input bar */}
        <div className="px-2.5 sm:px-5 py-2 sm:py-3.5 bg-white dark:bg-[#22242a] border-t border-slate-200 dark:border-slate-800 shrink-0 relative sticky bottom-0 z-20">
          {/* Attach popup */}
          {showAttachMenu && (
            <div className="absolute bottom-14 left-2 sm:left-4 z-20 w-44 sm:w-48 bg-white dark:bg-[#2a2c34] border border-slate-200 dark:border-slate-700 rounded-2xl p-1.5 sm:p-2 shadow-xl space-y-1">
              <button type="button" onClick={() => { imageInputRef.current?.click(); setShowAttachMenu(false); }}
                className="w-full flex items-center gap-2.5 px-2.5 py-1.5 sm:px-3 sm:py-2 text-xs sm:text-sm font-semibold text-app hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl">
                <ImageIcon size={15} className="text-indigo-500" /> Photos & Images
              </button>
              <button type="button" onClick={() => { documentInputRef.current?.click(); setShowAttachMenu(false); }}
                className="w-full flex items-center gap-2.5 px-2.5 py-1.5 sm:px-3 sm:py-2 text-xs sm:text-sm font-semibold text-app hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl">
                <FileText size={15} className="text-blue-500" /> Document / PDF
              </button>
            </div>
          )}

          {/* Emoji picker */}
          {showEmojiPicker && (
            <div className="absolute bottom-14 left-8 sm:left-12 z-20 grid grid-cols-6 gap-1 bg-white dark:bg-[#2a2c34] border border-slate-200 dark:border-slate-700 rounded-2xl p-2 shadow-xl">
              {['👍','❤️','🔥','🎉','🚀','💯','✨','👏','💡','📚','🤝','🙌'].map((e) => (
                <button key={e} type="button" onClick={() => { setTypedMessage((p) => p + e); setShowEmojiPicker(false); }}
                  className="p-1.5 sm:p-2 text-lg sm:text-xl hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-transform hover:scale-110">{e}</button>
              ))}
            </div>
          )}

          {/* Hidden file inputs */}
          <input type="file" ref={imageInputRef} accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e.target.files[0])} />
          <input type="file" ref={documentInputRef} accept=".pdf,.doc,.docx,.txt" className="hidden" onChange={(e) => handleFileUpload(e.target.files[0])} />
          <input type="file" ref={groupImgFileInputRef} accept="image/*" className="hidden" onChange={handleGroupImgUpload} />

          <form onSubmit={handleSendMessage} className="flex items-center gap-1.5 sm:gap-2.5">
            <button type="button" onClick={() => setShowAttachMenu((v) => !v)}
              className="p-1.5 sm:p-2.5 rounded-full text-muted hover:text-app hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0">
              <Plus size={18} />
            </button>
            <button type="button" onClick={() => setShowEmojiPicker((v) => !v)}
              className="p-1.5 sm:p-2.5 rounded-full text-muted hover:text-app hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0">
              <Smile size={18} />
            </button>
            <input
              ref={chatInputRef}
              type="text"
              placeholder={uploadingFile ? 'Uploading…' : 'Type a message…'}
              value={typedMessage}
              disabled={uploadingFile}
              onChange={(e) => setTypedMessage(e.target.value)}
              className="flex-1 bg-slate-100 dark:bg-slate-800 text-app placeholder:text-muted rounded-xl px-3 py-1.5 sm:py-3 text-xs sm:text-[15px] outline-none border-none focus:ring-1 focus:ring-indigo-500 transition-all"
            />
            <button type="submit" disabled={!typedMessage.trim() || uploadingFile}
              className="p-2 sm:p-3 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-40 transition-all shadow-sm shrink-0">
              <Send size={15} />
            </button>
          </form>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          RIGHT PANEL — Group Info (slide-in overlay)
      ═══════════════════════════════════════════════════════════════════ */}
      {showGroupInfo && (
        <>
          {/* Mobile Backdrop */}
          <div
            className="fixed inset-0 top-16 z-30 bg-black/40 backdrop-blur-xs lg:hidden"
            onClick={() => setShowGroupInfo(false)}
          />
          <div className="fixed top-16 bottom-0 right-0 lg:top-0 lg:inset-y-0 z-40 w-full sm:w-[400px] lg:w-[45%] lg:min-w-[340px] lg:max-w-[560px] bg-white dark:bg-[#22242a] border-l border-slate-200 dark:border-slate-800 flex flex-col shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between px-4 h-14 border-b border-slate-200 dark:border-slate-800 shrink-0 bg-white dark:bg-[#22242a]">
              <div className="flex items-center gap-3">
                <button onClick={() => setShowGroupInfo(false)} className="p-1 rounded-lg text-muted hover:text-app hover:bg-slate-100 dark:hover:bg-slate-800">
                  <ChevronLeft size={20} />
                </button>
                <h3 className="font-bold text-base text-app">Group info</h3>
              </div>
              <button onClick={() => setShowGroupInfo(false)} className="p-1 rounded-lg text-muted hover:text-app hover:bg-slate-100 dark:hover:bg-slate-800">
                <X size={18} />
              </button>
            </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto">

            {/* Group avatar + name */}
            <div className="p-6 text-center space-y-2 border-b border-slate-200 dark:border-slate-800">
              <div className="relative inline-block">
                {group.image ? (
                  <img
                    src={group.image}
                    alt={group.name}
                    className="w-28 h-28 rounded-full object-cover border-4 border-slate-100 dark:border-slate-800 shadow-lg mx-auto"
                  />
                ) : (
                  <div className="w-28 h-28 rounded-full flex items-center justify-center font-bold text-white bg-gradient-to-tr from-indigo-600 to-violet-500 uppercase select-none text-4xl border-4 border-slate-100 dark:border-slate-800 shadow-lg mx-auto">
                    {group.name?.trim()?.[0]?.toUpperCase() || 'G'}
                  </div>
                )}
                {isAdmin && (
                  <button
                    onClick={() => groupImgFileInputRef.current?.click()}
                    disabled={uploadingGroupImg}
                    title="Change group photo"
                    className="absolute bottom-1 right-1 p-2 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg transition-transform active:scale-95 disabled:opacity-75"
                  >
                    {uploadingGroupImg ? <Loader2 size={14} className="animate-spin" /> : <Camera size={14} />}
                  </button>
                )}
              </div>
              <div>
                <div className="flex items-center justify-center gap-2">
                  <h2 className="text-lg font-bold text-app">{group.name}</h2>
                  {isAdmin && (
                    <button onClick={() => setShowSettingsModal(true)} className="text-muted hover:text-indigo-600 transition-colors">
                      <Pencil size={14} />
                    </button>
                  )}
                </div>
                <p className="text-xs text-muted">
                  Group · {group.members?.length || 0} members ·
                  <span className="ml-1 capitalize">{group.privacy}</span>
                </p>
              </div>

              {/* Action buttons */}
              <div className="flex items-center justify-center gap-6 pt-2">
                <button onClick={() => setShowAddMemberModal(true)} className="flex flex-col items-center gap-1 group">
                  <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-indigo-600 dark:text-indigo-400 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-950/30 transition-colors border border-slate-200 dark:border-slate-700">
                    <UserPlus size={17} />
                  </div>
                  <span className="text-[11px] text-muted">Add</span>
                </button>
                <button onClick={() => { setShowGroupInfo(false); setShowInChatSearch(true); }} className="flex flex-col items-center gap-1 group">
                  <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-indigo-600 dark:text-indigo-400 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-950/30 transition-colors border border-slate-200 dark:border-slate-700">
                    <Search size={17} />
                  </div>
                  <span className="text-[11px] text-muted">Search</span>
                </button>
              </div>
            </div>

            {/* Description */}
            {group.description && (
              <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800">
                <p className="text-xs text-muted leading-relaxed">{group.description}</p>
                {group.category && (
                  <span className="inline-block mt-1.5 text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400">{group.category}</span>
                )}
              </div>
            )}

            {/* Meeting link */}
            <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-muted uppercase tracking-wider">Meeting Link</span>
                {isAdmin && (
                  <button onClick={() => setShowMeetingModal(true)} className="text-muted hover:text-indigo-600 transition-colors"><Pencil size={14} /></button>
                )}
              </div>
              {group.meetingLink ? (
                <div className="mt-2.5 flex items-center justify-between">
                  <a href={group.meetingLink} target="_blank" rel="noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm transition-all">
                    <Video size={14} /> Join Group Call
                  </a>
                </div>
              ) : (
                <p className="text-xs text-muted mt-1">{isAdmin ? 'Tap pencil to add a meeting link.' : 'No meeting link set yet.'}</p>
              )}
            </div>

            {/* Copy Group Invite Link */}
            <div className="border-b border-slate-200 dark:border-slate-800">
              <button onClick={copyInviteLink}
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors text-left">
                <div className="flex items-center gap-3">
                  <Link2 size={16} className="text-muted" />
                  <span className="text-sm font-medium text-app">{copiedInviteLink ? 'Link copied!' : 'Copy Group Invite Link'}</span>
                </div>
                {copiedInviteLink ? <Check size={14} className="text-emerald-500" /> : <Share2 size={14} className="text-muted" />}
              </button>
            </div>

            {/* Media section */}
            <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-muted uppercase tracking-wider">Media, links & docs</span>
                <span className="text-xs text-indigo-600 dark:text-indigo-400 font-bold">{mediaMessages.length}</span>
              </div>
              <div className="flex gap-1.5 mb-2">
                {['all','images','docs'].map((t) => (
                  <button key={t} onClick={() => setActiveMediaTab(t)}
                    className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold capitalize transition-all ${activeMediaTab === t ? 'bg-indigo-600 text-white' : 'text-muted hover:text-app'}`}
                  >{t}</button>
                ))}
              </div>
              <div className="grid grid-cols-3 gap-1">
                {mediaMessages
                  .filter((m) => activeMediaTab === 'all' || (activeMediaTab === 'images' ? m.fileType === 'image' : m.fileType !== 'image'))
                  .slice(0, 9)
                  .map((m) => (
                    <a key={m._id} href={m.fileUrl} target="_blank" rel="noreferrer"
                      className="aspect-square rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:opacity-80 transition-opacity flex items-center justify-center">
                      {m.fileType === 'image'
                        ? <img src={m.fileUrl} alt="" className="w-full h-full object-cover" />
                        : <FileText size={20} className="text-muted" />}
                    </a>
                  ))}
              </div>
            </div>

            {/* Group permissions (admin only) */}
            {isAdmin && (
              <div className="border-b border-slate-200 dark:border-slate-800">
                <button onClick={() => setShowSettingsModal(true)}
                  className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors text-left">
                  <div className="flex items-center gap-3">
                    <Settings size={16} className="text-muted" />
                    <span className="text-sm text-app">Group permissions</span>
                  </div>
                  <ChevronRight size={15} className="text-muted" />
                </button>
              </div>
            )}

            {/* Members list */}
            <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-muted uppercase tracking-wider">{group.members?.length || 0} Members</span>
              </div>
              <div className="relative mb-2">
                <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted" />
                <input
                  type="text"
                  placeholder="Search members…"
                  value={memberSearchQuery}
                  onChange={(e) => setMemberSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs text-app placeholder:text-muted outline-none"
                />
              </div>
              <div className="divide-y divide-slate-100 dark:divide-slate-800/80 border border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-50/50 dark:bg-slate-900/30">
                {filteredMembers.map((m) => {
                  const memberId = (m?._id || m?.user?._id)?.toString();
                  const memberName = m?.name || m?.user?.name || 'Member';
                  const memberImg = m?.profileImage || m?.user?.profileImage;
                  const isAdminMember = adminIds.has(memberId);
                  const isMe = memberId === user?._id?.toString();
                  const creatorId = (group.creator?._id || group.creator)?.toString();
                  const isCreator = memberId === creatorId;

                  return (
                    <div
                      key={memberId || Math.random()}
                      className="w-full flex items-center justify-between gap-2 px-3 py-2.5 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors group relative"
                    >
                      <button
                        type="button"
                        onClick={() => {
                          if (memberId) {
                            setShowGroupInfo(false);
                            navigate(`/profile/${memberId}`);
                          }
                        }}
                        className="flex items-center gap-3 flex-1 min-w-0 text-left"
                      >
                        <img
                          src={memberImg || `https://ui-avatars.com/api/?name=${encodeURIComponent(memberName)}&background=6366f1&color=fff`}
                          alt={memberName}
                          className="w-10 h-10 rounded-full object-cover bg-slate-200 dark:bg-slate-700 shrink-0"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-app truncate leading-tight">
                            {memberName} {isMe && <span className="text-[11px] text-muted font-normal">(You)</span>}
                          </p>
                          {isAdminMember && (
                            <p className="text-xs text-indigo-600 dark:text-indigo-400 font-medium mt-0.5">Admin</p>
                          )}
                        </div>
                      </button>

                      <div
                        className="relative shrink-0"
                        onMouseEnter={() => handleMemberMenuMouseEnter(memberId)}
                        onMouseLeave={handleMemberMenuMouseLeave}
                      >
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (closeMemberMenuTimerRef.current) clearTimeout(closeMemberMenuTimerRef.current);
                            setOpenMemberMenuId(openMemberMenuId === memberId ? '' : memberId);
                          }}
                          className="group/dots p-1.5 rounded-lg text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 bg-slate-200/50 hover:bg-blue-50/80 dark:bg-slate-800/60 dark:hover:bg-blue-950/40 active:scale-95 transition-all duration-200"
                          title="Member options"
                        >
                          <MoreVertical
                            size={16}
                            className="transition-transform duration-200 group-hover/dots:scale-110"
                          />
                        </button>

                        {openMemberMenuId === memberId && (
                          <div
                            className="absolute right-0 top-full mt-1 z-50 w-48 bg-white dark:bg-[#2a2c34] border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl py-1 text-xs divide-y divide-slate-100 dark:divide-slate-800 animate-in fade-in zoom-in-95 duration-150"
                            onMouseEnter={() => handleMemberMenuMouseEnter(memberId)}
                            onMouseLeave={handleMemberMenuMouseLeave}
                          >
                            <div className="py-0.5">
                              <button
                                type="button"
                                onClick={() => {
                                  setOpenMemberMenuId('');
                                  setShowGroupInfo(false);
                                  navigate(`/profile/${memberId}`);
                                }}
                                className="w-full flex items-center gap-2 px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 text-app text-left font-medium"
                              >
                                <ExternalLink size={13} className="text-muted" /> View Profile
                              </button>
                            </div>

                            {isAdmin && !isCreator && !isMe && (
                              <div className="py-0.5">
                                {!isAdminMember ? (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setOpenMemberMenuId('');
                                      setConfirmModal({
                                        isOpen: true,
                                        title: 'Make Group Admin',
                                        message: `Promote ${memberName} to group admin? Admins can edit group details and manage members.`,
                                        confirmText: 'Make Admin',
                                        isDanger: false,
                                        action: () => handleMemberRoleAction(memberId, 'make_admin')
                                      });
                                    }}
                                    className="w-full flex items-center gap-2 px-3 py-2 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 text-left font-medium"
                                  >
                                    <Shield size={13} /> Make group admin
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setOpenMemberMenuId('');
                                      setConfirmModal({
                                        isOpen: true,
                                        title: 'Dismiss as Admin',
                                        message: `Remove ${memberName} as group admin? They will remain a regular member of the group.`,
                                        confirmText: 'Dismiss Admin',
                                        isDanger: true,
                                        action: () => handleMemberRoleAction(memberId, 'remove_admin')
                                      });
                                    }}
                                    className="w-full flex items-center gap-2 px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 text-amber-600 dark:text-amber-400 text-left font-medium"
                                  >
                                    <UserX size={13} /> Dismiss as admin
                                  </button>
                                )}

                                <button
                                  type="button"
                                  onClick={() => {
                                    setOpenMemberMenuId('');
                                    setConfirmModal({
                                      isOpen: true,
                                      title: 'Remove Member',
                                      message: `Kick ${memberName} from this group? They will no longer have access to this chat.`,
                                      confirmText: 'Remove Member',
                                      isDanger: true,
                                      action: () => handleMemberRoleAction(memberId, 'kick')
                                    });
                                  }}
                                  className="w-full flex items-center gap-2 px-3 py-2 hover:bg-red-50 dark:hover:bg-red-950/30 text-red-500 text-left font-medium"
                                >
                                  <UserX size={13} /> Remove from group
                                </button>
                              </div>
                            )}

                            {isMe && !isCreator && (
                              <div className="py-0.5">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setOpenMemberMenuId('');
                                    setConfirmModal({
                                      isOpen: true,
                                      title: 'Leave Group',
                                      message: 'Are you sure you want to leave this group?',
                                      confirmText: 'Leave Group',
                                      isDanger: true,
                                      action: handleLeaveGroup
                                    });
                                  }}
                                  className="w-full flex items-center gap-2 px-3 py-2 hover:bg-red-50 dark:hover:bg-red-950/30 text-red-500 text-left font-medium"
                                >
                                  <LogOut size={13} /> Leave group
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Pending requests (admin only) */}
            {isAdmin && (group.pendingRequests || []).length > 0 && (
              <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800">
                <p className="text-xs font-bold text-muted uppercase tracking-wider mb-2">Join Requests ({group.pendingRequests.length})</p>
                <div className="space-y-2">
                  {group.pendingRequests.map((req) => {
                    const reqId = req._id || req;
                    const reqName = req.name || 'User';
                    return (
                      <div key={reqId} className="flex items-center justify-between gap-2">
                        <span className="text-sm text-app truncate">{reqName}</span>
                        <div className="flex gap-1.5">
                          <button onClick={() => handleJoinRequestAction(reqId, 'approve')}
                            className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold">Accept</button>
                          <button onClick={() => handleJoinRequestAction(reqId, 'reject')}
                            className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-muted text-xs font-bold hover:text-app">Reject</button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Leave / Clear / Delete */}
            <div className="px-4 py-3 space-y-1">
              <button
                type="button"
                onClick={handleLeaveGroup}
                className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors text-muted hover:text-app"
              >
                <LogOut size={16} />
                <span className="text-sm font-semibold">Leave group</span>
              </button>

              <button
                type="button"
                onClick={() => setShowClearConfirm(true)}
                className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors text-red-500"
              >
                <Trash2 size={16} />
                <span className="text-sm font-semibold">Clear chat</span>
              </button>

              {isAdmin && (
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors text-red-600 dark:text-red-400 font-semibold"
                >
                  <AlertTriangle size={16} />
                  <span className="text-sm font-semibold">Delete group</span>
                </button>
              )}
            </div>

            {/* Created at */}
            <p className="text-center text-[11px] text-muted py-4">
              Created {new Date(group.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}
            </p>
          </div>
        </div>
        </>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          MODALS
      ═══════════════════════════════════════════════════════════════════ */}

      {/* Settings Modal */}
      {showSettingsModal && (
        <div role="dialog" data-modal="true" className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white dark:bg-[#22242a] border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800">
              <h3 className="font-bold text-base text-app">Group Settings</h3>
              <button onClick={() => setShowSettingsModal(false)} className="p-1 rounded-lg text-muted hover:text-app hover:bg-slate-100 dark:hover:bg-slate-800"><X size={18} /></button>
            </div>
            <form onSubmit={handleSaveSettings} className="p-5 space-y-4 text-sm">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted uppercase tracking-wider">Group Name</label>
                <input type="text" required value={editName} onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-app outline-none focus:border-indigo-500" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted uppercase tracking-wider">Description</label>
                <textarea rows={3} value={editDesc} onChange={(e) => setEditDesc(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-app outline-none focus:border-indigo-500 resize-none" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted uppercase tracking-wider">Group Image (Link or Upload)</label>
                <div className="flex gap-2 items-center">
                  <input
                    type="url"
                    value={editImage}
                    onChange={(e) => setEditImage(e.target.value)}
                    placeholder="https://… (Paste image link)"
                    className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-app outline-none focus:border-indigo-500 text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => groupImgFileInputRef.current?.click()}
                    disabled={uploadingGroupImg}
                    className="px-3 py-2 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 rounded-xl text-xs font-bold hover:bg-indigo-100 dark:hover:bg-indigo-900/50 flex items-center gap-1.5 shrink-0 transition-colors"
                  >
                    {uploadingGroupImg ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} />}
                    {uploadingGroupImg ? 'Uploading…' : 'Upload'}
                  </button>
                </div>
                <div className="flex items-center gap-2 pt-1">
                  {editImage ? (
                    <>
                      <img src={editImage} alt="Preview" className="w-8 h-8 rounded-full object-cover border border-slate-200 dark:border-slate-700" />
                      <span className="text-[11px] text-muted truncate">Custom image set</span>
                      <button
                        type="button"
                        onClick={() => setEditImage('')}
                        className="ml-auto text-xs text-red-500 hover:underline"
                      >
                        Remove
                      </button>
                    </>
                  ) : (
                    <>
                      <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-white bg-gradient-to-tr from-indigo-600 to-violet-500 uppercase select-none text-xs shrink-0">
                        {editName?.trim()?.[0]?.toUpperCase() || 'G'}
                      </div>
                      <span className="text-[11px] text-muted">Default letter avatar will be used</span>
                    </>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted uppercase tracking-wider">Category</label>
                  <select value={editCategory} onChange={(e) => setEditCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-app outline-none focus:border-indigo-500">
                    {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted uppercase tracking-wider">Privacy</label>
                  <select value={editPrivacy} onChange={(e) => setEditPrivacy(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-app outline-none focus:border-indigo-500">
                    <option value="public">Public</option>
                    <option value="private">Private</option>
                  </select>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted uppercase tracking-wider">Tags (comma separated)</label>
                <input type="text" value={editTags} onChange={(e) => setEditTags(e.target.value)} placeholder="react, web, beginners"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-app outline-none focus:border-indigo-500" />
              </div>
              <div className="flex gap-2 pt-1">
                <button type="submit" disabled={savingSettings}
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-sm transition-all disabled:opacity-50">
                  {savingSettings ? 'Saving…' : 'Save Changes'}
                </button>
                <button type="button" onClick={() => setShowSettingsModal(false)}
                  className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 text-muted hover:text-app rounded-xl font-bold text-sm">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Meeting Link Modal */}
      {showMeetingModal && (
        <div role="dialog" data-modal="true" className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-white dark:bg-[#22242a] border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800">
              <h3 className="font-bold text-base text-app">Meeting Link</h3>
              <button onClick={() => setShowMeetingModal(false)} className="p-1 rounded-lg text-muted hover:text-app hover:bg-slate-100 dark:hover:bg-slate-800"><X size={18} /></button>
            </div>
            <form onSubmit={handleSaveMeetingLink} className="p-5 space-y-4 text-sm">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted uppercase tracking-wider">Provider</label>
                <select value={meetingProviderInput} onChange={(e) => setMeetingProviderInput(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-app outline-none">
                  {['Google Meet','Zoom','Microsoft Teams','Discord','Other'].map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted uppercase tracking-wider">Meeting URL</label>
                <input type="url" value={meetingLinkInput} onChange={(e) => setMeetingLinkInput(e.target.value)} placeholder="https://meet.google.com/…"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-app outline-none focus:border-indigo-500" />
              </div>
              <div className="flex gap-2">
                <button type="submit" className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-sm">Save Link</button>
                {group.meetingLink && (
                  <button type="button" onClick={handleRemoveMeetingLink} className="px-4 py-2.5 bg-red-50 dark:bg-red-950/30 text-red-500 rounded-xl font-bold text-sm hover:bg-red-100">Remove</button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Clear Chat Confirm Modal */}
      {showClearConfirm && (
        <div role="dialog" data-modal="true" className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-white dark:bg-[#22242a] border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center gap-3 text-red-500">
              <Trash2 size={24} />
              <h3 className="font-bold text-base text-app">Clear Chat?</h3>
            </div>
            <p className="text-sm text-muted">
              Are you sure you want to clear all messages in this group? This will delete the chat history for you.
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowClearConfirm(false)}
                className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-800 text-muted hover:text-app rounded-xl font-bold text-sm"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleClearChat}
                disabled={clearingChat}
                className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold text-sm disabled:opacity-50"
              >
                {clearingChat ? 'Clearing…' : 'Clear Chat'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Group Confirm Modal */}
      {showDeleteConfirm && (
        <div role="dialog" data-modal="true" className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-white dark:bg-[#22242a] border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center gap-3 text-red-500">
              <AlertTriangle size={24} />
              <h3 className="font-bold text-base">Delete Group?</h3>
            </div>
            <p className="text-sm text-muted">This will permanently delete <strong className="text-app">{group.name}</strong> and all its messages. This cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setShowDeleteConfirm(false)} className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-800 text-muted hover:text-app rounded-xl font-bold text-sm">Cancel</button>
              <button onClick={handleDeleteGroup} disabled={deletingGroup}
                className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold text-sm disabled:opacity-50">
                {deletingGroup ? 'Deleting…' : 'Delete Group'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Member Modal */}
      {showAddMemberModal && (
        <div role="dialog" data-modal="true" className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white dark:bg-[#22242a] border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800 shrink-0">
              <div>
                <h3 className="font-bold text-base text-app">Add Members</h3>
                <p className="text-xs text-muted">Search and directly add users to {group.name}</p>
              </div>
              <button onClick={() => setShowAddMemberModal(false)} className="p-1 rounded-lg text-muted hover:text-app hover:bg-slate-100 dark:hover:bg-slate-800">
                <X size={18} />
              </button>
            </div>

            {/* Real-time Search Input */}
            <div className="p-4 border-b border-slate-100 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-900/20 shrink-0">
              <div className="relative">
                <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
                <input
                  type="text"
                  placeholder="Search by name or username..."
                  value={userSearchQuery}
                  onChange={(e) => setUserSearchQuery(e.target.value)}
                  autoFocus
                  className="w-full pl-9 pr-8 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-app placeholder:text-muted outline-none focus:border-indigo-500 shadow-sm"
                />
                {searchingUsers && (
                  <Loader2 size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-indigo-500 animate-spin" />
                )}
              </div>
            </div>

            {/* User Results List */}
            <div className="flex-1 overflow-y-auto p-4 divide-y divide-slate-100 dark:divide-slate-800">
              {searchingUsers && searchedUsers.length === 0 ? (
                <div className="py-8 text-center text-xs text-muted flex items-center justify-center gap-2">
                  <Loader2 size={16} className="animate-spin text-indigo-500" /> Searching users…
                </div>
              ) : searchedUsers.length === 0 ? (
                <div className="py-8 text-center text-xs text-muted">
                  {userSearchQuery.trim() ? 'No users found matching your search.' : 'Type a name or username to search.'}
                </div>
              ) : (
                searchedUsers.map((u) => {
                  const isAdded = addedUserIds.has(u._id);
                  const isAdding = addingUserId === u._id;
                  const avatarUrl = u.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name)}&background=6366f1&color=fff`;

                  return (
                    <div key={u._id} className="py-2.5 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <img src={avatarUrl} alt={u.name} className="w-9 h-9 rounded-full object-cover shrink-0 border border-slate-200 dark:border-slate-700" />
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-app truncate">{u.name}</p>
                          <p className="text-[11px] text-muted truncate">@{u.username || 'user'}</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleAddMember(u)}
                        disabled={isAdded || isAdding}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shrink-0 ${
                          isAdded
                            ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                            : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm disabled:opacity-50'
                        }`}
                      >
                        {isAdding ? (
                          <>
                            <Loader2 size={12} className="animate-spin" /> Adding…
                          </>
                        ) : isAdded ? (
                          <>
                            <Check size={12} /> Added
                          </>
                        ) : (
                          <>
                            <UserPlus size={12} /> Add
                          </>
                        )}
                      </button>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer with invite link */}
            <div className="p-3.5 bg-slate-50 dark:bg-slate-900/40 border-t border-slate-200 dark:border-slate-800 shrink-0 flex items-center justify-between text-xs">
              <span className="text-muted text-[11px]">Or share invite link:</span>
              <button
                type="button"
                onClick={copyInviteLink}
                className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-app font-medium hover:bg-slate-100 dark:hover:bg-slate-700 text-xs flex items-center gap-1.5 transition-colors"
              >
                {copiedInviteLink ? <Check size={12} className="text-emerald-500" /> : <Link2 size={12} className="text-muted" />}
                {copiedInviteLink ? 'Link copied!' : 'Copy Group Link'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dynamic Confirmation Modal */}
      {confirmModal.isOpen && (
        <div role="dialog" data-modal="true" className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-white dark:bg-[#22242a] border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${confirmModal.isDanger ? 'bg-red-50 dark:bg-red-950/40 text-red-500' : 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400'}`}>
                {confirmModal.isDanger ? <AlertTriangle size={20} /> : <Shield size={20} />}
              </div>
              <h3 className="font-bold text-base text-app">{confirmModal.title}</h3>
            </div>
            <p className="text-sm text-muted leading-relaxed">{confirmModal.message}</p>
            <div className="flex gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => setConfirmModal({ ...confirmModal, isOpen: false })}
                className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-800 text-muted hover:text-app rounded-xl font-bold text-xs transition-colors"
              >
                {confirmModal.cancelText || 'Cancel'}
              </button>
              <button
                type="button"
                onClick={async () => {
                  if (confirmModal.action) {
                    await confirmModal.action();
                  }
                  setConfirmModal({ ...confirmModal, isOpen: false });
                }}
                className={`flex-1 py-2.5 rounded-xl font-bold text-xs text-white transition-all shadow-sm ${confirmModal.isDanger ? 'bg-red-500 hover:bg-red-600' : 'bg-indigo-600 hover:bg-indigo-500'}`}
              >
                {confirmModal.confirmText || 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 max-w-md w-auto px-4 py-3 rounded-2xl shadow-xl border bg-white dark:bg-[#1e2430] border-slate-200 dark:border-slate-700 flex items-center gap-3 animate-fade-in">
          <div className={`w-2 h-2 rounded-full ${toastMessage.type === 'error' ? 'bg-red-500' : toastMessage.type === 'success' ? 'bg-emerald-500' : 'bg-indigo-500'}`} />
          <span className="text-xs font-semibold text-app">{toastMessage.message}</span>
        </div>
      )}

    </div>
  );
};

export default GroupDetail;
