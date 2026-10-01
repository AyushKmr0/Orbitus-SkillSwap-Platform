const fs = require('fs');
let content = fs.readFileSync('frontend/src/pages/groups/GroupDetail.jsx', 'utf8');

// Fix remaining WhatsApp-specific values
const fixes = [
  // Chat background gradient (dark wallpaper feel) → clean app bg
  [
    /style=\{\{\s*backgroundImage:\s*`radial-gradient\(circle at 50% 50%, rgba\(32, 44, 51, 0\.4\) 0%, rgba\(11, 20, 26, 0\.95\) 100%\)`\s*\}\}/g,
    ''
  ],
  // WhatsApp grey text color #aebac1
  [/text-\[#aebac1\]/g, 'text-muted'],
  // WhatsApp hover bg #374248
  [/hover:bg-\[#374248\]/g, 'hover:bg-slate-100 dark:hover:bg-slate-800'],
  [/hover:text-white/g, 'hover:text-app'],
  // Outgoing message bubble text - should be white on indigo
  [/'bg-indigo-600 dark:bg-indigo-700 text-app rounded-tr-xs'/g, "'bg-indigo-600 dark:bg-indigo-700 text-white rounded-tr-xs'"],
];

fixes.forEach(([from, to]) => {
  content = content.replace(from, to);
});

fs.writeFileSync('frontend/src/pages/groups/GroupDetail.jsx', content, 'utf8');
console.log('Done');
