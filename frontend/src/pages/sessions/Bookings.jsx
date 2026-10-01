import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import apiClient from '../../services/apiClient.js';
import { useSocket } from '../../context/SocketContext.jsx';
import {
  Calendar,
  Clock,
  Video,
  CheckCircle,
  XCircle,
  AlertCircle,
  Star,
  ExternalLink,
  Copy,
  Check,
  Link as LinkIcon,
  Play,
  Square,
  PlusCircle,
  X,
  MessageSquare
} from 'lucide-react';

const Bookings = () => {
  const { user, token } = useSelector((state) => state.auth);
  const { markNotificationsRead } = useSocket();

  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');
  const [copiedId, setCopiedId] = useState(null);

  // Meeting Link Modal State
  const [activeLinkSession, setActiveLinkSession] = useState(null);
  const [newMeetingLink, setNewMeetingLink] = useState('');
  const [newLinkProvider, setNewLinkProvider] = useState('Google Meet');

  // Rating/Review Modal State
  const [activeReviewSession, setActiveReviewSession] = useState(null);
  const [ratingVal, setRatingVal] = useState(5);
  const [feedbackVal, setFeedbackVal] = useState('');
  const [reviewMsg, setReviewMsg] = useState('');

  // Reschedule Modal State
  const [activeRescheduleSession, setActiveRescheduleSession] = useState(null);
  const [newDateVal, setNewDateVal] = useState('');
  const [newTimeVal, setNewTimeVal] = useState('');
  const [newDurationVal, setNewDurationVal] = useState(60);

  useEffect(() => {
    fetchSessionLogs();
    markNotificationsRead({ link: '/bookings' });
  }, [token]);

  const fetchSessionLogs = async () => {
    try {
      const res = await apiClient.get('/api/sessions/history');
      setSessions(res.data.sessions || []);
    } catch (err) {
      console.error('Error loading session histories:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSessionAction = async (sessionId, status, extraBody = {}) => {
    if (status === 'Cancelled' && !window.confirm('Cancel this session?')) return;

    try {
      await apiClient.put(`/api/sessions/${sessionId}/respond`, {
        status,
        ...extraBody
      });

      setMsg(`Session marked as ${status}!`);
      setTimeout(() => setMsg(''), 3500);
      fetchSessionLogs();
      setActiveRescheduleSession(null);
    } catch (err) {
      console.error('Error updating session action:', err);
      setMsg(err.response?.data?.message || 'Could not update session.');
      setTimeout(() => setMsg(''), 4500);
    }
  };

  const handleStartSession = async (sessionId) => {
    try {
      await apiClient.post(`/api/sessions/${sessionId}/start`);
      setMsg('Call started! Server is recording session time.');
      setTimeout(() => setMsg(''), 3500);
      fetchSessionLogs();
    } catch (err) {
      console.error('Error starting session call:', err);
    }
  };

  const handleEndSession = async (sessionId) => {
    try {
      const res = await apiClient.post(`/api/sessions/${sessionId}/end`);
      setMsg(res.data.message || 'Session ended.');
      setTimeout(() => setMsg(''), 4000);
      fetchSessionLogs();
    } catch (err) {
      console.error('Error ending session call:', err);
    }
  };

  const openLinkModal = (session) => {
    setActiveLinkSession(session);
    setNewMeetingLink(session.meetingLink || '');
    setNewLinkProvider(session.meetingLinkProvider || 'Google Meet');
  };

  const handleSaveMeetingLink = async (e) => {
    e.preventDefault();
    if (!newMeetingLink.trim()) {
      alert('Please enter a meeting link');
      return;
    }

    try {
      await apiClient.put(`/api/sessions/${activeLinkSession._id}/meeting-link`, {
        meetingLink: newMeetingLink.trim(),
        meetingLinkProvider: newLinkProvider
      });

      setMsg('Video call link updated successfully!');
      setTimeout(() => setMsg(''), 3500);
      setActiveLinkSession(null);
      fetchSessionLogs();
    } catch (err) {
      console.error('Error saving meeting link:', err);
      alert(err.response?.data?.message || 'Failed to update meeting link');
    }
  };

  const handleCopyLink = (link, id) => {
    if (!link) return;
    navigator.clipboard.writeText(link);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    setReviewMsg('');

    if (!activeReviewSession || !feedbackVal) return;

    try {
      await apiClient.post('/api/reviews', {
        sessionId: activeReviewSession._id,
        rating: ratingVal,
        feedback: feedbackVal
      });

      setReviewMsg('Review submitted successfully! Thank you.');
      setFeedbackVal('');
      setRatingVal(5);

      setTimeout(() => {
        setActiveReviewSession(null);
        setReviewMsg('');
        fetchSessionLogs();
      }, 1800);
    } catch (err) {
      console.error('Error writing review:', err);
      setReviewMsg('Error saving review. Please try again.');
    }
  };

  const initiateReschedule = (session) => {
    setActiveRescheduleSession(session);
    const startObj = new Date(session.startTime);
    const durationMinutes = Math.max(30, Math.round((new Date(session.endTime) - startObj) / 60000));
    setNewDateVal(startObj.toISOString().slice(0, 10));
    setNewTimeVal(startObj.toTimeString().slice(0, 5));
    setNewDurationVal(durationMinutes);
  };

  const handleRescheduleSubmit = (e) => {
    e.preventDefault();
    if (!newDateVal || !newTimeVal) return;

    const startDateTime = new Date(`${newDateVal}T${newTimeVal}:00`);
    const endDateTime = new Date(startDateTime.getTime() + Number(newDurationVal) * 60 * 1000);

    handleSessionAction(activeRescheduleSession._id, activeRescheduleSession.status, {
      startTime: startDateTime.toISOString(),
      endTime: endDateTime.toISOString()
    });
  };

  if (loading) {
    return (
      <div className="page-shell flex flex-col justify-center items-center h-screen text-app">
        <div className="w-12 h-12 rounded-full border-4 border-blue-500/20 border-t-blue-500 animate-spin" />
        <span className="text-sm font-medium text-muted mt-3">Loading session calendars...</span>
      </div>
    );
  }

  return (
    <div className="page-shell space-y-6 overflow-y-auto pb-32 sm:pb-20 animate-fade-in">
      {/* Header bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-[#22242a] p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-app tracking-tight flex items-center gap-2.5">
            <Calendar size={26} className="text-blue-500" />
            My Bookings & Study Calls
          </h1>
          <p className="text-xs sm:text-sm text-muted mt-1">
            Accept session bookings, share your meeting link, and track actual study duration
          </p>
        </div>

        {msg && (
          <span className="px-4 py-2 bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 text-blue-600 dark:text-blue-400 text-xs font-bold rounded-2xl animate-pulse">
            {msg}
          </span>
        )}
      </div>

      {/* Bookings stream grid */}
      {sessions.length === 0 ? (
        <div className="text-center py-20 text-muted border border-dashed border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-[#22242a]/50 rounded-3xl p-8 space-y-3">
          <Calendar size={36} className="mx-auto text-muted" />
          <p className="text-sm font-semibold text-app">No bookings scheduled yet.</p>
          <Link to="/ai-match" className="text-xs text-indigo-600 dark:text-indigo-400 font-bold hover:underline">
            Find peers in Suggested Users and book a session!
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sessions.map((session, idx) => {
            const isMentor = session.mentor?._id?.toString() === user?._id?.toString();
            const partner = (isMentor ? session.learner : session.mentor) || {
              _id: '',
              name: 'Orbitus Partner',
              profileImage: 'https://ui-avatars.com/api/?name=Orbitus+Partner&background=6366f1&color=fff'
            };
            const partnerProfileUrl = partner._id ? `/profile/${partner._id}` : '#';
            const status = session.status;

            let statusStyles = '';
            if (status === 'Completed') statusStyles = 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20';
            else if (status === 'Accepted') statusStyles = 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/20';
            else if (status === 'Pending') statusStyles = 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-400/10 border-amber-200 dark:border-amber-500/20';
            else if (status === 'Cancelled') statusStyles = 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/20';
            else statusStyles = 'text-muted bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700';

            const startObj = new Date(session.startTime);
            const canChangeTime = !['Completed', 'Rejected', 'Cancelled'].includes(status);
            const canCancel = !['Completed', 'Rejected', 'Cancelled'].includes(status);
            const hasMeetingLink = Boolean(session.meetingLink && session.meetingLink.trim());
            const hasStartedCall = Boolean(session.sessionStartedAt && !session.sessionEndedAt);
            const hasEndedCall = Boolean(session.sessionEndedAt);

            return (
              <div
                key={session._id}
                className={`bg-white dark:bg-[#181d26] border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 transition-all duration-300 hover:border-indigo-400/60 dark:hover:border-indigo-500/60 shadow-xs hover:shadow-md flex flex-col justify-between interactive-card animate-card-enter stagger-${(idx % 6) + 1} space-y-4 relative overflow-hidden group`}
              >
                {/* Header: Partner Avatar + Name + Role Badge & Status Pill */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <Link to={partnerProfileUrl} className="shrink-0 relative">
                      <img
                        src={partner.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(partner.name || 'User')}&background=6366f1&color=fff`}
                        alt={partner.name}
                        className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 object-cover border border-slate-200 dark:border-slate-700 shrink-0 group-hover:scale-105 transition-transform"
                      />
                      {hasStartedCall && (
                        <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white dark:border-[#181d26] animate-pulse" />
                      )}
                    </Link>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <Link
                          to={`/profile/${partner._id}`}
                          className="font-bold text-sm text-app hover:text-indigo-600 dark:hover:text-indigo-400 truncate font-outfit"
                        >
                          {partner.name}
                        </Link>
                        <span className="text-[9px] font-extrabold text-muted border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800/80 px-2 py-0.5 rounded-md uppercase">
                          {isMentor ? 'Learner' : 'Mentor'}
                        </span>
                      </div>
                      <p className="text-xs text-indigo-500 dark:text-indigo-400 font-semibold mt-0.5 truncate">
                        {session.skill?.name || 'Skill Exchange'}
                      </p>
                    </div>
                  </div>

                  {/* Status Pill */}
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold border ${statusStyles} uppercase shrink-0`}>
                    {status}
                  </span>
                </div>

                {/* Topic & Notes Section */}
                <div className="space-y-1.5 flex-1">
                  <h4 className="font-extrabold text-sm text-app font-outfit leading-snug line-clamp-2">
                    {session.topic || session.skill?.name || 'Skill Exchange Mentorship'}
                  </h4>
                  {session.notes && (
                    <p className="text-xs text-muted bg-slate-50 dark:bg-[#12161f] p-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 italic line-clamp-2">
                      "{session.notes}"
                    </p>
                  )}
                </div>

                {/* Schedule Info Box */}
                <div className="p-3.5 bg-slate-50 dark:bg-[#12161f] rounded-2xl border border-slate-200/80 dark:border-slate-800 text-xs space-y-2">
                  <div className="flex items-center justify-between text-app font-semibold">
                    <div className="flex items-center gap-1.5">
                      <Calendar size={13} className="text-indigo-500" />
                      <span>{startObj.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock size={13} className="text-indigo-500" />
                      <span>{startObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>

                  {/* Meeting Link Action */}
                  {['Pending', 'Accepted', 'Rescheduled'].includes(status) && (
                    <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 dark:border-slate-800/60 text-[11px]">
                      <span className="text-muted font-medium truncate">
                        {session.meetingLinkProvider || 'Google Meet'}
                      </span>
                      <button
                        onClick={() => openLinkModal(session)}
                        className="text-indigo-600 dark:text-indigo-400 hover:underline font-bold flex items-center gap-1 shrink-0"
                      >
                        <PlusCircle size={12} />
                        {hasMeetingLink ? 'Change Link' : 'Add Link'}
                      </button>
                    </div>
                  )}

                  {hasMeetingLink && status !== 'Cancelled' && status !== 'Completed' && (
                    <a
                      href={session.meetingLink}
                      target="_blank"
                      rel="noreferrer"
                      className="btn-primary w-full py-2 text-xs rounded-xl flex items-center justify-center gap-2 font-bold shadow-xs mt-1"
                    >
                      <Video size={13} />
                      <span>Join Live Video Session</span>
                    </a>
                  )}
                </div>

                {/* Duration stats */}
                {(session.actualDurationMinutes > 0 || hasEndedCall) && (
                  <div className="text-[11px] text-muted font-medium flex items-center justify-between px-1">
                    <span className="flex items-center gap-1">
                      <Clock size={12} className="text-indigo-500" /> Study Duration:
                    </span>
                    <span className="text-app font-bold">{session.actualDurationMinutes || 0} mins</span>
                  </div>
                )}

                {/* Card Actions Footer */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-2">
                  {/* Pending invites */}
                  {status === 'Pending' && isMentor && (
                    <div className="flex items-center gap-2 w-full">
                      <button
                        onClick={() => handleSessionAction(session._id, 'Accepted')}
                        className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition-all shadow-xs"
                      >
                        <CheckCircle size={13} /> Accept
                      </button>
                      <button
                        onClick={() => handleSessionAction(session._id, 'Rejected')}
                        className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-red-600/10 border border-red-500/20 text-red-500 hover:bg-red-500 hover:text-white text-xs font-bold rounded-xl transition-all"
                      >
                        <XCircle size={13} /> Reject
                      </button>
                    </div>
                  )}

                  {/* Timer start/end */}
                  {['Accepted', 'Rescheduled'].includes(status) && (
                    <div className="flex items-center gap-2 w-full">
                      {!hasStartedCall && !hasEndedCall && (
                        <button
                          onClick={() => handleStartSession(session._id)}
                          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-app text-xs font-bold rounded-xl transition-all"
                        >
                          <Play size={13} className="text-emerald-500" /> Start Call
                        </button>
                      )}
                      {hasStartedCall && (
                        <button
                          onClick={() => handleEndSession(session._id)}
                          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-red-600/20 hover:bg-red-600 text-red-500 hover:text-white text-xs font-bold rounded-xl transition-all"
                        >
                          <Square size={13} /> End Call
                        </button>
                      )}
                      {isMentor && (
                        <button
                          onClick={() => handleSessionAction(session._id, 'Completed')}
                          className="flex-1 flex items-center justify-center px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-xs transition-all"
                        >
                          Mark Complete
                        </button>
                      )}
                    </div>
                  )}

                  {/* Cancel, Change Time, Review */}
                  <div className="flex items-center gap-2 w-full justify-end">
                    {canChangeTime && (
                      <button
                        onClick={() => initiateReschedule(session)}
                        className="flex-1 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-app text-xs font-bold rounded-xl transition-all text-center"
                      >
                        Reschedule
                      </button>
                    )}
                    {canCancel && (
                      <button
                        onClick={() => handleSessionAction(session._id, 'Cancelled')}
                        className="flex-1 px-3 py-1.5 bg-red-600/10 border border-red-500/20 text-red-500 hover:bg-red-500 hover:text-white text-xs font-bold rounded-xl transition-all text-center"
                      >
                        Cancel
                      </button>
                    )}
                    {status === 'Completed' && !isMentor && (
                      <button
                        onClick={() => setActiveReviewSession(session)}
                        className="w-full flex items-center justify-center gap-1.5 px-4 py-2 bg-amber-500/10 border border-amber-500/20 text-amber-500 hover:bg-amber-500 hover:text-white text-xs font-bold rounded-xl transition-all"
                      >
                        <Star size={13} /> Write Review
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Meeting Link Update Modal */}
      {activeLinkSession && (
        <div role="dialog" data-modal="true" className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white dark:bg-[#22242a] p-5 sm:p-6 rounded-3xl space-y-4 border border-slate-200 dark:border-slate-800 shadow-2xl text-app max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-app text-sm flex items-center gap-2">
                <Video size={16} className="text-blue-500" />
                Add / Update Video Call Link
              </h3>
              <button onClick={() => setActiveLinkSession(null)} className="text-muted hover:text-app">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveMeetingLink} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-muted uppercase">Calling Platform</label>
                <select
                  value={newLinkProvider}
                  onChange={(e) => setNewLinkProvider(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-[#12161f] border border-slate-200 dark:border-slate-800 rounded-xl text-app outline-none focus:border-blue-500"
                >
                  <option value="Google Meet">Google Meet</option>
                  <option value="Zoom">Zoom</option>
                  <option value="Microsoft Teams">Microsoft Teams</option>
                  <option value="Discord">Discord</option>
                  <option value="Custom Link">Custom Link / Other</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-muted uppercase">Meeting URL *</label>
                <input
                  type="url"
                  required
                  placeholder="https://meet.google.com/abc-defg-hij"
                  value={newMeetingLink}
                  onChange={(e) => setNewMeetingLink(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-[#12161f] border border-slate-200 dark:border-slate-800 rounded-xl text-app outline-none focus:border-blue-500"
                />
              </div>

              <button
                type="submit"
                className="btn-primary w-full py-3 text-xs"
              >
                Save Video Call Link
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Review Modal */}
      {activeReviewSession && (
        <div role="dialog" data-modal="true" className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white dark:bg-[#22242a] p-5 sm:p-6 rounded-3xl space-y-4 border border-slate-200 dark:border-slate-800 shadow-2xl text-app max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-app text-sm">Rate Learning Mentor</h3>
              <button onClick={() => setActiveReviewSession(null)} className="text-muted hover:text-app">
                <X size={18} />
              </button>
            </div>

            {reviewMsg && (
              <div className="p-3 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs rounded-xl flex items-center gap-2">
                <CheckCircle size={15} />
                <span>{reviewMsg}</span>
              </div>
            )}

            <form onSubmit={handleReviewSubmit} className="space-y-4 text-xs">
              <div className="flex flex-col items-center gap-2 py-3">
                <span className="text-[10px] uppercase font-bold text-muted">Rating (1 to 5 stars)</span>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRatingVal(star)}
                      className={`text-2xl transition-transform active:scale-125 ${
                        star <= ratingVal ? 'text-amber-400' : 'text-slate-300 dark:text-slate-700'
                      }`}
                    >
                      ★
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-muted uppercase">Write Review Feedback</label>
                <textarea
                  required
                  rows={3}
                  value={feedbackVal}
                  onChange={(e) => setFeedbackVal(e.target.value)}
                  placeholder="Share how this study session helped you..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-[#12161f] border border-slate-200 dark:border-slate-800 rounded-xl text-app outline-none focus:border-blue-500"
                />
              </div>

              <button
                type="submit"
                className="btn-primary w-full py-3 text-xs"
              >
                Publish Review Rating
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Reschedule Modal */}
      {activeRescheduleSession && (
        <div role="dialog" data-modal="true" className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-white dark:bg-[#22242a] p-5 sm:p-6 rounded-3xl space-y-4 border border-slate-200 dark:border-slate-800 shadow-2xl text-app max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-app text-sm">Reschedule Session</h3>
              <button onClick={() => setActiveRescheduleSession(null)} className="text-muted hover:text-app">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleRescheduleSubmit} className="space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted uppercase">Select New Date</label>
                <input
                  type="date"
                  required
                  value={newDateVal}
                  onChange={(e) => setNewDateVal(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-[#12161f] border border-slate-200 dark:border-slate-800 rounded-xl text-app outline-none focus:border-blue-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted uppercase">Select Start Time</label>
                <input
                  type="time"
                  required
                  value={newTimeVal}
                  onChange={(e) => setNewTimeVal(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-[#12161f] border border-slate-200 dark:border-slate-800 rounded-xl text-app outline-none focus:border-blue-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted uppercase">Session Duration</label>
                <select
                  value={newDurationVal}
                  onChange={(e) => setNewDurationVal(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-[#12161f] border border-slate-200 dark:border-slate-800 rounded-xl text-app outline-none focus:border-blue-500"
                >
                  <option value={30}>30 minutes</option>
                  <option value={60}>60 minutes</option>
                  <option value={90}>90 minutes</option>
                  <option value={120}>120 minutes</option>
                </select>
              </div>

              <button
                type="submit"
                className="btn-primary w-full py-3 text-xs"
              >
                Propose New Time Slot
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Bookings;
