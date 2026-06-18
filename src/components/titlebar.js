import { toggleTheme } from '../core/theme.js';

export function createTitlebar(container) {
  container.innerHTML = `
    <div class="titlebar" style="-webkit-app-region: drag; display: flex; align-items: center; justify-content: space-between; height: 100%; padding: 0 10px; user-select: none;">
      <div class="titlebar-left" style="display: flex; align-items: center; gap: 10px; pointer-events: none;">
        <span class="app-icon" style="font-size: 14px; font-weight: bold; color: var(--accent-blue);">⚕️</span>
        <span class="app-title" style="font-size: 12px; font-weight: 500; color: var(--text-secondary);">Software MRI</span>
      </div>
      
      <div class="titlebar-right" style="-webkit-app-region: no-drag; display: flex; align-items: center; height: 100%;">
        <button class="theme-toggle" style="background: none; border: none; color: var(--text-secondary); cursor: pointer; padding: 0 10px; font-size: 14px;">☀️</button>
        <button class="win-btn minimize" style="background: none; border: none; color: var(--text-secondary); cursor: pointer; padding: 0 15px; height: 100%;">—</button>
        <button class="win-btn maximize" style="background: none; border: none; color: var(--text-secondary); cursor: pointer; padding: 0 15px; height: 100%;">◻</button>
        <button class="win-btn close" style="background: none; border: none; color: var(--text-secondary); cursor: pointer; padding: 0 15px; height: 100%;">✕</button>
      </div>
    </div>
  `;

  // Add styles dynamically
  const style = document.createElement('style');
  style.textContent = `
    .win-btn:hover { background-color: var(--border-hover); }
    .win-btn.close:hover { background-color: var(--accent-rose); color: white; }
    .theme-toggle:hover { color: var(--text-primary); }
  `;
  document.head.appendChild(style);

  // Attach events
  container.querySelector('.minimize').addEventListener('click', () => window.smri.minimize());
  container.querySelector('.maximize').addEventListener('click', () => window.smri.maximize());
  container.querySelector('.close').addEventListener('click', () => window.smri.close());
  
  container.querySelector('.theme-toggle').addEventListener('click', (e) => {
    toggleTheme();
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    e.target.textContent = isDark ? '☀️' : '🌙';
  });
}
