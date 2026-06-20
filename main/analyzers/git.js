const { exec } = require('child_process');
const util = require('util');
const path = require('path');
const execAsync = util.promisify(exec);

async function getGitChurn(projectPath) {
  const churnMap = new Map();
  
  try {
    // Run git log to get the list of all changed files in the last 6 months
    const { stdout } = await execAsync('git log --name-only --format=format: --since="6 months ago"', {
      cwd: projectPath,
      maxBuffer: 1024 * 1024 * 10 // 10MB buffer just in case
    });

    const lines = stdout.split('\n');
    for (let line of lines) {
      line = line.trim();
      if (!line) continue;
      
      // Normalize path to use forward slashes for matching
      const normalizedPath = line.replace(/\\/g, '/');
      const count = churnMap.get(normalizedPath) || 0;
      churnMap.set(normalizedPath, count + 1);
    }
    
  } catch (err) {
    // Not a git repository or git not installed. That's fine.
    console.log('Git churn analysis skipped (not a git repo or no git installed).');
  }

  return churnMap;
}

module.exports = {
  getGitChurn
};
