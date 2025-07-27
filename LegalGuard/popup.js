// LegalGuard Popup Script
// Author: Dr. Šarūnas Grigaliūnas

class LegalGuardPopup {
  constructor() {
    this.currentTab = null;
    this.statusData = null;
    this.initialize();
  }

  async initialize() {
    await this.getCurrentTab();
    this.setupEventListeners();
    await this.loadStatus();
  }

  async getCurrentTab() {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    this.currentTab = tabs[0];
  }

  setupEventListeners() {
    const aiAnalysisBtn = document.getElementById('aiAnalysisBtn');
    const refreshBtn = document.getElementById('refreshBtn');
    const settingsLink = document.getElementById('settingsLink');

    aiAnalysisBtn.addEventListener('click', () => this.performAIAnalysis());
    refreshBtn.addEventListener('click', () => this.refreshAnalysis());
    settingsLink.addEventListener('click', () => this.openSettings());
  }

  async loadStatus() {
    const loading = document.getElementById('loading');
    const statusCard = document.getElementById('statusCard');
    const currentUrlEl = document.getElementById('currentUrl');

    try {
      // Show current URL
      currentUrlEl.textContent = this.currentTab.url;

      // Get status from background script
      const response = await chrome.tabs.sendMessage(this.currentTab.id, {
        action: 'getStatus'
      });

      if (response) {
        this.statusData = response;
        this.updateStatusDisplay(response.status, response.details || []);
      } else {
        // Trigger analysis if no status available
        await this.triggerAnalysis();
      }

      loading.style.display = 'none';
      statusCard.style.display = 'block';
    } catch (error) {
      console.error('Failed to load status:', error);
      this.showError('Failed to analyze current page');
    }
  }

  async triggerAnalysis() {
    // Send message to background to analyze current tab
    chrome.runtime.sendMessage({
      action: 'analyzeTab',
      tabId: this.currentTab.id,
      url: this.currentTab.url
    });

    // Wait a moment and try to get status again
    setTimeout(async () => {
      try {
        const response = await chrome.tabs.sendMessage(this.currentTab.id, {
          action: 'getStatus'
        });
        
        if (response) {
          this.statusData = response;
          this.updateStatusDisplay(response.status, response.details || []);
        } else {
          this.showDefaultStatus();
        }
      } catch (error) {
        this.showDefaultStatus();
      }
    }, 2000);
  }

  showDefaultStatus() {
    // Show analyzing status
    this.updateStatusDisplay('analyzing', ['Analysis in progress...']);
  }

  updateStatusDisplay(status, details) {
    const statusIcon = document.getElementById('statusIcon');
    const statusTitle = document.getElementById('statusTitle');
    const statusDescription = document.getElementById('statusDescription');
    const detailsList = document.getElementById('detailsList');

    const statusConfig = {
      'safe': {
        icon: '✓',
        title: 'Content Safe',
        description: 'No issues detected with this website',
        class: 'safe'
      },
      'warning': {
        icon: '!',
        title: 'Warning Detected',
        description: 'Potential security or legal concerns found',
        class: 'warning'
      },
      'illegal': {
        icon: '✗',
        title: 'Illegal Content',
        description: 'This website may contain illegal content',
        class: 'illegal'
      },
      'analyzing': {
        icon: '⏳',
        title: 'Analyzing...',
        description: 'Checking website for legal compliance',
        class: 'warning'
      }
    };

    const config = statusConfig[status] || statusConfig['safe'];

    statusIcon.textContent = config.icon;
    statusIcon.className = `status-icon ${config.class}`;
    statusTitle.textContent = config.title;
    statusDescription.textContent = config.description;

    // Update details list
    detailsList.innerHTML = '';
    if (details && details.length > 0) {
      details.forEach(detail => {
        const li = document.createElement('li');
        li.innerHTML = `
          <div class="detail-icon ${this.getDetailIconClass(detail)}"></div>
          <span>${detail}</span>
        `;
        detailsList.appendChild(li);
      });
    } else if (status === 'safe') {
      const li = document.createElement('li');
      li.innerHTML = `
        <div class="detail-icon safe"></div>
        <span>No security issues found</span>
      `;
      detailsList.appendChild(li);
    }
  }

  getDetailIconClass(detail) {
    const detailLower = detail.toLowerCase();
    if (detailLower.includes('illegal') || detailLower.includes('torrent') || detailLower.includes('blocked')) {
      return 'error';
    } else if (detailLower.includes('ssl') || detailLower.includes('certificate') || detailLower.includes('domain')) {
      return 'warning';
    }
    return 'safe';
  }

  async performAIAnalysis() {
    const aiBtn = document.getElementById('aiAnalysisBtn');
    const originalText = aiBtn.innerHTML;

    aiBtn.innerHTML = `
      <div style="width: 16px; height: 16px; border: 2px solid rgba(255,255,255,0.3); border-top: 2px solid white; border-radius: 50%; animation: spin 1s linear infinite;"></div>
      Analyzing...
    `;
    aiBtn.disabled = true;

    try {
      // Get page content from content script
      const contentResponse = await chrome.tabs.sendMessage(this.currentTab.id, {
        action: 'getPageContent'
      });

      const pageContent = contentResponse?.content || '';

      // Send to background for AI analysis
      const response = await chrome.runtime.sendMessage({
        action: 'aiAnalysis',
        url: this.currentTab.url,
        content: pageContent
      });

      this.displayAIResult(response);
    } catch (error) {
      this.displayAIResult({ error: 'AI analysis failed: ' + error.message });
    } finally {
      aiBtn.innerHTML = originalText;
      aiBtn.disabled = false;
    }
  }

  displayAIResult(result) {
    const detailsList = document.getElementById('detailsList');
    
    // Create AI result item
    const li = document.createElement('li');
    li.style.cssText = 'border-top: 2px solid #2196F3; margin-top: 12px; padding-top: 12px;';

    if (result.error) {
      li.innerHTML = `
        <div class="detail-icon error"></div>
        <div>
          <strong>AI Analysis Error:</strong><br>
          <small style="color: #666;">${result.error}</small>
        </div>
      `;
    } else {
      const riskConfig = {
        'high': { color: '#F44336', label: 'High Risk (Illegal)', icon: 'error' },
        'medium': { color: '#FF9800', label: 'Medium Risk (Questionable)', icon: 'warning' },
        'low': { color: '#4CAF50', label: 'Low Risk (Legal)', icon: 'safe' }
      };

      const config = riskConfig[result.riskLevel] || riskConfig['low'];
      
      li.innerHTML = `
        <div class="detail-icon ${config.icon}"></div>
        <div>
          <strong>AI Analysis:</strong> <span style="color: ${config.color};">${config.label}</span><br>
          <small style="color: #666;">${result.explanation}</small><br>
          <em style="color: #999; font-size: 11px;">Analyzed: ${new Date(result.timestamp).toLocaleTimeString()}</em>
        </div>
      `;
    }

    detailsList.appendChild(li);
  }

  async refreshAnalysis() {
    const refreshBtn = document.getElementById('refreshBtn');
    const originalText = refreshBtn.innerHTML;

    refreshBtn.innerHTML = `
      <div style="width: 16px; height: 16px; border: 2px solid rgba(0,0,0,0.3); border-top: 2px solid #333; border-radius: 50%; animation: spin 1s linear infinite;"></div>
      Refreshing...
    `;
    refreshBtn.disabled = true;

    try {
      // Trigger re-analysis
      await this.triggerAnalysis();
      
      setTimeout(() => {
        refreshBtn.innerHTML = originalText;
        refreshBtn.disabled = false;
      }, 2000);
    } catch (error) {
      refreshBtn.innerHTML = originalText;
      refreshBtn.disabled = false;
    }
  }

  openSettings() {
    chrome.runtime.openOptionsPage();
    window.close();
  }

  showError(message) {
    const loading = document.getElementById('loading');
    const statusCard = document.getElementById('statusCard');
    
    loading.innerHTML = `
      <div style="color: #F44336; text-align: center;">
        <div style="font-size: 48px; margin-bottom: 16px;">⚠️</div>
        <p>${message}</p>
      </div>
    `;
    
    statusCard.style.display = 'none';
  }
}

// Initialize popup when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new LegalGuardPopup();
});