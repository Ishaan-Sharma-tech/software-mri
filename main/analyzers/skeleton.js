/**
 * main/analyzers/skeleton.js
 * Layer 1: Structure & Stats
 */
const fs = require('fs/promises');
const path = require('path');
const sloc = require('sloc');
const { detectLanguage } = require('../parsers/language-detector');
const { extractStructure } = require('../parsers/regex-fallback');

async function analyzeFile(filePath, projectRoot) {
  const stat = await fs.stat(filePath);
  const ext = path.extname(filePath);
  const language = detectLanguage(filePath);
  
  let content = '';
  let linesOfCode = { total: 0, source: 0, comment: 0, blank: 0 };
  let structure = { imports: [], exports: [], functions: [], classes: [] };
  
  try {
    content = await fs.readFile(filePath, 'utf8');
    
    // Calculate sloc if language is supported by sloc
    if (language) {
      try {
        const slocLang = ext.replace('.', '');
        linesOfCode = sloc(content, slocLang);
      } catch (e) {
        // Fallback for sloc
        const lines = content.split('\n');
        linesOfCode = { total: lines.length, source: lines.length, comment: 0, blank: 0 };
      }
    } else {
        const lines = content.split('\n');
        linesOfCode = { total: lines.length, source: lines.length, comment: 0, blank: 0 };
    }

    // Always use regex fallback for now since tree-sitter native binding failed
    structure = extractStructure(content, language);

  } catch (err) {
    // Binary file or unreadable
  }

  const relativePath = path.relative(projectRoot, filePath).replace(/\\/g, '/');
  
  return {
    id: relativePath,
    name: path.basename(filePath),
    path: relativePath,
    extension: ext,
    size: stat.size,
    language: language || 'unknown',
    lines: linesOfCode,
    structure: structure
  };
}

module.exports = {
  analyzeFile
};
