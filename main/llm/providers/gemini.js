class GeminiProvider {
  constructor(apiKey, model) {
    this.apiKey = apiKey;
    this.model = model || 'gemini-2.5-flash';
  }

  updateConfig(apiKey, model) {
    this.apiKey = apiKey;
    if (model) this.model = model;
  }

  async testConnection() {
    if (!this.apiKey) return { success: false, error: 'API key is missing' };
    
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: "Hello" }] }]
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        return { success: false, error: errorData.error?.message || 'Failed to connect to Gemini' };
      }

      return { success: true };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }

  async complete(prompt, options = {}) {
    if (!this.apiKey) throw new Error('Gemini API key is missing');

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: options.temperature ?? 0.3,
          maxOutputTokens: options.maxTokens ?? 2048,
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'Failed to get completion from Gemini');
    }

    const data = await response.json();
    return data.candidates[0].content.parts[0].text;
  }
}

module.exports = GeminiProvider;
