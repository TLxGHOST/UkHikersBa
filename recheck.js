// Save this as route-checker.js in your project root

const fs = require('fs');
const path = require('path');

// Directories to check
const dirsToCheck = ['./routes'];

// Regex to find potential problematic route patterns
const problematicPatterns = [
  { pattern: /:([\s\/\)]|$)/, description: 'Missing parameter name after colon' },
  { pattern: /:\w+\([^\)]*$/, description: 'Unclosed parameter regex parenthesis' },
  { pattern: /:[\W_]/, description: 'Invalid character in parameter name' }
];

// Function to check a file for problematic route patterns
function checkFile(filePath) {
  console.log(`Checking ${filePath}...`);
  
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    let hasIssues = false;
    
    lines.forEach((line, index) => {
      // Check if line contains router definition with path
      if (line.includes('router.') && 
          (line.includes('.get(') || 
           line.includes('.post(') || 
           line.includes('.put(') || 
           line.includes('.delete(') || 
           line.includes('.patch('))) {
        
        // Extract the route path string
        const match = line.match(/'([^']*)'|"([^"]*)"/);
        if (match) {
          const routePath = match[1] || match[2];
          
          // Check for problematic patterns
          problematicPatterns.forEach(({ pattern, description }) => {
            if (pattern.test(routePath)) {
              console.log(`\x1b[31m⚠️ Issue found in ${filePath}:${index + 1}\x1b[0m`);
              console.log(`  Route path: ${routePath}`);
              console.log(`  Issue: ${description}`);
              console.log(`  Full line: ${line.trim()}`);
              hasIssues = true;
            }
          });
        }
      }
    });
    
    if (!hasIssues) {
      console.log(`✅ No issues found in ${filePath}`);
    }
    
    return hasIssues;
  } catch (err) {
    console.error(`Error reading file ${filePath}:`, err);
    return false;
  }
}

// Function to recursively check all files in a directory
function checkDirectory(directory) {
  try {
    const files = fs.readdirSync(directory);
    let hasIssues = false;
    
    files.forEach(file => {
      const filePath = path.join(directory, file);
      const stats = fs.statSync(filePath);
      
      if (stats.isDirectory()) {
        // Recursively check subdirectories
        hasIssues = checkDirectory(filePath) || hasIssues;
      } else if (file.endsWith('.js')) {
        // Check JavaScript files
        hasIssues = checkFile(filePath) || hasIssues;
      }
    });
    
    return hasIssues;
  } catch (err) {
    console.error(`Error reading directory ${directory}:`, err);
    return false;
  }
}

// Main function
function main() {
  console.log('🔍 Checking route files for issues...');
  let hasIssues = false;
  
  dirsToCheck.forEach(dir => {
    console.log(`\n📁 Checking directory: ${dir}`);
    hasIssues = checkDirectory(dir) || hasIssues;
  });
  
  if (hasIssues) {
    console.log('\n❌ Issues found! Please fix the routes mentioned above.');
  } else {
    console.log('\n✅ No issues found in route files.');
    console.log('The error might be elsewhere. Check for:');
    console.log('1. Dynamic imports of route files');
    console.log('2. Route definitions in files outside the routes directory');
    console.log('3. Middleware that might be using path-to-regexp');
  }
}

main();