import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import axios from 'axios';
import { Trophy, Award, TrendingUp, HelpCircle, Star } from 'lucide-react';

const Leaderboard = () => {
  const { token } = useSelector((state) => state.auth);
  
  const [boardList, setBoardList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timelineFilter, setTimelineFilter] = useState('All-Time'); // Weekly, Monthly, All-Time

  useEffect(() => {
    fetchLeaderboardList();
  }, [token]);

  const fetchLeaderboardList = async () => {
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const res = await axios.get('/api/dashboard/leaderboard', config);
      setBoardList(res.data.leaderboard || []);
    } catch (err) {
      console.error('Error fetching leaderboard logs:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 p-8 space-y-6 flex flex-col justify-center items-center h-screen bg-slate-950 text-slate-100">
        <div className="w-12 h-12 rounded-full border-4 border-indigo-500/20 border-t-indigo-500 animate-spin" />
        <span className="text-sm font-medium text-slate-400">Syncing lobby scoreboard rankings...</span>
      </div>
    );
  }

  // Generate top 3 podium users if list has enough elements
  const podium = boardList.slice(0, 3);
  const bodyList = boardList.slice(3);

  return (
    <div className="flex-1 p-6 lg:p-8 space-y-8 bg-slate-950 min-h-screen text-slate-200 overflow-y-auto">
      {/* Brand Header banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-r from-slate-900/60 to-slate-900/60 p-6 rounded-3xl border border-slate-800/60 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center shadow-lg shadow-orange-500/20">
            <Trophy size={22} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl lg:text-3xl font-extrabold text-white font-outfit tracking-tight">Lobby Leaderboards</h1>
            <p className="text-sm text-slate-400 mt-1">Exchange knowledge, earn points, and climb the platform ranks!</p>
          </div>
        </div>
      </div>

      {/* Podium Display Ranks 1, 2, 3 */}
      {podium.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto pt-6 pb-2">
          
          {/* Rank 2 - Silver Medal (Rendered left in standard podium structures) */}
          {podium[1] && (
            <div className="glass-panel p-6 rounded-3xl flex flex-col items-center justify-center text-center border-slate-800/60 relative overflow-hidden order-2 md:order-1 h-fit md:mt-8">
              <span className="text-3xl mb-2">🥈</span>
              <img src={podium[1].profileImage} alt={podium[1].name} className="w-16 h-16 rounded-full bg-slate-850 border border-slate-700" />
              <h3 className="font-extrabold text-sm text-slate-200 mt-3 font-outfit leading-none">{podium[1].name}</h3>
              <span className="text-[10px] text-slate-400 mt-1">Rank #2 in Platform</span>
              <p className="text-sm font-bold text-slate-300 mt-3 font-mono">🏆 {podium[1].points} pts</p>
            </div>
          )}

          {/* Rank 1 - Gold Medal */}
          {podium[0] && (
            <div className="glass-panel p-8 rounded-3xl flex flex-col items-center justify-center text-center border-indigo-500/20 relative overflow-hidden order-1 md:order-2 bg-gradient-to-br from-slate-900 via-indigo-950/20 to-slate-900 shadow-xl shadow-indigo-600/5">
              <div className="absolute top-0 right-0 w-16 h-16 bg-amber-500/10 rounded-full blur-xl" />
              <span className="text-4xl mb-2">🥇</span>
              <img src={podium[0].profileImage} alt={podium[0].name} className="w-20 h-20 rounded-full bg-slate-850 border-2 border-amber-400 shadow-2xl" />
              <h3 className="font-extrabold text-base text-white mt-3 font-outfit leading-none">{podium[0].name}</h3>
              <span className="text-xs text-slate-400 mt-1.5">Grand Champion</span>
              <p className="text-base font-extrabold text-amber-500 mt-4 font-mono">🏆 {podium[0].points} pts</p>
            </div>
          )}

          {/* Rank 3 - Bronze Medal */}
          {podium[2] && (
            <div className="glass-panel p-6 rounded-3xl flex flex-col items-center justify-center text-center border-slate-800/60 relative overflow-hidden order-3 md:order-3 h-fit md:mt-12">
              <span className="text-3xl mb-2">🥉</span>
              <img src={podium[2].profileImage} alt={podium[2].name} className="w-16 h-16 rounded-full bg-slate-850 border border-slate-700" />
              <h3 className="font-extrabold text-sm text-slate-200 mt-3 font-outfit leading-none">{podium[2].name}</h3>
              <span className="text-[10px] text-slate-400 mt-1">Rank #3 in Platform</span>
              <p className="text-sm font-bold text-orange-400 mt-3 font-mono">🏆 {podium[2].points} pts</p>
            </div>
          )}

        </div>
      )}

      {/* Main Ranking List */}
      <div className="max-w-4xl mx-auto glass-panel p-6 rounded-3xl space-y-4">
        <div className="flex justify-between items-center border-b border-slate-850 pb-4">
          <h3 className="font-bold text-sm text-slate-100 font-outfit flex items-center gap-2">
            <Award size={16} className="text-indigo-400" /> Standard Rankings list
          </h3>
          
          {/* timeline toggler */}
          <div className="flex gap-1.5 bg-slate-900 p-1 border border-slate-850 rounded-xl">
            {['Weekly', 'Monthly', 'All-Time'].map((timeline) => (
              <button
                key={timeline}
                onClick={() => setTimelineFilter(timeline)}
                className={`px-3 py-1 rounded-lg text-[10px] font-bold transition-all ${
                  timelineFilter === timeline
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {timeline}
              </button>
            ))}
          </div>
        </div>

        {/* Score list */}
        {bodyList.length === 0 ? (
          <p className="text-xs text-slate-500 text-center py-6">Exceed 3 users to list detailed rankings.</p>
        ) : (
          <div className="space-y-2">
            {bodyList.map((userObj, idx) => {
              const currentRank = idx + 4;
              return (
                <div key={userObj._id} className="p-3.5 bg-slate-900/40 border border-slate-850 rounded-2xl flex items-center justify-between hover:bg-slate-900/60 transition-colors">
                  <div className="flex items-center gap-3.5">
                    <span className="font-mono font-bold text-xs text-slate-500 w-4 text-center">#{currentRank}</span>
                    <img src={userObj.profileImage} alt={userObj.name} className="w-9 h-9 rounded-xl bg-slate-850" />
                    <div>
                      <h4 className="font-bold text-xs text-slate-200">{userObj.name}</h4>
                      <p className="text-[9px] text-slate-500">{userObj.email}</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-amber-500 font-mono">🏆 {userObj.points} pts</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Gamification Points Rules */}
      <div className="max-w-4xl mx-auto glass-panel p-6 rounded-3xl space-y-4">
        <h3 className="font-bold text-sm text-slate-100 font-outfit flex items-center gap-2">
          💡 Scoreboard Mechanics
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-slate-400">
          <div className="px-4 py-20 bg-slate-900/30 rounded-2xl border border-slate-850 text-center">
            <span className="text-lg font-bold text-indigo-400">+50 Points</span>
            <h4 className="font-bold text-slate-300 mt-1">60+ Minute Session Completed</h4>
            <p className="text-[10px] text-slate-500 mt-1">Awarded to mentors when an accepted video classroom session is marked complete.</p>
          </div>
          <div className="px-4 py-20 bg-slate-900/30 rounded-2xl border border-slate-850 text-center">
            <span className="text-lg font-bold text-purple-400">+20 Points</span>
            <h4 className="font-bold text-slate-300 mt-1">Help Others / Resources</h4>
            <p className="text-[10px] text-slate-500 mt-1">Earned when users share images, PDFs, notes, or booklets in chat.</p>
          </div>
          <div className="px-4 py-20 bg-slate-900/30 rounded-2xl border border-slate-850 text-center">
            <span className="text-lg font-bold text-amber-400">+10 Points</span>
            <h4 className="font-bold text-slate-300 mt-1">Daily Platform Login</h4>
            <p className="text-[10px] text-slate-500 mt-1">Automated streak bonus points on first daily login.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;
