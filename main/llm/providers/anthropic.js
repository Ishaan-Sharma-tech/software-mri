class AnthropicProvider {
  constructor(apiKey, model) {
    this.apiKey = apiKey;
    this.model = model || 'claude-3-haiku-20240307';
  }

  updateConfig(apiKey, model) {
    this.apiKey = apiKey;
    if (model) this.model = model;
  }

  async testConnection() {
    if (!this.apiKey) return { success: false, error: 'API key is missing' };
    
    try {
      // Anthropic does not have a dedicated "models" endpoint that acts as a simple ping, 
      // so we send a tiny request to validate the key.
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          model: this.model,
          max_tokens: 1,
          messages: [{ role: 'user', content: 'Ping' }]
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        return { success: false, error: errorData.error?.message || 'Failed to connect to Anthropic' };
      }

      return { success: true };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }

  async complete(prompt, options = {}) {
    if (!this.apiKey) throw new Error('Anthropic API key is missing');

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        model: this.model,
        max_tokens: options.maxTokens ?? 2048,
        temperature: options.temperature ?? 0.3,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'Failed to get completion from Anthropic');
    }

    const data = await response.json();
    return data.content[0].text;
  }
}

module.exports = AnthropicProvider;
