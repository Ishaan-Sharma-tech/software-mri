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
  
  // Neon colors for extensions
  const colorMap = {
    '.js': '#fcd34d',   // Amber
    '.ts': '#38bdf8',   // Light Blue
    '.jsx': '#fbbf24',  // Yellow
    '.tsx': '#0ea5e9',  // Sky Blue
    '.html': '#fb923c', // Orange
    '.css': '#c084fc',  // Purple
    '.py': '#60a5fa',   // Blue
    '.rs': '#f87171',   // Red
    '.go': '#2dd4bf',   // Teal
    '.json': '#a3e635'  // Lime
  };

  // Build graph
  const Graph = ForceGraph3D({
    extraRenderers: [],
    rendererConfig: { preserveDrawingBuffer: true, alpha: true, antialias: false }
  })(graphContainer)
    .graphData(data.graph)
    .backgroundColor('rgba(0,0,0,0)') 
    .linkColor(link => link.type === 'structure' ? 'rgba(6, 182, 212, 0.05)' : 'rgba(255, 255, 255, 0.15)')
    .linkWidth(link => link.type === 'structure' ? 0.1 : 0.5)
    .linkDirectionalParticles(0) // Disabled by default for performance
    .linkDirectionalParticleWidth(1.0)
    .linkDirectionalParticleSpeed(0.003)
    .enableNodeDrag(false)
    .showNavInfo(false)
    .nodeLabel(node => {
      const ext = node.name.match(/\.[0-9a-z]+$/i);
      const colorStr = (ext && colorMap[ext[0].toLowerCase()]) ? colorMap[ext[0].toLowerCase()] : '#9ca3af';
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

  // Tune Physics for "Organic Galaxy" layout
  Graph.d3Force('charge').strength(node => node.type === 'folder' ? -800 : -200); // Stronger repulsion for clusters
  Graph.d3Force('charge').distanceMax(400); // Cut off repulsion to keep galaxies tight
  Graph.d3Force('link').distance(link => link.type === 'structure' ? 10 : 60); // Shorter links to pull connected things tighter

  let activeLayer = 'skeleton';
  let highlightedNodes = [];
  let heatmapMode = 'none';

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
      const ext = node.name.match(/\.[0-9a-z]+$/i);
      colorStr = (ext && colorMap[ext[0].toLowerCase()]) ? colorMap[ext[0].toLowerCase()] : '#9ca3af';
      
      // In Disease Layer, override color based on health
      if (layer === 'disease') {
        const score = node.healthScore !== undefined ? node.healthScore : 100;
        if (score >= 90) colorStr = '#10b981'; // Green
        else if (score >= 70) colorStr = colorStr; // Normal
        else if (score >= 50) colorStr = '#f59e0b'; // Orange
        else colorStr = '#f43f5e'; // Red
      } else if (layer === 'organs' && node.organ) {
        colorStr = node.organ.color;
      }
    }
    
    const group = new THREE.Group();
    
    // Determine size
    let radius = 3;
    if (heatmapMode === 'churn' && node.archaeology) {
      radius = 3 + (node.archaeology.churnRatio * 6);
    } else {
      const locScale = Math.log10((node.lines?.total || 10) + 1);
      radius = Math.max(3, locScale * 3);
    }
    
    // Core Geometry (Ultra-Low-Poly Box for Performance)
    const geometry = new THREE.BoxGeometry(radius * 1.5, radius * 1.5, radius * 1.5);
    
    // Cheaper Lambert Material
    const material = new THREE.MeshLambertMaterial({
      color: colorStr,
      emissive: colorStr,
      emissiveIntensity: (layer === 'disease' && (node.healthScore < 50)) || highlightedNodes.includes(node.id) ? 0.8 : 0.4,
      transparent: true,
      opacity: highlightedNodes.length > 0 && !highlightedNodes.includes(node.id) ? 0.1 : 0.9
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
    group.add(sprite);

    // Random initial rotation for variety
    group.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
    
    return group;
  };

  // Initial render
  Graph.nodeThreeObject(node => createNodeObject(node, activeLayer));
  
  // Custom link colors for Disease layer and Blood Flow
  Graph.linkColor(link => {
    if (link.type === 'structure') return 'rgba(6, 182, 212, 0.05)';
    if (activeLayer === 'disease') {
      const s = link.source.healthScore !== undefined ? link.source.healthScore : 100;
      const t = link.target.healthScore !== undefined ? link.target.healthScore : 100;
      if (s < 50 || t < 50) return 'rgba(244, 63, 94, 0.4)';
      if (s < 70 || t < 70) return 'rgba(245, 158, 11, 0.2)';
    } else if (activeLayer === 'bloodflow' && link.flowType) {
      // Very faint link color, rely on particles for visual weight
      return 'rgba(255, 255, 255, 0.05)';
    }
    return 'rgba(255, 255, 255, 0.1)';
  });
  
  Graph.linkDirectionalParticles(link => {
    if (link.type === 'structure') return 0;
    if (activeLayer === 'bloodflow' && link.flowType && link.flowType !== 'execution') {
      return 3;
    } else if (activeLayer === 'bloodflow') {
      return 2;
    }
    return 0; // Completely off by default to save CPU
  });
  
  Graph.linkDirectionalParticleColor(link => {
    return activeLayer === 'bloodflow' ? link.particleColor : 'rgba(255,255,255,0.5)';
  });
  
  Graph.linkDirectionalParticleWidth(link => {
    if (activeLayer === 'bloodflow') {
      return (link.flowType && link.flowType !== 'execution') ? 2.5 : 1.0;
    }
    return 1.5;
  });

  // Add ambient and point lights
  const scene = Graph.scene();
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
  import('../components/toolbar.js').then(({ createToolbar }) => {
    createToolbar(container.querySelector('#toolbar-container'), data);
    
    // Handle toolbar actions
    window.addEventListener('toolbar:action', (e) => {
      const action = e.detail.action;
      if (action === 'btn-layer-skeleton' && activeLayer !== 'skeleton') {
        activeLayer = 'skeleton';
        Graph.nodeThreeObject(node => createNodeObject(node, activeLayer));
        Graph.linkColor(Graph.linkColor()); // Trigger link update
        
        // Update toolbar styles
        const tSkeleton = document.getElementById('btn-layer-skeleton');
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
}
