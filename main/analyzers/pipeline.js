/**
 * main/analyzers/pipeline.js
 * Chunked analysis orchestrator
 */
const fs = require('fs/promises');
const path = require('path');
const { analyzeFile } = require('./skeleton');
const { buildGraph } = require('./dependencies');
const { detectDiseases } = require('./disease');
const crypto = require('crypto');

// Ignore lists
const IGNORE_DIRS = new Set(['node_modules', '.git', 'dist', 'build', 'vendor', '__pycache__', '.next', 'out', 'coverage']);
const IGNORE_EXTS = new Set(['.png', '.jpg', '.jpeg', '.gif', '.ico', '.svg', '.woff', '.woff2', '.ttf', '.eot', '.mp4', '.pdf', '.zip', '.tar', '.gz', '.exe', '.dll', '.so', '.dylib', '.class', '.jar']);

async function walkDir(dir, root, fileList = []) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name.startsWith('.')) continue; // skip hidden

    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!IGNORE_DIRS.has(entry.name)) {
        await walkDir(fullPath, root, fileList);
      }
    } else {
      const ext = path.extname(entry.name).toLowerCase();
      if (!IGNORE_EXTS.has(ext)) {
        fileList.push(fullPath);
      }
    }
  }
  return fileList;
}

// Global cache (replaces SQLite for now)
const memoryCache = new Map();

async function startAnalysis(projectPath, sender) {
  const projectId = crypto.createHash('md5').update(projectPath).digest('hex');
  
  if (memoryCache.has(projectId)) {
    sender.send('analyze:progress', { status: 'complete', progress: 100, data: memoryCache.get(projectId) });
    return projectId;
  }

  sender.send('analyze:progress', { status: 'scanning', progress: 0 });
  
  const allFiles = await walkDir(projectPath, projectPath);
  
  // Free tier limit mock
  if (allFiles.length > 500) {
    // sender.send('analyze:error', 'Free tier limited to 500 files.');
    // For now we'll just slice it to 500
    allFiles.length = 500; 
  }

  sender.send('analyze:progress', { status: 'analyzing', progress: 5, total: allFiles.length, current: 0 });

  const CHUNK_SIZE = 50;
  const parsedFiles = [];
  
  // Sort by name for consistency
  allFiles.sort();

  for (let i = 0; i < allFiles.length; i += CHUNK_SIZE) {
    const chunk = allFiles.slice(i, i + CHUNK_SIZE);
    
    // Process chunk concurrently
    const chunkResults = await Promise.all(chunk.map(f => analyzeFile(f, projectPath)));
    parsedFiles.push(...chunkResults.filter(Boolean));
    
    const progress = 5 + Math.floor((parsedFiles.length / allFiles.length) * 90);
    sender.send('analyze:progress', { 
      status: 'analyzing', 
      progress, 
      total: allFiles.length, 
      current: parsedFiles.length 
    });
    
    // Give event loop a tiny breather
    await new Promise(r => setTimeout(r, 10));
  }

  sender.send('analyze:progress', { status: 'building_graph', progress: 95 });
  
  // Build the graph
  const graphData = buildGraph(parsedFiles);
  
  // Phase 2: Detect Diseases
  const health = detectDiseases(parsedFiles, graphData);
  
  const finalData = {
    projectId,
    projectPath,
    stats: {
      totalFiles: parsedFiles.length,
      totalLines: parsedFiles.reduce((acc, f) => acc + (f.lines?.total || 0), 0)
    },
    graph: graphData,
    files: parsedFiles,
    health: health
  };

  memoryCache.set(projectId, finalData);
  
  sender.send('analyze:progress', { status: 'complete', progress: 100, data: finalData });
  
  return projectId;
}

module.exports = {
  startAnalysis,
  memoryCache
};
