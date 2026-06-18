import { showEmptyScreen } from './empty.js';

export function showWelcomeScreen(container) {
  container.innerHTML = `
    <div class="screen welcome-screen" style="align-items: center; justify-content: center; background: var(--bg-primary);">
      <h1 style="font-size: 48px; font-weight: 800; margin-bottom: 24px; background: var(--gradient-primary); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">Welcome to Software MRI</h1>
      <p style="font-size: 18px; color: var(--text-secondary); margin-bottom: 40px;">A fundamentally new way to understand software systems.</p>
      
      <div style="background: var(--bg-secondary); padding: 32px; border-radius: var(--radius-lg); border: 1px solid var(--border-default); box-shadow: var(--shadow-lg); max-width: 500px; text-align: center;">
        <h2 style="font-size: 20px; margin-bottom: 20px;">What brings you to Software MRI?</h2>
        
        <div style="display: flex; flex-direction: column; gap: 12px; margin-bottom: 24px;">
          <button class="choice-btn" style="padding: 16px; border-radius: var(--radius-md); border: 1px solid var(--border-default); background: var(--bg-tertiary); color: var(--text-primary); font-size: 16px; transition: all 0.2s;">Joining a new codebase</button>
          <button class="choice-btn" style="padding: 16px; border-radius: var(--radius-md); border: 1px solid var(--border-default); background: var(--bg-tertiary); color: var(--text-primary); font-size: 16px; transition: all 0.2s;">Planning a refactor</button>
          <button class="choice-btn" style="padding: 16px; border-radius: var(--radius-md); border: 1px solid var(--border-default); background: var(--bg-tertiary); color: var(--text-primary); font-size: 16px; transition: all 0.2s;">Code review</button>
        </div>
        
        <button id="skip-tour" style="background: none; border: none; color: var(--text-muted); text-decoration: underline; font-size: 14px;">Skip tour</button>
      </div>
    </div>
  `;

  // Basic styling for buttons
  const style = document.createElement('style');
  style.textContent = `
    .choice-btn:hover { background: var(--border-hover); border-color: var(--accent-blue); transform: translateY(-2px); }
  `;
  document.head.appendChild(style);

  // Attach events
  const finishOnboarding = async (goal) => {
    localStorage.setItem('smri_has_launched', 'true');
    
    // Auto-Demo Onboarding!
    const btnText = typeof goal === 'string' ? goal : 'Exploring';
    container.innerHTML = `
      <div style="height: 100vh; width: 100vw; display: flex; flex-direction: column; align-items: center; justify-content: center; background: var(--bg-primary);">
        <div class="loading-spinner" style="width: 40px; height: 40px; border: 3px solid var(--border-default); border-top-color: var(--text-primary); border-radius: 50%; animation: spin 1s linear infinite; margin-bottom: 24px;"></div>
        <h2 style="color: var(--text-primary); font-weight: 500;">Loading Auto-Demo...</h2>
        <p style="color: var(--text-secondary); margin-top: 8px;">Preparing MRI engine for: ${btnText}</p>
      </div>
      <style>@keyframes spin { 100% { transform: rotate(360deg); } }</style>
    `;

    try {
      // Fetch the pre-analyzed demo project
      const response = await fetch('./demo/express-demo.json');
      const data = await response.json();
      
      // Load the 3D explorer
      const { initGraph } = await import('./explorer.js');
      initGraph(container, data);
      
      // We could add an automated tour here by firing toolbar events!
      setTimeout(() => {
        if (btnText.includes('Code review')) {
          window.dispatchEvent(new CustomEvent('toolbar:action', { detail: { action: 'btn-layer-disease' } }));
        } else if (btnText.includes('Joining')) {
          window.dispatchEvent(new CustomEvent('toolbar:action', { detail: { action: 'btn-layer-organs' } }));
        }
      }, 2000);
      
    } catch (err) {
      console.error(err);
      // Fallback
      const { showDashboardScreen } = await import('./dashboard.js');
      showDashboardScreen(container);
    }
  };

  container.querySelectorAll('.choice-btn').forEach(btn => {
    btn.addEventListener('click', () => finishOnboarding(btn.textContent));
  });
  
  container.querySelector('#skip-tour').addEventListener('click', () => finishOnboarding('Skip'));
}
