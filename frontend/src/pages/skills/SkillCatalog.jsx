import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';
import { updateProfileSuccess } from '../../features/authSlice.js';
import apiClient from '../../services/apiClient.js';
import { Search, Plus, Check, X, BookPlus, Send } from 'lucide-react';
import IsometricStackIcon from '../../components/common/IsometricStackIcon.jsx';
import { useDocumentHead } from '../../hooks/useDocumentHead.js';

const SkillCatalog = () => {
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const location = useLocation();
  const navigate = useNavigate();

  useDocumentHead({
    title: 'Courses - Orbitus',
    description: 'Discover certifiable skills in Programming, Languages, Design, Business, and Science. Exchange knowledge peer-to-peer on Orbitus.',
    canonical: 'https://orbitus-skill-swap-platform.vercel.app/skills'
  });

  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [skillsError, setSkillsError] = useState('');
  const initialSearchQuery = new URLSearchParams(location.search).get('search') || '';
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery);
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState(initialSearchQuery.trim());
  const [levelTab, setLevelTab] = useState('All');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [msg, setMsg] = useState('');

  // Course Request Modal State
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [reqName, setReqName] = useState('');
  const [reqCategory, setReqCategory] = useState('Programming & Tech');
  const [reqCustomCategory, setReqCustomCategory] = useState('');
  const [reqDesc, setReqDesc] = useState('');
  const [reqTags, setReqTags] = useState('');
  const [reqIntent, setReqIntent] = useState('teach');
  const [reqLevel, setReqLevel] = useState('Intermediate');
  const [reqSubmitting, setReqSubmitting] = useState(false);
  const [reqError, setReqError] = useState('');
  const [reqSuccessMsg, setReqSuccessMsg] = useState('');

  // Level selector modal state
  const [activeSkillModal, setActiveSkillModal] = useState(null);
  const [selectedLevel, setSelectedLevel] = useState('Intermediate');
  const searchInputRef = useRef(null);

  const categories = [
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

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearchQuery(searchQuery.trim());
    }, 300);
    return () => window.clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    setSearchQuery(new URLSearchParams(location.search).get('search') || '');
  }, [location.search]);

  useEffect(() => {
    if (location.hash !== '#search') return;
    const frameId = window.requestAnimationFrame(() => {
      searchInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      searchInputRef.current?.focus({ preventScroll: true });
    });
    return () => window.cancelAnimationFrame(frameId);
  }, [location.hash]);

  const fetchSkills = useCallback(async () => {
    setLoading(true);
    setSkillsError('');
    try {
      const res = await apiClient.get('/api/skills', {
        params: {
          category: selectedCategory !== 'All' ? selectedCategory : undefined,
          search: debouncedSearchQuery || undefined
        }
      });
      const payload = res.data?.data || res.data || {};
      const rawSkills = payload.skills || res.data?.skills || [];
      if (Array.isArray(rawSkills)) {
        setSkills(rawSkills);
      } else {
        setSkills([]);
        setSkillsError('Received an unexpected skills data format.');
      }
    } catch (err) {
      console.error('Error fetching skills list:', err);
      setSkills([]);
      setSkillsError(err.response?.data?.message || err.message || 'Failed to load skills catalog.');
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, debouncedSearchQuery]);

  useEffect(() => {
    fetchSkills();
  }, [fetchSkills]);

  const handleToggleTeaches = (skillId, isAdded) => {
    if (!user) {
      navigate('/login?redirect=/skills');
      return;
    }
    if (isAdded) {
      const updatedTeaches = (user.skillsTeach || []).filter(
        (s) => (s.skill?._id || s.skill)?.toString() !== skillId.toString()
      );
      updateProfileSkills(updatedTeaches, user.skillsLearn || []);
    } else {
      setActiveSkillModal({ skillId, type: 'teach' });
      setSelectedLevel('Intermediate');
    }
  };

  const handleToggleLearns = (skillId, isAdded) => {
    if (!user) {
      navigate('/login?redirect=/skills');
      return;
    }
    if (isAdded) {
      const updatedLearns = (user.skillsLearn || []).filter(
        (s) => (s.skill?._id || s.skill)?.toString() !== skillId.toString()
      );
      updateProfileSkills(user.skillsTeach || [], updatedLearns);
    } else {
      setActiveSkillModal({ skillId, type: 'learn' });
      setSelectedLevel('Beginner');
    }
  };

  const handleLevelSelectionSubmit = () => {
    if (!activeSkillModal) return;
    const { skillId, type } = activeSkillModal;

    if (type === 'teach') {
      const isAlreadyAdded = (user.skillsTeach || []).some(
        (s) => (s.skill?._id || s.skill)?.toString() === skillId.toString()
      );
      if (!isAlreadyAdded) {
        const updatedTeaches = [...(user.skillsTeach || []), { skill: skillId, level: selectedLevel }];
        updateProfileSkills(updatedTeaches, user.skillsLearn || []);
      }
    } else {
      const isAlreadyAdded = (user.skillsLearn || []).some(
        (s) => (s.skill?._id || s.skill)?.toString() === skillId.toString()
      );
      if (!isAlreadyAdded) {
        const updatedLearns = [...(user.skillsLearn || []), { skill: skillId, level: selectedLevel }];
        updateProfileSkills(user.skillsTeach || [], updatedLearns);
      }
    }
    setActiveSkillModal(null);
  };

  const updateProfileSkills = async (skillsTeach, skillsLearn) => {
    try {
      const payloadTeach = skillsTeach.map((s) => ({
        skill: s.skill?._id || s.skill,
        level: s.level || 'Intermediate'
      }));
      const payloadLearn = skillsLearn.map((s) => ({
        skill: s.skill?._id || s.skill,
        level: s.level || 'Beginner'
      }));

      const res = await apiClient.put('/api/users/profile', {
        skillsTeach: payloadTeach,
        skillsLearn: payloadLearn
      });

      dispatch(updateProfileSuccess(res.data.user));
      setMsg('Skill updated successfully!');
      setTimeout(() => setMsg(''), 3000);
    } catch (err) {
      console.error('Error saving skills updates:', err);
    }
  };

  const handleRequestSubmit = async (e) => {
    e.preventDefault();
    if (!reqName.trim()) {
      setReqError('Course / Skill name is required.');
      return;
    }
    const finalCategory = reqCategory === 'Other' ? reqCustomCategory.trim() : reqCategory;
    if (reqCategory === 'Other' && !finalCategory) {
      setReqError('Please enter a custom category name.');
      return;
    }

    setReqSubmitting(true);
    setReqError('');
    setReqSuccessMsg('');
    try {
      const res = await apiClient.post('/api/skills/request', {
        name: reqName.trim(),
        category: finalCategory,
        description: reqDesc.trim(),
        tags: reqTags,
        intent: reqIntent,
        level: reqLevel
      });
      setReqSuccessMsg(res.data.message);
      setTimeout(() => {
        setReqSuccessMsg('');
        setShowRequestModal(false);
        setReqName('');
        setReqCustomCategory('');
        setReqDesc('');
        setReqTags('');
      }, 3000);
    } catch (err) {
      setReqError(err.response?.data?.message || 'Failed to submit course request.');
    } finally {
      setReqSubmitting(false);
    }
  };

  const filteredSkills = skills.filter((skill) => {
    if (levelTab === 'For you') {
      const isInterested =
        (user?.interests || []).includes(skill.category) ||
        (user?.skillsLearn || []).some(
          (entry) => (entry.skill?._id || entry.skill)?.toString() === skill._id.toString()
        );
      return isInterested;
    }
    if (['Beginner', 'Intermediate', 'Advanced'].includes(levelTab)) {
      return (user?.skillsLearn || []).some(
        (entry) =>
          (entry.skill?._id || entry.skill)?.toString() === skill._id.toString() &&
          entry.level?.toLowerCase() === levelTab.toLowerCase()
      );
    }
    return true;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto min-w-0">
      {/* ── Title & Subtitle matching the reference mockup exactly ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="orb-page-title">Courses</h1>
          <p className="orb-page-subtitle">
            You can improve your design abilities through interactive, hands-on courses
          </p>
        </div>
        <div className="flex items-center gap-3">
          {msg && (
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1.5 rounded-full border border-emerald-200 dark:border-emerald-800">
              {msg}
            </span>
          )}
          <button
            type="button"
            onClick={() => {
              setReqError('');
              setReqSuccessMsg('');
              setShowRequestModal(true);
            }}
            className="orb-btn-ghost text-xs font-semibold"
          >
            <BookPlus size={15} />
            <span>Propose Course</span>
          </button>
        </div>
      </div>

      {/* ── Filter Pills: All | For you | Beginner | Intermediate | Advanced ── */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-1">
          {['All', 'For you', 'Beginner', 'Intermediate', 'Advanced'].map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setLevelTab(tab)}
              className={`orb-tab${levelTab === tab ? ' orb-tab-active' : ''}`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Search & Category Pills */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-60">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              ref={searchInputRef}
              id="skill-search"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Search courses"
              placeholder="Search courses..."
              className="w-full pl-9 pr-3 py-1.5 rounded-full text-xs bg-white dark:bg-[#151821] border border-slate-200/80 dark:border-slate-800 text-slate-800 dark:text-slate-200 outline-none focus:border-indigo-500 shadow-xs"
            />
          </div>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-1.5 rounded-full text-xs bg-white dark:bg-[#151821] border border-slate-200/80 dark:border-slate-800 text-slate-600 dark:text-slate-300 outline-none focus:border-indigo-500 shadow-xs cursor-pointer"
          >
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* ── Thin divider line matching reference UI ── */}
      <div className="orb-divider" />

      {/* ── Courses Card Grid (3 columns on desktop, exactly like screenshot) ── */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <div className="w-8 h-8 border-3 border-indigo-600/30 border-t-indigo-600 rounded-full animate-spin" />
          <span className="text-xs text-slate-400">Loading courses...</span>
        </div>
      ) : skillsError ? (
        <div className="text-center py-16 p-6 orb-card">
          <p className="text-xs font-bold text-red-500">{skillsError}</p>
          <button
            type="button"
            onClick={fetchSkills}
            className="orb-btn-primary mt-3 text-xs"
          >
            Retry
          </button>
        </div>
      ) : filteredSkills.length === 0 ? (
        <div className="text-center py-20 orb-card text-slate-400 text-xs">
          No courses found matching this category or keyword.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredSkills.map((skill) => {
            const teachesIndex = (user?.skillsTeach || []).findIndex(
              (s) => (s.skill?._id || s.skill)?.toString() === skill._id.toString()
            );
            const learnsIndex = (user?.skillsLearn || []).findIndex(
              (s) => (s.skill?._id || s.skill)?.toString() === skill._id.toString()
            );

            const isTeaching = teachesIndex !== -1;
            const isLearning = learnsIndex !== -1;
            const teachLevel = isTeaching ? user.skillsTeach[teachesIndex]?.level : '';
            const learnLevel = isLearning ? user.skillsLearn[learnsIndex]?.level : '';

            const level = (isLearning ? learnLevel : isTeaching ? teachLevel : '') || '';
            const levelProgress = {
              beginner: 25,
              intermediate: 50,
              advanced: 75,
              expert: 100
            }[level.toLowerCase()] || 0;
            const levelLabel = isLearning
              ? `Target level · ${learnLevel || 'Not set'}`
              : isTeaching
                ? `Teaching level · ${teachLevel || 'Not set'}`
                : 'Not in your learning plan';

            return (
              <div
                key={skill._id}
                className="orb-card p-6 flex flex-col justify-between group transition-all"
              >
                <div>
                  {/* Isometric 3D Stack Icon & Category Badge */}
                  <div className="flex items-start justify-between">
                    <IsometricStackIcon size={34} />
                    <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 px-2.5 py-0.5 rounded-full border border-indigo-100 dark:border-indigo-900/50 truncate max-w-[140px]">
                      {skill.category}
                    </span>
                  </div>

                  {/* Course Title matching reference font & sizing */}
                  <h3
                    className="font-bold text-base text-slate-900 dark:text-white mt-4 truncate"
                    title={skill.name}
                  >
                    {skill.name}
                  </h3>

                  {/* Description: 2 lines */}
                  <p className="text-xs text-slate-400 dark:text-slate-500 line-clamp-2 mt-1 leading-relaxed">
                    {skill.description ||
                      'Explore this topic and connect with peers to learn or teach.'}
                  </p>
                </div>

                {/* Level meter reflects the selected profile level, not course completion. */}
                <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800/80">
                  <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-600 dark:bg-blue-500 rounded-full transition-all duration-500"
                      style={{ width: `${levelProgress}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500 mt-2 font-medium">
                    <span>{levelLabel}</span>
                    <span>{skill.tags?.[0] || 'Skill exchange'}</span>
                  </div>

                  {/* Action buttons (Teach / Learn) */}
                  <div className="grid grid-cols-2 gap-2 mt-4">
                    <button
                      type="button"
                      onClick={() => handleToggleTeaches(skill._id, isTeaching)}
                      className={`orb-btn-ghost text-xs py-2 w-full justify-center ${
                        isTeaching ? '!border-emerald-500 !text-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/20' : ''
                      }`}
                    >
                      {isTeaching ? (
                        <>
                          <Check size={12} className="text-emerald-600" />
                          <span>Teach ({teachLevel || '✓'})</span>
                        </>
                      ) : (
                        <>
                          <Plus size={12} />
                          <span>Teach</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleToggleLearns(skill._id, isLearning)}
                      className={`orb-btn-primary text-xs py-2 w-full justify-center ${
                        isLearning ? '!bg-purple-600' : ''
                      }`}
                    >
                      {isLearning ? (
                        <>
                          <Check size={12} />
                          <span>Learn ({learnLevel || '✓'})</span>
                        </>
                      ) : (
                        <>
                          <Plus size={12} />
                          <span>Learn</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Expertise Level Selector Modal ── */}
      {activeSkillModal && (
        <div
          role="dialog"
          data-modal="true"
          className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4"
        >
          <div className="w-full max-w-sm orb-card p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-2">
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                Select Expertise Level
              </h3>
              <button
                type="button"
                onClick={() => setActiveSkillModal(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-400">
              {activeSkillModal.type === 'teach'
                ? 'Specify your current proficiency level in this skill to guide matches.'
                : 'Select your target proficiency level in this skill.'}
            </p>

            <div className="grid grid-cols-2 gap-2 pt-1">
              {['Beginner', 'Intermediate', 'Advanced', 'Expert'].map((level) => (
                <button
                  key={level}
                  type="button"
                  onClick={() => setSelectedLevel(level)}
                  className={`py-2.5 rounded-xl text-xs font-semibold border transition-all ${
                    selectedLevel === level
                      ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={handleLevelSelectionSubmit}
              className="orb-btn-primary w-full py-2.5 text-xs mt-2"
            >
              Add to Profile
            </button>
          </div>
        </div>
      )}

      {/* ── Course / Skill Proposal Modal ── */}
      {showRequestModal && (
        <div
          role="dialog"
          data-modal="true"
          className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto"
        >
          <div className="w-full max-w-lg orb-card p-6 space-y-4 shadow-2xl my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
                  <BookPlus size={18} className="text-indigo-600" />
                  Propose a Course / Skill
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Suggest a topic you would like to teach or learn on Orbitus.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowRequestModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X size={18} />
              </button>
            </div>

            {reqSuccessMsg ? (
              <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 space-y-2 text-center">
                <div className="w-10 h-10 mx-auto rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center">
                  <Check size={20} />
                </div>
                <h4 className="text-xs font-bold text-emerald-600 dark:text-emerald-400">Request Received!</h4>
                <p className="text-xs text-slate-400">{reqSuccessMsg}</p>
              </div>
            ) : (
              <form onSubmit={handleRequestSubmit} className="space-y-3.5 text-xs">
                {reqError && (
                  <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-xs font-semibold text-red-600 dark:text-red-400">
                    {reqError}
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    Course / Skill Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. UX Design Foundations, Rust, French"
                    value={reqName}
                    onChange={(e) => setReqName(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-[#151821] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    Category *
                  </label>
                  <select
                    value={reqCategory}
                    onChange={(e) => setReqCategory(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-[#151821] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none focus:border-indigo-500 cursor-pointer"
                  >
                    {categories
                      .filter((c) => c !== 'All')
                      .map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    <option value="Other">Other</option>
                  </select>
                </div>

                {reqCategory === 'Other' && (
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      Specify Category *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. AI Systems, Culinary Arts"
                      value={reqCustomCategory}
                      onChange={(e) => setReqCustomCategory(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-[#151821] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none focus:border-indigo-500"
                    />
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    Your Intent *
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'teach', label: 'Teach' },
                      { id: 'learn', label: 'Learn' },
                      { id: 'both', label: 'Both' }
                    ].map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setReqIntent(opt.id)}
                        className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all text-center ${
                          reqIntent === opt.id
                            ? 'bg-indigo-600 border-indigo-600 text-white shadow-xs'
                            : 'border-slate-200 dark:border-slate-700 text-slate-500 hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    Level
                  </label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {['Beginner', 'Intermediate', 'Advanced', 'Expert'].map((lvl) => (
                      <button
                        key={lvl}
                        type="button"
                        onClick={() => setReqLevel(lvl)}
                        className={`py-2 rounded-xl text-xs font-bold border transition-all text-center ${
                          reqLevel === lvl
                            ? 'bg-indigo-600 border-indigo-600 text-white shadow-xs'
                            : 'border-slate-200 dark:border-slate-700 text-slate-500 hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        {lvl}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    Overview (optional)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Brief description of the course..."
                    value={reqDesc}
                    onChange={(e) => setReqDesc(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-[#151821] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none focus:border-indigo-500 resize-none"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowRequestModal(false)}
                    className="orb-btn-ghost flex-1 py-2.5 text-xs justify-center"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={reqSubmitting}
                    className="orb-btn-primary flex-1 py-2.5 text-xs justify-center"
                  >
                    <Send size={13} />
                    <span>{reqSubmitting ? 'Submitting...' : 'Submit Proposal'}</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SkillCatalog;
