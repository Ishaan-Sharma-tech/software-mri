const fs = require('fs/promises');
const path = require('path');
const { app } = require('electron');

let settingsPath = '';

// For local development without proper Electron installation:
try {
  settingsPath = path.join(app.getPath('userData'), 'software_mri_settings.json');
} catch (e) {
  settingsPath = path.join(__dirname, '..', '..', 'local_settings.json');
}

async function getSettings() {
  try {
    const data = await fs.readFile(settingsPath, 'utf-8');
    const parsed = JSON.parse(data);
    return parsed;
  } catch (e) {
    return {
      llmProvider: 'none',
      llmKeys: {
        openai: '',
        gemini: '',
        anthropic: '',
        groq: ''
      },
      llmModels: {
        openai: 'gpt-4o-mini',
        gemini: 'gemini-2.0-flash',
        anthropic: 'claude-3-haiku-20240307',
        ollama: 'qwen2.5-coder:7b',
        groq: 'llama3-8b-8192'
      }
    };
  }
}

async function saveSettings(settings) {
  await fs.writeFile(settingsPath, JSON.stringify(settings, null, 2), 'utf-8');
  return true;
}

module.exports = {
  getSettings,
  saveSettings
};
