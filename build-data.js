const fs = require('fs');
const path = require('path');

const contentDir = path.join(__dirname, 'content');
const outputFile = path.join(__dirname, 'data.json');

const data = [];

function getTitleFromMarkdown(filePath, fallbackFilename) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    for (const line of lines) {
      if (line.startsWith('# ')) {
        // Return the header without the '# ' and trim any spaces
        return line.substring(2).trim();
      }
    }
  } catch (err) {
    console.error(`Error reading ${filePath}:`, err);
  }
  
  // Fallback if no # header is found
  let name = fallbackFilename.replace(/\.md$/, '');
  name = name.replace(/^(\d+-|[a-z]\.)/, '');
  name = name.replace(/[-_]/g, ' ');
  return name.replace(/\b\w/g, c => c.toUpperCase());
}

function scanDirectory(categoryName, folderName) {
  const dirPath = path.join(contentDir, folderName);
  if (!fs.existsSync(dirPath)) return;

  const items = fs.readdirSync(dirPath);
  const files = [];

    for (const item of items) {
      if (item.endsWith('.md')) {
        // Skip common meta files
        if (item.toLowerCase() === 'readme.md' || item.toLowerCase() === 'code_of_conduct.md') {
          continue;
        }
        
        const filePath = path.join(dirPath, item);
        files.push({
          name: getTitleFromMarkdown(filePath, item),
          filename: item,
          path: `${folderName}/${item}`
        });
      }
    }

  // Sort files logically (by prefix numbers/letters)
  files.sort((a, b) => a.filename.localeCompare(b.filename));

  data.push({
    category: categoryName,
    folder: folderName,
    files: files
  });
}

scanDirectory('Study Guide', 'study-guide');
scanDirectory('Exercises', 'exercises');

fs.writeFileSync(outputFile, JSON.stringify(data, null, 2));
console.log(`Successfully generated data.json with ${data.reduce((acc, cat) => acc + cat.files.length, 0)} files.`);
