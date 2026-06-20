export function showProjectBoard(container, data) {
  // Calculate real metrics from the analyzed data
  const nodes = data.graph?.nodes || [];
  const links = data.graph?.links || [];
  
  // Overall Health Score
  const avgHealth = data.health?.score !== undefined ? data.health.score : 100;
  let hotspots = 0;
  const files = data.files || [];
  files.forEach(f => {
    if (f.healthScore < 70) hotspots++;
  });

  // Health label
  let healthLabel = 'Excellent condition';
  let healthColor = 'var(--accent-emerald)';
  if (avgHealth < 70) {
    healthLabel = 'Needs refactoring';
    healthColor = 'var(--accent-rose)';
  } else if (avgHealth < 90) {
    healthLabel = 'Moderate tech debt';
    healthColor = 'var(--accent-amber)';
  }

  // Top Domains (Directory based)
  const domainCounts = {};
  files.forEach(f => {
    if (!f.path) return;
    // Get relative path by removing projectPath
    let relPath = f.path;
    if (data.projectPath && relPath.startsWith(data.projectPath)) {
      relPath = relPath.substring(data.projectPath.length);
    }
    relPath = relPath.replace(/\\/g, '/').replace(/^\/+/, '');
    const parts = relPath.split('/');
    const domain = parts.length > 1 ? parts[0] : 'Root';
    domainCounts[domain] = (domainCounts[domain] || 0) + 1;
  });

  const colors = ['#38bdf8', '#818cf8', '#a78bfa', '#f472b6', '#fb923c'];
  const topDomains = Object.entries(domainCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([name, count], idx) => {
      const pct = Math.round((count / files.length) * 100) || 0;
      return { name, pct, color: colors[idx % colors.length] };
    });

  let domainsHtml = topDomains.map(d => `
    <div>
      <div style="display: flex; justify-content: space-between; font-size: 14px; margin-bottom: 8px;">
        <span style="color: var(--text-primary);">${d.name}</span>
        <span style="color: var(--text-secondary);">${d.pct}%</span>
      </div>
      <div style="height: 4px; background: var(--bg-tertiary); border-radius: 2px; overflow: hidden;">
        <div style="width: ${d.pct}%; height: 100%; background: ${d.color};"></div>
      </div>
    </div>
  `).join('');

  if (!domainsHtml) {
    domainsHtml = `<p style="color: var(--text-muted); font-size: 14px;">Not enough data for semantic domains.</p>`;
  }

  // Total lines
  let totalLines = data.stats?.totalLines || 0;
  if (!totalLines && files.length > 0) {
    files.forEach(f => {
      if (f.lines && f.lines.total) {
        totalLines += f.lines.total;
      }
    });
  }

  // Pathology Report Table
  const issues = data.health?.issues || [];
  let pathologyHtml = '';
  
  if (issues.length === 0) {
    pathologyHtml = `<div style="padding: 32px; text-align: center; color: var(--text-muted); font-size: 14px; background: var(--bg-tertiary); border-radius: var(--radius-md);">No pathologies detected. Your codebase is in excellent health.</div>`;
  } else {
    // Sort critical first
    issues.sort((a, b) => (a.type === 'critical' ? -1 : 1));
    
    pathologyHtml = `
      <div style="background: var(--bg-secondary); border: 1px solid var(--border-default); border-radius: var(--radius-lg); overflow: hidden; -webkit-mask-image: linear-gradient(90deg, transparent 0%, black 5%, black 95%, transparent 100%); mask-image: linear-gradient(90deg, transparent 0%, black 5%, black 95%, transparent 100%);">
        <div style="padding: 24px 32px; border-bottom: 1px solid var(--border-default); display: flex; justify-content: space-between; align-items: center;">
          <h3 style="color: var(--text-primary); font-size: 18px; font-weight: 600;">Pathology Report</h3>
          <span style="background: rgba(244, 63, 94, 0.1); color: var(--accent-rose); padding: 4px 12px; border-radius: var(--radius-full); font-size: 12px; font-weight: 600;">
            ${issues.length} Issues Detected
          </span>
        </div>
        <div style="max-height: 400px; overflow-y: auto;">
          <table style="width: 100%; border-collapse: collapse; text-align: left;">
            <thead style="background: var(--bg-tertiary); position: sticky; top: 0;">
              <tr>
                <th style="padding: 16px 32px; color: var(--text-secondary); font-weight: 500; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 1px solid var(--border-default);">Severity</th>
                <th style="padding: 16px 32px; color: var(--text-secondary); font-weight: 500; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 1px solid var(--border-default);">Diagnosis (Code Smell)</th>
                <th style="padding: 16px 32px; color: var(--text-secondary); font-weight: 500; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 1px solid var(--border-default);">Location</th>
              </tr>
            </thead>
            <tbody>
              ${issues.map(issue => `
                <tr style="border-bottom: 1px solid var(--border-default); background: var(--bg-primary); transition: background 0.2s;" onmouseover="this.style.background='var(--bg-tertiary)'" onmouseout="this.style.background='var(--bg-primary)'">
                  <td style="padding: 16px 32px; vertical-align: top;">
                    <span style="display: inline-block; padding: 4px 8px; border-radius: 4px; font-size: 11px; font-weight: 600; text-transform: uppercase; ${issue.type === 'critical' ? 'background: rgba(244, 63, 94, 0.1); color: var(--accent-rose);' : 'background: rgba(243, 156, 18, 0.1); color: var(--accent-amber);'}">
                      ${issue.type}
                    </span>
                  </td>
                  <td style="padding: 16px 32px; color: var(--text-primary); font-size: 14px; line-height: 1.5; vertical-align: top;">
                    ${issue.message}
                  </td>
                  <td style="padding: 16px 32px; color: var(--text-secondary); font-size: 13px; font-family: monospace; vertical-align: top;">
                    ${issue.fileId}
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  // Tech Stack Badges
  const extensions = new Set();
  files.forEach(f => {
    const extMatch = f.name.match(/\.([a-z0-9]+)$/i);
    if (extMatch) extensions.add(extMatch[1].toLowerCase());
  });
  const techStack = Array.from(extensions).filter(e => ['js', 'ts', 'jsx', 'tsx', 'py', 'go', 'rs', 'java', 'html', 'css', 'json', 'md'].includes(e)).slice(0, 8);
  const techHtml = techStack.map(t => `<span style="padding: 4px 12px; background: var(--bg-tertiary); border: 1px solid var(--border-default); border-radius: 16px; font-size: 12px; color: var(--text-primary); text-transform: uppercase; font-weight: 600;">${t}</span>`).join('');

  // Project Folder Structure (Detailed Tree)
  const treeNodes = {};
  files.forEach(f => {
    let relPath = f.path;
    if (data.projectPath && relPath.startsWith(data.projectPath)) {
      relPath = relPath.substring(data.projectPath.length);
    }
    relPath = relPath.replace(/\\/g, '/').replace(/^\/+/, '');
    const parts = relPath.split('/');
    
    let current = treeNodes;
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      if (!current[part]) {
        current[part] = (i === parts.length - 1) ? null : {}; // null means file
      }
      current = current[part];
    }
  });

  function renderTree(node, depth = 0) {
    if (!node) return '';
    let html = '';
    const keys = Object.keys(node).sort((a, b) => {
      const aIsFolder = node[a] !== null;
      const bIsFolder = node[b] !== null;
      if (aIsFolder && !bIsFolder) return -1;
      if (!aIsFolder && bIsFolder) return 1;
      return a.localeCompare(b);
    });

    keys.forEach(k => {
      const isFolder = node[k] !== null;
      const padding = depth === 0 ? 0 : 16;
      if (isFolder) {
        html += `
          <details style="margin-left: ${padding}px; margin-bottom: 4px;" ${depth === 0 ? 'open' : ''}>
            <summary style="cursor: pointer; color: var(--text-primary); font-family: monospace; font-size: 13px; list-style: none; display: flex; align-items: center; gap: 6px; padding: 4px 0;">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>
              ${k}/
            </summary>
            <div style="margin-top: 2px;">
              ${renderTree(node[k], depth + 1)}
            </div>
          </details>
        `;
      } else {
        html += `
          <div class="tree-file" style="margin-left: ${padding + 16}px; margin-bottom: 4px; padding: 2px 0; color: var(--text-secondary); font-family: monospace; font-size: 13px; display: flex; align-items: center; gap: 6px;">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path><polyline points="13 2 13 9 20 9"></polyline></svg>
            ${k}
          </div>
        `;
      }
    });
    return html;
  }
  
  let treeHtml = renderTree(treeNodes);
  if (!treeHtml) treeHtml = `<div style="color: var(--text-muted); font-size: 14px;">Flat directory structure</div>`;

  const projectName = data.projectPath ? data.projectPath.split(/[\\/]/).pop() : 'express-demo';

  // Clear container
  container.innerHTML = `
    <div style="height: 100vh; width: 100vw; background: var(--bg-primary); display: flex; flex-direction: column;">
      
      <!-- Top Nav -->
      <div style="padding: 24px 48px; display: flex; align-items: center; border-bottom: 1px solid var(--border-default);">
        <button id="btn-back" style="background: none; border: none; color: var(--text-secondary); cursor: pointer; display: flex; align-items: center; gap: 8px; font-size: 14px; font-weight: 500;">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 12H5M12 19l-7-7 7-7"></path></svg>
          Back to Dashboard
        </button>
      </div>

      <!-- Main Content -->
      <div style="flex: 1; padding: 48px; overflow-y: auto;">
        <div style="max-width: 1200px; margin: 0 auto;">
          
          <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 48px;">
            <div class="fade-panel header-panel">
              <div style="display: inline-flex; align-items: center; gap: 8px; padding: 4px 8px; background: rgba(16, 185, 129, 0.1); color: var(--accent-emerald); border-radius: 4px; font-size: 12px; font-weight: 600; margin-bottom: 16px;">
                Analysis Complete
              </div>
              <h1 style="font-size: 36px; font-weight: 700; color: var(--text-primary); letter-spacing: -0.02em; margin-bottom: 8px;">${projectName}</h1>
              <p style="color: var(--text-secondary); font-size: 16px; margin-bottom: 16px;">${files.length} files • Analyzed just now</p>
              <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                ${techHtml}
              </div>
            </div>
            
            <button id="btn-enter-3d" style="background: var(--text-primary); color: var(--bg-primary); border: none; padding: 16px 32px; border-radius: var(--radius-full); font-size: 16px; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 12px; transition: transform 0.2s;">
              Enter 3D MRI
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"></path></svg>
            </button>
          </div>

          <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; margin-bottom: 48px; -webkit-mask-image: linear-gradient(90deg, transparent 0%, black 5%, black 95%, transparent 100%); mask-image: linear-gradient(90deg, transparent 0%, black 5%, black 95%, transparent 100%); padding: 0 16px;">
            
            <!-- Health Score -->
            <div class="stat-card fade-panel" style="background: var(--bg-secondary); border: 1px solid var(--border-default); border-radius: var(--radius-lg); padding: 32px;">
              <h3 style="color: var(--text-secondary); font-size: 14px; font-weight: 500; margin-bottom: 24px;">Overall Code Health</h3>
              <div style="display: flex; align-items: baseline; gap: 8px;">
                <span style="font-size: 48px; font-weight: 800; color: var(--text-primary); letter-spacing: -0.04em;">${avgHealth}</span>
                <span style="color: var(--text-muted); font-size: 16px;">/ 100</span>
              </div>
              <p style="color: ${healthColor}; font-size: 14px; margin-top: 12px; font-weight: 500;">${healthLabel}</p>
            </div>

            <!-- Architecture -->
            <div class="stat-card fade-panel" style="background: var(--bg-secondary); border: 1px solid var(--border-default); border-radius: var(--radius-lg); padding: 32px;">
              <h3 style="color: var(--text-secondary); font-size: 14px; font-weight: 500; margin-bottom: 24px;">Top Domains</h3>
              <div style="display: flex; flex-direction: column; gap: 16px;">
                ${domainsHtml}
              </div>
            </div>

            <!-- Stats -->
            <div class="stat-card fade-panel" style="background: var(--bg-secondary); border: 1px solid var(--border-default); border-radius: var(--radius-lg); padding: 32px;">
              <h3 style="color: var(--text-secondary); font-size: 14px; font-weight: 500; margin-bottom: 24px;">Project Stats</h3>
              <div style="display: flex; flex-direction: column; gap: 16px;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                  <span style="color: var(--text-secondary); font-size: 14px;">Total Lines of Code</span>
                  <span style="color: var(--text-primary); font-weight: 500;">${totalLines.toLocaleString()}</span>
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center;">
                  <span style="color: var(--text-secondary); font-size: 14px;">Total Dependencies</span>
                  <span style="color: var(--text-primary); font-weight: 500;">${links.length.toLocaleString()}</span>
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center;">
                  <span style="color: var(--text-secondary); font-size: 14px;">Complexity Hotspots</span>
                  <span style="color: var(--accent-amber); font-weight: 500;">${hotspots}</span>
                </div>
              </div>
            </div>

          </div>

          <!-- Executive Summary & Folder Structure -->
          <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 24px; margin-bottom: 48px; -webkit-mask-image: linear-gradient(90deg, transparent 0%, black 5%, black 95%, transparent 100%); mask-image: linear-gradient(90deg, transparent 0%, black 5%, black 95%, transparent 100%); padding: 0 16px;">
            <!-- Exec Summary -->
            <div class="hover-reveal-panel fade-panel" style="background: var(--bg-secondary); border: 1px solid var(--border-default); border-radius: var(--radius-lg); padding: 32px;">
              <h3 style="color: var(--text-primary); font-size: 18px; font-weight: 600; margin-bottom: 16px; display: flex; align-items: center; gap: 8px;">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent-fuchsia)" stroke-width="2"><path d="M12 2L2 22h20L12 2z"/></svg>
                Detailed Summary
              </h3>
              <div id="exec-summary-content" style="color: var(--text-primary); font-size: 15px; line-height: 1.6;">
                <span style="color: var(--text-muted);">Checking LLM connection...</span>
              </div>
            </div>

            <!-- Folder Structure -->
            <div class="hover-reveal-panel fade-panel" style="background: var(--bg-secondary); border: 1px solid var(--border-default); border-radius: var(--radius-lg); padding: 32px; max-height: 400px; overflow-y: auto;">
              <h3 style="color: var(--text-primary); font-size: 16px; font-weight: 600; margin-bottom: 16px;">Detailed Project Structure</h3>
              ${treeHtml}
            </div>
          </div>

          <!-- Pathology Report -->
          <div style="margin-bottom: 48px;">
            ${pathologyHtml}
          </div>

        </div>
      </div>
    </div>
  `;

  // Hover styles
  const style = document.createElement('style');
  style.textContent = `
    #btn-enter-3d:hover { transform: scale(1.05); }
    #btn-back:hover { color: var(--text-primary) !important; }
    
    /* Fade interactions - GPU Accelerated to prevent blinking */
    .fade-panel {
      position: relative;
      opacity: 0.4;
      transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
      will-change: opacity, transform, box-shadow;
      transform: translateZ(0);
    }
    
    /* Extend the hover hit-box downwards so the mouse doesn't slip off when translating UP */
    .fade-panel::after {
      content: '';
      position: absolute;
      bottom: -10px; left: 0; right: 0; height: 10px;
      background: transparent;
      z-index: -1;
    }

    .fade-panel:hover { 
      opacity: 1; 
      transform: translateY(-6px) translateZ(0);
    }
    
    /* Only cards and panels get border/bg highlights, not the bare header text */
    .stat-card.fade-panel:hover, .hover-reveal-panel.fade-panel:hover { 
      border-color: var(--text-primary); 
      background: var(--bg-tertiary); 
      box-shadow: 0 12px 40px rgba(0, 0, 0, 0.4), 0 0 20px rgba(6, 182, 212, 0.1); 
    }
    
    .tree-file:hover { color: var(--text-primary) !important; background: rgba(255,255,255,0.05); }
  `;
  document.head.appendChild(style);

  // Events
  container.querySelector('#btn-back').addEventListener('click', () => {
    import('./dashboard.js').then(({ showDashboardScreen }) => {
      showDashboardScreen(container);
    });
  });

  container.querySelector('#btn-enter-3d').addEventListener('click', () => {
    import('./explorer.js').then(({ initGraph }) => {
      initGraph(container, data);
    });
  });

  // Generate Exec Summary
  setTimeout(async () => {
    const summaryContainer = document.getElementById('exec-summary-content');
    if (!summaryContainer) return;
    try {
      const conn = await window.smri.testConnection();
      if (conn.success) {
        summaryContainer.innerHTML = '<span style="color: var(--text-muted);">Analyzing architecture and generating detailed summary...</span>';
        const result = await window.smri.queryBrain(data.projectId, "Please provide a detailed, professional executive summary of this software project based on its architecture and files. Include an overview of its purpose, the primary technologies used, and its structural organization. Do not use any markdown or special characters. Write 2-3 well-structured paragraphs.");
        
        // Format into paragraphs
        const paragraphs = result.answer.split('\n').filter(p => p.trim() !== '').map(p => `<p style="margin-bottom: 12px;">${p}</p>`).join('');
        summaryContainer.innerHTML = paragraphs;
      } else {
        summaryContainer.innerHTML = '<span style="color: var(--text-muted);">Connect an LLM via the Dashboard Settings to generate an automatic detailed summary.</span>';
      }
    } catch (e) {
      summaryContainer.innerHTML = '<span style="color: var(--text-muted);">Connect an LLM via the Dashboard Settings to generate an automatic detailed summary.</span>';
    }
  }, 0);
}
