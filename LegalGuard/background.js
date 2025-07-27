// LegalGuard Background Service Worker
// Author: Dr. Šarūnas Grigaliūnas

class LegalGuardBackground {
  constructor() {
    this.initializeExtension();
  }

  initializeExtension() {
    chrome.runtime.onInstalled.addListener(() => {
      this.setDefaultSettings();
    });

    chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
      if (changeInfo.status === 'complete' && tab.url) {
        this.analyzeTab(tabId, tab.url);
      }
    });

    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      this.handleMessage(request, sender, sendResponse);
      return true; // Keep message port open for async response
    });
  }

  async setDefaultSettings() {
    const defaultSettings = {
      sslCertificateAge: 30, // days
      domainRegistrationAge: 14, // days
      torrentDetection: true,
      illegalDatabases: [
        'https://api.example-blocklist.com/check',
        'https://malware-database.example.com/verify'
      ],
      apiKey: '',
      enableAIAnalysis: false
    };

    await chrome.storage.sync.set({ settings: defaultSettings });
  }

  async analyzeTab(tabId, url) {
    try {
      const analysis = await this.performLegalityCheck(url);
      
      chrome.tabs.sendMessage(tabId, {
        action: 'updateStatus',
        status: analysis.status,
        details: analysis.details
      });

      this.updateBadge(tabId, analysis.status);
    } catch (error) {
      console.error('Analysis failed:', error);
    }
  }

  async performLegalityCheck(url) {
    const settings = await this.getSettings();
    const urlObj = new URL(url);
    
    let status = 'safe'; // green
    let details = [];

    // Check illegal databases
    const illegalCheck = await this.checkIllegalDatabases(url, settings.illegalDatabases);
    if (illegalCheck.isIllegal) {
      status = 'illegal';
      details.push('Domain found in illegal content database');
      return { status, details };
    }

    // Check for torrent files
    if (settings.torrentDetection) {
      const torrentCheck = await this.checkTorrentFiles(url);
      if (torrentCheck.hasTorrents) {
        status = 'illegal';
        details.push('Torrent files detected on the website');
        return { status, details };
      }
    }

    // Check SSL certificate
    const sslCheck = await this.checkSSLCertificate(url);
    if (!sslCheck.hasSSL) {
      status = 'warning';
      details.push('No SSL certificate detected');
    } else if (sslCheck.certificateAge < settings.sslCertificateAge) {
      status = 'warning';
      details.push(`SSL certificate is only ${sslCheck.certificateAge} days old`);
    }

    // Check domain registration age
    const domainCheck = await this.checkDomainAge(urlObj.hostname);
    if (domainCheck.registrationAge < settings.domainRegistrationAge) {
      status = 'warning';
      details.push(`Domain registered only ${domainCheck.registrationAge} days ago`);
    }

    return { status, details };
  }

  async checkIllegalDatabases(url, databases) {
    for (const database of databases) {
      try {
        const response = await fetch(`${database}?url=${encodeURIComponent(url)}`);
        const result = await response.json();
        
        if (result.illegal || result.blocked) {
          return { isIllegal: true, source: database };
        }
      } catch (error) {
        console.warn(`Failed to check database ${database}:`, error);
      }
    }
    
    return { isIllegal: false };
  }

  async checkTorrentFiles(url) {
    try {
      const response = await fetch(url);
      const text = await response.text();
      
      // Check for torrent file links
      const torrentRegex = /href\s*=\s*["'][^"']*\.torrent["']/gi;
      const magnetRegex = /href\s*=\s*["']magnet:\?xt=/gi;
      
      const hasTorrents = torrentRegex.test(text) || magnetRegex.test(text);
      
      return { hasTorrents };
    } catch (error) {
      return { hasTorrents: false };
    }
  }

  async checkSSLCertificate(url) {
    const urlObj = new URL(url);
    
    if (urlObj.protocol !== 'https:') {
      return { hasSSL: false, certificateAge: 0 };
    }

    try {
      // This is a simplified check - in a real implementation,
      // you would need to use a certificate checking service
      const response = await fetch(`https://api.ssllabs.com/api/v3/analyze?host=${urlObj.hostname}&latest`);
      const result = await response.json();
      
      if (result.status === 'READY' && result.endpoints && result.endpoints[0]) {
        const cert = result.endpoints[0].details.cert;
        const issuedDate = new Date(cert.notBefore * 1000);
        const certificateAge = Math.floor((Date.now() - issuedDate.getTime()) / (1000 * 60 * 60 * 24));
        
        return { hasSSL: true, certificateAge };
      }
    } catch (error) {
      console.warn('SSL check failed:', error);
    }

    return { hasSSL: true, certificateAge: 365 }; // Assume old certificate if check fails
  }

  async checkDomainAge(hostname) {
    try {
      // This would typically use a WHOIS API service
      const response = await fetch(`https://api.whoisxml.com/api/v1?apiKey=YOUR_API_KEY&domainName=${hostname}`);
      const result = await response.json();
      
      if (result.WhoisRecord && result.WhoisRecord.createdDate) {
        const createdDate = new Date(result.WhoisRecord.createdDate);
        const registrationAge = Math.floor((Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
        
        return { registrationAge };
      }
    } catch (error) {
      console.warn('Domain age check failed:', error);
    }

    return { registrationAge: 365 }; // Assume old domain if check fails
  }

  updateBadge(tabId, status) {
    const badgeConfig = {
      'safe': { color: '#4CAF50', text: '✓' },
      'warning': { color: '#FF9800', text: '!' },
      'illegal': { color: '#F44336', text: '✗' }
    };

    const config = badgeConfig[status] || badgeConfig['safe'];
    
    chrome.action.setBadgeBackgroundColor({ color: config.color, tabId });
    chrome.action.setBadgeText({ text: config.text, tabId });
  }

  async handleMessage(request, sender, sendResponse) {
    switch (request.action) {
      case 'aiAnalysis':
        const aiResult = await this.performAIAnalysis(request.url, request.content);
        sendResponse(aiResult);
        break;
        
      case 'getSettings':
        const settings = await this.getSettings();
        sendResponse(settings);
        break;
        
      case 'saveSettings':
        await chrome.storage.sync.set({ settings: request.settings });
        sendResponse({ success: true });
        break;
    }
  }

  async performAIAnalysis(url, content) {
    const settings = await this.getSettings();
    
    if (!settings.apiKey || !settings.enableAIAnalysis) {
      return { error: 'AI analysis not configured' };
    }

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${settings.apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: 'You are a content legality assessment tool. Analyze the provided website content and determine if it contains illegal content. Respond with one of: "high" (illegal content), "medium" (questionable/potentially illegal), or "low" (legal content). Provide a brief explanation.'
            },
            {
              role: 'user',
              content: `URL: ${url}\n\nContent: ${content.substring(0, 4000)}`
            }
          ],
          max_tokens: 200
        })
      });

      const result = await response.json();
      const aiResponse = result.choices[0].message.content;
      
      let riskLevel = 'low';
      if (aiResponse.toLowerCase().includes('high')) {
        riskLevel = 'high';
      } else if (aiResponse.toLowerCase().includes('medium')) {
        riskLevel = 'medium';
      }

      return {
        riskLevel,
        explanation: aiResponse,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return { error: 'AI analysis failed: ' + error.message };
    }
  }

  async getSettings() {
    const result = await chrome.storage.sync.get('settings');
    return result.settings || {};
  }
}

// Initialize the background service
new LegalGuardBackground();