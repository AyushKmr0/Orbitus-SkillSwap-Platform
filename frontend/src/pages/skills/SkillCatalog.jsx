import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { updateProfileSuccess } from '../../features/authSlice.js';
import axios from 'axios';
import { Search, Plus, Check, ChevronRight, Award, HelpCircle } from 'lucide-react';

const SkillCatalog = () => {
  const { user, token } = useSelector((state) => state.auth);
  const dispatch = useDispatch();

  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [msg, setMsg] = useState('');

  // Level selector modal state
  const [activeSkillModal, setActiveSkillModal] = useState(null); // { skillId, type: 'teach' | 'learn' }
  const [selectedLevel, setSelectedLevel] = useState('Intermediate');

  const categories = [
    'All',
    'Web Development',
    'MERN Stack',
    'Java',
    'Python',
    'UI/UX Design',
    'Data Science',
    'AI/ML',
    'Cyber Security',
    'Mobile Development'
  ];

  useEffect(() => {
    fetchSkills();
  }, [selectedCategory, searchQuery]);

  const fetchSkills = async () => {
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      let url = '/api/skills?';
      if (selectedCategory !== 'All') url += `category=${encodeURIComponent(selectedCategory)}&`;
      if (searchQuery) url += `search=${encodeURIComponent(searchQuery)}`;
      
      const res = await axios.get(url, config);
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
      const config = { headers: { Authorization: `Bearer ${token}` } };
      
      // Map correctly to ID arrays with levels
      const payloadTeach = skillsTeach.map(s => ({
        skill: s.skill._id || s.skill,
        level: s.level
      }));
      const payloadLearn = skillsLearn.map(s => ({
        skill: s.skill._id || s.skill,
        level: s.level
      }));

      const res = await axios.put('/api/users/profile', {
        skillsTeach: payloadTeach,
        skillsLearn: payloadLearn
      }, config);

      dispatch(updateProfileSuccess(res.data.user));
      setMsg('Skills portfolio updated successfully!');
      setTimeout(() => setMsg(''), 3000);
    } catch (err) {
      console.error('Error saving skills updates:', err);
    }
  };

  return (
    <div className="flex-1 p-6 lg:p-8 space-y-8 bg-slate-950 min-h-screen text-slate-200 overflow-y-auto">
      {/* Banner Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-r from-slate-900/60 to-slate-900/60 p-6 rounded-3xl border border-slate-800/60 backdrop-blur-md">
        <div>
          <h1 className="text-2xl lg:text-3xl font-extrabold text-white font-outfit tracking-tight">Skills Catalog</h1>
          <p className="text-sm text-slate-400 mt-1">Browse, search and set the skills you want to teach or learn</p>
        </div>
        {msg && (
          <span className="px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold rounded-2xl animate-pulse">
            {msg}
          </span>
        )}
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
                  ? 'bg-indigo-600 border-indigo-500 text-white shadow shadow-indigo-600/20'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-100 hover:bg-slate-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Search Input bar */}
        <div className="relative w-full md:w-64">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search skills databases..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-200 text-xs outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Grid listing */}
      {loading ? (
        <div className="flex flex-col justify-center items-center py-20 space-y-4">
          <div className="w-10 h-10 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
          <span className="text-xs text-slate-500">Indexing catalog catalog...</span>
        </div>
      ) : skills.length === 0 ? (
        <div className="text-center py-20 text-slate-500 border border-dashed border-slate-850 rounded-3xl">
          No skills found matching this category or keyword.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {skills.map((skill) => {
            const teachesIndex = user.skillsTeach.findIndex(s => s.skill._id.toString() === skill._id.toString());
            const learnsIndex = user.skillsLearn.findIndex(s => s.skill._id.toString() === skill._id.toString());

            const isTeaching = teachesIndex !== -1;
            const isLearning = learnsIndex !== -1;

            const teachLevel = isTeaching ? user.skillsTeach[teachesIndex].level : '';
            const learnLevel = isLearning ? user.skillsLearn[learnsIndex].level : '';

            return (
              <div key={skill._id} className="glass-panel p-6 rounded-3xl space-y-4 flex flex-col justify-between border-slate-850 hover:border-slate-800 transition-all shadow hover:shadow-lg">
                <div className="space-y-2">
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] font-bold text-indigo-400 bg-indigo-500/10 px-2.5 py-0.5 rounded-full border border-indigo-500/10">
                      {skill.category}
                    </span>
                  </div>
                  <h3 className="font-extrabold text-base text-slate-100 font-outfit">{skill.name}</h3>
                  <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed">{skill.description}</p>
                </div>

                <div className="pt-4 border-t border-slate-850 flex flex-col gap-2 mt-auto">
                  {/* Teach buttons */}
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400 font-medium">I Teach this:</span>
                    <button
                      onClick={() => handleToggleTeaches(skill._id, isTeaching)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                        isTeaching
                          ? 'bg-emerald-600/15 border-emerald-500/20 text-emerald-400'
                          : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      {isTeaching ? (
                        <>
                          <Check size={12} />
                          <span>{teachLevel}</span>
                        </>
                      ) : (
                        <>
                          <Plus size={12} />
                          <span>Teach</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Learn buttons */}
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400 font-medium">I Want to Learn:</span>
                    <button
                      onClick={() => handleToggleLearns(skill._id, isLearning)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                        isLearning
                          ? 'bg-purple-600/15 border-purple-500/20 text-purple-400'
                          : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      {isLearning ? (
                        <>
                          <Check size={12} />
                          <span>{learnLevel}</span>
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

      {/* Expertise Level selector modal */}
      {activeSkillModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-sm glass-panel p-6 rounded-3xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-2">
              <h3 className="font-bold text-slate-200">Select Expertise Level</h3>
              <button onClick={() => setActiveSkillModal(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>
            
            <p className="text-xs text-slate-400">
              {activeSkillModal.type === 'teach'
                ? 'Specify your current proficiency level in this skill to guide matches.'
                : 'Select your target target proficiency level in this skill.'}
            </p>

            <div className="grid grid-cols-2 gap-2 pt-2">
              {['Beginner', 'Intermediate', 'Advanced', 'Expert'].map((level) => (
                <button
                  key={level}
                  type="button"
                  onClick={() => setSelectedLevel(level)}
                  className={`py-3 rounded-2xl text-xs font-bold border transition-all ${
                    selectedLevel === level
                      ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg'
                      : 'bg-slate-900 border-slate-850 text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>

            <button
              onClick={handleLevelSelectionSubmit}
              className="w-full py-3 bg-indigo-600 rounded-xl font-bold text-white text-xs hover:bg-indigo-500 transition-all mt-4"
            >
              Add to Profile Portfolio
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SkillCatalog;
