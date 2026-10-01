import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Info, Sparkles } from 'lucide-react';

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAY_LABELS = ['', 'Mon', '', 'Wed', '', 'Fri', ''];

export const SkillActivityHeatmap = ({ user, stats, activityMap = {} }) => {
  const [selectedYear, setSelectedYear] = useState(String(new Date().getFullYear()));
  const [hoveredCell, setHoveredCell] = useState(null);
  const scrollRef = useRef(null);

  // Auto-scroll to current month (far right) on mount or year change so mobile users see recent activity first
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollLeft = scrollRef.current.scrollWidth;
    }
  }, [selectedYear]);

  // Generate 52 weeks of real activity history
  const { weeks, totalContributions, monthHeaders } = useMemo(() => {
    const today = new Date();
    const currentYear = today.getFullYear();
    const endDate = selectedYear === String(currentYear)
      ? new Date(today)
      : new Date(`${selectedYear}-12-31`);

    const days = [];
    const totalDays = 52 * 7;
    let contributionsSum = 0;

    for (let i = totalDays - 1; i >= 0; i--) {
      const d = new Date(endDate);
      d.setDate(d.getDate() - i);
      const dayOfWeek = d.getDay();
      const dateStr = d.toISOString().split('T')[0];

      const count = activityMap[dateStr] || 0;
      contributionsSum += count;
      days.push({
        date: dateStr,
        dayOfWeek,
        count,
        level: count === 0 ? 0 : count <= 1 ? 1 : count <= 3 ? 2 : count <= 6 ? 3 : 4
      });
    }

    const weeksArr = [];
    for (let w = 0; w < 52; w++) {
      weeksArr.push(days.slice(w * 7, (w + 1) * 7));
    }

    const mHeaders = [];
    let lastMonth = -1;
    for (let w = 0; w < 52; w++) {
      const firstDayOfWeek = new Date(weeksArr[w][0].date);
      const m = firstDayOfWeek.getMonth();
      if (m !== lastMonth && w < 50) {
        mHeaders.push({ label: MONTH_NAMES[m], colIndex: w });
        lastMonth = m;
      }
    }

    return { weeks: weeksArr, totalContributions: contributionsSum, monthHeaders: mHeaders };
  }, [activityMap, selectedYear]);

  const getLevelColor = (level) => {
    switch (level) {
      case 1:
        return 'bg-[#9be9a8] dark:bg-[#0e4429] border-[#9be9a8] dark:border-[#0e4429]';
      case 2:
        return 'bg-[#40c463] dark:bg-[#006d32] border-[#40c463] dark:border-[#006d32]';
      case 3:
        return 'bg-[#30a14e] dark:bg-[#26a641] border-[#30a14e] dark:border-[#26a641]';
      case 4:
        return 'bg-[#216e39] dark:bg-[#39d353] border-[#216e39] dark:border-[#39d353]';
      default:
        return 'bg-slate-100 dark:bg-[#161b22] border-slate-200/70 dark:border-slate-800/50';
    }
  };

  return (
    <div className="w-full h-full flex flex-col justify-between py-1 space-y-3">
      {/* Top Controls Bar */}
      <div className="flex flex-row justify-between items-center gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="text-xs font-medium text-slate-600 dark:text-slate-300 truncate">
            <span className="font-extrabold text-app">{totalContributions}</span> contributions in {selectedYear}
          </span>
        </div>

        {/* Year Selector Pill Tabs */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-[#161b22] p-1 rounded-xl border border-slate-200/80 dark:border-slate-800 shrink-0">
          {['2026', '2025', '2024'].map((yr) => (
            <button
              key={yr}
              type="button"
              onClick={() => setSelectedYear(yr)}
              className={`px-2 py-0.5 sm:px-2.5 sm:py-1 text-xs font-semibold rounded-lg transition-all ${
                selectedYear === yr
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-500 hover:text-app'
              }`}
            >
              {yr}
            </button>
          ))}
        </div>
      </div>

      {/* Heatmap Grid Wrapper with Auto-Scroll */}
      <div
        ref={scrollRef}
        className="w-full overflow-x-auto scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800 py-2 scroll-smooth"
      >
        <div className="w-[660px] min-w-[660px] select-none pb-1">
          {/* Month headers */}
          <div className="flex text-[10px] text-slate-400 dark:text-slate-500 font-medium mb-1.5 pl-7 relative h-4">
            {monthHeaders.map((m, idx) => (
              <span
                key={idx}
                className="absolute"
                style={{ left: `${(m.colIndex / 52) * 100}%` }}
              >
                {m.label}
              </span>
            ))}
          </div>

          {/* Days Grid */}
          <div className="flex gap-2 items-start w-full">
            <div className="flex flex-col gap-[3px] text-[9px] text-slate-400 dark:text-slate-500 font-medium pr-1 pt-[1px] w-6 shrink-0 text-right leading-none">
              {DAY_LABELS.map((lbl, idx) => (
                <div key={idx} className="h-3 flex items-center justify-end">
                  {lbl}
                </div>
              ))}
            </div>

            <div className="flex gap-[3px] justify-between w-full flex-1">
              {weeks.map((week, wIdx) => (
                <div key={wIdx} className="flex flex-col gap-[3px] flex-1 items-center">
                  {week.map((day, dIdx) => (
                    <div
                      key={dIdx}
                      onMouseEnter={() => setHoveredCell(day)}
                      onMouseLeave={() => setHoveredCell(null)}
                      onClick={() => setHoveredCell(hoveredCell?.date === day.date ? null : day)}
                      onTouchStart={() => setHoveredCell(day)}
                      className={`w-3 h-3 min-w-[12px] min-h-[12px] rounded-[2.5px] border transition-all duration-150 cursor-pointer ${getLevelColor(day.level)} ${
                        hoveredCell?.date === day.date ? 'ring-2 ring-indigo-500 scale-125 z-20 shadow-sm' : ''
                      }`}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Footer Info Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-2 text-xs border-t border-slate-100 dark:border-slate-800/80">
        <div className="flex items-center gap-1.5 text-[11px] text-slate-400 hover:text-indigo-500 cursor-pointer transition-colors" title="Contributions include completed mentorship sessions & learning posts">
          <Info size={12} />
          <span>How contributions work</span>
        </div>

        <div className="h-6 flex items-center justify-center text-center">
          {hoveredCell ? (
            <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300 font-medium animate-fade-in">
              <span className="font-bold text-indigo-600 dark:text-indigo-400">
                {hoveredCell.count} contribution{hoveredCell.count === 1 ? '' : 's'}
              </span>
              <span className="text-slate-400 font-normal">on</span>
              <span className="font-semibold text-app">
                {new Date(hoveredCell.date).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
            </div>
          ) : (
            <span className="text-[11px] text-slate-400 dark:text-slate-500 italic flex items-center gap-1">
              <Sparkles size={11} className="text-indigo-400" /> Tap or hover a square to view daily activity
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
          <span>Less</span>
          <div className="flex items-center gap-[3px]">
            <span className="w-2.5 h-2.5 rounded-[2px] bg-slate-100 dark:bg-[#161b22] border border-slate-200 dark:border-slate-800" />
            <span className="w-2.5 h-2.5 rounded-[2px] bg-[#9be9a8] dark:bg-[#0e4429]" />
            <span className="w-2.5 h-2.5 rounded-[2px] bg-[#40c463] dark:bg-[#006d32]" />
            <span className="w-2.5 h-2.5 rounded-[2px] bg-[#30a14e] dark:bg-[#26a641]" />
            <span className="w-2.5 h-2.5 rounded-[2px] bg-[#216e39] dark:bg-[#39d353]" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default SkillActivityHeatmap;
