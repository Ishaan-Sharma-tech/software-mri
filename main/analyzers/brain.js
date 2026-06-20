const { memoryCache } = require('./pipeline');
const llmRouter = require('../llm/router');

async function queryBrain(projectId, question) {
  const data = memoryCache.get(projectId);
  if (!data) throw new Error('Project data not found. Please analyze first.');

  // Build Context
  // To avoid hitting token limits, we just send file paths, names, and a summary of their purpose if available
  // In a full implementation, we'd use semantic search / RAG here.
  const filesList = data.files.map(f => {
    let organStr = '';
    if (data.organs && data.organs.clusters) {
      const organ = data.organs.clusters.find(c => c.files.includes(f.id));
      if (organ) organStr = ` (Domain: ${organ.name})`;
    }
    return `- ${f.id}${organStr}`;
  }).slice(0, 500).join('\n'); // cap at 500 files to save tokens

  const prompt = `You are "Brain", an expert software architect analyzing a codebase.
I will give you a list of files in the project and their detected domains.

Files:
${filesList}

User Question: ${question}

Instructions:
1. Answer the user's question clearly and concisely.
2. If your answer mentions a specific file or module, write its exact path in brackets, like this: [src/main.js] or [controllers/auth.js]. This allows the 3D visualization UI to highlight the file automatically!
3. Format the response beautifully using Markdown.
`;

  try {
    const responseText = await llmRouter.complete(prompt, { temperature: 0.2 });
    
    // Parse references: look for [path]
    const references = [];
    const refRegex = /\[(.*?)\]/g;
    let match;
    while ((match = refRegex.exec(responseText)) !== null) {
      const pathRef = match[1];
      // Try to find exact or partial match in project files
      const found = data.files.find(f => f.id.toLowerCase().includes(pathRef.toLowerCase()));
      if (found && !references.includes(found.id)) {
        references.push(found.id);
      }
    }

    return {
      answer: responseText,
      references
    };
  } catch (err) {
    console.error("Brain query failed:", err.message);
    return { error: err.message || "Failed to query brain." };
  }
}

module.exports = {
  queryBrain
};
