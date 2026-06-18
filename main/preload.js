const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('smri', {
  // Window
  minimize: () => ipcRenderer.send('window-minimize'),
  maximize: () => ipcRenderer.send('window-maximize'),
  close: () => ipcRenderer.send('window-close'),

  // Project
  openFolder: () => ipcRenderer.invoke('project:openFolder'),
  readFile: (filePath) => ipcRenderer.invoke('project:readFile', filePath),
  writeFile: (filePath, content) => ipcRenderer.invoke('project:writeFile', filePath, content),

  // Analysis
  analyze: (projectPath) => ipcRenderer.invoke('analyze:start', projectPath),
  onProgress: (cb) => {
    ipcRenderer.on('analyze:progress', (_, data) => cb(data));
    ipcRenderer.on('github:progress', (_, data) => cb(data));
    return () => {
      ipcRenderer.removeAllListeners('analyze:progress');
      ipcRenderer.removeAllListeners('github:progress');
    };
  },

  // Settings & LLM
  getSettings: () => ipcRenderer.invoke('settings:get'),
  setSettings: (settings) => ipcRenderer.invoke('settings:set', settings),
  testConnection: () => ipcRenderer.invoke('llm:testConnection'),

  // Advanced Layers
  getOrgans: (projectId) => ipcRenderer.invoke('analyze:organs', projectId),
  getBloodFlow: (projectId) => ipcRenderer.invoke('analyze:bloodflow', projectId),
  getArchaeology: (projectId) => ipcRenderer.invoke('analyze:archaeology', projectId),
  queryBrain: (projectId, question) => ipcRenderer.invoke('query:brain', projectId, question),

  // GitHub
  githubLogin: () => ipcRenderer.invoke('github:login'),
  githubGetRepos: () => ipcRenderer.invoke('github:getRepos'),
  githubCloneRepo: (repoUrl) => ipcRenderer.invoke('github:cloneRepo', repoUrl)
});
