const { exec } = require('child_process');
const { memoryCache } = require('./pipeline');
const path = require('path');

async function runGit(cwd, args) {
  return new Promise((resolve, reject) => {
    exec(`git ${args}`, { cwd, maxBuffer: 1024 * 1024 * 10 }, (error, stdout, stderr) => {
      // Ignore errors if it's not a git repo or no commits yet
      if (error && error.code !== 0 && !stdout) {
        resolve('');
      } else {
        resolve(stdout);
      }
    });
  });
}

async function analyzeArchaeology(projectId) {
  const data = memoryCache.get(projectId);
  if (!data) throw new Error('Project data not found.');

  const cwd = data.projectPath;
  
  // 1. Get total commits and first commit date (project age)
  const logStr = await runGit(cwd, `log --format=%at`);
  if (!logStr.trim()) {
    throw new Error('No Git history found in this project.');
  }
  
  const timestamps = logStr.trim().split('\n').map(Number);
  const now = Math.floor(Date.now() / 1000);
  
  // 2. Get file churn (numstat over the last 1000 commits to save time)
  // Format: "10  5  src/main.js"
  const numstat = await runGit(cwd, `log -n 1000 --numstat --format=""`);
  
  const fileStats = {};
  
  numstat.trim().split('\n').forEach(line => {
    if (!line) return;
    const parts = line.split('\t');
    if (parts.length === 3) {
      const added = parseInt(parts[0]) || 0;
      const deleted = parseInt(parts[1]) || 0;
      const file = parts[2];
      
      // Normalize path to match our internal IDs
      const normalizedId = file.replace(/\\/g, '/');
      
      if (!fileStats[normalizedId]) {
        fileStats[normalizedId] = { churnCount: 0, linesChanged: 0 };
      }
      fileStats[normalizedId].churnCount += 1;
      fileStats[normalizedId].linesChanged += (added + deleted);
    }
  });

  // Calculate global max churn to normalize heatmaps
  let maxChurn = 1;
  const fileArray = [];
  for (const [id, stats] of Object.entries(fileStats)) {
    if (stats.churnCount > maxChurn) maxChurn = stats.churnCount;
    fileArray.push({ id, ...stats });
  }

  // 3. Get Top Authors
  const authorsLog = await runGit(cwd, `log --format=%aN`);
  const authorCounts = {};
  authorsLog.trim().split('\n').forEach(name => {
    if (!name) return;
    authorCounts[name] = (authorCounts[name] || 0) + 1;
  });
  const topAuthors = Object.entries(authorCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // 4. Get Recent Commits
  const recentCommitsLog = await runGit(cwd, `log -n 5 --format=%h|%an|%s|%cr`);
  const recentCommits = recentCommitsLog.trim().split('\n').filter(Boolean).map(line => {
    const [hash, author, message, time] = line.split('|');
    return { hash, author, message, time };
  });

  // 5. Sorted Files (Volatile vs Stable)
  fileArray.sort((a, b) => b.churnCount - a.churnCount);
  const topChurned = fileArray.slice(0, 20);
  
  // Stable files (at least present in the last 1000 commits but least edited)
  const topStable = [...fileArray].sort((a, b) => a.churnCount - b.churnCount).slice(0, 20);

  // Enrich data nodes
  data.graph.nodes.forEach(node => {
    // Normalizing paths (sometimes git gives relative from root, our IDs might be relative from root)
    // In our system, node.id is the path relative to project root
    let nodeStats = fileStats[node.id];
    
    // Fallback if slashes don't match exactly
    if (!nodeStats) {
      const altId = Object.keys(fileStats).find(k => k.endsWith(node.id) || node.id.endsWith(k));
      if (altId) nodeStats = fileStats[altId];
    }

    if (nodeStats) {
      node.archaeology = {
        churnCount: nodeStats.churnCount,
        linesChanged: nodeStats.linesChanged,
        churnRatio: nodeStats.churnCount / maxChurn
      };
    } else {
      node.archaeology = { churnCount: 0, linesChanged: 0, churnRatio: 0 };
    }
  });

  data.archaeology = {
    analyzed: true,
    totalCommits: timestamps.length,
    oldestCommit: timestamps[timestamps.length - 1],
    newestCommit: timestamps[0],
    maxChurn,
    topAuthors,
    recentCommits,
    topChurned,
    topStable
  };

  memoryCache.set(projectId, data);
  return data;
}

module.exports = {
  analyzeArchaeology
};
