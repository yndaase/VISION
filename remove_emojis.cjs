const fs = require('fs');
const path = require('path');

function walkDir(dir) {
  const results = [];
  fs.readdirSync(dir).forEach(file => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      if (file !== 'node_modules' && file !== '.git') {
        results.push(...walkDir(fullPath));
      }
    } else if (['.html', '.js', '.css'].includes(path.extname(file))) {
      results.push(fullPath);
    }
  });
  return results;
}

const files = walkDir('.');
let totalCleaned = 0;

files.forEach(file => {
  if (file.includes('remove_emojis')) return;
  try {
    const content = fs.readFileSync(file, 'utf8');
    let cleaned = content;

    // All major emoji Unicode blocks (using u flag for proper Unicode)
    cleaned = cleaned.replace(/[\u{1F600}-\u{1F64F}]/gu, '');
    cleaned = cleaned.replace(/[\u{1F300}-\u{1F5FF}]/gu, '');
    cleaned = cleaned.replace(/[\u{1F680}-\u{1F6FF}]/gu, '');
    cleaned = cleaned.replace(/[\u{1F700}-\u{1F77F}]/gu, '');
    cleaned = cleaned.replace(/[\u{1F780}-\u{1F7FF}]/gu, '');
    cleaned = cleaned.replace(/[\u{1F800}-\u{1F8FF}]/gu, '');
    cleaned = cleaned.replace(/[\u{1F900}-\u{1F9FF}]/gu, '');
    cleaned = cleaned.replace(/[\u{1FA00}-\u{1FA6F}]/gu, '');
    cleaned = cleaned.replace(/[\u{1FA70}-\u{1FAFF}]/gu, '');
    cleaned = cleaned.replace(/[\u{2600}-\u{26FF}]/gu, '');
    cleaned = cleaned.replace(/[\u{2700}-\u{27BF}]/gu, '');
    cleaned = cleaned.replace(/[\u{FE00}-\u{FE0F}]/gu, '');
    cleaned = cleaned.replace(/[\u{1F1E0}-\u{1F1FF}]/gu, '');
    cleaned = cleaned.replace(/\u200D/gu, '');
    cleaned = cleaned.replace(/\u20E3/gu, '');

    if (cleaned !== content) {
      fs.writeFileSync(file, cleaned, 'utf8');
      console.log('Cleaned:', file);
      totalCleaned++;
    }
  } catch (e) {
    console.error('Error:', file, e.message);
  }
});

console.log('Done. Total files cleaned:', totalCleaned);
