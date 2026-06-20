const fs = require('fs');
const path = require('path');
const https = require('https');

let llamaModule = null;
let llama = null;
let model = null;
let context = null;
let session = null;
let isDownloading = false;
let currentController = null; // AbortController for generating tokens

const MODEL_FILENAME = 'qwen2.5-coder-1.5b-q4_k_m.gguf';
// Download URL for Qwen2.5-Coder-1.5B (GGUF Q4_K_M)
const MODEL_URL = 'https://huggingface.co/Qwen/Qwen2.5-Coder-1.5B-Instruct-GGUF/resolve/main/qwen2.5-coder-1.5b-instruct-q4_k_m.gguf';

// We store the model in <app_dir>/models/
const getModelsDir = () => path.join(__dirname, '..', '..', 'models');
const getModelPath = () => path.join(getModelsDir(), MODEL_FILENAME);

function checkModelExists() {
  return fs.existsSync(getModelPath());
}

async function downloadModel(sender) {
  if (isDownloading) throw new Error('Download already in progress');
  
  const modelsDir = getModelsDir();
  if (!fs.existsSync(modelsDir)) {
    fs.mkdirSync(modelsDir, { recursive: true });
  }

  isDownloading = true;
  const filePath = getModelPath();
  const file = fs.createWriteStream(filePath);

  return new Promise((resolve, reject) => {
    https.get(MODEL_URL, (response) => {
      // Handle redirects
      if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
        https.get(response.headers.location, handleResponse).on('error', handleError);
        return;
      }
      handleResponse(response);
    }).on('error', handleError);

    function handleResponse(response) {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download model: HTTP ${response.statusCode}`));
        return;
      }

      const totalBytes = parseInt(response.headers['content-length'] || '0', 10);
      let downloadedBytes = 0;

      response.on('data', (chunk) => {
        downloadedBytes += chunk.length;
        if (totalBytes > 0) {
          const progress = (downloadedBytes / totalBytes) * 100;
          if (sender) {
            sender.send('ai:download-progress', { progress: progress.toFixed(1), downloadedBytes, totalBytes });
          }
        }
      });

      response.pipe(file);

      file.on('finish', () => {
        file.close();
        isDownloading = false;
        resolve();
      });
    }

    function handleError(err) {
      fs.unlink(filePath, () => {});
      isDownloading = false;
      reject(err);
    }
  });
}

async function initModel() {
  if (model && context) return;

  if (!checkModelExists()) {
    throw new Error('Model file not found. Please download it first.');
  }

  if (!llamaModule) {
    llamaModule = await import('node-llama-cpp');
  }
  
  if (!llama) {
    llama = await llamaModule.getLlama();
  }

  console.log('[Local AI] Loading model...');
  model = await llama.loadModel({
    modelPath: getModelPath()
  });

  console.log('[Local AI] Creating context...');
  context = await model.createContext();
  
  console.log('[Local AI] Model initialized successfully.');
}

async function chat(prompt, systemPrompt, sender) {
  currentController = new AbortController();
  
  if (!context) {
    await initModel();
  }

  // We recreate the session each time to easily inject the dynamic system prompt
  const chatSession = new llamaModule.LlamaChatSession({
    contextSequence: context.getSequence(),
    systemPrompt: systemPrompt
  });

  try {
    const response = await chatSession.prompt(prompt, {
      signal: currentController.signal,
      onTextChunk: (chunk) => {
        if (sender) {
          sender.send('ai:token', { token: chunk });
        }
      }
    });

    if (sender) {
      sender.send('ai:done');
    }
    return response;
  } catch (err) {
    if (err.name === 'AbortError') {
      console.log('[Local AI] Generation aborted by user.');
      if (sender) sender.send('ai:done'); // Send done even on abort so UI resets
    } else {
      console.error('[Local AI] Generation error:', err);
      throw err;
    }
  } finally {
    currentController = null;
  }
}

function stopGeneration() {
  if (currentController) {
    currentController.abort();
    currentController = null;
  }
}

module.exports = {
  checkModelExists,
  downloadModel,
  initModel,
  chat,
  stopGeneration
};
