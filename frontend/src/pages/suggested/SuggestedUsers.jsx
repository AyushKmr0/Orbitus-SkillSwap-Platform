import React, { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import apiClient from '../../services/apiClient.js';
import { setCurrentRoom } from '../../features/chatSlice.js';
import {
  Users,
  RefreshCw,
  Search,
  UserPlus,
  UserCheck,
  MessageSquare,
  Calendar,
  Clock,
  Sparkles,
  Link as LinkIcon,
  Video,
  X,
  CheckCircle,
  ExternalLink,
  BookOpen,
  ArrowLeft
} from 'lucide-react';

const SuggestedUsers = () => {
  const { token, user: currentUser } = useSelector((state) => state.auth);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFading, setIsFading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'not_following'
  const [msg, setMsg] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const sentinelRef = useRef(null);

  // Booking Modal State
  const [bookingPartner, setBookingPartner] = useState(null);
  const [bookTopic, setBookTopic] = useState('');
  const [bookDate, setBookDate] = useState('');
  const [bookTime, setBookTime] = useState('');
  const [bookDuration, setBookDuration] = useState(60);
  const [bookNotes, setBookNotes] = useState('');
  const [bookMeetingLink, setBookMeetingLink] = useState('');
  const [bookLinkProvider, setBookLinkProvider] = useState('Google Meet');
  const [bookLinkSharedBy, setBookLinkSharedBy] = useState('either'); // 'mentor', 'learner', 'either'
  const [bookingSubmitting, setBookingSubmitting] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState('');
  const [bookingError, setBookingError] = useState('');

  useEffect(() => {
    fetchSuggestedUsers();

    // Cyclic smooth refresh: loops back to page 1 and fetches fresh peers every 10 minutes
    const interval = setInterval(() => {
      fetchSuggestedUsers(true);
    }, 10 * 60 * 1000);

    return () => clearInterval(interval);
  }, [token]);

  // Seamless infinite scroll observer: auto-fetches next 20 peers as user scrolls down
  useEffect(() => {
    if (!sentinelRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore && !loading) {
          loadMoreUsers();
        }
      },
      { rootMargin: '300px' }
    );
    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [hasMore, loadingMore, loading, page]);

  const fetchSuggestedUsers = async (isBackground = false) => {
    if (!isBackground) setLoading(true);
    try {
      const res = await apiClient.get('/api/users/suggested', {
        params: { limit: 20, page: 1 }
      });
      const data = res.data.users || res.data.data?.users || [];
      // Auto-shuffle on every fetch so the order is fresh each time
      const shuffled = [...data].sort(() => Math.random() - 0.5);
      if (isBackground && shuffled.length > 0) {
        setIsFading(true);
        setTimeout(() => {
          setUsers(shuffled);
          setPage(1);
          setHasMore(data.length === 20);
          setIsFading(false);
        }, 400);
      } else {
        setUsers(shuffled);
        setPage(1);
        setHasMore(data.length === 20);
      }
    } catch (err) {
      console.error('Error fetching suggested users:', err);
    } finally {
      if (!isBackground) setLoading(false);
    }
  };


  const loadMoreUsers = async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      const nextPage = page + 1;
      const res = await apiClient.get('/api/users/suggested', {
        params: { limit: 20, page: nextPage }
      });
      const newUsers = res.data.users || res.data.data?.users || [];
      if (newUsers.length > 0) {
        setUsers((prev) => {
          const seen = new Set(prev.map((u) => u._id));
          const uniqueNew = newUsers.filter((u) => !seen.has(u._id));
          return [...prev, ...uniqueNew];
        });
        setPage(nextPage);
        setHasMore(newUsers.length === 20);
      } else {
        setHasMore(false);
      }
    } catch (err) {
      console.error('Error loading more users:', err);
    } finally {
      setLoadingMore(false);
    }
  };

  const handleToggleFollow = async (targetUserId) => {
    try {
      const res = await apiClient.post(`/api/users/${targetUserId}/follow`);
      const isNowFollowing = res.data.following;

      setUsers((prev) =>
        prev.map((u) =>
          u._id === targetUserId
            ? {
                ...u,
                isFollowing: isNowFollowing,
                followersCount: isNowFollowing
                  ? (u.followersCount || 0) + 1
                  : Math.max(0, (u.followersCount || 0) - 1)
              }
            : u
        )
      );
    } catch (err) {
      console.error('Follow toggle error:', err);
    }
  };

  const handleStartChat = (targetUser) => {
    const roomId = [currentUser._id, targetUser._id].sort().join('_');
    dispatch(setCurrentRoom({ partner: targetUser, roomId }));
    navigate('/chat', { state: { directChat: true } });
  };

  const openBookingModal = (targetUser) => {
    setBookingPartner(targetUser);
    setBookTopic('');
    setBookDate('');
    setBookTime('');
    setBookDuration(60);
    setBookNotes('');
    setBookMeetingLink('');
    setBookLinkProvider('Google Meet');
    setBookLinkSharedBy('either');
    setBookingSuccess('');
    setBookingError('');
  };

  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    if (!bookTopic.trim() || !bookDate || !bookTime) {
      setBookingError('Please fill out the session topic, date, and start time.');
      return;
    }

    setBookingSubmitting(true);
    setBookingSuccess('');
    setBookingError('');

    try {
      const startDateTime = new Date(`${bookDate}T${bookTime}:00`);
      const endDateTime = new Date(startDateTime.getTime() + Number(bookDuration) * 60 * 1000);

      await apiClient.post('/api/sessions/book', {
        mentorId: bookingPartner._id,
        topic: bookTopic.trim(),
        startTime: startDateTime.toISOString(),
        endTime: endDateTime.toISOString(),
        notes: bookNotes.trim(),
        meetingLink: bookMeetingLink.trim(),
        meetingLinkProvider: bookLinkProvider,
        meetingLinkSharedBy: bookLinkSharedBy
      });

      setBookingSuccess('Session requested successfully! Check My Bookings.');
      setTimeout(() => {
        setBookingPartner(null);
        setBookingSuccess('');
      }, 2000);
    } catch (err) {
      console.error('Booking request error:', err);
      setBookingError(err.response?.data?.message || 'Could not schedule session.');
    } finally {
      setBookingSubmitting(false);
    }
  };

  const filteredUsers = users.filter((u) => {
    if (activeTab === 'not_following' && u.isFollowing) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    const nameMatch = u.name?.toLowerCase().includes(q);
    const usernameMatch = u.username?.toLowerCase().includes(q);
    const skillMatch = (u.skillsTeach || []).some((s) => s.skill?.name?.toLowerCase().includes(q));
    const bioMatch = u.bio?.toLowerCase().includes(q);
    return nameMatch || usernameMatch || skillMatch || bioMatch;
  });

  useEffect(() => {
    if (bookingPartner) {
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
  }, [bookingPartner]);

  return (
    <div className="page-shell space-y-6 overflow-y-auto pb-32 sm:pb-20 animate-fade-in">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-[#22242a] p-5 sm:p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-start gap-3.5">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-blue-50 dark:bg-blue-600/10 border border-blue-200 dark:border-blue-500/20 text-blue-600 dark:text-blue-400 rounded-xl">
                <Users size={20} />
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-app font-outfit tracking-tight">
                Suggested Peers
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-muted mt-1.5">
              Discover partners and mentors who share your learning interests. Connect, chat, or schedule a 1-on-1 practice session.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-stretch sm:self-auto justify-end">
          <button
            type="button"
            onClick={() => fetchSuggestedUsers()}
            disabled={loading || isFading}
            className="p-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-muted hover:text-app rounded-2xl border border-slate-200 dark:border-slate-700 transition-colors"
            title="Refresh list"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3.5 top-3 text-muted" />
          <input
            type="text"
            placeholder="Search by name, @username, or skill..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-[#12161f] border border-slate-200 dark:border-slate-800 rounded-2xl text-xs sm:text-sm text-app placeholder:text-muted outline-none focus:border-blue-500 transition-colors"
          />
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-2xl self-start sm:self-auto">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-xl transition-all ${
              activeTab === 'all'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-muted hover:text-app'
            }`}
          >
            All Suggestions ({users.length})
          </button>
          <button
            onClick={() => setActiveTab('not_following')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-xl transition-all ${
              activeTab === 'not_following'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-muted hover:text-app'
            }`}
          >
            Not Following
          </button>
        </div>
      </div>

      {/* Grid of User Cards */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 py-8">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-64 rounded-3xl bg-slate-100 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 animate-pulse" />
          ))}
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-[#22242a]/50 rounded-3xl p-8 space-y-3">
          <Users size={36} className="mx-auto text-muted" />
          <p className="text-sm font-semibold text-app">No peers found matching your filter.</p>
          <button
            onClick={() => { setSearchQuery(''); setActiveTab('all'); fetchSuggestedUsers(); }}
            className="text-xs text-blue-600 dark:text-blue-400 font-bold hover:underline"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className={`grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-4 transition-all duration-700 ease-in-out ${isFading ? 'opacity-85 scale-[0.995]' : 'opacity-100 scale-100'}`}>
          {filteredUsers.map((peer, idx) => {
            const teaches = peer.skillsTeach || [];
            const wants = peer.skillsLearn || [];
            const peerProfileUrl = peer._id ? `/profile/${peer._id}` : '#';

            return (
              <div
                key={peer._id}
                className={`group relative bg-white dark:bg-[#22242a] border border-slate-200 dark:border-slate-800 hover:border-blue-500/40 rounded-2xl sm:rounded-3xl p-2.5 sm:p-5 flex flex-col justify-between interactive-card animate-card-enter shadow-sm stagger-${(idx % 8) + 1}`}
              >
                <div>
                  {/* Top user row */}
                  <div className="flex items-center sm:items-start gap-2 sm:gap-3.5">
                    <Link to={peerProfileUrl} className="shrink-0 relative group-hover:scale-105 transition-transform">
                      <img
                        src={peer.profileImage || `https://ui-avatars.com/api/?name=&background=6366f1&color=fff${encodeURIComponent(peer.name)}`}
                        alt={peer.name}
                        className="w-9 h-9 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-slate-100 dark:bg-slate-800 object-cover border border-slate-200 dark:border-slate-700 shadow-sm"
                      />
                    </Link>

                    <div className="min-w-0 flex-1">
                      <Link
                        to={peerProfileUrl}
                        className="font-bold text-[11px] sm:text-sm text-app hover:text-blue-600 dark:hover:text-blue-400 truncate block leading-snug"
                        title={peer.name}
                      >
                        {peer.name}
                      </Link>
                      <p className="text-[9px] sm:text-[11px] text-muted truncate">@{peer.username || 'user'}</p>
                      
                      <div className="hidden sm:flex items-center gap-1 mt-0.5 sm:mt-1 text-[10px] sm:text-[11px] text-muted flex-wrap">
                        <span>{peer.experienceLevel || 'Learner'}</span>
                        <span>•</span>
                        <span>{peer.followersCount || 0} followers</span>
                      </div>
                    </div>
                  </div>

                  {/* Bio */}
                  {peer.bio && (
                    <p className="text-[10px] sm:text-xs text-muted line-clamp-1 sm:line-clamp-2 mt-1 sm:mt-2.5 leading-snug">
                      {peer.bio}
                    </p>
                  )}

                  {/* Skills badges */}
                  <div className="mt-1.5 sm:mt-3 space-y-1">
                    {teaches.length > 0 && (
                      <div className="flex items-center gap-1 flex-wrap">
                        <span className="text-[7px] sm:text-[9px] font-bold text-muted uppercase shrink-0">Teach:</span>
                        {teaches.slice(0, 1).map((st, sidx) => (
                          <span
                            key={sidx}
                            className="text-[8px] sm:text-[10px] px-1 py-0.5 sm:px-2 sm:py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20 font-medium truncate max-w-[85px] sm:max-w-[120px]"
                          >
                            {st.skill?.name || 'Skill'}
                          </span>
                        ))}
                        {teaches.length > 1 && (
                          <span className="hidden sm:inline-block text-[8px] sm:text-[10px] px-1 py-0.5 sm:px-2 sm:py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20 font-medium truncate max-w-[120px]">
                            {teaches[1].skill?.name || 'Skill'}
                          </span>
                        )}
                      </div>
                    )}
                    {wants.length > 0 && (
                      <div className="hidden sm:flex items-center gap-1 sm:gap-1.5 flex-wrap">
                        <span className="text-[8px] sm:text-[9px] font-bold text-muted uppercase shrink-0">Learn:</span>
                        {wants.slice(0, 2).map((sl, sidx) => (
                          <span
                            key={sidx}
                            className="text-[9px] sm:text-[10px] px-1.5 py-0.5 sm:px-2 sm:py-0.5 rounded-md bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-500/20 font-medium truncate max-w-[90px] sm:max-w-[120px]"
                          >
                            {sl.skill?.name || 'Skill'}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Bottom action row */}
                <div className="mt-2 sm:mt-3 pt-1.5 sm:pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center gap-1 sm:gap-2">
                  <button
                    type="button"
                    onClick={() => handleToggleFollow(peer._id)}
                    className={`w-20 sm:w-24 flex items-center justify-center gap-1 py-1 sm:py-2 px-1 sm:px-2.5 rounded-xl text-[10px] sm:text-xs font-bold transition-all shrink-0 text-center ${
                      peer.isFollowing
                        ? 'btn-secondary text-[10px] sm:text-xs py-1 sm:py-2'
                        : 'btn-primary text-[10px] sm:text-xs py-1 sm:py-2'
                    }`}
                  >
                    {peer.isFollowing ? (
                      <>
                        <UserCheck size={11} /> Following
                      </>
                    ) : (
                      <>
                        <UserPlus size={11} /> Follow
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => handleStartChat(peer)}
                    className="btn-secondary p-1 sm:p-2 rounded-xl text-muted hover:text-app"
                    title="Send direct message"
                  >
                    <MessageSquare size={12} />
                  </button>

                  <button
                    onClick={() => openBookingModal(peer)}
                    className="p-1 sm:p-2 rounded-xl bg-blue-50 dark:bg-blue-600/10 hover:bg-blue-600 border border-blue-200 dark:border-blue-500/20 text-blue-600 dark:text-blue-400 hover:text-white transition-all"
                    title="Book study session"
                  >
                    <Calendar size={12} />
                  </button>
                </div>
              </div>
            );
          })}
          {/* Invisible sentinel for seamless infinite scroll */}
          <div ref={sentinelRef} className="h-6 w-full pointer-events-none opacity-0 col-span-full" />
        </div>
      )}

      {/* Booking Session Modal (Skill select removed, VC link options added) */}
      {bookingPartner && (
        <div
          role="dialog"
          data-modal="true"
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[60] flex items-center justify-center p-4 overflow-y-auto overscroll-contain animate-fade-in"
          onClick={(e) => {
            if (e.target === e.currentTarget) setBookingPartner(null);
          }}
        >
          <div className="w-full max-w-lg glass-panel p-6 rounded-3xl space-y-4 my-8 border border-slate-800 shadow-2xl overscroll-contain">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <div className="flex items-center gap-3">
                <img
                  src={bookingPartner.profileImage}
                  alt={bookingPartner.name}
                  className="w-10 h-10 rounded-xl bg-slate-800"
                />
                <div>
                  <h3 className="font-bold text-sm text-slate-100">Schedule Session</h3>
                  <p className="text-xs text-slate-400">with {bookingPartner.name}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setBookingPartner(null)}
                className="rounded-lg p-1.5 text-slate-400 hover:text-white transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {bookingSuccess && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs rounded-xl flex items-center gap-2">
                <CheckCircle size={15} />
                <span>{bookingSuccess}</span>
              </div>
            )}

            {bookingError && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl">
                {bookingError}
              </div>
            )}

            <form onSubmit={handleBookingSubmit} className="space-y-3.5 text-xs">
              {/* Topic input */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Session Topic / What to Study *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. JavaScript Async/Await & Promises discussion"
                  value={bookTopic}
                  onChange={(e) => setBookTopic(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-200 outline-none focus:border-blue-500"
                />
              </div>

              {/* Date & Time */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Date *</label>
                  <input
                    type="date"
                    required
                    value={bookDate}
                    onChange={(e) => setBookDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-200 outline-none focus:border-blue-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Start Time *</label>
                  <input
                    type="time"
                    required
                    value={bookTime}
                    onChange={(e) => setBookTime(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-200 outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Duration */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Session Duration</label>
                <select
                  value={bookDuration}
                  onChange={(e) => setBookDuration(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-200 outline-none focus:border-blue-500"
                >
                  <option value={30}>30 minutes</option>
                  <option value={60}>60 minutes (eligible for +50 mentor pts)</option>
                  <option value={90}>90 minutes</option>
                  <option value={120}>120 minutes</option>
                </select>
              </div>

              {/* VC Link Settings */}
              <div className="p-3.5 bg-slate-900/60 border border-slate-800/80 rounded-2xl space-y-2.5">
                <div className="flex items-center gap-1.5 text-blue-400 font-bold text-[11px]">
                  <Video size={14} />
                  <span>Video Call Settings</span>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-slate-400">Who provides the Video Call link?</label>
                  <select
                    value={bookLinkSharedBy}
                    onChange={(e) => setBookLinkSharedBy(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 outline-none focus:border-blue-500"
                  >
                    <option value="either">Either of us can provide the link</option>
                    <option value="learner">I will provide the call link</option>
                    <option value="mentor">{bookingPartner.name} will provide the call link</option>
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div className="sm:col-span-1 space-y-1">
                    <label className="text-[10px] font-semibold text-slate-400">Platform</label>
                    <select
                      value={bookLinkProvider}
                      onChange={(e) => setBookLinkProvider(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 outline-none focus:border-blue-500"
                    >
                      <option value="Google Meet">Google Meet</option>
                      <option value="Zoom">Zoom</option>
                      <option value="Microsoft Teams">MS Teams</option>
                      <option value="Discord">Discord</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div className="sm:col-span-2 space-y-1">
                    <label className="text-[10px] font-semibold text-slate-400">Meeting Link (Optional now, can add later)</label>
                    <input
                      type="url"
                      placeholder="https://meet.google.com/xyz-abc"
                      value={bookMeetingLink}
                      onChange={(e) => setBookMeetingLink(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Notes / Agenda (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Share any topics, repositories, or questions in advance..."
                  value={bookNotes}
                  onChange={(e) => setBookNotes(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-200 outline-none focus:border-blue-500"
                />
              </div>

              <button
                type="submit"
                disabled={bookingSubmitting}
                className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold transition-all shadow disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                <Clock size={14} />
                <span>{bookingSubmitting ? 'Sending Request...' : 'Send Session Request'}</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SuggestedUsers;
