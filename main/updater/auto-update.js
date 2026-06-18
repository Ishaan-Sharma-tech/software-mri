const { autoUpdater } = require('electron-updater');
const log = require('electron-log'); // We should use electron-log for logging

// Configure logger for updater
autoUpdater.logger = log;
autoUpdater.logger.transports.file.level = 'info';

function setupAutoUpdater(mainWindow) {
  log.info('App starting...');
  
  // Download updates silently in the background
  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;

  autoUpdater.on('checking-for-update', () => {
    log.info('Checking for update...');
  });

  autoUpdater.on('update-available', (info) => {
    log.info('Update available.');
  });

  autoUpdater.on('update-not-available', (info) => {
    log.info('Update not available.');
  });

  autoUpdater.on('error', (err) => {
    log.error('Error in auto-updater. ' + err);
  });

  autoUpdater.on('download-progress', (progressObj) => {
    let log_message = "Download speed: " + progressObj.bytesPerSecond;
    log_message = log_message + ' - Downloaded ' + progressObj.percent + '%';
    log_message = log_message + ' (' + progressObj.transferred + "/" + progressObj.total + ')';
    log.info(log_message);
  });

  autoUpdater.on('update-downloaded', (info) => {
    log.info('Update downloaded');
    // Notify the renderer that an update is ready
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('update:ready', info.version);
    }
  });

  // Check for updates on launch
  autoUpdater.checkForUpdatesAndNotify();

  // Check for updates every 4 hours
  setInterval(() => {
    autoUpdater.checkForUpdatesAndNotify();
  }, 4 * 60 * 60 * 1000);
}

module.exports = { setupAutoUpdater };
