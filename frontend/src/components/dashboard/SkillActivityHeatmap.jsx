import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { Info, Sparkles } from 'lucide-react';
import SlidingSegment from '../common/SlidingSegment.jsx';

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const DEFAULT_APP_TIMEZONE = 'Asia/Kolkata';

/**
 * Returns formatted calendar date 'YYYY-MM-DD' in the given timezone.
 */
export const getDateKeyInTimezone = (date = new Date(), timeZone = DEFAULT_APP_TIMEZONE) => {
  if (!date) return '';
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return '';
  const tz = timeZone || DEFAULT_APP_TIMEZONE;
  try {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).formatToParts(d);
    const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
    return `${values.year}-${values.month}-${values.day}`;
  } catch {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: DEFAULT_APP_TIMEZONE,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).formatToParts(d);
    const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
    return `${values.year}-${values.month}-${values.day}`;
  }
};

/**
 * Returns 4-digit calendar year in the given timezone.
 */
export const getYearInTimezone = (date = new Date(), timeZone = DEFAULT_APP_TIMEZONE) => {
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return new Date().getUTCFullYear();
  const tz = timeZone || DEFAULT_APP_TIMEZONE;
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      year: 'numeric'
    });
    return parseInt(formatter.format(d), 10);
  } catch {
    return d.getUTCFullYear();
  }
};

/**
 * Returns human-friendly timezone abbreviation/label.
 */
export const getTimezoneLabel = (timeZone = DEFAULT_APP_TIMEZONE) => {
  const tz = timeZone || DEFAULT_APP_TIMEZONE;
  if (tz === 'Asia/Kolkata' || tz === 'Asia/Calcutta') return 'IST';
  if (tz === 'UTC' || tz === 'Etc/UTC') return 'UTC';
  try {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      timeZoneName: 'short'
    }).formatToParts(new Date());
    const tzPart = parts.find((p) => p.type === 'timeZoneName');
    return tzPart ? tzPart.value : tz;
  } catch {
    return tz;
  }
};

export const SkillActivityHeatmap = ({
  user: _user,
  stats: _stats,
  activityMap = {},
  timeZone: propTimeZone
}) => {
  const effectiveTimeZone = propTimeZone || _user?.timezone || DEFAULT_APP_TIMEZONE;
  const timeZoneLabel = useMemo(() => getTimezoneLabel(effectiveTimeZone), [effectiveTimeZone]);

  const currentCalendarYear = useMemo(
    () => getYearInTimezone(new Date(), effectiveTimeZone),
    [effectiveTimeZone]
  );

  const [selectedYear, setSelectedYear] = useState('rolling');
  const [activeCell, setActiveCell] = useState(null);
  const scrollRef = useRef(null);
  const containerRef = useRef(null);

  // Dismiss active hover/selection on Escape key
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape') {
      setActiveCell(null);
    }
  }, []);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Options: Rolling 1 Year (GitHub default) + specific past calendar years
  const yearOptions = useMemo(
    () => [
      { id: 'rolling', label: '1 Year' },
      { id: String(currentCalendarYear), label: String(currentCalendarYear) },
      { id: String(currentCalendarYear - 1), label: String(currentCalendarYear - 1) },
      { id: String(currentCalendarYear - 2), label: String(currentCalendarYear - 2) }
    ],
    [currentCalendarYear]
  );

  // GitHub-style rolling window or calendar-year builder
  const { weeks, totalContributions, monthHeaders, todayColIndex } = useMemo(() => {
    const isRolling = selectedYear === 'rolling';
    const todayKey = getDateKeyInTimezone(new Date(), effectiveTimeZone);
    const todayDate = new Date(todayKey + 'T00:00:00Z');

    let cursor;
    let lastDate;
    const targetYear = isRolling ? currentCalendarYear : parseInt(selectedYear, 10);

    if (isRolling) {
      // Rolling 53-week window: rightmost column contains today's week ending Saturday
      const endDay = todayDate.getUTCDay(); // 0 is Sunday, 6 is Saturday
      lastDate = new Date(todayDate.getTime() + (6 - endDay) * 86400000);
      cursor = new Date(lastDate.getTime() - (53 * 7 - 1) * 86400000);
    } else {
      // Historical calendar year: Jan 1 to Dec 31
      const jan1 = new Date(Date.UTC(targetYear, 0, 1));
      const dec31 = new Date(Date.UTC(targetYear, 11, 31));
      const startDay = jan1.getUTCDay();
      cursor = new Date(jan1.getTime() - startDay * 86400000);
      const endDay = dec31.getUTCDay();
      lastDate = new Date(dec31.getTime() + (6 - endDay) * 86400000);
    }

    const weeksArr = [];
    let currentWeek = [];
    let contributionsSum = 0;
    const mHeaders = [];
    let lastMonth = -1;
    let colIdx = 0;
    let activeTodayCol = -1;

    while (cursor <= lastDate) {
      const dateStr = cursor.toISOString().slice(0, 10);
      const dayOfWeek = cursor.getUTCDay();
      const dayYear = cursor.getUTCFullYear();
      const isCurrentYear = isRolling ? true : dayYear === targetYear;
      const isToday = dateStr === todayKey;
      const isFuture = dateStr > todayKey;

      const count = (!isFuture && isCurrentYear) ? (activityMap[dateStr] || 0) : 0;
      if (!isFuture && isCurrentYear) {
        contributionsSum += count;
      }

      if (isToday) {
        activeTodayCol = colIdx;
      }

      currentWeek.push({
        date: dateStr,
        dayOfWeek,
        count,
        isCurrentYear,
        isToday,
        isFuture,
        level: count === 0 ? 0 : count <= 1 ? 1 : count <= 3 ? 2 : count <= 6 ? 3 : 4
      });

      if (currentWeek.length === 7) {
        weeksArr.push(currentWeek);

        // Record month label for the first week containing that month's start
        for (const d of currentWeek) {
          if (d.isCurrentYear) {
            const m = parseInt(d.date.slice(5, 7), 10) - 1;
            if (m !== lastMonth) {
              mHeaders.push({ label: MONTH_NAMES[m], colIndex: colIdx });
              lastMonth = m;
              break;
            }
          }
        }

        currentWeek = [];
        colIdx++;
      }

      cursor.setUTCDate(cursor.getUTCDate() + 1);
    }

    return {
      weeks: weeksArr,
      totalContributions: contributionsSum,
      monthHeaders: mHeaders,
      todayColIndex: activeTodayCol
    };
  }, [activityMap, selectedYear, effectiveTimeZone, currentCalendarYear]);

  // Auto-scroll to ensure latest/today column is immediately in view on load
  useEffect(() => {
    if (scrollRef.current) {
      requestAnimationFrame(() => {
        if (!scrollRef.current) return;
        if (selectedYear === 'rolling' || selectedYear === String(currentCalendarYear)) {
          scrollRef.current.scrollLeft = scrollRef.current.scrollWidth;
        } else {
          scrollRef.current.scrollLeft = 0;
        }
      });
    }
  }, [selectedYear, todayColIndex, weeks.length, currentCalendarYear]);

  const getLevelColor = (day) => {
    if (!day.isCurrentYear) {
      return 'bg-transparent border-transparent opacity-0 pointer-events-none';
    }
    if (day.isFuture) {
      return 'bg-slate-50/50 dark:bg-[#161b22]/30 border-slate-200/30 dark:border-slate-800/20 opacity-40 cursor-default';
    }
    switch (day.level) {
      case 1:
        return 'bg-[#9be9a8] dark:bg-[#196127] border-[#7bc96f] dark:border-[#238636]';
      case 2:
        return 'bg-[#40c463] dark:bg-[#238636] border-[#30a14e] dark:border-[#2ea043]';
      case 3:
        return 'bg-[#30a14e] dark:bg-[#2ea043] border-[#216e39] dark:border-[#3fb950]';
      case 4:
        return 'bg-[#216e39] dark:bg-[#3fb950] border-[#1b5a2e] dark:border-[#56d364]';
      default:
        return 'bg-slate-100 dark:bg-[#161b22] border-slate-200/70 dark:border-slate-800/50';
    }
  };

  const formatTooltipDate = (dateStr) => {
    if (!dateStr) return '';
    const [y, m, d] = dateStr.split('-').map(Number);
    const dt = new Date(Date.UTC(y, m - 1, d));
    return dt.toLocaleDateString('en-US', {
      timeZone: 'UTC',
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const handleYearChange = (yr) => {
    setActiveCell(null);
    setSelectedYear(yr);
  };

  return (
    <div
      ref={containerRef}
      className="w-full h-full flex flex-col justify-between py-1 space-y-3"
      onMouseLeave={() => setActiveCell(null)}
    >
      {/* Top Controls Bar */}
      <div className="flex flex-row justify-between items-center gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-xs font-medium text-slate-600 dark:text-slate-300 truncate">
            <span className="font-extrabold text-app">{totalContributions}</span> contributions {selectedYear === 'rolling' ? 'in the last year' : `in ${selectedYear}`}
          </span>
          <span
            className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-200/80 dark:border-slate-700/60"
            title={`Timezone: ${effectiveTimeZone}`}
          >
            {timeZoneLabel}
          </span>
        </div>

        {/* Year Selector Pill Tabs */}
        <SlidingSegment
          ariaLabel="Heatmap year"
          value={selectedYear}
          onChange={handleYearChange}
          options={yearOptions.map((opt) => ({
            value: typeof opt === 'string' ? opt : opt.id,
            label: typeof opt === 'string' ? opt : opt.label
          }))}
          className="shrink-0 rounded-xl border border-slate-200/80 bg-slate-100 dark:border-slate-800 dark:bg-[#161b22]"
          buttonClassName="px-2 py-0.5 text-xs sm:px-2.5 sm:py-1"
        />
      </div>

      {/* Heatmap Grid Wrapper with Auto-Scroll */}
      <div
        ref={scrollRef}
        className="w-full overflow-x-auto scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800 py-2 scroll-smooth"
      >
        <div
          className="inline-block min-w-max select-none pb-1"
          role="grid"
          aria-label={`Contribution heatmap for ${selectedYear}`}
        >
          {/* Month headers track: strictly synchronized with week columns using shared grid tracks */}
          <div
            className="flex items-center text-[10px] text-slate-400 dark:text-slate-500 font-medium mb-1.5 h-4 select-none"
            style={{ paddingLeft: '32px' }}
          >
            <div
              className="relative w-full h-full"
              style={{
                display: 'grid',
                gridTemplateColumns: `repeat(${weeks.length}, 12px)`,
                columnGap: '3px'
              }}
            >
              {monthHeaders.map((m, idx) => (
                <span
                  key={idx}
                  className="text-[10px] whitespace-nowrap leading-none select-none"
                  data-month-label={m.label}
                  data-col-index={m.colIndex}
                  style={{
                    gridColumnStart: m.colIndex + 1
                  }}
                >
                  {m.label}
                </span>
              ))}
            </div>
          </div>

          {/* Days Grid */}
          <div className="flex gap-2 items-start">
            {/* Weekday indicator labels (24px wide + 8px gap = 32px gutter) */}
            <div className="flex flex-col gap-[3px] text-[9px] text-slate-400 dark:text-slate-500 font-medium pr-1 pt-[1px] w-6 shrink-0 text-right leading-none select-none">
              {DAY_LABELS.map((lbl, idx) => (
                <div key={idx} className="h-3 flex items-center justify-end">
                  {idx % 2 === 1 ? lbl : ''}
                </div>
              ))}
            </div>

            {/* Weeks Columns: Shared exact grid tracks */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: `repeat(${weeks.length}, 12px)`,
                columnGap: '3px'
              }}
            >
              {weeks.map((week, wIdx) => (
                <div
                  key={wIdx}
                  className="flex flex-col gap-[3px] items-center"
                  role="row"
                  data-col-index={wIdx}
                  style={{
                    gridColumnStart: wIdx + 1,
                    width: '12px'
                  }}
                >
                  {week.map((day, dIdx) => (
                    <div
                      key={dIdx}
                      role="gridcell"
                      tabIndex={day.isCurrentYear && !day.isFuture ? 0 : -1}
                      data-date={day.date}
                      data-today={day.isToday ? 'true' : undefined}
                      data-count={day.count}
                      aria-current={day.isToday ? 'date' : undefined}
                      aria-label={
                        day.isCurrentYear
                          ? `${day.count} contribution${day.count === 1 ? '' : 's'} on ${day.date}${day.isToday ? ' (Today)' : ''}`
                          : undefined
                      }
                      onMouseEnter={() => day.isCurrentYear && !day.isFuture && setActiveCell(day)}
                      onMouseLeave={() => setActiveCell(null)}
                      onFocus={() => day.isCurrentYear && !day.isFuture && setActiveCell(day)}
                      onBlur={() => setActiveCell(null)}
                      onClick={() => {
                        if (!day.isCurrentYear || day.isFuture) return;
                        setActiveCell(activeCell?.date === day.date ? null : day);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          if (day.isCurrentYear && !day.isFuture) {
                            setActiveCell(activeCell?.date === day.date ? null : day);
                          }
                        } else if (e.key === 'Escape') {
                          setActiveCell(null);
                        }
                      }}
                      className={`w-3 h-3 min-w-[12px] min-h-[12px] rounded-[2.5px] border transition-transform duration-150 cursor-pointer outline-hidden hover:scale-110 focus-visible:outline focus-visible:outline-1 focus-visible:outline-slate-500 focus-visible:outline-offset-1 motion-reduce:transform-none ${getLevelColor(day)}`}
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
        <div
          className="flex items-center gap-1.5 text-[11px] text-slate-400 hover:text-indigo-500 cursor-pointer transition-colors"
          title={`Contributions include logins, exchanges & posts in ${effectiveTimeZone}`}
        >
          <Info size={12} />
          <span>Contributions in {timeZoneLabel} ({effectiveTimeZone})</span>
        </div>

        <div className="h-6 flex items-center justify-center text-center">
          {activeCell ? (
            <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300 font-medium animate-fade-in">
              <span className="font-bold text-indigo-600 dark:text-indigo-400">
                {activeCell.count} contribution{activeCell.count === 1 ? '' : 's'}
              </span>
              <span className="text-slate-400 font-normal">on</span>
              <span className="font-semibold text-app">
                {formatTooltipDate(activeCell.date)}
              </span>
              <span className="text-[10px] text-slate-400 font-medium">({timeZoneLabel})</span>
              {activeCell.isToday && (
                <span className="px-1.5 py-0.2 rounded-md bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 text-[10px] font-bold">
                  Today
                </span>
              )}
            </div>
          ) : (
            <span className="text-[11px] text-slate-400 dark:text-slate-500 italic flex items-center gap-1">
              <Sparkles size={11} className="text-indigo-400" /> Tap or hover a square to view daily activity ({timeZoneLabel})
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
          <span>Less</span>
          <div className="flex items-center gap-[3px]">
            <span className="w-2.5 h-2.5 rounded-[2px] bg-slate-100 dark:bg-[#161b22] border border-slate-200 dark:border-slate-800" />
            <span className="w-2.5 h-2.5 rounded-[2px] bg-[#9be9a8] dark:bg-[#196127]" />
            <span className="w-2.5 h-2.5 rounded-[2px] bg-[#40c463] dark:bg-[#238636]" />
            <span className="w-2.5 h-2.5 rounded-[2px] bg-[#30a14e] dark:bg-[#2ea043]" />
            <span className="w-2.5 h-2.5 rounded-[2px] bg-[#216e39] dark:bg-[#3fb950]" />
          </div>
          <span>More</span>
        </div>
      </div>
    </div>
  );
};

export default SkillActivityHeatmap;
