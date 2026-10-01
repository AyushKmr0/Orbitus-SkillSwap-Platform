const fs = require('fs');
let content = fs.readFileSync('frontend/src/pages/groups/GroupDetail.jsx', 'utf8');

// Map every remaining WhatsApp hardcoded color to app theme
const map = {
  // Backgrounds
  'bg-\\[#2a3942\\]': 'bg-slate-100 dark:bg-slate-800',
  'bg-\\[#233138\\]': 'bg-white dark:bg-[#1a2130]',
  'bg-\\[#182229\\]': 'bg-amber-50 dark:bg-amber-950/30',
  'bg-\\[#222e35\\]': 'bg-slate-200 dark:bg-slate-800',

  // Borders
  'border-\\[#2a3942\\]': 'border-slate-200 dark:border-slate-700',
  'border-\\[#222e35\\]': 'border-slate-200 dark:border-slate-800',
  'border-\\[#111b21\\]': 'border-white dark:border-[#181d26]',

  // Text
  'text-\\[#ffd279\\]': 'text-amber-500',
  'text-\\[#00a884\\]': 'text-indigo-600 dark:text-indigo-400',
  'text-\\[#8696a0\\]': 'text-muted',
  'text-\\[#e9edef\\]': 'text-app',

  // Spinner accent
  'border-t-\\[#00a884\\]': 'border-t-indigo-500',

  // Avatar bg
  'bg-\\[#222e35\\]': 'bg-slate-200 dark:bg-slate-700',

  // divide
  'divide-\\[#222e35\\]\\/50': 'divide-slate-200 dark:divide-slate-800',
  'divide-\\[#222e35\\]': 'divide-slate-200 dark:divide-slate-800',
};

Object.entries(map).forEach(([from, to]) => {
  content = content.replace(new RegExp(from, 'g'), to);
});

fs.writeFileSync('frontend/src/pages/groups/GroupDetail.jsx', content, 'utf8');
console.log('Done');
