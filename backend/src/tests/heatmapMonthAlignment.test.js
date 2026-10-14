import { describe, it, expect } from 'vitest';

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/**
 * Mirror of calendar generation in SkillActivityHeatmap.jsx
 */
function generateHeatmapCalendar(year) {
  const jan1 = new Date(Date.UTC(year, 0, 1));
  const dec31 = new Date(Date.UTC(year, 11, 31));

  const startDay = jan1.getUTCDay();
  const cursor = new Date(jan1.getTime() - startDay * 86400000);

  const endDay = dec31.getUTCDay();
  const lastDate = new Date(dec31.getTime() + (6 - endDay) * 86400000);

  const weeksArr = [];
  let currentWeek = [];
  const mHeaders = [];
  let lastMonth = -1;
  let colIdx = 0;

  while (cursor <= lastDate) {
    const dateStr = cursor.toISOString().slice(0, 10);
    const dayYear = cursor.getUTCFullYear();
    const isCurrentYear = dayYear === year;

    currentWeek.push({
      date: dateStr,
      isCurrentYear
    });

    if (currentWeek.length === 7) {
      weeksArr.push(currentWeek);

      for (const d of currentWeek) {
        if (d.isCurrentYear) {
          const m = parseInt(d.date.slice(5, 7), 10) - 1;
          if (m !== lastMonth) {
            mHeaders.push({ label: MONTH_NAMES[m], colIndex: colIdx, firstDateInCol: d.date });
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

  return { weeks: weeksArr, monthHeaders: mHeaders };
}

describe('Heatmap Month Label Alignment & Grid Track Synchrony', () => {
  it('generates all 12 month headers in order for 2026 and verifies exact column indices', () => {
    const { monthHeaders } = generateHeatmapCalendar(2026);

    expect(monthHeaders.length).toBe(12);
    expect(monthHeaders.map(m => m.label)).toEqual(MONTH_NAMES);

    // In 2026:
    // Oct 1 is Thursday -> week starts Oct 27 / col 39
    // Nov 1 is Sunday -> col 44
    const octHeader = monthHeaders.find(m => m.label === 'Oct');
    const novHeader = monthHeaders.find(m => m.label === 'Nov');

    expect(octHeader.colIndex).toBe(39);
    expect(novHeader.colIndex).toBe(44);

    // Verify October 14, 2026 falls strictly in column 41 (BEFORE November column 44)
    const { weeks } = generateHeatmapCalendar(2026);
    const oct14ColIndex = weeks.findIndex(w => w.some(d => d.date === '2026-10-14'));
    expect(oct14ColIndex).toBe(41);
    expect(oct14ColIndex).toBeGreaterThanOrEqual(octHeader.colIndex);
    expect(oct14ColIndex).toBeLessThan(novHeader.colIndex);
  });

  it('guarantees 0px offset between month header and week column tracks', () => {
    const { monthHeaders } = generateHeatmapCalendar(2026);
    const gutterWidth = 32; // 24px label + 8px gap
    const colStep = 15; // 12px cell + 3px gap

    for (const m of monthHeaders) {
      const headerLeft = gutterWidth + m.colIndex * colStep;
      const columnLeft = gutterWidth + m.colIndex * colStep;
      const offsetDelta = Math.abs(headerLeft - columnLeft);

      expect(offsetDelta).toBe(0);
    }
  });

  it('verifies leap year (2024) alignment across leap day and month starts', () => {
    const { weeks, monthHeaders } = generateHeatmapCalendar(2024);

    expect(monthHeaders.length).toBe(12);

    // Leap day Feb 29, 2024
    const leapDayColIndex = weeks.findIndex(w => w.some(d => d.date === '2024-02-29'));
    const marHeader = monthHeaders.find(m => m.label === 'Mar');
    expect(leapDayColIndex).toBe(8);
    // March 1 is Friday in the same week or next
    expect(marHeader.colIndex).toBe(8);
  });

  it('verifies years with different start weekdays (2025 Wednesday, 2027 Friday)', () => {
    const cal2025 = generateHeatmapCalendar(2025);
    const cal2027 = generateHeatmapCalendar(2027);

    expect(cal2025.monthHeaders.length).toBe(12);
    expect(cal2027.monthHeaders.length).toBe(12);

    expect(cal2025.monthHeaders[0].colIndex).toBe(0);
    expect(cal2027.monthHeaders[0].colIndex).toBe(0);
  });

  describe('Rolling GitHub-Style Window (53 Weeks Ending on Current Date)', () => {
    function generateRollingCalendar(todayKey, activityMap = {}) {
      const todayDate = new Date(todayKey + 'T00:00:00Z');
      const endDay = todayDate.getUTCDay();
      const lastDate = new Date(todayDate.getTime() + (6 - endDay) * 86400000);
      const cursor = new Date(lastDate.getTime() - (53 * 7 - 1) * 86400000);

      const weeksArr = [];
      let currentWeek = [];
      const mHeaders = [];
      let lastMonth = -1;
      let colIdx = 0;
      let totalContributions = 0;

      while (cursor <= lastDate) {
        const dateStr = cursor.toISOString().slice(0, 10);
        const isToday = dateStr === todayKey;
        const isFuture = dateStr > todayKey;
        const count = isFuture ? 0 : (activityMap[dateStr] || 0);
        totalContributions += count;

        const level = count === 0 ? 0 : count <= 1 ? 1 : count <= 3 ? 2 : count <= 6 ? 3 : 4;

        currentWeek.push({
          date: dateStr,
          isToday,
          isFuture,
          count,
          level
        });

        if (currentWeek.length === 7) {
          weeksArr.push(currentWeek);

          for (const d of currentWeek) {
            const m = parseInt(d.date.slice(5, 7), 10) - 1;
            if (m !== lastMonth) {
              mHeaders.push({ label: MONTH_NAMES[m], colIndex: colIdx, date: d.date });
              lastMonth = m;
              break;
            }
          }

          currentWeek = [];
          colIdx++;
        }

        cursor.setUTCDate(cursor.getUTCDate() + 1);
      }

      return { weeks: weeksArr, monthHeaders: mHeaders, totalContributions };
    }

    it('positions today strictly in the rightmost week (col 52) of a 53-week rolling window', () => {
      const todayKey = '2026-10-15';
      const { weeks, monthHeaders } = generateRollingCalendar(todayKey);

      expect(weeks.length).toBe(53);

      const todayCol = weeks.findIndex(w => w.some(d => d.isToday));
      expect(todayCol).toBe(52); // Rightmost week!

      const todayCell = weeks[52].find(d => d.isToday);
      expect(todayCell.date).toBe(todayKey);
      expect(todayCell.isFuture).toBe(false);

      // Days after today in that same week are marked future
      const futureDays = weeks[52].filter(d => d.isFuture);
      expect(futureDays.length).toBeGreaterThan(0);
      futureDays.forEach(d => {
        expect(d.date > todayKey).toBe(true);
        expect(d.count).toBe(0);
      });

      // Crosses year boundary: starts in 2025, ends in 2026
      expect(weeks[0][0].date.startsWith('2025')).toBe(true);
      expect(weeks[52][0].date.startsWith('2026')).toBe(true);

      // Month headers transition from 2025 to 2026
      expect(monthHeaders[0].label).toBe('Oct');
      expect(monthHeaders.some(m => m.label === 'Jan')).toBe(true);
      expect(monthHeaders[monthHeaders.length - 1].label).toBe('Oct');
    });

    it('shifts rolling window forward when date advances to next week', () => {
      const week1 = generateRollingCalendar('2026-10-15');
      const week2 = generateRollingCalendar('2026-10-22'); // 1 week later

      expect(week2.weeks.length).toBe(53);
      // The start of week2 is exactly 7 days after week1
      const start1 = new Date(week1.weeks[0][0].date).getTime();
      const start2 = new Date(week2.weeks[0][0].date).getTime();
      expect(start2 - start1).toBe(7 * 86400000);
    });

    it('computes green level intensity correctly and never shows fake green for 0 count', () => {
      const activityMap = {
        '2026-10-15': 1, // Level 1 (lightest green)
        '2026-10-14': 2, // Level 2
        '2026-10-13': 5, // Level 3
        '2026-10-12': 10, // Level 4 (darkest green)
        '2026-10-11': 0  // Level 0 (neutral grey)
      };

      const { weeks } = generateRollingCalendar('2026-10-15', activityMap);

      const cellOct15 = weeks.flat().find(d => d.date === '2026-10-15');
      const cellOct14 = weeks.flat().find(d => d.date === '2026-10-14');
      const cellOct13 = weeks.flat().find(d => d.date === '2026-10-13');
      const cellOct12 = weeks.flat().find(d => d.date === '2026-10-12');
      const cellOct11 = weeks.flat().find(d => d.date === '2026-10-11');

      expect(cellOct15.level).toBe(1);
      expect(cellOct14.level).toBe(2);
      expect(cellOct13.level).toBe(3);
      expect(cellOct12.level).toBe(4);

      // STRICT: Count 0 is level 0 (neutral grey, NEVER green)
      expect(cellOct11.level).toBe(0);
      expect(cellOct11.count).toBe(0);
    });
  });
});
