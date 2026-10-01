import React, { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../services/apiClient.js';
import { motion } from 'framer-motion';
import { ScrollReveal, TiltCard, MorphingBlob } from '../../components/motion/index.js';
import {
  Map,
  Compass,
  ArrowRight,
  CheckCircle,
  Clock,
  BookOpen,
  Sparkles,
  Trash2,
  GitBranch,
  List,
  ExternalLink,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Check,
  ChevronRight,
  ChevronLeft,
  Share2,
  BookMarked,
  Key,
  Cpu,
  X,
  ShieldCheck,
  Bot,
  Zap,
  Globe,
  Settings,
  ArrowLeft,
  Trophy,
  Award,
  CheckSquare,
  Square,
  Flame,
  CircleDot
} from 'lucide-react';

const SUGGESTED_TOPICS = [
  'Docker & Containers',
  'Redis & Caching',
  'RAG & Vector Search',
  'Kubernetes Orchestration',
  'Next.js 14 App Router',
  'System Design',
  'Spanish for Beginners',
  'UI/UX Design in Figma'
];

const AI_PROVIDERS = [
  {
    id: 'gemini',
    name: 'Google Gemini',
    badge: 'Gemini 1.5 Flash',
    placeholder: 'AIzaSy...',
    docsUrl: 'https://aistudio.google.com/app/apikey',
    description: 'Fast, free, and great for structured step-by-step guides.'
  },
  {
    id: 'openai',
    name: 'OpenAI (ChatGPT)',
    badge: 'GPT-4o Mini',
    placeholder: 'sk-proj-...',
    docsUrl: 'https://platform.openai.com/api-keys',
    description: 'Accurate and comprehensive learning roadmaps.'
  },
  {
    id: 'groq',
    name: 'Groq Cloud',
    badge: 'Llama 3.3',
    placeholder: 'gsk_...',
    docsUrl: 'https://console.groq.com/keys',
    description: 'Super-fast roadmap generation powered by Llama 3.'
  },
  {
    id: 'claude',
    name: 'Anthropic Claude',
    badge: 'Claude 3.5 Haiku',
    placeholder: 'sk-ant-api...',
    docsUrl: 'https://console.anthropic.com/settings/keys',
    description: 'Clean, well-formatted curriculum and study tips.'
  }
];

const ZOOM_LEVELS = [0.7, 0.85, 1, 1.15];

const AiRoadmap = () => {
  const { token } = useSelector((state) => state.auth);
  const navigate = useNavigate();

  const [topicInput, setTopicInput] = useState('');
  const [activeRoadmap, setActiveRoadmap] = useState(null);
  const [roadmapsList, setRoadmapsList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Personal AI connection / custom API key state
  const [showAiKeyModal, setShowAiKeyModal] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState('gemini');
  const [customKeyInput, setCustomKeyInput] = useState('');
  const [hasCustomKey, setHasCustomKey] = useState(false);
  const [activeAiProvider, setActiveAiProvider] = useState('default');
  const [maskedKey, setMaskedKey] = useState('');
  const [savingKey, setSavingKey] = useState(false);
  const [keyFeedback, setKeyFeedback] = useState('');
  const [aiModalTab, setAiModalTab] = useState('builtin');

  // View state: 'mindmap' or 'list'
  const [viewMode, setViewMode] = useState('mindmap');
  const [selectedNodeIndex, setSelectedNodeIndex] = useState(0);
  const [zoomIndex, setZoomIndex] = useState(1);
  const zoomScale = ZOOM_LEVELS[zoomIndex];
  const [showDetailDrawer, setShowDetailDrawer] = useState(true);
  const [roadmapToDelete, setRoadmapToDelete] = useState(null);
  const [deletingRoadmap, setDeletingRoadmap] = useState(false);

  const [checkedTasks, setCheckedTasks] = useState(() => {
    try {
      const saved = localStorage.getItem('orbitus_roadmap_tasks');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const toggleTaskCheck = (roadmapId, weekIdx, taskIdx) => {
    const key = `${roadmapId}_${weekIdx}_${taskIdx}`;
    setCheckedTasks((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      try {
        localStorage.setItem('orbitus_roadmap_tasks', JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const mindMapContainerRef = useRef(null);

  useEffect(() => {
    fetchRoadmapsList();
    fetchCustomKeyStatus();
  }, [token]);

  const fetchCustomKeyStatus = async () => {
    try {
      const res = await apiClient.get('/api/ai/custom-key');
      const isCustom = Boolean(res.data.hasCustomKey);
      setHasCustomKey(isCustom);
      setMaskedKey(res.data.maskedKey || '');
      const provider = res.data.customAiProvider || 'gemini';
      setActiveAiProvider(provider);
      setSelectedProvider(provider === 'default' ? 'gemini' : provider);
      setAiModalTab(isCustom ? 'custom' : 'builtin');
    } catch (err) {
      console.error('Error fetching custom key status:', err);
    }
  };

  const handleSaveCustomKey = async (e) => {
    e.preventDefault();
    setSavingKey(true);
    setKeyFeedback('');
    try {
      const res = await apiClient.put('/api/ai/custom-key', {
        customAiKey: customKeyInput.trim(),
        customAiProvider: selectedProvider
      });
      setHasCustomKey(res.data.hasCustomKey);
      setMaskedKey(res.data.maskedKey || '');
      setActiveAiProvider(res.data.customAiProvider || selectedProvider);
      setCustomKeyInput('');
      setKeyFeedback(res.data.message || 'AI key connected successfully');
      setTimeout(() => {
        setShowAiKeyModal(false);
        setKeyFeedback('');
      }, 1200);
    } catch (err) {
      setKeyFeedback(err.response?.data?.message || 'Error saving AI key');
    } finally {
      setSavingKey(false);
    }
  };

  const handleRemoveCustomKey = async () => {
    setSavingKey(true);
    setKeyFeedback('');
    try {
      await apiClient.put('/api/ai/custom-key', { customAiKey: '', customAiProvider: 'default' });
      setHasCustomKey(false);
      setMaskedKey('');
      setActiveAiProvider('default');
      setCustomKeyInput('');
      setAiModalTab('builtin');
      setKeyFeedback('Switched to Orbitus Built-in AI successfully!');
      setTimeout(() => {
        setKeyFeedback('');
      }, 1500);
    } catch (err) {
      setKeyFeedback(err.response?.data?.message || 'Error switching to default AI');
    } finally {
      setSavingKey(false);
    }
  };

  const fetchRoadmapsList = async () => {
    try {
      const res = await apiClient.get('/api/dashboard/user');
      const list = res.data.roadmaps || [];
      setRoadmapsList(list);
      if (list.length > 0 && !activeRoadmap) {
        setActiveRoadmap(list[list.length - 1]);
      }
    } catch (err) {
      console.error('Error fetching roadmaps:', err);
    }
  };

  const handleGenerateRoadmap = async (e, customTopic) => {
    if (e) e.preventDefault();
    const query = (customTopic || topicInput).trim();
    if (!query) return;

    setLoading(true);
    setErrorMsg('');
    setActiveRoadmap(null);

    try {
      const res = await apiClient.post('/api/ai/roadmap', { topic: query });
      setActiveRoadmap(res.data.roadmap);
      setSelectedNodeIndex(0);
      setTopicInput('');
      fetchRoadmapsList();
    } catch (err) {
      console.error('Error generating roadmap:', err);
      setErrorMsg(err.response?.data?.message || 'Error creating curriculum. Please try again.');
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

    const completedWeeks = updatedRoadmapData.filter((w) => w.completed).length;
    const nextProgress = Math.floor((completedWeeks / updatedRoadmapData.length) * 100);

    const optimisticRoadmap = {
      ...activeRoadmap,
      roadmapData: updatedRoadmapData,
      progress: nextProgress
    };
    syncRoadmapState(optimisticRoadmap);

    try {
      await apiClient.put(`/api/ai/roadmap/${activeRoadmap._id}`, {
        roadmapData: updatedRoadmapData,
        progress: nextProgress
      });
    } catch (err) {
      console.error('Error persisting roadmap milestone status:', err);
      fetchRoadmapsList();
    }
  };

  const confirmDeleteRoadmap = async () => {
    if (!roadmapToDelete) return;
    setDeletingRoadmap(true);
    try {
      await apiClient.delete(`/api/ai/roadmap/${roadmapToDelete._id}`);
      const remaining = roadmapsList.filter((r) => r._id !== roadmapToDelete._id);
      setRoadmapsList(remaining);
      setActiveRoadmap(remaining[remaining.length - 1] || null);
      setRoadmapToDelete(null);
    } catch (err) {
      console.error('Error removing roadmap:', err);
      setErrorMsg('Could not remove roadmap. Please try again.');
    } finally {
      setDeletingRoadmap(false);
    }
  };

  const selectedNode = activeRoadmap?.roadmapData?.[selectedNodeIndex] || activeRoadmap?.roadmapData?.[0];

  const currentProviderObj = AI_PROVIDERS.find((p) => p.id === selectedProvider) || AI_PROVIDERS[0];
  const activeEngineObj = AI_PROVIDERS.find((p) => p.id === activeAiProvider);

  return (
    <div className="page-shell flex-1 p-4 sm:p-6 lg:p-8 space-y-6 min-h-screen text-app overflow-y-auto relative">
      {/* Ambient Morphing Blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <MorphingBlob size={340} color="rgba(99, 102, 241, 0.07)" className="-top-24 -left-16" />
        <MorphingBlob size={280} color="rgba(16, 185, 129, 0.05)" className="top-80 -right-16" />
      </div>
      {/* Brand Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-[#22242a] p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
        <div className="flex items-start gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-600/20 shrink-0">
            <Map size={24} />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-app font-outfit tracking-tight">
              Learning Roadmaps
            </h1>
            <p className="text-xs sm:text-sm text-muted mt-1">
              Visual step-by-step learning paths and milestones.
            </p>
          </div>
        </div>

        {/* AI Provider Settings Pill */}
        <button
          type="button"
          onClick={() => {
            setAiModalTab(hasCustomKey ? 'custom' : 'builtin');
            setShowAiKeyModal(true);
          }}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/60 text-app shadow-sm transition-all text-xs cursor-pointer"
        >
          <div className={`w-2 h-2 rounded-full ${hasCustomKey ? 'bg-indigo-500' : 'bg-emerald-500'} animate-pulse`} />
          <span className="text-muted text-[11px]">AI Engine:</span>
          <span className="font-bold text-app text-xs">
            {hasCustomKey && activeEngineObj ? activeEngineObj.name : 'Built-in (Free)'}
          </span>
          <Settings size={13} className="text-muted ml-0.5" />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Generator & Syllabus history */}
        <div className="space-y-6">
          {/* Creator Form */}
          <div className="bg-white dark:bg-[#22242a] p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
            <h3 className="font-bold text-base text-app font-outfit flex items-center gap-2">
              <Compass size={18} className="text-indigo-600 dark:text-indigo-400" />
              Create Roadmap
            </h3>
            <p className="text-xs text-muted leading-relaxed">
              Enter any skill to generate a structured study path.
            </p>

            {errorMsg && (
              <div className="rounded-xl border border-red-200 dark:border-red-900/40 bg-red-50 dark:bg-red-950/30 px-3 py-2 text-xs text-red-600 dark:text-red-400">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleGenerateRoadmap} className="space-y-3.5">
              <input
                type="text"
                required
                value={topicInput}
                onChange={(e) => setTopicInput(e.target.value)}
                placeholder="e.g. Python, Docker, Design, Spanish..."
                className="w-full px-4 py-3 bg-slate-50 dark:bg-[#15171e] border border-slate-200 dark:border-slate-700/80 rounded-2xl text-app text-sm outline-none focus:border-indigo-500 transition-colors"
              />

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-2xl font-bold text-xs shadow-lg shadow-indigo-600/20 transition-all flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Generating Roadmap…</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={16} />
                    <span>Generate Roadmap</span>
                  </>
                )}
              </button>
            </form>

            {/* Quick suggested chips */}
            <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800/80">
              <span className="text-[11px] font-bold text-muted uppercase tracking-wider block">
                Popular Topics:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {SUGGESTED_TOPICS.map((topic) => (
                  <button
                    key={topic}
                    type="button"
                    onClick={() => handleGenerateRoadmap(null, topic)}
                    className="text-[11px] px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-muted hover:text-indigo-600 dark:hover:text-indigo-400 border border-slate-200 dark:border-slate-800 transition-colors"
                  >
                    {topic}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Active syllabuses history list */}
          <div className="bg-white dark:bg-[#22242a] p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
            <h3 className="font-bold text-base text-app font-outfit flex items-center gap-2">
              <BookOpen size={18} className="text-indigo-600 dark:text-indigo-400" />
              Saved Study Paths ({roadmapsList.length})
            </h3>

            {roadmapsList.length === 0 ? (
              <p className="text-xs text-muted text-center py-4">No saved learning roadmaps yet.</p>
            ) : (
              <div className="space-y-2">
                {roadmapsList.map((map, idx) => (
                  <div
                    key={map._id}
                    className={`flex items-center gap-2 p-3 rounded-2xl border transition-all interactive-card animate-card-enter stagger-${(idx % 6) + 1} ${
                      activeRoadmap?._id === map._id
                        ? 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-300 dark:border-indigo-800 font-bold'
                        : 'bg-slate-50 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        setActiveRoadmap(map);
                        setSelectedNodeIndex(0);
                      }}
                      className="flex-1 flex items-center justify-between text-left min-w-0"
                    >
                      <div className="min-w-0 pr-2">
                        <h4 className="text-xs font-semibold truncate text-app">{map.topic}</h4>
                        <span className="text-[10px] text-muted">{map.progress || 0}% completed</span>
                      </div>
                      <div className="w-12 bg-slate-200 dark:bg-slate-700 rounded-full h-1.5 overflow-hidden shrink-0">
                        <div className="bg-indigo-600 h-full rounded-full" style={{ width: `${map.progress || 0}%` }} />
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setRoadmapToDelete(map)}
                      className="p-1.5 rounded-xl text-muted hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 shrink-0"
                      title="Remove roadmap"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Mind Map / List View */}
        <div className="lg:col-span-2">
          {activeRoadmap ? (
            <div className="bg-white dark:bg-[#22242a] p-5 sm:p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-6 shadow-sm">
              {/* Roadmap Header & View Switcher */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
                <div>
                  <h2 className="text-xl font-extrabold text-app font-outfit">{activeRoadmap.topic}</h2>
                  <p className="text-xs text-muted mt-1">6-Week Milestone Curriculum & Practice Plan</p>
                </div>

                <div className="flex items-center gap-3 self-stretch sm:self-auto justify-between sm:justify-end">
                  {/* View Mode Toggle: Mind Map vs List */}
                  <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs">
                    <button
                      type="button"
                      onClick={() => setViewMode('mindmap')}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition-all ${
                        viewMode === 'mindmap'
                          ? 'bg-indigo-600 text-white shadow'
                          : 'text-muted hover:text-app'
                      }`}
                    >
                      <GitBranch size={14} />
                      <span>Mind Map</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setViewMode('list')}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition-all ${
                        viewMode === 'list'
                          ? 'bg-indigo-600 text-white shadow'
                          : 'text-muted hover:text-app'
                      }`}
                    >
                      <List size={14} />
                      <span>Timeline List</span>
                    </button>
                  </div>

                  {/* Progress Indicator */}
                  <div className="flex items-center gap-2 pl-2">
                    <div className="text-right">
                      <span className="text-[10px] text-muted uppercase font-bold block">Progress</span>
                      <span className="text-base font-extrabold text-indigo-600 dark:text-indigo-400 leading-none">
                        {activeRoadmap.progress}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* View 1: ROADMAP.SH STYLE INTERACTIVE MIND MAP */}
              {viewMode === 'mindmap' && (
                <div className="space-y-4">
                  {/* Roadmap.sh Canvas Toolbar */}
                  <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-[#22242a] p-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm text-xs">
                    {/* Left: Title & Milestones count */}
                    <div className="flex items-center gap-2 font-bold text-app font-outfit">
                      <Sparkles size={15} className="text-indigo-600 dark:text-indigo-400 shrink-0" />
                      <span>Interactive Learning Pathway</span>
                      <span className="text-[11px] font-medium text-muted hidden sm:inline-block">
                        • {activeRoadmap.roadmapData?.length || 0} Milestones
                      </span>
                    </div>

                    {/* Right: Controls & Drawer Toggle */}
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setShowDetailDrawer((prev) => !prev)}
                        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-[11px] font-bold transition-all ${
                          showDetailDrawer
                            ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800'
                            : 'bg-slate-100 dark:bg-slate-800 text-muted border-slate-200 dark:border-slate-700 hover:text-app'
                        }`}
                        title="Toggle study guide drawer"
                      >
                        <BookOpen size={13} />
                        <span>{showDetailDrawer ? 'Hide Details' : 'Show Details'}</span>
                      </button>

                      <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-900 p-0.5 rounded-xl border border-slate-200 dark:border-slate-800">
                        <button
                          type="button"
                          disabled={zoomIndex === 0}
                          onClick={() => setZoomIndex((i) => Math.max(0, i - 1))}
                          className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-all text-muted hover:text-app"
                          title="Zoom out"
                        >
                          <ZoomOut size={13} />
                        </button>
                        <span className="px-1.5 py-0.5 text-[10px] font-bold text-app font-mono select-none">
                          {Math.round(ZOOM_LEVELS[zoomIndex] * 100)}%
                        </span>
                        <button
                          type="button"
                          disabled={zoomIndex === ZOOM_LEVELS.length - 1}
                          onClick={() => setZoomIndex((i) => Math.min(ZOOM_LEVELS.length - 1, i + 1))}
                          className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-all text-muted hover:text-app"
                          title="Zoom in"
                        >
                          <ZoomIn size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setZoomIndex(1)}
                          className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 transition-all text-muted hover:text-app"
                          title="Reset zoom to 100%"
                        >
                          <RotateCcw size={13} />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Main Grid Canvas Viewport with Phenomenon Ambient Aurora */}
                  <div className="relative w-full h-[480px] sm:h-[540px] rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-[#0b0f17] bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] dark:bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:20px_20px] shadow-inner overflow-x-hidden md:overflow-x-auto overflow-y-auto">
                    {/* Phenomenon Ambient Ethereal Glow Orbs */}
                    <div className="absolute top-1/4 left-1/4 w-80 h-80 rounded-full bg-indigo-500/10 dark:bg-indigo-600/15 blur-[100px] phenomenon-aurora pointer-events-none" />
                    <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-purple-500/10 dark:bg-purple-600/15 blur-[100px] phenomenon-aurora pointer-events-none" style={{ animationDelay: '-5s' }} />

                    <div
                      ref={mindMapContainerRef}
                      className="p-3 sm:p-6 flex flex-col items-center justify-start w-full min-w-0 md:min-w-[680px] m-auto relative z-10"
                    >
                      {/* Zoomable Canvas Container */}
                      <div
                        style={{
                          transform: `scale(${zoomScale})`,
                          transformOrigin: 'top center',
                          transition: 'transform 0.2s ease-out'
                        }}
                        className="w-full flex flex-col items-center py-1 select-none"
                      >
                        {/* 1. START ROOT NODE (Phenomenon Glassmorphic Hero) */}
                        <div className="flex flex-col items-center z-10 w-full max-w-sm px-2">
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800/80 text-[10px] font-black text-indigo-600 dark:text-indigo-400 mb-1.5 shadow-sm">
                            <Sparkles size={11} />
                            <span>LEARNING PATHWAY</span>
                          </div>

                          <div className="phenomenon-card px-4 py-2.5 rounded-xl bg-white/90 dark:bg-[#22242a]/90 backdrop-blur-md border-2 border-indigo-600/90 shadow-md text-center w-full relative">
                            <span className="text-[9px] font-black uppercase tracking-wider text-indigo-500 block mb-0.5">
                              Master Goal & Curriculum
                            </span>
                            <h3 className="font-black text-sm text-app font-outfit leading-tight line-clamp-2">
                              {activeRoadmap.topic}
                            </h3>
                            <div className="mt-1.5 pt-1.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-center gap-2.5 text-[10px] text-muted font-medium">
                              <span>{activeRoadmap.roadmapData?.length || 0} Milestones</span>
                              <span>•</span>
                              <span className="text-indigo-600 dark:text-indigo-400 font-bold">
                                {activeRoadmap.progress || 0}% Mastered
                              </span>
                            </div>
                          </div>

                          {/* Pipe down to first stage */}
                          <div className="w-0.5 h-6 bg-gradient-to-b from-indigo-600 via-indigo-400 to-slate-300 dark:to-slate-700 relative">
                            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-0.5 w-1.5 h-1.5 rounded-full bg-slate-400 dark:bg-slate-600" />
                          </div>
                        </div>

                        {/* 2. SEQUENTIAL ROADMAP SPINE (Desktop Alternating / Mobile Stacked) */}
                        <div className="relative w-full max-w-2xl flex flex-col items-center">
                          {/* Continuous Central Spine Track with Phenomenon Kinetic Beam */}
                          <div className="absolute top-0 bottom-3 left-4 sm:left-5 md:left-1/2 -translate-x-1/2 w-0.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div className="phenomenon-beam left-0" />
                          </div>

                          {activeRoadmap.roadmapData.map((week, idx) => {
                            const isSelected = selectedNodeIndex === idx;
                            const isCompleted = week.completed;
                            const isEven = idx % 2 === 0;

                            // Node card JSX
                            const NodeCard = (
                              <motion.div
                                whileHover={{ scale: 1.03, y: -2 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => {
                                  setSelectedNodeIndex(idx);
                                  setShowDetailDrawer(true);
                                }}
                                className={`phenomenon-card w-full sm:w-[260px] p-3 rounded-xl border-2 transition-all cursor-pointer flex flex-col justify-between group shadow-sm text-left ${
                                  isSelected
                                    ? 'phenomenon-halo bg-white dark:bg-[#1a2233] border-indigo-600 shadow-lg shadow-indigo-500/15'
                                    : isCompleted
                                    ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-400 dark:border-emerald-800/70 hover:border-emerald-500'
                                    : 'bg-white dark:bg-[#22242a] border-slate-200 dark:border-slate-800 hover:border-indigo-400/80'
                                }`}
                              >
                                {/* Card Header */}
                                <div className="flex items-center justify-between gap-1 mb-1.5">
                                  <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-indigo-50/80 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 border border-indigo-200/50 dark:border-indigo-800/50">
                                    {week.week || `STAGE ${idx + 1}`}
                                  </span>

                                  {/* Quick Toggle Button */}
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleToggleWeek(idx);
                                    }}
                                    className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${
                                      isCompleted
                                        ? 'bg-emerald-600 border-emerald-600 text-white shadow-sm'
                                        : 'bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700 hover:border-indigo-500 text-muted hover:text-app'
                                    }`}
                                    title={isCompleted ? 'Mark incomplete' : 'Mark completed'}
                                  >
                                    {isCompleted ? <Check size={11} strokeWidth={3} /> : <CircleDot size={11} />}
                                  </button>
                                </div>

                                {/* Milestone Title */}
                                <h4 className="font-extrabold text-xs text-app font-outfit leading-snug group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-1">
                                  {week.topic}
                                </h4>

                                {/* Subtopics Tags */}
                                {week.details && week.details.length > 0 && (
                                  <div className="mt-2 flex flex-wrap gap-1">
                                    {week.details.slice(0, 2).map((item, dIdx) => (
                                      <span
                                        key={dIdx}
                                        className="px-1.5 py-0.5 rounded text-[9px] text-muted font-medium truncate max-w-[105px] border border-slate-200/50 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-800/80"
                                      >
                                        {item}
                                      </span>
                                    ))}
                                    {week.details.length > 2 && (
                                      <span className="px-1 py-0.5 text-[9px] font-bold text-indigo-600 dark:text-indigo-400">
                                        +{week.details.length - 2}
                                      </span>
                                    )}
                                  </div>
                                )}

                                {/* Card Footer */}
                                <div className="mt-2 pt-1.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[10px] text-muted">
                                  <span className="font-medium">
                                    {week.details?.length || 0} tasks • {week.resources?.length || 0} links
                                  </span>
                                  <span className="text-indigo-600 dark:text-indigo-400 font-bold flex items-center gap-0.5 group-hover:underline">
                                    Guide <ChevronRight size={11} />
                                  </span>
                                </div>
                              </motion.div>
                            );

                            return (
                              <div
                                key={idx}
                                className="relative w-full flex items-center my-2 md:my-2.5"
                              >
                                {/* DESKTOP LAYOUT (Alternating Left/Right) */}
                                <div className="hidden md:flex w-full items-center">
                                  {/* Left Slot */}
                                  <div className="w-1/2 flex justify-end pr-5">
                                    {isEven ? NodeCard : <div className="w-[260px]" />}
                                  </div>

                                  {/* Central Spine Node Circle */}
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setSelectedNodeIndex(idx);
                                      setShowDetailDrawer(true);
                                    }}
                                    className={`w-7 h-7 rounded-full flex items-center justify-center font-black text-[11px] shrink-0 z-10 transition-all border-2 ${
                                      isSelected
                                        ? 'phenomenon-halo bg-indigo-600 border-indigo-400 text-white'
                                        : isCompleted
                                        ? 'bg-emerald-500 border-emerald-400 text-white ring-2 ring-emerald-500/20'
                                        : 'bg-white dark:bg-[#22242a] border-slate-300 dark:border-slate-700 text-muted hover:border-indigo-500'
                                    }`}
                                    title={`Step ${idx + 1}: ${week.topic}`}
                                  >
                                    {isCompleted ? <Check size={12} strokeWidth={3} /> : idx + 1}
                                  </button>

                                  {/* Right Slot */}
                                  <div className="w-1/2 flex justify-start pl-5">
                                    {!isEven ? NodeCard : <div className="w-[260px]" />}
                                  </div>
                                </div>

                                {/* MOBILE LAYOUT (Stacked to right of spine) */}
                                <div className="flex md:hidden w-full items-start pl-9 sm:pl-10 relative">
                                  {/* Spine Node Marker */}
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setSelectedNodeIndex(idx);
                                      setShowDetailDrawer(true);
                                    }}
                                    className={`absolute left-4 sm:left-5 -translate-x-1/2 top-3 w-7 h-7 rounded-full flex items-center justify-center font-black text-[11px] shrink-0 z-10 border-2 ${
                                      isSelected
                                        ? 'phenomenon-halo bg-indigo-600 border-indigo-400 text-white'
                                        : isCompleted
                                        ? 'bg-emerald-500 border-emerald-400 text-white ring-2 ring-emerald-500/20'
                                        : 'bg-white dark:bg-[#22242a] border-slate-300 dark:border-slate-700 text-muted'
                                    }`}
                                  >
                                    {isCompleted ? <Check size={11} strokeWidth={3} /> : idx + 1}
                                  </button>

                                  {NodeCard}
                                </div>
                              </div>
                            );
                          })}

                          {/* 3. FINISH TROPHY NODE (Curriculum Complete) */}
                          <div className="flex flex-col items-center mt-4 z-10">
                            {/* Final connector line */}
                            <div className="w-0.5 h-6 bg-gradient-to-b from-slate-300 dark:from-slate-700 to-emerald-500" />

                            <div
                              className={`px-4 py-2.5 rounded-xl border-2 text-center max-w-[260px] transition-all shadow-sm ${
                                activeRoadmap.progress === 100
                                  ? 'bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-teal-950/30 border-emerald-500'
                                  : 'bg-white dark:bg-[#22242a] border-slate-200 dark:border-slate-800'
                              }`}
                            >
                              <div className="w-8 h-8 rounded-full mx-auto mb-1 flex items-center justify-center bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400">
                                <Trophy size={16} />
                              </div>
                              <span className="text-[9px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block mb-0.5">
                                Finish Line
                              </span>
                              <h4 className="font-extrabold text-xs text-app font-outfit">
                                {activeRoadmap.progress === 100
                                  ? 'Mastery Achieved!'
                                  : `Mastery Target: ${activeRoadmap.topic}`}
                              </h4>
                              <p className="text-[10px] text-muted mt-0.5">
                                {activeRoadmap.progress === 100
                                  ? 'All milestones completed!'
                                  : `Complete all ${activeRoadmap.roadmapData.length} milestones.`}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 4. ROADMAP.SH INTERACTIVE STUDY DRAWER / DETAIL PANEL */}
                  {showDetailDrawer && selectedNode && (
                    <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#151a24] border border-slate-200 dark:border-slate-800 space-y-4 animate-fade-in shadow-md">
                      {/* Drawer Header */}
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-200 dark:border-slate-800/80 pb-4">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 px-2.5 py-0.5 rounded-md">
                              Stage {selectedNodeIndex + 1} of {activeRoadmap.roadmapData.length} • {selectedNode.week}
                            </span>
                          </div>
                          <h3 className="text-lg sm:text-xl font-extrabold text-app font-outfit">
                            {selectedNode.topic}
                          </h3>
                        </div>

                        {/* Status Switcher & Close button */}
                        <div className="flex items-center gap-2 self-end sm:self-auto">
                          <button
                            type="button"
                            onClick={() => handleToggleWeek(selectedNodeIndex)}
                            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 ${
                              selectedNode.completed
                                ? 'bg-slate-100 dark:bg-slate-800 text-app hover:bg-slate-200 dark:hover:bg-slate-700'
                                : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                            }`}
                          >
                            <CheckCircle size={14} />
                            <span>{selectedNode.completed ? 'Mark Incomplete' : 'Mark Milestone Done'}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setShowDetailDrawer(false)}
                            className="p-2 rounded-xl text-muted hover:text-app hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
                            title="Close drawer"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      </div>

                      {/* Interactive Subtopics & Tasks Checklist */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-extrabold uppercase text-muted tracking-wider flex items-center gap-1.5">
                            <CheckSquare size={14} className="text-indigo-600 dark:text-indigo-400" />
                            <span>Key Concepts & Hands-on Tasks</span>
                          </h4>
                          <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400">
                            {selectedNode.details?.filter((_, dIdx) => checkedTasks[`${activeRoadmap._id}_${selectedNodeIndex}_${dIdx}`]).length || 0} of {selectedNode.details?.length || 0} tasks done
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs text-app">
                          {selectedNode.details?.map((detail, dIdx) => {
                            const isChecked = Boolean(checkedTasks[`${activeRoadmap._id}_${selectedNodeIndex}_${dIdx}`]);
                            return (
                              <div
                                key={dIdx}
                                onClick={() => toggleTaskCheck(activeRoadmap._id, selectedNodeIndex, dIdx)}
                                className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-start gap-2.5 ${
                                  isChecked
                                    ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/60'
                                    : 'bg-slate-50 dark:bg-[#22242a] border-slate-200 dark:border-slate-800 hover:border-indigo-400'
                                }`}
                              >
                                <button
                                  type="button"
                                  className={`w-4 h-4 rounded mt-0.5 flex items-center justify-center shrink-0 transition-all ${
                                    isChecked
                                      ? 'bg-emerald-600 text-white'
                                      : 'border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800'
                                  }`}
                                >
                                  {isChecked && <Check size={11} strokeWidth={3} />}
                                </button>
                                <span className={`leading-relaxed ${isChecked ? 'line-through text-muted' : 'font-medium'}`}>
                                  {detail}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Curated Direct Study Resources */}
                      {selectedNode.resources && selectedNode.resources.length > 0 && (
                        <div className="space-y-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                          <h4 className="text-xs font-extrabold uppercase text-muted tracking-wider flex items-center gap-1.5">
                            <BookMarked size={14} className="text-indigo-600 dark:text-indigo-400" />
                            <span>Recommended Learning Materials (Official Docs & Guides)</span>
                          </h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                            {selectedNode.resources.map((res, rIdx) => {
                              const title = typeof res === 'object' ? res.title : res;
                              const url = typeof res === 'object' && res.url ? res.url : `https://www.google.com/search?q=${encodeURIComponent(activeRoadmap.topic + ' ' + title)}`;
                              const type = typeof res === 'object' && res.type ? res.type : 'Canonical Docs';

                              return (
                                <a
                                  key={rIdx}
                                  href={url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="group p-3 rounded-2xl bg-slate-50 dark:bg-[#22242a] hover:bg-indigo-50/50 dark:hover:bg-indigo-950/20 border border-slate-200 dark:border-slate-800 hover:border-indigo-400 transition-all flex items-center justify-between gap-3 text-xs"
                                >
                                  <div className="min-w-0">
                                    <span className="text-[9px] uppercase font-black text-indigo-600 dark:text-indigo-400 block mb-0.5">
                                      {type}
                                    </span>
                                    <p className="font-bold text-app group-hover:text-indigo-600 dark:group-hover:text-indigo-400 truncate">
                                      {title}
                                    </p>
                                  </div>
                                  <ExternalLink size={14} className="text-muted group-hover:text-indigo-600 dark:group-hover:text-indigo-400 shrink-0" />
                                </a>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Navigation Footer (Previous / Next Stage) */}
                      <div className="pt-3 border-t border-slate-200 dark:border-slate-800/80 flex items-center justify-between text-xs">
                        <button
                          type="button"
                          disabled={selectedNodeIndex === 0}
                          onClick={() => setSelectedNodeIndex((i) => Math.max(0, i - 1))}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 font-bold hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-all text-muted hover:text-app"
                        >
                          <ChevronLeft size={14} />
                          <span>Previous Stage</span>
                        </button>

                        <span className="text-muted font-mono text-[11px]">
                          {selectedNodeIndex + 1} / {activeRoadmap.roadmapData.length}
                        </span>

                        <button
                          type="button"
                          disabled={selectedNodeIndex === activeRoadmap.roadmapData.length - 1}
                          onClick={() => setSelectedNodeIndex((i) => Math.min(activeRoadmap.roadmapData.length - 1, i + 1))}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 font-bold hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-all text-muted hover:text-app"
                        >
                          <span>Next Stage</span>
                          <ChevronRight size={14} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* View 2: TIMELINE LIST VIEW */}
              {viewMode === 'list' && (
                <div className="space-y-4">
                  {activeRoadmap.roadmapData.map((week, weekIndex) => (
                    <div
                      key={weekIndex}
                      className="p-5 rounded-3xl bg-slate-50/80 dark:bg-[#12161f] border border-slate-200 dark:border-slate-800 flex items-start gap-4 transition-all"
                    >
                      <button
                        type="button"
                        onClick={() => handleToggleWeek(weekIndex)}
                        className={`w-7 h-7 rounded-xl border flex items-center justify-center flex-shrink-0 transition-all mt-0.5 ${
                          week.completed
                            ? 'bg-emerald-600 border-emerald-500 text-white shadow'
                            : 'bg-white dark:bg-[#22242a] border-slate-300 dark:border-slate-700 text-transparent hover:border-indigo-500'
                        }`}
                      >
                        <CheckCircle size={16} />
                      </button>

                      <div className="flex-1 space-y-2.5">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                            {week.week}
                          </span>
                          {week.completed && (
                            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800 uppercase">
                              COMPLETED
                            </span>
                          )}
                        </div>

                        <h4 className="font-extrabold text-base text-app font-outfit">{week.topic}</h4>

                        {/* Subtopics */}
                        <ul className="text-xs text-muted space-y-1 pt-1 border-t border-slate-200 dark:border-slate-800">
                          {week.details?.map((detail, idx) => (
                            <li key={idx} className="flex items-start gap-2 leading-relaxed">
                              <span className="text-indigo-500">•</span>
                              <span>{detail}</span>
                            </li>
                          ))}
                        </ul>

                        {/* Direct Study Resources */}
                        {week.resources && week.resources.length > 0 && (
                          <div className="pt-2 flex flex-wrap items-center gap-2 text-xs">
                            <span className="text-[10px] font-bold uppercase text-muted">Resources:</span>
                            {week.resources.map((res, rIdx) => {
                              const title = typeof res === 'object' ? res.title : res;
                              const url = typeof res === 'object' && res.url ? res.url : `https://www.google.com/search?q=${encodeURIComponent(activeRoadmap.topic + ' ' + title)}`;
                              return (
                                <a
                                  key={rIdx}
                                  href={url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white dark:bg-[#22242a] border border-slate-200 dark:border-slate-800 hover:border-indigo-400 text-indigo-600 dark:text-indigo-400 text-[11px] font-semibold transition-colors"
                                >
                                  <span>{title}</span>
                                  <ExternalLink size={10} />
                                </a>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white dark:bg-[#22242a] p-12 rounded-3xl border border-slate-200 dark:border-slate-800 text-center space-y-4 shadow-sm">
              <div className="w-16 h-16 rounded-3xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto">
                <Map size={32} />
              </div>
              <h3 className="text-lg font-bold text-app font-outfit">No Active Study Path Selected</h3>
              <p className="text-xs text-muted max-w-md mx-auto">
                Type a skill in the form on the left or click one of the suggested paths to generate an interactive 6-week curriculum with visual mind map.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* USER-FRIENDLY AI ENGINE SETTINGS MODAL */}
      {showAiKeyModal && (
        <div role="dialog" data-modal="true" className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg bg-white dark:bg-[#22242a] rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-5 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex justify-between items-start border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                  <Bot size={20} />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-app font-outfit">AI Learning Engine</h3>
                  <p className="text-xs text-muted">Configure your roadmap generator</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowAiKeyModal(false);
                  setKeyFeedback('');
                }}
                className="text-muted hover:text-app p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Segmented Mode Selector */}
            <div className="flex p-1 bg-slate-100 dark:bg-[#15171e] rounded-2xl border border-slate-200/60 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setAiModalTab('builtin')}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  aiModalTab === 'builtin'
                    ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm'
                    : 'text-muted hover:text-app'
                }`}
              >
                <Zap size={14} className={aiModalTab === 'builtin' ? 'text-amber-500' : ''} />
                Built-in AI (Free)
              </button>
              <button
                type="button"
                onClick={() => setAiModalTab('custom')}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  aiModalTab === 'custom'
                    ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm'
                    : 'text-muted hover:text-app'
                }`}
              >
                <Key size={14} />
                Custom Key (Optional)
              </button>
            </div>

            {keyFeedback && (
              <div className="p-3 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 text-xs font-semibold animate-fade-in flex items-center gap-2">
                <CheckCircle size={15} className="shrink-0" />
                <span>{keyFeedback}</span>
              </div>
            )}

            {/* TAB 1: BUILT-IN AI */}
            {aiModalTab === 'builtin' && (
              <div className="space-y-4 animate-fade-in">
                <div className="p-4 rounded-2xl bg-emerald-50/70 dark:bg-[#1a1c24] border border-emerald-200/80 dark:border-emerald-800/50 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                      <Sparkles size={15} />
                      Orbitus Built-in Engine
                    </span>
                    {!hasCustomKey ? (
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-200/70 dark:bg-emerald-800/60 text-emerald-800 dark:text-emerald-200 text-[10px] font-extrabold uppercase tracking-wide">
                        Active & Ready
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-muted text-[10px] font-bold">
                        Available
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted leading-relaxed">
                    Free, unlimited learning roadmaps powered by Orbitus AI. Includes 6-week curriculum, mind maps, and weekly resources.
                  </p>
                </div>

                {hasCustomKey ? (
                  <div className="pt-1 flex gap-2">
                    <button
                      type="button"
                      disabled={savingKey}
                      onClick={handleRemoveCustomKey}
                      className="flex-1 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-xs shadow-sm transition-all flex items-center justify-center gap-2"
                    >
                      <RotateCcw size={14} />
                      {savingKey ? 'Switching...' : 'Switch to Built-in AI'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowAiKeyModal(false)}
                      className="py-2.5 px-4 bg-slate-100 dark:bg-slate-800 text-app rounded-xl font-semibold text-xs"
                    >
                      Close
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowAiKeyModal(false)}
                    className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-xs shadow-sm transition-all"
                  >
                    Keep Using Built-in AI
                  </button>
                )}
              </div>
            )}

            {/* TAB 2: CUSTOM API KEY (OPTIONAL) */}
            {aiModalTab === 'custom' && (
              <div className="space-y-4 animate-fade-in text-xs">
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#1a1c24] border border-slate-200 dark:border-slate-800 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-app text-xs flex items-center gap-1.5">
                      <ShieldCheck size={15} className="text-indigo-600 dark:text-indigo-400" />
                      Custom Key Status
                    </span>
                    {hasCustomKey ? (
                      <span className="px-2.5 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 font-mono font-bold text-[10px]">
                        Active: {activeEngineObj?.name || 'Custom Key'} ({maskedKey})
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-md bg-slate-200 dark:bg-slate-800 text-muted font-bold text-[10px]">
                        None connected
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-muted">
                    Connect your personal API key (optional).
                  </p>
                </div>

                {/* Provider Cards */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-muted uppercase tracking-wider block">
                    Choose Provider:
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {AI_PROVIDERS.map((provider) => {
                      const isSelected = selectedProvider === provider.id;
                      return (
                        <button
                          key={provider.id}
                          type="button"
                          onClick={() => setSelectedProvider(provider.id)}
                          className={`p-3 rounded-2xl border text-left transition-all ${
                            isSelected
                              ? 'bg-indigo-50/80 dark:bg-indigo-950/40 border-indigo-600 ring-2 ring-indigo-500/20'
                              : 'bg-white dark:bg-[#1a1c24] border-slate-200 dark:border-slate-800 hover:border-indigo-300'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-extrabold text-xs text-app">{provider.name}</span>
                            {isSelected && <Check size={14} className="text-indigo-600 dark:text-indigo-400" />}
                          </div>
                          <span className="text-[10px] font-mono text-indigo-600 dark:text-indigo-400 block font-semibold">
                            {provider.badge}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Form Input for API Key */}
                <form onSubmit={handleSaveCustomKey} className="space-y-3 pt-1">
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] font-bold text-muted uppercase">
                        {currentProviderObj.name} API Key:
                      </label>
                      <a
                        href={currentProviderObj.docsUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 text-[11px] font-semibold"
                      >
                        Get {currentProviderObj.name} key <ExternalLink size={10} />
                      </a>
                    </div>

                    <input
                      type="password"
                      placeholder={currentProviderObj.placeholder}
                      value={customKeyInput}
                      onChange={(e) => setCustomKeyInput(e.target.value)}
                      required
                      className="w-full px-3.5 py-2.5 bg-white dark:bg-[#15171e] border border-slate-200 dark:border-slate-700/80 rounded-xl text-app text-xs outline-none focus:border-indigo-500 font-mono"
                    />
                    <p className="text-[10px] text-muted">
                      Stored securely and encrypted.
                    </p>
                  </div>

                  <div className="flex gap-2 pt-2">
                    {hasCustomKey && (
                      <button
                        type="button"
                        disabled={savingKey}
                        onClick={handleRemoveCustomKey}
                        className="py-2.5 px-3 bg-red-50 dark:bg-red-950/40 hover:bg-red-100 dark:hover:bg-red-900/50 text-red-600 dark:text-red-400 rounded-xl font-semibold border border-red-200 dark:border-red-900/40 text-xs transition-colors"
                      >
                        Disconnect
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        setShowAiKeyModal(false);
                        setKeyFeedback('');
                      }}
                      className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-800 text-app rounded-xl font-semibold text-xs"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={savingKey || !customKeyInput.trim()}
                      className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white rounded-xl font-bold text-xs transition-all shadow"
                    >
                      {savingKey ? 'Connecting...' : `Save ${currentProviderObj.name} Key`}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Delete Roadmap Confirmation Modal */}
      {roadmapToDelete && (
        <div role="dialog" data-modal="true" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-sm rounded-3xl bg-white dark:bg-[#22242a] border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-4 animate-modal-enter text-center">
            <div className="w-12 h-12 rounded-2xl bg-red-100 dark:bg-red-950/50 text-red-600 dark:text-red-400 flex items-center justify-center mx-auto shadow-sm">
              <Trash2 size={22} />
            </div>

            <div>
              <h3 className="text-base font-extrabold text-app font-outfit">
                Remove Roadmap?
              </h3>
              <p className="text-xs text-muted mt-1.5 leading-relaxed">
                Are you sure you want to remove <span className="font-bold text-app">"{roadmapToDelete.topic}"</span>? This will permanently delete your milestones and study progress.
              </p>
            </div>

            <div className="flex items-center gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setRoadmapToDelete(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 font-bold text-xs hover:bg-slate-100 dark:hover:bg-slate-800 text-muted hover:text-app transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deletingRoadmap}
                onClick={confirmDeleteRoadmap}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs transition-all shadow-md shadow-red-600/20 disabled:opacity-50"
              >
                {deletingRoadmap ? 'Removing...' : 'Yes, Remove'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AiRoadmap;
