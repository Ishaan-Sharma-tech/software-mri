class OllamaProvider {
  constructor(apiKey, model) {
    // API key is ignored for local Ollama
    this.model = model || 'qwen2.5-coder:7b';
    this.baseUrl = 'http://localhost:11434';
  }

  updateConfig(apiKey, model) {
    if (model) this.model = model;
  }

  async testConnection() {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`);
      if (!response.ok) {
        return { success: false, error: 'Ollama is not running or unreachable' };
      }
      
      const data = await response.json();
      const hasModel = data.models.some(m => m.name === this.model || m.name.startsWith(this.model + ':'));
      
      if (!hasModel) {
        return { success: false, error: `Connected to Ollama, but model '${this.model}' is not installed. Run 'ollama run ${this.model}' in terminal.` };
      }

      return { success: true };
    } catch (e) {
      return { success: false, error: `Failed to connect to Ollama at ${this.baseUrl}. Is it running?` };
    }
  }

  async complete(prompt, options = {}) {
    const response = await fetch(`${this.baseUrl}/api/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: this.model,
        prompt: prompt,
        stream: false,
        options: {
          temperature: options.temperature ?? 0.3,
          num_predict: options.maxTokens ?? 2048,
        }
      })
    });

    if (!response.ok) {
      throw new Error('Failed to get completion from Ollama');
    }

    const data = await response.json();
    return data.response;
  }
}

module.exports = OllamaProvider;
