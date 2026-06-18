const { memoryCache } = require('./pipeline');
const llmRouter = require('../llm/router');

const DOMAIN_SIGNALS = {
  authentication: {
    paths: ['auth', 'login', 'session', 'oauth', 'sso', 'jwt'],
    imports: ['bcrypt', 'passport', 'jsonwebtoken', 'jose', 'next-auth'],
    color: '#3b82f6', // Blue
    name: 'Authentication'
  },
  database: {
    paths: ['db', 'database', 'models', 'schema', 'migrations', 'repository'],
    imports: ['mongoose', 'prisma', 'sequelize', 'typeorm', 'sqlite3', 'pg', 'mysql', 'knex'],
    color: '#10b981', // Emerald
    name: 'Database'
  },
  ui: {
    paths: ['components', 'views', 'pages', 'screens', 'ui', 'styles', 'css'],
    imports: ['react', 'vue', 'svelte', 'styled-components', 'tailwindcss', 'three'],
    color: '#ec4899', // Pink
    name: 'User Interface'
  },
  api: {
    paths: ['api', 'routes', 'controllers', 'endpoints', 'graphql', 'trpc'],
    imports: ['express', 'fastify', 'koa', 'apollo-server', 'graphql'],
    color: '#f59e0b', // Amber
    name: 'API Gateway'
  },
  core: {
    paths: ['core', 'utils', 'helpers', 'lib', 'shared', 'common'],
    imports: ['lodash', 'ramda', 'moment', 'date-fns'],
    color: '#8b5cf6', // Violet
    name: 'Core Utils'
  },
  config: {
    paths: ['config', 'setup', 'env', 'constants', 'settings'],
    imports: ['dotenv', 'config'],
    color: '#64748b', // Slate
    name: 'Configuration'
  },
  ipc: {
    paths: ['ipc', 'bridge', 'preload', 'electron', 'main', 'renderer'],
    imports: ['electron'],
    color: '#0ea5e9', // Sky
    name: 'IPC / Desktop Bridge'
  },
  llm: {
    paths: ['llm', 'ai', 'prompts', 'providers', 'openai', 'gemini', 'anthropic'],
    imports: ['openai', 'anthropic', '@google/generative-ai'],
    color: '#d946ef', // Fuchsia
    name: 'AI / LLM'
  },
  analyzers: {
    paths: ['analyzers', 'parsers', 'ast', 'treesitter'],
    imports: ['tree-sitter', 'acorn', 'babel'],
    color: '#14b8a6', // Teal
    name: 'Code Analyzers'
  }
};

async function analyzeOrgans(projectId) {
  const data = memoryCache.get(projectId);
  if (!data) throw new Error('Project data not found. Please analyze first.');

  const files = data.files;
  const nodes = data.graph.nodes;
  
  // Initialize organs structure
  const organs = {};
  
  // Step 1: Heuristic clustering
  files.forEach(file => {
    let bestMatch = null;
    let highestScore = 0;

    const lowerPath = file.id.toLowerCase();
    const importsStr = (file.structure?.imports || []).map(i => i.toLowerCase()).join(' ');

    for (const [domainId, signals] of Object.entries(DOMAIN_SIGNALS)) {
      let score = 0;
      
      // Check paths
      signals.paths.forEach(p => {
        if (lowerPath.includes(p)) score += 2;
      });
      
      // Check imports
      signals.imports.forEach(i => {
        if (importsStr.includes(i)) score += 3;
      });

      if (score > highestScore) {
        highestScore = score;
        bestMatch = domainId;
      }
    }

    if (bestMatch && highestScore >= 2) {
      if (!organs[bestMatch]) {
        organs[bestMatch] = {
          id: bestMatch,
          name: DOMAIN_SIGNALS[bestMatch].name,
          color: DOMAIN_SIGNALS[bestMatch].color,
          files: [],
          confidence: 'Verified'
        };
      }
      organs[bestMatch].files.push(file.id);
    } else {
      // Unclassified
      if (!organs['other']) {
        organs['other'] = {
          id: 'other',
          name: 'Unclassified',
          color: '#9ca3af',
          files: [],
          confidence: 'None'
        };
      }
      organs['other'].files.push(file.id);
    }
  });

  // Step 2: LLM Refinement for Unclassified files
  // If we have an LLM configured and tested, we can ask it to classify the largest unclassified files.
  // We will do a lightweight version: ask the LLM to propose a new organ for the unclassified files.
  
  let llmAvailable = false;
  try {
    const res = await llmRouter.testConnection();
    llmAvailable = res.success;
  } catch(e) {}

  if (llmAvailable && organs['other'] && organs['other'].files.length > 5) {
    try {
      // Take top 15 unclassified files
      const sampleFiles = organs['other'].files.slice(0, 15);
      const prompt = `
I have a set of source code files that don't fit into standard categories. 
Here are their paths:
${sampleFiles.join('\n')}

Based purely on the file paths, what is the SINGLE most likely domain or system these belong to?
Provide a one word or two word name for this system.
For example: "Payment Processing", "Analytics", "Routing", "Hardware Driver".
Respond ONLY with the name of the system, nothing else.
`;
      const llmSystemName = await llmRouter.complete(prompt, { maxTokens: 10, temperature: 0.2 });
      const cleanName = llmSystemName.trim().replace(/["']/g, '');
      
      if (cleanName && cleanName.length > 2 && cleanName.length < 30) {
        const customId = cleanName.toLowerCase().replace(/\s+/g, '_');
        organs[customId] = {
          id: customId,
          name: cleanName,
          color: '#f43f5e', // Rose
          files: organs['other'].files, // Move all unclassified to this inferred organ for now
          confidence: 'Inferred'
        };
        delete organs['other'];
      }
    } catch (e) {
      console.error("LLM Refinement failed:", e);
    }
  }

  // Step 3: Compute Cross-Organ Dependencies (Edges)
  // Which organ imports which other organ?
  const organEdges = [];
  const edgeMap = new Map();

  data.graph.links.forEach(edge => {
    // Find which organ edge.source belongs to, and edge.target belongs to
    // Note: 3d-force-graph modifies edge.source to be an object reference during runtime.
    const sourceId = typeof edge.source === 'object' ? edge.source.id : edge.source;
    const targetId = typeof edge.target === 'object' ? edge.target.id : edge.target;
    
    let sourceOrgan = null;
    let targetOrgan = null;

    for (const [oId, organ] of Object.entries(organs)) {
      if (organ.files.includes(sourceId)) sourceOrgan = oId;
      if (organ.files.includes(targetId)) targetOrgan = oId;
    }

    if (sourceOrgan && targetOrgan && sourceOrgan !== targetOrgan) {
      const key = `${sourceOrgan}->${targetOrgan}`;
      if (!edgeMap.has(key)) {
        edgeMap.set(key, { source: sourceOrgan, target: targetOrgan, value: 0 });
      }
      edgeMap.get(key).value += 1;
    }
  });

  // Assign organs back to nodes for the frontend
  nodes.forEach(node => {
    for (const [oId, organ] of Object.entries(organs)) {
      if (organ.files.includes(node.id)) {
        node.organ = {
          id: oId,
          name: organ.name,
          color: organ.color
        };
        break;
      }
    }
  });

  const organsList = Object.values(organs);
  const organDependencies = Array.from(edgeMap.values());

  data.organs = {
    clusters: organsList,
    dependencies: organDependencies
  };

  memoryCache.set(projectId, data);
  return data.organs;
}

module.exports = {
  analyzeOrgans
};
