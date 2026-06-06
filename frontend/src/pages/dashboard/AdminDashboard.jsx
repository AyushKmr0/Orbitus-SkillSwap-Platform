import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import apiClient from '../../services/apiClient.js';
import {
  Users,
  Compass,
  FileCheck,
  Star,
  Plus,
  Shield,
  CheckCircle,
  Database,
  Edit2,
  Trash2,
  X
} from 'lucide-react';
import { Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip as ChartTooltip,
  Legend as ChartLegend
} from 'chart.js';

ChartJS.register(ArcElement, ChartTooltip, ChartLegend);

const AdminDashboard = () => {
  const { token } = useSelector((state) => state.auth);
  
  const [adminStats, setAdminStats] = useState(null);
  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newSkillName, setNewSkillName] = useState('');
  const [newSkillCategory, setNewSkillCategory] = useState('Web Development');
  const [customSkillCategory, setCustomSkillCategory] = useState('');
  const [newSkillDesc, setNewSkillDesc] = useState('');
  const [newSkillTags, setNewSkillTags] = useState('');
  const [editingSkillId, setEditingSkillId] = useState('');
  const [editSkillDraft, setEditSkillDraft] = useState(null);
  const [skillMsg, setSkillMsg] = useState('');

  const defaultCategories = [
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
    fetchAdminStats();
  }, [token]);

  const fetchAdminStats = async () => {
    try {
      const res = await apiClient.get('/api/dashboard/admin');
      setAdminStats(res.data);
      await fetchSkills();
    } catch (err) {
      console.error('Error loading admin stats:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSkills = async () => {
    const res = await apiClient.get('/api/skills');
    setSkills(res.data.skills || []);
  };

  const getSelectedCategory = () => (
    newSkillCategory === '__custom__' ? customSkillCategory.trim() : newSkillCategory
  );

  const categoryOptions = Array.from(new Set([
    ...defaultCategories,
    ...(adminStats?.charts?.skillsBreakdown?.labels || []),
    ...skills.map((skill) => skill.category).filter(Boolean)
  ]));

  const handleCreateSkill = async (e) => {
    e.preventDefault();
    setSkillMsg('');

    const category = getSelectedCategory();
    if (!newSkillName || !category) return;

    try {
      await apiClient.post('/api/skills', {
        name: newSkillName,
        category,
        description: newSkillDesc,
        tags: newSkillTags.split(',').map(t => t.trim()).filter(Boolean)
      });

      setSkillMsg('Skill created successfully in the master database!');
      setNewSkillName('');
      setCustomSkillCategory('');
      setNewSkillDesc('');
      setNewSkillTags('');
      fetchAdminStats();
    } catch (err) {
      console.error('Error creating skill:', err);
      setSkillMsg(err.response?.data?.message || 'Error creating skill entry');
    }
  };

  const startEditSkill = (skill) => {
    setEditingSkillId(skill._id);
    setEditSkillDraft({
      name: skill.name || '',
      category: skill.category || '',
      description: skill.description || '',
      tags: (skill.tags || []).join(', ')
    });
  };

  const cancelEditSkill = () => {
    setEditingSkillId('');
    setEditSkillDraft(null);
  };

  const handleUpdateSkill = async (skillId) => {
    if (!editSkillDraft?.name || !editSkillDraft?.category) return;
    setSkillMsg('');

    try {
      await apiClient.put(`/api/skills/${skillId}`, {
        name: editSkillDraft.name,
        category: editSkillDraft.category,
        description: editSkillDraft.description,
        tags: editSkillDraft.tags.split(',').map(t => t.trim()).filter(Boolean)
      });

      setSkillMsg('Skill updated successfully.');
      cancelEditSkill();
      fetchAdminStats();
    } catch (err) {
      console.error('Error updating skill:', err);
      setSkillMsg(err.response?.data?.message || 'Error updating skill entry');
    }
  };

  const handleDeleteSkill = async (skillId) => {
    const confirmed = window.confirm('Remove this skill from the master database?');
    if (!confirmed) return;

    setSkillMsg('');

    try {
      await apiClient.delete(`/api/skills/${skillId}`);
      setSkillMsg('Skill removed successfully.');
      fetchAdminStats();
    } catch (err) {
      console.error('Error deleting skill:', err);
      setSkillMsg(err.response?.data?.message || 'Error removing skill entry');
    }
  };

  if (loading || !adminStats) {
    return (
      <div className="flex-1 p-8 space-y-6 flex flex-col justify-center items-center h-screen bg-slate-950 text-slate-100">
        <div className="w-12 h-12 rounded-full border-4 border-indigo-500/20 border-t-indigo-500 animate-spin" />
        <span className="text-sm font-medium text-slate-400">Compiling platform analytics...</span>
      </div>
    );
  }

  const { stats, charts, leaderboard } = adminStats;
  const sessionLabels = charts?.sessionsBreakdown?.labels || ['Completed', 'Pending', 'Upcoming', 'Other'];
  const sessionValues = charts?.sessionsBreakdown?.data || [0, 0, 0, 0];
  const hasSessionChartData = sessionValues.some((value) => Number(value) > 0);

  // Chart configuration for Sessions Statuses
  const sessionsChartData = {
    labels: sessionLabels,
    datasets: [
      {
        data: sessionValues,
        backgroundColor: ['#10b981', '#f59e0b', '#6366f1', '#64748b'],
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.05)'
      }
    ]
  };

  // Chart configuration for Skills categories
  const skillsChartData = {
    labels: charts?.skillsBreakdown?.labels || ['Web Dev', 'Mobile', 'UI/UX'],
    datasets: [
      {
        data: charts?.skillsBreakdown?.data || [0, 0, 0],
        backgroundColor: [
          '#6366f1',
          '#a855f7',
          '#ec4899',
          '#f43f5e',
          '#14b8a6',
          '#3b82f6',
          '#f59e0b',
          '#10b981'
        ],
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.05)'
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom',
        labels: { color: '#94a3b8', font: { family: 'Inter', size: 10 } }
      }
    }
  };

  return (
    <div className="flex-1 p-6 lg:p-8 space-y-8 bg-slate-950 min-h-screen text-slate-200 overflow-y-auto">
      {/* Banner Header */}
      <div className="flex items-center gap-3 bg-gradient-to-r from-red-950/20 via-slate-900/60 to-slate-900/60 p-6 rounded-3xl border border-red-900/20 backdrop-blur-md">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-red-500 to-pink-500 flex items-center justify-center shadow-lg shadow-pink-500/20">
          <Shield size={22} className="text-white" />
        </div>
        <div>
          <h1 className="text-2xl lg:text-3xl font-extrabold text-white font-outfit tracking-tight">Admin Hub</h1>
          <p className="text-sm text-slate-400 mt-1">Platform management, statistics, and category controls</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Registrations', value: stats.totalUsers, sub: `Active: ${stats.activeUsers}`, icon: Users, color: 'text-indigo-400 bg-indigo-400/10 border-indigo-500/20' },
          { label: 'Tutoring Skills', value: stats.totalSkills, sub: 'Teachable categories', icon: Compass, color: 'text-purple-400 bg-purple-400/10 border-purple-500/20' },
          { label: 'Booked Exchanges', value: stats.totalSessions, sub: 'Real-time session slots', icon: FileCheck, color: 'text-emerald-400 bg-emerald-400/10 border-emerald-500/20' },
          { label: 'Reviews Collected', value: stats.totalReviews, sub: 'Exchanged feedback reviews', icon: Star, color: 'text-amber-400 bg-amber-400/10 border-amber-500/20' }
        ].map((card, i) => {
          const Icon = card.icon;
          return (
            <div key={i} className="glass-panel p-5 rounded-3xl flex flex-col justify-between border-slate-800/60 relative overflow-hidden group">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-xs text-slate-400 font-semibold">{card.label}</span>
                  <h3 className="text-2xl font-bold text-white tracking-tight mt-1">{card.value}</h3>
                </div>
                <div className={`p-2.5 rounded-xl border ${card.color}`}>
                  <Icon size={20} />
                </div>
              </div>
              <span className="text-[10px] text-slate-500 mt-4 leading-none truncate">{card.sub}</span>
            </div>
          );
        })}
      </div>

      {/* Main split sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Doughnuts Charts */}
        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="glass-panel p-6 rounded-3xl space-y-4">
            <h3 className="font-bold text-base text-slate-100 font-outfit text-center">Sessions Status Shares</h3>
            <div className="w-56 mx-auto">
              {hasSessionChartData ? (
                <Doughnut data={sessionsChartData} options={chartOptions} />
              ) : (
                <div className="flex h-56 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-800 text-center">
                  <FileCheck size={24} className="text-slate-500" />
                  <p className="mt-2 text-xs font-semibold text-slate-400">No sessions yet</p>
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {sessionLabels.map((label, index) => (
                <div key={label} className="rounded-xl border border-slate-850 bg-slate-900/40 px-3 py-2">
                  <p className="text-slate-500">{label}</p>
                  <p className="mt-0.5 font-bold text-slate-200">{sessionValues[index] || 0}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="glass-panel p-6 rounded-3xl space-y-4">
            <h3 className="font-bold text-base text-slate-100 font-outfit text-center">Teachable Category Shares</h3>
            <div className="w-56 mx-auto">
              <Doughnut data={skillsChartData} options={chartOptions} />
            </div>
          </div>

          {/* User management list */}
          <div className="md:col-span-2 glass-panel p-6 rounded-3xl space-y-4">
            <h3 className="font-bold text-base text-slate-100 font-outfit flex items-center gap-2">
              <Database size={16} /> Points Achievers List
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-850 text-slate-400 font-semibold uppercase">
                    <th className="py-2.5">User Details</th>
                    <th className="py-2.5">Email</th>
                    <th className="py-2.5 text-right">Points Count</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850 text-slate-300">
                  {leaderboard.map((lead) => (
                    <tr key={lead._id} className="hover:bg-slate-900/20">
                      <td className="py-3 flex items-center gap-2">
                        <img src={lead.profileImage} alt={lead.name} className="w-8 h-8 rounded-lg bg-slate-850" />
                        <span className="font-semibold text-slate-200">{lead.name}</span>
                      </td>
                      <td className="py-3 text-slate-400">{lead.email}</td>
                      <td className="py-3 text-right font-bold text-amber-500">🏆 {lead.points} pts</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column - Add and manage skills */}
        <div className="glass-panel p-6 rounded-3xl space-y-5 h-fit">
          <h3 className="font-bold text-lg text-slate-100 font-outfit flex items-center gap-2">
            <Plus size={18} className="text-indigo-400" /> Manage Master Skills
          </h3>
          <p className="text-xs text-slate-400">Add, edit, remove, and categorize skills in the global catalog.</p>

          {skillMsg && (
            <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs rounded-xl flex items-center gap-2">
              <CheckCircle size={14} />
              <span>{skillMsg}</span>
            </div>
          )}

          <form onSubmit={handleCreateSkill} className="space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] font-semibold text-slate-400 uppercase">Skill Name</label>
              <input
                type="text"
                required
                value={newSkillName}
                onChange={(e) => setNewSkillName(e.target.value)}
                placeholder="e.g. Next.js 14"
                className="w-full px-4 py-2 bg-slate-900 border border-slate-850 rounded-xl text-slate-200 text-xs outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-semibold text-slate-400 uppercase">Skill Category</label>
              <select
                value={newSkillCategory}
                onChange={(e) => setNewSkillCategory(e.target.value)}
                className="w-full px-4 py-2 bg-slate-900 border border-slate-850 rounded-xl text-slate-400 text-xs outline-none"
              >
                {categoryOptions.map((category) => (
                  <option key={category} value={category}>{category}</option>
                ))}
                <option value="__custom__">Type new category...</option>
              </select>
              {newSkillCategory === '__custom__' && (
                <input
                  type="text"
                  required
                  value={customSkillCategory}
                  onChange={(e) => setCustomSkillCategory(e.target.value)}
                  placeholder="Enter custom category"
                  className="mt-2 w-full px-4 py-2 bg-slate-900 border border-slate-850 rounded-xl text-slate-200 text-xs outline-none"
                />
              )}
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-semibold text-slate-400 uppercase">Description Details</label>
              <textarea
                value={newSkillDesc}
                onChange={(e) => setNewSkillDesc(e.target.value)}
                rows={2}
                placeholder="Brief skill definitions..."
                className="w-full px-4 py-2 bg-slate-900 border border-slate-850 rounded-xl text-slate-200 text-xs outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-semibold text-slate-400 uppercase">Tags (comma separated)</label>
              <input
                type="text"
                value={newSkillTags}
                onChange={(e) => setNewSkillTags(e.target.value)}
                placeholder="nextjs, frontend, react"
                className="w-full px-4 py-2 bg-slate-900 border border-slate-850 rounded-xl text-slate-200 text-xs outline-none"
              />
            </div>

            <button type="submit" className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 rounded-xl font-semibold text-white text-xs transition-all flex items-center justify-center gap-1.5 shadow">
              <Plus size={14} /> Add Skill to Platform
            </button>
          </form>

          <div className="border-t border-slate-850 pt-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h4 className="text-xs font-bold uppercase text-slate-400">Skill Database</h4>
              <span className="rounded-full bg-slate-900 px-2 py-1 text-[10px] font-bold text-slate-400">{skills.length} skills</span>
            </div>

            <div className="max-h-[520px] space-y-3 overflow-y-auto pr-1">
              {skills.map((skill) => {
                const isEditing = editingSkillId === skill._id;

                return (
                  <div key={skill._id} className="rounded-2xl border border-slate-850 bg-slate-900/40 p-3">
                    {isEditing ? (
                      <div className="space-y-2">
                        <input
                          value={editSkillDraft.name}
                          onChange={(e) => setEditSkillDraft({ ...editSkillDraft, name: e.target.value })}
                          className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-200 outline-none"
                        />
                        <input
                          value={editSkillDraft.category}
                          onChange={(e) => setEditSkillDraft({ ...editSkillDraft, category: e.target.value })}
                          placeholder="Category"
                          className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-200 outline-none"
                        />
                        <textarea
                          value={editSkillDraft.description}
                          onChange={(e) => setEditSkillDraft({ ...editSkillDraft, description: e.target.value })}
                          rows={2}
                          placeholder="Description"
                          className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-200 outline-none"
                        />
                        <input
                          value={editSkillDraft.tags}
                          onChange={(e) => setEditSkillDraft({ ...editSkillDraft, tags: e.target.value })}
                          placeholder="Tags, comma separated"
                          className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-200 outline-none"
                        />
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => handleUpdateSkill(skill._id)}
                            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-500"
                          >
                            <CheckCircle size={13} /> Save
                          </button>
                          <button
                            type="button"
                            onClick={cancelEditSkill}
                            className="flex items-center justify-center rounded-xl border border-slate-800 px-3 py-2 text-xs font-bold text-slate-300 hover:bg-slate-800"
                          >
                            <X size={13} />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-bold text-slate-100">{skill.name}</p>
                            <p className="mt-0.5 text-[10px] font-semibold uppercase text-indigo-400">{skill.category}</p>
                          </div>
                          <div className="flex shrink-0 gap-1">
                            <button
                              type="button"
                              onClick={() => startEditSkill(skill)}
                              className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-slate-100"
                              title="Edit skill"
                            >
                              <Edit2 size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteSkill(skill._id)}
                              className="rounded-lg p-2 text-red-400 hover:bg-red-500/10"
                              title="Remove skill"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                        {skill.description && (
                          <p className="line-clamp-2 text-xs text-slate-500">{skill.description}</p>
                        )}
                        {skill.tags?.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {skill.tags.slice(0, 4).map((tag) => (
                              <span key={tag} className="rounded-full bg-slate-950 px-2 py-0.5 text-[10px] font-semibold text-slate-500">{tag}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
