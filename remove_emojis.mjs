import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join, extname } from 'path';

function walkDir(dir) {
  const results = [];
  const list = readdirSync(dir);
  list.forEach(file => {
    const fullPath = join(dir, file);
    const stat = statSync(fullPath);
    if (stat.isDirectory()) {
      if (file !== 'node_modules' && file !== '.git') {
        results.push(...walkDir(fullPath));
      }
    } else if (['.html', '.js', '.css'].includes(extname(file))) {
      results.push(fullPath);
    }
  });
  return results;
}

const files = walkDir('.');
let totalCleaned = 0;

files.forEach(file => {
  try {
    const content = readFileSync(file, 'utf8');
    let cleaned = content;

    // All major emoji Unicode blocks
    cleaned = cleaned.replace(/[\u{1F600}-\u{1F64F}]/gu, ''); // Emoticons
    cleaned = cleaned.replace(/[\u{1F300}-\u{1F5FF}]/gu, ''); // Symbols & Pictographs
    cleaned = cleaned.replace(/[\u{1F680}-\u{1F6FF}]/gu, ''); // Transport
    cleaned = cleaned.replace(/[\u{1F700}-\u{1F77F}]/gu, ''); // Alchemical
    cleaned = cleaned.replace(/[\u{1F780}-\u{1F7FF}]/gu, ''); // Geometric Extended
    cleaned = cleaned.replace(/[\u{1F800}-\u{1F8FF}]/gu, ''); // Supplemental Arrows-C
    cleaned = cleaned.replace(/[\u{1F900}-\u{1F9FF}]/gu, ''); // Supplemental Symbols
    cleaned = cleaned.replace(/[\u{1FA00}-\u{1FA6F}]/gu, ''); // Chess
    cleaned = cleaned.replace(/[\u{1FA70}-\u{1FAFF}]/gu, ''); // Symbols Extended-A
    cleaned = cleaned.replace(/[\u{2600}-\u{26FF}]/gu, '');   // Misc Symbols
    cleaned = cleaned.replace(/[\u{2700}-\u{27BF}]/gu, '');   // Dingbats
    cleaned = cleaned.replace(/[\u{FE00}-\u{FE0F}]/gu, '');   // Variation Selectors
    cleaned = cleaned.replace(/[\u{1F1E0}-\u{1F1FF}]/gu, ''); // Flags
    cleaned = cleaned.replace(/\u200D/gu, '');                 // ZWJ
    cleaned = cleaned.replace(/\u20E3/gu, '');                 // Keycap

    if (cleaned !== content) {
      writeFileSync(file, cleaned, 'utf8');
      console.log('Cleaned:', file);
      totalCleaned++;
    }
  } catch (e) {
    console.error('Error:', file, e.message);
  }
});

console.log('\nDone. Total files cleaned:', totalCleaned);
