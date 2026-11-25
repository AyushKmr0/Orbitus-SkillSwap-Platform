import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import apiClient from '../../services/apiClient.js';
import RubberSegment from '../../components/common/react-bits/RubberSegment.jsx';
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
  Upload,
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
  const { token } = useSelector((state) => state.auth);
  const navigate = useNavigate();

  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [groupsError, setGroupsError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [filterTab, setFilterTab] = useState('all'); // 'all', 'joined', 'admin'
  const [msg, setMsg] = useState('');
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

  const fetchGroups = useCallback(async (isBackground = false) => {
    if (!isBackground) setLoading(true);
    setGroupsError('');
    try {
      const res = await apiClient.get('/api/groups', {
        params: {
          category: selectedCategory,
          filter: filterTab,
          search: debouncedSearch,
          limit: 20,
          page: 1
        }
      });
      const data = res.data?.groups || res.data?.data?.groups || [];
      if (!Array.isArray(data)) {
        throw new Error('Received an unexpected groups data format.');
      }
      setGroups(data);
      setPage(1);
      setHasMore(data.length === 20);
    } catch (err) {
      console.error('Fetch groups error:', err);
      setGroupsError(err.response?.data?.message || err.message || 'Could not load study groups.');
      if (!isBackground) setGroups([]);
    } finally {
      if (!isBackground) setLoading(false);
    }
  }, [selectedCategory, filterTab, debouncedSearch]);

  const loadMoreGroups = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      const nextPage = page + 1;
      const res = await apiClient.get('/api/groups', {
        params: {
          category: selectedCategory,
          filter: filterTab,
          search: debouncedSearch,
          limit: 20,
          page: nextPage
        }
      });
      const newGroups = res.data?.groups || res.data?.data?.groups || [];
      if (!Array.isArray(newGroups)) {
        throw new Error('Received an unexpected groups data format.');
      }
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
      setGroupsError(err.response?.data?.message || err.message || 'Could not load more study groups.');
      setHasMore(false);
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMore, page, selectedCategory, filterTab, debouncedSearch]);

  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedSearch(searchQuery.trim()), 300);
    return () => clearTimeout(timeout);
  }, [searchQuery]);

  useEffect(() => {
    fetchGroups();

    // Cyclic smooth refresh: every 10 minutes, silently refreshes from 1st page
    const interval = setInterval(() => {
      fetchGroups(true);
    }, 10 * 60 * 1000);

    return () => clearInterval(interval);
  }, [token, fetchGroups]);

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
  }, [hasMore, loadingMore, loading, loadMoreGroups]);

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

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setDebouncedSearch(searchQuery.trim());
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

  const handleJoinGroup = async (e, groupId) => {
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
    <div className="mx-auto min-w-0 max-w-7xl space-y-6">
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="orb-page-title">Study Groups</h1>
          <p className="orb-page-subtitle">Find your learning community, share knowledge, and make progress together.</p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => fetchGroups()}
            disabled={loading}
            className="orb-btn-ghost text-xs"
            title="Refresh groups"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>
          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="orb-btn-primary text-xs shadow-sm"
          >
            <Plus size={14} />
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
      {groupsError && groups.length > 0 && (
        <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800 dark:border-amber-800/50 dark:bg-amber-950/20 dark:text-amber-200">
          <span>{groupsError}</span>
          <button type="button" onClick={() => fetchGroups()} className="font-semibold underline underline-offset-2">
            Refresh groups
          </button>
        </div>
      )}

      {/* Search and Tabs */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        {/* Search */}
        <form onSubmit={handleSearchSubmit} role="search" className="relative w-full md:max-w-md">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="text"
            placeholder="Search groups by topic, skill, or tag..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-10 text-sm text-app outline-none transition placeholder:text-muted focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10 dark:border-slate-700 dark:bg-[#1b1e26]"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              aria-label="Clear group search"
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-muted transition hover:bg-slate-100 hover:text-app dark:hover:bg-slate-800"
            >
              <X size={14} />
            </button>
          )}
        </form>

        {/* Filter Tabs */}
        <RubberSegment
          ariaLabel="Study group filter"
          value={filterTab}
          onChange={setFilterTab}
          options={[
            { value: 'all', label: 'All Groups' },
            { value: 'joined', label: 'My Groups' },
            { value: 'admin', label: 'Groups I Manage' }
          ]}
          className="self-start md:self-auto"
        />
      </div>

      {/* Category Pills Bar */}
      <div className="overflow-x-auto pb-1 scrollbar-none">
        <RubberSegment
          ariaLabel="Study group category"
          value={selectedCategory}
          onChange={setSelectedCategory}
          options={CATEGORIES}
          className="w-max min-w-full"
          buttonClassName="border border-transparent px-3.5 py-1.5 font-medium"
          activeTextClassName="font-bold text-white"
          inactiveTextClassName="border-slate-200 bg-white text-muted hover:border-slate-300 hover:text-app dark:border-slate-800 dark:bg-[#22242a] dark:hover:border-slate-700"
          indicatorClassName="bg-indigo-600 shadow-sm"
        />
      </div>

      {/* Groups Grid */}
      <div key={`${filterTab}:${selectedCategory}`} className="content-switch-motion">
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-2.5 sm:gap-4 py-8">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-60 animate-pulse rounded-2xl border border-slate-200 bg-slate-100 dark:border-slate-800 dark:bg-slate-900/40" />
          ))}
        </div>
      ) : groupsError && groups.length === 0 ? (
        <div role="alert" className="space-y-3 rounded-2xl border border-red-200 bg-red-50 px-6 py-16 text-center dark:border-red-900/50 dark:bg-red-950/20">
          <p className="text-sm font-semibold text-red-700 dark:text-red-300">{groupsError}</p>
          <button type="button" onClick={() => fetchGroups()} className="orb-btn-ghost text-xs">
            <RefreshCw size={13} /> Try again
          </button>
        </div>
      ) : groups.length === 0 ? (
        <div className="space-y-3 rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-20 text-center dark:border-slate-800 dark:bg-[#15171d]">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-300">
            <Compass size={22} />
          </div>
          <div>
            <p className="text-sm font-semibold text-app">No study groups found</p>
            <p className="mt-1 text-xs text-muted">Try another search or category, or start a new community.</p>
          </div>
          <div className="flex justify-center gap-2 pt-1">
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('All');
                setFilterTab('all');
              }}
              className="orb-btn-ghost text-xs"
            >
              Clear filters
            </button>
            <button type="button" onClick={() => setShowCreateModal(true)} className="orb-btn-primary text-xs">
              <Plus size={13} /> Create group
            </button>
          </div>
        </div>
      ) : (
        <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {groups.map((group, idx) => {
            const isPrivate = group.privacy === 'private';
            const isMember = group.isMember;
            const isAdmin = group.isAdmin;
            const isPending = group.isPending;

            return (
              <article
                key={group._id}
                className={`group orb-card flex min-w-0 flex-col justify-between p-5 transition-transform duration-200 hover:-translate-y-0.5 stagger-${(idx % 6) + 1}`}
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
                    <h3 className="truncate text-sm font-semibold tracking-tight text-app transition-colors group-hover:text-indigo-600 dark:group-hover:text-indigo-400 sm:text-base">
                      <Link to={`/groups/${group._id}`} className="rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-indigo-500">
                        {group.name}
                      </Link>
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
                  <span className="truncate text-xs font-medium text-muted">
                    {group.membersCount || 0} {group.membersCount === 1 ? 'member' : 'members'}
                  </span>

                  {isMember ? (
                    <Link to={`/groups/${group._id}`} className="flex shrink-0 items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400">
                      <span>Open group</span>
                      <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
                    </Link>
                  ) : isPending ? (
                    <span className="px-2 sm:px-3 py-1 rounded-xl text-[10px] sm:text-xs font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20 shrink-0">
                      Pending
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={(e) => handleJoinGroup(e, group._id)}
                      className="px-2.5 py-1.5 sm:px-3.5 sm:py-1.5 rounded-xl text-[11px] sm:text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white transition-all shadow shrink-0"
                    >
                      {isPrivate ? 'Request' : 'Join'}
                    </button>
                  )}
                </div>
              </article>
            );
          })}
          {/* Invisible sentinel for seamless infinite scroll */}
          <div ref={sentinelRef} className="h-6 w-full pointer-events-none opacity-0 col-span-full" />
        </div>
      )}
      </div>

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
