import React, { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import apiClient, { API_BASE_URL } from '../../services/apiClient.js';
import { updateProfileSuccess } from '../../features/authSlice.js';
import { setCurrentRoom, upsertActiveChat } from '../../features/chatSlice.js';
import {
  Briefcase,
  Calendar,
  FileText,
  GitBranch,
  Globe,
  MessageSquare,
  UserMinus,
  UserPlus,
  Users,
  Video,
  Pencil,
  Share2,
  Check,
  Award,
  Sparkles,
  ExternalLink,
  BookOpen,
  Heart,
  MessageCircle,
  Clock,
  X,
  Plus,
  Shield,
  CheckCircle,
  GraduationCap,
  Upload,
  Camera,
  Image as ImageIcon,
  ArrowLeft,
  User,
  Trash2,
  Loader2,
  Link2,
  ArrowRight
} from 'lucide-react';
import { ScrollReveal, TiltCard, MorphingBlob, TextReveal, MotionBadge } from '../../components/motion/index.js';
import SkillActivityHeatmap from '../../components/dashboard/SkillActivityHeatmap.jsx';
import PlatformBadges from '../../components/dashboard/PlatformBadges.jsx';

const PublicProfile = () => {
  const { id } = useParams();
  const { user: currentUser, token } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Resolve target identifier: if no id or 'me', use currentUser._id or 'me'
  const targetUserId = !id || id === 'me' ? (currentUser?._id || 'me') : id;

  const [profileUser, setProfileUser] = useState(null);
  const [userPosts, setUserPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [postsLoading, setPostsLoading] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [followBusy, setFollowBusy] = useState(false);
  const [showAllPostsModal, setShowAllPostsModal] = useState(false);
  const [showFullBio, setShowFullBio] = useState(false);

  // Stats, Badges & Heatmap Activity Map for public profile
  const [profileStats, setProfileStats] = useState(null);
  const [profileBadges, setProfileBadges] = useState([]);
  const [profileBadgeProgress, setProfileBadgeProgress] = useState([]);
  const [profileActivityMap, setProfileActivityMap] = useState({});

  // Like & Comment state for Activity & Posts tab
  const [postCommentDrafts, setPostCommentDrafts] = useState({});
  const [openCommentPostId, setOpenCommentPostId] = useState(null);

  // Followers / Following drawer
  const [drawerType, setDrawerType] = useState(null); // null | 'followers' | 'following'
  const [drawerUsers, setDrawerUsers] = useState([]);
  const [drawerLoading, setDrawerLoading] = useState(false);

  // Booking Form State (Only for other users)
  const [bookTopic, setBookTopic] = useState('');
  const [bookDate, setBookDate] = useState('');
  const [bookTime, setBookTime] = useState('');
  const [bookDuration, setBookDuration] = useState(60);
  const [bookNotes, setBookNotes] = useState('');
  const [bookMeetingLink, setBookMeetingLink] = useState('');
  const [bookLinkProvider, setBookLinkProvider] = useState('Google Meet');
  const [bookLinkSharedBy, setBookLinkSharedBy] = useState('either');
  const [bookMsg, setBookMsg] = useState('');
  const [bookingLoading, setBookingLoading] = useState(false);

  // Comprehensive Edit Profile Modal State (Only for own profile)
  const [showEditModal, setShowEditModal] = useState(false);
  const [editName, setEditName] = useState('');
  const [editUsername, setEditUsername] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editAvatar, setEditAvatar] = useState('');
  const [editCoverImage, setEditCoverImage] = useState('');
  const [editExperienceLevel, setEditExperienceLevel] = useState('Intermediate');
  const [editSocials, setEditSocials] = useState({
    linkedin: '',
    github: '',
    twitter: '',
    website: '',
    instagram: '',
    youtube: ''
  });
  const [editEducation, setEditEducation] = useState([]);
  const [editProjects, setEditProjects] = useState([]);
  const [editResumeUrl, setEditResumeUrl] = useState('');
  const [resumeUploading, setResumeUploading] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');

  const [avatarUploading, setAvatarUploading] = useState(false);
  const [coverUploading, setCoverUploading] = useState(false);
  const avatarFileInputRef = useRef(null);
  const coverFileInputRef = useRef(null);

  const handleAvatarFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarUploading(true);
    setProfileError('');
    try {
      const formData = new FormData();
      formData.append('image', file);
      const res = await apiClient.post('/api/users/upload-image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      const imgUrl = res.data?.url || res.data?.data?.url;
      if (imgUrl) {
        setEditAvatar(imgUrl);
      }
    } catch (err) {
      setProfileError(err.response?.data?.message || 'Failed to upload profile image.');
    } finally {
      setAvatarUploading(false);
    }
  };

  const handleCoverFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCoverUploading(true);
    setProfileError('');
    try {
      const formData = new FormData();
      formData.append('image', file);
      const res = await apiClient.post('/api/users/upload-image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      const imgUrl = res.data?.url || res.data?.data?.url;
      if (imgUrl) {
        setEditCoverImage(imgUrl);
      }
    } catch (err) {
      setProfileError(err.response?.data?.message || 'Failed to upload cover image.');
    } finally {
      setCoverUploading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
    fetchUserPosts();
  }, [id, currentUser?._id, token]);

  // Lock background page scroll when Edit Profile Modal, Followers/Following Drawer, or All Posts Modal is open
  useEffect(() => {
    const isAnyModalOpen = showEditModal || Boolean(drawerType) || showAllPostsModal;
    if (isAnyModalOpen) {
      const originalBodyOverflow = document.body.style.overflow;
      const originalHtmlOverflow = document.documentElement.style.overflow;
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';

      const shells = document.querySelectorAll('.page-shell, .app-shell, main, #root');
      const originalShellOverflows = Array.from(shells).map((el) => el.style.overflow);
      shells.forEach((el) => {
        el.style.overflow = 'hidden';
      });

      return () => {
        document.body.style.overflow = originalBodyOverflow;
        document.documentElement.style.overflow = originalHtmlOverflow;
        shells.forEach((el, i) => {
          el.style.overflow = originalShellOverflows[i] || '';
        });
      };
    }
  }, [showEditModal, drawerType, showAllPostsModal]);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get(`/api/users/${targetUserId}`);
      const u = res.data.user;
      setProfileUser(u);
      setProfileStats(res.data.stats || null);
      setProfileBadges(res.data.badges || []);
      setProfileBadgeProgress(res.data.badgeProgress || []);
      setProfileActivityMap(res.data.activityMap || {});
      if (u?.name) {
        setBookTopic(`Study with ${u.name}`);
      }

      // Populate edit modal fields
      setEditName(u.name || '');
      setEditUsername(u.username || '');
      setEditBio(u.bio || '');
      setEditAvatar(u.profileImage || '');
      setEditCoverImage(u.coverImage || '');
      setEditExperienceLevel(u.experienceLevel || 'Intermediate');
      setEditSocials({
        linkedin: u.socialLinks?.linkedin || '',
        github: u.socialLinks?.github || '',
        twitter: u.socialLinks?.twitter || '',
        website: u.socialLinks?.website || '',
        instagram: u.socialLinks?.instagram || '',
        youtube: u.socialLinks?.youtube || ''
      });

      const eduList = Array.isArray(u.education)
        ? u.education
        : (u.education ? [{ degree: typeof u.education === 'string' ? u.education : (u.education.degree || '') }] : []);
      setEditEducation(eduList.length > 0 ? eduList : [{ degree: '', institution: '', fieldOfStudy: '', startYear: '', endYear: '' }]);

      const projList = Array.isArray(u.projects) ? u.projects : [];
      setEditProjects(projList);
      setEditResumeUrl(u.resumeFile || '');
    } catch (err) {
      console.error('Error loading profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserPosts = async () => {
    setPostsLoading(true);
    try {
      const res = await apiClient.get('/api/posts', {
        params: { author: targetUserId }
      });
      setUserPosts(res.data.posts || []);
    } catch (err) {
      console.error('Error fetching user activity posts:', err);
    } finally {
      setPostsLoading(false);
    }
  };

  const likePostInProfile = async (postId) => {
    try {
      const res = await apiClient.put(`/api/posts/${postId}/like`, {});
      const updated = res.data.post;
      setUserPosts((prev) => prev.map((p) => (p._id === updated._id ? updated : p)));
    } catch (err) {
      console.error('Error liking post:', err);
    }
  };

  const addCommentInProfile = async (postId) => {
    const draft = (postCommentDrafts[postId] || '').trim();
    if (!draft) return;
    try {
      const res = await apiClient.post(`/api/posts/${postId}/comments`, { content: draft });
      const updated = res.data.post;
      setUserPosts((prev) => prev.map((p) => (p._id === updated._id ? updated : p)));
      setPostCommentDrafts((prev) => ({ ...prev, [postId]: '' }));
      setOpenCommentPostId(null);
    } catch (err) {
      console.error('Error adding comment:', err);
    }
  };


  const handleStartChat = () => {
    if (!profileUser || !currentUser) return;
    const chatRoomId = [currentUser._id.toString(), profileUser._id.toString()]
      .sort()
      .join('_');
    dispatch(
      upsertActiveChat({
        partner: profileUser,
        chatRoomId,
        lastMessage: {
          content: 'Hello! I saw your profile on Orbitus.',
          fileType: 'none',
          isSeen: true,
          sender: currentUser._id,
          createdAt: new Date().toISOString()
        }
      })
    );
    dispatch(setCurrentRoom({ partner: profileUser, roomId: chatRoomId }));
    navigate('/chat', { state: { directChat: true } });
  };

  const handleFollowToggle = async () => {
    if (!profileUser || isOwnProfile) return;
    setFollowBusy(true);
    try {
      const res = await apiClient.post(`/api/users/${profileUser._id}/follow`, {});
      setProfileUser(res.data.user);
    } catch (err) {
      console.error('Error updating follow:', err);
    } finally {
      setFollowBusy(false);
    }
  };

  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    setBookMsg('');
    if (!bookDate || !bookTime || !bookTopic.trim()) {
      setBookMsg('Please specify session topic, date, and start time.');
      return;
    }

    const startDateTime = new Date(`${bookDate}T${bookTime}:00`);
    const endDateTime = new Date(startDateTime.getTime() + Number(bookDuration) * 60 * 1000);

    setBookingLoading(true);
    try {
      await apiClient.post('/api/sessions/book', {
        mentorId: profileUser._id,
        topic: bookTopic.trim(),
        startTime: startDateTime.toISOString(),
        endTime: endDateTime.toISOString(),
        notes: bookNotes,
        meetingLink: bookMeetingLink.trim(),
        meetingLinkProvider: bookLinkProvider,
        meetingLinkSharedBy: bookLinkSharedBy
      });
      setBookMsg('Session booked successfully! Check My Bookings.');
      setBookNotes('');
      setBookMeetingLink('');
    } catch (err) {
      setBookMsg(err.response?.data?.message || 'Could not book session.');
    } finally {
      setBookingLoading(false);
    }
  };

  const handleResumeUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('resume', file);
    try {
      setResumeUploading(true);
      const res = await apiClient.post('/api/users/profile/resume', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setEditResumeUrl(res.data.resumeFile || res.data.user?.resumeFile || '');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to upload resume PDF');
    } finally {
      setResumeUploading(false);
    }
  };

  const addEducation = () => {
    setEditEducation((prev) => [...prev, { degree: '', institution: '', fieldOfStudy: '', startYear: '', endYear: '' }]);
  };

  const removeEducation = (index) => {
    setEditEducation((prev) => prev.filter((_, i) => i !== index));
  };

  const updateEducation = (index, field, value) => {
    setEditEducation((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const addProject = () => {
    setEditProjects((prev) => [...prev, { title: '', description: '', tags: '', githubUrl: '', liveUrl: '' }]);
  };

  const removeProject = (index) => {
    setEditProjects((prev) => prev.filter((_, i) => i !== index));
  };

  const updateProject = (index, field, value) => {
    setEditProjects((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const updateSocial = (field, value) => {
    setEditSocials((prev) => ({ ...prev, [field]: value }));
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    setProfileError('');
    try {
      const res = await apiClient.put('/api/users/profile', {
        name: editName.trim(),
        username: editUsername.trim(),
        bio: editBio.trim(),
        experienceLevel: editExperienceLevel,
        profileImage: editAvatar,
        coverImage: editCoverImage.trim(),
        socialLinks: editSocials,
        education: editEducation.filter(edu => edu.degree || edu.institution),
        projects: editProjects
          .filter(p => p.title || p.githubUrl || p.liveUrl)
          .map(p => ({
            ...p,
            tags: Array.isArray(p.tags) ? p.tags : (p.tags ? p.tags.split(',').map(t => t.trim()).filter(Boolean) : [])
          })),
        resumeFile: editResumeUrl
      });

      dispatch(updateProfileSuccess(res.data.user));
      setProfileUser((prev) => ({ ...prev, ...res.data.user }));
      setSaveSuccessMsg('Profile updated successfully!');
      setTimeout(() => {
        setSaveSuccessMsg('');
        setShowEditModal(false);
      }, 1200);
    } catch (err) {
      console.error('Error saving profile:', err);
      setProfileError(err.response?.data?.message || 'Could not update profile');
    } finally {
      setSavingProfile(false);
    }
  };

  const copyProfileLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const openDrawer = async (type) => {
    setDrawerType(type);
    setDrawerLoading(true);
    setDrawerUsers([]);
    try {
      const res = await apiClient.get(`/api/users/${profileUser._id}/${type}`);
      setDrawerUsers(res.data[type] || []);
    } catch (err) {
      console.error(`Error fetching ${type}:`, err);
    } finally {
      setDrawerLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="page-shell flex flex-col items-center justify-center min-h-[60vh] space-y-3 text-app">
        <div className="w-10 h-10 rounded-full border-4 border-indigo-500/20 border-t-indigo-500 animate-spin" />
        <span className="text-sm font-medium text-muted">Loading profile details...</span>
      </div>
    );
  }

  if (!profileUser) {
    return (
      <div className="page-shell flex flex-col items-center justify-center min-h-[60vh] space-y-3 text-app">
        <Users size={36} className="text-muted" />
        <p className="text-base font-bold">Profile not found.</p>
        <Link to="/feed" className="text-xs text-indigo-600 dark:text-indigo-400 font-bold hover:underline">
          Return to Daily Feed
        </Link>
      </div>
    );
  }

  const isOwnProfile = profileUser._id?.toString() === currentUser?._id?.toString();
  const isAdminProfile = profileUser?.role === 'admin' || profileUser?.role === 'Admin';
  const resumeViewUrl = `${API_BASE_URL}/api/users/${profileUser._id}/resume`;
  const educationList = Array.isArray(profileUser.education)
    ? profileUser.education
    : (profileUser.education ? [{ degree: profileUser.education }] : []);

  return (
    <div className="page-shell w-full flex-1 overflow-y-auto min-h-screen relative z-0">
      {/* Subtle Fixed Ambient Glow Orbs on Viewport */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute -top-32 -left-32 w-[500px] h-[500px] rounded-full bg-gradient-to-br from-indigo-500/18 via-purple-500/12 to-transparent blur-[120px]" />
        <div className="absolute top-20 -right-32 w-[500px] h-[500px] rounded-full bg-gradient-to-bl from-blue-500/18 via-cyan-500/10 to-transparent blur-[120px]" />
        <div className="absolute bottom-10 left-1/3 w-[550px] h-[350px] rounded-full bg-gradient-to-r from-amber-500/12 via-rose-500/10 to-transparent blur-[130px]" />
      </div>

      <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8 pb-36 sm:pb-24 space-y-6 animate-fade-in relative z-10">
        {/* 1. HERO IDENTITY BANNER (LinkedIn Style) */}
        <ScrollReveal direction="down" duration={0.5}>
          <div className="bg-white dark:bg-[#22242a] border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm">
        {/* Decorative Cover Gradient / Image */}
        <div className="h-52 sm:h-64 bg-slate-200 dark:bg-slate-800 relative overflow-hidden">
          {profileUser.coverImage ? (
            <img
              src={profileUser.coverImage}
              alt="Cover banner"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="absolute inset-0 bg-black/10 backdrop-blur-[1px]" />
          )}
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="absolute top-4 left-4 z-10 flex items-center gap-1.5 px-3 py-1.5 bg-black/40 hover:bg-black/60 text-white rounded-xl text-xs font-semibold backdrop-blur-md transition-colors shadow-lg"
            title="Go back"
          >
            <ArrowLeft size={14} />
            <span>Back</span>
          </button>
          <div className="absolute top-4 right-4 flex items-center gap-2">
            <button
              type="button"
              onClick={copyProfileLink}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-black/40 hover:bg-black/60 text-white rounded-xl text-xs font-semibold backdrop-blur-md transition-colors"
              title="Share profile link"
            >
              {copiedLink ? <Check size={14} className="text-emerald-400" /> : <Share2 size={14} />}
              <span>{copiedLink ? 'Link Copied!' : 'Share Profile'}</span>
            </button>
          </div>
        </div>

        {/* Profile Details Container */}
        <div className="px-6 pb-6 pt-0 relative">
          {/* Avatar Positioned Over Cover */}
          <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 -mt-20 sm:-mt-28 mb-4">
            <div className="relative">
              <img
                src={profileUser.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(profileUser.name || 'User')}&background=6366f1&color=fff`}
                alt={profileUser.name}
                className="w-40 h-40 sm:w-52 sm:h-52 rounded-full object-cover bg-slate-100 dark:bg-slate-800 border-4 border-white dark:border-[#22242a] shadow-2xl"
              />
            </div>

            {/* Header Action Buttons */}
            <div className="flex items-center gap-2.5 flex-wrap self-stretch sm:self-auto justify-end">
              {isOwnProfile ? (
                <button
                  type="button"
                  onClick={() => setShowEditModal(true)}
                  className="flex items-center gap-2 px-5 py-2.5 !bg-white dark:!bg-slate-800 hover:!bg-slate-50 dark:hover:!bg-slate-700/80 !text-slate-900 dark:!text-white border border-slate-200 dark:border-slate-700 text-xs font-bold rounded-2xl transition-all shadow-sm hover:shadow active:scale-95"
                >
                  <Pencil size={14} className="text-indigo-600 dark:text-indigo-400" />
                  <span>Edit Profile</span>
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={handleFollowToggle}
                    disabled={followBusy}
                    className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold rounded-2xl transition-all shadow-sm ${
                      profileUser.isFollowing
                        ? 'bg-slate-100 dark:bg-slate-800 text-muted-strong hover:bg-slate-200'
                        : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                    }`}
                  >
                    {profileUser.isFollowing ? <UserMinus size={14} /> : <UserPlus size={14} />}
                    <span>{profileUser.isFollowing ? 'Following' : 'Follow'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleStartChat}
                    className="flex items-center gap-1.5 px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-app text-xs font-bold rounded-2xl transition-all border border-slate-200 dark:border-slate-700"
                  >
                    <MessageSquare size={14} />
                    <span>Message</span>
                  </button>
                </>
              )}
            </div>
          </div>

          {/* User Name, Username, Badges */}
          <div className="space-y-2">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-app font-outfit tracking-tight">
                {profileUser.name}
              </h1>
              <span className="text-sm font-mono text-muted">
                @{profileUser.username || 'user'}
              </span>
              {isAdminProfile && (
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/25 text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5 shadow-sm">
                  <Shield size={13} className="text-indigo-600 dark:text-indigo-400" />
                  Platform Administrator
                </span>
              )}
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500">
                🏆 {profileUser.points || 0} pts
              </span>
            </div>

            <p className="text-xs sm:text-sm text-muted font-normal">
              {isAdminProfile ? 'Orbitus Platform Staff' : (profileUser.experienceLevel || 'Learner')}
            </p>

            {/* Quick Stats: Followers, Following, Sessions */}
            <div className="flex items-center gap-6 pt-2 text-xs text-muted flex-wrap">
              <button
                type="button"
                onClick={() => openDrawer('followers')}
                className="font-medium hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors text-left"
              >
                <strong className="text-app font-bold text-sm mr-1">{profileUser.followersCount || 0}</strong>
                Followers
              </button>
              <button
                type="button"
                onClick={() => openDrawer('following')}
                className="font-medium hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors text-left"
              >
                <strong className="text-app font-bold text-sm mr-1">{profileUser.followingCount || 0}</strong>
                Following
              </button>
              <span className="font-medium">
                <strong className="text-app font-bold text-sm mr-1">{profileUser.sessionsCompleted || 0}</strong>
                Sessions Completed
              </span>
            </div>

            {/* Social & Contact Links (Prominently visible on mobile & desktop) */}
            {(profileUser.socialLinks?.linkedin ||
              profileUser.socialLinks?.github ||
              profileUser.socialLinks?.twitter ||
              profileUser.socialLinks?.website ||
              profileUser.resumeFile) && (
              <div className="flex items-center gap-2 pt-3 flex-wrap border-t border-slate-100 dark:border-slate-800/80">
                {profileUser.socialLinks?.linkedin && (
                  <a
                    href={profileUser.socialLinks.linkedin}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950/40 text-muted-strong hover:text-blue-600 dark:hover:text-blue-400 text-xs font-semibold transition-colors"
                  >
                    <Briefcase size={12} className="text-blue-600" />
                    <span>LinkedIn</span>
                  </a>
                )}
                {profileUser.socialLinks?.github && (
                  <a
                    href={profileUser.socialLinks.github}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-muted-strong text-xs font-semibold transition-colors"
                  >
                    <GitBranch size={12} />
                    <span>GitHub</span>
                  </a>
                )}
                {profileUser.socialLinks?.twitter && (
                  <a
                    href={profileUser.socialLinks.twitter}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-sky-50 dark:hover:bg-sky-950/40 text-muted-strong hover:text-sky-500 text-xs font-semibold transition-colors"
                  >
                    <Globe size={12} className="text-sky-500" />
                    <span>Twitter</span>
                  </a>
                )}
                {profileUser.socialLinks?.website && (
                  <a
                    href={profileUser.socialLinks.website}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-muted-strong hover:text-indigo-600 dark:hover:text-indigo-400 text-xs font-semibold transition-colors"
                  >
                    <Globe size={12} className="text-indigo-500" />
                    <span>Website</span>
                  </a>
                )}
                {profileUser.resumeFile && (
                  <a
                    href={resumeViewUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-400 text-xs font-bold hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors"
                  >
                    <FileText size={12} />
                    <span>Resume</span>
                  </a>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      </ScrollReveal>

      {/* 2. MAIN 2-COLUMN BODY */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Full Information (About, Skills, Activity, Projects, Education) */}
        <div className="lg:col-span-2 space-y-6">
          {/* About Section */}
          <ScrollReveal direction="up" delay={0.1}>
            <div className="bg-white dark:bg-[#22242a] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 space-y-3 shadow-sm">
              <h2 className="text-base font-bold text-app font-outfit flex items-center gap-2">
                <BookOpen size={18} className="text-indigo-600 dark:text-indigo-400" />
                About
              </h2>
              {(() => {
                const bioText = profileUser.bio || 'This member has not written a summary bio yet.';
                const isLongBio = bioText.length > 220 || bioText.split('\n').length > 3;
                return (
                  <div>
                    <p className={`text-xs sm:text-sm text-muted leading-relaxed whitespace-pre-line ${!showFullBio && isLongBio ? 'line-clamp-3' : 'max-h-52 overflow-y-auto scrollbar-none pr-1'}`}>
                      {bioText}
                    </p>
                    {isLongBio && (
                      <button
                        type="button"
                        onClick={() => setShowFullBio((prev) => !prev)}
                        className="mt-2 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        {showFullBio ? 'See Less' : 'See More...'}
                      </button>
                    )}
                  </div>
                );
              })()}
            </div>
          </ScrollReveal>

          {/* Skills Section (Teaches & Wants to Learn) */}
          <ScrollReveal direction="up" delay={0.15}>
              <div className="bg-white dark:bg-[#22242a] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 space-y-4 shadow-sm">
              <h2 className="text-base font-bold text-app font-outfit flex items-center gap-2">
                <GraduationCap size={18} className="text-indigo-600 dark:text-indigo-400" />
                Skills & Expertise
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Skills Teaches */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#12161f] border border-slate-200 dark:border-slate-800 space-y-2.5">
                  <h3 className="text-xs font-bold uppercase text-indigo-600 dark:text-indigo-400 tracking-wider">
                    Can Teach / Mentor:
                  </h3>
                  <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto scrollbar-none pr-1">
                    {(profileUser.skillsTeach || []).length === 0 ? (
                      <span className="text-xs text-muted italic">None specified yet.</span>
                    ) : (
                      (profileUser.skillsTeach || []).map((item, idx) => (
                        <span
                          key={idx}
                          className="px-2.5 py-1 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 text-xs font-bold"
                        >
                          {item.skill?.name || item.name || 'Skill'} ({item.level || 'Expert'})
                        </span>
                      ))
                    )}
                  </div>
                </div>

                {/* Skills Learn */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#12161f] border border-slate-200 dark:border-slate-800 space-y-2.5">
                  <h3 className="text-xs font-bold uppercase text-muted tracking-wider">
                    Wants to Learn:
                  </h3>
                  <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto scrollbar-none pr-1">
                    {(profileUser.skillsLearn || []).length === 0 ? (
                      <span className="text-xs text-muted italic">None specified yet.</span>
                    ) : (
                      (profileUser.skillsLearn || []).map((item, idx) => (
                        <span
                          key={idx}
                          className="px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-muted-strong text-xs font-medium"
                        >
                          {item.skill?.name || item.name || 'Skill'} ({item.level || 'Beginner'})
                        </span>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          </ScrollReveal>

          {/* Activity & Posts Section (LinkedIn Activity Feed) */}
          <ScrollReveal direction="up" delay={0.2}>
            <div className="bg-white dark:bg-[#22242a] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 space-y-4 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <h2 className="text-base font-bold text-app font-outfit truncate">Activity & Posts</h2>
                <p className="text-xs text-muted truncate">Thoughts, updates, and learning notes shared by {profileUser.name}</p>
              </div>
              <span className="shrink-0 whitespace-nowrap text-xs font-bold text-muted bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full">
                {userPosts.length} {userPosts.length === 1 ? 'post' : 'posts'}
              </span>
            </div>

            {postsLoading ? (
              <div className="space-y-3 py-2">
                {[...Array(2)].map((_, i) => (
                  <div key={i} className="h-24 rounded-2xl bg-slate-100 dark:bg-slate-800/40 animate-pulse" />
                ))}
              </div>
            ) : userPosts.length === 0 ? (
              <div className="text-center py-8 rounded-2xl bg-slate-50 dark:bg-[#12161f] border border-dashed border-slate-200 dark:border-slate-800 p-4 space-y-2">
                <p className="text-xs text-muted">No posts published yet.</p>
                {isOwnProfile && (
                  <Link to="/feed" className="text-xs text-indigo-600 dark:text-indigo-400 font-bold hover:underline inline-block">
                    Share your first post in the Daily Feed!
                  </Link>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {userPosts.slice(0, 1).map((post) => {
                  const liked = post.likes?.some(
                    (id) => (id?._id || id)?.toString() === currentUser?._id?.toString()
                  );
                  const isCommentOpen = openCommentPostId === post._id;
                  return (
                    <div
                      key={post._id}
                      className="p-4 rounded-2xl bg-slate-50 dark:bg-[#12161f] border border-slate-200 dark:border-slate-800/80 space-y-2 transition-all hover:border-slate-300 dark:hover:border-slate-700"
                    >
                      <p className="text-xs sm:text-sm text-app leading-relaxed whitespace-pre-wrap">
                        {post.content}
                      </p>

                      {/* Recent comments preview */}
                      {(post.comments || []).length > 0 && (
                        <div className="space-y-1 pt-1">
                          {(post.comments || []).slice(-2).map((comment, ci) => {
                            const ca = comment.author || comment.user || {};
                            return (
                              <div key={ci} className="flex items-start gap-1.5 text-[11px] bg-white dark:bg-slate-900/50 p-2 rounded-xl border border-slate-200 dark:border-slate-800">
                                <img
                                  src={ca.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(ca.name || 'U')}&background=6366f1&color=fff`}
                                  alt={ca.name}
                                  className="w-5 h-5 rounded-full object-cover shrink-0 mt-0.5"
                                />
                                <span><strong className="text-app font-semibold">{ca.name || 'User'}:</strong> <span className="text-muted">{comment.content}</span></span>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Inline comment input */}
                      {isCommentOpen && (
                        <div className="flex gap-2 pt-1">
                          <input
                            type="text"
                            placeholder="Write a comment..."
                            value={postCommentDrafts[post._id] || ''}
                            onChange={(e) =>
                              setPostCommentDrafts((prev) => ({ ...prev, [post._id]: e.target.value }))
                            }
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') { e.preventDefault(); addCommentInProfile(post._id); }
                            }}
                            className="flex-1 bg-white dark:bg-[#22242a] border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs text-app placeholder:text-muted outline-none focus:border-indigo-500"
                            autoFocus
                          />
                          <button
                            type="button"
                            onClick={() => addCommentInProfile(post._id)}
                            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all"
                          >
                            Post
                          </button>
                        </div>
                      )}

                      <div className="flex items-center justify-between text-[11px] text-muted pt-1 border-t border-slate-100 dark:border-slate-800">
                        <span>{new Date(post.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => likePostInProfile(post._id)}
                            className={`flex items-center gap-1 transition-colors ${liked ? 'text-rose-500 font-bold' : 'text-muted hover:text-rose-500'}`}
                          >
                            <Heart size={13} fill={liked ? 'currentColor' : 'none'} />
                            <span>{post.likes?.length || 0}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setOpenCommentPostId(isCommentOpen ? null : post._id)}
                            className={`flex items-center gap-1 transition-colors ${isCommentOpen ? 'text-indigo-500 font-bold' : 'text-muted hover:text-indigo-500'}`}
                          >
                            <MessageCircle size={13} />
                            <span>{post.comments?.length || 0}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}


                {userPosts.length > 1 && (
                  <button
                    type="button"
                    onClick={() => setShowAllPostsModal(true)}
                    className="w-full py-2.5 px-4 rounded-2xl bg-slate-100/80 hover:bg-slate-200/80 dark:bg-slate-800/60 dark:hover:bg-slate-700/60 text-xs font-bold text-indigo-600 dark:text-indigo-400 flex items-center justify-center gap-2 transition-all border border-slate-200/60 dark:border-slate-800 active:scale-[0.99]"
                  >
                    <span>View All {userPosts.length} Posts</span>
                    <ArrowRight size={13} />
                  </button>
                )}
              </div>
            )}
          </div>
          </ScrollReveal>

          {/* Learning Exchange Progress & Platform Badges */}
          <ScrollReveal direction="up" delay={0.22}>
            <div className="space-y-6">
              <SkillActivityHeatmap
                user={profileUser}
                stats={profileStats}
                activityMap={profileActivityMap}
              />
              <PlatformBadges
                user={profileUser}
                badges={profileBadges}
                badgeProgress={profileBadgeProgress}
                onlyUnlocked={true}
              />
            </div>
          </ScrollReveal>

          {/* Featured Projects & Portfolio */}
          <ScrollReveal direction="up" delay={0.25}>
            <div className="bg-white dark:bg-[#22242a] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 space-y-4 shadow-sm">
              <h2 className="text-base font-bold text-app font-outfit flex items-center gap-2">
                <Briefcase size={18} className="text-indigo-600 dark:text-indigo-400" />
                Featured Projects & Portfolio
              </h2>

              {(profileUser.projects || []).length === 0 ? (
                <p className="text-xs text-muted italic">No featured projects added yet.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {(profileUser.projects || []).map((proj, idx) => (
                    <TiltCard key={idx} intensity={8}>
                      <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#12161f] border border-slate-200 dark:border-slate-800 space-y-2 flex flex-col justify-between h-full">
                        <div>
                          <h3 className="font-bold text-sm text-app">{proj.title}</h3>
                          <p className="text-xs text-muted mt-1 leading-relaxed line-clamp-3">
                            {proj.description || 'No description provided.'}
                          </p>
                        </div>

                        <div className="flex items-center gap-2 pt-2">
                          {proj.liveUrl && (
                            <a
                              href={proj.liveUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
                            >
                              <Globe size={12} />
                              <span>Live Demo</span>
                            </a>
                          )}
                          {proj.githubUrl && (
                            <a
                              href={proj.githubUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-700 dark:text-slate-300 hover:underline"
                            >
                              <GitBranch size={12} />
                              <span>Source</span>
                            </a>
                          )}
                        </div>
                      </div>
                    </TiltCard>
                  ))}
                </div>
              )}
            </div>
          </ScrollReveal>

          {/* Education & Credentials */}
          <ScrollReveal direction="up" delay={0.3}>
            <div className="bg-white dark:bg-[#22242a] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 space-y-3 shadow-sm">
              <h2 className="text-base font-bold text-app font-outfit">Education</h2>
              {educationList.length === 0 ? (
                <p className="text-xs text-muted italic">No formal education listed.</p>
              ) : (
                <div className="space-y-3">
                  {educationList.map((item, idx) => (
                    <div key={idx} className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center text-indigo-600 shrink-0 mt-0.5">
                        <GraduationCap size={16} />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-app">{item.degree || item}</h4>
                        <p className="text-xs text-muted">
                          {[item.institution, item.year].filter(Boolean).join(' • ') || 'Academic studies'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </ScrollReveal>
        </div>

        {/* Right Sidebar: Dynamic between Other User vs Own Profile */}
        <ScrollReveal direction="left" delay={0.2} className="w-full">
          <div className="space-y-6">
          {/* IF ADMIN PROFILE: RENDER ADMIN OFFICIAL CARD (NO BOOKING FORM!) */}
          {isAdminProfile ? (
            <div className="bg-white dark:bg-[#22242a] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 space-y-4 shadow-sm">
              <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
                  <Shield size={20} />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-app font-outfit">Platform Admin</h3>
                  <p className="text-xs text-muted">Official Orbitus Administrator</p>
                </div>
              </div>

              <div className="space-y-3 text-xs">
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#12161f] border border-slate-200 dark:border-slate-800 space-y-1">
                  <span className="font-bold text-app block">Verified Authority</span>
                  <p className="text-muted leading-relaxed text-[11px]">
                    This account is an authorized platform administrator with permissions for platform moderation, skill verification, and system security.
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40 space-y-1">
                  <span className="font-bold text-indigo-700 dark:text-indigo-300 block">Support Inquiries</span>
                  <p className="text-muted leading-relaxed text-[11px]">
                    Session booking is disabled for administrator profiles. Reach out directly via chat for questions, reports, or platform help.
                  </p>
                </div>

                {!isOwnProfile && (
                  <button
                    type="button"
                    onClick={handleStartChat}
                    className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold transition-all shadow flex items-center justify-center gap-2"
                  >
                    <MessageSquare size={14} />
                    <span>Send Message to Admin</span>
                  </button>
                )}
              </div>
            </div>
          ) : !isOwnProfile ? (
            <div className="bg-white dark:bg-[#22242a] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 space-y-4 shadow-sm">
              <div>
                <h3 className="text-base font-extrabold text-app font-outfit flex items-center gap-2">
                  <Calendar size={18} className="text-blue-500" />
                  Book a Swap Session
                </h3>
                <p className="text-xs text-muted mt-1">
                  Schedule a 1-on-1 video call or knowledge swap with {profileUser.name}.
                </p>
              </div>

              {bookMsg && (
                <div className="p-3 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-xs font-semibold text-blue-600 dark:text-blue-400">
                  {bookMsg}
                </div>
              )}

              <form onSubmit={handleBookingSubmit} className="space-y-3 text-xs">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted uppercase">Session Topic</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. React Patterns, Spanish Speaking Practice"
                    value={bookTopic}
                    onChange={(e) => setBookTopic(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-[#12161f] border border-slate-200 dark:border-slate-800 rounded-xl text-app outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-muted uppercase">Date</label>
                    <input
                      type="date"
                      required
                      value={bookDate}
                      onChange={(e) => setBookDate(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-[#12161f] border border-slate-200 dark:border-slate-800 rounded-xl text-app outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-muted uppercase">Time</label>
                    <input
                      type="time"
                      required
                      value={bookTime}
                      onChange={(e) => setBookTime(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-[#12161f] border border-slate-200 dark:border-slate-800 rounded-xl text-app outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted uppercase">Duration</label>
                  <select
                    value={bookDuration}
                    onChange={(e) => setBookDuration(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 dark:bg-[#12161f] border border-slate-200 dark:border-slate-800 rounded-xl text-app outline-none focus:border-indigo-500"
                  >
                    <option value={30}>30 minutes</option>
                    <option value={60}>60 minutes (+50 points eligible)</option>
                    <option value={90}>90 minutes</option>
                    <option value={120}>120 minutes</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted uppercase">Meeting Call Link (Optional)</label>
                  <input
                    type="url"
                    placeholder="https://meet.google.com/xyz..."
                    value={bookMeetingLink}
                    onChange={(e) => setBookMeetingLink(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 dark:bg-[#12161f] border border-slate-200 dark:border-slate-800 rounded-xl text-app outline-none focus:border-indigo-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={bookingLoading}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold transition-all shadow disabled:opacity-50"
                >
                  {bookingLoading ? 'Sending Request...' : 'Send Session Request'}
                </button>
              </form>
            </div>
          ) : (
            /* IF OWN PROFILE: DO NOT RENDER BOOKING FORM! RENDER LINKEDIN-STYLE ANALYTICS & SHORTCUTS */
            <div className="space-y-5">
              {/* Profile Analytics */}
              <div className="bg-white dark:bg-[#22242a] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 space-y-4 shadow-sm">
                <h3 className="text-base font-extrabold text-app font-outfit flex items-center gap-2">
                  <Sparkles size={18} className="text-indigo-600 dark:text-indigo-400" />
                  Your Profile Analytics
                </h3>

                <div className="grid grid-cols-2 gap-3">
                  <TiltCard intensity={10}>
                    <div className="p-3.5 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-900/40 text-center h-full">
                      <span className="text-xl font-extrabold text-indigo-600 dark:text-indigo-400 font-mono">
                        {profileUser.points || 0}
                      </span>
                      <p className="text-[11px] font-bold text-muted mt-0.5">Karma Points</p>
                    </div>
                  </TiltCard>

                  <TiltCard intensity={10}>
                    <div className="p-3.5 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/40 text-center h-full">
                      <span className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">
                        {profileUser.sessionsCompleted || 0}
                      </span>
                      <p className="text-[11px] font-bold text-muted mt-0.5">Sessions Completed</p>
                    </div>
                  </TiltCard>
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2 text-xs">
                  <div className="flex justify-between text-muted">
                    <span>Profile Visibility:</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">Public & Active</span>
                  </div>
                  <div className="flex justify-between text-muted">
                    <span>Followers:</span>
                    <span className="font-bold text-app">{profileUser.followersCount || 0} peers</span>
                  </div>
                </div>
              </div>

              {/* Quick Actions Shortcuts */}
              <div className="bg-white dark:bg-[#22242a] border border-slate-200 dark:border-slate-800 rounded-3xl p-5 space-y-2.5 shadow-sm">
                <h4 className="text-xs font-bold uppercase text-muted tracking-wider mb-1">
                  Manage Account
                </h4>
                <button
                  type="button"
                  onClick={() => setShowEditModal(true)}
                  className="w-full flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-[#12161f] hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-xs font-bold text-app transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <Pencil size={14} className="text-indigo-600" /> Edit Profile Details
                  </span>
                </button>
                <Link
                  to="/bookings"
                  className="w-full flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-[#12161f] hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-xs font-bold text-app transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <Calendar size={14} className="text-blue-500" /> View Session Bookings
                  </span>
                </Link>
                <Link
                  to="/roadmap"
                  className="w-full flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-[#12161f] hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-xs font-bold text-app transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <BookOpen size={14} className="text-purple-500" /> Learning Roadmaps
                  </span>
                </Link>
              </div>
            </div>
          )}

          {/* Social Presence & Resume Downloads */}
          <div className="bg-white dark:bg-[#22242a] border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 space-y-3.5 shadow-sm mb-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase text-muted tracking-wider">
                Links & Contact
              </h3>
              {isOwnProfile && (
                <button
                  type="button"
                  onClick={() => setShowEditModal(true)}
                  className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  Edit Links
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-2 pt-1">
              {profileUser.socialLinks?.linkedin && (
                <a
                  href={profileUser.socialLinks.linkedin}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#12161f] hover:bg-blue-50 dark:hover:bg-blue-950/40 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-app hover:text-blue-600 transition-colors"
                >
                  <Briefcase size={13} className="text-blue-600" />
                  <span>LinkedIn</span>
                </a>
              )}
              {profileUser.socialLinks?.github && (
                <a
                  href={profileUser.socialLinks.github}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#12161f] hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-app transition-colors"
                >
                  <GitBranch size={13} />
                  <span>GitHub</span>
                </a>
              )}
              {profileUser.socialLinks?.twitter && (
                <a
                  href={profileUser.socialLinks.twitter}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#12161f] hover:bg-sky-50 dark:hover:bg-sky-950/40 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-app hover:text-sky-500 transition-colors"
                >
                  <Globe size={13} className="text-sky-500" />
                  <span>Twitter</span>
                </a>
              )}
              {profileUser.socialLinks?.website && (
                <a
                  href={profileUser.socialLinks.website}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#12161f] hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-app transition-colors"
                >
                  <Globe size={13} className="text-emerald-500" />
                  <span>Website</span>
                </a>
              )}
              {profileUser.resumeFile && (
                <a
                  href={resumeViewUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 border border-indigo-200 dark:border-indigo-800 text-xs font-bold text-indigo-600 dark:text-indigo-400 transition-colors shadow-sm"
                >
                  <FileText size={13} />
                  <span>View Resume</span>
                </a>
              )}
              {!profileUser.socialLinks?.linkedin &&
                !profileUser.socialLinks?.github &&
                !profileUser.socialLinks?.twitter &&
                !profileUser.socialLinks?.website &&
                !profileUser.resumeFile && (
                  <p className="text-xs text-muted italic py-1">
                    No public links or portfolio added yet.
                  </p>
                )}
            </div>
          </div>
          </div>
        </ScrollReveal>
      </div>
      </div>

      {/* Followers / Following Drawer */}
      {drawerType &&
        createPortal(
          <div
            role="dialog"
            data-modal="true"
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 overscroll-contain animate-fade-in"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setDrawerType(null);
                setDrawerUsers([]);
              }
            }}
          >
            <div
              className="w-full max-w-sm bg-white dark:bg-[#22242a] rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[80vh] animate-modal-enter"
              onClick={(e) => e.stopPropagation()}
            >
            {/* Drawer Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800">
              <h3 className="font-bold text-base text-app capitalize">{drawerType}</h3>
              <button
                type="button"
                onClick={() => { setDrawerType(null); setDrawerUsers([]); }}
                className="text-muted hover:text-app p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Drawer Body */}
            <div className="overflow-y-auto flex-1">
              {drawerLoading ? (
                <div className="flex justify-center items-center py-12">
                  <div className="w-8 h-8 rounded-full border-4 border-indigo-500/20 border-t-indigo-500 animate-spin" />
                </div>
              ) : drawerUsers.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted space-y-2">
                  <Users size={32} />
                  <p className="text-sm">No {drawerType} yet</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {drawerUsers.map((u) => {
                    const isSelf = currentUser?._id === u._id?.toString();
                    return (
                      <div key={u._id} className="flex items-center gap-3 px-5 py-3">
                        <img
                          src={u.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name || 'User')}&background=6366f1&color=fff`}
                          alt={u.name}
                          onClick={() => { setDrawerType(null); navigate(`/profile/${u._id}`); }}
                          className="w-11 h-11 rounded-full object-cover bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 cursor-pointer shrink-0"
                        />
                        <div
                          className="flex-1 min-w-0 cursor-pointer"
                          onClick={() => { setDrawerType(null); navigate(`/profile/${u._id}`); }}
                        >
                          <p className="text-sm font-bold text-app truncate">{u.name}</p>
                          <p className="text-xs text-muted truncate">@{u.username || 'user'}</p>
                        </div>
                        {!isSelf && (
                          <button
                            type="button"
                            onClick={async () => {
                              try {
                                const res = await apiClient.post(`/api/users/${u._id}/follow`, {});
                                setDrawerUsers(prev => prev.map(x =>
                                  x._id === u._id ? { ...x, isFollowing: res.data.user?.isFollowing } : x
                                ));
                              } catch {}
                            }}
                            className={`text-xs font-bold px-3 py-1.5 rounded-xl transition-colors shrink-0 ${
                              u.isFollowing
                                ? 'bg-slate-100 dark:bg-slate-800 text-muted hover:bg-slate-200'
                                : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                            }`}
                          >
                            {u.isFollowing ? 'Following' : 'Follow'}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* 3. COMPREHENSIVE EDIT PROFILE MODAL */}
      {showEditModal &&
        createPortal(
          <div
            role="dialog"
            data-modal="true"
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 overflow-y-auto scrollbar-none overscroll-contain animate-fade-in"
            onWheel={(e) => e.stopPropagation()}
            onClick={(e) => {
              if (e.target === e.currentTarget) setShowEditModal(false);
            }}
          >
            <div
              onWheel={(e) => e.stopPropagation()}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-2xl bg-white dark:bg-[#22242a] p-6 rounded-3xl space-y-4 my-8 border border-slate-200 dark:border-slate-800 shadow-2xl max-h-[90vh] overflow-y-auto scrollbar-none overscroll-contain text-app animate-modal-enter"
            >
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-app text-base flex items-center gap-2">
                  <Pencil size={18} className="text-indigo-600" />
                  Edit Public Profile
                </h3>
                <p className="text-xs text-muted">Update your details</p>
              </div>
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                className="text-muted hover:text-app p-1 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>

            {saveSuccessMsg && (
              <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
                <CheckCircle size={15} />
                <span>{saveSuccessMsg}</span>
              </div>
            )}

            {profileError && (
              <div className="p-3 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-xs font-semibold text-red-600 dark:text-red-400">
                {profileError}
              </div>
            )}

            <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
              {/* Profile Visual Identity Card (Cover & Avatar) */}
              <div className="space-y-3 p-4 rounded-3xl bg-slate-50 dark:bg-[#1a1c24] border border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-muted uppercase tracking-wider flex items-center gap-1.5">
                    <ImageIcon size={13} className="text-indigo-600" />
                    Profile Images
                  </span>
                </div>

                {/* Banner & Avatar Interactive Canvas */}
                <div className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-900 shadow-sm">
                  {/* Cover Canvas */}
                  <div className="h-32 sm:h-36 w-full relative overflow-hidden bg-slate-800">
                    {editCoverImage ? (
                      <img
                        src={editCoverImage}
                        alt="Cover preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center">
                        <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 tracking-wider uppercase select-none">
                          No Cover Image Set
                        </span>
                      </div>
                    )}
                    {/* Dark gradient overlay for contrast */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20 pointer-events-none" />

                    {/* Cover Actions Top-Right */}
                    <div className="absolute top-2.5 right-2.5 flex items-center gap-2 z-10">
                      <input
                        type="file"
                        ref={coverFileInputRef}
                        onChange={handleCoverFileUpload}
                        accept="image/*"
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => coverFileInputRef.current?.click()}
                        disabled={coverUploading}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl !bg-white hover:!bg-slate-100 !text-slate-900 text-xs font-bold transition-all shadow-md active:scale-95 disabled:opacity-50 border border-slate-200 cursor-pointer"
                        title="Upload cover image from device"
                      >
                        {coverUploading ? <Loader2 size={13} className="animate-spin text-indigo-600" /> : <Camera size={13} className="text-indigo-600" />}
                        <span>{coverUploading ? 'Uploading...' : 'Change Cover'}</span>
                      </button>
                      {editCoverImage && (
                        <button
                          type="button"
                          onClick={() => setEditCoverImage('')}
                          className="p-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white transition-colors shadow-md"
                          title="Remove cover image"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Avatar Inset Overlap */}
                  <div className="px-4 pb-3 pt-0 flex flex-col sm:flex-row sm:items-end justify-between gap-3 bg-white dark:bg-[#22242a]">
                    <div className="relative -mt-10 sm:-mt-12 flex items-center sm:items-end gap-3 min-w-0">
                      <input
                        type="file"
                        ref={avatarFileInputRef}
                        onChange={handleAvatarFileUpload}
                        accept="image/*"
                        className="hidden"
                      />
                      {/* Clickable Avatar Circle */}
                      <div
                        onClick={() => !avatarUploading && avatarFileInputRef.current?.click()}
                        className="relative group shrink-0 w-20 h-20 sm:w-24 sm:h-24 cursor-pointer"
                        title="Click image to change avatar"
                      >
                        <img
                          src={editAvatar || (profileUser?.name ? `https://ui-avatars.com/api/?name=${encodeURIComponent(profileUser.name)}&background=6366f1&color=fff` : '/favicon.svg')}
                          alt="Avatar preview"
                          className="w-full h-full aspect-square rounded-full object-cover bg-slate-100 dark:bg-slate-800 border-4 border-white dark:border-[#22242a] shadow-xl shrink-0"
                        />
                        {/* Sleek Hover Camera Overlay */}
                        <div className="absolute inset-0 rounded-full bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white transition-opacity duration-200">
                          {avatarUploading ? <Loader2 size={20} className="animate-spin text-white" /> : <Camera size={20} className="text-white" />}
                          <span className="text-[10px] font-bold mt-1 text-white">{avatarUploading ? 'Uploading...' : 'Change Photo'}</span>
                        </div>
                      </div>

                      <div className="min-w-0">
                        <p className="font-bold text-sm text-app truncate">{editName || profileUser?.name || 'Your Name'}</p>
                        <p className="text-[11px] text-muted truncate">@{editUsername || profileUser?.username || 'username'}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Direct Link Input Fields */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-muted uppercase tracking-wider flex items-center gap-1 mb-1">
                      <Link2 size={11} /> Avatar URL
                    </label>
                    <input
                      type="url"
                      value={editAvatar}
                      onChange={(e) => setEditAvatar(e.target.value)}
                      placeholder="https://... (direct image link)"
                      className="w-full px-3 py-2 bg-white dark:bg-[#15171e] border border-slate-200 dark:border-slate-700/80 rounded-xl text-app outline-none focus:border-indigo-500 text-xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-muted uppercase tracking-wider flex items-center gap-1 mb-1">
                      <Link2 size={11} /> Cover Banner URL
                    </label>
                    <input
                      type="url"
                      value={editCoverImage}
                      onChange={(e) => setEditCoverImage(e.target.value)}
                      placeholder="https://... (direct image link or Unsplash)"
                      className="w-full px-3 py-2 bg-white dark:bg-[#15171e] border border-slate-200 dark:border-slate-700/80 rounded-xl text-app outline-none focus:border-indigo-500 text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Basic Details: Name and Username */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-muted uppercase tracking-wider">Full Name</label>
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white dark:bg-[#15171e] border border-slate-200 dark:border-slate-700/80 rounded-xl text-app outline-none focus:border-indigo-500"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-muted uppercase tracking-wider">Username</label>
                  <input
                    type="text"
                    required
                    value={editUsername}
                    onChange={(e) => setEditUsername(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white dark:bg-[#15171e] border border-slate-200 dark:border-slate-700/80 rounded-xl text-app outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Bio */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-muted uppercase tracking-wider">Bio & About</label>
                <textarea
                  rows={2}
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  placeholder="Short bio about what you teach or learn..."
                  className="w-full px-3.5 py-2.5 bg-white dark:bg-[#15171e] border border-slate-200 dark:border-slate-700/80 rounded-xl text-app outline-none focus:border-indigo-500 resize-none"
                />
              </div>

              {/* Experience Level & Resume */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-muted uppercase tracking-wider">Experience Level</label>
                  <select
                    value={editExperienceLevel}
                    onChange={(e) => setEditExperienceLevel(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white dark:bg-[#15171e] border border-slate-200 dark:border-slate-700/80 rounded-xl text-app outline-none focus:border-indigo-500"
                  >
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Senior">Senior / Mentor</option>
                    <option value="Lead">Lead / Expert</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-muted uppercase tracking-wider">Resume PDF</label>
                  <input
                    type="file"
                    accept="application/pdf"
                    onChange={handleResumeUpload}
                    className="w-full px-3 py-1.5 bg-white dark:bg-[#15171e] border border-slate-200 dark:border-slate-700/80 rounded-xl text-app text-xs"
                  />
                  {resumeUploading && <p className="text-[10px] text-blue-500">Uploading resume...</p>}
                  {editResumeUrl && !resumeUploading && (
                    <a
                      href={editResumeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block text-[11px] font-semibold text-indigo-500 hover:underline"
                    >
                      View uploaded resume PDF
                    </a>
                  )}
                </div>
              </div>

              {/* Social Profiles */}
              <div className="space-y-2.5 border-t border-slate-100 dark:border-slate-800 pt-3">
                <label className="text-[11px] font-bold text-muted uppercase tracking-wider">
                  Social Links
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="url"
                    placeholder="GitHub URL"
                    value={editSocials.github || ''}
                    onChange={(e) => updateSocial('github', e.target.value)}
                    className="w-full px-3.5 py-2 bg-white dark:bg-[#15171e] border border-slate-200 dark:border-slate-700/80 rounded-xl text-app outline-none focus:border-indigo-500"
                  />
                  <input
                    type="url"
                    placeholder="LinkedIn URL"
                    value={editSocials.linkedin || ''}
                    onChange={(e) => updateSocial('linkedin', e.target.value)}
                    className="w-full px-3.5 py-2 bg-white dark:bg-[#15171e] border border-slate-200 dark:border-slate-700/80 rounded-xl text-app outline-none focus:border-indigo-500"
                  />
                  <input
                    type="url"
                    placeholder="Twitter / X URL"
                    value={editSocials.twitter || ''}
                    onChange={(e) => updateSocial('twitter', e.target.value)}
                    className="w-full px-3.5 py-2 bg-white dark:bg-[#15171e] border border-slate-200 dark:border-slate-700/80 rounded-xl text-app outline-none focus:border-indigo-500"
                  />
                  <input
                    type="url"
                    placeholder="Portfolio Website"
                    value={editSocials.website || ''}
                    onChange={(e) => updateSocial('website', e.target.value)}
                    className="w-full px-3.5 py-2 bg-white dark:bg-[#15171e] border border-slate-200 dark:border-slate-700/80 rounded-xl text-app outline-none focus:border-indigo-500"
                  />
                  <input
                    type="url"
                    placeholder="Instagram URL"
                    value={editSocials.instagram || ''}
                    onChange={(e) => updateSocial('instagram', e.target.value)}
                    className="w-full px-3.5 py-2 bg-white dark:bg-[#15171e] border border-slate-200 dark:border-slate-700/80 rounded-xl text-app outline-none focus:border-indigo-500"
                  />
                  <input
                    type="url"
                    placeholder="YouTube URL"
                    value={editSocials.youtube || ''}
                    onChange={(e) => updateSocial('youtube', e.target.value)}
                    className="w-full px-3.5 py-2 bg-white dark:bg-[#15171e] border border-slate-200 dark:border-slate-700/80 rounded-xl text-app outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Education History */}
              <div className="space-y-3 border-t border-slate-100 dark:border-slate-800 pt-3">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-muted uppercase tracking-wider">
                    Education
                  </label>
                  <button
                    type="button"
                    onClick={addEducation}
                    className="flex items-center gap-1 px-3 py-1 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 font-bold hover:bg-indigo-100 text-[11px]"
                  >
                    <Plus size={13} /> Add
                  </button>
                </div>
                {editEducation.map((edu, index) => (
                  <div
                    key={index}
                    className="rounded-2xl border border-slate-200 dark:border-slate-800 p-3 space-y-2 bg-slate-50 dark:bg-[#1a1c24]"
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-bold text-muted uppercase">
                        Education #{index + 1}
                      </span>
                      {editEducation.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeEducation(index)}
                          className="text-[10px] text-red-500 font-bold hover:underline"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={edu.degree || ''}
                        onChange={(e) => updateEducation(index, 'degree', e.target.value)}
                        placeholder="Degree / Course"
                        className="w-full px-3 py-2 bg-white dark:bg-[#15171e] border border-slate-200 dark:border-slate-700/80 rounded-xl text-app outline-none focus:border-indigo-500"
                      />
                      <input
                        type="text"
                        value={edu.institution || ''}
                        onChange={(e) => updateEducation(index, 'institution', e.target.value)}
                        placeholder="University / Institute"
                        className="w-full px-3 py-2 bg-white dark:bg-[#15171e] border border-slate-200 dark:border-slate-700/80 rounded-xl text-app outline-none focus:border-indigo-500"
                      />
                      <input
                        type="text"
                        value={edu.fieldOfStudy || ''}
                        onChange={(e) => updateEducation(index, 'fieldOfStudy', e.target.value)}
                        placeholder="Field of Study"
                        className="w-full px-3 py-2 bg-white dark:bg-[#15171e] border border-slate-200 dark:border-slate-700/80 rounded-xl text-app outline-none focus:border-indigo-500"
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          value={edu.startYear || ''}
                          onChange={(e) => updateEducation(index, 'startYear', e.target.value)}
                          placeholder="Start Year"
                          className="w-full px-3 py-2 bg-white dark:bg-[#15171e] border border-slate-200 dark:border-slate-700/80 rounded-xl text-app outline-none focus:border-indigo-500"
                        />
                        <input
                          type="text"
                          value={edu.endYear || ''}
                          onChange={(e) => updateEducation(index, 'endYear', e.target.value)}
                          placeholder="End Year"
                          className="w-full px-3 py-2 bg-white dark:bg-[#15171e] border border-slate-200 dark:border-slate-700/80 rounded-xl text-app outline-none focus:border-indigo-500"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Featured Projects */}
              <div className="space-y-3 border-t border-slate-100 dark:border-slate-800 pt-3">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-muted uppercase tracking-wider">
                    Featured Projects
                  </label>
                  <button
                    type="button"
                    onClick={addProject}
                    className="flex items-center gap-1 px-3 py-1 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 font-bold hover:bg-indigo-100 text-[11px]"
                  >
                    <Plus size={13} /> Add
                  </button>
                </div>
                {editProjects.map((proj, index) => (
                  <div
                    key={index}
                    className="rounded-2xl border border-slate-200 dark:border-slate-800 p-3 space-y-2 bg-slate-50 dark:bg-[#1a1c24]"
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-bold text-muted uppercase">
                        Project #{index + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeProject(index)}
                        className="text-[10px] text-red-500 font-bold hover:underline"
                      >
                        Remove
                      </button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={proj.title || ''}
                        onChange={(e) => updateProject(index, 'title', e.target.value)}
                        placeholder="Project Title"
                        className="w-full px-3 py-2 bg-white dark:bg-[#15171e] border border-slate-200 dark:border-slate-700/80 rounded-xl text-app outline-none focus:border-indigo-500"
                      />
                      <input
                        type="text"
                        value={Array.isArray(proj.tags) ? proj.tags.join(', ') : (proj.tags || '')}
                        onChange={(e) => updateProject(index, 'tags', e.target.value)}
                        placeholder="Tags (comma-separated)"
                        className="w-full px-3 py-2 bg-white dark:bg-[#15171e] border border-slate-200 dark:border-slate-700/80 rounded-xl text-app outline-none focus:border-indigo-500"
                      />
                    </div>
                    <textarea
                      rows={2}
                      value={proj.description || ''}
                      onChange={(e) => updateProject(index, 'description', e.target.value)}
                      placeholder="Brief description..."
                      className="w-full px-3 py-2 bg-white dark:bg-[#15171e] border border-slate-200 dark:border-slate-700/80 rounded-xl text-app outline-none focus:border-indigo-500 resize-none"
                    />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <input
                        type="url"
                        value={proj.githubUrl || ''}
                        onChange={(e) => updateProject(index, 'githubUrl', e.target.value)}
                        placeholder="GitHub / Source code URL"
                        className="w-full px-3 py-2 bg-white dark:bg-[#15171e] border border-slate-200 dark:border-slate-700/80 rounded-xl text-app outline-none focus:border-indigo-500"
                      />
                      <input
                        type="url"
                        value={proj.liveUrl || ''}
                        onChange={(e) => updateProject(index, 'liveUrl', e.target.value)}
                        placeholder="Live Demo URL"
                        className="w-full px-3 py-2 bg-white dark:bg-[#15171e] border border-slate-200 dark:border-slate-700/80 rounded-xl text-app outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-app rounded-2xl font-bold transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingProfile}
                  className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-bold transition-all shadow-md disabled:opacity-50"
                >
                  {savingProfile ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* ALL POSTS MODAL (Shown when clicking "View More" on Activity & Posts) */}
      {showAllPostsModal &&
        createPortal(
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
            onClick={() => setShowAllPostsModal(false)}
          >
            <div
              className="bg-white dark:bg-[#22242a] border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-app font-outfit flex items-center gap-2">
                    <BookOpen size={18} className="text-indigo-600 dark:text-indigo-400" />
                    All Posts & Activity
                  </h3>
                  <p className="text-xs text-muted">
                    {profileUser?.name} has shared {userPosts.length} posts
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAllPostsModal(false)}
                  className="p-2 rounded-xl text-muted hover:text-app hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Modal Body - Scrollable list of all posts */}
              <div className="p-5 overflow-y-auto space-y-3.5 flex-1">
                {userPosts.map((post) => {
                  const liked = post.likes?.some(
                    (id) => (id?._id || id)?.toString() === currentUser?._id?.toString()
                  );
                  const isCommentOpen = openCommentPostId === post._id;
                  return (
                    <div
                      key={post._id}
                      className="p-4 rounded-2xl bg-slate-50 dark:bg-[#12161f] border border-slate-200 dark:border-slate-800/80 space-y-2.5 transition-all hover:border-slate-300 dark:hover:border-slate-700"
                    >
                      <p className="text-xs sm:text-sm text-app leading-relaxed whitespace-pre-wrap">
                        {post.content}
                      </p>

                      {/* Recent comments preview */}
                      {(post.comments || []).length > 0 && (
                        <div className="space-y-1">
                          {(post.comments || []).slice(-3).map((comment, ci) => {
                            const ca = comment.author || comment.user || {};
                            return (
                              <div key={ci} className="flex items-start gap-1.5 text-[11px] bg-white dark:bg-slate-900/50 p-2 rounded-xl border border-slate-200 dark:border-slate-800">
                                <img
                                  src={ca.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(ca.name || 'U')}&background=6366f1&color=fff`}
                                  alt={ca.name}
                                  className="w-5 h-5 rounded-full object-cover shrink-0 mt-0.5"
                                />
                                <span><strong className="text-app font-semibold">{ca.name || 'User'}:</strong> <span className="text-muted">{comment.content}</span></span>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Inline comment input */}
                      {isCommentOpen && (
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder="Write a comment..."
                            value={postCommentDrafts[post._id] || ''}
                            onChange={(e) =>
                              setPostCommentDrafts((prev) => ({ ...prev, [post._id]: e.target.value }))
                            }
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') { e.preventDefault(); addCommentInProfile(post._id); }
                            }}
                            className="flex-1 bg-white dark:bg-[#22242a] border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs text-app placeholder:text-muted outline-none focus:border-indigo-500"
                            autoFocus
                          />
                          <button
                            type="button"
                            onClick={() => addCommentInProfile(post._id)}
                            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all"
                          >
                            Post
                          </button>
                        </div>
                      )}

                      <div className="flex items-center justify-between text-[11px] text-muted pt-2 border-t border-slate-100 dark:border-slate-800">
                        <span>
                          {new Date(post.createdAt).toLocaleDateString([], {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </span>
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => likePostInProfile(post._id)}
                            className={`flex items-center gap-1 transition-colors ${liked ? 'text-rose-500 font-bold' : 'text-muted hover:text-rose-500'}`}
                          >
                            <Heart size={13} fill={liked ? 'currentColor' : 'none'} />
                            <span>{post.likes?.length || 0}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setOpenCommentPostId(isCommentOpen ? null : post._id)}
                            className={`flex items-center gap-1 transition-colors ${isCommentOpen ? 'text-indigo-500 font-bold' : 'text-muted hover:text-indigo-500'}`}
                          >
                            <MessageCircle size={13} />
                            <span>{post.comments?.length || 0}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}

              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};

export default PublicProfile;
