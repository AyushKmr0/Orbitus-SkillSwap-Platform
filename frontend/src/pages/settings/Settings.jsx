import React, { useMemo, useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../services/apiClient.js';
import {
  AlertTriangle,
  Trash2,
  MessageSquare,
  Star,
  Send,
  Bell,
  Shield,
  Download,
  Check,
  Sparkles,
  HelpCircle,
  CheckCircle,
  Clock,
  Volume2,
  Mail,
  Eye,
  CheckCheck,
  RefreshCw,
  FolderDown
} from 'lucide-react';
import { playNotificationChime } from '../../context/SocketContext.jsx';
import { logout } from '../../features/authSlice.js';

const SETTING_TABS = [
  { id: 'feedback', label: 'Feedback & Support', icon: MessageSquare },
  { id: 'notifications', label: 'Notifications & Sound', icon: Bell },
  { id: 'privacy', label: 'Privacy & Presence', icon: Shield },
  { id: 'account', label: 'Account & Danger Zone', icon: Trash2 }
];

const FEEDBACK_CATEGORIES = [
  'Platform Feedback',
  'Bug Report',
  'Feature Request',
  'Support / Help',
  'Other'
];

const Settings = () => {
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('feedback');

  // ── 1. Feedback State ─────────────────────────────────────────────────────
  const [feedbackCategory, setFeedbackCategory] = useState('Platform Feedback');
  const [feedbackRating, setFeedbackRating] = useState(5);
  const [feedbackSubject, setFeedbackSubject] = useState('');
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
  const [feedbackSuccess, setFeedbackSuccess] = useState('');
  const [feedbackError, setFeedbackError] = useState('');
  const [myFeedbacks, setMyFeedbacks] = useState([]);
  const [loadingFeedbacks, setLoadingFeedbacks] = useState(false);

  // ── 2. Notification Preferences State ─────────────────────────────────────
  const [notifSound, setNotifSound] = useState(() => localStorage.getItem('orbitus_pref_sound') !== 'false');
  const [emailAlerts, setEmailAlerts] = useState(() => localStorage.getItem('orbitus_pref_email') !== 'false');
  const [sessionReminders, setSessionReminders] = useState(() => localStorage.getItem('orbitus_pref_reminders') !== 'false');

  // ── 3. Privacy Preferences State ──────────────────────────────────────────
  const [showOnlineStatus, setShowOnlineStatus] = useState(() => localStorage.getItem('orbitus_pref_online') !== 'false');
  const [readReceipts, setReadReceipts] = useState(() => localStorage.getItem('orbitus_pref_receipts') !== 'false');
  const [aiRecommendations, setAiRecommendations] = useState(() => localStorage.getItem('orbitus_pref_ai') !== 'false');

  // ── 4. Delete Account State ───────────────────────────────────────────────
  const [confirmUsername, setConfirmUsername] = useState('');
  const [deleteStatus, setDeleteStatus] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const normalizedConfirm = confirmUsername.trim().toLowerCase();
  const canDelete = useMemo(() => normalizedConfirm === user?.username?.toLowerCase(), [normalizedConfirm, user?.username]);

  // Load user's previous feedbacks when feedback tab is active
  useEffect(() => {
    if (activeTab === 'feedback') {
      fetchUserFeedbacks();
    }
  }, [activeTab]);

  const fetchUserFeedbacks = async () => {
    setLoadingFeedbacks(true);
    try {
      const res = await apiClient.get('/api/feedback/my');
      setMyFeedbacks(res.data.feedbacks || []);
    } catch {
      // Non-blocking
    } finally {
      setLoadingFeedbacks(false);
    }
  };

  const handleSubmitFeedback = async (e) => {
    e.preventDefault();
    if (!feedbackMessage.trim()) return;

    setSubmittingFeedback(true);
    setFeedbackError('');
    setFeedbackSuccess('');
    try {
      const res = await apiClient.post('/api/feedback', {
        category: feedbackCategory,
        rating: feedbackRating,
        subject: feedbackSubject.trim(),
        message: feedbackMessage.trim()
      });

      setFeedbackSuccess(res.data.message || 'Feedback sent directly to admin!');
      setFeedbackSubject('');
      setFeedbackMessage('');
      setFeedbackRating(5);
      fetchUserFeedbacks();
      setTimeout(() => setFeedbackSuccess(''), 5000);
    } catch (err) {
      setFeedbackError(err.response?.data?.message || 'Failed to submit feedback.');
    } finally {
      setSubmittingFeedback(false);
    }
  };

  // Notification toggles
  const handleToggleSound = (val) => {
    setNotifSound(val);
    localStorage.setItem('orbitus_pref_sound', String(val));
  };
  const handleToggleEmail = (val) => {
    setEmailAlerts(val);
    localStorage.setItem('orbitus_pref_email', String(val));
  };
  const handleToggleReminders = (val) => {
    setSessionReminders(val);
    localStorage.setItem('orbitus_pref_reminders', String(val));
  };

  // Privacy toggles
  const handleToggleOnline = (val) => {
    setShowOnlineStatus(val);
    localStorage.setItem('orbitus_pref_online', String(val));
  };
  const handleToggleReceipts = (val) => {
    setReadReceipts(val);
    localStorage.setItem('orbitus_pref_receipts', String(val));
  };
  const handleToggleAi = (val) => {
    setAiRecommendations(val);
    localStorage.setItem('orbitus_pref_ai', String(val));
  };

  // Export Data Download
  const handleExportData = () => {
    const dataToExport = {
      exportDate: new Date().toISOString(),
      platform: 'Orbitus SkillSwap Platform',
      user: {
        id: user?._id,
        name: user?.name,
        username: user?.username,
        email: user?.email,
        bio: user?.bio,
        role: user?.role,
        points: user?.points,
        skillsTeach: user?.skillsTeach,
        skillsLearn: user?.skillsLearn,
        createdAt: user?.createdAt
      },
      preferences: {
        notifications: { sound: notifSound, email: emailAlerts, reminders: sessionReminders },
        privacy: { onlineStatus: showOnlineStatus, readReceipts, aiRecommendations }
      }
    };

    const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `orbitus-user-data-${user?.username || 'me'}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Delete Account
  const requestDeleteAccount = () => {
    if (!canDelete || deleting) return;
    setShowDeleteModal(true);
  };

  const confirmDeleteAccount = async () => {
    setShowDeleteModal(false);
    setDeleting(true);
    setDeleteStatus('');
    try {
      await apiClient.delete('/api/users/account', {
        data: { username: confirmUsername }
      });
      dispatch(logout());
      navigate('/login', { replace: true });
    } catch (err) {
      setDeleteStatus(err.response?.data?.message || 'Account delete failed. Please try again.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="page-shell animate-fade-in pb-12">
      <div className="mx-auto max-w-4xl space-y-6">
        {/* Header */}
        <div className="page-header">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-app">Settings & Preferences</h1>
            <p className="mt-1 text-xs sm:text-sm text-muted">
              Customize your learning experience, send direct feedback to platform admins, and manage security.
            </p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none border-b border-slate-200 dark:border-slate-800">
          {SETTING_TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all shrink-0 ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-white dark:bg-[#22242a] border border-slate-200 dark:border-slate-800 text-muted hover:text-app'
                }`}
              >
                <Icon size={14} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* ── TAB 1: FEEDBACK & SUPPORT ────────────────────────────────────── */}
        {activeTab === 'feedback' && (
          <div className="space-y-6 animate-fade-in">
            {/* Feedback Form Card */}
            <section className="bg-white dark:bg-[#22242a] border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-7 space-y-5 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="rounded-2xl bg-indigo-500/10 p-3 text-indigo-600 dark:text-indigo-400 shrink-0">
                  <Sparkles size={22} />
                </div>
                <div>
                  <h2 className="text-base font-bold text-app font-outfit">Send Feedback Direct to Admin</h2>
                  <p className="mt-1 text-xs text-muted leading-relaxed">
                    Have a feature idea, found a bug, or want improvements? Submit it here, the platform admin team reviews every submission.
                  </p>
                </div>
              </div>

              {feedbackSuccess && (
                <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 rounded-2xl text-xs font-bold flex items-center gap-2">
                  <CheckCircle size={16} className="text-emerald-500 shrink-0" />
                  <span>{feedbackSuccess}</span>
                </div>
              )}

              {feedbackError && (
                <div className="p-3.5 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 rounded-2xl text-xs font-semibold">
                  {feedbackError}
                </div>
              )}

              <form onSubmit={handleSubmitFeedback} className="space-y-4 text-xs">
                {/* Category & Rating */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-muted uppercase tracking-wider">
                      Feedback Type
                    </label>
                    <select
                      value={feedbackCategory}
                      onChange={(e) => setFeedbackCategory(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#15171e] border border-slate-200 dark:border-slate-700 text-app outline-none focus:border-indigo-500 font-medium"
                    >
                      {FEEDBACK_CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-muted uppercase tracking-wider">
                      Overall Experience Rating
                    </label>
                    <div className="flex items-center gap-1.5 py-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setFeedbackRating(star)}
                          className="p-1 transition-transform hover:scale-125"
                          title={`${star} star${star > 1 ? 's' : ''}`}
                        >
                          <Star
                            size={20}
                            className={
                              star <= feedbackRating
                                ? 'text-amber-400 fill-amber-400'
                                : 'text-slate-300 dark:text-slate-700'
                            }
                          />
                        </button>
                      ))}
                      <span className="text-xs font-bold text-muted ml-2">
                        {feedbackRating} / 5
                      </span>
                    </div>
                  </div>
                </div>

                {/* Subject */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-muted uppercase tracking-wider">
                    Subject / Title
                  </label>
                  <input
                    type="text"
                    value={feedbackSubject}
                    onChange={(e) => setFeedbackSubject(e.target.value)}
                    placeholder="e.g. Add dark mode toggle in code blocks, Chat room suggestion..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#15171e] border border-slate-200 dark:border-slate-700 text-app outline-none focus:border-indigo-500"
                  />
                </div>

                {/* Message */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-muted uppercase tracking-wider">
                    Detailed Message & Suggestions <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={feedbackMessage}
                    onChange={(e) => setFeedbackMessage(e.target.value)}
                    placeholder="Describe your feedback, bug details, or idea in detail..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#15171e] border border-slate-200 dark:border-slate-700 text-app outline-none focus:border-indigo-500 resize-none"
                  />
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={submittingFeedback || !feedbackMessage.trim()}
                    className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold transition-all shadow-sm flex items-center gap-2 disabled:opacity-50 active:scale-95"
                  >
                    <Send size={14} />
                    <span>{submittingFeedback ? 'Submitting...' : 'Submit to Admin'}</span>
                  </button>
                </div>
              </form>
            </section>

            {/* Previous Feedbacks History */}
            <section className="bg-white dark:bg-[#22242a] border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-7 space-y-4 shadow-sm">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-app font-outfit flex items-center gap-2">
                  <Clock size={16} className="text-muted" />
                  Your Previous Submissions
                </h3>
                <button
                  type="button"
                  onClick={fetchUserFeedbacks}
                  className="p-1.5 rounded-lg text-muted hover:text-app hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  title="Refresh feedback history"
                >
                  <RefreshCw size={13} className={loadingFeedbacks ? 'animate-spin' : ''} />
                </button>
              </div>

              {loadingFeedbacks ? (
                <div className="py-6 text-center text-xs text-muted">Loading your past feedback...</div>
              ) : myFeedbacks.length === 0 ? (
                <div className="py-8 text-center text-xs text-muted border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                  You haven't submitted any feedback yet. Your feedback helps improve Orbitus!
                </div>
              ) : (
                <div className="space-y-3">
                  {myFeedbacks.map((fb) => (
                    <div
                      key={fb._id}
                      className="p-4 rounded-2xl bg-slate-50 dark:bg-[#15171e] border border-slate-200 dark:border-slate-800 space-y-2"
                    >
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-0.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 text-[10px] font-bold">
                            {fb.category}
                          </span>
                          <span className="text-xs font-bold text-app">
                            {fb.subject || 'Platform Feedback'}
                          </span>
                        </div>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase ${
                            fb.status === 'resolved'
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                              : fb.status === 'reviewed'
                              ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20'
                              : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                          }`}
                        >
                          {fb.status === 'resolved' ? 'Resolved' : fb.status === 'reviewed' ? 'Reviewed' : 'Pending Admin Review'}
                        </span>
                      </div>
                      <p className="text-xs text-muted leading-relaxed whitespace-pre-line">
                        {fb.message}
                      </p>
                      {fb.adminNotes && (
                        <div className="p-2.5 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40 text-[11px] text-indigo-700 dark:text-indigo-300">
                          <strong>Admin Response:</strong> {fb.adminNotes}
                        </div>
                      )}
                      <div className="flex justify-between items-center text-[10px] text-muted pt-1 border-t border-slate-200 dark:border-slate-800">
                        <span>Submitted on {new Date(fb.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                        <span>Rating: {'⭐'.repeat(fb.rating || 5)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}

        {/* ── TAB 2: NOTIFICATIONS & SOUND ─────────────────────────────────── */}
        {activeTab === 'notifications' && (
          <div className="space-y-6 animate-fade-in">
            <section className="bg-white dark:bg-[#22242a] border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-7 space-y-6 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="rounded-2xl bg-blue-500/10 p-3 text-blue-600 shrink-0">
                  <Bell size={22} />
                </div>
                <div>
                  <h2 className="text-base font-bold text-app font-outfit">Notification Preferences</h2>
                  <p className="mt-1 text-xs text-muted leading-relaxed">
                    Manage how and when Orbitus alerts you about messages, study calls, and community posts.
                  </p>
                </div>
              </div>

              <div className="space-y-4 text-xs divide-y divide-slate-100 dark:divide-slate-800">
                <div className="flex items-center justify-between pt-3">
                  <div className="space-y-0.5">
                    <p className="font-bold text-app flex items-center gap-1.5">
                      <Volume2 size={14} className="text-indigo-600" />
                      Chat Sound Effects
                    </p>
                    <p className="text-muted text-[11px]">Play audio tones when new direct or group messages arrive.</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={playNotificationChime}
                      className="px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 text-[11px] font-bold hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors shadow-xs"
                      title="Test Audio Tone"
                    >
                      🔊 Test Sound
                    </button>
                    <input
                      type="checkbox"
                      checked={notifSound}
                      onChange={(e) => handleToggleSound(e.target.checked)}
                      className="w-5 h-5 accent-indigo-600 rounded cursor-pointer"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4">
                  <div className="space-y-0.5">
                    <p className="font-bold text-app flex items-center gap-1.5">
                      <Mail size={14} className="text-emerald-600" />
                      Email Alerts for Sessions
                    </p>
                    <p className="text-muted text-[11px]">Receive email notifications when peers request or confirm swap sessions.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={emailAlerts}
                    onChange={(e) => handleToggleEmail(e.target.checked)}
                    className="w-5 h-5 accent-indigo-600 rounded cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between pt-4">
                  <div className="space-y-0.5">
                    <p className="font-bold text-app flex items-center gap-1.5">
                      <Clock size={14} className="text-purple-600" />
                      Upcoming Session Reminders
                    </p>
                    <p className="text-muted text-[11px]">Get alerted 15 minutes before your scheduled video meetings start.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={sessionReminders}
                    onChange={(e) => handleToggleReminders(e.target.checked)}
                    className="w-5 h-5 accent-indigo-600 rounded cursor-pointer"
                  />
                </div>
              </div>
            </section>
          </div>
        )}

        {/* ── TAB 3: PRIVACY & PRESENCE ────────────────────────────────────── */}
        {activeTab === 'privacy' && (
          <div className="space-y-6 animate-fade-in">
            <section className="bg-white dark:bg-[#22242a] border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-7 space-y-6 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="rounded-2xl bg-emerald-500/10 p-3 text-emerald-600 shrink-0">
                  <Shield size={22} />
                </div>
                <div>
                  <h2 className="text-base font-bold text-app font-outfit">Privacy & Presence</h2>
                  <p className="mt-1 text-xs text-muted leading-relaxed">
                    Control your visibility, active status, and how peers connect with you.
                  </p>
                </div>
              </div>

              <div className="space-y-4 text-xs divide-y divide-slate-100 dark:divide-slate-800">
                <div className="flex items-center justify-between pt-3">
                  <div className="space-y-0.5">
                    <p className="font-bold text-app flex items-center gap-1.5">
                      <Eye size={14} className="text-indigo-600" />
                      Show Online Status
                    </p>
                    <p className="text-muted text-[11px]">Allow peers to see when you are currently online and available to study.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={showOnlineStatus}
                    onChange={(e) => handleToggleOnline(e.target.checked)}
                    className="w-5 h-5 accent-indigo-600 rounded cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between pt-4">
                  <div className="space-y-0.5">
                    <p className="font-bold text-app flex items-center gap-1.5">
                      <CheckCheck size={14} className="text-blue-500" />
                      Read Receipts (Double Blue Ticks)
                    </p>
                    <p className="text-muted text-[11px]">Show others when you have read their messages in direct conversations.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={readReceipts}
                    onChange={(e) => handleToggleReceipts(e.target.checked)}
                    className="w-5 h-5 accent-indigo-600 rounded cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between pt-4">
                  <div className="space-y-0.5">
                    <p className="font-bold text-app flex items-center gap-1.5">
                      <Sparkles size={14} className="text-amber-500" />
                      AI Skill Matching Recommendations
                    </p>
                    <p className="text-muted text-[11px]">Allow Orbitus AI to suggest your profile to relevant study partners seeking your skills.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={aiRecommendations}
                    onChange={(e) => handleToggleAi(e.target.checked)}
                    className="w-5 h-5 accent-indigo-600 rounded cursor-pointer"
                  />
                </div>
              </div>
            </section>
          </div>
        )}

        {/* ── TAB 4: ACCOUNT & DATA / DANGER ZONE ─────────────────────────── */}
        {activeTab === 'account' && (
          <div className="space-y-6 animate-fade-in">
            {/* Export Data Card */}
            <section className="bg-white dark:bg-[#22242a] border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-7 space-y-4 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="rounded-2xl bg-indigo-500/10 p-3 text-indigo-600 dark:text-indigo-400 shrink-0">
                  <FolderDown size={22} />
                </div>
                <div>
                  <h2 className="text-base font-bold text-app font-outfit">Export Your Orbitus Data</h2>
                  <p className="mt-1 text-xs text-muted leading-relaxed">
                    Download a secure JSON copy of your profile info, registered skills, points, and account preferences.
                  </p>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleExportData}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-app font-bold text-xs transition-colors flex items-center gap-2"
                >
                  <Download size={14} />
                  <span>Download My Data (JSON)</span>
                </button>
              </div>
            </section>

            {/* Permanent Account Deletion Card */}
            <section className="bg-white dark:bg-[#22242a] border border-red-500/20 dark:border-red-500/30 rounded-3xl p-5 sm:p-7 space-y-5 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="rounded-2xl bg-red-500/10 p-3 text-red-600 shrink-0">
                  <AlertTriangle size={22} />
                </div>
                <div>
                  <h2 className="text-base font-bold text-red-600 font-outfit">Delete Account Permanently</h2>
                  <p className="mt-1 text-xs text-muted leading-relaxed">
                    This permanently removes your profile, posts, messages, study sessions, roadmaps, certificates, and leaderboard stats. This action cannot be undone.
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-4 space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-red-600">
                  Type your username <span className="underline font-mono">@{user?.username || 'username'}</span> to confirm
                </label>
                <input
                  type="text"
                  value={confirmUsername}
                  onChange={(e) => setConfirmUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-[#1a1c24] border border-red-500/30 text-app outline-none focus:border-red-500 text-xs font-mono"
                  placeholder={user?.username || 'username'}
                />
                {deleteStatus && <p className="text-xs font-semibold text-red-600">{deleteStatus}</p>}
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="button"
                  onClick={requestDeleteAccount}
                  disabled={!canDelete || deleting}
                  className="inline-flex items-center gap-2 rounded-xl bg-red-600 hover:bg-red-500 px-5 py-2.5 text-xs font-bold text-white transition-all disabled:cursor-not-allowed disabled:opacity-40 shadow-sm"
                >
                  <Trash2 size={14} />
                  <span>{deleting ? 'Deleting Account...' : 'Delete My Account'}</span>
                </button>
              </div>
            </section>
          </div>
        )}
      </div>

      {/* Delete Account Custom Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={() => setShowDeleteModal(false)}>
          <div className="w-full max-w-sm bg-white dark:bg-[#161b22] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl text-app space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold font-outfit text-red-600 flex items-center gap-2">
                <Trash2 size={20} /> Delete Account?
              </h3>
              <button onClick={() => setShowDeleteModal(false)} className="text-slate-400 hover:text-app p-1 rounded-lg">
                <X size={18} />
              </button>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              ⚠️ Are you absolutely sure? This will permanently delete your account, saved roadmaps, skills, certificates, and all associated profile data. This action cannot be undone.
            </p>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setShowDeleteModal(false)} className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-800 text-app font-bold text-xs rounded-xl">
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeleteAccount}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-md transition-all"
              >
                Delete Account
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
