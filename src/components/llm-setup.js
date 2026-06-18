export async function showLLMSetup(container) {
  // Clear any existing modals
  const existing = document.getElementById('llm-setup-modal');
  if (existing) existing.remove();

  const settings = await window.smri.getSettings();
  if (!settings.llmKeys) settings.llmKeys = {};
  if (!settings.llmModels) settings.llmModels = {};
  
  // Default to gemini if none
  if (settings.llmProvider === 'none' || !settings.llmProvider) {
    settings.llmProvider = 'gemini';
  }

  const modal = document.createElement('div');
  modal.id = 'llm-setup-modal';
  modal.style.cssText = `
    position: fixed;
    top: 0; left: 0; width: 100vw; height: 100vh;
    background: rgba(0,0,0,0.6);
    backdrop-filter: blur(8px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: var(--z-modal, 1000);
    opacity: 0;
    transition: opacity 0.3s ease;
  `;

  const panel = document.createElement('div');
  panel.style.cssText = `
    width: 480px;
    background: var(--bg-secondary);
    border: 1px solid var(--border-default);
    border-radius: var(--radius-xl);
    padding: 32px;
    box-shadow: var(--shadow-lg);
    color: var(--text-primary);
    transform: translateY(20px);
    transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  `;

  // Base HTML Structure (Static)
  panel.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
      <h2 style="font-size: 20px; font-weight: 600; margin: 0;">LLM Integration</h2>
      <button id="btn-close-setup" style="background: transparent; border: none; color: var(--text-secondary); cursor: pointer;">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
      </button>
    </div>

    <p style="color: var(--text-secondary); font-size: 14px; margin-bottom: 24px; line-height: 1.5;">
      Software MRI relies on AI to power deep architectural insights (Organs and Brain layer). We use a Bring-Your-Own-Key model to ensure your code stays entirely under your control.
    </p>

    <div style="margin-bottom: 24px;">
      <label style="display: block; font-size: 13px; color: var(--text-secondary); margin-bottom: 8px;">Provider</label>
      <div id="provider-buttons" style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
        <!-- Provider buttons will be rendered here -->
      </div>
    </div>

    <div id="dynamic-fields">
      <!-- Dynamic fields will be rendered here -->
    </div>

    <div style="margin-top: 32px; display: flex; justify-content: space-between; align-items: center;">
      <button id="btn-test-connection" style="background: transparent; border: 1px solid var(--border-default); color: var(--text-primary); padding: 8px 16px; border-radius: var(--radius-md); cursor: pointer; transition: background 0.2s;">
        Test Connection
      </button>
      <button id="btn-save-settings" style="background: var(--accent-cyan); border: none; color: #fff; padding: 8px 24px; border-radius: var(--radius-md); font-weight: 600; cursor: pointer;">
        Save & Apply
      </button>
    </div>
    
    <div id="test-result" style="margin-top: 16px; font-size: 13px; text-align: center; height: 20px;"></div>
  `;

  const renderContent = () => {
    const provider = settings.llmProvider;
    
    // Update Provider Buttons UI
    const providerButtonsContainer = panel.querySelector('#provider-buttons');
    providerButtonsContainer.innerHTML = `
      <button class="provider-btn" data-provider="gemini" style="padding: 12px; border-radius: var(--radius-md); border: 1px solid ${provider === 'gemini' ? 'var(--accent-cyan)' : 'var(--border-default)'}; background: ${provider === 'gemini' ? 'rgba(6, 182, 212, 0.1)' : 'transparent'}; color: var(--text-primary); cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px;">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"/></svg>
        Google Gemini
      </button>
      <button class="provider-btn" data-provider="openai" style="padding: 12px; border-radius: var(--radius-md); border: 1px solid ${provider === 'openai' ? 'var(--accent-cyan)' : 'var(--border-default)'}; background: ${provider === 'openai' ? 'rgba(6, 182, 212, 0.1)' : 'transparent'}; color: var(--text-primary); cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px;">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 2v20M2 12h20M12 2a10 10 0 0110 10 10 10 0 01-10 10"/></svg>
        OpenAI
      </button>
      <button class="provider-btn" data-provider="anthropic" style="padding: 12px; border-radius: var(--radius-md); border: 1px solid ${provider === 'anthropic' ? 'var(--accent-cyan)' : 'var(--border-default)'}; background: ${provider === 'anthropic' ? 'rgba(6, 182, 212, 0.1)' : 'transparent'}; color: var(--text-primary); cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px;">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2L2 22h20L12 2z"/></svg>
        Anthropic
      </button>
      <button class="provider-btn" data-provider="groq" style="padding: 12px; border-radius: var(--radius-md); border: 1px solid ${provider === 'groq' ? 'var(--accent-cyan)' : 'var(--border-default)'}; background: ${provider === 'groq' ? 'rgba(6, 182, 212, 0.1)' : 'transparent'}; color: var(--text-primary); cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px;">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
        Groq
      </button>
      <button class="provider-btn" data-provider="ollama" style="padding: 12px; border-radius: var(--radius-md); border: 1px solid ${provider === 'ollama' ? 'var(--accent-cyan)' : 'var(--border-default)'}; background: ${provider === 'ollama' ? 'rgba(6, 182, 212, 0.1)' : 'transparent'}; color: var(--text-primary); cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; grid-column: span 2;">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>
        Ollama (Local)
      </button>
    `;

    // Re-bind provider button clicks
    providerButtonsContainer.querySelectorAll('.provider-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        updateSettingsFromForm(); // Save current form data before switching
        settings.llmProvider = btn.dataset.provider;
        renderContent(); // Re-render the form
      });
    });

    // Update Dynamic Fields HTML
    const dynamicFieldsContainer = panel.querySelector('#dynamic-fields');
    let fieldsHtml = '';

    if (provider === 'gemini') {
      fieldsHtml = `
        <div style="margin-top: 16px;">
          <label style="display: block; font-size: 13px; color: var(--text-secondary); margin-bottom: 8px;">API Key</label>
          <input type="password" id="llm-key" value="${settings.llmKeys.gemini || ''}" style="width: 100%; padding: 10px; background: rgba(255,255,255,0.05); border: 1px solid var(--border-default); border-radius: var(--radius-md); color: var(--text-primary); outline: none;">
          <div style="margin-top: 16px;">
            <label style="display: block; font-size: 13px; color: var(--text-secondary); margin-bottom: 8px;">Model</label>
            <select id="llm-model" style="width: 100%; padding: 10px; background: rgba(255,255,255,0.05); border: 1px solid var(--border-default); border-radius: var(--radius-md); color: var(--text-primary); outline: none;">
              <option value="gemini-2.5-flash" ${settings.llmModels.gemini === 'gemini-2.5-flash' ? 'selected' : ''}>gemini-2.5-flash (Fast)</option>
              <option value="gemini-2.5-pro" ${settings.llmModels.gemini === 'gemini-2.5-pro' ? 'selected' : ''}>gemini-2.5-pro (Best)</option>
              <option value="gemini-2.0-flash" ${settings.llmModels.gemini === 'gemini-2.0-flash' ? 'selected' : ''}>gemini-2.0-flash</option>
            </select>
          </div>
        </div>
      `;
    } else if (provider === 'openai') {
      fieldsHtml = `
        <div style="margin-top: 16px;">
          <label style="display: block; font-size: 13px; color: var(--text-secondary); margin-bottom: 8px;">API Key</label>
          <input type="password" id="llm-key" value="${settings.llmKeys.openai || ''}" style="width: 100%; padding: 10px; background: rgba(255,255,255,0.05); border: 1px solid var(--border-default); border-radius: var(--radius-md); color: var(--text-primary); outline: none;">
          <div style="margin-top: 16px;">
            <label style="display: block; font-size: 13px; color: var(--text-secondary); margin-bottom: 8px;">Model</label>
            <select id="llm-model" style="width: 100%; padding: 10px; background: rgba(255,255,255,0.05); border: 1px solid var(--border-default); border-radius: var(--radius-md); color: var(--text-primary); outline: none;">
              <option value="gpt-4o-mini" ${settings.llmModels.openai === 'gpt-4o-mini' ? 'selected' : ''}>gpt-4o-mini (Fast)</option>
              <option value="gpt-4o" ${settings.llmModels.openai === 'gpt-4o' ? 'selected' : ''}>gpt-4o (Best)</option>
            </select>
          </div>
        </div>
      `;
    } else if (provider === 'anthropic') {
      fieldsHtml = `
        <div style="margin-top: 16px;">
          <label style="display: block; font-size: 13px; color: var(--text-secondary); margin-bottom: 8px;">API Key</label>
          <input type="password" id="llm-key" value="${settings.llmKeys.anthropic || ''}" style="width: 100%; padding: 10px; background: rgba(255,255,255,0.05); border: 1px solid var(--border-default); border-radius: var(--radius-md); color: var(--text-primary); outline: none;">
          <div style="margin-top: 16px;">
            <label style="display: block; font-size: 13px; color: var(--text-secondary); margin-bottom: 8px;">Model</label>
            <select id="llm-model" style="width: 100%; padding: 10px; background: rgba(255,255,255,0.05); border: 1px solid var(--border-default); border-radius: var(--radius-md); color: var(--text-primary); outline: none;">
              <option value="claude-3-haiku-20240307" ${settings.llmModels.anthropic === 'claude-3-haiku-20240307' ? 'selected' : ''}>claude-3-haiku (Fast)</option>
              <option value="claude-3-5-sonnet-20240620" ${settings.llmModels.anthropic === 'claude-3-5-sonnet-20240620' ? 'selected' : ''}>claude-3.5-sonnet (Best)</option>
            </select>
          </div>
        </div>
      `;
    } else if (provider === 'groq') {
      fieldsHtml = `
        <div style="margin-top: 16px;">
          <label style="display: block; font-size: 13px; color: var(--text-secondary); margin-bottom: 8px;">API Key</label>
          <input type="password" id="llm-key" value="${settings.llmKeys.groq || ''}" style="width: 100%; padding: 10px; background: rgba(255,255,255,0.05); border: 1px solid var(--border-default); border-radius: var(--radius-md); color: var(--text-primary); outline: none;">
          <div style="margin-top: 16px;">
            <label style="display: block; font-size: 13px; color: var(--text-secondary); margin-bottom: 8px;">Model</label>
            <input type="text" id="llm-model" value="${settings.llmModels.groq || 'llama3-8b-8192'}" style="width: 100%; padding: 10px; background: rgba(255,255,255,0.05); border: 1px solid var(--border-default); border-radius: var(--radius-md); color: var(--text-primary); outline: none;" placeholder="e.g. llama3-8b-8192">
          </div>
        </div>
      `;
    } else if (provider === 'ollama') {
      fieldsHtml = `
        <div style="margin-top: 16px; padding: 12px; background: rgba(6, 182, 212, 0.1); border: 1px solid rgba(6, 182, 212, 0.2); border-radius: var(--radius-md);">
          <div style="font-size: 13px; color: var(--accent-cyan);">Make sure Ollama is running locally on port 11434.</div>
        </div>
        <div style="margin-top: 16px;">
          <label style="display: block; font-size: 13px; color: var(--text-secondary); margin-bottom: 8px;">Model Name</label>
          <input type="text" id="llm-model" value="${settings.llmModels.ollama || 'qwen2.5-coder:7b'}" style="width: 100%; padding: 10px; background: rgba(255,255,255,0.05); border: 1px solid var(--border-default); border-radius: var(--radius-md); color: var(--text-primary); outline: none;" placeholder="e.g. qwen2.5-coder:7b">
        </div>
      `;
    }

    dynamicFieldsContainer.innerHTML = fieldsHtml;
  };

  const updateSettingsFromForm = () => {
    const keyEl = panel.querySelector('#llm-key');
    const modelEl = panel.querySelector('#llm-model');
    const p = settings.llmProvider;
    
    if (keyEl && keyEl.value !== undefined) settings.llmKeys[p] = keyEl.value;
    if (modelEl && modelEl.value !== undefined) settings.llmModels[p] = modelEl.value;
  };

  const close = () => {
    modal.style.opacity = '0';
    panel.style.transform = 'translateY(20px)';
    setTimeout(() => modal.remove(), 300);
  };

  // Bind static events once
  panel.querySelector('#btn-close-setup').addEventListener('click', close);
  
  panel.querySelector('#btn-save-settings').addEventListener('click', async () => {
    updateSettingsFromForm();
    await window.smri.setSettings(settings);
    close();
  });

  panel.querySelector('#btn-test-connection').addEventListener('click', async () => {
    updateSettingsFromForm();
    await window.smri.setSettings(settings); // Save before testing so router picks it up
    
    const testResultEl = panel.querySelector('#test-result');
    testResultEl.style.color = 'var(--text-secondary)';
    testResultEl.textContent = 'Testing connection...';
    
    const result = await window.smri.testConnection();
    if (result.success) {
      testResultEl.style.color = 'var(--accent-emerald)';
      testResultEl.textContent = 'Success! Connected to LLM provider.';
    } else {
      testResultEl.style.color = 'var(--accent-rose)';
      testResultEl.textContent = `Error: ${result.error}`;
    }
  });

  // Initial render
  renderContent();
  modal.appendChild(panel);
  container.appendChild(modal);

  // Trigger animations
  requestAnimationFrame(() => {
    modal.style.opacity = '1';
    panel.style.transform = 'translateY(0)';
  });
}
