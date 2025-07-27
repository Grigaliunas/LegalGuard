// LegalGuard Content Script
// Author: Dr. Šarūnas Grigaliūnas

class LegalGuardContent {
  constructor() {
    this.indicator = null;
    this.currentStatus = 'safe';
    this.initializeIndicator();
    this.setupMessageListener();
  }

  initializeIndicator() {
    this.createIndicator();
    this.positionIndicator();
    this.setupIndicatorEvents();
  }

  createIndicator() {
    // Remove existing indicator if present
    const existing = document.getElementById('legalguard-indicator');
    if (existing) {
      existing.remove();
    }

    this.indicator = document.createElement('div');
    this.indicator.id = 'legalguard-indicator';
    this.indicator.className = 'legalguard-indicator safe';
    
    this.indicator.innerHTML = `
      <div class="legalguard-icon">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12,1L3,5V11C3,16.55 6.84,21.74 12,23C17.16,21.74 21,16.55 21,11V5L12,1M12,7C13.4,7 14.8,8.6 14.8,10V11.5C15.4,11.5 16,12.4 16,13V16C16,17.4 15.4,18 14.8,18H9.2C8.6,18 8,17.4 8,16V13C8,12.6 8.4,12 9,12H9.2V10C9.2,8.6 10.6,7 12,7V7M12,8.2C11.2,8.2 10.5,8.7 10.5,9.5V11.5H13.5V9.5C13.5,8.7 12.8,8.2 12,8.2Z"/>
        </svg>
      </div>
      <div class="legalguard-panel">
        <div class="legalguard-header">
          <h3>LegalGuard Status</h3>
          <button class="legalguard-close">×</button>
        </div>
        <div class="legalguard-content">
          <div class="legalguard-status">
            <span class="status-indicator"></span>
            <span class="status-text">Analyzing...</span>
          </div>
          <div class="legalguard-details"></div>
          <div class="legalguard-actions">
            <button class="ai-analysis-btn" title="Request AI Analysis">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12,2A2,2 0 0,1 14,4C14,4.74 13.6,5.39 13,5.73V7H14A7,7 0 0,1 21,14H22A1,1 0 0,1 23,15V18A1,1 0 0,1 22,19H21V20A2,2 0 0,1 19,22H5A2,2 0 0,1 3,20V19H2A1,1 0 0,1 1,18V15A1,1 0 0,1 2,14H3A7,7 0 0,1 10,7H11V5.73C10.4,5.39 10,4.74 10,4A2,2 0 0,1 12,2M7.5,13A2.5,2.5 0 0,0 5,15.5A2.5,2.5 0 0,0 7.5,18A2.5,2.5 0 0,0 10,15.5A2.5,2.5 0 0,0 7.5,13M16.5,13A2.5,2.5 0 0,0 14,15.5A2.5,2.5 0 0,0 16.5,18A2.5,2.5 0 0,0 19,15.5A2.5,2.5 0 0,0 16.5,13Z"/>
              </svg>
              AI Analysis
            </button>
            <button class="refresh-btn" title="Refresh Analysis">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.65,6.35C16.2,4.9 14.21,4 12,4A8,8 0 0,0 4,12A8,8 0 0,0 12,20C15.73,20 18.84,17.45 19.73,14H17.65C16.83,16.33 14.61,18 12,18A6,6 0 0,1 6,12A6,6 0 0,1 12,6C13.66,6 15.14,6.69 16.22,7.78L13,11H20V4L17.65,6.35Z"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(this.indicator);
  }

  positionIndicator() {
    // Position the indicator in the top-right corner
    this.indicator.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 10000;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    `;
  }

  setupIndicatorEvents() {
    const icon = this.indicator.querySelector('.legalguard-icon');
    const panel = this.indicator.querySelector('.legalguard-panel');
    const closeBtn = this.indicator.querySelector('.legalguard-close');
    const aiAnalysisBtn = this.indicator.querySelector('.ai-analysis-btn');
    const refreshBtn = this.indicator.querySelector('.refresh-btn');

    icon.addEventListener('click', () => {
      panel.classList.toggle('visible');
    });

    closeBtn.addEventListener('click', () => {
      panel.classList.remove('visible');
    });

    aiAnalysisBtn.addEventListener('click', () => {
      this.requestAIAnalysis();
    });

    refreshBtn.addEventListener('click', () => {
      this.refreshAnalysis();
    });

    // Close panel when clicking outside
    document.addEventListener('click', (e) => {
      if (!this.indicator.contains(e.target)) {
        panel.classList.remove('visible');
      }
    });
  }

  setupMessageListener() {
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      if (request.action === 'updateStatus') {
        this.updateStatus(request.status, request.details);
      }
    });
  }

  updateStatus(status, details = []) {
    this.currentStatus = status;
    
    // Update indicator class
    this.indicator.className = `legalguard-indicator ${status}`;
    
    // Update status text and indicator
    const statusText = this.indicator.querySelector('.status-text');
    const statusIndicator = this.indicator.querySelector('.status-indicator');
    
    const statusConfig = {
      'safe': { text: 'Safe Content', color: '#4CAF50' },
      'warning': { text: 'Warning - Potential Issues', color: '#FF9800' },
      'illegal': { text: 'Illegal Content Detected', color: '#F44336' }
    };
    
    const config = statusConfig[status] || statusConfig['safe'];
    statusText.textContent = config.text;
    statusIndicator.style.backgroundColor = config.color;
    
    // Update details
    const detailsContainer = this.indicator.querySelector('.legalguard-details');
    if (details.length > 0) {
      detailsContainer.innerHTML = details.map(detail => 
        `<div class="detail-item">• ${detail}</div>`
      ).join('');
    } else {
      detailsContainer.innerHTML = '<div class="detail-item">No issues detected</div>';
    }
  }

  async requestAIAnalysis() {
    const aiBtn = this.indicator.querySelector('.ai-analysis-btn');
    const originalText = aiBtn.innerHTML;
    
    aiBtn.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" class="spinning">
        <path d="M12,4V2A10,10 0 0,0 2,12H4A8,8 0 0,1 12,4Z"/>
      </svg>
      Analyzing...
    `;
    aiBtn.disabled = true;

    try {
      const pageContent = this.extractPageContent();
      
      const response = await chrome.runtime.sendMessage({
        action: 'aiAnalysis',
        url: window.location.href,
        content: pageContent
      });

      this.displayAIResult(response);
    } catch (error) {
      this.displayAIResult({ error: 'Analysis failed: ' + error.message });
    } finally {
      aiBtn.innerHTML = originalText;
      aiBtn.disabled = false;
    }
  }

  extractPageContent() {
    // Extract meaningful text content from the page
    const content = [];
    
    // Get title
    content.push(document.title);
    
    // Get meta description
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      content.push(metaDesc.getAttribute('content'));
    }
    
    // Get main text content (exclude script, style, etc.)
    const textElements = document.querySelectorAll('p, h1, h2, h3, h4, h5, h6, li, td, th');
    for (const element of textElements) {
      const text = element.textContent.trim();
      if (text.length > 10) {
        content.push(text);
      }
    }
    
    return content.join('\n').substring(0, 8000); // Limit content size
  }

  displayAIResult(result) {
    const detailsContainer = this.indicator.querySelector('.legalguard-details');
    
    if (result.error) {
      detailsContainer.innerHTML += `
        <div class="ai-result error">
          <strong>AI Analysis Error:</strong><br>
          ${result.error}
        </div>
      `;
      return;
    }

    const riskConfig = {
      'high': { color: '#F44336', label: 'High Risk (Illegal)' },
      'medium': { color: '#FF9800', label: 'Medium Risk (Questionable)' },
      'low': { color: '#4CAF50', label: 'Low Risk (Legal)' }
    };

    const config = riskConfig[result.riskLevel] || riskConfig['low'];
    
    detailsContainer.innerHTML += `
      <div class="ai-result" style="border-left: 4px solid ${config.color};">
        <strong>AI Analysis Result:</strong><br>
        <span style="color: ${config.color};">${config.label}</span><br>
        <small>${result.explanation}</small><br>
        <em>Analyzed: ${new Date(result.timestamp).toLocaleTimeString()}</em>
      </div>
    `;
  }

  refreshAnalysis() {
    const refreshBtn = this.indicator.querySelector('.refresh-btn');
    refreshBtn.disabled = true;
    
    // Update status text
    const statusText = this.indicator.querySelector('.status-text');
    statusText.textContent = 'Refreshing analysis...';
    
    // Trigger re-analysis by reloading (or send message to background)
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  }
}

// Initialize the content script when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new LegalGuardContent();
  });
} else {
  new LegalGuardContent();
}