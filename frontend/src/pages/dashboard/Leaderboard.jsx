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

  const fetchLeaderboardList = useCallback(
    async (timeline) => {
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
    },
    [timelineFilter]
  );

  useEffect(() => {
    fetchLeaderboardList(timelineFilter);
  }, [token, timelineFilter, fetchLeaderboardList]);

  const handleTimelineChange = (timeline) => {
    setTimelineFilter(timeline);
    fetchLeaderboardList(timeline);
  };

  if (loading && boardList.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <div className="w-8 h-8 border-3 border-indigo-600/30 border-t-indigo-600 rounded-full animate-spin" />
        <span className="text-xs text-slate-400">Syncing scoreboard rankings...</span>
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
    <div className="space-y-6 max-w-7xl mx-auto min-w-0">
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="orb-page-title">Leaderboards</h1>
          <p className="orb-page-subtitle">
            Exchange knowledge, earn points, and climb the platform rankings.
          </p>
        </div>

        {/* Timeline Filter */}
        <RubberSegment
          options={[
            { value: 'Weekly', label: 'This Week' },
            { value: 'Monthly', label: 'This Month' },
            { value: 'All-Time', label: 'All Time' }
          ]}
          value={timelineFilter}
          onChange={handleTimelineChange}
          ariaLabel="Filter leaderboard timeframe"
          className="rounded-full bg-slate-100 dark:bg-slate-800/80 p-1"
          buttonClassName="px-4 py-1.5 text-xs font-semibold"
          indicatorClassName="bg-indigo-600 shadow-sm"
        />
      </div>

      {/* ── Top 3 Podium Cards ── */}
      {podium.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-4xl mx-auto items-end pt-4">
          {/* Rank 2 - Silver Medal */}
          {podium[1] && (
            <div
              onClick={() => goToProfile(podium[1])}
              className="orb-card p-6 flex flex-col items-center text-center cursor-pointer order-2 md:order-1 transition-transform hover:-translate-y-1"
            >
              <Medal className="w-7 h-7 text-slate-400 mb-2" />
              <Avatar className="w-16 h-16 rounded-full border border-slate-200 dark:border-slate-700">
                <AvatarImage src={podium[1].profileImage} alt={podium[1].name} />
                <AvatarFallback>{podium[1].name?.[0]}</AvatarFallback>
              </Avatar>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white mt-3 truncate w-full">
                {podium[1].name}
              </h3>
              <span className="text-[11px] text-slate-400 mt-0.5">Rank #2</span>
              <p className="text-sm font-bold text-slate-700 dark:text-slate-300 mt-3 font-mono flex items-center justify-center gap-1">
                <Zap size={14} className="text-indigo-500" /> {podium[1].points} pts
              </p>
            </div>
          )}

          {/* Rank 1 - Gold Medal */}
          {podium[0] && (
            <div className="order-1 md:order-2">
              <BorderGlow glowColor="rgba(245, 158, 11, 0.35)" borderColor="rgba(245, 158, 11, 0.5)">
                <div
                  onClick={() => goToProfile(podium[0])}
                  className="orb-card p-8 flex flex-col items-center text-center cursor-pointer relative shadow-lg shadow-amber-500/5 transition-transform hover:-translate-y-1"
                >
                  <Trophy className="w-9 h-9 text-amber-500 mb-2 drop-shadow-xs" />
                  <Avatar className="w-20 h-20 rounded-full border-2 border-amber-400 shadow-md">
                    <AvatarImage src={podium[0].profileImage} alt={podium[0].name} />
                    <AvatarFallback className="text-lg bg-amber-100 text-amber-700">
                      {podium[0].name?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <h3 className="font-extrabold text-base text-slate-900 dark:text-white mt-3 truncate w-full">
                    {podium[0].name}
                  </h3>
                  <span className="text-xs font-semibold text-amber-600 dark:text-amber-400 mt-0.5">
                    Grand Champion
                  </span>
                  <p className="text-base font-extrabold text-amber-500 mt-3 font-mono flex items-center justify-center gap-1">
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
              className="orb-card p-6 flex flex-col items-center text-center cursor-pointer order-3 md:order-3 transition-transform hover:-translate-y-1"
            >
              <Medal className="w-7 h-7 text-amber-700 dark:text-amber-600 mb-2" />
              <Avatar className="w-16 h-16 rounded-full border border-slate-200 dark:border-slate-700">
                <AvatarImage src={podium[2].profileImage} alt={podium[2].name} />
                <AvatarFallback>{podium[2].name?.[0]}</AvatarFallback>
              </Avatar>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white mt-3 truncate w-full">
                {podium[2].name}
              </h3>
              <span className="text-[11px] text-slate-400 mt-0.5">Rank #3</span>
              <p className="text-sm font-bold text-orange-500 mt-3 font-mono flex items-center justify-center gap-1">
                <Zap size={14} className="text-orange-500" /> {podium[2].points} pts
              </p>
            </div>
          )}
        </div>
      )}

      {/* ── Main Ranking List ── */}
      <div className="max-w-4xl mx-auto orb-card p-6 space-y-4">
        <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
          <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
            <Award size={16} className="text-indigo-500" />
            <span>Platform Ranks (4 – 15)</span>
          </h3>
          <span className="text-xs text-slate-400">{boardList.length} Ranked Members</span>
        </div>

        {bodyList.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-6">Exceed 3 members to list rankings.</p>
        ) : (
          <div className="space-y-2">
            {bodyList.slice(0, 12).map((userObj, idx) => {
              const currentRank = idx + 4;
              const isCurrentUser = authUser?._id && userObj._id.toString() === authUser._id.toString();

              return (
                <div
                  key={userObj._id}
                  onClick={() => goToProfile(userObj)}
                  className={`p-3 rounded-xl flex items-center justify-between cursor-pointer transition-colors ${
                    isCurrentUser
                      ? 'bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-300 dark:border-indigo-800'
                      : 'bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60 hover:bg-slate-100 dark:hover:bg-slate-800/80'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold text-xs text-slate-400 w-6 text-center">
                      #{currentRank}
                    </span>
                    <Avatar className="w-8 h-8 rounded-full border border-slate-200 dark:border-slate-700">
                      <AvatarImage src={userObj.profileImage} alt={userObj.name} />
                      <AvatarFallback>{userObj.name?.[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h4 className="font-bold text-xs text-slate-900 dark:text-white">{userObj.name}</h4>
                        {isCurrentUser && (
                          <Badge variant="default" className="text-[9px] font-black uppercase px-1.5 py-0">
                            YOU
                          </Badge>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-400">{userObj.experienceLevel || 'Learner'}</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-amber-500 font-mono flex items-center gap-1">
                    <Zap size={13} /> {userObj.points} pts
                  </span>
                </div>
              );
            })}

            {/* If current user is outside the top 15, append at the bottom */}
            {currentUserRank && !currentUserRank.isInTopList && (
              <div className="mt-3 pt-3 border-t border-dashed border-slate-200 dark:border-slate-800">
                <div
                  onClick={() => goToProfile(currentUserRank.user)}
                  className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-400 flex items-center justify-between cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold text-xs text-indigo-600 dark:text-indigo-400 w-6 text-center">
                      #{currentUserRank.rank}
                    </span>
                    <Avatar className="w-8 h-8 rounded-full">
                      <AvatarImage src={currentUserRank.user?.profileImage} alt="You" />
                      <AvatarFallback>{currentUserRank.user?.name?.[0] || 'Y'}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h4 className="font-bold text-xs text-slate-900 dark:text-white">
                          {currentUserRank.user?.name || 'You'}
                        </h4>
                        <Badge variant="default" className="text-[9px] font-black uppercase px-1.5 py-0">
                          YOU
                        </Badge>
                      </div>
                      <p className="text-[10px] text-slate-400">
                        {currentUserRank.user?.experienceLevel || 'Member'}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-amber-500 font-mono flex items-center gap-1">
                    <Zap size={13} /> {currentUserRank.points} pts
                  </span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Gamification Points Rules ── */}
      <div className="max-w-4xl mx-auto orb-card p-6 space-y-4">
        <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
          <Lightbulb size={16} className="text-amber-500" /> Scoreboard Mechanics
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs text-slate-500">
          <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200/70 dark:border-slate-700/70 text-center">
            <span className="text-base font-bold text-indigo-600 dark:text-indigo-400 block">+50 / +25 Pts</span>
            <h4 className="font-bold text-slate-900 dark:text-white mt-1">Session Complete</h4>
            <p className="text-[10px] text-slate-400 mt-1">Mentor gets +50, learner gets +25 points upon verified session completion.</p>
          </div>
          <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200/70 dark:border-slate-700/70 text-center">
            <span className="text-base font-bold text-purple-600 dark:text-purple-400 block">+20 Points</span>
            <h4 className="font-bold text-slate-900 dark:text-white mt-1">Resource Share</h4>
            <p className="text-[10px] text-slate-400 mt-1">Share files or resources in study groups (1 reward per day).</p>
          </div>
          <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200/70 dark:border-slate-700/70 text-center">
            <span className="text-base font-bold text-amber-600 dark:text-amber-400 block">+10 Points</span>
            <h4 className="font-bold text-slate-900 dark:text-white mt-1">Daily Login</h4>
            <p className="text-[10px] text-slate-400 mt-1">Daily streak bonus upon your first visit of the day.</p>
          </div>
          <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200/70 dark:border-slate-700/70 text-center">
            <span className="text-base font-bold text-emerald-600 dark:text-emerald-400 block">+5 Points</span>
            <h4 className="font-bold text-slate-900 dark:text-white mt-1">Community Post</h4>
            <p className="text-[10px] text-slate-400 mt-1">Awarded for sharing updates or questions in the community showcase.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;
