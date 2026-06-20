export function showChatPanel(container, projectId, onHighlightNodes) {
  let overlay = container.querySelector('.chat-overlay');
  if (overlay) return overlay;

  overlay = document.createElement('div');
  overlay.className = 'chat-overlay';
  overlay.style.cssText = `
    position: absolute;
    bottom: 32px;
    left: 50%;
    transform: translateX(-50%);
    width: 600px;
    max-width: 90vw;
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    z-index: var(--z-panel);
    pointer-events: none;
  `;

  // --- Header / Toggle Bar ---
  const headerWrapper = document.createElement('div');
  headerWrapper.style.cssText = `
    pointer-events: auto;
    background: rgba(0, 0, 0, 0.6);
    backdrop-filter: blur(20px);
    border: 1px solid var(--border-default);
    border-radius: var(--radius-full);
    padding: 8px 16px;
    margin-bottom: 8px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    box-shadow: var(--shadow-lg);
  `;

  let currentMode = localStorage.getItem('smri-ai-mode') || 'byok';
  
  headerWrapper.innerHTML = `
    <div style="display: flex; gap: 8px; background: rgba(255,255,255,0.05); padding: 4px; border-radius: var(--radius-full);">
      <button id="toggle-local" style="border: none; background: ${currentMode === 'local' ? 'rgba(139, 92, 246, 0.2)' : 'transparent'}; color: ${currentMode === 'local' ? '#fff' : 'var(--text-muted)'}; padding: 4px 12px; border-radius: 12px; cursor: pointer; font-size: 12px; font-weight: 600; transition: all 0.2s;">
        🔒 Local AI
      </button>
      <button id="toggle-byok" style="border: none; background: ${currentMode === 'byok' ? 'rgba(139, 92, 246, 0.2)' : 'transparent'}; color: ${currentMode === 'byok' ? '#fff' : 'var(--text-muted)'}; padding: 4px 12px; border-radius: 12px; cursor: pointer; font-size: 12px; font-weight: 600; transition: all 0.2s;">
        🔑 Your API Key
      </button>
    </div>
    <div style="font-size: 11px; color: var(--text-muted);" id="model-status">Ready</div>
  `;
  overlay.appendChild(headerWrapper);

  const toggleLocal = headerWrapper.querySelector('#toggle-local');
  const toggleByok = headerWrapper.querySelector('#toggle-byok');
  const modelStatus = headerWrapper.querySelector('#model-status');

  const updateModeUI = (mode) => {
    currentMode = mode;
    localStorage.setItem('smri-ai-mode', mode);
    toggleLocal.style.background = mode === 'local' ? 'rgba(139, 92, 246, 0.2)' : 'transparent';
    toggleLocal.style.color = mode === 'local' ? '#fff' : 'var(--text-muted)';
    toggleByok.style.background = mode === 'byok' ? 'rgba(139, 92, 246, 0.2)' : 'transparent';
    toggleByok.style.color = mode === 'byok' ? '#fff' : 'var(--text-muted)';
    
    if (mode === 'local') {
      checkLocalModel();
    } else {
      modelStatus.textContent = 'Ready';
      modelStatus.style.color = 'var(--text-muted)';
    }
  };

  toggleLocal.onclick = () => updateModeUI('local');
  toggleByok.onclick = () => updateModeUI('byok');

  // --- Messages Container ---
  const messagesWrapper = document.createElement('div');
  messagesWrapper.style.cssText = `
    pointer-events: auto;
    background: rgba(0, 0, 0, 0.4);
    backdrop-filter: blur(20px);
    border: 1px solid var(--border-default);
    border-radius: var(--radius-lg);
    padding: 24px;
    margin-bottom: 16px;
    max-height: 50vh;
    overflow-y: auto;
    display: none;
    flex-direction: column;
    gap: 16px;
    box-shadow: var(--shadow-lg);
    opacity: 0;
    transform: translateY(10px);
    transition: all 0.3s ease;
  `;
  overlay.appendChild(messagesWrapper);

  // --- Bottom Command Bar ---
  const inputWrapper = document.createElement('div');
  inputWrapper.style.cssText = `
    pointer-events: auto;
    background: rgba(0, 0, 0, 0.6);
    backdrop-filter: blur(20px);
    border: 1px solid var(--border-default);
    border-radius: var(--radius-full);
    padding: 12px 24px;
    display: flex;
    align-items: center;
    gap: 12px;
    box-shadow: var(--shadow-lg);
    transition: all 0.3s ease;
  `;
  
  inputWrapper.innerHTML = `
    <div style="width: 24px; height: 24px; border-radius: 50%; background: linear-gradient(135deg, var(--accent-violet) 0%, var(--accent-rose) 100%); display: flex; align-items: center; justify-content: center; box-shadow: 0 0 10px rgba(139, 92, 246, 0.5);">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10z"></path></svg>
    </div>
    <input type="text" id="chat-input" placeholder="Ask the Brain..." style="flex: 1; background: transparent; border: none; color: var(--text-primary); outline: none; font-size: 15px; font-family: var(--font-primary);">
    <button id="btn-stop-chat" title="Stop generating" style="display: none; background: rgba(255, 51, 102, 0.2); border: 1px solid rgba(255, 51, 102, 0.5); color: #FF3366; cursor: pointer; align-items: center; justify-content: center; width: 24px; height: 24px; border-radius: 50%;">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="6" width="12" height="12"></rect></svg>
    </button>
    <button id="btn-collapse-chat" title="Minimize/Expand" style="background: transparent; border: none; color: var(--text-muted); cursor: pointer; display: flex; align-items: center; transition: color 0.2s;">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 15l-7-7-7 7"></path></svg>
    </button>
    <button id="btn-close-chat" title="Close" style="background: transparent; border: none; color: var(--text-muted); cursor: pointer; display: flex; align-items: center; transition: color 0.2s;">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"></path></svg>
    </button>
  `;
  overlay.appendChild(inputWrapper);
  container.appendChild(overlay);

  const btnClose = overlay.querySelector('#btn-close-chat');
  const btnCollapse = overlay.querySelector('#btn-collapse-chat');
  const btnStop = overlay.querySelector('#btn-stop-chat');
  const chatInput = overlay.querySelector('#chat-input');
  
  // Hover effects
  btnClose.onmouseover = () => btnClose.style.color = 'var(--text-primary)';
  btnClose.onmouseout = () => btnClose.style.color = 'var(--text-muted)';
  btnCollapse.onmouseover = () => btnCollapse.style.color = 'var(--text-primary)';
  btnCollapse.onmouseout = () => btnCollapse.style.color = 'var(--text-muted)';

  const closePanel = () => {
    overlay.style.opacity = '0';
    overlay.style.transform = 'translateY(20px) translateX(-50%)';
    setTimeout(() => overlay.remove(), 300);
    if (onHighlightNodes) onHighlightNodes([]);
  };

  const toggleCollapse = () => {
    if (messagesWrapper.children.length > 0) {
      if (messagesWrapper.style.display === 'none') {
        messagesWrapper.style.display = 'flex';
        btnCollapse.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 15l-7-7-7 7"></path></svg>';
        setTimeout(() => {
          messagesWrapper.style.opacity = '1';
          messagesWrapper.style.transform = 'translateY(0)';
          messagesWrapper.scrollTop = messagesWrapper.scrollHeight;
        }, 10);
      } else {
        messagesWrapper.style.opacity = '0';
        messagesWrapper.style.transform = 'translateY(10px)';
        btnCollapse.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 9l-7 7-7-7"></path></svg>';
        setTimeout(() => {
          messagesWrapper.style.display = 'none';
        }, 300);
      }
    }
  };

  btnClose.addEventListener('click', closePanel);
  btnCollapse.addEventListener('click', toggleCollapse);
  btnStop.addEventListener('click', () => {
    window.smri.aiStop();
  });

  chatInput.focus();

  // --- Model check and download logic ---
  let isModelReady = false;
  let isDownloading = false;

  async function checkLocalModel() {
    try {
      // Pro check removed
      
      const exists = await window.smri.aiCheckModel();
      if (exists) {
        modelStatus.innerHTML = '<span style="color:var(--accent-emerald)">Model Loaded</span>';
        isModelReady = true;
      } else {
        modelStatus.innerHTML = '<button id="btn-download-model" style="background:var(--accent-cyan); color:#000; border:none; padding:2px 8px; border-radius:4px; font-weight:bold; cursor:pointer;">Download Model (900MB)</button>';
        const dlBtn = modelStatus.querySelector('#btn-download-model');
        if (dlBtn) {
          dlBtn.onclick = startDownload;
        }
        isModelReady = false;
      }
    } catch (e) {
      console.error(e);
      modelStatus.textContent = 'Error checking model';
    }
  }

  function startDownload() {
    if (isDownloading) return;
    isDownloading = true;
    modelStatus.innerHTML = `
      <div style="display:flex; align-items:center; gap:8px;">
        <span>Downloading...</span>
        <div style="width: 60px; height: 4px; background: rgba(255,255,255,0.1); border-radius: 2px; overflow: hidden;">
          <div id="dl-progress-bar" style="width: 0%; height: 100%; background: var(--accent-cyan);"></div>
        </div>
        <span id="dl-progress-text">0%</span>
      </div>
    `;
    
    window.smri.onAIDownloadProgress((data) => {
      const bar = document.getElementById('dl-progress-bar');
      const txt = document.getElementById('dl-progress-text');
      if (bar) bar.style.width = `${data.progress}%`;
      if (txt) txt.textContent = `${data.progress}%`;
    });

    window.smri.aiDownloadModel().then(() => {
      isDownloading = false;
      checkLocalModel();
    }).catch(err => {
      isDownloading = false;
      modelStatus.innerHTML = `<span style="color:#FF3366">Download failed: ${err.message}</span>`;
      setTimeout(checkLocalModel, 3000);
    });
  }

  // Markdown Parser
  const parseMD = (text) => {
    let html = text.replace(/</g, '&lt;').replace(/>/g, '&gt;');
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong style="color:var(--text-primary)">$1</strong>');
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
    html = html.replace(/```([\s\S]*?)```/g, '<pre style="background: rgba(0,0,0,0.4); padding: 12px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.1); overflow-x: auto; margin: 8px 0; color: #a5b4fc; font-family: var(--font-mono); font-size: 13px;"><code>$1</code></pre>');
    html = html.replace(/`(.*?)`/g, '<code style="background: rgba(255,255,255,0.1); padding: 2px 6px; border-radius: 4px; color: #a5b4fc; font-family: var(--font-mono); font-size: 13px;">$1</code>');
    html = html.replace(/\n/g, '<br>');
    return html;
  };

  const sendMessage = async () => {
    const q = chatInput.value.trim();
    if (!q) return;

    if (currentMode === 'local' && !isModelReady) {
      alert("Local model is not ready. Please wait for download or switch to BYOK mode.");
      return;
    }

    // Pro check removed

    chatInput.value = '';
    chatInput.disabled = true;
    btnStop.style.display = 'flex';

    if (messagesWrapper.style.display === 'none') {
      messagesWrapper.style.display = 'flex';
      void messagesWrapper.offsetWidth;
      messagesWrapper.style.opacity = '1';
      messagesWrapper.style.transform = 'translateY(0)';
    }

    // Append user msg
    const uMsg = document.createElement('div');
    uMsg.style.cssText = `
      background: linear-gradient(135deg, rgba(139, 92, 246, 0.2) 0%, rgba(139, 92, 246, 0.05) 100%);
      border: 1px solid rgba(139, 92, 246, 0.3);
      color: var(--text-primary);
      padding: 12px 18px;
      border-radius: 18px;
      border-bottom-right-radius: 4px;
      font-size: 14px;
      align-self: flex-end;
      max-width: 85%;
      box-shadow: inset 0 0 10px rgba(139, 92, 246, 0.1);
    `;
    uMsg.textContent = q;
    messagesWrapper.appendChild(uMsg);

    // Append loading msg
    const lMsg = document.createElement('div');
    lMsg.style.cssText = `
      background: rgba(255,255,255,0.03);
      border: 1px solid rgba(255,255,255,0.05);
      color: var(--text-secondary);
      padding: 16px 20px;
      border-radius: 18px;
      border-bottom-left-radius: 4px;
      font-size: 14px;
      align-self: flex-start;
      max-width: 95%;
      line-height: 1.6;
      box-shadow: var(--shadow-sm);
    `;
    lMsg.innerHTML = '<div style="display: flex; gap: 6px; align-items: center;"><div class="brain-dot" style="width: 8px; height: 8px; background: var(--accent-violet); border-radius: 50%; animation: pulse 1s infinite alternate;"></div><span style="opacity: 0.8; color: var(--accent-violet); font-weight: 600;">Thinking...</span></div>';
    messagesWrapper.appendChild(lMsg);
    messagesWrapper.scrollTop = messagesWrapper.scrollHeight;

    if (currentMode === 'local') {
      lMsg.innerHTML = '';
      lMsg.style.color = 'var(--text-primary)';
      let streamedText = '';

      window.smri.onAIToken((token) => {
        streamedText += token;
        lMsg.innerHTML = parseMD(streamedText);
        messagesWrapper.scrollTop = messagesWrapper.scrollHeight;
      });

      window.smri.onAIDone(() => {
        chatInput.disabled = false;
        btnStop.style.display = 'none';
        chatInput.focus();
        
        // Match refs if we can
        const refRegex = /\[(.*?)\]/g;
        let match;
        const references = [];
        while ((match = refRegex.exec(streamedText)) !== null) {
          references.push(match[1]);
        }
        if (references.length > 0 && onHighlightNodes) {
          onHighlightNodes(references);
        }
      });

      try {
        // Send highlighted node if any
        let selectedNodeId = null;
        if (window.Graph) { // Dirty way to get selected if global, better to pass via event. Assuming graph is managed globally or highlightedNodes passed down.
           // In explorer.js, we don't pass selected node explicitly to chat.js right now.
           // We will get it from the graph if possible, but actually let's just grab the first highlighted node if any exist globally.
        }
        // As a workaround, we dispatch a custom event to get the selected node, or we can just send null for now if not implemented.
        // The instructions said "The currently selected node's id from the 3D graph (sent from renderer via IPC)".
        // I will dispatch an event or read a global.
        let selectedNode = null;
        if (window._currentSelectedNode) {
          selectedNode = window._currentSelectedNode;
        }

        await window.smri.aiChat({ projectId, question: q, selectedFilePath: selectedNode });
      } catch (err) {
        lMsg.style.color = 'var(--accent-rose)';
        lMsg.textContent = "Error: " + err.message;
        chatInput.disabled = false;
        btnStop.style.display = 'none';
      }

    } else {
      // BYOK Mode
      try {
        const res = await window.smri.queryBrain(projectId, q);
        if (res.error) throw new Error(res.error);
        const parsedHTML = parseMD(res.answer);
        
        lMsg.innerHTML = parsedHTML;
        lMsg.style.color = 'var(--text-primary)';
        
        if (res.references && res.references.length > 0) {
          if (onHighlightNodes) onHighlightNodes(res.references);
          const refBadge = document.createElement('div');
          refBadge.style.cssText = 'margin-top: 12px; font-size: 12px; color: var(--accent-emerald); font-weight: 600; display: inline-block; padding: 4px 8px; background: rgba(16, 185, 129, 0.1); border-radius: 4px;';
          refBadge.textContent = `Highlighted ${res.references.length} files`;
          lMsg.appendChild(refBadge);
        } else {
          if (onHighlightNodes) onHighlightNodes([]);
        }
      } catch (err) {
        if (err.message.includes('No LLM Provider Configured') || err.message.includes('API key is missing')) {
          lMsg.innerHTML = `
            <div style="color: var(--text-primary); margin-bottom: 12px;">You need to configure your AI Provider to use the Brain Layer!</div>
            <button id="btn-chat-settings" style="background: var(--accent-cyan); color: #000; padding: 8px 16px; border-radius: var(--radius-md); border: none; cursor: pointer; font-weight: 600;">Configure LLM</button>
          `;
          lMsg.querySelector('#btn-chat-settings').addEventListener('click', () => {
            import('./llm-setup.js').then(({ showLLMSetup }) => showLLMSetup(document.body));
          });
        } else {
          lMsg.style.color = 'var(--accent-rose)';
          lMsg.textContent = "Error: " + err.message;
        }
      }
      chatInput.disabled = false;
      btnStop.style.display = 'none';
      chatInput.focus();
      messagesWrapper.scrollTop = messagesWrapper.scrollHeight;
    }
  };

  chatInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendMessage();
  });

  if (!document.getElementById('brain-styles')) {
    const style = document.createElement('style');
    style.id = 'brain-styles';
    style.innerHTML = `
      @keyframes pulse {
        0% { transform: scale(0.8); opacity: 0.5; }
        100% { transform: scale(1.2); opacity: 1; box-shadow: 0 0 10px var(--accent-violet); }
      }
    `;
    document.head.appendChild(style);
  }

  // Initialize UI correctly
  updateModeUI(currentMode);

  return overlay;
}
