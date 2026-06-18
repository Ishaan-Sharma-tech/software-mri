export async function showCodeViewer(container, fileData) {
  // Clear existing
  const existing = document.getElementById('code-viewer-modal');
  if (existing) existing.remove();

  const overlay = document.createElement('div');
  overlay.id = 'code-viewer-modal';
  overlay.style.cssText = `
    position: fixed;
    top: 0; left: 0; width: 100vw; height: 100vh;
    background: rgba(0,0,0,0.7);
    backdrop-filter: blur(12px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 2000;
    opacity: 0;
    transition: opacity 0.3s ease;
  `;

  const panel = document.createElement('div');
  panel.style.cssText = `
    width: 80vw;
    height: 85vh;
    background: var(--bg-secondary);
    border: 1px solid var(--border-default);
    border-radius: var(--radius-xl);
    box-shadow: var(--shadow-xl);
    display: flex;
    flex-direction: column;
    overflow: hidden;
    transform: translateY(20px) scale(0.98);
    transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  `;

  // Header
  const header = document.createElement('div');
  header.style.cssText = `
    padding: 16px 24px;
    border-bottom: 1px solid var(--border-default);
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: rgba(0,0,0,0.2);
  `;

  header.innerHTML = `
    <div style="display: flex; align-items: center; gap: 12px;">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent-cyan)" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
      <div>
        <div style="font-weight: 600; font-size: 16px; color: var(--text-primary);">${fileData.name}</div>
        <div style="font-size: 12px; color: var(--text-muted); font-family: var(--font-mono);">${fileData.path}</div>
      </div>
    </div>
    <div style="display: flex; gap: 12px; align-items: center;">
      <button id="btn-save-code" style="background: rgba(6, 182, 212, 0.1); border: 1px solid rgba(6, 182, 212, 0.3); border-radius: var(--radius-md); padding: 8px 16px; color: var(--accent-cyan); font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.2s; display: none;">Save Changes</button>
      <button id="btn-close-code" style="background: transparent; border: none; color: var(--text-secondary); cursor: pointer; display: flex; align-items: center; transition: color 0.2s;">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"></path></svg>
      </button>
    </div>
  `;

  panel.appendChild(header);

  // Content Area
  const content = document.createElement('div');
  content.style.cssText = `
    flex: 1;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    background: #0d0d0d;
    position: relative;
  `;

  content.innerHTML = `<div style="padding: 24px; color: var(--text-muted); font-family: var(--font-mono); font-size: 14px;">Loading source code...</div>`;
  panel.appendChild(content);
  overlay.appendChild(panel);
  container.appendChild(overlay);

  const close = () => {
    overlay.style.opacity = '0';
    panel.style.transform = 'translateY(20px) scale(0.98)';
    setTimeout(() => overlay.remove(), 300);
  };

  header.querySelector('#btn-close-code').addEventListener('click', close);
  
  // Animate in
  requestAnimationFrame(() => {
    overlay.style.opacity = '1';
    panel.style.transform = 'translateY(0) scale(1)';
  });

  // Fetch File
  try {
    const originalCode = await window.smri.readFile(fileData.path);
    
    content.innerHTML = `
      <textarea id="code-editor" spellcheck="false" style="
        width: 100%;
        height: 100%;
        background: transparent;
        border: none;
        color: #e5e7eb;
        font-family: var(--font-mono);
        font-size: 13px;
        line-height: 1.5;
        padding: 24px;
        resize: none;
        outline: none;
        white-space: pre;
        tab-size: 2;
      "></textarea>
    `;
    
    const textarea = content.querySelector('#code-editor');
    textarea.value = originalCode;
    
    const btnSave = header.querySelector('#btn-save-code');
    btnSave.style.display = 'block';

    // Handle Tab key
    textarea.addEventListener('keydown', (e) => {
      if (e.key === 'Tab') {
        e.preventDefault();
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        textarea.value = textarea.value.substring(0, start) + "  " + textarea.value.substring(end);
        textarea.selectionStart = textarea.selectionEnd = start + 2;
      }
      
      // Handle Ctrl+S
      if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        btnSave.click();
      }
    });

    // Check for changes
    textarea.addEventListener('input', () => {
      if (textarea.value !== originalCode) {
        btnSave.style.background = 'var(--accent-cyan)';
        btnSave.style.color = '#000';
        btnSave.textContent = 'Save Changes *';
      } else {
        btnSave.style.background = 'rgba(6, 182, 212, 0.1)';
        btnSave.style.color = 'var(--accent-cyan)';
        btnSave.textContent = 'Save Changes';
      }
    });

    // Save Logic
    btnSave.addEventListener('click', async () => {
      btnSave.textContent = 'Saving...';
      try {
        await window.smri.writeFile(fileData.path, textarea.value);
        btnSave.textContent = 'Saved!';
        btnSave.style.background = 'rgba(16, 185, 129, 0.1)';
        btnSave.style.color = 'var(--accent-emerald)';
        btnSave.style.borderColor = 'rgba(16, 185, 129, 0.3)';
        
        setTimeout(() => {
          btnSave.style.background = 'rgba(6, 182, 212, 0.1)';
          btnSave.style.color = 'var(--accent-cyan)';
          btnSave.style.borderColor = 'rgba(6, 182, 212, 0.3)';
          btnSave.textContent = 'Save Changes';
        }, 2000);
      } catch (e) {
        alert('Failed to save file: ' + e.message);
        btnSave.textContent = 'Save Failed';
        btnSave.style.background = 'rgba(244, 63, 94, 0.1)';
        btnSave.style.color = 'var(--accent-rose)';
      }
    });

  } catch (err) {
    content.innerHTML = `<div style="padding: 24px; color: var(--accent-rose); font-family: var(--font-mono); font-size: 14px;">Failed to read file: ${err.message}</div>`;
  }
}
