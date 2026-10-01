const fs = require('fs');
let content = fs.readFileSync('frontend/src/pages/groups/GroupDetail.jsx', 'utf8');

// Replace WhatsApp dark color scheme with app theme
const replacements = [
  // Background colors
  [/bg-\[#111b21\]/g, 'page-shell'],
  [/bg-\[#202c33\]/g, 'bg-white dark:bg-[#181d26]'],
  [/bg-\[#0b141a\]/g, 'bg-slate-50 dark:bg-[#11141b]'],
  [/bg-\[#2a3942\]/g, 'bg-slate-100 dark:bg-slate-800'],
  
  // Text colors
  [/text-\[#e9edef\]/g, 'text-app'],
  [/text-\[#8696a0\]/g, 'text-muted'],
  [/text-\[#d1d7db\]/g, 'text-muted-strong'],
  [/text-\[#53bdeb\]/g, 'text-blue-500 dark:text-blue-400'],
  
  // Accent/green => indigo
  [/text-\[#00a884\]/g, 'text-indigo-600 dark:text-indigo-400'],
  [/bg-\[#00a884\]\/15/g, 'bg-indigo-600\/15'],
  [/bg-\[#00a884\]/g, 'bg-indigo-600'],
  [/border-\[#00a884\]\/30/g, 'border-indigo-500\/30'],
  [/border-\[#00a884\]/g, 'border-indigo-500'],
  [/hover:bg-\[#029071\]/g, 'hover:bg-indigo-500'],
  [/focus:ring-\[#00a884\]/g, 'focus:ring-indigo-500'],
  
  // Outgoing bubble green => indigo
  [/bg-\[#005c4b\]/g, 'bg-indigo-600 dark:bg-indigo-700'],
  
  // Border colors
  [/divide-\[#222e35\]\/30/g, 'divide-slate-200 dark:divide-slate-800'],
  [/border-\[#222e35\]/g, 'border-slate-200 dark:border-slate-800'],
  
  // Placeholder/icon colors
  [/placeholder:text-\[#8696a0\]/g, 'placeholder:text-muted'],
  
  // bg on input search
  [/bg-\[#202c33\] border-none/g, 'bg-slate-100 dark:bg-slate-800 border-none'],
  
  // Hard-coded full background on outer wrapper  
  [/bg-\[#111b21\] text-\[#e9edef\] font-sans antialiased/g, 'bg-white dark:bg-[#12161f] text-app font-sans antialiased'],
  [/bg-\[#111b21\] text-slate-100/g, 'page-shell text-app'],
  [/bg-\[#111b21\] border-r/g, 'bg-white dark:bg-[#181d26] border-r'],
  
  // WhatsApp text in strings
  [/Opening WhatsApp chat\.\.\./g, 'Opening chat...'],
  [/WhatsApp chat/g, 'chat'],
];

replacements.forEach(([from, to]) => {
  content = content.replace(from, to);
});

// Also fix active group item bg class manually
content = content.replace(
  /'bg-\[#2a3942\] border-l-4 border-\[#00a884\]'/g,
  "'bg-indigo-50 dark:bg-indigo-950\/30 border-l-4 border-indigo-500'"
);

content = content.replace(
  /'hover:bg-\[#202c33\]\/70'/g,
  "'hover:bg-slate-50 dark:hover:bg-slate-800\/70'"
);

fs.writeFileSync('frontend/src/pages/groups/GroupDetail.jsx', content, 'utf8');
console.log('Done - replaced WhatsApp colors with app theme colors');
