import React from 'react';
import { Doughnut, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip as ChartTooltip,
  Legend as ChartLegend,
  CategoryScale,
  LinearScale,
  BarElement
} from 'chart.js';
import { BarChart3, Database } from 'lucide-react';

ChartJS.register(ArcElement, ChartTooltip, ChartLegend, CategoryScale, LinearScale, BarElement);

const AdminOverviewCharts = ({ adminStats }) => {
  if (!adminStats) return null;

  const sessionLabels = adminStats.charts?.sessionsBreakdown?.labels || ['Completed', 'Pending', 'Upcoming', 'Rescheduled/Cancelled'];
  const sessionData = adminStats.charts?.sessionsBreakdown?.data || [0, 0, 0, 0];

  const skillLabels = adminStats.charts?.skillsBreakdown?.labels || [];
  const skillData = adminStats.charts?.skillsBreakdown?.data || [];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-white dark:bg-[#181d28] border border-slate-200 dark:border-slate-800/80 rounded-3xl p-6 space-y-4 shadow-sm">
        <h3 className="font-bold text-sm text-app font-outfit flex items-center gap-2">
          <BarChart3 size={16} className="text-indigo-600 dark:text-indigo-400" />
          Session Status Breakdown
        </h3>
        <div className="h-64 flex items-center justify-center">
          <Doughnut
            data={{
              labels: sessionLabels,
              datasets: [
                {
                  data: sessionData,
                  backgroundColor: ['#10b981', '#f59e0b', '#6366f1', '#ef4444'],
                  borderWidth: 0
                }
              ]
            }}
            options={{ responsive: true, maintainAspectRatio: false }}
          />
        </div>
      </div>

      <div className="bg-white dark:bg-[#181d28] border border-slate-200 dark:border-slate-800/80 rounded-3xl p-6 space-y-4 shadow-sm">
        <h3 className="font-bold text-sm text-app font-outfit flex items-center gap-2">
          <Database size={16} className="text-purple-600 dark:text-purple-400" />
          Skills Category Share
        </h3>
        <div className="h-64 flex items-center justify-center">
          <Bar
            data={{
              labels: skillLabels,
              datasets: [
                {
                  label: 'Skills Count',
                  data: skillData,
                  backgroundColor: '#6366f1',
                  borderRadius: 8
                }
              ]
            }}
            options={{ responsive: true, maintainAspectRatio: false }}
          />
        </div>
      </div>
    </div>
  );
};

export default AdminOverviewCharts;
