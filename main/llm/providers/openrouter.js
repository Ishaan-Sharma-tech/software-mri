class OpenRouterProvider {
  constructor(apiKey, model) {
    this.apiKey = apiKey;
    this.model = model || 'anthropic/claude-3-haiku';
  }

  updateConfig(apiKey, model) {
    this.apiKey = apiKey;
    if (model) this.model = model;
  }

  async testConnection() {
    if (!this.apiKey) return { success: false, error: 'API key is missing' };
    
    try {
      const response = await fetch('https://openrouter.ai/api/v1/auth/key', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'HTTP-Referer': 'https://softwaremri.app',
          'X-Title': 'Software MRI'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        return { success: false, error: errorData.error?.message || 'Failed to connect to OpenRouter' };
      }

      return { success: true };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }

  async complete(prompt, options = {}) {
    if (!this.apiKey) throw new Error('OpenRouter API key is missing');

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
        'HTTP-Referer': 'https://softwaremri.app',
        'X-Title': 'Software MRI'
      },
      body: JSON.stringify({
        model: this.model,
        messages: [{ role: 'user', content: prompt }],
        temperature: options.temperature ?? 0.3,
        max_tokens: options.maxTokens ?? 2048,
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'Failed to get completion from OpenRouter');
    }

    const data = await response.json();
    return data.choices[0].message.content;
  }
}

module.exports = OpenRouterProvider;
