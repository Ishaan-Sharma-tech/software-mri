const { memoryCache } = require('./pipeline');
const llmRouter = require('../llm/router');

function detectFlows(file) {
  const importsStr = (file.structure?.imports || []).map(i => i.toLowerCase()).join(' ');
  const codeStr = file.source || ''; // Wait, we didn't save raw source in memoryCache to save RAM.
  // We'll rely primarily on imports and file path for heuristic static flow tracing in this phase.
  
  const flows = [];

  // Data Read/Write Flow (Database)
  const dbImports = ['mongoose', 'prisma', 'sequelize', 'typeorm', 'sqlite3', 'pg', 'mysql', 'knex'];
  if (dbImports.some(i => importsStr.includes(i)) || file.id.toLowerCase().includes('model') || file.id.toLowerCase().includes('repository')) {
    flows.push('database'); // green/blue particles
  }

  // API / Network Flow
  const apiImports = ['axios', 'fetch', 'got', 'superagent', 'express', 'fastify'];
  if (apiImports.some(i => importsStr.includes(i)) || file.id.toLowerCase().includes('api') || file.id.toLowerCase().includes('route')) {
    flows.push('api'); // orange particles
  }

  // Event Flow
  const eventImports = ['events', 'emitter', 'bull', 'kafka', 'amqp', 'redis'];
  if (eventImports.some(i => importsStr.includes(i)) || file.id.toLowerCase().includes('event') || file.id.toLowerCase().includes('queue')) {
    flows.push('event'); // purple particles
  }

  // If no specific flow, just generic execution
  if (flows.length === 0) {
    flows.push('execution'); // white/gray particles
  }

  return flows;
}

async function analyzeBloodFlow(projectId) {
  const data = memoryCache.get(projectId);
  if (!data) throw new Error('Project data not found. Please analyze first.');

  const files = data.files;
  const nodes = data.graph.nodes;
  const links = data.graph.links;

  // Enrich nodes with flow types
  nodes.forEach(node => {
    const fileData = files.find(f => f.id === node.id);
    if (fileData) {
      node.flows = detectFlows(fileData);
    } else {
      node.flows = ['execution'];
    }
  });

  // Enrich links with particle properties based on target node's flow
  links.forEach(link => {
    const targetId = typeof link.target === 'object' ? link.target.id : link.target;
    const targetNode = nodes.find(n => n.id === targetId);
    
    let particleColor = 'rgba(255,255,255,0.5)';
    let flowType = 'execution';

    if (targetNode && targetNode.flows) {
      if (targetNode.flows.includes('database')) {
        particleColor = '#10b981'; // Green (Data)
        flowType = 'database';
      } else if (targetNode.flows.includes('api')) {
        particleColor = '#f59e0b'; // Orange (Network)
        flowType = 'api';
      } else if (targetNode.flows.includes('event')) {
        particleColor = '#8b5cf6'; // Purple (Events)
        flowType = 'event';
      }
    }

    // Attach flow info to link so frontend can render particles
    link.flowType = flowType;
    link.particleColor = particleColor;
  });

  data.bloodFlow = {
    analyzed: true,
    timestamp: Date.now()
  };

  memoryCache.set(projectId, data);
  return data;
}

module.exports = {
  analyzeBloodFlow
};
