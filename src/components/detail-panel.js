export function showDetailPanel(container, fileData, node) {
  // Clear existing
  container.innerHTML = '';
  
  const panel = document.createElement('div');
  panel.className = 'detail-panel';
  panel.style.cssText = `
    position: absolute;
    right: 0;
    top: 32px; /* below titlebar */
    bottom: 0;
    width: 380px;
    background: linear-gradient(145deg, var(--bg-glass) 0%, rgba(5,5,5,0.9) 100%);
    backdrop-filter: blur(24px);
    border-left: 1px solid rgba(255,255,255,0.05);
    padding: 32px 24px;
    box-shadow: -10px 0 30px rgba(0,0,0,0.5);
    z-index: var(--z-panel);
    overflow-y: auto;
    transform: translateX(100%);
    transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1);
    display: flex;
    flex-direction: column;
    gap: 24px;
  `;

  if (!fileData) {
    panel.innerHTML = `<p style="color: var(--text-secondary);">Loading temporal data...</p>`;
  } else {
    const renderList = (items, icon) => {
      if (!items || items.length === 0) return `<div style="color: var(--text-muted); font-size: 13px; font-style: italic;">None detected</div>`;
      return items.map(item => `
        <div style="display: flex; align-items: center; gap: 12px; font-size: 13px; margin-bottom: 8px; color: var(--text-primary); background: rgba(255,255,255,0.03); padding: 6px 12px; border-radius: var(--radius-sm); border: 1px solid rgba(255,255,255,0.02);">
          <span style="color: var(--accent-cyan); opacity: 0.8;">${icon}</span>
          <span style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-family: var(--font-mono);" title="${item.name || item}">${item.name || item}</span>
        </div>
      `).join('');
    };

    panel.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: flex-start;">
        <div>
          <div style="display: inline-block; padding: 4px 10px; border-radius: var(--radius-full); background: rgba(6, 182, 212, 0.1); border: 1px solid rgba(6, 182, 212, 0.2); color: var(--accent-cyan); font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 12px;">
            ${fileData.language}
          </div>
          <h2 style="font-size: 20px; font-weight: 600; word-break: break-all; line-height: 1.3;">${fileData.name}</h2>
        </div>
        <div style="display: flex; gap: 8px;">
          <button id="btn-view-source" style="background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.3); border-radius: var(--radius-full); padding: 0 12px; height: 32px; display: flex; align-items: center; justify-content: center; color: var(--accent-emerald); font-size: 12px; font-weight: 600; cursor: pointer; transition: all var(--transition-fast);">
            View Source
          </button>
          <button id="btn-close-panel" style="background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: var(--radius-full); width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; color: var(--text-secondary); cursor: pointer; transition: all var(--transition-fast);">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
      </div>

      <div>
        <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-muted); margin-bottom: 8px;">Absolute Path</div>
        <div style="font-size: 12px; font-family: var(--font-mono); color: var(--text-secondary); background: rgba(0,0,0,0.3); padding: 12px; border-radius: var(--radius-md); border: 1px solid rgba(255,255,255,0.05); word-break: break-all; box-shadow: inset 0 2px 4px rgba(0,0,0,0.2);">
          ${fileData.path}
        </div>
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
        <div style="background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); padding: 16px; border-radius: var(--radius-md);">
          <div style="font-size: 11px; text-transform: uppercase; color: var(--text-muted); margin-bottom: 8px;">File Size</div>
          <div style="font-size: 20px; font-weight: 600; color: var(--text-primary);">${(fileData.size / 1024).toFixed(1)} <span style="font-size: 12px; color: var(--text-secondary); font-weight: 400;">KB</span></div>
        </div>
        <div style="background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); padding: 16px; border-radius: var(--radius-md);">
          <div style="font-size: 11px; text-transform: uppercase; color: var(--text-muted); margin-bottom: 8px;">Lines of Code</div>
          <div style="font-size: 20px; font-weight: 600; color: var(--text-primary);">${fileData.lines?.total || 0}</div>
        </div>
      </div>

      ${node ? `
        <div style="padding: 16px; border: 1px solid rgba(139, 92, 246, 0.2); border-radius: var(--radius-md); background: linear-gradient(180deg, rgba(139, 92, 246, 0.05) 0%, transparent 100%); position: relative; overflow: hidden;">
          <div style="position: absolute; top: 0; left: 0; width: 2px; height: 100%; background: var(--accent-violet); box-shadow: var(--shadow-neon-violet);"></div>
          <div style="font-size: 12px; font-weight: 600; margin-bottom: 12px; color: var(--accent-violet);">Network Topography</div>
          
          <div style="display: flex; justify-content: space-between; align-items: center; font-size: 13px; margin-bottom: 8px;">
            <span style="color: var(--text-secondary);">Outgoing Links (Ce)</span>
            <span style="font-weight: 600; background: rgba(255,255,255,0.1); padding: 2px 8px; border-radius: var(--radius-full);">${node.ce || 0}</span>
          </div>
          <div style="display: flex; justify-content: space-between; align-items: center; font-size: 13px; margin-bottom: 8px;">
            <span style="color: var(--text-secondary);">Incoming Links (Ca)</span>
            <span style="font-weight: 600; background: rgba(255,255,255,0.1); padding: 2px 8px; border-radius: var(--radius-full);">${node.ca || 0}</span>
          </div>
          
          <div style="margin-top: 16px;">
            <div style="display: flex; justify-content: space-between; align-items: center; font-size: 11px; text-transform: uppercase; color: var(--text-muted); margin-bottom: 6px;">
              <span>Instability</span>
              <span style="color: ${node.instability > 0.7 ? 'var(--accent-rose)' : 'var(--text-primary)'}">${(node.instability || 0).toFixed(2)}</span>
            </div>
            <div style="width: 100%; height: 4px; background: rgba(0,0,0,0.5); border-radius: var(--radius-full); overflow: hidden;">
              <div style="height: 100%; width: ${(node.instability || 0) * 100}%; background: ${node.instability > 0.7 ? 'var(--accent-rose)' : 'var(--accent-violet)'};"></div>
            </div>
          </div>
        </div>
      ` : ''}

      <div>
        <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-muted); margin-bottom: 12px; display: flex; align-items: center; gap: 8px;">
          <span>Exports</span>
          <div style="flex-grow: 1; height: 1px; background: rgba(255,255,255,0.05);"></div>
        </div>
        ${renderList(fileData.structure?.exports, '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>')}
      </div>

      <div>
        <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-muted); margin-bottom: 12px; display: flex; align-items: center; gap: 8px;">
          <span>Imports</span>
          <div style="flex-grow: 1; height: 1px; background: rgba(255,255,255,0.05);"></div>
        </div>
        ${renderList(fileData.structure?.imports, '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg>')}
      </div>
    `;
  }

  container.appendChild(panel);

  // Trigger slide in
  requestAnimationFrame(() => {
    panel.style.transform = 'translateX(0)';
  });

  const closeBtn = panel.querySelector('#btn-close-panel');
  if (closeBtn) {
    closeBtn.onmouseover = () => closeBtn.style.background = 'rgba(255,255,255,0.1)';
    closeBtn.onmouseout = () => closeBtn.style.background = 'rgba(255,255,255,0.05)';
    closeBtn.addEventListener('click', () => {
      panel.style.transform = 'translateX(100%)';
      setTimeout(() => panel.remove(), 400);
    });
  }

  const btnSource = panel.querySelector('#btn-view-source');
  if (btnSource) {
    btnSource.onmouseover = () => {
      btnSource.style.background = 'rgba(16, 185, 129, 0.2)';
      btnSource.style.transform = 'scale(1.05)';
    };
    btnSource.onmouseout = () => {
      btnSource.style.background = 'rgba(16, 185, 129, 0.1)';
      btnSource.style.transform = 'scale(1)';
    };
    btnSource.addEventListener('click', () => {
      import('./code-viewer.js').then(({ showCodeViewer }) => {
        showCodeViewer(document.body, fileData);
      });
    });
  }
}
