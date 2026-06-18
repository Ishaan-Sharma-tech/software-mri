const { app } = require('electron');
const path = require('path');
const fs = require('fs/promises');
const { exec } = require('child_process');
const crypto = require('crypto');
const { startAnalysis } = require('../analyzers/pipeline');

// Mock token for now (in a real app, this is retrieved via OAuth and stored in secure keychain)
let githubToken = null;

async function login() {
  return { success: true };
}

async function getRepos() {
  return [];
}

async function cloneRepo(repoUrl, sender) {
  return new Promise((resolve, reject) => {
    // Pre-flight check: Is Git installed?
    exec('git --version', async (error) => {
      if (error) {
        return reject(new Error('Git is not installed on your system. Please install Git to use the GitHub Import feature.'));
      }

      try {
        sender.send('github:progress', { status: 'cloning', progress: 0, message: 'Preparing temp directory...' });
        
        const tmpDir = path.join(app.getPath('temp'), 'software-mri-repos');
        await fs.mkdir(tmpDir, { recursive: true });
        
        const repoHash = crypto.createHash('md5').update(repoUrl).digest('hex').substring(0, 8);
        const targetDir = path.join(tmpDir, `repo_${repoHash}`);

        // If it exists, clear it
        try {
          await fs.rm(targetDir, { recursive: true, force: true });
        } catch (e) {}

        sender.send('github:progress', { status: 'cloning', progress: 10, message: `git clone ${repoUrl}` });

        // Run git clone via child_process
        const cmd = `git clone --depth 1 ${repoUrl} "${targetDir}"`;
        
        const child = exec(cmd, async (cloneError, stdout, stderr) => {
          if (cloneError) {
            console.error(`Clone error: ${cloneError.message}`);
            return reject(new Error(`Git clone failed. Please check the URL and try again. (${cloneError.message})`));
          }

          sender.send('github:progress', { status: 'analyzing', progress: 100, message: 'Clone complete! Starting analysis...' });
          
          // Trigger the standard pipeline on the cloned folder
          try {
            const projectId = await startAnalysis(targetDir, sender);
            resolve({ success: true, projectId, projectPath: targetDir });
          } catch (err) {
            reject(err);
          }
        });

      } catch (e) {
        reject(e);
      }
    });
  });
}

module.exports = {
  login,
  getRepos,
  cloneRepo
};
