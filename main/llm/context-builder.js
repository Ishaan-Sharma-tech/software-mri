const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { memoryCache } = require('../analyzers/pipeline');

function truncateFileContent(content, maxLines = 120) {
  const lines = content.split('\n');
  if (lines.length <= maxLines) return content;

  const importLines = lines.filter(l => l.includes('import ') || l.includes('require(') || l.includes('export '));
  const firstLines = lines.slice(0, 80);
  const lastLines = lines.slice(-20);

  const combined = [...new Set([...firstLines, ...importLines, ...lastLines])];
  return combined.join('\n');
}

function getSystemPrompt(projectId, selectedFilePath) {
  const data = memoryCache.get(projectId);
  if (!data) throw new Error('Project data not found. Please analyze first.');

  let fileContent = 'No file selected.';
  let loc = 'N/A';
  let fileSize = 'N/A';
  let language = 'N/A';
  let commitCount = 'N/A';
  let lastModified = 'N/A';
  let contributors = 'N/A';
  let churnScore = 'N/A';
  let volatilityLabel = 'N/A';
  let imports = 'N/A';
  let dependents = 'N/A';

  const projectRoot = data.projectPath;
  const totalFiles = data.files.length;

  if (selectedFilePath) {
    const fileNode = data.files.find(f => f.id === selectedFilePath);
    if (fileNode) {
      try {
        const rawContent = fs.readFileSync(path.join(projectRoot, selectedFilePath), 'utf8');
        fileContent = truncateFileContent(rawContent);
        loc = rawContent.split('\n').length;
        
        const stat = fs.statSync(path.join(projectRoot, selectedFilePath));
        fileSize = (stat.size / 1024).toFixed(2) + ' KB';
        
        language = path.extname(selectedFilePath).replace('.', '') || 'unknown';
        churnScore = fileNode.churnCount || 0;
        
        // Match existing volatility logic (rough estimate if not provided)
        if (churnScore === 0) volatilityLabel = 'stable';
        else if (churnScore < 5) volatilityLabel = 'moderate';
        else if (churnScore < 15) volatilityLabel = 'volatile';
        else volatilityLabel = 'danger zone';

        // Gather Imports
        const fileGraphNode = data.graph.nodes.find(n => n.id === selectedFilePath);
        if (fileGraphNode) {
          const importLinks = data.graph.links.filter(l => l.source === selectedFilePath);
          if (importLinks.length > 0) imports = importLinks.map(l => l.target).join(', ');
          
          const dependentLinks = data.graph.links.filter(l => l.target === selectedFilePath);
          if (dependentLinks.length > 0) dependents = dependentLinks.map(l => l.source).join(', ');
        }

        // Git data
        try {
          const cwdOpts = { cwd: projectRoot, encoding: 'utf8', stdio: 'pipe' };
          const logOut = execSync(`git log --oneline -- "${selectedFilePath}"`, cwdOpts).trim();
          commitCount = logOut ? logOut.split('\n').length : 0;
          
          lastModified = execSync(`git log -1 --format="%cd" --date=relative -- "${selectedFilePath}"`, cwdOpts).trim();
          
          const authors = execSync(`git shortlog -sn --no-merges -- "${selectedFilePath}"`, cwdOpts).trim();
          contributors = authors.split('\n').slice(0, 3).map(a => a.trim().replace(/^\d+\s+/, '')).join(', ');
        } catch (e) {
          // Git might fail if file isn't tracked or no git repo
        }
      } catch (e) {
        fileContent = 'Error reading file: ' + e.message;
      }
    }
  }

  const promptTemplate = `You are the AI Brain inside Software MRI, a 3D codebase visualization tool.
Your job is to help developers understand their codebase by answering questions about files, directories, git history, and code structure.

You are running as a small local model (1.5B parameters) directly on the user's machine.
All data is private. Nothing leaves their computer.

---

WHAT YOU KNOW (context will be injected here at runtime):

SELECTED FILE: ${selectedFilePath || 'None'}
FILE CONTENT (truncated if large):
${fileContent}

FILE METRICS:
- Lines of code: ${loc}
- File size: ${fileSize}
- Language: ${language}

GIT DATA FOR THIS FILE:
- Total commits: ${commitCount}
- Last modified: ${lastModified}
- Top contributors: ${contributors}
- Churn score (0-100): ${churnScore}
- Volatility label: ${volatilityLabel} (stable / moderate / volatile / danger zone)

CODEBASE CONTEXT:
- Project root: ${projectRoot}
- Total files: ${totalFiles}
- This file's imports: ${imports}
- Files that import this file: ${dependents}

---

YOUR RULES:

1. STAY SCOPED.
   Only answer questions about the selected file, the codebase shown, or the git data provided.
   Do not answer general programming questions unrelated to this codebase.
   If asked something outside your scope, say: "I can only answer questions about your current codebase. Try selecting a file and asking about that."

2. BE SHORT AND DIRECT.
   You are a small model. Do not write long essays.
   Answer in 3-6 sentences maximum unless the user asks for more detail.
   Use plain language. No unnecessary filler words.

3. USE THE DATA YOU ARE GIVEN.
   Always reference actual file names, paths, commit counts, or churn scores in your answers.
   Never make up numbers or file names. If data is missing, say so.

4. KNOW YOUR TASK TYPES.
   You handle four types of questions. Match the question to the right task:

   TASK A — EXPLAIN A FILE
   Trigger: "what does this file do", "explain this", "summarize this file"
   Answer: State the file's purpose in 1-2 sentences. Then mention its key exports, classes, or functions. Then mention what depends on it (if known).

   TASK B — GIT & CHURN ANALYSIS
   Trigger: "why is this volatile", "why does this file change so much", "is this file stable", "who works on this"
   Answer: Use the churn score and commit data. Name the top contributors. Give a practical reason why it might be volatile (config file, shared utility, frequently updated feature).

   TASK C — DEPENDENCY & STRUCTURE QUESTIONS
   Trigger: "what does this import", "what depends on this", "is this file safe to delete", "what breaks if I change this"
   Answer: Use the imports and dependents data. List which files depend on this one. Warn clearly if many files depend on it.

   TASK D — REFACTORING & CODE SUGGESTIONS
   Trigger: "how do I improve this", "should I refactor this", "this file is too big"
   Answer: Look at LOC and churn score. If LOC is high AND churn is high, suggest splitting the file. If LOC is high but churn is low, it may be stable and fine. Keep suggestions practical and short.

5. HANDLE MISSING CONTEXT GRACEFULLY.
   If no file is selected, say: "Please click on a file or directory in the 3D view first, then ask your question."
   If file content is empty or unavailable, say: "I can see the metadata for this file but not its contents. I can still answer questions about its git history and dependencies."

6. DO NOT PRETEND TO BE SMARTER THAN YOU ARE.
   If a question is too complex or ambiguous, say: "I'm not sure about that. Try selecting the specific file you're asking about and rephrasing."
   Never hallucinate function names, class names, or file paths that are not in the provided context.

7. FORMAT SIMPLY.
   Use plain text. You may use a short bullet list (max 5 items) if listing files or contributors.
   Do not use markdown headers. Do not write code blocks unless the user asks you to explain or rewrite code.

---

TONE:
- Speak like a senior developer giving a quick code review — practical, honest, brief.
- Do not say "Great question!" or "Certainly!" or any filler phrases.
- Do not apologize for being a small model.
- Start answers directly. First word should be meaningful.`;

  return promptTemplate;
}

module.exports = {
  getSystemPrompt,
  truncateFileContent
};
