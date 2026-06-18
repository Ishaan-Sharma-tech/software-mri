import { showProjectBoard } from './project-board.js';

export function showDashboardScreen(container) {
  // Read actual recent projects from localStorage
  const recentsRaw = localStorage.getItem('smri_recent_projects');
  let recentProjects = [];
  try {
    if (recentsRaw) recentProjects = JSON.parse(recentsRaw);
  } catch (e) {
    console.error('Failed to parse recent projects', e);
  }

  // Generate HTML for recent projects dynamically
  let recentHtml = '';
  if (recentProjects.length > 0) {
    recentHtml = `
      <div style="margin-top: 64px;">
        <h2 style="font-size: 16px; font-weight: 600; color: var(--text-secondary); letter-spacing: 0.05em; text-transform: uppercase; margin-bottom: 24px;">Recent Projects</h2>
        <div style="display: flex; flex-direction: column; gap: 12px;">
          ${recentProjects.map(proj => `
            <div class="recent-item" data-path="${proj.path}" style="display: flex; justify-content: space-between; align-items: center; padding: 16px 24px; background: var(--bg-secondary); border: 1px solid var(--border-default); border-radius: var(--radius-md); cursor: pointer; transition: all 0.2s;">
              <div style="display: flex; align-items: center; gap: 16px;">
                <div style="width: 12px; height: 12px; border-radius: 50%; background: var(--text-primary);"></div>
                <div>
                  <div style="font-weight: 500; color: var(--text-primary); margin-bottom: 4px;">${proj.name}</div>
                  <div style="font-size: 12px; color: var(--text-muted);">${proj.path} • ${proj.filesCount} files</div>
                </div>
              </div>
              <div style="font-size: 12px; color: var(--text-muted);">${new Date(proj.timestamp).toLocaleDateString()}</div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  container.innerHTML = `
    <div class="dashboard-screen" style="display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; width: 100vw; background: var(--bg-primary); padding: 48px;">
      
      <div style="max-width: 800px; width: 100%;">
        <div style="text-align: center; margin-bottom: 64px;">
          <h1 style="font-size: 36px; font-weight: 800; color: var(--text-primary); margin-bottom: 16px; letter-spacing: -0.02em;">Software MRI</h1>
          <p style="font-size: 18px; color: var(--text-secondary);">Start a new analysis</p>
        </div>
        
        <div style="display: flex; gap: 24px;">
          <!-- Local Directory Card -->
          <div id="card-local" class="project-card" style="flex: 1; background: var(--bg-secondary); border: 1px solid var(--border-default); border-radius: var(--radius-lg); padding: 40px 32px; cursor: pointer; transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1); text-align: center;" onmouseover="this.style.borderColor='var(--accent-cyan)'; this.style.transform='translateY(-8px) scale(1.02)'; this.style.boxShadow='0 20px 40px rgba(6, 182, 212, 0.15), 0 0 0 1px var(--accent-cyan)';" onmouseout="this.style.borderColor='var(--border-default)'; this.style.transform='translateY(0) scale(1)'; this.style.boxShadow='none';">
            <div style="width: 64px; height: 64px; background: var(--bg-tertiary); border-radius: var(--radius-md); display: flex; align-items: center; justify-content: center; margin: 0 auto 24px;">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--text-primary)" stroke-width="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>
            </div>
            <h3 style="font-size: 20px; font-weight: 600; color: var(--text-primary); margin-bottom: 12px;">Local Directory</h3>
            <p style="font-size: 14px; color: var(--text-secondary);">Analyze a repository stored on your machine.</p>
          </div>

          <!-- GitHub Card -->
          <div id="card-github" style="flex: 1; background: var(--bg-secondary); border: 1px solid var(--border-default); border-radius: var(--radius-lg); padding: 40px 32px; cursor: pointer; transition: all 0.2s; text-align: center;">
            <div style="width: 64px; height: 64px; background: var(--bg-tertiary); border-radius: var(--radius-md); display: flex; align-items: center; justify-content: center; margin: 0 auto 24px;">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--text-primary)" stroke-width="2"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path></svg>
            </div>
            <h3 style="font-size: 20px; font-weight: 600; color: var(--text-primary); margin-bottom: 12px;">GitHub Import</h3>
            <p style="font-size: 14px; color: var(--text-secondary);">Directly clone and analyze a remote repository.</p>
          </div>
        </div>

        ${recentHtml}

      </div>
    </div>
  `;

  // Hover styles
  const style = document.createElement('style');
  style.textContent = `
    #card-local, #card-github { transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1) !important; }
    #card-local:hover, #card-github:hover { 
      border-color: var(--accent-cyan) !important; 
      background: rgba(255,255,255,0.02); 
      transform: translateY(-8px) scale(1.02) !important; 
      box-shadow: 0 20px 40px rgba(6, 182, 212, 0.15), 0 0 0 1px var(--accent-cyan);
    }
    .recent-item:hover { 
      border-color: var(--accent-cyan); 
      background: rgba(6, 182, 212, 0.05); 
      transform: translateX(4px);
    }
  `;
  document.head.appendChild(style);

  // Helper to trigger backend analysis
  const runAnalysis = async (path) => {
    const { createProgressOverlay } = await import('../components/progress.js');
    const progressUI = createProgressOverlay(container);
    
    // Listen to progress updates
    const unsubscribe = window.smri.onProgress((update) => {
      if (update.status === 'complete') {
        unsubscribe();
        progressUI.remove();
        
        const data = update.data;
        
        // Save to recent projects
        const currentRecents = JSON.parse(localStorage.getItem('smri_recent_projects') || '[]');
        const filtered = currentRecents.filter(p => p.path !== data.projectPath);
        filtered.unshift({
          path: data.projectPath,
          name: data.projectPath.split(/[\\/]/).pop(),
          filesCount: data.files.length,
          timestamp: Date.now()
        });
        localStorage.setItem('smri_recent_projects', JSON.stringify(filtered.slice(0, 10))); // keep top 10

        // Transition to Project Board
        showProjectBoard(container, data);
      } else {
        progressUI.update(update);
      }
    });

    try {
      await window.smri.analyze(path);
    } catch (err) {
      console.error('Analysis failed', err);
      unsubscribe();
      progressUI.remove();
      alert('Analysis failed: ' + err.message);
    }
  };

  // Events
  container.querySelector('#card-local').addEventListener('click', async () => {
    try {
      const projectPath = await window.smri.openFolder();
      if (projectPath) {
        await runAnalysis(projectPath);
      }
    } catch (err) {
      console.error(err);
    }
  });

  container.querySelector('#card-github').addEventListener('click', () => {
    import('../components/github-import.js').then(({ showGitHubImportModal }) => {
      showGitHubImportModal(document.body);
    });
  });

  // Recent Projects Events
  container.querySelectorAll('.recent-item').forEach(el => {
    el.addEventListener('click', async () => {
      const path = el.getAttribute('data-path');
      if (path) {
        await runAnalysis(path);
      }
    });
  });
}
