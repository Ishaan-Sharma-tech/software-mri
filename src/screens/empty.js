export function showEmptyScreen(container) {
  container.innerHTML = `
    <div class="screen empty-screen" style="align-items: center; justify-content: center; background: radial-gradient(circle at 50% -20%, var(--bg-tertiary), var(--bg-primary) 60%);">
      
      <div class="drop-zone" style="border: 2px dashed var(--border-default); border-radius: var(--radius-xl); padding: 80px; text-align: center; max-width: 600px; width: 100%; transition: all var(--transition-normal); background: var(--bg-glass); backdrop-filter: blur(10px);">
        
        <div style="font-size: 64px; margin-bottom: 24px;">🧬</div>
        <h2 style="font-size: 28px; font-weight: 600; margin-bottom: 16px;">Drop a codebase here</h2>
        <p style="color: var(--text-secondary); margin-bottom: 32px; font-size: 16px;">See it come alive as a living digital organism.</p>
        
        <div style="display: flex; gap: 16px; justify-content: center;">
          <button id="btn-open-folder" style="padding: 12px 24px; border-radius: var(--radius-md); background: var(--accent-blue); color: white; border: none; font-weight: 600; font-size: 14px; box-shadow: var(--shadow-md); cursor: pointer;">Open Folder</button>
          <button id="btn-github-import" style="padding: 12px 24px; border-radius: var(--radius-md); background: #18181b; color: white; border: 1px solid #27272a; font-weight: 600; font-size: 14px; cursor: pointer; display: flex; align-items: center; gap: 8px;">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path fill-rule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clip-rule="evenodd" /></svg>
            Import from GitHub
          </button>
        </div>
      </div>
      
    </div>
  `;

  const style = document.createElement('style');
  style.textContent = `
    #btn-open-folder:hover { background: #2563eb; transform: translateY(-1px); }
    #btn-demo:hover { background: var(--border-hover); }
    .drop-zone.dragover { border-color: var(--accent-blue); background: var(--bg-glass-hover); box-shadow: var(--shadow-glow); }
  `;
  document.head.appendChild(style);

  // Attach events
  container.querySelector('#btn-open-folder').addEventListener('click', async () => {
    const path = await window.smri.openFolder();
    if (!path) return;
    
    // Import progress and briefing UI dynamically to avoid circular deps
    const { createProgressOverlay } = await import('../components/progress.js');
    const { showBriefing } = await import('../components/briefing.js');
    const { initGraph } = await import('./explorer.js');
    
    const progressUI = createProgressOverlay(container);
    
    // Listen to progress updates
    const unsubscribe = window.smri.onProgress((data) => {
      if (data.status === 'complete') {
        unsubscribe();
        progressUI.remove();
        
        // Show briefing, then init graph
        showBriefing(container, data.data, () => {
          initGraph(container, data.data);
        });
      } else {
        progressUI.update(data);
      }
    });

    // Start analysis in backend
    await window.smri.analyze(path);
  });

  container.querySelector('#btn-github-import').addEventListener('click', async () => {
    const { showGitHubImportModal } = await import('../components/github-import.js');
    showGitHubImportModal(container);
  });

  // Drag and drop visuals (stub)
  const dropZone = container.querySelector('.drop-zone');
  document.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('dragover');
  });
  document.addEventListener('dragleave', () => {
    dropZone.classList.remove('dragover');
  });
  document.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('dragover');
    if (e.dataTransfer.files.length > 0) {
      console.log('Dropped file/folder path:', e.dataTransfer.files[0].path);
    }
  });
}
