import ForceGraph3D from '3d-force-graph';
import * as THREE from 'three';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import SpriteText from 'three-spritetext';

export function initGraph(container, data) {
  container.innerHTML = `
    <div id="graph-container" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: transparent;"></div>
    <div id="toolbar-container"></div>
    <div id="detail-container"></div>
    <div id="zoom-controls" style="
      position: absolute;
      bottom: 24px;
      right: 24px;
      display: flex;
      flex-direction: column;
      gap: 8px;
      background: var(--bg-glass);
      backdrop-filter: blur(12px);
      border: 1px solid var(--border-default);
      border-radius: var(--radius-md);
      padding: 8px;
      z-index: 100;
      box-shadow: var(--shadow-lg);
    ">
      <button id="btn-zoom-in" title="Zoom In" style="width: 32px; height: 32px; border-radius: var(--radius-sm); border: none; background: transparent; color: var(--text-primary); cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s;">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
      </button>
      <button id="btn-zoom-fit" title="Fit to Screen" style="width: 32px; height: 32px; border-radius: var(--radius-sm); border: none; background: transparent; color: var(--text-primary); cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s;">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 14v6h6M20 10V4h-6M10 4H4v6M14 20h6v-6"></path></svg>
      </button>
      <button id="btn-zoom-out" title="Zoom Out" style="width: 32px; height: 32px; border-radius: var(--radius-sm); border: none; background: transparent; color: var(--text-primary); cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s;">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="5" y1="12" x2="19" y2="12"></line></svg>
      </button>
    </div>
  `;

  const graphContainer = container.querySelector('#graph-container');
  
  // Semantic Tech-Stack Coloring
  const getSemanticColor = (path, name) => {
    const p = (path || name || '').toLowerCase();
    if (p.includes('/components/') || p.includes('/screens/') || p.includes('/ui/') || p.match(/\.(jsx|tsx|css|html|scss)$/)) {
      return '#0ea5e9'; // UI/Frontend (Cyan/Blue)
    }
    if (p.includes('/api/') || p.includes('/routes/') || p.includes('/controllers/') || p.includes('/services/') || p.match(/\.(go|rs)$/)) {
      return '#c084fc'; // Backend/API (Purple)
    }
    if (p.includes('/models/') || p.includes('/db/') || p.match(/\.sql$/)) {
      return '#10b981'; // Database/Models (Emerald)
    }
    if (p.includes('config') || p.includes('webpack') || p.includes('vite') || p.match(/(\.json|\.env|\.yml|\.md)$/) || name.startsWith('.')) {
      return '#64748b'; // Config/Infra (Slate)
    }
    return '#fbbf24'; // General Logic (Amber)
  };

  // Pre-process nodes for Structural Clustering
  const structuralGroups = {};
  data.graph.nodes.forEach(n => {
    const pathStr = n.id.replace(/\\/g, '/');
    const parts = pathStr.split('/');
    // Use top-level directory as group
    n.structGroup = parts.length > 1 ? parts[0] : 'Root';
    if (!structuralGroups[n.structGroup]) {
      structuralGroups[n.structGroup] = { nodes: [], color: getSemanticColor(n.id, n.name) };
    }
    structuralGroups[n.structGroup].nodes.push(n.id);
  });

  // Assign physical target centers for each group to create "Solar Systems"
  const groupCenters = {};
  const groupKeys = Object.keys(structuralGroups);
  const phi = Math.PI * (3 - Math.sqrt(5)); // golden angle
  groupKeys.forEach((g, i) => {
    // Distribute centers in a 3D sphere using Fibonacci sphere
    const y = 1 - (i / (groupKeys.length - 1)) * 2; // y goes from 1 to -1
    const radius = Math.sqrt(1 - y * y);
    const theta = phi * i;
    groupCenters[g] = {
      x: Math.cos(theta) * radius * 800,
      y: y * 600,
      z: Math.sin(theta) * radius * 800
    };
  });

  // Build graph
  const Graph = ForceGraph3D({
    extraRenderers: [],
    rendererConfig: { preserveDrawingBuffer: true, alpha: true, antialias: false }
  })(graphContainer)
    .graphData(data.graph)
    .backgroundColor('rgba(0,0,0,0)') 
    .linkColor(link => {
      if (link.type === 'structure') {
        const sourceGroup = link.source.structGroup || link.source;
        const targetGroup = link.target.structGroup || link.target;
        return sourceGroup === targetGroup ? 'rgba(6, 182, 212, 0.15)' : 'rgba(244, 63, 94, 0.08)';
      }
      return 'rgba(255, 255, 255, 0.15)';
    })
    .linkWidth(link => {
      if (activeLayer === 'disease') {
        const s = link.source.healthScore !== undefined ? link.source.healthScore : 100;
        const t = link.target.healthScore !== undefined ? link.target.healthScore : 100;
        if (s < 50 || t < 50) return 1.5; // Thicker spreading links
      }
      if (link.type === 'structure') {
        const sourceGroup = link.source.structGroup || link.source;
        const targetGroup = link.target.structGroup || link.target;
        return sourceGroup === targetGroup ? 0.3 : 0.8; 
      }
      return 0.5;
    })
    .linkDirectionalParticles(0) // Disabled by default for performance
    .linkDirectionalParticleWidth(1.0)
    .linkDirectionalParticleSpeed(link => {
      if (typeof activeLayer !== 'undefined' && activeLayer === 'bloodflow') {
        const targetId = link.target.id || link.target;
        const targetNode = data.graph.nodes.find(n => n.id === targetId);
        const hScore = targetNode?.hotspotScore || 0;
        return 0.002 + (hScore / 6000); // Super fast flow into hotspots
      }
      return 0.003;
    })
    .enableNodeDrag(false)
    .showNavInfo(false)
    .nodeLabel(node => {
      const colorStr = getSemanticColor(node.id, node.name);
      return `
        <div class="node-tooltip" style="
          background: var(--bg-glass);
          backdrop-filter: blur(8px);
          padding: 8px 12px;
          border-radius: 8px;
          border: 1px solid rgba(255,255,255,0.1);
          border-left: 4px solid ${node.type === 'folder' ? '#06b6d4' : colorStr};
          font-family: var(--font-primary);
          font-size: 13px;
          color: #fff;
          box-shadow: var(--shadow-lg);
          display: flex;
          align-items: center;
          gap: 8px;
          animation: tooltipFadeIn 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        ">
          <div style="width: 8px; height: 8px; border-radius: 50%; background: ${node.type === 'folder' ? '#06b6d4' : colorStr}; box-shadow: 0 0 8px ${node.type === 'folder' ? '#06b6d4' : colorStr};"></div>
          <div style="font-weight: 500;">${node.type === 'folder' ? 'Folder: ' + node.name : node.name}</div>
        </div>
      `;
    })
    .onNodeClick(node => {
      window._currentSelectedNode = node.id;
      
      // Focus camera
      const distance = 80;
      const distRatio = 1 + distance/Math.hypot(node.x, node.y, node.z);
      Graph.cameraPosition(
        { x: node.x * distRatio, y: node.y * distRatio, z: node.z * distRatio },
        node,
        2000
      );
      
      // Load details
      import('../components/detail-panel.js').then(({ showDetailPanel }) => {
        const detailContainer = container.querySelector('#detail-container');
        // Find full file data
        const fullFileData = data.files.find(f => f.id === node.id);
        showDetailPanel(detailContainer, fullFileData, node);
      });
    });

  // Tune Physics for Architectural "City Block" layout
  Graph.d3Force('charge').strength(node => node.type === 'folder' ? -100 : -200);
  Graph.d3Force('charge').distanceMax(300); 
  
  const linkForce = Graph.d3Force('link');
  linkForce.distance(link => {
    if (link.type === 'structure') {
      const sourceGroup = link.source.structGroup || link.source;
      const targetGroup = link.target.structGroup || link.target;
      return sourceGroup === targetGroup ? 30 : 600; // Push cross-module far away
    }
    return 60;
  });
  
  // Prevent cross-module links from dragging clusters together
  linkForce.strength(link => {
    if (link.type === 'structure') {
      const sourceGroup = link.source.structGroup || link.source;
      const targetGroup = link.target.structGroup || link.target;
      return sourceGroup === targetGroup ? 1.0 : 0.02; // Very weak pull for cross-module
    }
    return 1;
  });
  
  // Custom force to pull nodes into their structural groups
  Graph.d3Force('groupClustering', (alpha) => {
    if (activeLayer === 'skeleton') {
      data.graph.nodes.forEach(node => {
        const target = groupCenters[node.structGroup];
        if (target) {
          node.vx += (target.x - node.x) * alpha * 0.15;
          node.vy += (target.y - node.y) * alpha * 0.15;
          node.vz += (target.z - node.z) * alpha * 0.15;
        }
      });
    }
  });

  Graph.d3Force('organClustering', (alpha) => {
    if (activeLayer === 'organs' && window.__organCenters) {
      data.graph.nodes.forEach(node => {
        if (node.organ) {
          const target = window.__organCenters[node.organ.id];
          if (target) {
            node.vx += (target.x - node.x) * alpha * 0.2;
            node.vy += (target.y - node.y) * alpha * 0.2;
            node.vz += (target.z - node.z) * alpha * 0.2;
          }
        }
      });
    }
  });

  const scene = Graph.scene();
  let organSpheres = {};
  let structuralSpheres = {};

  Graph.onEngineTick(() => {
    // Logic for Structural bounding spheres
    if (activeLayer === 'skeleton') {
      if (Object.keys(structuralSpheres).length === 0) {
        Object.keys(structuralGroups).forEach(groupId => {
          if (groupId === 'Root') return; // Don't bound the root
          const geometry = new THREE.SphereGeometry(1, 24, 24);
          const material = new THREE.MeshLambertMaterial({
            color: structuralGroups[groupId].color,
            transparent: true,
            opacity: 0.05, // very subtle glowing bubble
            depthWrite: false,
            side: THREE.BackSide,
            blending: THREE.AdditiveBlending
          });
          const mesh = new THREE.Mesh(geometry, material);
          scene.add(mesh);
          structuralSpheres[groupId] = { mesh, nodes: structuralGroups[groupId].nodes };
        });
      }

      Object.values(structuralSpheres).forEach(sphereData => {
        let minX = Infinity, maxX = -Infinity;
        let minY = Infinity, maxY = -Infinity;
        let minZ = Infinity, maxZ = -Infinity;
        let validNodes = 0;

        sphereData.nodes.forEach(nodeId => {
          const n = data.graph.nodes.find(node => node.id === nodeId);
          if (n && n.x !== undefined) {
            minX = Math.min(minX, n.x); maxX = Math.max(maxX, n.x);
            minY = Math.min(minY, n.y); maxY = Math.max(maxY, n.y);
            minZ = Math.min(minZ, n.z); maxZ = Math.max(maxZ, n.z);
            validNodes++;
          }
        });

        if (validNodes > 0) {
          sphereData.mesh.visible = true;
          const cx = (minX + maxX) / 2;
          const cy = (minY + maxY) / 2;
          const cz = (minZ + maxZ) / 2;
          
          // Use standard deviation for radius to prevent outliers from making massive spheres
          let varX = 0, varY = 0, varZ = 0;
          sphereData.nodes.forEach(nodeId => {
            const n = data.graph.nodes.find(node => node.id === nodeId);
            if (n && n.x !== undefined) {
              varX += Math.pow(n.x - cx, 2);
              varY += Math.pow(n.y - cy, 2);
              varZ += Math.pow(n.z - cz, 2);
            }
          });
          const stdX = Math.sqrt(varX / validNodes);
          const stdY = Math.sqrt(varY / validNodes);
          const stdZ = Math.sqrt(varZ / validNodes);
          
          // Radius based on std deviation keeps it tight around the core cluster
          const radius = Math.max(30, Math.max(stdX, Math.max(stdY, stdZ)) * 2.5);

          sphereData.mesh.position.set(cx, cy, cz);
          sphereData.mesh.scale.set(radius, radius, radius);
        } else {
          sphereData.mesh.visible = false;
        }
      });
    } else {
      Object.values(structuralSpheres).forEach(s => s.mesh.visible = false);
    }

    if (activeLayer === 'disease') {
      const time = Date.now() * 0.005;
      const pulse = 1 + Math.sin(time) * 0.25;
      data.graph.nodes.forEach(n => {
        if (n.healthScore !== undefined && n.healthScore < 50 && n.__threeObj) {
          n.__threeObj.scale.set(pulse, pulse, pulse);
        }
      });
    } else {
      data.graph.nodes.forEach(n => {
        if (n.__threeObj) n.__threeObj.scale.set(1, 1, 1);
      });
    }

    // Logic for Organ bounding spheres
    if (activeLayer === 'organs' && data.organs && data.organs.clusters) {
      // Create spheres if they don't exist
      if (Object.keys(organSpheres).length === 0) {
        data.organs.clusters.forEach(cluster => {
          if (cluster.id === 'other') return; // Don't bound unclassified nodes
          const geometry = new THREE.SphereGeometry(1, 24, 24);
          const material = new THREE.MeshLambertMaterial({
            color: cluster.color,
            transparent: true,
            opacity: 0.1,
            depthWrite: false,
            side: THREE.BackSide,
            blending: THREE.AdditiveBlending
          });
          const mesh = new THREE.Mesh(geometry, material);
          scene.add(mesh);

          const label = new SpriteText(cluster.name);
          label.color = cluster.color;
          label.textHeight = 40;
          label.fontWeight = 'bold';
          label.backgroundColor = 'rgba(0,0,0,0.6)';
          label.padding = 6;
          label.borderRadius = 8;
          scene.add(label);

          organSpheres[cluster.id] = { mesh, label, nodes: cluster.files };
        });
      }

      // Update positions and sizes based on nodes
      Object.values(organSpheres).forEach(organ => {
        let minX = Infinity, maxX = -Infinity;
        let minY = Infinity, maxY = -Infinity;
        let minZ = Infinity, maxZ = -Infinity;
        let validNodes = 0;

        organ.nodes.forEach(nodeId => {
          const n = data.graph.nodes.find(node => node.id === nodeId);
          if (n && n.x !== undefined) {
            minX = Math.min(minX, n.x); maxX = Math.max(maxX, n.x);
            minY = Math.min(minY, n.y); maxY = Math.max(maxY, n.y);
            minZ = Math.min(minZ, n.z); maxZ = Math.max(maxZ, n.z);
            validNodes++;
          }
        });

        if (validNodes > 0) {
          organ.mesh.visible = true;
          organ.label.visible = true;
          const cx = (minX + maxX) / 2;
          const cy = (minY + maxY) / 2;
          const cz = (minZ + maxZ) / 2;
          
          let varX = 0, varY = 0, varZ = 0;
          organ.nodes.forEach(nodeId => {
            const n = data.graph.nodes.find(node => node.id === nodeId);
            if (n && n.x !== undefined) {
              varX += Math.pow(n.x - cx, 2);
              varY += Math.pow(n.y - cy, 2);
              varZ += Math.pow(n.z - cz, 2);
            }
          });
          const stdX = Math.sqrt(varX / validNodes);
          const stdY = Math.sqrt(varY / validNodes);
          const stdZ = Math.sqrt(varZ / validNodes);
          
          const radius = Math.max(40, Math.max(stdX, Math.max(stdY, stdZ)) * 2.5);

          organ.mesh.position.set(cx, cy, cz);
          organ.mesh.scale.set(radius, radius, radius);
          organ.label.position.set(cx, cy + radius + 30, cz);
        } else {
           organ.mesh.visible = false;
           organ.label.visible = false;
        }
      });
    } else {
      // Hide spheres if layer is not active
      Object.values(organSpheres).forEach(organ => {
        organ.mesh.visible = false;
        if (organ.label) organ.label.visible = false;
      });
    }
  });

  let activeLayer = 'skeleton';
  let highlightedNodes = [];
  let heatmapMode = 'none';
  let isolatedNode = null;
  let isolatedNeighbors = new Set();
  
  window.addEventListener('graph:isolate-node', (e) => {
    const nodeId = e.detail.nodeId;
    if (isolatedNode === nodeId) {
      // Toggle off if already isolated
      isolatedNode = null;
      isolatedNeighbors.clear();
    } else {
      isolatedNode = nodeId;
      isolatedNeighbors.clear();
      data.graph.links.forEach(l => {
        const sourceId = l.source.id || l.source;
        const targetId = l.target.id || l.target;
        if (sourceId === nodeId) isolatedNeighbors.add(targetId);
        if (targetId === nodeId) isolatedNeighbors.add(sourceId);
      });
    }
    Graph.nodeThreeObject(node => createNodeObject(node, activeLayer));
    Graph.linkColor(Graph.linkColor()); // Trigger link update
  });

  const createNodeObject = (node, layer) => {
    if (node.type === 'folder') {
      const group = new THREE.Group();
      const radius = node.val || 8;
      const geometry = new THREE.IcosahedronGeometry(radius, 1);
      const material = new THREE.MeshLambertMaterial({
        color: '#06b6d4',
        transparent: true,
        opacity: 0.05,
        depthWrite: false
      });
      const core = new THREE.Mesh(geometry, material);
      group.add(core);

      // Removed SpriteText for folder nodes to save thousands of draw calls and reduce lag
      return group;
    }

    let colorStr = '#9ca3af';
    
    if (highlightedNodes.length > 0) {
      if (highlightedNodes.includes(node.id)) {
        colorStr = '#10b981'; // Emerald glow
      } else {
        colorStr = '#333333'; // Dimmed
      }
    } else if (heatmapMode === 'churn' && node.archaeology) {
      const ratio = node.archaeology.churnRatio || 0;
      colorStr = `hsl(${240 - (ratio * 240)}, 100%, 50%)`;
    } else {
      colorStr = getSemanticColor(node.id, node.name);
      
      if (layer === 'disease') {
        const score = node.healthScore !== undefined ? node.healthScore : 100;
        if (score >= 90) colorStr = '#10b981'; // Green
        else if (score >= 70) colorStr = colorStr; // Normal
        else if (score >= 50) colorStr = '#f59e0b'; // Orange
        else colorStr = '#f43f5e'; // Red
      } else if (layer === 'bloodflow') {
        const hScore = node.hotspotScore || 0;
        if (hScore > 80) colorStr = '#ef4444'; // Radioactive Red
        else if (hScore > 50) colorStr = '#f97316'; // Orange
        else if (hScore > 20) colorStr = '#fbbf24'; // Yellow
        else colorStr = '#1e293b'; // Cold/untouched
      } else if (layer === 'organs' && node.organ) {
        colorStr = node.organ.color;
      }
    }
    
    const group = new THREE.Group();
    
    // Determine size
    let radius = 3;
    if (heatmapMode === 'churn' && node.archaeology) {
      radius = 3 + (node.archaeology.churnRatio * 6);
    } else if (layer === 'bloodflow') {
      const hScore = node.hotspotScore || 0;
      radius = Math.max(3, 3 + (hScore / 6)); // Massive nodes for extreme hotspots
    } else {
      const locScale = Math.log10((node.lines?.total || 10) + 1);
      radius = Math.max(3, locScale * 3);
    }
    
    // Core Geometry (Ultra-Low-Poly Box for Performance)
    const geometry = new THREE.BoxGeometry(radius * 1.5, radius * 1.5, radius * 1.5);
    
    let nodeOpacity = highlightedNodes.length > 0 && !highlightedNodes.includes(node.id) ? 0.1 : 0.9;
    
    if (heatmapMode === 'churn' && node.archaeology && data.archaeology && data.archaeology.scrubPercent !== undefined) {
      const scrubLimit = data.archaeology.scrubPercent / 100;
      if (node.archaeology.churnRatio > scrubLimit && scrubLimit < 1) {
        nodeOpacity = 0.05; // Fade out files more volatile than the scrub threshold
      }
    }

    if (isolatedNode) {
      if (node.id === isolatedNode) nodeOpacity = 1.0;
      else if (isolatedNeighbors.has(node.id)) nodeOpacity = 0.5;
      else nodeOpacity = 0.02;
    }
    
    // Cheaper Lambert Material
    const material = new THREE.MeshLambertMaterial({
      color: colorStr,
      emissive: colorStr,
      emissiveIntensity: (layer === 'disease' && (node.healthScore < 50)) || (layer === 'bloodflow' && (node.hotspotScore || 0) > 50) || highlightedNodes.includes(node.id) || node.id === isolatedNode ? 0.8 : 0.4,
      transparent: true,
      opacity: nodeOpacity
    });
    const core = new THREE.Mesh(geometry, material);
    group.add(core);

    // Completely removed SpriteText for standard files. 
    // Creating a canvas for 1000+ nodes causes massive GPU stalls.
    // Labels are now exclusively handled by the fast HTML tooltips.

    // Floating Text Label
    const sprite = new SpriteText(node.name);
    sprite.color = '#ffffff';
    sprite.textHeight = Math.max(2, radius * 0.8);
    sprite.position.y = radius * 1.5 + sprite.textHeight / 2; 
    if (highlightedNodes.length > 0 && !highlightedNodes.includes(node.id)) {
      sprite.material.opacity = 0.2;
    }
    if (isolatedNode && node.id !== isolatedNode && !isolatedNeighbors.has(node.id)) {
      sprite.material.opacity = 0.02;
    }
    group.add(sprite);

    // Random initial rotation for variety
    group.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
    
    return group;
  };

  // Initial render
  Graph.nodeThreeObject(node => createNodeObject(node, activeLayer));
  
  // Custom link colors for layers
  Graph.linkColor(link => {
    const sourceId = link.source.id || link.source;
    const targetId = link.target.id || link.target;
    
    if (isolatedNode) {
      if (sourceId === isolatedNode || targetId === isolatedNode) {
        return 'rgba(139, 92, 246, 0.8)'; // Bright purple
      }
      return 'rgba(255, 255, 255, 0.02)'; // Invisible
    }

    if (link.type === 'structure' && activeLayer === 'skeleton') {
      const sourceGroup = link.source.structGroup || link.source;
      const targetGroup = link.target.structGroup || link.target;
      return sourceGroup === targetGroup ? 'rgba(6, 182, 212, 0.15)' : 'rgba(244, 63, 94, 0.1)';
    } else if (link.type === 'structure') {
      return 'rgba(6, 182, 212, 0.05)';
    }
    if (activeLayer === 'disease') {
      const s = link.source.healthScore !== undefined ? link.source.healthScore : 100;
      const t = link.target.healthScore !== undefined ? link.target.healthScore : 100;
      if (s < 50 || t < 50) return 'rgba(249, 115, 22, 0.8)'; // Glowing orange for spreading infection
      if (s < 70 || t < 70) return 'rgba(245, 158, 11, 0.3)';
      return 'rgba(255, 255, 255, 0.02)'; // Fade out healthy links
    } else if (activeLayer === 'bloodflow' && link.flowType) {
      // Very faint link color, rely on particles for visual weight
      return 'rgba(255, 255, 255, 0.05)';
    }
    return 'rgba(255, 255, 255, 0.1)';
  });
  
  Graph.linkDirectionalParticles(link => {
    if (link.type === 'structure' && activeLayer === 'skeleton') {
      const sourceGroup = link.source.structGroup || link.source;
      const targetGroup = link.target.structGroup || link.target;
      if (sourceGroup !== targetGroup) return 1; // Pulse cross-module traffic
      return 0;
    }
    if (link.type === 'structure') return 0;
    if (activeLayer === 'bloodflow' && link.flowType && link.flowType !== 'execution') {
      return 3;
    } else if (activeLayer === 'bloodflow') {
      return 2;
    }
    return 0; // Completely off by default to save CPU
  });
  
  Graph.linkDirectionalParticleColor(link => {
    if (activeLayer === 'skeleton') return 'rgba(244, 63, 94, 0.6)'; // Red highway cars
    return activeLayer === 'bloodflow' ? link.particleColor : 'rgba(255,255,255,0.5)';
  });
  
  Graph.linkDirectionalParticleWidth(link => {
    if (activeLayer === 'bloodflow') {
      return (link.flowType && link.flowType !== 'execution') ? 2.5 : 1.0;
    }
    return 1.5;
  });

  // Add ambient and point lights
  scene.add(new THREE.AmbientLight(0x404040, 2));
  const pointLight = new THREE.PointLight(0xffffff, 2, 1000);
  pointLight.position.set(0, 0, 0);
  scene.add(pointLight);

  // Add Cyberpunk Grid Floor
  const gridHelper = new THREE.GridHelper(4000, 40, 0x06b6d4, 0x06b6d4);
  gridHelper.position.y = -800; // Below the graph
  gridHelper.material.opacity = 0.15;
  gridHelper.material.transparent = true;
  scene.add(gridHelper);

  // Setup Bloom Post-Processing
  const bloomPass = new UnrealBloomPass();
  bloomPass.strength = 0.3; // Massively reduced bloom for performance
  bloomPass.radius = 0.5;
  bloomPass.threshold = 0.3;
  Graph.postProcessingComposer().addPass(bloomPass);

  // Handle Resize correctly
  const resizeObserver = new ResizeObserver(entries => {
    for (let entry of entries) {
      const { width, height } = entry.contentRect;
      Graph.width(width);
      Graph.height(height);
    }
  });
  resizeObserver.observe(container);

  // Remove outline
  const canvas = graphContainer.querySelector('canvas');
  if (canvas) canvas.style.outline = 'none';

  // Wire up zoom controls
  const zoomInBtn = container.querySelector('#btn-zoom-in');
  const zoomOutBtn = container.querySelector('#btn-zoom-out');
  const zoomFitBtn = container.querySelector('#btn-zoom-fit');

  // Add hover effects
  [zoomInBtn, zoomOutBtn, zoomFitBtn].forEach(btn => {
    btn.addEventListener('mouseover', () => btn.style.backgroundColor = 'rgba(255,255,255,0.1)');
    btn.addEventListener('mouseout', () => btn.style.backgroundColor = 'transparent');
  });

  zoomInBtn.addEventListener('click', () => {
    const dist = Graph.cameraPosition().z;
    Graph.cameraPosition({ z: dist * 0.8 }, null, 500);
  });

  zoomOutBtn.addEventListener('click', () => {
    const dist = Graph.cameraPosition().z;
    Graph.cameraPosition({ z: dist * 1.2 }, null, 500);
  });

  zoomFitBtn.addEventListener('click', () => {
    Graph.zoomToFit(500, 50);
  });

  // Load toolbar
  window.smri.getSettings().then(settings => {
    import('../components/toolbar.js').then(({ createToolbar }) => {
      createToolbar(container.querySelector('#toolbar-container'), data, settings);
      
      // Handle toolbar actions
      window.addEventListener('toolbar:action', async (e) => {
        const action = e.detail.action;

        if (action === 'btn-layer-skeleton' && activeLayer !== 'skeleton') {
          activeLayer = 'skeleton';
          Graph.nodeThreeObject(node => createNodeObject(node, activeLayer));
          Graph.linkColor(Graph.linkColor()); // Trigger link update
          
        const tDisease = document.getElementById('btn-layer-disease');
        const tOrgans = document.getElementById('btn-layer-organs');
        const tBloodflow = document.getElementById('btn-layer-bloodflow');
        if (tSkeleton) { tSkeleton.style.backgroundColor = 'var(--bg-tertiary)'; tSkeleton.style.color = 'var(--accent-cyan)'; tSkeleton.style.border = '1px solid var(--accent-cyan)'; tSkeleton.style.boxShadow = 'var(--shadow-neon-cyan)'; }
        if (tDisease) { tDisease.style.backgroundColor = 'transparent'; tDisease.style.color = 'var(--text-secondary)'; tDisease.style.border = '1px solid transparent'; tDisease.style.boxShadow = 'none'; }
        if (tOrgans) { tOrgans.style.backgroundColor = 'transparent'; tOrgans.style.color = 'var(--text-secondary)'; tOrgans.style.border = '1px solid transparent'; tOrgans.style.boxShadow = 'none'; }
        if (tBloodflow) { tBloodflow.style.backgroundColor = 'transparent'; tBloodflow.style.color = 'var(--text-secondary)'; tBloodflow.style.border = '1px solid transparent'; tBloodflow.style.boxShadow = 'none'; }
        
        // Reset forces
        Graph.d3Force('charge').strength(-300); 
        Graph.d3Force('link').distance(40);
        Graph.numDimensions(3);
      } 
      else if (action === 'btn-layer-disease' && activeLayer !== 'disease') {
        activeLayer = 'disease';
        Graph.nodeThreeObject(node => createNodeObject(node, activeLayer));
        Graph.linkColor(Graph.linkColor()); // Trigger link update
        Graph.linkDirectionalParticles(Graph.linkDirectionalParticles());

        const tSkeleton = document.getElementById('btn-layer-skeleton');
        const tDisease = document.getElementById('btn-layer-disease');
        const tOrgans = document.getElementById('btn-layer-organs');
        const tBloodflow = document.getElementById('btn-layer-bloodflow');
        if (tSkeleton) { tSkeleton.style.backgroundColor = 'transparent'; tSkeleton.style.color = 'var(--text-secondary)'; tSkeleton.style.border = '1px solid transparent'; tSkeleton.style.boxShadow = 'none'; }
        if (tDisease) { tDisease.style.backgroundColor = 'var(--bg-tertiary)'; tDisease.style.color = 'var(--accent-rose)'; tDisease.style.border = '1px solid var(--accent-rose)'; tDisease.style.boxShadow = 'var(--shadow-neon-violet)'; }
        if (tOrgans) { tOrgans.style.backgroundColor = 'transparent'; tOrgans.style.color = 'var(--text-secondary)'; tOrgans.style.border = '1px solid transparent'; tOrgans.style.boxShadow = 'none'; }
        if (tBloodflow) { tBloodflow.style.backgroundColor = 'transparent'; tBloodflow.style.color = 'var(--text-secondary)'; tBloodflow.style.border = '1px solid transparent'; tBloodflow.style.boxShadow = 'none'; }
        
        // Reset forces
        Graph.d3Force('charge').strength(-300); 
        Graph.d3Force('link').distance(40);
        Graph.numDimensions(3);

        // Load Health Dashboard
        import('../components/health-dashboard.js').then(({ showHealthDashboard }) => {
          showHealthDashboard(container, data);
        });
      }
      else if (action === 'btn-layer-organs' && activeLayer !== 'organs') {
        const tSkeleton = document.getElementById('btn-layer-skeleton');
        const tDisease = document.getElementById('btn-layer-disease');
        const tOrgans = document.getElementById('btn-layer-organs');
        const tBloodflow = document.getElementById('btn-layer-bloodflow');
        
        // Show loading state on button
        if (tOrgans) { tOrgans.style.opacity = '0.5'; tOrgans.style.pointerEvents = 'none'; }

        window.smri.getOrgans(data.projectId).then(organsData => {
          activeLayer = 'organs';
          data.organs = organsData;

          // Add organs data to nodes
          data.graph.nodes.forEach(n => {
            const fileData = data.files.find(f => f.id === n.id);
            if (fileData && organsData.clusters) {
              const organ = organsData.clusters.find(c => c.files.includes(n.id));
              if (organ) {
                n.organ = { id: organ.id, name: organ.name, color: organ.color };
              }
            }
          });

          // Calculate Solar System Centers for Organs
          const organCenters = {};
          const phi = Math.PI * (3 - Math.sqrt(5)); // golden angle
          const validClusters = organsData.clusters.filter(c => c.id !== 'other');
          validClusters.forEach((cluster, i) => {
            const y = 1 - (i / (validClusters.length - 1 || 1)) * 2; // y goes from 1 to -1
            const radius = Math.sqrt(1 - y * y);
            const theta = phi * i;
            organCenters[cluster.id] = {
              x: Math.cos(theta) * radius * 1200,
              y: y * 1000,
              z: Math.sin(theta) * radius * 1200
            };
          });
          window.__organCenters = organCenters;

          Graph.nodeThreeObject(node => createNodeObject(node, activeLayer));
          Graph.linkColor(Graph.linkColor()); // Trigger link update
          Graph.linkDirectionalParticles(Graph.linkDirectionalParticles());
          
          if (tSkeleton) { tSkeleton.style.backgroundColor = 'transparent'; tSkeleton.style.color = 'var(--text-secondary)'; tSkeleton.style.border = '1px solid transparent'; tSkeleton.style.boxShadow = 'none'; }
          if (tDisease) { tDisease.style.backgroundColor = 'transparent'; tDisease.style.color = 'var(--text-secondary)'; tDisease.style.border = '1px solid transparent'; tDisease.style.boxShadow = 'none'; }
          if (tBloodflow) { tBloodflow.style.backgroundColor = 'transparent'; tBloodflow.style.color = 'var(--text-secondary)'; tBloodflow.style.border = '1px solid transparent'; tBloodflow.style.boxShadow = 'none'; }
          if (tOrgans) { 
            tOrgans.style.opacity = '1'; 
            tOrgans.style.pointerEvents = 'auto';
            tOrgans.style.backgroundColor = 'var(--bg-tertiary)'; 
            tOrgans.style.color = 'var(--accent-emerald)'; 
            tOrgans.style.border = '1px solid var(--accent-emerald)'; 
            tOrgans.style.boxShadow = '0 0 15px rgba(16, 185, 129, 0.4)'; 
          }
          
          // Apply custom organ clustering force if possible
          // We can push nodes of the same organ together, and different organs apart
          Graph.d3Force('charge').strength(node => -300); // Push apart strongly
          Graph.d3Force('link').distance(link => {
            if (link.source.organ && link.target.organ && link.source.organ.id === link.target.organ.id) {
              return 20; // Same organ nodes stay very close
            }
            return 150; // Different organs push far apart
          });
          
          // Reheat the simulation to allow nodes to separate
          Graph.numDimensions(3); // Reset
          
          // Zoom out slightly to see all the planets
          Graph.cameraPosition({ z: 2500 }, null, 1500);

        }).catch(err => {
          if (tOrgans) { tOrgans.style.opacity = '1'; tOrgans.style.pointerEvents = 'auto'; }
          console.error("Failed to fetch organs:", err);
          alert("Failed to analyze organs: " + err.message);
        });
      }
      else if (action === 'btn-layer-bloodflow' && activeLayer !== 'bloodflow') {
        const tSkeleton = document.getElementById('btn-layer-skeleton');
        const tDisease = document.getElementById('btn-layer-disease');
        const tOrgans = document.getElementById('btn-layer-organs');
        const tBloodflow = document.getElementById('btn-layer-bloodflow');

        // Show loading state
        if (tBloodflow) { tBloodflow.style.opacity = '0.5'; tBloodflow.style.pointerEvents = 'none'; }

        window.smri.getBloodFlow(data.projectId).then(bloodData => {
          activeLayer = 'bloodflow';
          data.bloodFlow = bloodData.bloodFlow;
          
          // Re-sync Graph links because backend modified them with particleColor and flowType
          // Note: we can map the new properties to existing graph links
          const newLinks = bloodData.graph.links;
          data.graph.links.forEach(l => {
            const nl = newLinks.find(x => (x.source === l.source.id || x.source === l.source) && (x.target === l.target.id || x.target === l.target));
            if (nl) {
              l.flowType = nl.flowType;
              l.particleColor = nl.particleColor;
            }
          });

          Graph.nodeThreeObject(node => createNodeObject(node, activeLayer));
          Graph.linkColor(Graph.linkColor()); 
          Graph.linkDirectionalParticles(Graph.linkDirectionalParticles());
          
          if (tSkeleton) { tSkeleton.style.backgroundColor = 'transparent'; tSkeleton.style.color = 'var(--text-secondary)'; tSkeleton.style.border = '1px solid transparent'; tSkeleton.style.boxShadow = 'none'; }
          if (tDisease) { tDisease.style.backgroundColor = 'transparent'; tDisease.style.color = 'var(--text-secondary)'; tDisease.style.border = '1px solid transparent'; tDisease.style.boxShadow = 'none'; }
          if (tOrgans) { tOrgans.style.backgroundColor = 'transparent'; tOrgans.style.color = 'var(--text-secondary)'; tOrgans.style.border = '1px solid transparent'; tOrgans.style.boxShadow = 'none'; }
          if (tBloodflow) { 
            tBloodflow.style.opacity = '1'; 
            tBloodflow.style.pointerEvents = 'auto';
            tBloodflow.style.backgroundColor = 'var(--bg-tertiary)'; 
            tBloodflow.style.color = '#8b5cf6'; // Purple
            tBloodflow.style.border = '1px solid #8b5cf6'; 
            tBloodflow.style.boxShadow = '0 0 15px rgba(139, 92, 246, 0.4)'; 
          }

          // Reset forces
          Graph.d3Force('charge').strength(-300); 
          Graph.d3Force('link').distance(40);
          Graph.numDimensions(3);
        }).catch(err => {
          if (tBloodflow) { tBloodflow.style.opacity = '1'; tBloodflow.style.pointerEvents = 'auto'; }
          console.error("Failed to fetch blood flow:", err);
          alert("Failed to analyze blood flow: " + err.message);
        });
      }
      else if (action === 'btn-export') {
        import('../components/share-button.js').then(({ exportCanvasAsPNG }) => {
          exportCanvasAsPNG(Graph);
        });
      }
      else if (action === 'btn-settings') {
        import('../components/llm-setup.js').then(({ showLLMSetup }) => {
          showLLMSetup(document.body);
        });
      }
      else if (action === 'btn-search') {
        import('../components/search-modal.js').then(({ showSearchModal }) => {
          showSearchModal(container, data.graph.nodes, (selectedNode) => {
            // Highlight the node
            highlightedNodes = [selectedNode.id];
            Graph.nodeThreeObject(node => createNodeObject(node, activeLayer));
            
            // Fly camera to node
            const distance = 80;
            const distRatio = 1 + distance/Math.hypot(selectedNode.x, selectedNode.y, selectedNode.z);
            Graph.cameraPosition(
              { x: selectedNode.x * distRatio, y: selectedNode.y * distRatio, z: selectedNode.z * distRatio },
              selectedNode,
              1500
            );
            
            // Open detail panel
            import('../components/detail-panel.js').then(({ showDetailPanel }) => {
              const detailContainer = container.querySelector('#detail-container');
              const fullFileData = data.files.find(f => f.id === selectedNode.id);
              showDetailPanel(detailContainer, fullFileData, selectedNode);
            });
          });
        });
      }
      else if (action === 'btn-brain') {
        if (!settings.isPro && settings.llmProvider === 'none') {
          alert("AI Brain is locked. Please configure a Bring-Your-Own-Key provider in Settings, or Upgrade to Pro for the built-in model.");
          return;
        }
        import('../components/chat.js').then(({ showChatPanel }) => {
          showChatPanel(container, data.projectId, (nodeIds) => {
            highlightedNodes = nodeIds || [];
            Graph.nodeThreeObject(node => createNodeObject(node, activeLayer));
            
            // Fly to the first highlighted node if available
            if (highlightedNodes.length > 0) {
              const targetNode = data.graph.nodes.find(n => n.id === highlightedNodes[0]);
              if (targetNode) {
                const distance = 80;
                const distRatio = 1 + distance/Math.hypot(targetNode.x, targetNode.y, targetNode.z);
                Graph.cameraPosition(
                  { x: targetNode.x * distRatio, y: targetNode.y * distRatio, z: targetNode.z * distRatio },
                  targetNode,
                  1500
                );
              }
            }
          });
        });
      }
      else if (action === 'btn-timeline') {
        import('../components/timeline.js').then(({ showTimeline }) => {
          showTimeline(container, data.projectId, data, (mode, archData) => {
             heatmapMode = mode;
             Graph.nodeThreeObject(node => createNodeObject(node, activeLayer));
          });
        });
      }
      else if (action === 'btn-home') {
        // Unmount graph
        Graph._destructor();
        
        // Return to dashboard
        import('./dashboard.js').then(({ showDashboardScreen }) => {
          const mainContent = document.getElementById('main-content');
          mainContent.innerHTML = '';
          showDashboardScreen(mainContent);
        });
      }
    });
  });
});
}
