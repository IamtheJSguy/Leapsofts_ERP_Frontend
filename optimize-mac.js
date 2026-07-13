import fs from 'fs';
import path from 'path';

const TARGET_DIRS = [
  'src/pages',
  'src/components/dashboard',
  'src/components/chat',
  'src/components/common',
  'src/components/admin'
];

const IGNORED_FILES = [
  'Header.tsx',
  'NotificationPanel.tsx'
];

function shouldIgnore(filename) {
  if (IGNORED_FILES.includes(filename)) return true;
  if (filename.includes('Modal') || filename.includes('Dialog')) return true;
  return false;
}

function processFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  let newContent = content;

  // Replace backdropFilter and WebkitBackdropFilter
  // We use regex to match lines containing backdropFilter and comment them out, or just remove the property if inline.
  // E.g., `backdropFilter: 'blur(20px)',` -> `/* backdropFilter: 'blur(20px)', */`
  
  newContent = newContent.replace(/([ \t]*)(WebkitBackdropFilter|backdropFilter)\s*:\s*(['"`]blur.*?[`"']|isDarkMode.*?),?/g, '$1/* $2: $3 (removed for performance) */');
  
  // Also handle cases without trailing comma
  
  if (content !== newContent) {
    fs.writeFileSync(filePath, newContent, 'utf-8');
    console.log(`Optimized: ${filePath}`);
  }
}

function walkDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      walkDir(fullPath);
    } else if (fullPath.endsWith('.tsx') && !shouldIgnore(file)) {
      processFile(fullPath);
    }
  }
}

TARGET_DIRS.forEach(dir => {
  const fullDirPath = path.join(process.cwd(), dir);
  if (fs.existsSync(fullDirPath)) {
    walkDir(fullDirPath);
  }
});

console.log('Optimization script completed.');
