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
  TrendingUp,
  CheckCircle,
  Database
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
  const [loading, setLoading] = useState(true);
  const [newSkillName, setNewSkillName] = useState('');
  const [newSkillCategory, setNewSkillCategory] = useState('Web Development');
  const [newSkillDesc, setNewSkillDesc] = useState('');
  const [newSkillTags, setNewSkillTags] = useState('');
  const [skillMsg, setSkillMsg] = useState('');

  useEffect(() => {
    fetchAdminStats();
  }, [token]);

  const fetchAdminStats = async () => {
    try {
      const res = await apiClient.get('/api/dashboard/admin');
      setAdminStats(res.data);
    } catch (err) {
      console.error('Error loading admin stats:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSkill = async (e) => {
    e.preventDefault();
    setSkillMsg('');

    if (!newSkillName || !newSkillCategory) return;

    try {
      await apiClient.post('/api/skills', {
        name: newSkillName,
        category: newSkillCategory,
        description: newSkillDesc,
        tags: newSkillTags.split(',').map(t => t.trim()).filter(Boolean)
      });

      setSkillMsg('Skill created successfully in the master database!');
      setNewSkillName('');
      setNewSkillDesc('');
      setNewSkillTags('');
      fetchAdminStats();
    } catch (err) {
      console.error('Error creating skill:', err);
      setSkillMsg(err.response?.data?.message || 'Error creating skill entry');
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

  // Chart configuration for Sessions Statuses
  const sessionsChartData = {
    labels: charts?.sessionsBreakdown?.labels || ['Completed', 'Pending', 'Upcoming', 'Other'],
    datasets: [
      {
        data: charts?.sessionsBreakdown?.data || [0, 0, 0, 0],
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
              <Doughnut data={sessionsChartData} options={chartOptions} />
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

        {/* Right Column - Add Skills to base */}
        <div className="glass-panel p-6 rounded-3xl space-y-4 h-fit">
          <h3 className="font-bold text-lg text-slate-100 font-outfit flex items-center gap-2">
            <Plus size={18} className="text-indigo-400" /> Insert Master Skill
          </h3>
          <p className="text-xs text-slate-400">Append new learning assets to the global categories list.</p>

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
                <option value="Web Development">Web Development</option>
                <option value="MERN Stack">MERN Stack</option>
                <option value="Java">Java</option>
                <option value="Python">Python</option>
                <option value="UI/UX Design">UI/UX Design</option>
                <option value="Data Science">Data Science</option>
                <option value="AI/ML">AI/ML</option>
                <option value="Cyber Security">Cyber Security</option>
                <option value="Mobile Development">Mobile Development</option>
              </select>
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
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
