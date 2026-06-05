import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
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
  MessageSquare,
  HelpCircle
} from 'lucide-react';

const Bookings = () => {
  const { user, token } = useSelector((state) => state.auth);
  const { markNotificationsRead } = useSocket();
  
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');
  
  // Jitsi Call Modal State
  const [activeCallRoom, setActiveCallRoom] = useState(null); // jitsiRoomId
  
  // Rating/Review Modal State
  const [activeReviewSession, setActiveReviewSession] = useState(null); // sessionObj
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
      setSessions(res.data.sessions);
    } catch (err) {
      console.error('Error loading session histories:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSessionAction = async (sessionId, status, extraBody = {}) => {
    try {
      const res = await apiClient.put(`/api/sessions/${sessionId}/respond`, {
        status,
        ...extraBody
      });
      
      setMsg(`Session marked as ${status}!`);
      setTimeout(() => setMsg(''), 3000);
      fetchSessionLogs();
      
      // Close reschedule modal if open
      setActiveRescheduleSession(null);
    } catch (err) {
      console.error('Error executing session action:', err);
      setMsg(err.response?.data?.message || 'Could not update session.');
      setTimeout(() => setMsg(''), 4000);
    }
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

      setReviewMsg('Review submitted successfully! Thank you for your feedback.');
      setFeedbackVal('');
      setRatingVal(5);
      
      setTimeout(() => {
        setActiveReviewSession(null);
        setReviewMsg('');
        fetchSessionLogs();
      }, 2000);
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
      <div className="flex-1 p-8 space-y-6 flex flex-col justify-center items-center h-screen bg-slate-950 text-slate-100">
        <div className="w-12 h-12 rounded-full border-4 border-indigo-500/20 border-t-indigo-500 animate-spin" />
        <span className="text-sm font-medium text-slate-400">Loading session calendars...</span>
      </div>
    );
  }

  return (
    <div className="flex-1 p-6 lg:p-8 space-y-8 bg-slate-950 min-h-screen text-slate-200 overflow-y-auto">
      {/* Header bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-r from-slate-900/60 to-slate-900/60 p-6 rounded-3xl border border-slate-800/60 backdrop-blur-md">
        <div>
          <h1 className="text-2xl lg:text-3xl font-extrabold text-white font-outfit tracking-tight flex items-center gap-2">
            Skill Exchanges
          </h1>
          <p className="text-sm text-slate-400 mt-1">Accept bookings, view history, and launch video classrooms</p>
        </div>
        {msg && (
          <span className="px-4 py-2 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold rounded-2xl animate-pulse">
            {msg}
          </span>
        )}
      </div>

      {/* Bookings stream */}
      {sessions.length === 0 ? (
        <div className="text-center py-20 text-slate-500 border border-dashed border-slate-850 rounded-3xl">
          No bookings scheduled yet. Match with tutors in AI Matches and book a session!
        </div>
      ) : (
        <div className="space-y-4">
          {sessions.map((session) => {
            const isMentor = session.mentor._id.toString() === user._id.toString();
            const partner = isMentor ? session.learner : session.mentor;
            const status = session.status;
            
            let statusStyles = '';
            if (status === 'Completed') statusStyles = 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
            else if (status === 'Accepted') statusStyles = 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20 animate-pulse';
            else if (status === 'Pending') statusStyles = 'text-amber-400 bg-amber-400/10 border-amber-500/20';
            else statusStyles = 'text-slate-400 bg-slate-900 border-slate-800';

            const startObj = new Date(session.startTime);
            const canChangeTime = !['Completed', 'Rejected', 'Cancelled'].includes(status);

            return (
              <div key={session._id} className="glass-panel p-6 rounded-3xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-slate-850 hover:border-slate-800 transition-all">
                {/* User card details */}
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <img src={partner.profileImage} alt={partner.name} className="w-12 h-12 rounded-xl bg-slate-850 flex-shrink-0" />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-sm text-slate-200 truncate">{partner.name}</h4>
                      <span className="text-[9px] font-bold text-slate-500 border border-slate-800 bg-slate-900 px-1.5 py-0.2 rounded uppercase">
                        {isMentor ? 'Learner' : 'Mentor'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1 truncate">Topic: <span className="font-semibold text-slate-200">{session.skill?.name || 'MERN Stack'}</span></p>
                    {session.notes && <p className="text-[10px] text-slate-500 italic mt-2 line-clamp-1">"{session.notes}"</p>}
                  </div>
                </div>

                {/* Date & Timings */}
                <div className="flex flex-col gap-1.5 text-xs text-slate-400">
                  <div className="flex items-center gap-2">
                    <Calendar size={14} className="text-indigo-400" />
                    <span>{startObj.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock size={14} className="text-indigo-400" />
                    <span>
                      {startObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      {' '}({Math.round((new Date(session.endTime) - startObj) / 60000)} min)
                    </span>
                  </div>
                </div>

                {/* Status Indicator */}
                <span className={`px-3 py-1 rounded-full text-[10px] font-bold border ${statusStyles} uppercase`}>
                  {status}
                </span>

                {/* Control Action Buttons */}
                <div className="flex items-center gap-2 mt-4 md:mt-0 flex-shrink-0">
                  {status === 'Pending' && isMentor && (
                    <>
                      <button
                        onClick={() => handleSessionAction(session._id, 'Accepted')}
                        className="p-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl transition-all shadow"
                        title="Accept Invite"
                      >
                        <CheckCircle size={16} />
                      </button>
                      <button
                        onClick={() => handleSessionAction(session._id, 'Rejected')}
                        className="p-2.5 bg-red-600/10 border border-red-500/20 text-red-400 hover:bg-red-500 hover:text-white rounded-xl transition-all"
                        title="Reject Invite"
                      >
                        <XCircle size={16} />
                      </button>
                    </>
                  )}

                  {['Accepted', 'Rescheduled'].includes(status) && (
                    <>
                      {/* Live Video camera triggers */}
                      <button
                        onClick={() => setActiveCallRoom(session.jitsiRoomId)}
                        className="flex items-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold rounded-xl shadow transition-all animate-pulse"
                      >
                        <Video size={14} />
                        <span>Join Call</span>
                      </button>

                      {/* Complete buttons */}
                      {isMentor ? (
                        <button
                          onClick={() => handleSessionAction(session._id, 'Completed')}
                          className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow transition-all"
                        >
                          Mark Complete
                        </button>
                      ) : null}
                    </>
                  )}

                  {canChangeTime && (
                    <button
                      onClick={() => initiateReschedule(session)}
                      className="px-4 py-2.5 bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800 text-xs font-bold rounded-xl transition-all"
                    >
                      Change Time
                    </button>
                  )}

                  {status === 'Completed' && !isMentor && (
                    <button
                      onClick={() => setActiveReviewSession(session)}
                      className="flex items-center gap-1 px-4 py-2.5 bg-amber-500/10 border border-amber-500/20 text-amber-400 hover:bg-amber-500 hover:text-white text-xs font-bold rounded-xl transition-all"
                    >
                      <Star size={14} /> Write Review
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Embedded Jitsi Meeting Frame Modal */}
      {activeCallRoom && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-5xl h-[80vh] glass-panel rounded-3xl overflow-hidden flex flex-col">
            <div className="p-4 border-b border-slate-850 flex justify-between items-center bg-slate-900">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <h3 className="font-bold text-slate-200 text-sm">Interactive Skill Exchange Room</h3>
              </div>
              <button
                onClick={() => setActiveCallRoom(null)}
                className="px-4 py-1.5 bg-red-600 hover:bg-red-500 rounded-lg text-xs font-semibold text-white transition-colors"
              >
                Close Meeting
              </button>
            </div>
            
            {/* Embed Jitsi API Client in standard frame */}
            <div className="flex-1 bg-slate-950 relative">
              <iframe
                src={`https://meet.jit.si/${activeCallRoom}#config.prejoinPageEnabled=false&interfaceConfig.TOOLBAR_BUTTONS=["microphone","camera","closedcaptions","desktop","fullscreen","fodeviceselection","hangup","profile","chat","recording","livestreaming","etherpad","sharedvideo","settings","raisehand","videoquality","filmstrip","invite","feedback","stats","shortcuts","tileview","videobackgroundblur","download","help","mute-everyone","security"]`}
                allow="camera; microphone; fullscreen; display-capture; autoplay"
                className="w-full h-full border-0"
                title="Jitsi Video Exchange Frame"
              />
            </div>
          </div>
        </div>
      )}

      {/* Review Ratings dialog */}
      {activeReviewSession && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md glass-panel p-6 rounded-3xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-850 pb-2">
              <h3 className="font-bold text-slate-200">Rate Exchange Mentor</h3>
              <button onClick={() => setActiveReviewSession(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            {reviewMsg && (
              <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs rounded-xl flex items-center gap-2">
                <CheckCircle size={14} />
                <span>{reviewMsg}</span>
              </div>
            )}

            <form onSubmit={handleReviewSubmit} className="space-y-4">
              <div className="flex flex-col items-center gap-2 py-4">
                <span className="text-[10px] uppercase font-bold text-slate-500">Overall Rating (1-5 stars)</span>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRatingVal(star)}
                      className={`text-2xl transition-transform active:scale-125 ${
                        star <= ratingVal ? 'text-amber-400' : 'text-slate-700'
                      }`}
                    >
                      ★
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-semibold text-slate-400 uppercase">Write Review Feedback</label>
                <textarea
                  required
                  rows={3}
                  value={feedbackVal}
                  onChange={(e) => setFeedbackVal(e.target.value)}
                  placeholder="Tell others how this session helped you understand..."
                  className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-200 text-xs outline-none focus:border-indigo-500"
                />
              </div>

              <button type="submit" className="w-full py-3 bg-indigo-600 rounded-xl font-bold text-white text-xs hover:bg-indigo-500 transition-all">
                Publish Review Rating
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Reschedule Booking dialog */}
      {activeRescheduleSession && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-sm glass-panel p-6 rounded-3xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-850 pb-2">
              <h3 className="font-bold text-slate-200">Reschedule Session</h3>
              <button onClick={() => setActiveRescheduleSession(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleRescheduleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-semibold text-slate-400 uppercase">Select New Date</label>
                <input
                  type="date"
                  required
                  value={newDateVal}
                  onChange={(e) => setNewDateVal(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-200 text-xs outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-semibold text-slate-400 uppercase">Select Start Time</label>
                <input
                  type="time"
                  required
                  value={newTimeVal}
                  onChange={(e) => setNewTimeVal(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-200 text-xs outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-semibold text-slate-400 uppercase">Session Duration</label>
                <select
                  value={newDurationVal}
                  onChange={(e) => setNewDurationVal(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-200 text-xs outline-none"
                >
                  <option value={30}>30 minutes - no completion points</option>
                  <option value={60}>60 minutes - eligible for +50 points</option>
                  <option value={90}>90 minutes - eligible for +50 points</option>
                  <option value={120}>120 minutes - eligible for +50 points</option>
                </select>
              </div>

              <button type="submit" className="w-full py-3 bg-indigo-600 rounded-xl font-bold text-white text-xs hover:bg-indigo-500 transition-all">
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
