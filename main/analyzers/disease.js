/**
 * main/analyzers/disease.js
 * Layer 5: Code Health and Static Analysis
 */

function detectDiseases(files, graph) {
  const issues = [];
  let totalPenalty = 0;
  
  // Create quick lookup maps
  const nodeMap = new Map();
  graph.nodes.forEach(n => nodeMap.set(n.id, n));

  const linkMap = new Map(); // source -> array of targets
  graph.links.forEach(l => {
    if (!linkMap.has(l.source)) linkMap.set(l.source, []);
    linkMap.get(l.source).push(l.target);
  });

  // 1. Circular Dependencies (Simple DFS for back-edges)
  const visited = new Set();
  const recursionStack = new Set();
  const cycles = [];

  function detectCycle(nodeId, path) {
    visited.add(nodeId);
    recursionStack.add(nodeId);
    path.push(nodeId);

    const neighbors = linkMap.get(nodeId) || [];
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        detectCycle(neighbor, [...path]);
      } else if (recursionStack.has(neighbor)) {
        // Cycle found
        const cycleStartIndex = path.indexOf(neighbor);
        const cyclePath = path.slice(cycleStartIndex);
        cycles.push([...cyclePath, neighbor]);
      }
    }

    recursionStack.delete(nodeId);
  }

  graph.nodes.forEach(node => {
    if (!visited.has(node.id)) {
      detectCycle(node.id, []);
    }
  });

  // De-duplicate cycles
  const uniqueCycles = new Set();
  const finalCycles = [];
  cycles.forEach(c => {
    const sorted = [...c].sort().join('|');
    if (!uniqueCycles.has(sorted)) {
      uniqueCycles.add(sorted);
      finalCycles.push(c);
    }
  });

  finalCycles.forEach(cycle => {
    cycle.forEach(nodeId => {
      issues.push({ fileId: nodeId, type: 'critical', message: `Circular dependency detected in path: ${cycle.map(p => p.split(/[/\\]/).pop()).join(' -> ')}` });
      totalPenalty += 10; // High penalty for cycles
    });
  });

  // Analyze individual files
  files.forEach(file => {
    const node = nodeMap.get(file.id);
    if (!node) return;
    
    file.healthIssues = [];
    let filePenalty = 0;

    // Filter issues for this file
    const fileCycleIssues = issues.filter(i => i.fileId === file.id);
    if (fileCycleIssues.length > 0) {
      file.healthIssues.push(...fileCycleIssues);
      filePenalty += fileCycleIssues.length * 20;
    }

    // Skip LOC and Coupling checks for config/data files like .json, .md, .lock, .icns
    const isSourceCode = file.name.match(/\.(js|jsx|ts|tsx|py|go|rs|java|c|cpp|h|hpp|cs|php|rb|swift|kt)$/i);
    
    if (isSourceCode) {
      // 2. Dead Code / Orphans
      const isEntryPoint = file.name.match(/index\.[jt]sx?|main\.[jt]sx?|app\.[jt]sx?|server\.[jt]sx?|setup|config/i);
      if (node.ca === 0 && !isEntryPoint && (file.structure?.exports?.length > 0)) {
        file.healthIssues.push({ type: 'warning', message: 'Potential dead code: File exports data but is never imported.' });
        filePenalty += 5;
        totalPenalty += 2;
      }

      // 3. Large Files
      const loc = file.lines?.total || 0;
      if (loc > 500) {
        const severity = loc > 1000 ? 'critical' : 'warning';
        file.healthIssues.push({ type: severity, message: `File is too large (${loc} lines). Consider breaking it up.` });
        const penalty = loc > 1000 ? 20 : 10;
        filePenalty += penalty;
        totalPenalty += penalty / 2;
      }

      // 4. God Files (High Coupling)
      if (node.ca > 15 && node.ce > 10) {
        file.healthIssues.push({ type: 'critical', message: `God File Detected: High incoming (${node.ca}) and outgoing (${node.ce}) coupling.` });
        filePenalty += 25;
        totalPenalty += 10;
      }

      // 5. Deep Nesting Heuristic (Regex fallback for cognitive complexity)
      if (file.content) {
        let maxDepth = 0;
        let currentDepth = 0;
        for (let i = 0; i < file.content.length; i++) {
          if (file.content[i] === '{') {
            currentDepth++;
            if (currentDepth > maxDepth) maxDepth = currentDepth;
          } else if (file.content[i] === '}') {
            currentDepth = Math.max(0, currentDepth - 1);
          }
        }
        if (maxDepth > 6) {
          file.healthIssues.push({ type: 'warning', message: `Deep nesting detected (depth ${maxDepth}). Logic may be too complex.` });
          filePenalty += 5;
          totalPenalty += 2;
        }
      }
    }

    // Calculate file health (0-100)
    file.healthScore = Math.max(0, 100 - filePenalty);
    node.healthScore = file.healthScore;
    node.healthIssues = file.healthIssues;
  });

  // Calculate project health
  // Max penalty could theoretically be huge, so we scale it based on file count
  const maxAcceptablePenalty = files.length * 5; 
  const projectScoreRaw = 100 - ((totalPenalty / (maxAcceptablePenalty || 1)) * 100);
  const projectScore = Math.max(0, Math.min(100, projectScoreRaw));

  let grade = 'F';
  if (projectScore >= 90) grade = 'A';
  else if (projectScore >= 80) grade = 'B';
  else if (projectScore >= 70) grade = 'C';
  else if (projectScore >= 60) grade = 'D';

  // Aggregate all issues for the report
  const allIssues = [...issues];
  files.forEach(f => {
    if (f.healthIssues) {
      // Avoid duplicating circular dependencies since they were added to file.healthIssues too
      f.healthIssues.forEach(fi => {
        if (!fi.message.includes('Circular dependency')) {
          allIssues.push({ fileId: f.id, type: fi.type, message: fi.message });
        }
      });
    }
  });

  return {
    score: Math.round(projectScore),
    grade,
    totalIssues: allIssues.length,
    issues: allIssues
  };
}

module.exports = {
  detectDiseases
};
