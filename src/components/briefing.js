export function showBriefing(container, data, onContinue) {
  const briefing = document.createElement('div');
  briefing.className = 'screen briefing-screen';
  briefing.style.cssText = `
    position: absolute;
    top: 0; left: 0; right: 0; bottom: 0;
    background: radial-gradient(circle at center, rgba(17,24,39,0.9), rgba(5,5,5,0.95));
    backdrop-filter: blur(10px);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    z-index: var(--z-panel);
    padding: 40px;
    opacity: 0;
    transition: opacity 0.8s ease;
  `;

  briefing.innerHTML = `
    <div style="max-width: 900px; width: 100%; text-align: center;">
      <div style="display: inline-block; padding: 6px 16px; border-radius: var(--radius-full); background: rgba(59, 130, 246, 0.1); border: 1px solid rgba(59, 130, 246, 0.2); color: var(--accent-blue); font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 24px; box-shadow: var(--shadow-glow); transform: translateY(20px); opacity: 0; animation: fadeUp 0.6s ease forwards 0.2s;">
        Analysis Complete
      </div>
      
      <h1 style="font-size: 48px; font-weight: 800; margin-bottom: 16px; background: linear-gradient(135deg, #fff, #9ca3af); -webkit-background-clip: text; -webkit-text-fill-color: transparent; transform: translateY(20px); opacity: 0; animation: fadeUp 0.6s ease forwards 0.3s;">
        ${data.projectPath.split(/[/\\]/).pop() || 'Project'}
      </h1>
      
      <p style="color: var(--text-secondary); font-size: 18px; margin-bottom: 64px; font-family: var(--font-mono); transform: translateY(20px); opacity: 0; animation: fadeUp 0.6s ease forwards 0.4s;">
        ${data.projectPath}
      </p>
      
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 32px; margin-bottom: 64px;">
        
        <div style="background: linear-gradient(180deg, rgba(255,255,255,0.03) 0%, rgba(0,0,0,0) 100%); border: 1px solid rgba(255,255,255,0.05); border-top: 1px solid rgba(255,255,255,0.1); border-radius: var(--radius-xl); padding: 32px; text-align: left; transform: translateY(20px); opacity: 0; animation: fadeUp 0.6s ease forwards 0.5s; position: relative; overflow: hidden;">
          <div style="position: absolute; top: 0; left: 50%; transform: translateX(-50%); width: 40%; height: 1px; background: var(--gradient-primary); box-shadow: var(--shadow-glow);"></div>
          <div style="color: var(--accent-blue); margin-bottom: 16px;"><svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg></div>
          <div style="font-size: 40px; font-weight: 800; margin-bottom: 8px; color: var(--text-primary);">${data.stats.totalFiles}</div>
          <div style="color: var(--text-muted); font-size: 14px; text-transform: uppercase; letter-spacing: 0.05em;">Total Files</div>
        </div>

        <div style="background: linear-gradient(180deg, rgba(255,255,255,0.03) 0%, rgba(0,0,0,0) 100%); border: 1px solid rgba(255,255,255,0.05); border-top: 1px solid rgba(255,255,255,0.1); border-radius: var(--radius-xl); padding: 32px; text-align: left; transform: translateY(20px); opacity: 0; animation: fadeUp 0.6s ease forwards 0.6s; position: relative; overflow: hidden;">
          <div style="position: absolute; top: 0; left: 50%; transform: translateX(-50%); width: 40%; height: 1px; background: var(--gradient-success); box-shadow: var(--shadow-neon-cyan);"></div>
          <div style="color: var(--accent-emerald); margin-bottom: 16px;"><svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg></div>
          <div style="font-size: 40px; font-weight: 800; margin-bottom: 8px; color: var(--text-primary);">${data.stats.totalLines.toLocaleString()}</div>
          <div style="color: var(--text-muted); font-size: 14px; text-transform: uppercase; letter-spacing: 0.05em;">Lines of Code</div>
        </div>

        <div style="background: linear-gradient(180deg, rgba(255,255,255,0.03) 0%, rgba(0,0,0,0) 100%); border: 1px solid rgba(255,255,255,0.05); border-top: 1px solid rgba(255,255,255,0.1); border-radius: var(--radius-xl); padding: 32px; text-align: left; transform: translateY(20px); opacity: 0; animation: fadeUp 0.6s ease forwards 0.7s; position: relative; overflow: hidden;">
          <div style="position: absolute; top: 0; left: 50%; transform: translateX(-50%); width: 40%; height: 1px; background: linear-gradient(90deg, #8b5cf6, #d946ef); box-shadow: var(--shadow-neon-violet);"></div>
          <div style="color: var(--accent-violet); margin-bottom: 16px;"><svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg></div>
          <div style="font-size: 40px; font-weight: 800; margin-bottom: 8px; color: var(--text-primary);">${data.graph.links.length}</div>
          <div style="color: var(--text-muted); font-size: 14px; text-transform: uppercase; letter-spacing: 0.05em;">Dependencies</div>
        </div>
      </div>
      
      <button id="btn-explore" style="padding: 18px 48px; border-radius: var(--radius-full); background: var(--text-primary); color: var(--bg-primary); border: none; font-weight: 700; font-size: 18px; box-shadow: 0 0 40px rgba(255,255,255,0.2); cursor: pointer; transition: all 0.3s ease; transform: translateY(20px); opacity: 0; animation: fadeUp 0.6s ease forwards 0.9s;">
        Enter the MRI
      </button>
    </div>
  `;

  const style = document.createElement('style');
  style.textContent = `
    @keyframes fadeUp {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }
    #btn-explore:hover {
      transform: scale(1.05) translateY(-2px);
      box-shadow: 0 10px 40px rgba(255,255,255,0.4);
    }
  `;
  briefing.appendChild(style);

  container.appendChild(briefing);

  // Trigger entrance
  requestAnimationFrame(() => {
    briefing.style.opacity = '1';
  });

  briefing.querySelector('#btn-explore').addEventListener('click', () => {
    briefing.style.opacity = '0';
    setTimeout(() => {
      briefing.remove();
      onContinue();
    }, 800);
  });
}
