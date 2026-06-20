export function showArchaeologyPanel(container, archData, onFileClick) {
  let panel = document.getElementById('archaeology-dashboard-panel');
  if (panel) {
    // Just update it if it exists
    updateArchaeologyPanel(panel, archData, onFileClick);
    return panel;
  }

  panel = document.createElement('div');
  panel.id = 'archaeology-dashboard-panel';
  panel.style.cssText = `
    position: absolute;
    top: 0;
    right: 0;
    width: 380px;
    height: 100vh;
    background: var(--bg-glass);
    backdrop-filter: blur(20px);
    border-left: 1px solid var(--border-default);
    box-shadow: var(--shadow-xl);
    z-index: 9999;
    display: flex;
    flex-direction: column;
    transform: translateX(100%);
    transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1);
    font-family: var(--font-primary);
  `;
  container.appendChild(panel);

  // Trigger slide in
  requestAnimationFrame(() => {
    panel.style.transform = 'translateX(0)';
  });

  updateArchaeologyPanel(panel, archData, onFileClick);
  return panel;
}

function updateArchaeologyPanel(panel, archData, onFileClick) {
  panel.innerHTML = `
    <div style="padding: 24px; border-bottom: 1px solid var(--border-default); display: flex; justify-content: space-between; align-items: center;">
      <div>
        <h2 style="font-size: 20px; font-weight: 700; margin: 0; color: var(--text-primary); display: flex; align-items: center; gap: 8px;">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent-rose)" stroke-width="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
          Git Archaeology
        </h2>
        <div style="font-size: 12px; color: var(--text-secondary); margin-top: 4px;">
          ${archData.totalCommits} Commits Analyzed
        </div>
      </div>
      <button id="btn-close-arch-panel" style="background: transparent; border: none; color: var(--text-secondary); cursor: pointer; padding: 4px;">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"></path></svg>
      </button>
    </div>

    <div style="flex: 1; overflow-y: auto; padding: 24px; display: flex; flex-direction: column; gap: 32px;">
      
      <!-- Top Authors -->
      <section>
        <h3 style="font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-muted); margin: 0 0 12px 0;">Top Contributors</h3>
        <div style="display: flex; flex-direction: column; gap: 8px;">
          ${(archData.topAuthors || []).map((a, i) => `
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 12px; background: rgba(255,255,255,0.03); border-radius: 6px;">
              <span style="font-size: 13px; color: var(--text-primary); display: flex; align-items: center; gap: 8px;">
                <span style="color: var(--text-muted); font-size: 11px;">#${i+1}</span>
                ${a.name}
              </span>
              <span style="font-size: 12px; color: var(--accent-rose); font-weight: 600;">${a.count} commits</span>
            </div>
          `).join('')}
        </div>
      </section>

      <!-- Most Volatile Files -->
      <section>
        <h3 style="font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-muted); margin: 0 0 12px 0;">Most Volatile Files (Hotspots)</h3>
        <div style="display: flex; flex-direction: column; gap: 8px;">
          ${(archData.topChurned || []).map(f => `
            <div class="arch-file-item" data-id="${f.id}" style="display: flex; justify-content: space-between; align-items: center; padding: 8px 12px; background: rgba(244, 63, 94, 0.05); border: 1px solid rgba(244, 63, 94, 0.1); border-radius: 6px; cursor: pointer; transition: all 0.2s;">
              <span style="font-size: 12px; color: var(--text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 220px;" title="${f.id}">
                ${f.id.split('/').pop()}
              </span>
              <span style="font-size: 11px; color: var(--accent-rose); font-weight: 600; flex-shrink: 0;">${f.churnCount} edits</span>
            </div>
          `).join('')}
        </div>
      </section>

      <!-- Most Stable Files -->
      <section>
        <h3 style="font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-muted); margin: 0 0 12px 0;">Stable Core (Rarely Edited)</h3>
        <div style="display: flex; flex-direction: column; gap: 8px;">
          ${(archData.topStable || []).slice(0, 10).map(f => `
            <div class="arch-file-item" data-id="${f.id}" style="display: flex; justify-content: space-between; align-items: center; padding: 8px 12px; background: rgba(16, 185, 129, 0.05); border: 1px solid rgba(16, 185, 129, 0.1); border-radius: 6px; cursor: pointer; transition: all 0.2s;">
              <span style="font-size: 12px; color: var(--text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 220px;" title="${f.id}">
                ${f.id.split('/').pop()}
              </span>
              <span style="font-size: 11px; color: var(--accent-emerald); font-weight: 600; flex-shrink: 0;">${f.churnCount} edits</span>
            </div>
          `).join('')}
        </div>
      </section>

      <!-- Recent Commits -->
      <section>
        <h3 style="font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-muted); margin: 0 0 12px 0;">Live History</h3>
        <div style="display: flex; flex-direction: column; gap: 12px; border-left: 2px solid rgba(255,255,255,0.1); padding-left: 12px; margin-left: 6px;">
          ${(archData.recentCommits || []).map(c => `
            <div style="position: relative;">
              <div style="position: absolute; left: -17px; top: 4px; width: 8px; height: 8px; border-radius: 50%; background: var(--accent-rose); box-shadow: 0 0 8px var(--accent-rose);"></div>
              <div style="font-size: 13px; color: var(--text-primary); margin-bottom: 2px;">${c.message}</div>
              <div style="font-size: 11px; color: var(--text-muted); display: flex; gap: 8px;">
                <span>${c.author}</span>
                <span>•</span>
                <span>${c.time}</span>
              </div>
            </div>
          `).join('')}
        </div>
      </section>

    </div>
  `;

  // Attach Close Event
  panel.querySelector('#btn-close-arch-panel').addEventListener('click', () => {
    panel.style.transform = 'translateX(100%)';
    setTimeout(() => {
      if (panel.parentNode) panel.remove();
    }, 400); // match transition
  });

  // Attach File Clicks
  panel.querySelectorAll('.arch-file-item').forEach(el => {
    // Add hover effect
    el.addEventListener('mouseover', () => el.style.filter = 'brightness(1.3)');
    el.addEventListener('mouseout', () => el.style.filter = 'none');
    
    el.addEventListener('click', () => {
      const id = el.getAttribute('data-id');
      window.dispatchEvent(new CustomEvent('graph:fly-to-node', { detail: { nodeId: id } }));
    });
  });
}

export function hideArchaeologyPanel() {
  const panel = document.getElementById('archaeology-dashboard-panel');
  if (panel) {
    panel.style.transform = 'translateX(100%)';
    setTimeout(() => {
      if (panel.parentNode) panel.remove();
    }, 400);
  }
}
