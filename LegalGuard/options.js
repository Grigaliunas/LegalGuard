// LegalGuard Options Script
// Author: Dr. Šarūnas Grigaliūnas

class LegalGuardOptions {
  constructor() {
    this.settings = {};
    this.initialize();
  }

  async initialize() {
    await this.loadSettings();
    this.setupEventListeners();
    this.updateUI();
  }

  async loadSettings() {
    const result = await chrome.storage.sync.get('settings');
    this.settings = result.settings || this.getDefaultSettings();
  }

  getDefaultSettings() {
    return {
      sslCertificateAge: 30,
      domainRegistrationAge: 14,
      torrentDetection: true,
      illegalDatabases: [
        'https://api.example-blocklist.com/check',
        'https://malware-database.example.com/verify'
      ],
      apiKey: '',
      enableAIAnalysis: false
    };
  }

  setupEventListeners() {
    // Range inputs
    const sslRange = document.getElementById('sslCertificateAge');
    const domainRange = document.getElementById('domainRegistrationAge');
    
    sslRange.addEventListener('input', (e) => {
      document.getElementById('sslCertificateAgeValue').textContent = e.target.value;
      this.settings.sslCertificateAge = parseInt(e.target.value);
    });

    domainRange.addEventListener('input', (e) => {
      document.getElementById('domainRegistrationAgeValue').textContent = e.target.value;
      this.settings.domainRegistrationAge = parseInt(e.target.value);
    });

    // Checkboxes
    document.getElementById('torrentDetection').addEventListener('change', (e) => {
      this.settings.torrentDetection = e.target.checked;
    });

    document.getElementById('enableAIAnalysis').addEventListener('change', (e) => {
      this.settings.enableAIAnalysis = e.target.checked;
      this.updateAPIStatus();
    });

    // API Key
    document.getElementById('apiKey').addEventListener('input', (e) => {
      this.settings.apiKey = e.target.value;
      this.updateAPIStatus();
    });

    // Buttons
    document.getElementById('addDatabaseBtn').addEventListener('click', () => {
      this.addDatabase();
    });

    document.getElementById('testApiBtn').addEventListener('click', () => {
      this.testAPIConnection();
    });

    document.getElementById('saveBtn').addEventListener('click', () => {
      this.saveSettings();
    });

    document.getElementById('resetBtn').addEventListener('click', () => {
      this.resetSettings();
    });

    // Enter key in new database input
    document.getElementById('newDatabaseUrl').addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.addDatabase();
      }
    });
  }

  updateUI() {
    // Range values
    document.getElementById('sslCertificateAge').value = this.settings.sslCertificateAge;
    document.getElementById('sslCertificateAgeValue').textContent = this.settings.sslCertificateAge;
    
    document.getElementById('domainRegistrationAge').value = this.settings.domainRegistrationAge;
    document.getElementById('domainRegistrationAgeValue').textContent = this.settings.domainRegistrationAge;

    // Checkboxes
    document.getElementById('torrentDetection').checked = this.settings.torrentDetection;
    document.getElementById('enableAIAnalysis').checked = this.settings.enableAIAnalysis;

    // API Key
    document.getElementById('apiKey').value = this.settings.apiKey || '';

    // Database list
    this.updateDatabaseList();
    this.updateAPIStatus();
  }

  updateDatabaseList() {
    const container = document.getElementById('databaseList');
    container.innerHTML = '';

    this.settings.illegalDatabases.forEach((url, index) => {
      const item = document.createElement('div');
      item.className = 'database-item';
      item.innerHTML = `
        <input type="url" value="${url}" data-index="${index}">
        <button type="button" onclick="legalGuardOptions.removeDatabase(${index})">Remove</button>
      `;
      
      // Add event listener for URL changes
      const input = item.querySelector('input');
      input.addEventListener('change', (e) => {
        this.settings.illegalDatabases[index] = e.target.value;
      });

      container.appendChild(item);
    });
  }

  addDatabase() {
    const input = document.getElementById('newDatabaseUrl');
    const url = input.value.trim();

    if (!url) {
      this.showMessage('Please enter a valid URL', 'error');
      return;
    }

    try {
      new URL(url); // Validate URL
      this.settings.illegalDatabases.push(url);
      input.value = '';
      this.updateDatabaseList();
      this.showMessage('Database added successfully', 'success');
    } catch (error) {
      this.showMessage('Please enter a valid URL', 'error');
    }
  }

  removeDatabase(index) {
    this.settings.illegalDatabases.splice(index, 1);
    this.updateDatabaseList();
    this.showMessage('Database removed', 'success');
  }

  updateAPIStatus() {
    const statusEl = document.getElementById('apiStatus');
    const indicator = statusEl.querySelector('.status-indicator');
    const text = statusEl.querySelector('span');

    if (!this.settings.apiKey) {
      indicator.className = 'status-indicator disconnected';
      text.textContent = 'API key not configured';
    } else if (!this.settings.enableAIAnalysis) {
      indicator.className = 'status-indicator disconnected';
      text.textContent = 'AI analysis disabled';
    } else {
      indicator.className = 'status-indicator connected';
      text.textContent = 'API key configured';
    }
  }

  async testAPIConnection() {
    const testBtn = document.getElementById('testApiBtn');
    const statusEl = document.getElementById('apiStatus');
    const indicator = statusEl.querySelector('.status-indicator');
    const text = statusEl.querySelector('span');

    if (!this.settings.apiKey) {
      this.showMessage('Please enter an API key first', 'error');
      return;
    }

    testBtn.disabled = true;
    indicator.className = 'status-indicator testing';
    text.textContent = 'Testing connection...';

    try {
      const response = await fetch('https://api.openai.com/v1/models', {
        headers: {
          'Authorization': `Bearer ${this.settings.apiKey}`
        }
      });

      if (response.ok) {
        indicator.className = 'status-indicator connected';
        text.textContent = 'API connection successful';
        this.showMessage('API connection test successful!', 'success');
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error) {
      indicator.className = 'status-indicator disconnected';
      text.textContent = 'API connection failed';
      this.showMessage(`API test failed: ${error.message}`, 'error');
    } finally {
      testBtn.disabled = false;
    }
  }

  async saveSettings() {
    const saveBtn = document.getElementById('saveBtn');
    const originalText = saveBtn.innerHTML;

    saveBtn.disabled = true;
    saveBtn.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style="animation: spin 1s linear infinite;">
        <path d="M12,4V2A10,10 0 0,0 2,12H4A8,8 0 0,1 12,4Z"/>
      </svg>
      Saving...
    `;

    try {
      await chrome.storage.sync.set({ settings: this.settings });
      
      // Send message to background script to update settings
      chrome.runtime.sendMessage({
        action: 'saveSettings',
        settings: this.settings
      });

      this.showMessage('Settings saved successfully!', 'success');
    } catch (error) {
      this.showMessage('Failed to save settings: ' + error.message, 'error');
    } finally {
      saveBtn.disabled = false;
      saveBtn.innerHTML = originalText;
    }
  }

  async resetSettings() {
    if (!confirm('Are you sure you want to reset all settings to default values?')) {
      return;
    }

    this.settings = this.getDefaultSettings();
    this.updateUI();
    this.showMessage('Settings reset to defaults', 'success');
  }

  showMessage(message, type) {
    const messagesContainer = document.getElementById('messages');
    
    // Remove existing messages
    messagesContainer.innerHTML = '';

    const messageEl = document.createElement('div');
    messageEl.className = `${type}-message`;
    messageEl.textContent = message;

    messagesContainer.appendChild(messageEl);

    // Auto-remove after 5 seconds
    setTimeout(() => {
      messageEl.remove();
    }, 5000);

    // Scroll to top to ensure message is visible
    window.scrollTo(0, 0);
  }
}

// Global reference for inline event handlers
let legalGuardOptions;

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  legalGuardOptions = new LegalGuardOptions();
});

// Add CSS animation for spinning
const style = document.createElement('style');
style.textContent = `
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
`;
document.head.appendChild(style);