const EXTENSION_MAP = {
  // JavaScript & TypeScript
  '.js': 'javascript',
  '.jsx': 'javascript',
  '.mjs': 'javascript',
  '.cjs': 'javascript',
  '.ts': 'typescript',
  '.tsx': 'tsx',
  
  // Web
  '.html': 'html',
  '.css': 'css',
  '.scss': 'scss',
  '.sass': 'sass',
  '.less': 'less',
  '.json': 'json',
  
  // Python
  '.py': 'python',
  '.pyw': 'python',
  
  // Java & JVM
  '.java': 'java',
  '.kt': 'kotlin',
  '.scala': 'scala',
  
  // C/C++
  '.c': 'c',
  '.h': 'c',
  '.cpp': 'cpp',
  '.cc': 'cpp',
  '.cxx': 'cpp',
  '.hpp': 'cpp',
  '.hxx': 'cpp',
  
  // C#
  '.cs': 'c_sharp',
  
  // Go
  '.go': 'go',
  
  // Rust
  '.rs': 'rust',
  
  // Ruby
  '.rb': 'ruby',
  
  // PHP
  '.php': 'php',
  
  // Swift & Objective-C
  '.swift': 'swift',
  '.m': 'objc',
  '.mm': 'objc',
  
  // Shell
  '.sh': 'bash',
  '.bash': 'bash',
  '.zsh': 'bash',
  
  // Config
  '.yaml': 'yaml',
  '.yml': 'yaml',
  '.toml': 'toml',
  '.xml': 'xml',
  
  // SQL
  '.sql': 'sql',
  
  // Markdown
  '.md': 'markdown'
};

/**
 * Detects the language of a file based on its extension.
 * @param {string} fileName 
 * @returns {string|null} The tree-sitter language identifier, or null if unknown
 */
function detectLanguage(fileName) {
  const match = fileName.match(/\.[0-9a-z]+$/i);
  if (!match) return null;
  const ext = match[0].toLowerCase();
  return EXTENSION_MAP[ext] || null;
}

module.exports = {
  detectLanguage,
  EXTENSION_MAP
};
