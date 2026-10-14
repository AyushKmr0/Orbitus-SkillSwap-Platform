import React, { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../services/apiClient.js';
import { Trophy, Award, Medal, Zap, Lightbulb } from 'lucide-react';
import RubberSegment from '../../components/common/react-bits/RubberSegment.jsx';
import BorderGlow from '../../components/common/react-bits/BorderGlow.jsx';
import { Avatar, AvatarImage, AvatarFallback, Badge } from '../../components/ui/index.js';

const Leaderboard = () => {
  const { token, user: authUser } = useSelector((state) => state.auth);
  const navigate = useNavigate();

  const [boardList, setBoardList] = useState([]);
  const [currentUserRank, setCurrentUserRank] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timelineFilter, setTimelineFilter] = useState('All-Time');

  const fetchLeaderboardList = useCallback(async (timeline) => {
    setLoading(true);
    try {
      const activeTimeline = (timeline || timelineFilter).toLowerCase();
      const res = await apiClient.get('/api/dashboard/leaderboard', {
        params: { timeframe: activeTimeline }
      });
      const payload = res.data?.data || res.data || {};
      const board = payload.leaderboard || res.data?.leaderboard || [];
      setBoardList(Array.isArray(board) ? board : []);
      setCurrentUserRank(payload.currentUserRank || res.data?.currentUserRank || null);
    } catch (err) {
      console.error('Error fetching leaderboard logs:', err);
    } finally {
      setLoading(false);
    }
  }, [timelineFilter]);

  useEffect(() => {
    fetchLeaderboardList(timelineFilter);
  }, [token, timelineFilter, fetchLeaderboardList]);

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

  const podium = boardList.slice(0, 3);
  const bodyList = boardList.slice(3);

  const goToProfile = (userObj) => {
    if (!userObj) return;
    const identifier = userObj.username || userObj._id;
    navigate(`/profile/${identifier}`);
  };

  return (
    <div className="page-shell flex-1 p-4 sm:p-6 lg:p-8 space-y-6 text-app overflow-y-auto animate-fade-in">
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

        {/* Timeline toggler with RubberSegment */}
        <RubberSegment
          options={[
            { value: 'Weekly', label: 'This Week' },
            { value: 'Monthly', label: 'This Month' },
            { value: 'All-Time', label: 'All Time' }
          ]}
          value={timelineFilter}
          onChange={handleTimelineChange}
          ariaLabel="Filter leaderboard by timeframe"
        />
      </div>

      {/* Top 3 Podium Cards */}
      {podium.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto items-end">
          {/* Rank 2 - Silver Medal */}
          {podium[1] && (
            <div
              onClick={() => goToProfile(podium[1])}
              className="bg-white dark:bg-[#22242a] p-6 rounded-3xl flex flex-col items-center justify-center text-center border border-slate-200 dark:border-slate-800 relative overflow-hidden order-2 md:order-1 h-fit md:mt-8 shadow-sm cursor-pointer hover:border-slate-400 dark:hover:border-slate-600 interactive-card animate-card-enter stagger-2 transition-all"
            >
              <Medal className="w-8 h-8 text-slate-400 mb-2" />
              <Avatar className="w-16 h-16 rounded-full border border-slate-200 dark:border-slate-700">
                <AvatarImage src={podium[1].profileImage} alt={podium[1].name} />
                <AvatarFallback>{podium[1].name?.[0]}</AvatarFallback>
              </Avatar>
              <h3 className="font-extrabold text-sm text-app mt-3 font-outfit leading-none">{podium[1].name}</h3>
              <span className="text-[10px] text-muted mt-1">Rank #2 in Platform</span>
              <p className="text-sm font-bold text-slate-700 dark:text-slate-300 mt-3 font-mono flex items-center justify-center gap-1">
                <Zap size={14} className="text-indigo-500" /> {podium[1].points} pts
              </p>
            </div>
          )}

          {/* Rank 1 - Gold Medal with BorderGlow */}
          {podium[0] && (
            <div className="order-1 md:order-2">
              <BorderGlow glowColor="rgba(245, 158, 11, 0.35)" borderColor="rgba(245, 158, 11, 0.5)">
                <div
                  onClick={() => goToProfile(podium[0])}
                  className="bg-white dark:bg-[#22242a] p-8 rounded-3xl flex flex-col items-center justify-center text-center relative overflow-hidden shadow-xl shadow-amber-500/5 cursor-pointer hover:border-amber-400 interactive-card animate-card-enter stagger-1 transition-all"
                >
                  <div className="absolute top-0 right-0 w-16 h-16 bg-amber-500/10 rounded-full blur-xl" />
                  <Trophy className="w-10 h-10 text-amber-500 mb-2 drop-shadow-sm" />
                  <Avatar className="w-20 h-20 rounded-full border-2 border-amber-400 shadow-2xl">
                    <AvatarImage src={podium[0].profileImage} alt={podium[0].name} />
                    <AvatarFallback className="text-lg bg-amber-100 text-amber-700">{podium[0].name?.[0]}</AvatarFallback>
                  </Avatar>
                  <h3 className="font-extrabold text-base text-app mt-3 font-outfit leading-none">{podium[0].name}</h3>
                  <span className="text-xs text-muted mt-1.5">Grand Champion</span>
                  <p className="text-base font-extrabold text-amber-500 mt-4 font-mono flex items-center justify-center gap-1">
                    <Zap size={16} className="text-amber-500" /> {podium[0].points} pts
                  </p>
                </div>
              </BorderGlow>
            </div>
          )}

          {/* Rank 3 - Bronze Medal */}
          {podium[2] && (
            <div
              onClick={() => goToProfile(podium[2])}
              className="bg-white dark:bg-[#22242a] p-6 rounded-3xl flex flex-col items-center justify-center text-center border border-slate-200 dark:border-slate-800 relative overflow-hidden order-3 md:order-3 h-fit md:mt-12 shadow-sm cursor-pointer hover:border-slate-400 dark:hover:border-slate-600 interactive-card animate-card-enter stagger-3 transition-all"
            >
              <Medal className="w-8 h-8 text-amber-700 dark:text-amber-600 mb-2" />
              <Avatar className="w-16 h-16 rounded-full border border-slate-200 dark:border-slate-700">
                <AvatarImage src={podium[2].profileImage} alt={podium[2].name} />
                <AvatarFallback>{podium[2].name?.[0]}</AvatarFallback>
              </Avatar>
              <h3 className="font-extrabold text-sm text-app mt-3 font-outfit leading-none">{podium[2].name}</h3>
              <span className="text-[10px] text-muted mt-1">Rank #3 in Platform</span>
              <p className="text-sm font-bold text-orange-400 mt-3 font-mono flex items-center justify-center gap-1">
                <Zap size={14} className="text-orange-400" /> {podium[2].points} pts
              </p>
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
                    <Avatar className="w-9 h-9 rounded-full">
                      <AvatarImage src={userObj.profileImage} alt={userObj.name} />
                      <AvatarFallback>{userObj.name?.[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h4 className="font-bold text-xs text-app">{userObj.name}</h4>
                        {isCurrentUser && (
                          <Badge variant="default" className="text-[9px] font-black uppercase px-1.5 py-0">YOU</Badge>
                        )}
                      </div>
                      <p className="text-[10px] text-muted">{userObj.experienceLevel || 'Learner'}</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-amber-500 font-mono flex items-center gap-1">
                    <Zap size={13} className="text-amber-500" /> {userObj.points} pts
                  </span>
                </div>
              );
            })}

            {/* If current user is outside the top 15, append at the bottom */}
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
                    <Avatar className="w-9 h-9 rounded-full">
                      <AvatarImage src={currentUserRank.user?.profileImage} alt="You" />
                      <AvatarFallback>{currentUserRank.user?.name?.[0] || 'Y'}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h4 className="font-bold text-xs text-app">{currentUserRank.user?.name || 'You'}</h4>
                        <Badge variant="default" className="text-[9px] font-black uppercase px-1.5 py-0">YOU</Badge>
                      </div>
                      <p className="text-[10px] text-muted">{currentUserRank.user?.experienceLevel || 'Member'}</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-amber-500 font-mono flex items-center gap-1">
                    <Zap size={13} className="text-amber-500" /> {currentUserRank.points} pts
                  </span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Gamification Points Rules */}
      <div className="max-w-4xl mx-auto bg-white dark:bg-[#22242a] border border-slate-200 dark:border-slate-800 p-6 rounded-3xl space-y-4 shadow-sm">
        <h3 className="font-bold text-sm text-app font-outfit flex items-center gap-2">
          <Lightbulb size={16} className="text-amber-500" /> Scoreboard Mechanics
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs text-muted">
          <div className="px-4 py-6 bg-slate-50 dark:bg-slate-900/30 rounded-2xl border border-slate-200 dark:border-slate-800 text-center">
            <span className="text-lg font-bold text-indigo-500 dark:text-indigo-400">+50 / +25 Pts</span>
            <h4 className="font-bold text-app mt-1">Completed Session</h4>
            <p className="text-[10px] text-muted mt-1">Mentor earns +50 pts and Learner earns +25 pts upon verified session completion. One award per session (duplicate-protected).</p>
          </div>
          <div className="px-4 py-6 bg-slate-50 dark:bg-slate-900/30 rounded-2xl border border-slate-200 dark:border-slate-800 text-center">
            <span className="text-lg font-bold text-purple-500 dark:text-purple-400">+20 Points</span>
            <h4 className="font-bold text-app mt-1">Resource Share</h4>
            <p className="text-[10px] text-muted mt-1">Earned by sharing a file or study resource in group chat. Capped at 1 reward per user per calendar day.</p>
          </div>
          <div className="px-4 py-6 bg-slate-50 dark:bg-slate-900/30 rounded-2xl border border-slate-200 dark:border-slate-800 text-center">
            <span className="text-lg font-bold text-amber-500 dark:text-amber-400">+10 Points</span>
            <h4 className="font-bold text-app mt-1">Daily Login</h4>
            <p className="text-[10px] text-muted mt-1">Streak bonus on the first login of each calendar day. Awarded once per day (duplicate-protected by unique index).</p>
          </div>
          <div className="px-4 py-6 bg-slate-50 dark:bg-slate-900/30 rounded-2xl border border-slate-200 dark:border-slate-800 text-center">
            <span className="text-lg font-bold text-emerald-500 dark:text-emerald-400">+5 Points</span>
            <h4 className="font-bold text-app mt-1">Community Post</h4>
            <p className="text-[10px] text-muted mt-1">Earned once per post published to the daily feed. One award per post (duplicate-protected by post ID).</p>
          </div>
        </div>
        <p className="text-[10px] text-muted pt-1">Weekly / Monthly filters show points earned from activity in that period. All-Time shows cumulative stored points.</p>
      </div>
    </div>
  );
};

export default Leaderboard;
