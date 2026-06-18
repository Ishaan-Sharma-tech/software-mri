export function showSearchModal(container, nodes, onSelect) {
  // Clear any existing modals
  const existing = document.getElementById('search-modal-overlay');
  if (existing) existing.remove();

  const overlay = document.createElement('div');
  overlay.id = 'search-modal-overlay';
  overlay.style.cssText = `
    position: fixed;
    top: 0; left: 0; width: 100vw; height: 100vh;
    background: rgba(0,0,0,0.4);
    backdrop-filter: blur(4px);
    display: flex;
    align-items: flex-start;
    justify-content: center;
    padding-top: 15vh;
    z-index: var(--z-modal, 1000);
    opacity: 0;
    transition: opacity 0.2s ease;
  `;

  const panel = document.createElement('div');
  panel.style.cssText = `
    width: 600px;
    background: var(--bg-secondary);
    border: 1px solid var(--border-default);
    border-radius: var(--radius-xl);
    box-shadow: var(--shadow-xl);
    display: flex;
    flex-direction: column;
    overflow: hidden;
    transform: translateY(-20px) scale(0.95);
    transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  `;

  panel.innerHTML = `
    <div style="padding: 16px; border-bottom: 1px solid var(--border-default); display: flex; align-items: center; gap: 12px; background: rgba(255,255,255,0.02);">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
      <input type="text" id="search-input" placeholder="Search files by name or path..." style="flex: 1; background: transparent; border: none; color: var(--text-primary); font-size: 16px; outline: none; font-family: var(--font-primary);">
      <div style="font-size: 12px; color: var(--text-muted); background: rgba(255,255,255,0.1); padding: 4px 8px; border-radius: 4px;">ESC to close</div>
    </div>
    <div id="search-results" style="max-height: 400px; overflow-y: auto; padding: 8px;">
      <!-- Results populated here -->
      <div style="padding: 16px; text-align: center; color: var(--text-muted); font-size: 14px;">Start typing to search...</div>
    </div>
  `;

  overlay.appendChild(panel);
  container.appendChild(overlay);

  const input = panel.querySelector('#search-input');
  const resultsContainer = panel.querySelector('#search-results');

  const close = () => {
    overlay.style.opacity = '0';
    panel.style.transform = 'translateY(-20px) scale(0.95)';
    setTimeout(() => overlay.remove(), 200);
  };

  const renderResults = (query) => {
    if (!query) {
      resultsContainer.innerHTML = '<div style="padding: 16px; text-align: center; color: var(--text-muted); font-size: 14px;">Start typing to search...</div>';
      return;
    }

    const lowerQuery = query.toLowerCase();
    const matched = nodes.filter(n => n.name.toLowerCase().includes(lowerQuery) || (n.id && n.id.toLowerCase().includes(lowerQuery))).slice(0, 50);

    if (matched.length === 0) {
      resultsContainer.innerHTML = '<div style="padding: 16px; text-align: center; color: var(--text-muted); font-size: 14px;">No files found matching "' + query + '"</div>';
      return;
    }

    resultsContainer.innerHTML = '';
    matched.forEach((node, index) => {
      const item = document.createElement('div');
      item.className = 'search-result-item';
      item.style.cssText = `
        padding: 12px 16px;
        border-radius: var(--radius-md);
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 12px;
        transition: background 0.1s;
        margin-bottom: 4px;
        background: ${index === 0 ? 'rgba(255,255,255,0.05)' : 'transparent'};
      `;
      
      const ext = node.name.match(/\.[0-9a-z]+$/i);
      const isJs = ext && (ext[0] === '.js' || ext[0] === '.ts' || ext[0] === '.jsx');
      const iconColor = isJs ? '#fcd34d' : '#9ca3af';

      item.innerHTML = `
        <div style="width: 12px; height: 12px; border-radius: 50%; background: ${iconColor};"></div>
        <div style="flex: 1; overflow: hidden;">
          <div style="color: var(--text-primary); font-size: 14px; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${node.name}</div>
          <div style="color: var(--text-secondary); font-size: 12px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-family: var(--font-mono);">${node.id}</div>
        </div>
      `;

      item.onmouseover = () => {
        panel.querySelectorAll('.search-result-item').forEach(el => el.style.background = 'transparent');
        item.style.background = 'rgba(255,255,255,0.05)';
      };

      item.onclick = () => {
        onSelect(node);
        close();
      };

      resultsContainer.appendChild(item);
    });
  };

  input.addEventListener('input', (e) => {
    renderResults(e.target.value);
  });

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') close();
    if (e.key === 'Enter') {
      const firstResult = resultsContainer.querySelector('.search-result-item');
      if (firstResult) firstResult.click();
    }
  });

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) close();
  });

  // Animate in
  requestAnimationFrame(() => {
    overlay.style.opacity = '1';
    panel.style.transform = 'translateY(0) scale(1)';
    input.focus();
  });
}
