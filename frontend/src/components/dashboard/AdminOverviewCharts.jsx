import React from 'react';
import { useSelector } from 'react-redux';
import { Bar, Doughnut } from 'react-chartjs-2';
import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend as ChartLegend,
  LinearScale,
  Tooltip as ChartTooltip
} from 'chart.js';
import { BarChart3, Database, Users } from 'lucide-react';

ChartJS.register(ArcElement, ChartTooltip, ChartLegend, CategoryScale, LinearScale, BarElement);

const SESSION_COLORS = ['#10b981', '#f59e0b', '#6366f1', '#ef4444'];
const ROLE_COLORS = ['#6366f1', '#94a3b8'];
const SKILL_COLOR = '#6366f1';
const formatCount = (value) => new Intl.NumberFormat().format(value);

const DoughnutCard = ({ title, subtitle, icon: Icon, segments }) => {
  const total = segments.reduce((sum, segment) => sum + segment.value, 0);
  const visibleSegments = segments.filter((segment) => segment.value > 0);
  const isDark = useSelector((state) => state.theme.mode === 'dark');

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '76%',
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: isDark ? '#111827' : '#172033',
        padding: 10,
        callbacks: {
          label: (context) => ` ${context.label}: ${formatCount(context.raw)}`
        }
      }
    }
  };

  return (
    <section className="admin-analytics-card">
      <header className="admin-analytics-card__header">
        <span className="admin-analytics-card__icon"><Icon size={17} /></span>
        <div>
          <h3>{title}</h3>
          <p>{subtitle}</p>
        </div>
        <span className="admin-analytics-card__total">{formatCount(total)}</span>
      </header>

      {visibleSegments.length ? (
        <div className="admin-doughnut">
          <div className="admin-doughnut__chart">
            <Doughnut
              data={{
                labels: visibleSegments.map((segment) => segment.label),
                datasets: [{
                  data: visibleSegments.map((segment) => segment.value),
                  backgroundColor: visibleSegments.map((segment) => segment.color),
                  borderWidth: 0,
                  hoverOffset: 4
                }]
              }}
              options={chartOptions}
            />
            <div className="admin-doughnut__center">
              <strong>{formatCount(total)}</strong>
              <span>Total</span>
            </div>
          </div>

          <ul className="admin-doughnut__legend">
            {visibleSegments.map((segment) => (
              <li key={segment.label}>
                <span className="admin-doughnut__label">
                  <i style={{ backgroundColor: segment.color }} />
                  {segment.label}
                </span>
                <span className="admin-doughnut__value">
                  {formatCount(segment.value)}
                  <small>{total ? `${Math.round((segment.value / total) * 100)}%` : '0%'}</small>
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="admin-analytics-empty">
          <Icon size={20} />
          <span>No {title.toLowerCase()} data yet</span>
        </div>
      )}
    </section>
  );
};

const AdminOverviewCharts = ({ adminStats, view = 'all' }) => {
  const isDark = useSelector((state) => state.theme.mode === 'dark');
  if (!adminStats) return null;

  const sessionBreakdown = adminStats.charts?.sessionsBreakdown || {};
  const sessionLabels = sessionBreakdown.labels || ['Completed', 'Pending', 'Upcoming', 'Rescheduled/Cancelled'];
  const sessionData = sessionBreakdown.data || [0, 0, 0, 0];
  const sessionColors = SESSION_COLORS;
  const sessionSegments = sessionLabels.map((label, index) => ({
    label,
    value: Math.max(0, Number(sessionData[index]) || 0),
    color: sessionColors[index % sessionColors.length]
  }));

  const stats = adminStats.stats || {};
  const roleSegments = [
    { label: 'Members', value: Math.max(0, Number(stats.standardUserCount) || 0), color: ROLE_COLORS[0] },
    { label: 'Admins', value: Math.max(0, Number(stats.adminCount) || 0), color: ROLE_COLORS[1] }
  ];

  const skillLabels = adminStats.charts?.skillsBreakdown?.labels || [];
  const skillData = adminStats.charts?.skillsBreakdown?.data || [];
  const allSkillCategories = skillLabels.map((label, index) => ({
    label: label || 'Uncategorized',
    value: Math.max(0, Number(skillData[index]) || 0)
  })).sort((a, b) => b.value - a.value);
  const skillChartRows = allSkillCategories.slice(0, 7);
  const remainingSkills = allSkillCategories.slice(7).reduce((sum, category) => sum + category.value, 0);
  if (remainingSkills > 0) skillChartRows.push({ label: 'Other categories', value: remainingSkills });

  const tickColor = isDark ? '#aab4c4' : '#647084';
  const gridColor = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(23,32,51,0.08)';
  const skillChartOptions = {
    indexAxis: 'y',
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: isDark ? '#111827' : '#172033',
        padding: 10,
        callbacks: {
          title: (items) => skillChartRows[items[0]?.dataIndex]?.label || '',
          label: (context) => ` ${formatCount(context.raw)} skills`
        }
      }
    },
    scales: {
      x: {
        beginAtZero: true,
        ticks: { color: tickColor, precision: 0, font: { size: 10 } },
        grid: { color: gridColor }
      },
      y: {
        ticks: { color: tickColor, font: { size: 10 } },
        grid: { display: false }
      }
    }
  };

  const sessionCard = (
    <DoughnutCard
      title="Session status"
      subtitle="All recorded peer-learning sessions"
      icon={BarChart3}
      segments={sessionSegments}
    />
  );
  const accountCard = (
    <DoughnutCard
      title="Account mix"
      subtitle="Members compared with administrators"
      icon={Users}
      segments={roleSegments}
    />
  );
  const skillsCard = (
    <section className="admin-analytics-card admin-analytics-card--wide">
      <header className="admin-analytics-card__header">
        <span className="admin-analytics-card__icon"><Database size={17} /></span>
        <div>
          <h3>Skills by category</h3>
          <p>Catalog distribution across the leading categories</p>
        </div>
        <span className="admin-analytics-card__total">{formatCount(stats.totalSkills || 0)}</span>
      </header>

      {skillChartRows.length ? (
        <div className="admin-analytics-bar" style={{ height: Math.max(230, skillChartRows.length * 34) }}>
          <Bar
            data={{
              labels: skillChartRows.map((category) => category.label),
              datasets: [{
                label: 'Skills',
                data: skillChartRows.map((category) => category.value),
                backgroundColor: SKILL_COLOR,
                borderRadius: 6,
                barThickness: 15,
                maxBarThickness: 18
              }]
            }}
            options={skillChartOptions}
          />
        </div>
      ) : (
        <div className="admin-analytics-empty">
          <Database size={20} />
          <span>No skill categories yet</span>
        </div>
      )}
    </section>
  );

  if (view === 'sessions') {
    return <div className="admin-analytics-grid admin-analytics-grid--single">{sessionCard}</div>;
  }
  if (view === 'accounts') {
    return <div className="admin-analytics-grid admin-analytics-grid--single">{accountCard}</div>;
  }
  if (view === 'skills') {
    return <div className="admin-analytics-grid admin-analytics-grid--single">{skillsCard}</div>;
  }

  return (
    <div className="admin-analytics-grid">
      {sessionCard}
      {accountCard}
      {skillsCard}
    </div>
  );
};

export default AdminOverviewCharts;
