export function showGitHubImportModal(container) {
  // Create overlay
  const overlay = document.createElement('div');
  overlay.style.cssText = `
    position: fixed;
    top: 0; left: 0; right: 0; bottom: 0;
    background: rgba(0,0,0,0.6);
    backdrop-filter: blur(8px);
    z-index: 1000;
    display: flex;
    align-items: center;
    justify-content: center;
    animation: fadeIn 0.3s ease;
  `;

  // Create modal
  const modal = document.createElement('div');
  modal.style.cssText = `
    width: 600px;
    max-height: 80vh;
    background: var(--bg-glass);
    border: 1px solid var(--border-default);
    border-radius: var(--radius-xl);
    box-shadow: var(--shadow-xl);
    display: flex;
    flex-direction: column;
    overflow: hidden;
  `;

  modal.innerHTML = `
    <div style="padding: 24px; border-bottom: 1px solid var(--border-default); display: flex; justify-content: space-between; align-items: center;">
      <h2 style="font-size: 20px; font-weight: 600; display: flex; align-items: center; gap: 8px;">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path fill-rule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clip-rule="evenodd" /></svg>
        GitHub Import
      </h2>
      <button id="btn-close-github" style="background: transparent; border: none; color: var(--text-secondary); cursor: pointer;">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
      </button>
    </div>
    
    <div id="github-content" style="padding: 24px; flex: 1; overflow-y: auto;">
      <div id="clone-state" style="text-align: center; padding: 40px 0;">
        <p style="color: var(--text-secondary); margin-bottom: 24px;">Enter the URL of any public Git repository to clone and analyze it locally.</p>
        <input type="text" id="repo-url-input" placeholder="https://github.com/expressjs/express.git" style="width: 100%; padding: 12px; margin-bottom: 16px; background: rgba(255,255,255,0.05); border: 1px solid var(--border-default); border-radius: var(--radius-md); color: var(--text-primary); outline: none; font-family: monospace;">
        <button id="btn-gh-clone" style="padding: 12px 24px; border-radius: var(--radius-md); background: #238636; color: white; border: 1px solid rgba(240,246,252,0.1); font-weight: 600; font-size: 14px; cursor: pointer; width: 100%; transition: all 0.2s;">Clone & Analyze</button>
      </div>
    </div>
  `;

  overlay.appendChild(modal);
  container.appendChild(overlay);

  // Close handler
  modal.querySelector('#btn-close-github').addEventListener('click', () => {
    overlay.remove();
  });

  const btnClone = modal.querySelector('#btn-gh-clone');
  const inputUrl = modal.querySelector('#repo-url-input');

  btnClone.addEventListener('mouseover', () => btnClone.style.opacity = '0.9');
  btnClone.addEventListener('mouseout', () => btnClone.style.opacity = '1');

  btnClone.addEventListener('click', () => {
    const url = inputUrl.value.trim();
    if (!url) {
      alert("Please enter a valid Git URL.");
      return;
    }
    
    startCloneProcess(url);
  });

  inputUrl.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      btnClone.click();
    }
  });

  async function startCloneProcess(cloneUrl) {
    overlay.remove(); // Close modal
    
    // Show global progress overlay
    const { createProgressOverlay } = await import('./progress.js');
    const { showBriefing } = await import('./briefing.js');
    const { initGraph } = await import('../screens/explorer.js');
    
    const progressUI = createProgressOverlay(container);
    
    const unsubscribe = window.smri.onProgress((data) => {
      if (data.status === 'complete') {
        unsubscribe();
        progressUI.remove();
        showBriefing(container, data.data, () => {
          initGraph(container, data.data);
        });
      } else {
        progressUI.update(data);
      }
    });

    try {
      await window.smri.githubCloneRepo(cloneUrl);
    } catch (e) {
      unsubscribe();
      progressUI.remove();
      alert(e.message || "Failed to import repo.");
    }
  }
}
