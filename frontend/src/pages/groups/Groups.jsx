import React, { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../services/apiClient.js';
import {
  Users,
  Plus,
  Search,
  Lock,
  Globe,
  Video,
  ArrowRight,
  Shield,
  CheckCircle,
  X,
  Compass,
  Sparkles,
  BookOpen,
  ArrowLeft,
  Upload,
  Camera,
  Loader2,
  RefreshCw
} from 'lucide-react';

const CATEGORIES = [
  'All',
  'Programming & Tech',
  'Languages & Speaking',
  'Design & Creative Arts',
  'Business & Marketing',
  'Music & Instruments',
  'Science & Academics',
  'Health & Lifestyle',
  'General Learning'
];

const Groups = () => {
  const { user, token } = useSelector((state) => state.auth);
  const navigate = useNavigate();

  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [filterTab, setFilterTab] = useState('all'); // 'all', 'joined', 'admin'
  const [msg, setMsg] = useState('');
  const [isFading, setIsFading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const sentinelRef = useRef(null);

  // Create Group Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDesc, setNewGroupDesc] = useState('');
  const [newGroupImage, setNewGroupImage] = useState('');
  const [newGroupPrivacy, setNewGroupPrivacy] = useState('public');
  const [newGroupCategory, setNewGroupCategory] = useState('Programming & Tech');
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef(null);
  const [newGroupTags, setNewGroupTags] = useState('');
  const [createSubmitting, setCreateSubmitting] = useState(false);

  useEffect(() => {
    fetchGroups();

    // Cyclic smooth refresh: every 10 minutes, silently refreshes from 1st page
    const interval = setInterval(() => {
      fetchGroups(true);
    }, 10 * 60 * 1000);

    return () => clearInterval(interval);
  }, [token, selectedCategory, filterTab]);

  // Seamless infinite scroll observer: auto-fetches next 20 groups as user scrolls down
  useEffect(() => {
    if (!sentinelRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore && !loading) {
          loadMoreGroups();
        }
      },
      { rootMargin: '300px' }
    );
    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [hasMore, loadingMore, loading, page, selectedCategory, filterTab, searchQuery]);

  useEffect(() => {
    if (showCreateModal) {
      const originalBodyOverflow = document.body.style.overflow;
      const originalHtmlOverflow = document.documentElement.style.overflow;
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';

      const pageShell = document.querySelector('.page-shell');
      const originalShellOverflow = pageShell ? pageShell.style.overflow : '';
      if (pageShell) pageShell.style.overflow = 'hidden';

      return () => {
        document.body.style.overflow = originalBodyOverflow;
        document.documentElement.style.overflow = originalHtmlOverflow;
        if (pageShell) pageShell.style.overflow = originalShellOverflow;
      };
    }
  }, [showCreateModal]);

  const fetchGroups = async (isBackground = false) => {
    if (!isBackground) setLoading(true);
    try {
      const res = await apiClient.get('/api/groups', {
        params: {
          category: selectedCategory,
          filter: filterTab,
          search: searchQuery,
          limit: 20,
          page: 1
        }
      });
      const data = res.data.groups || res.data.data?.groups || [];
      // Auto-shuffle on every fetch so the order is fresh each time
      const shuffled = [...data].sort(() => Math.random() - 0.5);
      setGroups(shuffled);
      setPage(1);
      setHasMore(data.length === 20);
    } catch (err) {
      console.error('Fetch groups error:', err);
    } finally {
      if (!isBackground) setLoading(false);
    }
  };


  const loadMoreGroups = async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      const nextPage = page + 1;
      const res = await apiClient.get('/api/groups', {
        params: {
          category: selectedCategory,
          filter: filterTab,
          search: searchQuery,
          limit: 20,
          page: nextPage
        }
      });
      const newGroups = res.data.groups || res.data.data?.groups || [];
      if (newGroups.length > 0) {
        setGroups((prev) => {
          const seen = new Set(prev.map((g) => g._id));
          const uniqueNew = newGroups.filter((g) => !seen.has(g._id));
          return [...prev, ...uniqueNew];
        });
        setPage(nextPage);
        setHasMore(newGroups.length === 20);
      } else {
        setHasMore(false);
      }
    } catch (err) {
      console.error('Error loading more groups:', err);
    } finally {
      setLoadingMore(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchGroups();
  };

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    if (!newGroupName.trim()) {
      alert('Please enter a group name');
      return;
    }

    setCreateSubmitting(true);
    try {
      const tagsArray = newGroupTags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      const res = await apiClient.post('/api/groups', {
        name: newGroupName.trim(),
        description: newGroupDesc.trim(),
        image: newGroupImage.trim() || undefined,
        privacy: newGroupPrivacy,
        category: newGroupCategory,
        tags: tagsArray
      });

      setShowCreateModal(false);
      setNewGroupName('');
      setNewGroupDesc('');
      setNewGroupImage('');
      setNewGroupTags('');
      setMsg('Group created successfully!');
      setTimeout(() => setMsg(''), 3500);

      navigate(`/groups/${res.data.group._id}`);
    } catch (err) {
      console.error('Create group error:', err);
      alert(err.response?.data?.message || 'Could not create group.');
    } finally {
      setCreateSubmitting(false);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploadingImage(true);
      const formData = new FormData();
      formData.append('file', file);
      const res = await apiClient.post('/api/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res.data?.url) {
        setNewGroupImage(res.data.url);
      }
    } catch (err) {
      console.error('Group image upload error:', err);
      alert('Failed to upload image. Please try again or use an image URL.');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleJoinGroup = async (e, groupId, privacy) => {
    e.stopPropagation();
    try {
      const res = await apiClient.post(`/api/groups/${groupId}/join`);
      setMsg(res.data.message);
      setTimeout(() => setMsg(''), 3500);

      setGroups((prev) =>
        prev.map((g) =>
          g._id === groupId
            ? {
                ...g,
                isMember: res.data.isMember,
                isPending: res.data.isPending,
                membersCount: res.data.isMember ? g.membersCount + 1 : g.membersCount
              }
            : g
        )
      );

      if (res.data.isMember) {
        navigate(`/groups/${groupId}`);
      }
    } catch (err) {
      console.error('Join group error:', err);
      alert(err.response?.data?.message || 'Could not join group.');
    }
  };

  return (
    <div className="page-shell flex-1 p-4 sm:p-6 lg:p-8 pb-32 sm:pb-20 space-y-6 min-h-screen text-app overflow-y-auto animate-fade-in">
      {/* Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-[#22242a] p-5 sm:p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-start gap-3.5">
          <div className="p-2.5 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 rounded-2xl shrink-0 mt-0.5">
            <Users size={22} />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-app font-outfit tracking-tight">
              Study & Practice Groups
            </h1>
            <p className="text-xs sm:text-sm text-muted mt-1">
              Join or start community study rooms to practice skills together, chat in real-time, and share video study calls.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-stretch sm:self-auto justify-end flex-wrap">
          <button
            type="button"
            onClick={() => fetchGroups()}
            disabled={loading || isFading}
            className="p-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-muted hover:text-app rounded-2xl border border-slate-200 dark:border-slate-700 transition-colors"
            title="Refresh groups"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          </button>
          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 !bg-white dark:!bg-slate-800 hover:!bg-slate-50 dark:hover:!bg-slate-700/80 !text-slate-900 dark:!text-white border border-slate-200 dark:border-slate-700 text-xs font-bold rounded-2xl transition-all shadow-sm hover:shadow active:scale-95 shrink-0"
          >
            <Plus size={16} className="text-indigo-600 dark:text-indigo-400" />
            <span>Create Group</span>
          </button>
        </div>
      </div>

      {msg && (
        <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-xs font-semibold rounded-2xl flex items-center gap-2 animate-fade-in">
          <CheckCircle size={15} />
          <span>{msg}</span>
        </div>
      )}

      {/* Search and Tabs */}
      <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-3">
        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3.5 top-3 text-muted" />
          <input
            type="text"
            placeholder="Search groups by topic, skill, or tag..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-[#22242a] border border-slate-200 dark:border-slate-800 rounded-2xl text-xs sm:text-sm text-app placeholder:text-muted outline-none focus:border-indigo-500 transition-colors shadow-sm"
          />
        </form>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl self-start md:self-auto shadow-sm">
          <button
            onClick={() => setFilterTab('all')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-xl transition-all ${
              filterTab === 'all'
                ? 'bg-indigo-600 text-white shadow'
                : 'text-muted hover:text-app'
            }`}
          >
            All Groups
          </button>
          <button
            onClick={() => setFilterTab('joined')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-xl transition-all ${
              filterTab === 'joined'
                ? 'bg-indigo-600 text-white shadow'
                : 'text-muted hover:text-app'
            }`}
          >
            My Groups
          </button>
          <button
            onClick={() => setFilterTab('admin')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-xl transition-all ${
              filterTab === 'admin'
                ? 'bg-indigo-600 text-white shadow'
                : 'text-muted hover:text-app'
            }`}
          >
            Groups I Manage
          </button>
        </div>
      </div>

      {/* Category Pills Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-medium shrink-0 transition-all interactive-pill ${
              selectedCategory === cat
                ? 'bg-indigo-600 text-white font-bold shadow-sm'
                : 'bg-white dark:bg-[#22242a] border border-slate-200 dark:border-slate-800 text-muted hover:text-app hover:border-slate-300 dark:hover:border-slate-700'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Groups Grid */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-2.5 sm:gap-4 py-8">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-56 sm:h-60 rounded-2xl sm:rounded-3xl bg-slate-100 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 animate-pulse" />
          ))}
        </div>
      ) : groups.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-[#22242a]/50 rounded-3xl p-8 space-y-3">
          <Compass size={36} className="mx-auto text-muted" />
          <p className="text-sm font-semibold text-muted">No study groups found in this category.</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="text-xs text-indigo-600 dark:text-indigo-400 font-bold hover:underline"
          >
            Create the first study group!
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-2.5 sm:gap-4">
          {groups.map((group, idx) => {
            const isPrivate = group.privacy === 'private';
            const isMember = group.isMember;
            const isAdmin = group.isAdmin;
            const isPending = group.isPending;

            return (
              <div
                key={group._id}
                onClick={() => navigate(`/groups/${group._id}`)}
                className={`group relative bg-white dark:bg-[#22242a] hover:border-indigo-500/40 border border-slate-200 dark:border-slate-800 rounded-2xl sm:rounded-3xl p-3 sm:p-5 flex flex-col justify-between interactive-card animate-card-enter shadow-sm cursor-pointer hover:shadow-md stagger-${(idx % 6) + 1}`}
              >
                <div className="space-y-2.5 sm:space-y-3.5">
                  {/* Top image & badges */}
                  <div className="flex items-start justify-between gap-2 sm:gap-3">
                    {group.image ? (
                      <img
                        src={group.image}
                        alt={group.name}
                        className="w-10 h-10 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-slate-100 dark:bg-slate-800 object-cover border border-slate-200 dark:border-slate-700 shrink-0 group-hover:scale-105 transition-transform"
                      />
                    ) : (
                      <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-500 text-white font-extrabold text-base sm:text-2xl flex items-center justify-center border border-indigo-400/20 shrink-0 group-hover:scale-105 transition-transform uppercase select-none shadow-sm">
                        {group.name?.trim()?.[0]?.toUpperCase() || 'G'}
                      </div>
                    )}

                    <div className="flex items-center gap-1 sm:gap-1.5 flex-wrap justify-end">
                      <span
                        className={`text-[9px] sm:text-[10px] font-bold px-1.5 sm:px-2 py-0.5 rounded-md border flex items-center gap-1 ${
                          isPrivate
                            ? 'bg-amber-500/10 border-amber-500/20 text-amber-500 dark:text-amber-400'
                            : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                        }`}
                      >
                        {isPrivate ? <Lock size={9} /> : <Globe size={9} />}
                        <span className="capitalize">{group.privacy}</span>
                      </span>

                      {isAdmin && (
                        <span className="text-[9px] sm:text-[10px] font-bold px-1.5 sm:px-2 py-0.5 rounded-md bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                          <Shield size={9} /> Admin
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Group Name & Desc */}
                  <div>
                    <h3 className="font-bold text-xs sm:text-base text-app group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors truncate">
                      {group.name}
                    </h3>
                    <p className="text-[11px] sm:text-xs text-muted line-clamp-2 mt-0.5 sm:mt-1 leading-relaxed">
                      {group.description || 'Welcome! Join us to practice, discuss questions, and learn together.'}
                    </p>
                  </div>

                  {/* Category & Tags */}
                  <div className="flex items-center gap-1 sm:gap-1.5 flex-wrap">
                    <span className="text-[9px] sm:text-[10px] px-1.5 sm:px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium truncate max-w-[100px] sm:max-w-none">
                      {group.category}
                    </span>
                    {(group.tags || []).slice(0, 2).map((tag, idx) => (
                      <span
                        key={idx}
                        className="text-[9px] sm:text-[10px] px-1.5 sm:px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 font-medium truncate max-w-[80px] sm:max-w-[110px]"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>

                  {/* Meeting link indicator if active */}
                  {group.meetingLink && (
                    <div className="flex items-center gap-1 sm:gap-1.5 text-[10px] sm:text-[11px] text-blue-600 dark:text-blue-400 font-medium bg-blue-50 dark:bg-blue-950/40 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-xl border border-blue-200 dark:border-blue-900/40">
                      <Video size={11} />
                      <span className="truncate">Live study call active</span>
                    </div>
                  )}
                </div>

                {/* Bottom Row */}
                <div className="mt-3 sm:mt-4 pt-2.5 sm:pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-1">
                  <span className="text-[10px] sm:text-[11px] text-muted font-medium truncate">
                    {group.membersCount || 0} {group.membersCount === 1 ? 'member' : 'members'}
                  </span>

                  {isMember ? (
                    <span className="flex items-center gap-1 text-[11px] sm:text-xs font-bold text-indigo-600 dark:text-indigo-400 shrink-0">
                      <span>Open</span>
                      <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
                    </span>
                  ) : isPending ? (
                    <span className="px-2 sm:px-3 py-1 rounded-xl text-[10px] sm:text-xs font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20 shrink-0">
                      Pending
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={(e) => handleJoinGroup(e, group._id, group.privacy)}
                      className="px-2.5 py-1.5 sm:px-3.5 sm:py-1.5 rounded-xl text-[11px] sm:text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white transition-all shadow shrink-0"
                    >
                      {isPrivate ? 'Request' : 'Join'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
          {/* Invisible sentinel for seamless infinite scroll */}
          <div ref={sentinelRef} className="h-6 w-full pointer-events-none opacity-0 col-span-full" />
        </div>
      )}

      {/* Create Group Modal */}
      {showCreateModal && (
        <div
          role="dialog"
          data-modal="true"
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4 overflow-y-auto overscroll-contain animate-fade-in"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowCreateModal(false);
          }}
        >
          <div className="w-full max-w-lg bg-white dark:bg-[#22242a] p-6 rounded-3xl space-y-4 my-8 border border-slate-200 dark:border-slate-800 shadow-2xl text-app overscroll-contain animate-modal-enter">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-app text-sm flex items-center gap-2">
                <Users size={18} className="text-indigo-600 dark:text-indigo-400" />
                Create New Study Group
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-muted hover:text-app transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateGroup} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted uppercase tracking-wider">Group Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Spanish Conversation Circle, Figma UX Club, Python Beginners"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl text-app outline-none focus:border-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted uppercase tracking-wider">Description</label>
                <textarea
                  rows={2}
                  placeholder="What is this group about? What will members learn or build together?"
                  value={newGroupDesc}
                  onChange={(e) => setNewGroupDesc(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl text-app outline-none focus:border-indigo-500 resize-none"
                />
              </div>

              {/* Group Avatar Upload or Image URL */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-muted uppercase tracking-wider">Group Icon / Avatar</label>
                <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
                  {newGroupImage ? (
                    <img
                      src={newGroupImage}
                      alt="Group Avatar"
                      className="w-12 h-12 rounded-xl object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 text-white font-bold text-lg flex items-center justify-center border border-indigo-400/20 shrink-0 uppercase select-none shadow-sm">
                      {newGroupName?.trim()?.[0]?.toUpperCase() || 'G'}
                    </div>
                  )}

                  <div className="flex-1 min-w-0 space-y-1.5">
                    <div className="flex items-center gap-2">
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleImageUpload}
                        accept="image/*"
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploadingImage}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-all disabled:opacity-50"
                      >
                        {uploadingImage ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} />}
                        <span>{uploadingImage ? 'Uploading...' : 'Upload Image'}</span>
                      </button>

                      {newGroupImage && (
                        <button
                          type="button"
                          onClick={() => setNewGroupImage('')}
                          className="px-2.5 py-1 text-xs text-red-500 hover:underline"
                        >
                          Remove
                        </button>
                      )}
                    </div>

                    <input
                      type="url"
                      placeholder="Or paste an image URL (optional)"
                      value={newGroupImage}
                      onChange={(e) => setNewGroupImage(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white dark:bg-[#22242a] border border-slate-200 dark:border-slate-700 rounded-xl text-app outline-none focus:border-indigo-500 text-[11px]"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted uppercase tracking-wider">Privacy Mode *</label>
                  <select
                    value={newGroupPrivacy}
                    onChange={(e) => setNewGroupPrivacy(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl text-app outline-none focus:border-indigo-500"
                  >
                    <option value="public">Public (Anyone can join & view)</option>
                    <option value="private">Private (Admin approves join requests)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted uppercase tracking-wider">Category</label>
                  <select
                    value={newGroupCategory}
                    onChange={(e) => setNewGroupCategory(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl text-app outline-none focus:border-indigo-500"
                  >
                    {CATEGORIES.filter((c) => c !== 'All').map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted uppercase tracking-wider">
                  Tags (Comma separated)
                </label>
                <input
                  type="text"
                  placeholder="speaking, spanish, practice, vocabulary"
                  value={newGroupTags}
                  onChange={(e) => setNewGroupTags(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl text-app outline-none focus:border-indigo-500"
                />
              </div>

              <div className="p-3 bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-900/40 rounded-2xl text-[11px] text-muted">
                As creator, you will manage this room. You can edit group details anytime, set video study call links, pin messages, and manage members.
              </div>

              <button
                type="submit"
                disabled={createSubmitting}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold transition-all shadow disabled:opacity-50"
              >
                {createSubmitting ? 'Creating Group...' : 'Create Study Group'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Groups;
