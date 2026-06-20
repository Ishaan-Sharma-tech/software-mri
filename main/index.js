const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const isDev = !app.isPackaged;

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1000,
    height: 700,
    frame: false,
    transparent: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  // Titlebar IPC
  ipcMain.on('window-minimize', () => mainWindow.minimize());
  ipcMain.on('window-maximize', () => {
    if (mainWindow.isMaximized()) {
      mainWindow.restore();
    } else {
      mainWindow.maximize();
    }
  });
  ipcMain.on('window-close', () => mainWindow.close());

  // Maximize by default on load
  mainWindow.maximize();

  // Folder Open
  ipcMain.handle('project:openFolder', async () => {
    const { dialog } = require('electron');
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openDirectory']
    });
    if (!result.canceled && result.filePaths.length > 0) {
      return result.filePaths[0];
    }
    return null;
  });

  // Read/Write File Content
  const fs = require('fs/promises');
  ipcMain.handle('project:readFile', async (event, filePath) => {
    try {
      return await fs.readFile(filePath, 'utf-8');
    } catch (e) {
      throw new Error('Could not read file: ' + e.message);
    }
  });

  ipcMain.handle('project:writeFile', async (event, filePath, content) => {
    try {
      await fs.writeFile(filePath, content, 'utf-8');
      return true;
    } catch (e) {
      throw new Error('Could not save file: ' + e.message);
    }
  });

  // Analysis
  const { startAnalysis } = require('./analyzers/pipeline');
  ipcMain.handle('analyze:start', async (event, projectPath) => {
    return await startAnalysis(projectPath, event.sender);
  });

  // Settings & LLM
  const { getSettings, saveSettings } = require('./ipc/settings');
  const llmRouter = require('./llm/router');

  ipcMain.handle('settings:get', async () => {
    return await getSettings();
  });

  ipcMain.handle('settings:set', async (event, settings) => {
    return await saveSettings(settings);
  });

  ipcMain.handle('llm:testConnection', async () => {
    return await llmRouter.testConnection();
  });

  // Advanced Layers
  const { analyzeOrgans } = require('./analyzers/organs');
  ipcMain.handle('analyze:organs', async (event, projectId) => {
    return await analyzeOrgans(projectId);
  });

  const { analyzeBloodFlow } = require('./analyzers/bloodflow');
  ipcMain.handle('analyze:bloodflow', async (event, projectId) => {
    return await analyzeBloodFlow(projectId);
  });

  const { queryBrain } = require('./analyzers/brain');
  ipcMain.handle('query:brain', async (event, projectId, question) => {
    return await queryBrain(projectId, question);
  });

  const { analyzeArchaeology } = require('./analyzers/archaeology');
  ipcMain.handle('analyze:archaeology', async (event, projectId) => {
    return await analyzeArchaeology(projectId);
  });

  // GitHub Integration
  const github = require('./ipc/github');
  ipcMain.handle('github:login', async () => {
    return await github.login();
  });
  ipcMain.handle('github:getRepos', async () => {
    return await github.getRepos();
  });

  // Local AI Model Integration
  const localModel = require('./llm/local-model');
  const { getSystemPrompt } = require('./llm/context-builder');

  ipcMain.handle('ai:check-model', () => {
    return localModel.checkModelExists();
  });

  ipcMain.handle('ai:download', async (event) => {
    await localModel.downloadModel(event.sender);
  });

  ipcMain.handle('ai:stop', () => {
    localModel.stopGeneration();
  });

  ipcMain.handle('ai:chat', async (event, payload) => {
    const { projectId, question, selectedFilePath } = payload;
    try {
      const systemPrompt = getSystemPrompt(projectId, selectedFilePath);
      return await localModel.chat(question, systemPrompt, event.sender);
    } catch (err) {
      console.error('[Local AI IPC Error]', err);
      event.sender.send('ai:done');
      throw err;
    }
  });
  ipcMain.handle('github:cloneRepo', async (event, repoUrl) => {
    return await github.cloneRepo(repoUrl, event.sender);
  });

  // Removed Subscription Checkout
}

// Deep Linking Setup
if (process.defaultApp) {
  if (process.argv.length >= 2) {
    app.setAsDefaultProtocolClient('softwaremri', process.execPath, [path.resolve(process.argv[1])]);
  }
} else {
  app.setAsDefaultProtocolClient('softwaremri');
}

const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', (event, commandLine, workingDirectory) => {
    // Someone tried to run a second instance, we should focus our window.
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
    const url = commandLine.pop();
    handleDeepLink(url);
  });

  app.whenReady().then(() => {
    createWindow();

    // Setup auto-updater
    const { setupAutoUpdater } = require('./updater/auto-update');
    setupAutoUpdater(mainWindow);

    app.on('activate', function () {
      if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
  });
}

// macOS deep link handling
app.on('open-url', (event, url) => {
  event.preventDefault();
  handleDeepLink(url);
});

async function handleDeepLink(url) {
  // Deep link handler for future features (e.g., GitHub OAuth)
}

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});
