import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { updateProfileSuccess } from '../../features/authSlice.js';
import apiClient from '../../services/apiClient.js';
import { Search, Plus, Check, ChevronRight, Award, HelpCircle, X, BookPlus, Send, Sparkles } from 'lucide-react';

const SkillCatalog = () => {
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();

  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
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
  const [activeSkillModal, setActiveSkillModal] = useState(null); // { skillId, type: 'teach' | 'learn' }
  const [selectedLevel, setSelectedLevel] = useState('Intermediate');

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
    fetchSkills();
  }, [selectedCategory, searchQuery]);

  const fetchSkills = async () => {
    try {
      const res = await apiClient.get('/api/skills', {
        params: {
          category: selectedCategory !== 'All' ? selectedCategory : undefined,
          search: searchQuery || undefined
        }
      });
      setSkills(res.data.skills);
    } catch (err) {
      console.error('Error fetching skills list:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleTeaches = async (skillId, isAdded) => {
    if (isAdded) {
      // Remove
      const updatedTeaches = user.skillsTeach.filter(s => s.skill._id.toString() !== skillId.toString());
      updateProfileSkills(updatedTeaches, user.skillsLearn);
    } else {
      // Open level modal
      setActiveSkillModal({ skillId, type: 'teach' });
      setSelectedLevel('Intermediate');
    }
  };

  const handleToggleLearns = async (skillId, isAdded) => {
    if (isAdded) {
      // Remove
      const updatedLearns = user.skillsLearn.filter(s => s.skill._id.toString() !== skillId.toString());
      updateProfileSkills(user.skillsTeach, updatedLearns);
    } else {
      // Open level modal
      setActiveSkillModal({ skillId, type: 'learn' });
      setSelectedLevel('Beginner');
    }
  };

  const handleLevelSelectionSubmit = () => {
    if (!activeSkillModal) return;
    const { skillId, type } = activeSkillModal;

    if (type === 'teach') {
      const isAlreadyAdded = user.skillsTeach.some(s => s.skill._id.toString() === skillId.toString());
      if (!isAlreadyAdded) {
        const updatedTeaches = [...user.skillsTeach, { skill: skillId, level: selectedLevel }];
        updateProfileSkills(updatedTeaches, user.skillsLearn);
      }
    } else {
      const isAlreadyAdded = user.skillsLearn.some(s => s.skill._id.toString() === skillId.toString());
      if (!isAlreadyAdded) {
        const updatedLearns = [...user.skillsLearn, { skill: skillId, level: selectedLevel }];
        updateProfileSkills(user.skillsTeach, updatedLearns);
      }
    }

    setActiveSkillModal(null);
  };

  const updateProfileSkills = async (skillsTeach, skillsLearn) => {
    try {
      // Map correctly to ID arrays with levels
      const payloadTeach = skillsTeach.map(s => ({
        skill: s.skill._id || s.skill,
        level: s.level
      }));
      const payloadLearn = skillsLearn.map(s => ({
        skill: s.skill._id || s.skill,
        level: s.level
      }));

      const res = await apiClient.put('/api/users/profile', {
        skillsTeach: payloadTeach,
        skillsLearn: payloadLearn
      });

      dispatch(updateProfileSuccess(res.data.user));
      setMsg('Skills portfolio updated successfully!');
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
      }, 3500);
    } catch (err) {
      setReqError(err.response?.data?.message || 'Failed to submit course request.');
    } finally {
      setReqSubmitting(false);
    }
  };

  return (
    <div className="page-shell space-y-8 overflow-y-auto animate-fade-in">
      {/* Banner Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-[#22242a] p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <h1 className="text-2xl lg:text-3xl font-extrabold text-app tracking-tight">Skills Catalog</h1>
          <p className="text-sm text-muted mt-1">Browse, search and set the skills you want to teach or learn</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {msg && (
            <span className="px-4 py-2 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold rounded-2xl animate-pulse">
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
            className="flex items-center gap-2 px-5 py-2.5 !bg-white dark:!bg-slate-800 hover:!bg-slate-50 dark:hover:!bg-slate-700/80 !text-slate-900 dark:!text-white border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-bold transition-all shadow-sm hover:shadow active:scale-95"
          >
            <BookPlus size={16} className="text-indigo-600 dark:text-indigo-400" />
            <span>Propose New Course / Skill</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Controls */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
        {/* Category filters */}
        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold border transition-all duration-200 ${
                selectedCategory === cat
                  ? 'bg-blue-600 border-blue-500 text-white shadow shadow-blue-600/20'
                  : 'bg-white dark:bg-[#22242a] border-slate-200 dark:border-slate-800 text-muted hover:text-app hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Search Input bar */}
        <div className="relative w-full md:w-64">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" size={16} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search skills databases..."
            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-[#12161f] border border-slate-200 dark:border-slate-800 rounded-xl text-app text-xs outline-none focus:border-blue-500 placeholder:text-muted"
          />
        </div>
      </div>

      {/* Grid listing */}
      {loading ? (
        <div className="flex flex-col justify-center items-center py-20 space-y-4">
          <div className="w-10 h-10 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
          <span className="text-xs text-muted">Indexing catalog catalog...</span>
        </div>
      ) : skills.length === 0 ? (
        <div className="text-center py-20 text-muted border border-dashed border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-[#22242a]/50 rounded-3xl">
          No skills found matching this category or keyword.
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-6">
          {skills.map((skill, idx) => {
            const teachesIndex = (user?.skillsTeach || []).findIndex(s => (s.skill?._id || s.skill)?.toString() === skill._id.toString());
            const learnsIndex = (user?.skillsLearn || []).findIndex(s => (s.skill?._id || s.skill)?.toString() === skill._id.toString());

            const isTeaching = teachesIndex !== -1;
            const isLearning = learnsIndex !== -1;

            const teachLevel = isTeaching ? user.skillsTeach[teachesIndex]?.level : '';
            const learnLevel = isLearning ? user.skillsLearn[learnsIndex]?.level : '';

            return (
              <div key={skill._id} className={`bg-white dark:bg-[#22242a] p-3 sm:p-5 rounded-2xl sm:rounded-3xl space-y-2.5 sm:space-y-4 flex flex-col justify-between border border-slate-200 dark:border-slate-800 hover:border-blue-500/40 interactive-card animate-card-enter shadow-sm stagger-${(idx % 6) + 1}`}>
                <div className="space-y-1 sm:space-y-2">
                  <div className="flex justify-between items-start">
                    <span className="text-[9px] sm:text-[10px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-200 dark:border-blue-500/20 truncate max-w-[130px]">
                      {skill.category}
                    </span>
                  </div>
                  <h3 className="font-extrabold text-xs sm:text-base text-app font-outfit truncate" title={skill.name}>{skill.name}</h3>
                  <p className="text-[10px] sm:text-xs text-muted line-clamp-2 sm:line-clamp-3 leading-snug sm:leading-relaxed">{skill.description}</p>
                </div>

                <div className="pt-2 sm:pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-1.5 sm:gap-2 mt-auto">
                  {/* Teach buttons */}
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] sm:text-xs text-muted font-medium">Teach:</span>
                    <button
                      onClick={() => handleToggleTeaches(skill._id, isTeaching)}
                      className={`flex items-center gap-1 px-2 py-1 sm:px-3 sm:py-1.5 rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-semibold border transition-all ${
                        isTeaching
                          ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                          : 'bg-slate-50 dark:bg-[#1a1c24] border-slate-200 dark:border-slate-700 text-app hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      {isTeaching ? (
                        <>
                          <Check size={11} />
                          <span>{teachLevel}</span>
                        </>
                      ) : (
                        <>
                          <Plus size={11} />
                          <span>Teach</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Learn buttons */}
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] sm:text-xs text-muted font-medium">Learn:</span>
                    <button
                      onClick={() => handleToggleLearns(skill._id, isLearning)}
                      className={`flex items-center gap-1 px-2 py-1 sm:px-3 sm:py-1.5 rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-semibold border transition-all ${
                        isLearning
                          ? 'bg-purple-50 dark:bg-purple-500/10 border-purple-200 dark:border-purple-500/20 text-purple-600 dark:text-purple-400'
                          : 'bg-slate-50 dark:bg-[#1a1c24] border-slate-200 dark:border-slate-700 text-app hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      {isLearning ? (
                        <>
                          <Check size={11} />
                          <span>{learnLevel}</span>
                        </>
                      ) : (
                        <>
                          <Plus size={11} />
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

      {/* Expertise Level selector modal */}
      {activeSkillModal && (
        <div role="dialog" data-modal="true" className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-white dark:bg-[#22242a] border border-slate-200 dark:border-slate-800 p-6 rounded-3xl space-y-4 shadow-2xl text-app">
            <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-2">
              <h3 className="font-bold text-app">Select Expertise Level</h3>
              <button onClick={() => setActiveSkillModal(null)} className="text-muted hover:text-app">✕</button>
            </div>
            
            <p className="text-xs text-muted">
              {activeSkillModal.type === 'teach'
                ? 'Specify your current proficiency level in this skill to guide matches.'
                : 'Select your target proficiency level in this skill.'}
            </p>

            <div className="grid grid-cols-2 gap-2 pt-2">
              {['Beginner', 'Intermediate', 'Advanced', 'Expert'].map((level) => (
                <button
                  key={level}
                  type="button"
                  onClick={() => setSelectedLevel(level)}
                  className={`py-3 rounded-2xl text-xs font-bold border transition-all ${
                    selectedLevel === level
                      ? 'bg-blue-600 border-blue-500 text-white shadow-lg'
                      : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-muted hover:text-app hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>

            <button
              onClick={handleLevelSelectionSubmit}
              className="btn-primary w-full py-3 text-xs mt-4"
            >
              Add to Profile Portfolio
            </button>
          </div>
        </div>
      )}

      {/* Course / Skill Proposal Modal */}
      {showRequestModal && (
        <div role="dialog" data-modal="true" className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-lg bg-white dark:bg-[#22242a] border border-slate-200 dark:border-slate-800 p-6 rounded-3xl space-y-4 shadow-2xl text-app my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="font-extrabold text-app text-base flex items-center gap-2">
                  <BookPlus size={18} className="text-blue-600" />
                  Propose a Skill
                </h3>
                <p className="text-xs text-muted mt-0.5">
                  Suggest a topic you'd like to teach or learn.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowRequestModal(false)}
                className="text-muted hover:text-app p-1 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>

            {reqSuccessMsg ? (
              <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 space-y-2 text-center">
                <div className="w-10 h-10 mx-auto rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center">
                  <Check size={20} />
                </div>
                <h4 className="text-xs font-bold text-emerald-600 dark:text-emerald-400">Request Received!</h4>
                <p className="text-xs text-muted leading-relaxed">
                  {reqSuccessMsg}
                </p>
              </div>
            ) : (
              <form onSubmit={handleRequestSubmit} className="space-y-3.5 text-xs">
                {reqError && (
                  <div className="p-3 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-xs font-semibold text-red-600 dark:text-red-400">
                    {reqError}
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-muted uppercase tracking-wider">
                    Skill Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Rust, French, Video Editing"
                    value={reqName}
                    onChange={(e) => setReqName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white dark:bg-[#15171e] border border-slate-200 dark:border-slate-700/80 rounded-xl text-app outline-none focus:border-blue-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-muted uppercase tracking-wider">
                    Category *
                  </label>
                  <select
                    value={reqCategory}
                    onChange={(e) => setReqCategory(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white dark:bg-[#15171e] border border-slate-200 dark:border-slate-700/80 rounded-xl text-app outline-none focus:border-blue-500"
                  >
                    {categories.filter(c => c !== 'All').map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                    <option value="Other">Other</option>
                  </select>
                </div>

                {reqCategory === 'Other' && (
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-muted uppercase tracking-wider">
                      Specify Category *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. AI, Culinary Arts"
                      value={reqCustomCategory}
                      onChange={(e) => setReqCustomCategory(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-white dark:bg-[#15171e] border border-slate-200 dark:border-slate-700/80 rounded-xl text-app outline-none focus:border-blue-500"
                    />
                  </div>
                )}

                {/* Intent: Teach, Learn, or Both */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-muted uppercase tracking-wider">
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
                            ? 'bg-blue-600 border-blue-500 text-white shadow'
                            : 'bg-white dark:bg-[#15171e] border-slate-200 dark:border-slate-700/80 text-muted hover:text-app'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Proficiency Level */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-muted uppercase tracking-wider">
                    Level
                  </label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {['Beginner', 'Intermediate', 'Advanced', 'Expert'].map((lvl) => (
                      <button
                        key={lvl}
                        type="button"
                        onClick={() => setReqLevel(lvl)}
                        className={`py-2 px-1 rounded-xl text-xs font-bold border transition-all text-center ${
                          reqLevel === lvl
                            ? 'bg-blue-600 border-blue-500 text-white shadow'
                            : 'bg-white dark:bg-[#15171e] border-slate-200 dark:border-slate-700/80 text-muted hover:text-app'
                        }`}
                      >
                        {lvl}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-muted uppercase tracking-wider">
                    Tags (optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. rust, systems, dev"
                    value={reqTags}
                    onChange={(e) => setReqTags(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white dark:bg-[#15171e] border border-slate-200 dark:border-slate-700/80 rounded-xl text-app outline-none focus:border-blue-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-muted uppercase tracking-wider">
                    Overview (optional)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Brief description..."
                    value={reqDesc}
                    onChange={(e) => setReqDesc(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white dark:bg-[#15171e] border border-slate-200 dark:border-slate-700/80 rounded-xl text-app outline-none focus:border-blue-500 resize-none"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowRequestModal(false)}
                    className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-app rounded-2xl font-bold transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={reqSubmitting}
                    className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-bold transition-all shadow-md disabled:opacity-50 flex items-center justify-center gap-1.5"
                  >
                    <Send size={14} />
                    <span>{reqSubmitting ? 'Submitting...' : 'Submit Request'}</span>
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
