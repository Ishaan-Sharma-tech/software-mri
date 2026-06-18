/**
 * main/parsers/regex-fallback.js
 * Fallback parser using regex when tree-sitter is unavailable.
 */

function extractStructure(content, language) {
  const result = {
    imports: [],
    exports: [],
    functions: [],
    classes: []
  };

  const lines = content.split('\n');

  lines.forEach((line, index) => {
    const lineNum = index + 1;
    const str = line.trim();

    // 1. Extract Imports
    if (language === 'javascript' || language === 'typescript' || language === 'tsx') {
      // import { X } from "Y" or import X from "Y"
      let m = str.match(/import\s+(?:.*from\s+)?['"]([^'"]+)['"]/);
      if (m) result.imports.push(m[1]);
      
      // import('Y') - Dynamic Imports
      m = str.match(/import\(['"]([^'"]+)['"]\)/);
      if (m) result.imports.push(m[1]);
      
      // require('Y')
      m = str.match(/require\(['"]([^'"]+)['"]\)/);
      if (m) result.imports.push(m[1]);

      // export class X or export function X or export const X
      m = str.match(/export\s+(?:default\s+)?(?:class|function|const|let|var)\s+([a-zA-Z0-9_]+)/);
      if (m) result.exports.push(m[1]);

      // function X(...)
      m = str.match(/function\s+([a-zA-Z0-9_]+)\s*\(/);
      if (m) result.functions.push({ name: m[1], line: lineNum });

      // class X
      m = str.match(/class\s+([a-zA-Z0-9_]+)/);
      if (m && !str.includes('export')) result.classes.push({ name: m[1], line: lineNum });
    }
    else if (language === 'python') {
      // import X
      let m = str.match(/^import\s+([a-zA-Z0-9_.]+)/);
      if (m) result.imports.push(m[1]);

      // from X import Y
      m = str.match(/^from\s+([a-zA-Z0-9_.]+)\s+import/);
      if (m) result.imports.push(m[1]);

      // def X(...)
      m = str.match(/^def\s+([a-zA-Z0-9_]+)\s*\(/);
      if (m) result.functions.push({ name: m[1], line: lineNum });

      // class X
      m = str.match(/^class\s+([a-zA-Z0-9_]+)/);
      if (m) result.classes.push({ name: m[1], line: lineNum });
    }
    // Very naive catch-all for other languages (C, Java, Rust, Go)
    else {
      // include "X" or <X>
      let m = str.match(/#include\s*[<"]([^>"]+)[>"]/);
      if (m) result.imports.push(m[1]);

      // import X
      m = str.match(/import\s+['"]?([a-zA-Z0-9_./-]+)['"]?/);
      if (m) result.imports.push(m[1]);

      // use X
      m = str.match(/use\s+([a-zA-Z0-9_:]+)/);
      if (m) result.imports.push(m[1]);
    }
  });

  return result;
}

module.exports = {
  extractStructure
};
