export function showTimeline(container, projectId, data, onHeatmapChange) {
  let panel = container.querySelector('.timeline-panel');
  if (panel) return panel;

  panel = document.createElement('div');
  panel.className = 'timeline-panel';
  panel.style.cssText = `
    position: absolute;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
    width: 600px;
    background: var(--bg-glass);
    backdrop-filter: blur(12px);
    border: 1px solid var(--border-default);
    border-radius: var(--radius-xl);
    box-shadow: var(--shadow-lg);
    display: flex;
    flex-direction: column;
    z-index: var(--z-panel);
    padding: 16px;
    gap: 12px;
  `;

  panel.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center;">
      <h3 style="font-size: 14px; font-weight: 600; display: flex; align-items: center; gap: 8px;">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
        Git Archaeology
      </h3>
      <div style="display: flex; gap: 8px;">
        <select id="heatmap-select" style="background: var(--bg-tertiary); border: 1px solid var(--border-default); color: var(--text-primary); border-radius: var(--radius-sm); padding: 4px 8px; font-size: 12px; outline: none;">
          <option value="none">Heatmap: Off</option>
          <option value="churn">Churn (File Edit Frequency)</option>
        </select>
        <button id="btn-close-timeline" style="background: transparent; border: none; color: var(--text-secondary); cursor: pointer;">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"></path></svg>
        </button>
      </div>
    </div>
    
    <div id="timeline-content" style="text-align: center; color: var(--text-secondary); font-size: 12px;">
      <button id="btn-analyze-git" style="padding: 8px 16px; border-radius: var(--radius-md); background: var(--bg-tertiary); color: var(--text-primary); border: 1px solid var(--border-default); font-weight: 600; cursor: pointer; transition: all 0.2s;">Analyze Git History</button>
    </div>
  `;

  container.appendChild(panel);

  const btnClose = panel.querySelector('#btn-close-timeline');
  btnClose.addEventListener('click', () => {
    panel.remove();
    if (onHeatmapChange) onHeatmapChange('none', null);
  });

  const select = panel.querySelector('#heatmap-select');
  select.addEventListener('change', (e) => {
    if (onHeatmapChange) {
      if (data.archaeology && data.archaeology.analyzed) {
        onHeatmapChange(e.target.value, data.archaeology);
      } else {
        alert("Please analyze git history first!");
        select.value = 'none';
      }
    }
  });

  const btnAnalyze = panel.querySelector('#btn-analyze-git');
  if (btnAnalyze) {
    btnAnalyze.addEventListener('click', async () => {
      btnAnalyze.textContent = 'Parsing Git Log...';
      btnAnalyze.disabled = true;

      try {
        const newData = await window.smri.getArchaeology(projectId);
        // Mutate original data
        data.archaeology = newData.archaeology;
        data.graph.nodes.forEach(n => {
          const dn = newData.graph.nodes.find(x => x.id === n.id);
          if (dn && dn.archaeology) {
            n.archaeology = dn.archaeology;
          }
        });

        const content = panel.querySelector('#timeline-content');
        content.innerHTML = `
          <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
            <span>Project Age: ${data.archaeology.totalCommits} commits</span>
            <span>Max Churn: ${data.archaeology.maxChurn} edits/file</span>
          </div>
          <input type="range" min="0" max="100" value="100" style="width: 100%;" disabled title="Scrubbing coming soon!">
        `;
        
        // Auto select churn heatmap
        select.value = 'churn';
        if (onHeatmapChange) onHeatmapChange('churn', data.archaeology);

      } catch (err) {
        btnAnalyze.textContent = 'Analyze Git History';
        btnAnalyze.disabled = false;
        alert("Failed to read git history: " + err.message);
      }
    });
  }

  // Auto-trigger if already analyzed
  if (data.archaeology && data.archaeology.analyzed) {
    const content = panel.querySelector('#timeline-content');
    content.innerHTML = `
      <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
        <span>Project Age: ${data.archaeology.totalCommits} commits</span>
        <span>Max Churn: ${data.archaeology.maxChurn} edits/file</span>
      </div>
      <input type="range" min="0" max="100" value="100" style="width: 100%;" disabled title="Scrubbing coming soon!">
    `;
  }

  return panel;
}
