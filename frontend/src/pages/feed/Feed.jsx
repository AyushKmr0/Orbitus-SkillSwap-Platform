import React, { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import apiClient from '../../services/apiClient.js';
import {
  Globe,
  Heart,
  MessageCircle,
  MoreVertical,
  Pencil,
  Send,
  Share2,
  Trash2,
  UserRound,
  Users,
  X,
  UserPlus,
  UserCheck,
  Calendar,
  Sparkles,
  Award,
  BookOpen,
  ArrowRight,
  RefreshCw,
  Copy
} from 'lucide-react';
import { useSocket } from '../../context/SocketContext.jsx';
import { motion } from 'framer-motion';
import { TiltCard, ScrollReveal, Marquee, MorphingBlob } from '../../components/motion/index.js';

const MAX_POST_LENGTH = 2000;
const PREVIEW_LENGTH = 360;

const Feed = () => {
  const { user, token } = useSelector((state) => state.auth);
  const { sendMessage } = useSocket();

  const [posts, setPosts] = useState([]);
  const [content, setContent] = useState('');
  const [commentDrafts, setCommentDrafts] = useState({});
  const [loading, setLoading] = useState(true);
  const [openMenuId, setOpenMenuId] = useState('');
  const [postToDelete, setPostToDelete] = useState(null);
  const [editingPostId, setEditingPostId] = useState('');
  const [editContent, setEditContent] = useState('');
  const [sharePostTarget, setSharePostTarget] = useState(null);
  const [activeChats, setActiveChats] = useState([]);
  const [shareMessage, setShareMessage] = useState('');
  const [expandedPosts, setExpandedPosts] = useState({});
  const [feedScope, setFeedScope] = useState('all');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const sentinelRef = useRef(null);

  const [isComposerVisible, setIsComposerVisible] = useState(true);
  const [isComposerSticky, setIsComposerSticky] = useState(false);
  const [isComposerFocused, setIsComposerFocused] = useState(false);
  const [copiedPostId, setCopiedPostId] = useState('');
  const lastScrollY = useRef(0);
  const pageShellRef = useRef(null);
  const closeMenuTimerRef = useRef(null);

  const handleMenuMouseEnter = (id) => {
    if (closeMenuTimerRef.current) {
      clearTimeout(closeMenuTimerRef.current);
      closeMenuTimerRef.current = null;
    }
    setOpenMenuId(id);
  };

  const handleMenuMouseLeave = () => {
    if (closeMenuTimerRef.current) clearTimeout(closeMenuTimerRef.current);
    closeMenuTimerRef.current = setTimeout(() => {
      setOpenMenuId('');
    }, 200);
  };

  const handlePageScroll = (e) => {
    const currentScrollY = e.target.scrollTop;
    const delta = currentScrollY - lastScrollY.current;

    if (currentScrollY <= 80) {
      setIsComposerSticky(false);
      setIsComposerVisible(true);
    } else {
      setIsComposerSticky(true);

      if (isComposerFocused || content.trim().length > 0) {
        setIsComposerVisible(true);
      } else if (Math.abs(delta) > 6) {
        if (delta > 0 && currentScrollY > 120) {
          setIsComposerVisible(false);
        } else if (delta < 0) {
          setIsComposerVisible(true);
        }
      }
    }

    lastScrollY.current = currentScrollY;
  };

  // Freeze background scrolling when share modal is open
  useEffect(() => {
    if (sharePostTarget) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }
  }, [sharePostTarget]);

  // Sidebar Suggested Users & Groups State
  const [sidebarSuggestions, setSidebarSuggestions] = useState([]);
  const [sidebarGroups, setSidebarGroups] = useState([]);
  const [sidebarLoading, setSidebarLoading] = useState(true);

  // Fetch posts whenever feedScope or token changes
  useEffect(() => {
    fetchPosts();
  }, [token, feedScope]);

  // Fetch sidebar widgets & active chats once on load, and auto-refresh silently every 10 mins
  useEffect(() => {
    fetchActiveChats();
    fetchSidebarWidgets();

    const refreshInterval = setInterval(() => {
      fetchPosts(true);
      fetchSidebarWidgets(true);
    }, 10 * 60 * 1000);

    return () => clearInterval(refreshInterval);
  }, [token]);

  // Seamless infinite scroll observer: auto-fetches next 20 posts as user scrolls down
  useEffect(() => {
    if (!sentinelRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore && !loading) {
          loadMorePosts();
        }
      },
      { rootMargin: '350px' }
    );
    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [hasMore, loadingMore, loading, page, feedScope]);

  const fetchPosts = async (isBackground = false) => {
    if (!isBackground) setLoading(true);
    try {
      const res = await apiClient.get('/api/posts', {
        params: { scope: feedScope, limit: 20, page: 1 }
      });
      const data = res.data.posts || res.data.data?.posts || [];
      setPosts(data);
      setPage(1);
      setHasMore(data.length === 20);
    } catch (err) {
      console.error('Error fetching posts:', err);
    } finally {
      if (!isBackground) setLoading(false);
    }
  };

  const loadMorePosts = async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      const nextPage = page + 1;
      const res = await apiClient.get('/api/posts', {
        params: { scope: feedScope, limit: 20, page: nextPage }
      });
      const newPosts = res.data.posts || res.data.data?.posts || [];
      if (newPosts.length > 0) {
        setPosts((prev) => {
          const seen = new Set(prev.map((p) => p._id));
          const uniqueNew = newPosts.filter((p) => !seen.has(p._id));
          return [...prev, ...uniqueNew];
        });
        setPage(nextPage);
        setHasMore(newPosts.length === 20);
      } else {
        setHasMore(false);
      }
    } catch (err) {
      console.error('Error loading more posts:', err);
    } finally {
      setLoadingMore(false);
    }
  };

  const fetchSidebarWidgets = async (isBackground = false) => {
    if (!isBackground) setSidebarLoading(true);
    try {
      const [usersRes, groupsRes] = await Promise.allSettled([
        apiClient.get('/api/users/suggested', { params: { limit: 5 } }),
        apiClient.get('/api/groups', { params: { limit: 4 } })
      ]);

      if (usersRes.status === 'fulfilled') {
        const users = usersRes.value.data.users || [];
        // Auto-shuffle so order is fresh on every load
        setSidebarSuggestions([...users].sort(() => Math.random() - 0.5));
      }
      if (groupsRes.status === 'fulfilled') {
        const groups = groupsRes.value.data.groups || [];
        // Auto-shuffle study groups too
        setSidebarGroups([...groups].sort(() => Math.random() - 0.5));
      }
    } catch (err) {
      console.error('Sidebar fetch error:', err);
    } finally {
      if (!isBackground) setSidebarLoading(false);
    }
  };

  const createPost = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;

    try {
      const res = await apiClient.post('/api/posts', { content: content.trim() });
      setPosts((prev) => [res.data.post, ...prev]);
      setContent('');
    } catch (err) {
      console.error('Error creating post:', err);
    }
  };

  const fetchActiveChats = async () => {
    try {
      const res = await apiClient.get('/api/messages/active');
      setActiveChats(res.data.chats || []);
    } catch (err) {
      console.error('Error fetching share contacts:', err);
    }
  };

  const replacePost = (nextPost) => {
    setPosts((prev) => prev.map((post) => post._id === nextPost._id ? nextPost : post));
  };

  const likePost = async (postId) => {
    try {
      const res = await apiClient.put(`/api/posts/${postId}/like`, {});
      replacePost(res.data.post);
    } catch (err) {
      console.error('Error liking post:', err);
    }
  };

  const startEditPost = (post) => {
    setEditingPostId(post._id);
    setEditContent(post.content);
    setOpenMenuId('');
  };

  const savePostEdit = async (postId) => {
    if (!editContent.trim()) return;

    try {
      const res = await apiClient.put(`/api/posts/${postId}`, { content: editContent.trim() });
      replacePost(res.data.post);
      setEditingPostId('');
      setEditContent('');
    } catch (err) {
      console.error('Error editing post:', err);
      const msg = err.response?.data?.message || 'Posts can only be edited within 15 minutes of posting.';
      alert(msg);
    }
  };

  const handleDeleteClick = (postId) => {
    setOpenMenuId('');
    setPostToDelete(postId);
  };

  const confirmDeletePost = async () => {
    if (!postToDelete) return;
    try {
      await apiClient.delete(`/api/posts/${postToDelete}`);
      setPosts((prev) => prev.filter((post) => post._id !== postToDelete));
    } catch (err) {
      console.error('Error deleting post:', err);
    } finally {
      setPostToDelete(null);
    }
  };

  const toggleSidebarFollow = async (targetUserId) => {
    try {
      const res = await apiClient.post(`/api/users/${targetUserId}/follow`);
      const isNowFollowing = res.data.following;

      setSidebarSuggestions((prev) =>
        prev.map((u) => (u._id === targetUserId ? { ...u, isFollowing: isNowFollowing } : u))
      );
    } catch (err) {
      console.error('Sidebar follow error:', err);
    }
  };

  const sharePostToChat = (partnerId) => {
    if (!sharePostTarget) return;

    const authorName = sharePostTarget.author?.name || 'Orbitus Member';
    const postUrl = sharePostTarget.author?._id ? `${window.location.origin}/profile/${sharePostTarget.author._id}` : window.location.origin;
    const payload = `Shared post by ${authorName}:\n"${(sharePostTarget.content || '').slice(0, 160)}..."\n${postUrl}`;
    sendMessage(payload, partnerId, '', 'none', null);
    setShareMessage('Post shared to chat successfully!');
    setTimeout(() => {
      setShareMessage('');
      setSharePostTarget(null);
    }, 1500);
  };

  const addComment = async (postId) => {
    const draft = commentDrafts[postId]?.trim();
    if (!draft) return;

    try {
      const res = await apiClient.post(`/api/posts/${postId}/comments`, { content: draft });
      replacePost(res.data.post);
      setCommentDrafts((prev) => ({ ...prev, [postId]: '' }));
    } catch (err) {
      console.error('Error adding comment:', err);
    }
  };

  const userProfileLink = user?._id ? `/profile/${user._id}` : '#';
  const userName = user?.name || 'Member';
  const userAvatar = user?.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=6366f1&color=fff`;

  return (
    <div ref={pageShellRef} onScroll={handlePageScroll} className="page-shell space-y-5 sm:space-y-6 overflow-y-auto relative">
      {/* Ambient Morphing Blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <MorphingBlob size={320} color="rgba(59, 130, 246, 0.06)" className="-top-20 -left-16" />
        <MorphingBlob size={280} color="rgba(168, 85, 247, 0.05)" className="top-64 -right-16" />
      </div>

      {/* Infinite Seamless Marquee of Trending Topics & Skills */}
      <div className="max-w-7xl mx-auto pt-1 sm:pt-0">
        <Marquee speed={32} className="py-2 sm:py-2.5 px-3 sm:px-4 rounded-2xl bg-white dark:bg-[#22242a] border border-slate-200 dark:border-slate-800 text-[11px] sm:text-xs shadow-sm">
          <span className="flex items-center gap-1.5 font-bold text-blue-600 dark:text-blue-400 shrink-0">
            <Sparkles size={14} /> Trending Swaps:
          </span>
          <span className="text-muted-strong font-medium">• System Design & Architecture</span>
          <span className="text-muted-strong font-medium">• Next.js 14 App Router</span>
          <span className="text-muted-strong font-medium">• Python Data Analytics</span>
          <span className="text-muted-strong font-medium">• Machine Learning & LLMs</span>
          <span className="text-muted-strong font-medium">• Spanish & French Speaking</span>
          <span className="text-muted-strong font-medium">• Figma & UI/UX Systems</span>
          <span className="text-muted-strong font-medium">• Docker & Cloud DevOps</span>
        </Marquee>
      </div>
      {/* 3-Column Responsive Layout */}
      <div className="max-w-7xl mx-auto flex items-start gap-6">
        {/* Left Column: Quick Profile Card (Desktop only) */}
        <aside className="hidden xl:block w-72 shrink-0 space-y-4 sticky top-6">
          {/* User profile mini-card */}
          <div className="bg-white dark:bg-[#22242a] border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-4">
            <div className="flex items-center gap-3">
              <Link to={userProfileLink} className="hover:scale-105 transition-transform shrink-0">
                <img
                  src={userAvatar}
                  alt={userName}
                  className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 object-cover border border-slate-200 dark:border-slate-700"
                />
              </Link>
              <div className="min-w-0">
                <Link
                  to={userProfileLink}
                  className="font-bold text-sm text-app hover:text-blue-600 dark:hover:text-blue-400 truncate block"
                >
                  {userName}
                </Link>
                <p className="text-xs text-muted truncate">@{user?.username || 'user'}</p>
                <p className="text-[11px] text-muted truncate mt-0.5">
                  {user?.experienceLevel || 'Learner'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-200 dark:border-slate-800 text-center">
              <div className="p-2 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800">
                <span className="text-xs font-extrabold text-app block">{user?.points || 0}</span>
                <span className="text-[10px] text-muted uppercase font-semibold">Points</span>
              </div>
              <div className="p-2 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800">
                <span className="text-xs font-extrabold text-app block">{user?.followingCount || 0}</span>
                <span className="text-[10px] text-muted uppercase font-semibold">Following</span>
              </div>
            </div>

            <div className="space-y-1.5 pt-2 border-t border-slate-200 dark:border-slate-800 text-xs font-medium">
              <Link
                to="/bookings"
                className="flex items-center justify-between p-2 rounded-xl text-muted hover:text-app hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors"
              >
                <span className="flex items-center gap-2">
                  <Calendar size={14} className="text-blue-500" /> My Bookings
                </span>
                <ArrowRight size={12} className="text-muted" />
              </Link>
              <Link
                to="/groups"
                className="flex items-center justify-between p-2 rounded-xl text-muted hover:text-app hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors"
              >
                <span className="flex items-center gap-2">
                  <Users size={14} className="text-purple-500" /> Study Groups
                </span>
                <ArrowRight size={12} className="text-muted" />
              </Link>
              <Link
                to="/suggested-users"
                className="flex items-center justify-between p-2 rounded-xl text-muted hover:text-app hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors"
              >
                <span className="flex items-center gap-2">
                  <Sparkles size={14} className="text-amber-500" /> Suggested Peers
                </span>
                <ArrowRight size={12} className="text-muted" />
              </Link>
            </div>
          </div>

          {/* Quick learning tip */}
          <div className="bg-blue-50/60 dark:bg-indigo-950/20 border border-blue-100 dark:border-indigo-900/40 rounded-3xl p-4 text-xs space-y-2">
            <div className="flex items-center gap-2 text-blue-600 dark:text-indigo-400 font-bold">
              <Award size={15} />
              <span>Skill Exchange Tip</span>
            </div>
            <p className="text-muted leading-relaxed text-[11px]">
              Teach a peer for 60+ minutes to earn +50 points and unlock verified skill certificates!
            </p>
          </div>
        </aside>

        {/* Center Column: Feed Stream */}
        <main className="flex-1 max-w-2xl min-w-0 space-y-4">
          {/* Feed Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white dark:bg-[#22242a] border border-slate-200 dark:border-slate-800 p-4 rounded-3xl shadow-sm">
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-app">Learning Feed</h1>
              <p className="text-xs text-muted">Share progress, questions, and insights</p>
            </div>

            {/* Full-width sliding segmented pill */}
            <div className="relative flex items-center p-1 bg-slate-100 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-2xl w-full sm:w-64">
              {/* Sliding Blue Pill Background */}
              <div
                className={`absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-xl bg-blue-600 shadow-md transition-all duration-300 ease-out ${
                  feedScope === 'all' ? 'left-1' : 'left-[calc(50%+2px)]'
                }`}
              />

              <button
                type="button"
                onClick={() => setFeedScope('all')}
                className={`relative z-10 flex-1 py-2 text-xs font-bold transition-colors duration-200 flex items-center justify-center gap-1.5 rounded-xl ${
                  feedScope === 'all' ? 'text-white' : 'text-muted hover:text-app'
                }`}
              >
                <Globe size={13} /> All
              </button>
              <button
                type="button"
                onClick={() => setFeedScope('following')}
                className={`relative z-10 flex-1 py-2 text-xs font-bold transition-colors duration-200 flex items-center justify-center gap-1.5 rounded-xl ${
                  feedScope === 'following' ? 'text-white' : 'text-muted hover:text-app'
                }`}
              >
                <Users size={13} /> Following
              </button>
            </div>
          </div>

          {/* Post Composer with Natural Smooth Reveal */}
          <div
            className={`transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
              isComposerSticky
                ? 'sticky top-1 sm:top-2 z-20'
                : 'relative z-10'
            } ${
              isComposerVisible
                ? 'translate-y-0 opacity-100 shadow-xl'
                : '-translate-y-24 opacity-0 pointer-events-none shadow-none'
            }`}
          >
            <form
              onSubmit={createPost}
              className="bg-white dark:bg-[#22242a] border border-slate-200 dark:border-slate-800 rounded-3xl p-3.5 sm:p-5 space-y-3 shadow-sm"
            >
              <div className="flex gap-2.5 sm:gap-3">
                <Link to={userProfileLink} className="shrink-0">
                  <img
                    src={userAvatar}
                    alt={userName}
                    className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-slate-100 dark:bg-slate-800 object-cover border border-slate-200 dark:border-slate-700"
                  />
                </Link>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  onFocus={() => setIsComposerFocused(true)}
                  onBlur={() => setIsComposerFocused(false)}
                  maxLength={MAX_POST_LENGTH}
                  rows={isComposerSticky ? 2 : 3}
                  placeholder="What did you learn today? Ask a question or share a breakthrough..."
                  className="w-full bg-slate-50 dark:bg-[#12161f] border border-slate-200 dark:border-slate-800 rounded-2xl p-2.5 sm:p-3 text-xs sm:text-sm text-app placeholder:text-muted outline-none focus:border-blue-500 resize-none transition-all"
                />
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-800">
                <span className={`text-[10px] sm:text-[11px] font-mono ${content.length > MAX_POST_LENGTH - 80 ? 'text-amber-500' : 'text-muted'}`}>
                  {content.length}/{MAX_POST_LENGTH}
                </span>
                <button
                  type="submit"
                  disabled={!content.trim()}
                  className="btn-primary text-xs px-3.5 py-1.5 sm:px-4 sm:py-2"
                >
                  <Send size={13} />
                  <span>Post Update</span>
                </button>
              </div>
            </form>
          </div>

          {/* Posts List */}
          {loading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-44 rounded-3xl bg-slate-100 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 animate-pulse" />
              ))}
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-16 border border-dashed border-slate-200 dark:border-slate-800 rounded-3xl p-8 space-y-2 bg-white/50 dark:bg-[#22242a]/50">
              <BookOpen size={32} className="mx-auto text-muted" />
              <p className="text-sm font-semibold text-app">No posts in this feed yet.</p>
              <p className="text-xs text-muted">Be the first to share an update!</p>
            </div>
          ) : (
            posts.map((post, idx) => {
              const postAuthor = post.author || {
                _id: '',
                name: 'Orbitus Member',
                username: 'member',
                profileImage: `https://ui-avatars.com/api/?name=Orbitus+Member&background=6366f1&color=fff`
              };
              const authorProfileUrl = postAuthor._id ? `/profile/${postAuthor._id}` : (postAuthor.username ? `/profile/${postAuthor.username}` : '#');
              const currentUserId = user?._id?.toString();
              const liked = post.likes?.some((id) => (id?._id || id)?.toString() === currentUserId);
              const isExpanded = Boolean(expandedPosts[post._id]);
              const shouldClamp = (post.content || '').length > PREVIEW_LENGTH;
              const displayContent = shouldClamp && !isExpanded
                ? `${post.content.slice(0, PREVIEW_LENGTH).trim()}...`
                : post.content;
              const isMyPost = postAuthor._id && currentUserId && postAuthor._id.toString() === currentUserId;

              return (
                <article
                  key={post._id}
                  className="bg-white dark:bg-[#22242a] border border-slate-200 dark:border-slate-800 rounded-3xl p-5 space-y-4 hover:border-slate-300 dark:hover:border-slate-700 shadow-sm"
                >
                  {/* Author Header (Clickable profile with @username) */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <Link to={authorProfileUrl} className="hover:scale-105 transition-transform shrink-0">
                        <img
                          src={postAuthor.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(postAuthor.name || 'User')}&background=6366f1&color=fff`}
                          alt={postAuthor.name}
                          className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 object-cover border border-slate-200 dark:border-slate-700"
                        />
                      </Link>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <Link
                            to={authorProfileUrl}
                            className="text-sm font-bold text-app hover:text-blue-600 dark:hover:text-blue-400 truncate"
                          >
                            {postAuthor.name}
                          </Link>
                          <span className="text-[11px] text-muted font-mono">
                            @{postAuthor.username || 'user'}
                          </span>
                        </div>
                        <p className="text-[10px] text-muted">
                          {new Date(post.createdAt).toLocaleDateString([], {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>

                    {/* 3-Dots Action Menu (Active on hover with 1s close delay, no rotation) */}
                    <div
                      className="relative"
                      onMouseEnter={() => handleMenuMouseEnter(post._id)}
                      onMouseLeave={handleMenuMouseLeave}
                    >
                      <button
                        type="button"
                        onClick={() => {
                          if (closeMenuTimerRef.current) clearTimeout(closeMenuTimerRef.current);
                          setOpenMenuId(openMenuId === post._id ? '' : post._id);
                        }}
                        className={`group/dots p-1.5 rounded-xl transition-all duration-200 active:scale-95 ${
                          openMenuId === post._id
                            ? 'text-blue-600 dark:text-blue-400 bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200/50 dark:border-blue-900/40 shadow-sm'
                            : 'text-muted hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50/80 dark:hover:bg-blue-950/40 border border-transparent hover:border-blue-200/50 dark:hover:border-blue-900/40'
                        }`}
                        title="Post options"
                      >
                        <MoreVertical
                          size={16}
                          className="transition-transform duration-200 group-hover/dots:scale-110"
                        />
                      </button>

                      {openMenuId === post._id && (
                        <div
                          className="absolute right-0 top-8 z-20 w-36 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#22242a] p-1.5 text-xs shadow-2xl animate-in fade-in zoom-in-95 duration-150"
                          onMouseEnter={() => handleMenuMouseEnter(post._id)}
                          onMouseLeave={handleMenuMouseLeave}
                        >
                          {isMyPost && (
                            <>
                              {(Date.now() - new Date(post.createdAt).getTime() <= 15 * 60 * 1000) && (
                                <button
                                  type="button"
                                  onClick={() => startEditPost(post)}
                                  className="flex w-full items-center gap-2 rounded-xl px-2.5 py-1.5 text-left text-app hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                >
                                  <Pencil size={13} /> Edit
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => handleDeleteClick(post._id)}
                                className="flex w-full items-center gap-2 rounded-xl px-2.5 py-1.5 text-left text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                              >
                                <Trash2 size={13} /> Delete
                              </button>
                            </>
                          )}
                          <button
                            type="button"
                            onClick={() => {
                              const shareUrl = `${window.location.origin}/feed#post-${post._id}`;
                              navigator.clipboard.writeText(shareUrl);
                              setCopiedPostId(post._id);
                              setTimeout(() => setCopiedPostId(''), 2000);
                              setOpenMenuId('');
                            }}
                            className="flex w-full items-center gap-2 rounded-xl px-2.5 py-1.5 text-left text-app hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          >
                            <Copy size={13} /> {copiedPostId === post._id ? 'Copied Link!' : 'Copy Link'}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setSharePostTarget(post);
                              setOpenMenuId('');
                            }}
                            className="flex w-full items-center gap-2 rounded-xl px-2.5 py-1.5 text-left text-app hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          >
                            <Share2 size={13} /> Share Post
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Post Content */}
                  {editingPostId === post._id ? (
                    <div className="space-y-2">
                      <textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        rows={3}
                        className="w-full bg-slate-50 dark:bg-[#12161f] border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-xs text-app outline-none focus:border-blue-500"
                      />
                      <div className="flex gap-2 justify-end">
                        <button
                          type="button"
                          onClick={() => setEditingPostId('')}
                          className="btn-secondary text-xs px-3 py-1.5"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => savePostEdit(post._id)}
                          className="btn-primary text-xs px-3 py-1.5"
                        >
                          Save
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <p className="text-xs sm:text-sm text-app leading-relaxed whitespace-pre-wrap">
                        {displayContent}
                      </p>
                      {shouldClamp && (
                        <button
                          type="button"
                          onClick={() =>
                            setExpandedPosts((prev) => ({
                              ...prev,
                              [post._id]: !isExpanded
                            }))
                          }
                          className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline mt-1"
                        >
                          {isExpanded ? 'Show less' : 'Read more'}
                        </button>
                      )}
                    </div>
                  )}

                  {/* Actions Row */}
                  <div className="flex items-center gap-4 pt-2 border-t border-slate-100 dark:border-slate-800/80 text-xs">
                    <button
                      type="button"
                      onClick={() => likePost(post._id)}
                      className={`flex items-center gap-1.5 transition-colors ${
                        liked ? 'text-red-500 font-bold' : 'text-muted hover:text-app'
                      }`}
                    >
                      <Heart size={15} fill={liked ? 'currentColor' : 'none'} />
                      <span>{post.likes?.length || 0}</span>
                    </button>

                    <button
                      type="button"
                      className="flex items-center gap-1.5 text-muted hover:text-app transition-colors"
                    >
                      <MessageCircle size={15} />
                      <span>{post.comments?.length || 0}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSharePostTarget(post)}
                      className="flex items-center gap-1.5 text-muted hover:text-app transition-colors ml-auto"
                    >
                      <Share2 size={15} />
                      <span>Share</span>
                    </button>
                  </div>

                  {/* Comments Section */}
                  <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800/40">
                    {(post.comments || []).slice(-3).map((comment, index) => {
                      const cAuthor = comment.author || comment.user || {
                        _id: '',
                        name: 'Member',
                        profileImage: ''
                      };
                      const cProfileUrl = cAuthor._id ? `/profile/${cAuthor._id}` : (cAuthor.username ? `/profile/${cAuthor.username}` : '#');

                      return (
                        <div key={index} className="flex items-start gap-2.5 text-xs bg-slate-50 dark:bg-slate-900/40 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800/60">
                          <Link to={cProfileUrl} className="shrink-0 mt-0.5 hover:scale-105 transition-transform" title={`View ${cAuthor.name}'s profile`}>
                            <img
                              src={cAuthor.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(cAuthor.name || 'User')}&background=6366f1&color=fff`}
                              alt={cAuthor.name}
                              className="w-6 h-6 rounded-full object-cover bg-slate-200 dark:bg-slate-700 border border-slate-200 dark:border-slate-700"
                            />
                          </Link>
                          <div className="min-w-0 flex-1">
                            <Link to={cProfileUrl} className="font-bold text-app hover:text-blue-600 dark:hover:text-blue-400 mr-1.5 inline-block">
                              {cAuthor.name || 'User'}:
                            </Link>
                            <span className="text-muted-strong leading-snug break-words">{comment.content}</span>
                          </div>
                        </div>
                      );
                    })}

                    {/* Add Comment Input */}
                    <div className="flex gap-2 pt-1">
                      <input
                        type="text"
                        placeholder="Write a comment..."
                        value={commentDrafts[post._id] || ''}
                        onChange={(e) =>
                          setCommentDrafts((prev) => ({
                            ...prev,
                            [post._id]: e.target.value
                          }))
                        }
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            addComment(post._id);
                          }
                        }}
                        className="flex-1 bg-slate-50 dark:bg-[#12161f] border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5 text-xs text-app placeholder:text-muted outline-none focus:border-blue-500"
                      />
                      <button
                        type="button"
                        onClick={() => addComment(post._id)}
                        className="btn-secondary text-xs px-3 py-1.5"
                      >
                        Reply
                      </button>
                    </div>
                  </div>
                </article>
              );
            })
          )}
          {/* Invisible sentinel for seamless infinite scroll */}
          <div ref={sentinelRef} className="h-6 w-full pointer-events-none opacity-0" />
        </main>

        {/* Right Column: Suggested Users & Study Groups Widget (Desktop only) */}
        <aside className="hidden lg:block w-80 shrink-0 space-y-5 sticky top-6">
          {/* Suggested Peers Card */}
          <div className="bg-white dark:bg-[#22242a] border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles size={16} className="text-blue-500" />
                <h3 className="font-bold text-sm text-app">Suggested Peers</h3>
              </div>
            </div>

            {sidebarLoading ? (
              <div className="space-y-3">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-12 rounded-xl bg-slate-100 dark:bg-slate-800/50 animate-pulse" />
                ))}
              </div>
            ) : sidebarSuggestions.length === 0 ? (
              <p className="text-xs text-muted">No new peer suggestions right now.</p>
            ) : (
              <div className="space-y-3">
                {sidebarSuggestions.map((peer) => {
                  const peerProfileUrl = peer._id ? `/profile/${peer._id}` : '#';

                  return (
                    <div key={peer._id} className="flex items-center justify-between gap-2.5">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Link to={peerProfileUrl} className="shrink-0 hover:scale-105 transition-transform">
                          <img
                            src={peer.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(peer.name || 'User')}&background=6366f1&color=fff`}
                            alt={peer.name}
                            className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 object-cover border border-slate-200 dark:border-slate-700"
                          />
                        </Link>
                        <div className="min-w-0">
                          <Link
                            to={peerProfileUrl}
                            className="text-xs font-bold text-app hover:text-blue-600 dark:hover:text-blue-400 truncate block leading-snug"
                          >
                            {peer.name}
                          </Link>
                          <p className="text-[10px] text-muted truncate">@{peer.username || 'user'}</p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => toggleSidebarFollow(peer._id)}
                        className={`w-20 py-1 rounded-lg text-[10px] font-bold transition-all shrink-0 flex items-center justify-center text-center ${
                          peer.isFollowing
                            ? 'btn-secondary text-[10px]'
                            : 'btn-primary text-[10px]'
                        }`}
                      >
                        {peer.isFollowing ? 'Following' : 'Follow'}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            <Link
              to="/suggested-users"
              className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-800"
            >
              <span>See more suggestions</span>
              <ArrowRight size={13} />
            </Link>
          </div>

          {/* Active Study Groups Card */}
          <div className="bg-white dark:bg-[#22242a] border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users size={16} className="text-purple-500" />
                <h3 className="font-bold text-sm text-app">Study Groups</h3>
              </div>
              <Link to="/groups" className="text-[11px] font-semibold text-purple-600 dark:text-purple-400 hover:underline">
                Explore All
              </Link>
            </div>

            {sidebarGroups.length === 0 ? (
              <p className="text-xs text-muted">No public groups created yet. Create one!</p>
            ) : (
              <div className="space-y-3">
                {sidebarGroups.map((group) => (
                  <Link
                    key={group._id}
                    to={`/groups/${group._id}`}
                    className="flex items-center justify-between p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 transition-all group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      {group.image ? (
                        <img
                          src={group.image}
                          alt={group.name}
                          className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-600 to-violet-500 text-white font-bold text-xs flex items-center justify-center border border-indigo-400/20 shrink-0 uppercase select-none">
                          {group.name?.trim()?.[0]?.toUpperCase() || 'G'}
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-app group-hover:text-purple-600 dark:group-hover:text-purple-400 truncate">
                          {group.name}
                        </p>
                        <p className="text-[10px] text-muted">
                          {group.membersCount || 0} members • {group.privacy}
                        </p>
                      </div>
                    </div>
                    <ArrowRight size={12} className="text-muted group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                ))}
              </div>
            )}
          </div>
        </aside>
      </div>

      {/* Share Post to Chat Modal */}
      {sharePostTarget &&
        createPortal(
          <div
            role="dialog"
            data-modal="true"
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 overscroll-contain animate-fade-in"
            onClick={(e) => {
              if (e.target === e.currentTarget) setSharePostTarget(null);
            }}
          >
            <div
              className="w-full max-w-sm bg-white dark:bg-[#22242a] p-6 rounded-3xl space-y-4 border border-slate-200 dark:border-slate-800 shadow-2xl animate-modal-enter"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-3">
                <h3 className="font-bold text-app text-sm">Send to Chat</h3>
                <button
                  type="button"
                  onClick={() => setSharePostTarget(null)}
                  className="text-muted hover:text-app p-1 rounded-lg"
                >
                  <X size={18} />
                </button>
              </div>

              {shareMessage && (
                <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 p-2.5 rounded-xl border border-emerald-200 dark:border-emerald-500/20">
                  {shareMessage}
                </p>
              )}

              <div className="space-y-2 max-h-60 overflow-y-auto">
                {activeChats.length === 0 ? (
                  <p className="text-xs text-muted text-center py-6">No recent chats available.</p>
                ) : (
                  activeChats.map((chat) => (
                    <button
                      key={chat.chatRoomId}
                      type="button"
                      onClick={() => sharePostToChat(chat.partner._id)}
                      className="w-full flex items-center justify-between p-2.5 rounded-2xl bg-slate-50 dark:bg-[#12161f] hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        <img
                          src={chat.partner.profileImage}
                          alt={chat.partner.name}
                          className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 object-cover"
                        />
                        <span className="text-xs font-bold text-app">{chat.partner.name}</span>
                      </div>
                      <Send size={13} className="text-blue-500" />
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* Custom Delete Post Confirmation Modal */}
      {postToDelete && (
        <div
          role="dialog"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
          onClick={() => setPostToDelete(null)}
        >
          <div
            className="w-full max-w-sm bg-white dark:bg-[#161b22] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl text-app space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold font-outfit text-app flex items-center gap-2">
                <Trash2 size={20} className="text-red-500" /> Delete Post?
              </h3>
              <button
                type="button"
                onClick={() => setPostToDelete(null)}
                className="text-slate-400 hover:text-app p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Are you sure you want to delete this post? This action will permanently remove it from the platform feed and your profile.
            </p>
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setPostToDelete(null)}
                className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-app font-bold text-xs rounded-xl transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeletePost}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-md transition-all"
              >
                Delete Post
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Feed;
