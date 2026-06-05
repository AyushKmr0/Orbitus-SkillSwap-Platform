import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import axios from 'axios';
import {
  Map,
  Compass,
  ArrowRight,
  CheckCircle,
  Clock,
  BookOpen,
  Sparkles,
  Trash2
} from 'lucide-react';

const AiRoadmap = () => {
  const { token } = useSelector((state) => state.auth);
  
  const [topicInput, setTopicInput] = useState('');
  const [activeRoadmap, setActiveRoadmap] = useState(null);
  const [roadmapsList, setRoadmapsList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    fetchRoadmapsList();
  }, [token]);

  const fetchRoadmapsList = async () => {
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const res = await axios.get('/api/dashboard/user', config);
      setRoadmapsList(res.data.roadmaps || []);
      if (res.data.roadmaps?.length > 0 && !activeRoadmap) {
        // Set last generated roadmap as active
        setActiveRoadmap(res.data.roadmaps[res.data.roadmaps.length - 1]);
      }
    } catch (err) {
      console.error('Error fetching roadmaps:', err);
    }
  };

  const handleGenerateRoadmap = async (e) => {
    e.preventDefault();
    if (!topicInput.trim()) return;

    setLoading(true);
    setErrorMsg('');
    setActiveRoadmap(null);

    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const res = await axios.post('/api/ai/roadmap', { topic: topicInput.trim() }, config);
      setActiveRoadmap(res.data.roadmap);
      setTopicInput('');
      fetchRoadmapsList();
    } catch (err) {
      console.error('Error generating roadmap:', err);
      setErrorMsg(err.response?.data?.message || 'Error generating roadmap curriculum.');
    } finally {
      setLoading(false);
    }
  };

  const syncRoadmapState = (savedRoadmap) => {
    setActiveRoadmap(savedRoadmap);
    setRoadmapsList((prev) => prev.map((map) => (map._id === savedRoadmap._id ? savedRoadmap : map)));
  };

  const handleToggleWeek = async (weekIndex) => {
    if (!activeRoadmap) return;

    const updatedRoadmapData = activeRoadmap.roadmapData.map((week, wIdx) => {
      if (wIdx === weekIndex) {
        return {
          ...week,
          completed: !week.completed
        };
      }
      return week;
    });

    const completedWeeks = updatedRoadmapData.filter(w => w.completed).length;
    const nextProgress = Math.floor((completedWeeks / updatedRoadmapData.length) * 100);

    const optimisticRoadmap = {
      ...activeRoadmap,
      roadmapData: updatedRoadmapData,
      progress: nextProgress
    };
    syncRoadmapState(optimisticRoadmap);

    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const res = await axios.put(`/api/ai/roadmap/${activeRoadmap._id}`, {
        roadmapData: updatedRoadmapData,
        progress: nextProgress
      }, config);
      syncRoadmapState(res.data.roadmap);
    } catch (err) {
      console.error('Error updating roadmap progress:', err);
      setErrorMsg('Could not save progress. Please try again.');
    }
  };

  const handleRemoveRoadmap = async (roadmapId) => {
    if (!roadmapId) return;

    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      await axios.delete(`/api/ai/roadmap/${roadmapId}`, config);
      const remaining = roadmapsList.filter((map) => map._id !== roadmapId);
      setRoadmapsList(remaining);
      setActiveRoadmap(remaining[remaining.length - 1] || null);
    } catch (err) {
      console.error('Error removing roadmap:', err);
      setErrorMsg('Could not remove roadmap. Please try again.');
    }
  };

  return (
    <div className="flex-1 p-5 lg:p-8 space-y-8 min-h-screen overflow-y-auto">
      {/* Brand Header banner */}
      <div className="surface-panel flex flex-col md:flex-row justify-between items-start md:items-center gap-4 p-6 rounded-2xl">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-600/20">
            <Map size={22} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl lg:text-3xl font-extrabold text-app font-outfit tracking-tight">AI Learning Roadmaps</h1>
            <p className="text-sm text-muted mt-1">Focused week-by-week plans that stay on the topic you ask for.</p>
          </div>
        </div>
        <div className="accent-pill rounded-full px-3 py-1.5 text-xs font-semibold flex items-center gap-2">
          <Sparkles size={14} />
          Gemini assisted
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Form and histories */}
        <div className="space-y-6">
          {/* Form */}
          <div className="surface-panel p-6 rounded-2xl space-y-4">
            <h3 className="font-bold text-base text-app font-outfit flex items-center gap-2">
              <Compass size={18} className="text-blue-600 dark:text-blue-400" /> Plan Curriculum
            </h3>
            <p className="text-xs text-muted">Try "React.js", "AI/ML", "PyTorch", "Flutter", or any focused skill.</p>
            {errorMsg && (
              <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-500">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleGenerateRoadmap} className="space-y-4">
              <input
                type="text"
                required
                value={topicInput}
                onChange={(e) => setTopicInput(e.target.value)}
                placeholder="I want to learn ..."
                className="w-full px-4 py-3.5 surface-card rounded-xl text-app text-sm outline-none focus:border-blue-500"
              />
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-70 rounded-xl font-bold text-white text-sm transition-all flex items-center justify-center gap-2 shadow"
              >
                {loading ? (
                  <div className="w-5 h-5 rounded-full border-2 border-white/20 border-t-white animate-spin" />
                ) : (
                  <>
                    <span>Generate roadmap</span>
                    <ArrowRight size={14} />
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Roadmap histories */}
          <div className="surface-panel p-6 rounded-2xl space-y-4">
            <h3 className="font-bold text-base text-app font-outfit flex items-center gap-2">
              <BookOpen size={18} className="text-blue-600 dark:text-blue-400" /> Active syllabus list ({roadmapsList.length})
            </h3>
            {roadmapsList.length === 0 ? (
              <p className="text-xs text-muted text-center py-4">No active syllabuses generated yet.</p>
            ) : (
              <div className="space-y-2">
                {roadmapsList.map((map) => (
                  <div
                    key={map._id}
                    className={`flex items-center gap-2 p-2 rounded-2xl border transition-all ${
                      activeRoadmap?._id === map._id
                        ? 'bg-blue-600/10 border-blue-500/30 text-blue-700 dark:text-blue-300 font-bold'
                        : 'surface-card text-muted-strong hover:border-blue-500/30'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => setActiveRoadmap(map)}
                      className="flex-1 flex items-center justify-between text-left"
                    >
                      <div>
                        <h4 className="text-xs font-semibold truncate max-w-[150px]">{map.topic}</h4>
                        <span className="text-[9px] text-muted">Progress: {map.progress}%</span>
                      </div>
                      <div className="w-12 bg-slate-200 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                        <div className="bg-blue-600 h-full rounded-full" style={{ width: `${map.progress}%` }} />
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemoveRoadmap(map._id)}
                      className="p-2 rounded-xl text-muted hover:text-red-500 hover:bg-red-500/10"
                      title="Remove syllabus"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Syllabus details view */}
        <div className="lg:col-span-2">
          {activeRoadmap ? (
            <div className="surface-panel p-6 rounded-2xl space-y-6 animate-fade-in">
              <div className="flex flex-col sm:flex-row justify-between items-start gap-4 border-b pb-4" style={{ borderColor: 'var(--app-border)' }}>
                <div>
                  <h2 className="text-xl font-bold text-app font-outfit">{activeRoadmap.topic}</h2>
                  <p className="text-xs text-muted mt-1">Week-by-week curriculum overview</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="text-[10px] text-muted uppercase font-bold">Curriculum progress</span>
                    <p className="text-lg font-extrabold text-blue-600 dark:text-blue-400 leading-none mt-1">{activeRoadmap.progress}%</p>
                  </div>
                  <div className="w-16 bg-slate-200 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden">
                    <div className="bg-blue-600 h-full rounded-full" style={{ width: `${activeRoadmap.progress}%` }} />
                  </div>
                </div>
              </div>

              {/* Week array items */}
              <div className="space-y-4">
                {activeRoadmap.roadmapData.map((week, weekIndex) => (
                  <div key={weekIndex} className="surface-card p-4 rounded-2xl flex items-start gap-4">
                    {/* Toggle completed checks */}
                    <button
                      type="button"
                      onClick={() => handleToggleWeek(weekIndex)}
                      className={`w-6 h-6 rounded-xl border flex items-center justify-center flex-shrink-0 transition-all ${
                        week.completed
                          ? 'bg-emerald-600 border-emerald-500 text-white shadow'
                          : 'bg-white dark:bg-slate-950 border-slate-300 dark:border-slate-700 text-transparent hover:border-blue-500'
                      }`}
                    >
                      <CheckCircle size={14} />
                    </button>

                    <div className="flex-1 space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">{week.week}</span>
                        {week.completed && (
                          <span className="text-[9px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/10 uppercase">
                            COMPLETED
                          </span>
                        )}
                      </div>
                      <h4 className="font-extrabold text-sm text-app font-outfit">{week.topic}</h4>

                      {/* Sub-items */}
                      <ul className="text-xs text-muted list-disc list-inside space-y-1 pt-1.5 border-t" style={{ borderColor: 'var(--app-border)' }}>
                        {week.details?.map((detail, idx) => (
                          <li key={idx} className="leading-relaxed">{detail}</li>
                        ))}
                      </ul>

                      {/* Resources */}
                      {week.resources && week.resources.length > 0 && (
                        <div className="pt-2 flex flex-wrap items-center gap-1.5 text-[10px] text-muted">
                          <span className="font-bold">Suggested Resources:</span>
                          {week.resources.map((res, rIdx) => (
                            <span key={rIdx} className="accent-pill px-2 py-0.5 rounded">
                              {res}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="surface-panel p-12 rounded-2xl flex flex-col justify-center items-center text-center space-y-3 h-80">
              <div className="w-14 h-14 rounded-2xl bg-blue-600/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <Clock size={24} />
              </div>
              <h3 className="font-extrabold text-base text-app font-outfit">Gemini Curriculum Planner</h3>
              <p className="text-xs text-muted max-w-xs leading-relaxed">Enter a focused skill and generate a clean, practical roadmap.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AiRoadmap;
