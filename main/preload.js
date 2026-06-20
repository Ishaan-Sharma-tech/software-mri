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
    ipcRenderer.on('analyze:error', (_, err) => cb({ status: 'error', message: err }));
    ipcRenderer.on('github:progress', (_, data) => cb(data));
    return () => {
      ipcRenderer.removeAllListeners('analyze:progress');
      ipcRenderer.removeAllListeners('analyze:error');
      ipcRenderer.removeAllListeners('github:progress');
    };
  },

  // Settings & LLM
  getSettings: () => ipcRenderer.invoke('settings:get'),
  setSettings: (settings) => ipcRenderer.invoke('settings:set', settings),
  openExternal: (url) => ipcRenderer.invoke('open-external', url),
  onAnalyzeError: (callback) => ipcRenderer.on('analyze:error', (_event, error) => callback(error)),
  testConnection: () => ipcRenderer.invoke('llm:testConnection'),

  // Local AI Model
  aiCheckModel: () => ipcRenderer.invoke('ai:check-model'),
  aiDownloadModel: () => ipcRenderer.invoke('ai:download'),
  aiStop: () => ipcRenderer.invoke('ai:stop'),
  aiChat: (payload) => ipcRenderer.invoke('ai:chat', payload),
  onAIToken: (callback) => {
    ipcRenderer.removeAllListeners('ai:token');
    ipcRenderer.on('ai:token', (_event, data) => callback(data.token));
  },
  onAIDone: (callback) => {
    ipcRenderer.removeAllListeners('ai:done');
    ipcRenderer.on('ai:done', () => callback());
  },
  onAIDownloadProgress: (callback) => {
    ipcRenderer.removeAllListeners('ai:download-progress');
    ipcRenderer.on('ai:download-progress', (_event, data) => callback(data));
  },

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
