const { getSettings } = require('../ipc/settings');

class LLMRouter {
  constructor() {
    this.providers = {};
  }

  async getProvider() {
    const settings = await getSettings();
    const providerName = settings.llmProvider;
    
    if (providerName === 'none' || !providerName) {
      throw new Error('No LLM Provider Configured');
    }

    if (!this.providers[providerName]) {
      try {
        const ProviderClass = require(`./providers/${providerName}`);
        this.providers[providerName] = new ProviderClass(settings.llmKeys[providerName], settings.llmModels[providerName]);
      } catch (e) {
        throw new Error(`Failed to load LLM provider: ${providerName}. ${e.message}`);
      }
    } else {
      // Update config just in case it changed
      this.providers[providerName].updateConfig(settings.llmKeys[providerName], settings.llmModels[providerName]);
    }

    return this.providers[providerName];
  }

  async testConnection() {
    try {
      const provider = await this.getProvider();
      return await provider.testConnection();
    } catch (e) {
      return { success: false, error: e.message };
    }
  }

  async complete(prompt, options = {}) {
    const provider = await this.getProvider();
    return provider.complete(prompt, options);
  }
}

module.exports = new LLMRouter();
