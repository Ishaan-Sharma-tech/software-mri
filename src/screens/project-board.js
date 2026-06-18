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
            <div>
              <div style="display: inline-flex; align-items: center; gap: 8px; padding: 4px 8px; background: rgba(16, 185, 129, 0.1); color: var(--accent-emerald); border-radius: 4px; font-size: 12px; font-weight: 600; margin-bottom: 16px;">
                Analysis Complete
              </div>
              <h1 style="font-size: 36px; font-weight: 700; color: var(--text-primary); letter-spacing: -0.02em; margin-bottom: 8px;">${projectName}</h1>
              <p style="color: var(--text-secondary); font-size: 16px;">${files.length} files • Analyzed just now</p>
            </div>
            
            <button id="btn-enter-3d" style="background: var(--text-primary); color: var(--bg-primary); border: none; padding: 16px 32px; border-radius: var(--radius-full); font-size: 16px; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 12px; transition: transform 0.2s;">
              Enter 3D MRI
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"></path></svg>
            </button>
          </div>

          <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; margin-bottom: 48px;">
            
            <!-- Health Score -->
            <div class="stat-card" style="background: var(--bg-secondary); border: 1px solid var(--border-default); border-radius: var(--radius-lg); padding: 32px; transition: all 0.3s ease;">
              <h3 style="color: var(--text-secondary); font-size: 14px; font-weight: 500; margin-bottom: 24px;">Overall Code Health</h3>
              <div style="display: flex; align-items: baseline; gap: 8px;">
                <span style="font-size: 48px; font-weight: 800; color: var(--text-primary); letter-spacing: -0.04em;">${avgHealth}</span>
                <span style="color: var(--text-muted); font-size: 16px;">/ 100</span>
              </div>
              <p style="color: ${healthColor}; font-size: 14px; margin-top: 12px; font-weight: 500;">${healthLabel}</p>
            </div>

            <!-- Architecture -->
            <div class="stat-card" style="background: var(--bg-secondary); border: 1px solid var(--border-default); border-radius: var(--radius-lg); padding: 32px; transition: all 0.3s ease;">
              <h3 style="color: var(--text-secondary); font-size: 14px; font-weight: 500; margin-bottom: 24px;">Top Domains</h3>
              <div style="display: flex; flex-direction: column; gap: 16px;">
                ${domainsHtml}
              </div>
            </div>

            <!-- Stats -->
            <div class="stat-card" style="background: var(--bg-secondary); border: 1px solid var(--border-default); border-radius: var(--radius-lg); padding: 32px; transition: all 0.3s ease;">
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

        </div>
      </div>
    </div>
  `;

  // Hover styles
  const style = document.createElement('style');
  style.textContent = `
    #btn-enter-3d:hover { transform: scale(1.05); }
    #btn-back:hover { color: var(--text-primary) !important; }
    .stat-card:hover { border-color: var(--text-primary); background: var(--bg-tertiary); transform: translateY(-4px); box-shadow: var(--shadow-sm); }
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
}
