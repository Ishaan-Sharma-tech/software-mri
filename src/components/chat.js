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
    pointer-events: none; /* Let clicks pass through empty space */
  `;

  // Messages Container (Initially hidden until we ask something)
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

  // Bottom Command Bar
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
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10z"></path></svg>
    <input type="text" id="chat-input" placeholder="Ask the Brain..." style="flex: 1; background: transparent; border: none; color: var(--text-primary); outline: none; font-size: 15px;">
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
    if (onHighlightNodes) onHighlightNodes([]); // clear highlights
  };

  const toggleCollapse = () => {
    // Only toggle if there are actual messages
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

  // Focus input automatically
  chatInput.focus();

  const sendMessage = async () => {
    const q = chatInput.value.trim();
    if (!q) return;

    chatInput.value = '';
    chatInput.disabled = true;

    // Show messages wrapper if hidden
    if (messagesWrapper.style.display === 'none') {
      messagesWrapper.style.display = 'flex';
      // trigger reflow
      void messagesWrapper.offsetWidth;
      messagesWrapper.style.opacity = '1';
      messagesWrapper.style.transform = 'translateY(0)';
    }

    // Append user msg
    const uMsg = document.createElement('div');
    uMsg.style.cssText = `
      background: var(--bg-tertiary);
      border: 1px solid var(--border-default);
      color: var(--text-primary);
      padding: 12px 16px;
      border-radius: var(--radius-md);
      font-size: 14px;
      align-self: flex-end;
      max-width: 85%;
    `;
    uMsg.textContent = q;
    messagesWrapper.appendChild(uMsg);

    // Append loading msg
    const lMsg = document.createElement('div');
    lMsg.style.cssText = `
      background: transparent;
      color: var(--text-secondary);
      padding: 12px 0;
      font-size: 14px;
      align-self: flex-start;
      max-width: 95%;
      line-height: 1.6;
    `;
    lMsg.innerHTML = '<span style="opacity: 0.6;">Thinking...</span>';
    messagesWrapper.appendChild(lMsg);
    messagesWrapper.scrollTop = messagesWrapper.scrollHeight;

    try {
      const res = await window.smri.queryBrain(projectId, q);
      lMsg.innerHTML = res.answer.replace(/\n/g, '<br>');
      lMsg.style.color = 'var(--text-primary)';
      
      // If the LLM mentioned specific files, highlight them!
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
          <button id="btn-chat-settings" style="background: var(--accent-cyan); color: #fff; padding: 8px 16px; border-radius: var(--radius-md); border: none; cursor: pointer; font-weight: 600;">Configure LLM</button>
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
    chatInput.focus();
    messagesWrapper.scrollTop = messagesWrapper.scrollHeight;
  };

  chatInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendMessage();
  });

  return overlay;
}
