export function createProgressOverlay(container) {
  const overlay = document.createElement('div');
  overlay.className = 'progress-overlay';
  overlay.style.cssText = `
    position: absolute;
    top: 0; left: 0; right: 0; bottom: 0;
    background: var(--bg-glass);
    backdrop-filter: blur(8px);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    z-index: var(--z-modal);
    transition: opacity var(--transition-normal);
  `;

  overlay.innerHTML = `
    <div style="background: var(--bg-secondary); padding: 40px; border-radius: var(--radius-lg); border: 1px solid var(--border-default); box-shadow: var(--shadow-lg); max-width: 500px; width: 100%;">
      <h3 id="progress-title" style="margin-bottom: 20px; font-weight: 600;">Scanning Codebase...</h3>
      
      <div style="height: 6px; background: var(--bg-tertiary); border-radius: var(--radius-full); overflow: hidden; margin-bottom: 12px;">
        <div id="progress-bar" style="height: 100%; width: 0%; background: var(--gradient-primary); transition: width 0.2s ease;"></div>
      </div>
      
      <div style="display: flex; justify-content: space-between; font-size: 13px; color: var(--text-secondary);">
        <span id="progress-status">Initializing</span>
        <span id="progress-pct">0%</span>
      </div>
    </div>
  `;

  container.appendChild(overlay);

  return {
    update: (data) => {
      if (data.status === 'analyzing') {
        overlay.querySelector('#progress-title').textContent = 'Analyzing Files...';
        overlay.querySelector('#progress-status').textContent = `${data.current} / ${data.total} files`;
      } else if (data.status === 'building_graph') {
        overlay.querySelector('#progress-title').textContent = 'Building Dependency Graph...';
        overlay.querySelector('#progress-status').textContent = 'Almost there';
      }
      
      overlay.querySelector('#progress-bar').style.width = `${data.progress}%`;
      overlay.querySelector('#progress-pct').textContent = `${data.progress}%`;
    },
    remove: () => {
      overlay.style.opacity = '0';
      setTimeout(() => overlay.remove(), 250);
    }
  };
}
