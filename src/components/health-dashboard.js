export function showHealthDashboard(container, data) {
  let panel = document.getElementById('health-dashboard');
  
  if (!panel) {
    panel = document.createElement('div');
    panel.id = 'health-dashboard';
    panel.style.position = 'absolute';
    panel.style.bottom = '20px';
    panel.style.left = '50%';
    panel.style.transform = 'translateX(-50%) translateY(150%)'; // Hidden initially
    panel.style.width = '600px';
    panel.style.maxHeight = '400px';
    panel.style.backgroundColor = 'var(--bg-glass)';
    panel.style.backdropFilter = 'blur(10px)';
    panel.style.border = '1px solid var(--border-color)';
    panel.style.borderRadius = '12px';
    panel.style.padding = '20px';
    panel.style.boxShadow = 'var(--shadow-lg)';
    panel.style.color = 'var(--text-primary)';
    panel.style.display = 'flex';
    panel.style.flexDirection = 'column';
    panel.style.gap = '15px';
    panel.style.transition = 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)';
    panel.style.zIndex = '1000';
    container.appendChild(panel);
  }

  const health = data.health || { grade: 'N/A', score: 0, totalIssues: 0 };
  
  let gradeColor = 'var(--text-secondary)';
  if (health.grade === 'A') gradeColor = '#10b981';
  if (health.grade === 'B') gradeColor = '#3b82f6';
  if (health.grade === 'C') gradeColor = '#f59e0b';
  if (health.grade === 'D' || health.grade === 'F') gradeColor = '#f43f5e';

  // Aggregate issues
  const allIssues = [];
  data.files.forEach(f => {
    if (f.healthIssues) {
      f.healthIssues.forEach(i => {
        allIssues.push({ file: f.name, path: f.path, type: i.type, message: i.message });
      });
    }
  });

  allIssues.sort((a, b) => {
    if (a.type === 'critical' && b.type !== 'critical') return -1;
    if (a.type !== 'critical' && b.type === 'critical') return 1;
    return 0;
  });

  const issuesHtml = allIssues.length > 0 
    ? allIssues.map(i => `
      <div style="background: var(--bg-tertiary); padding: 10px; border-radius: 6px; border-left: 4px solid ${i.type === 'critical' ? '#f43f5e' : '#f59e0b'};">
        <div style="font-weight: bold; font-size: 14px; margin-bottom: 4px;">${i.file}</div>
        <div style="font-size: 12px; color: var(--text-secondary);">${i.message}</div>
      </div>
    `).join('')
    : `<div style="text-align: center; color: var(--text-secondary); padding: 20px;">No issues found. Your codebase is healthy!</div>`;

  panel.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border-color); padding-bottom: 10px;">
      <h2 style="margin: 0; font-size: 18px; display: flex; align-items: center; gap: 8px;">
        <svg style="width: 20px; height: 20px; color: ${gradeColor};" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
        Code Health Diagnostic
      </h2>
      <button id="close-health-dashboard" style="background: transparent; border: none; color: var(--text-secondary); cursor: pointer;">
        <svg style="width: 24px; height: 24px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
      </button>
    </div>
    
    <div style="display: flex; gap: 20px; align-items: center; padding: 10px 0;">
      <div style="font-size: 48px; font-weight: bold; color: ${gradeColor}; text-shadow: 0 0 10px ${gradeColor}80;">
        ${health.grade}
      </div>
      <div>
        <div style="font-size: 24px; font-weight: bold;">Score: ${health.score}/100</div>
        <div style="color: var(--text-secondary); font-size: 14px;">Total Issues Detected: ${health.totalIssues}</div>
      </div>
    </div>

    <div style="flex-grow: 1; overflow-y: auto; display: flex; flexDirection: column; gap: 8px; padding-right: 5px;">
      ${issuesHtml}
    </div>
  `;

  // Animate in
  setTimeout(() => {
    panel.style.transform = 'translateX(-50%) translateY(0)';
  }, 10);

  // Close handler
  panel.querySelector('#close-health-dashboard').addEventListener('click', () => {
    panel.style.transform = 'translateX(-50%) translateY(150%)';
    setTimeout(() => {
      // Revert to skeleton layer automatically
      window.dispatchEvent(new CustomEvent('toolbar:action', { detail: { action: 'btn-layer-skeleton' } }));
    }, 400); // Wait for animation
  });
}
