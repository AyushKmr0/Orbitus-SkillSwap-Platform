import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../services/apiClient.js';
import { Trophy, Award, TrendingUp, HelpCircle, Star, UserCheck } from 'lucide-react';

const Leaderboard = () => {
  const { token, user: authUser } = useSelector((state) => state.auth);
  const navigate = useNavigate();
  
  const [boardList, setBoardList] = useState([]);
  const [currentUserRank, setCurrentUserRank] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timelineFilter, setTimelineFilter] = useState('All-Time'); // Weekly, Monthly, All-Time

  useEffect(() => {
    fetchLeaderboardList(timelineFilter);
  }, [token]);

  const fetchLeaderboardList = async (timeline) => {
    setLoading(true);
    try {
      const activeTimeline = (timeline || timelineFilter).toLowerCase();
      const res = await apiClient.get('/api/dashboard/leaderboard', {
        params: { timeframe: activeTimeline }
      });
      setBoardList(res.data.leaderboard || []);
      setCurrentUserRank(res.data.currentUserRank || null);
    } catch (err) {
      console.error('Error fetching leaderboard logs:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTimelineChange = (timeline) => {
    setTimelineFilter(timeline);
    fetchLeaderboardList(timeline);
  };

  if (loading && boardList.length === 0) {
    return (
      <div className="flex-1 p-8 space-y-6 flex flex-col justify-center items-center h-screen page-shell text-app">
        <div className="w-12 h-12 rounded-full border-4 border-indigo-500/20 border-t-indigo-500 animate-spin" />
        <span className="text-sm font-medium text-muted">Syncing lobby scoreboard rankings...</span>
      </div>
    );
  }

  // Generate top 3 podium users if list has enough elements
  const podium = boardList.slice(0, 3);
  const bodyList = boardList.slice(3);

  const goToProfile = (userObj) => {
    if (!userObj) return;
    const identifier = userObj.username || userObj._id;
    navigate(`/profile/${identifier}`);
  };

  return (
    <div className="page-shell flex-1 p-6 lg:p-8 space-y-8 min-h-screen text-app overflow-y-auto animate-fade-in">
      {/* Brand Header banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-[#22242a] p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center shadow-lg shadow-orange-500/20">
            <Trophy size={22} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl lg:text-3xl font-extrabold text-app font-outfit tracking-tight">Platform Leaderboards</h1>
            <p className="text-sm text-muted mt-1">Exchange knowledge, earn points, and climb the platform ranks!</p>
          </div>
        </div>

        {/* Timeline toggler */}
        <div className="flex gap-1.5 bg-slate-100 dark:bg-slate-900 p-1.5 border border-slate-200 dark:border-slate-800 rounded-2xl self-stretch md:self-auto justify-center">
          {['Weekly', 'Monthly', 'All-Time'].map((timeline) => (
            <button
              key={timeline}
              onClick={() => handleTimelineChange(timeline)}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
                timelineFilter === timeline
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : 'text-muted hover:text-app'
              }`}
            >
              {timeline}
            </button>
          ))}
        </div>
      </div>


      {/* Podium Display Ranks 1, 2, 3 */}
      {podium.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto pt-4 pb-2">
          
          {/* Rank 2 - Silver Medal */}
          {podium[1] && (
            <div
              onClick={() => goToProfile(podium[1])}
              className="bg-white dark:bg-[#22242a] p-6 rounded-3xl flex flex-col items-center justify-center text-center border border-slate-200 dark:border-slate-800 relative overflow-hidden order-2 md:order-1 h-fit md:mt-8 shadow-sm cursor-pointer hover:border-slate-400 dark:hover:border-slate-600 interactive-card animate-card-enter stagger-2 transition-all"
            >
              <span className="text-3xl mb-2">🥈</span>
              <img
                src={podium[1].profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(podium[1].name)}&background=4f46e5&color=fff`}
                alt={podium[1].name}
                className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 object-cover"
              />
              <h3 className="font-extrabold text-sm text-app mt-3 font-outfit leading-none">{podium[1].name}</h3>
              <span className="text-[10px] text-muted mt-1">Rank #2 in Platform</span>
              <p className="text-sm font-bold text-slate-700 dark:text-slate-300 mt-3 font-mono">🏆 {podium[1].points} pts</p>
            </div>
          )}

          {/* Rank 1 - Gold Medal */}
          {podium[0] && (
            <div
              onClick={() => goToProfile(podium[0])}
              className="bg-white dark:bg-[#22242a] p-8 rounded-3xl flex flex-col items-center justify-center text-center border-2 border-amber-400/40 relative overflow-hidden order-1 md:order-2 shadow-xl shadow-amber-500/5 cursor-pointer hover:border-amber-400 interactive-card animate-card-enter stagger-1 transition-all"
            >
              <div className="absolute top-0 right-0 w-16 h-16 bg-amber-500/10 rounded-full blur-xl" />
              <span className="text-4xl mb-2">🥇</span>
              <img
                src={podium[0].profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(podium[0].name)}&background=f59e0b&color=fff`}
                alt={podium[0].name}
                className="w-20 h-20 rounded-full bg-slate-100 dark:bg-slate-850 border-2 border-amber-400 shadow-2xl object-cover"
              />
              <h3 className="font-extrabold text-base text-app mt-3 font-outfit leading-none">{podium[0].name}</h3>
              <span className="text-xs text-muted mt-1.5">Grand Champion</span>
              <p className="text-base font-extrabold text-amber-500 mt-4 font-mono">🏆 {podium[0].points} pts</p>
            </div>
          )}

          {/* Rank 3 - Bronze Medal */}
          {podium[2] && (
            <div
              onClick={() => goToProfile(podium[2])}
              className="bg-white dark:bg-[#22242a] p-6 rounded-3xl flex flex-col items-center justify-center text-center border border-slate-200 dark:border-slate-800 relative overflow-hidden order-3 md:order-3 h-fit md:mt-12 shadow-sm cursor-pointer hover:border-slate-400 dark:hover:border-slate-600 interactive-card animate-card-enter stagger-3 transition-all"
            >
              <span className="text-3xl mb-2">🥉</span>
              <img
                src={podium[2].profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(podium[2].name)}&background=ea580c&color=fff`}
                alt={podium[2].name}
                className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 object-cover"
              />
              <h3 className="font-extrabold text-sm text-app mt-3 font-outfit leading-none">{podium[2].name}</h3>
              <span className="text-[10px] text-muted mt-1">Rank #3 in Platform</span>
              <p className="text-sm font-bold text-orange-400 mt-3 font-mono">🏆 {podium[2].points} pts</p>
            </div>
          )}

        </div>
      )}

      {/* Main Ranking List */}
      <div className="max-w-4xl mx-auto bg-white dark:bg-[#22242a] border border-slate-200 dark:border-slate-800 p-6 rounded-3xl space-y-4 shadow-sm">
        <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-4">
          <h3 className="font-bold text-sm text-app font-outfit flex items-center gap-2">
            <Award size={16} className="text-indigo-400" /> Platform Ranks (4 – 15)
          </h3>
          <span className="text-xs text-muted">{boardList.length} Ranked Members</span>
        </div>

        {/* Score list — max 12 entries so podium(3) + list(12) = 15 total */}
        {bodyList.length === 0 ? (
          <p className="text-xs text-muted text-center py-6">Exceed 3 users to list detailed rankings.</p>
        ) : (
          <div className="space-y-2">
            {bodyList.slice(0, 12).map((userObj, idx) => {
              const currentRank = idx + 4;
              const isCurrentUser = authUser?._id && userObj._id.toString() === authUser._id.toString();

              return (
                <div
                  key={userObj._id}
                  onClick={() => goToProfile(userObj)}
                  className={`p-3.5 rounded-2xl flex items-center justify-between interactive-card animate-card-enter stagger-${(idx % 6) + 1} cursor-pointer ${
                    isCurrentUser
                      ? 'bg-indigo-50/80 dark:bg-indigo-950/40 border-2 border-indigo-500/50 shadow-sm'
                      : 'bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-900/60'
                  }`}
                >
                  <div className="flex items-center gap-3.5">
                    <span className="font-mono font-bold text-xs text-muted w-6 text-center">#{currentRank}</span>
                    <img
                      src={userObj.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(userObj.name)}&background=4f46e5&color=fff`}
                      alt={userObj.name}
                      className="w-9 h-9 rounded-full bg-slate-200 dark:bg-slate-800 object-cover"
                    />
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h4 className="font-bold text-xs text-app">{userObj.name}</h4>
                        {isCurrentUser && (
                          <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-indigo-600 text-white">YOU</span>
                        )}
                      </div>
                      <p className="text-[10px] text-muted">{userObj.experienceLevel || 'Learner'}</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-amber-500 font-mono">🏆 {userObj.points} pts</span>
                </div>
              );
            })}

            {/* If current user is outside the top 15, append at the very bottom */}
            {currentUserRank && !currentUserRank.isInTopList && (
              <div className="mt-3 pt-3 border-t-2 border-dashed border-slate-200 dark:border-slate-800">
                <div
                  onClick={() => goToProfile(currentUserRank.user)}
                  className="p-3.5 rounded-2xl bg-indigo-50/80 dark:bg-indigo-950/40 border-2 border-indigo-500/60 flex items-center justify-between cursor-pointer shadow-sm"
                >
                  <div className="flex items-center gap-3.5">
                    <span className="font-mono font-bold text-xs text-indigo-600 dark:text-indigo-400 w-6 text-center">
                      #{currentUserRank.rank}
                    </span>
                    <img
                      src={currentUserRank.user?.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUserRank.user?.name || 'User')}&background=4f46e5&color=fff`}
                      alt="You"
                      className="w-9 h-9 rounded-full bg-slate-200 dark:bg-slate-800 object-cover"
                    />
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h4 className="font-bold text-xs text-app">{currentUserRank.user?.name || 'You'}</h4>
                        <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-indigo-600 text-white">YOU</span>
                      </div>
                      <p className="text-[10px] text-muted">{currentUserRank.user?.experienceLevel || 'Member'}</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-amber-500 font-mono">🏆 {currentUserRank.points} pts</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>


      {/* Gamification Points Rules */}
      <div className="max-w-4xl mx-auto bg-white dark:bg-[#22242a] border border-slate-200 dark:border-slate-800 p-6 rounded-3xl space-y-4 shadow-sm">
        <h3 className="font-bold text-sm text-app font-outfit flex items-center gap-2">
          💡 Scoreboard Mechanics
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-muted">
          <div className="px-4 py-8 bg-slate-50 dark:bg-slate-900/30 rounded-2xl border border-slate-200 dark:border-slate-800 text-center">
            <span className="text-lg font-bold text-indigo-500 dark:text-indigo-400">+50 Points</span>
            <h4 className="font-bold text-app mt-1">60+ Minute Session Completed</h4>
            <p className="text-[10px] text-muted mt-1">Awarded to mentors when an accepted video classroom session is marked complete.</p>
          </div>
          <div className="px-4 py-8 bg-slate-50 dark:bg-slate-900/30 rounded-2xl border border-slate-200 dark:border-slate-800 text-center">
            <span className="text-lg font-bold text-purple-500 dark:text-purple-400">+20 Points</span>
            <h4 className="font-bold text-app mt-1">Help Others / Resources</h4>
            <p className="text-[10px] text-muted mt-1">Earned when users share images, PDFs, notes, or booklets in chat.</p>
          </div>
          <div className="px-4 py-8 bg-slate-50 dark:bg-slate-900/30 rounded-2xl border border-slate-200 dark:border-slate-800 text-center">
            <span className="text-lg font-bold text-amber-500 dark:text-amber-400">+10 Points</span>
            <h4 className="font-bold text-app mt-1">Daily Platform Login</h4>
            <p className="text-[10px] text-muted mt-1">Automated streak bonus points on first daily login.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;
