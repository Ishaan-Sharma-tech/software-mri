/**
 * main/analyzers/dependencies.js
 * Layer 1: Build dependency graph from parsed files
 */
const path = require('path');

function buildGraph(files) {
  const nodes = [];
  const edges = [];
  
  // Create a fast lookup map
  const fileMap = new Map();
  files.forEach(f => {
    fileMap.set(f.id, f);
    nodes.push({
      id: f.id,
      name: f.name,
      path: f.path,
      val: Math.max(1, Math.min((f.lines?.total || 10) / 10, 50)), // Size of node based on lines
      language: f.language,
      group: path.dirname(f.path),
      churn: f.churnCount || 0
    });
  });

  // Calculate edges based on imports
  files.forEach(sourceFile => {
    if (!sourceFile.structure || !sourceFile.structure.imports) return;
    
    sourceFile.structure.imports.forEach(importPath => {
      // Very naive resolution for relative imports
      let targetId = null;
      
      if (importPath.startsWith('.')) {
        const sourceDir = path.dirname(sourceFile.id);
        const resolved = path.posix.join(sourceDir, importPath);
        
        // Try exact match
        if (fileMap.has(resolved)) targetId = resolved;
        // Try with common extensions
        else if (fileMap.has(resolved + '.js')) targetId = resolved + '.js';
        else if (fileMap.has(resolved + '.ts')) targetId = resolved + '.ts';
        else if (fileMap.has(resolved + '.jsx')) targetId = resolved + '.jsx';
        else if (fileMap.has(resolved + '.tsx')) targetId = resolved + '.tsx';
        else if (fileMap.has(resolved + '/index.js')) targetId = resolved + '/index.js';
        else if (fileMap.has(resolved + '/index.ts')) targetId = resolved + '/index.ts';
      } else {
        // External dependency or alias (skip for now to keep graph clean, or add external nodes)
        // For Phase 1, we only link internal files
      }

      if (targetId) {
        edges.push({
          source: sourceFile.id,
          target: targetId
        });
      }
    });
  });

  // Calculate Coupling (Ca, Ce)
  nodes.forEach(node => {
    node.ce = edges.filter(e => e.source === node.id).length; // Efferent (outgoing)
    node.ca = edges.filter(e => e.target === node.id).length; // Afferent (incoming)
    node.instability = node.ce / (node.ca + node.ce || 1);
  });

  // Inject Folder Nodes and Structure Links
  const folders = new Set();
  const folderNodes = [];
  const folderLinks = [];

  files.forEach(f => {
    // Determine relative path based on project root if available
    let relPath = f.path;
    const parts = relPath.replace(/\\/g, '/').split('/');
    parts.pop(); // Remove file name
    
    let currentDir = '';
    for (let i = 0; i < parts.length; i++) {
      const parentDir = currentDir;
      currentDir = currentDir ? currentDir + '/' + parts[i] : parts[i];
      
      const folderId = 'dir:' + currentDir;
      if (!folders.has(folderId)) {
        folders.add(folderId);
        folderNodes.push({
          id: folderId,
          name: parts[i],
          type: 'folder',
          val: 8 // size
        });
        
        // Link to parent folder
        if (parentDir) {
          folderLinks.push({
            source: 'dir:' + parentDir,
            target: folderId,
            type: 'structure'
          });
        }
      }
    }
    
    // Link file to its immediate folder
    if (currentDir) {
      folderLinks.push({
        source: 'dir:' + currentDir,
        target: f.id,
        type: 'structure'
      });
    }
  });

  nodes.push(...folderNodes);
  edges.push(...folderLinks);

  return { nodes, links: edges };
}

module.exports = {
  buildGraph
};
