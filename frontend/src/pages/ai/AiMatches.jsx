import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { setCurrentRoom, upsertActiveChat } from '../../features/chatSlice.js';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Sparkles,
  User,
  GraduationCap,
  Bookmark,
  MessageSquare,
  Calendar,
  CheckCircle,
  HelpCircle,
  Clock,
  ExternalLink,
  GitBranch,
  Briefcase,
  Globe,
  FileText,
  X,
  Search,
  UserPlus,
  UserCheck
} from 'lucide-react';

const AiMatches = () => {
  const { token, user } = useSelector((state) => state.auth);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [matches, setMatches] = useState({ mentors: [], learners: [] });
  const [loading, setLoading] = useState(true);
  const [profileUser, setProfileUser] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [manualUsers, setManualUsers] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchMessage, setSearchMessage] = useState('');
  
  // Booking Session State
  const [bookingUser, setBookingUser] = useState(null); // UserObj
  const [bookingSkill, setBookingSkill] = useState('');
  const [bookDate, setBookDate] = useState('');
  const [bookTime, setBookTime] = useState('');
  const [bookDuration, setBookDuration] = useState(60);
  const [bookNotes, setBookNotes] = useState('');
  const [bookMsg, setBookMsg] = useState('');

  useEffect(() => {
    fetchMatches();
  }, [token]);

  const fetchMatches = async () => {
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const res = await axios.get('/api/ai/match', config);
      setMatches(res.data);
    } catch (err) {
      console.error('Error fetching AI matches:', err);
    } finally {
      setLoading(false);
    }
  };

  const syncUserEverywhere = (nextUser) => {
    const syncMatch = (match) => match.user._id === nextUser._id ? { ...match, user: { ...match.user, ...nextUser } } : match;
    setMatches((prev) => ({
      mentors: prev.mentors.map(syncMatch),
      learners: prev.learners.map(syncMatch)
    }));
    setManualUsers((prev) => prev.map((item) => item._id === nextUser._id ? { ...item, ...nextUser } : item));
    setProfileUser((prev) => prev?._id === nextUser._id ? { ...prev, ...nextUser } : prev);
  };

  const handleManualSearch = async (event) => {
    event.preventDefault();
    const query = searchQuery.trim();
    if (query.length < 2) {
      setSearchMessage('Type at least 2 characters.');
      return;
    }

    setSearchLoading(true);
    setSearchMessage('');
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const res = await axios.get(`/api/users/search?q=${encodeURIComponent(query)}`, config);
      setManualUsers(res.data.users || []);
      if (!res.data.users?.length) setSearchMessage('No person found with that name or username.');
    } catch (err) {
      setSearchMessage(err.response?.data?.message || 'Search failed. Please try again.');
    } finally {
      setSearchLoading(false);
    }
  };

  const handleToggleFollow = async (targetUserId) => {
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const res = await axios.post(`/api/users/${targetUserId}/follow`, {}, config);
      syncUserEverywhere(res.data.user);
    } catch (err) {
      console.error('Error updating follow:', err);
    }
  };

  const handleStartChat = (partner) => {
    const chatRoomId = [user._id.toString(), partner._id.toString()].sort().join('_');
    dispatch(upsertActiveChat({
      partner,
      chatRoomId,
      lastMessage: {
        content: 'Start the conversation',
        fileType: 'none',
        isSeen: true,
        sender: user._id,
        createdAt: new Date().toISOString()
      }
    }));
    dispatch(setCurrentRoom({ partner, roomId: chatRoomId }));
    navigate('/chat');
  };

  const openProfileModal = async (userId) => {
    setProfileLoading(true);
    setProfileUser(null);
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const res = await axios.get(`/api/users/${userId}`, config);
      setProfileUser(res.data.user);
    } catch (err) {
      console.error('Error fetching profile:', err);
    } finally {
      setProfileLoading(false);
    }
  };

  const renderEducation = (education) => {
    if (Array.isArray(education)) return education;
    return education ? [{ degree: education, institution: '', year: '' }] : [];
  };

  const openBookingModal = (matchUser, defaultSkill) => {
    setBookingUser(matchUser);
    setBookingSkill(defaultSkill?._id || '');
    setBookDate('');
    setBookTime('');
    setBookNotes('');
    setBookDuration(60);
    setBookMsg('');
  };

  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    setBookMsg('');

    if (!bookDate || !bookTime || !bookingSkill) return;

    const startDateTime = new Date(`${bookDate}T${bookTime}:00`);
    const endDateTime = new Date(startDateTime.getTime() + Number(bookDuration) * 60 * 1000);

    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      await axios.post('/api/sessions/book', {
        mentorId: bookingUser._id,
        skillId: bookingSkill,
        startTime: startDateTime.toISOString(),
        endTime: endDateTime.toISOString(),
        notes: bookNotes
      }, config);

      setBookMsg('Session booked successfully! Recipient notified.');
      setTimeout(() => {
        setBookingUser(null);
        setBookMsg('');
      }, 2000);
    } catch (err) {
      console.error('Error booking session:', err);
      setBookMsg(err.response?.data?.message || 'Error scheduling session booking.');
    }
  };

  if (loading) {
    return (
      <div className="flex-1 p-8 space-y-6 flex flex-col justify-center items-center h-screen bg-slate-950 text-slate-100">
        <div className="w-12 h-12 rounded-full border-4 border-indigo-500/20 border-t-indigo-500 animate-spin" />
        <span className="text-sm font-medium text-slate-400">AI Matchmaker indexing portfolios...</span>
      </div>
    );
  }

  return (
    <div className="flex-1 p-6 lg:p-8 space-y-8 bg-slate-950 min-h-screen text-slate-200 overflow-y-auto">
      {/* Header bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-r from-slate-900/60 to-slate-900/60 p-6 rounded-3xl border border-slate-800/60 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Sparkles size={22} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl lg:text-3xl font-extrabold text-white font-outfit tracking-tight">AI Skill Matching</h1>
            <p className="text-sm text-slate-400 mt-1">Smarter pairing, instantly aligning what you want to learn with others' teachings</p>
          </div>
        </div>
      </div>

      <div className="glass-panel rounded-3xl border-slate-850 p-5">
        <form onSubmit={handleManualSearch} className="flex flex-col gap-3 md:flex-row md:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search people by name or @username"
              className="w-full rounded-2xl border border-slate-800 bg-slate-900 px-11 py-3 text-sm text-slate-200 outline-none focus:border-indigo-500"
            />
          </div>
          <button type="submit" disabled={searchLoading} className="btn-primary min-h-0 px-5 py-3">
            {searchLoading ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" /> : <><Search size={16} /><span>Search</span></>}
          </button>
        </form>

        {searchMessage && <p className="mt-3 text-xs text-slate-500">{searchMessage}</p>}

        {manualUsers.length > 0 && (
          <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {manualUsers.map((person) => (
              <div key={person._id} className="rounded-2xl border border-slate-850 bg-slate-900/40 p-4">
                <button type="button" onClick={() => openProfileModal(person._id)} className="flex w-full items-center gap-3 text-left">
                  <img src={person.profileImage} alt={person.name} className="h-12 w-12 rounded-xl bg-slate-850" />
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate text-sm font-bold text-slate-100">{person.name}</h3>
                    <p className="truncate text-xs text-slate-500">@{person.username || 'username'}</p>
                  </div>
                </button>
                <p className="mt-3 line-clamp-2 text-xs leading-5 text-slate-400">{person.bio || 'No bio added yet.'}</p>
                <div className="mt-3 flex gap-4 text-[10px] font-bold uppercase text-slate-500">
                  <span>{person.followersCount || 0} Followers</span>
                  <span>{person.followingCount || 0} Following</span>
                </div>
                <div className="mt-4 flex gap-2">
                  <button onClick={() => handleToggleFollow(person._id)} className="flex-1 rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs font-bold text-slate-200 hover:bg-slate-800">
                    {person.isFollowing ? <><UserCheck size={13} className="inline" /> Following</> : <><UserPlus size={13} className="inline" /> Follow</>}
                  </button>
                  <button onClick={() => handleStartChat(person)} className="flex-1 rounded-xl bg-indigo-600 px-3 py-2 text-xs font-bold text-white hover:bg-indigo-500">
                    Message
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recommended Mentors Grid */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-slate-200 font-outfit flex items-center gap-2">
          🎓 Recommended Mentors <span className="text-xs text-indigo-400 font-normal">(Users who teach what you want to learn)</span>
        </h2>
        {matches.mentors.length === 0 ? (
          <div className="p-8 text-center text-slate-500 border border-dashed border-slate-850 rounded-2xl">
            Add skills you want to learn in the Skill Catalog to get recommended mentors here!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {matches.mentors.map((match) => (
              <div key={match.user._id} className="glass-panel p-6 rounded-3xl flex flex-col justify-between border-slate-850 hover:border-slate-800 transition-all shadow group">
                <div className="space-y-4">
                  {/* Score & Profile */}
                  <button type="button" onClick={() => openProfileModal(match.user._id)} className="flex w-full justify-between items-start text-left cursor-pointer border-b-2 border-gray-100">
                    <div className="flex items-center gap-3">
                      <img src={match.user.profileImage} alt={match.user.name} className="w-11 h-11 rounded-xl bg-slate-850" />
                      <div>
                        <h4 className="font-bold text-xs text-slate-200 leading-none">{match.user.name}</h4>
                        <p className="mt-1 text-[10px] text-slate-500">@{match.user.username || 'username'}</p>
                        <span className="text-[9px] font-bold text-slate-500 border border-slate-800 bg-slate-900 px-1 py-0.2 rounded mt-1 inline-block">
                          {match.user.experienceLevel} Level
                        </span>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-indigo-400 bg-indigo-500/10 border border-indigo-500/10 px-2 py-0.5 rounded-full">
                      {match.matchScore}% Match
                    </span>
                  </button>

                  <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">{match.user.bio}</p>
                  <div className="flex gap-4 text-[10px] font-bold uppercase text-slate-500">
                    <span>{match.user.followersCount || 0} Followers</span>
                    <span>{match.user.followingCount || 0} Following</span>
                  </div>
                  
                  {/* Skill matches list */}
                  <div className="space-y-1 pt-2">
                    <span className="text-[9px] uppercase font-bold text-slate-500">Teaches Skills:</span>
                    <div className="flex flex-wrap gap-1">
                      {match.user.skillsTeach.map((s, idx) => (
                        <span key={idx} className="text-[9px] bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 px-2 py-0.5 rounded-full font-medium">
                          {s.skill.name} ({s.level})
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Shared Interests */}
                  {match.sharedInterests.length > 0 && (
                    <div className="space-y-1">
                      <span className="text-[9px] uppercase font-bold text-slate-500">Shared Interests:</span>
                      <div className="flex flex-wrap gap-1">
                        {match.sharedInterests.map((interest, idx) => (
                          <span key={idx} className="text-[9px] bg-slate-900 border border-slate-800 text-slate-400 px-2 py-0.5 rounded-full font-medium">
                            {interest}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Actions console */}
                <div className="flex gap-2 pt-4 border-t border-slate-850 mt-6">
                  <button
                    onClick={() => handleToggleFollow(match.user._id)}
                    className="rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-200 text-xs font-bold transition-all flex items-center justify-center gap-1.5 px-3"
                  >
                    {match.user.isFollowing ? <UserCheck size={13} /> : <UserPlus size={13} />}
                  </button>
                  <button
                    onClick={() => handleStartChat(match.user)}
                    className="flex-1 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-200 text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                  >
                    <MessageSquare size={13} />
                    <span>Send Message</span>
                  </button>
                  <button
                    onClick={() => openBookingModal(match.user, match.user.skillsTeach[0]?.skill)}
                    className="flex-1 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow flex items-center justify-center gap-1.5"
                  >
                    <Calendar size={13} />
                    <span>Book Session</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recommended Learners Grid */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-slate-200 font-outfit flex items-center gap-2">
          📚 Recommended Learners <span className="text-xs text-purple-400 font-normal">(Users who want to learn what you teach)</span>
        </h2>
        {matches.learners.length === 0 ? (
          <div className="p-8 text-center text-slate-500 border border-dashed border-slate-850 rounded-2xl">
            Add skills you teach in the Skill Catalog to get recommended learners here!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {matches.learners.map((match) => (
              <div key={match.user._id} className="glass-panel p-6 rounded-3xl flex flex-col justify-between border-slate-850 hover:border-slate-800 transition-all shadow group">
                <div className="space-y-4">
                  {/* Score & Profile */}
                  <button type="button" onClick={() => openProfileModal(match.user._id)} className="flex w-full justify-between items-start text-left">
                    <div className="flex items-center gap-3">
                      <img src={match.user.profileImage} alt={match.user.name} className="w-11 h-11 rounded-xl bg-slate-850" />
                      <div>
                        <h4 className="font-bold text-xs text-slate-200 leading-none">{match.user.name}</h4>
                        <p className="mt-1 text-[10px] text-slate-500">@{match.user.username || 'username'}</p>
                        <span className="text-[9px] font-bold text-slate-500 border border-slate-800 bg-slate-900 px-1 py-0.2 rounded mt-1 inline-block">
                          {match.user.experienceLevel} Level
                        </span>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-purple-400 bg-purple-500/10 border border-purple-500/10 px-2 py-0.5 rounded-full">
                      {match.matchScore}% Match
                    </span>
                  </button>

                  <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">{match.user.bio}</p>
                  <div className="flex gap-4 text-[10px] font-bold uppercase text-slate-500">
                    <span>{match.user.followersCount || 0} Followers</span>
                    <span>{match.user.followingCount || 0} Following</span>
                  </div>
                  
                  {/* Skill matches list */}
                  <div className="space-y-1 pt-2">
                    <span className="text-[9px] uppercase font-bold text-slate-500">Wants to Learn:</span>
                    <div className="flex flex-wrap gap-1">
                      {match.user.skillsLearn.map((s, idx) => (
                        <span key={idx} className="text-[9px] bg-purple-500/10 border border-purple-500/20 text-purple-400 px-2 py-0.5 rounded-full font-medium">
                          {s.skill.name} ({s.level})
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Shared Interests */}
                  {match.sharedInterests.length > 0 && (
                    <div className="space-y-1">
                      <span className="text-[9px] uppercase font-bold text-slate-500">Shared Interests:</span>
                      <div className="flex flex-wrap gap-1">
                        {match.sharedInterests.map((interest, idx) => (
                          <span key={idx} className="text-[9px] bg-slate-900 border border-slate-800 text-slate-400 px-2 py-0.5 rounded-full font-medium">
                            {interest}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Actions console */}
                <div className="flex gap-2 pt-4 border-t border-slate-850 mt-6">
                  <button
                    onClick={() => handleToggleFollow(match.user._id)}
                    className="rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-200 text-xs font-bold transition-all flex items-center justify-center gap-1.5 px-3"
                  >
                    {match.user.isFollowing ? <UserCheck size={13} /> : <UserPlus size={13} />}
                  </button>
                  <button
                    onClick={() => handleStartChat(match.user)}
                    className="flex-1 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-200 text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                  >
                    <MessageSquare size={13} />
                    <span>Send Message invite</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Book Tutor Session Modal */}
      {bookingUser && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md glass-panel p-6 rounded-3xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-850 pb-2">
              <h3 className="font-bold text-slate-200">Book Skill Exchange Session</h3>
              <button onClick={() => setBookingUser(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            {bookMsg && (
              <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs rounded-xl flex items-center gap-2 animate-pulse">
                <CheckCircle size={14} />
                <span>{bookMsg}</span>
              </div>
            )}

            <form onSubmit={handleBookingSubmit} className="space-y-4">
              <div className="flex items-center gap-3 bg-slate-900/30 p-3 rounded-2xl border border-slate-850">
                <img src={bookingUser.profileImage} alt={bookingUser.name} className="w-10 h-10 rounded-xl bg-slate-850" />
                <div>
                  <h4 className="font-bold text-xs text-slate-200 leading-none">{bookingUser.name}</h4>
                  <p className="text-[10px] text-slate-500 mt-1">Book an exchange slot</p>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-slate-400 uppercase">Select Skill to Exchange</label>
                <select
                  required
                  value={bookingSkill}
                  onChange={(e) => setBookingSkill(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-400 text-xs outline-none"
                >
                  <option value="">Select a skill...</option>
                  {bookingUser.skillsTeach.map((s) => (
                    <option key={s.skill._id} value={s.skill._id}>
                      {s.skill.name} ({s.level})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-slate-400 uppercase">Date</label>
                  <input
                    type="date"
                    required
                    value={bookDate}
                    onChange={(e) => setBookDate(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-200 text-xs outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-slate-400 uppercase">Start Time</label>
                  <input
                    type="time"
                    required
                    value={bookTime}
                    onChange={(e) => setBookTime(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-200 text-xs outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-slate-400 uppercase">Session Duration</label>
                <select
                  value={bookDuration}
                  onChange={(e) => setBookDuration(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-400 text-xs outline-none"
                >
                  <option value={30}>30 minutes - no completion points</option>
                  <option value={60}>60 minutes - eligible for +50 points</option>
                  <option value={90}>90 minutes - eligible for +50 points</option>
                  <option value={120}>120 minutes - eligible for +50 points</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-slate-400 uppercase">Introduce Yourself (Custom Notes)</label>
                <textarea
                  value={bookNotes}
                  onChange={(e) => setBookNotes(e.target.value)}
                  placeholder="Tell them what concepts you want to learn..."
                  rows={2}
                  className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-200 text-xs outline-none focus:border-indigo-500"
                />
              </div>

              <button type="submit" className="w-full py-3 bg-indigo-600 rounded-xl font-bold text-white text-xs hover:bg-indigo-500 transition-all flex items-center justify-center gap-1.5 shadow">
                <Clock size={14} /> Send Session Request
              </button>
            </form>
          </div>
        </div>
      )}

      {(profileLoading || profileUser) && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-3xl glass-panel rounded-3xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-850 pb-3">
              <h3 className="font-bold text-slate-200">Full Profile</h3>
              <button type="button" onClick={() => setProfileUser(null)} className="rounded-lg p-1.5 text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            {profileLoading ? (
              <div className="py-16 text-center text-sm text-slate-500">Loading profile...</div>
            ) : profileUser && (
              <div className="space-y-6 pt-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex items-center gap-4">
                    <img src={profileUser.profileImage} alt={profileUser.name} className="h-16 w-16 rounded-xl bg-slate-850" />
                    <div>
                      <h2 className="text-xl font-extrabold text-slate-100">{profileUser.name}</h2>
                      <p className="text-xs text-slate-500">@{profileUser.username || 'username'} • {profileUser.experienceLevel} Level • {profileUser.points || 0} pts</p>
                      <div className="mt-2 flex gap-4 text-[10px] font-bold uppercase text-slate-500">
                        <span>{profileUser.followersCount || 0} Followers</span>
                        <span>{profileUser.followingCount || 0} Following</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleToggleFollow(profileUser._id)} className="btn-secondary min-h-0 px-4 py-2 text-xs">
                      {profileUser.isFollowing ? <UserCheck size={14} /> : <UserPlus size={14} />}
                      {profileUser.isFollowing ? 'Following' : 'Follow'}
                    </button>
                    <button onClick={() => handleStartChat(profileUser)} className="btn-primary min-h-0 px-4 py-2 text-xs">
                      <MessageSquare size={14} /> Message
                    </button>
                  </div>
                </div>

                <p className="text-sm leading-6 text-slate-400">{profileUser.bio || 'No bio added yet.'}</p>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2 rounded-xl border border-slate-850 p-4">
                    <h4 className="text-xs font-bold uppercase text-slate-500">Education</h4>
                    {renderEducation(profileUser.education).length === 0 ? (
                      <p className="text-xs text-slate-500">No education added.</p>
                    ) : renderEducation(profileUser.education).map((item, index) => (
                      <div key={index} className="text-xs text-slate-300">
                        <p className="font-bold">{item.degree || 'Qualification'}</p>
                        <p className="text-slate-500">{[item.institution, item.year].filter(Boolean).join(' • ')}</p>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-2 rounded-xl border border-slate-850 p-4">
                    <h4 className="text-xs font-bold uppercase text-slate-500">Links</h4>
                    <div className="flex flex-wrap gap-2">
                      {profileUser.socialLinks?.linkedin && <a href={profileUser.socialLinks.linkedin} target="_blank" rel="noreferrer" className="btn-secondary min-h-0 px-3 py-2 text-xs"><Briefcase size={13} /> LinkedIn</a>}
                      {profileUser.socialLinks?.github && <a href={profileUser.socialLinks.github} target="_blank" rel="noreferrer" className="btn-secondary min-h-0 px-3 py-2 text-xs"><GitBranch size={13} /> GitHub</a>}
                      {profileUser.socialLinks?.website && <a href={profileUser.socialLinks.website} target="_blank" rel="noreferrer" className="btn-secondary min-h-0 px-3 py-2 text-xs"><Globe size={13} /> Website</a>}
                      {profileUser.resumeFile && <a href={profileUser.resumeFile} target="_blank" rel="noreferrer" className="btn-secondary min-h-0 px-3 py-2 text-xs"><FileText size={13} /> Resume</a>}
                      {(profileUser.socialLinks?.extra || []).filter(link => link.url).map((link, index) => (
                        <a key={index} href={link.url} target="_blank" rel="noreferrer" className="btn-secondary min-h-0 px-3 py-2 text-xs">
                          <ExternalLink size={13} /> {link.label || 'Link'}
                        </a>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase text-slate-500">Selected Projects</h4>
                  {(profileUser.projects || []).filter(project => project.featured !== false).length === 0 ? (
                    <p className="rounded-xl border border-dashed border-slate-850 p-4 text-center text-xs text-slate-500">No projects selected yet.</p>
                  ) : (
                    <div className="grid gap-3 md:grid-cols-2">
                      {profileUser.projects.filter(project => project.featured !== false).map((project, index) => (
                        <div key={index} className="rounded-xl border border-slate-850 p-4">
                          <p className="font-bold text-sm text-slate-200">{project.title}</p>
                          <p className="mt-1 line-clamp-2 text-xs text-slate-500">{project.description}</p>
                          <div className="mt-3 flex flex-wrap gap-2">
                            {project.githubUrl && <a href={project.githubUrl} target="_blank" rel="noreferrer" className="text-xs font-bold text-indigo-400">GitHub</a>}
                            {project.liveUrl && <a href={project.liveUrl} target="_blank" rel="noreferrer" className="text-xs font-bold text-indigo-400">Live Site</a>}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AiMatches;
