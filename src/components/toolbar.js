export function createToolbar(container, data) {
  const toolbar = document.createElement('div');
  toolbar.className = 'mri-toolbar';
  toolbar.style.cssText = `
    position: absolute;
    left: 24px;
    top: 50%;
    transform: translateY(-50%);
    background: var(--bg-glass);
    backdrop-filter: blur(16px);
    border: 1px solid var(--border-default);
    border-radius: var(--radius-xl);
    padding: 12px 8px;
    display: flex;
    flex-direction: column;
    gap: 12px;
    z-index: var(--z-fixed);
    box-shadow: var(--shadow-lg);
  `;

  // SVG Icons from Heroicons
  const buttons = [
    { id: 'btn-home', icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>', title: 'Dashboard Home' },
    { id: 'btn-layer-skeleton', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>', title: 'Skeleton Layer' },
    { id: 'btn-layer-disease', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>', title: 'Disease Layer (Code Health)' },
    { id: 'btn-layer-organs', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M19 11A7 7 0 015 11m14 0a7 7 0 00-14 0m14 0a7 7 0 00-14 0m14 0v2a7 7 0 01-14 0v-2" /></svg>', title: 'Organs Layer (Semantic Clusters)' },
    { id: 'btn-layer-bloodflow', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>', title: 'Blood Flow Layer (Data Tracing)' },
    { id: 'btn-brain', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10z"></path></svg>', title: 'Brain Layer (Q&A)' },
    { id: 'btn-timeline', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>', title: 'Git Archaeology (Timeline)' },
    { id: 'btn-export', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path stroke-linecap="round" stroke-linejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>', title: 'Viral Export (PNG)' },
    { id: 'btn-search', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>', title: 'Search Node' },
    { id: 'btn-settings', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>', title: 'Settings' }
  ];

  buttons.forEach(btn => {
    const el = document.createElement('button');
    el.id = btn.id;
    el.title = btn.title;
    el.innerHTML = btn.icon;
    el.style.cssText = `
      width: 44px; height: 44px;
      border-radius: var(--radius-lg);
      border: 1px solid transparent;
      background: transparent;
      color: var(--text-secondary);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all var(--transition-fast);
      padding: 10px;
    `;
    el.style.position = 'relative';

    el.onmouseover = () => {
      if (el.style.backgroundColor !== 'var(--bg-tertiary)') {
        el.style.color = 'var(--text-primary)';
        el.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
        el.style.transform = 'scale(1.1)';
      }
    };
    el.onmouseout = () => {
      if (el.style.backgroundColor !== 'var(--bg-tertiary)' && el.style.backgroundColor !== 'rgba(255, 255, 255, 0.05)') {
        el.style.color = 'var(--text-secondary)';
      } else if (el.style.backgroundColor === 'rgba(255, 255, 255, 0.05)') {
        el.style.color = 'var(--text-secondary)';
        el.style.backgroundColor = 'transparent';
        el.style.transform = 'scale(1)';
      }
    };
    
    if (btn.id === 'btn-layer-skeleton') {
      el.style.backgroundColor = 'var(--bg-tertiary)';
      el.style.color = 'var(--accent-cyan)';
      el.style.border = '1px solid var(--accent-cyan)';
      el.style.boxShadow = 'var(--shadow-neon-cyan)';
    }

    el.addEventListener('click', () => {
      // Dispatch event to window
      window.dispatchEvent(new CustomEvent('toolbar:action', { detail: { action: btn.id } }));
    });

    toolbar.appendChild(el);
  });

  container.appendChild(toolbar);
}
