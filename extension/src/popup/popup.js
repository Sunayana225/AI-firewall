/**
 * AI-Firewall Popup Script
 * Handles popup UI interactions and settings management
 */

class PopupManager {
  constructor() {
    this.currentTab = null;
    this.settings = {};
    this.stats = {};
    
    this.init();
  }
  
  async init() {
    // Get current tab
    await this.getCurrentTab();
    
    // Load settings and stats
    await this.loadData();
    
    // Setup event listeners
    this.setupEventListeners();
    
    // Update UI
    this.updateUI();
    
    console.log('Popup initialized');
  }
  
  async getCurrentTab() {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    this.currentTab = tabs[0];
  }
  
  async loadData() {
    try {
      // Load settings
      const settingsResponse = await this.sendMessage({ type: 'GET_SETTINGS' });
      if (settingsResponse.success) {
        this.settings = settingsResponse.settings;
      }
      
      // Load stats
      const statsResponse = await this.sendMessage({ type: 'GET_STATS' });
      if (statsResponse.success) {
        this.stats = statsResponse.stats;
      }
      
      // Get current page stats
      if (this.currentTab) {
        const pageStatsResponse = await this.sendMessageToTab({
          type: 'GET_PAGE_STATS'
        });
        if (pageStatsResponse.success) {
          this.pageStats = pageStatsResponse.stats;
        }
      }
      
    } catch (error) {
      console.error('Error loading data:', error);
    }
  }
  
  setupEventListeners() {
    // Main toggle
    const mainToggle = document.getElementById('mainToggle');
    mainToggle.addEventListener('change', (e) => {
      this.toggleFiltering(e.target.checked);
    });
    
    // Filter level radio buttons
    const filterRadios = document.querySelectorAll('input[name="filterLevel"]');
    filterRadios.forEach(radio => {
      radio.addEventListener('change', (e) => {
        this.updateFilterLevel(e.target.value);
      });
    });
    
    // Site action button
    const siteAction = document.getElementById('siteAction');
    siteAction.addEventListener('click', () => {
      this.toggleSiteAllowlist();
    });
    
    // Action buttons
    document.getElementById('restoreBtn').addEventListener('click', () => {
      this.restoreContent();
    });
    
    document.getElementById('rescanBtn').addEventListener('click', () => {
      this.rescanPage();
    });
    
    // Footer buttons
    document.getElementById('settingsBtn').addEventListener('click', () => {
      this.openSettings();
    });
    
    document.getElementById('dashboardBtn').addEventListener('click', () => {
      this.openDashboard();
    });
    
    document.getElementById('helpBtn').addEventListener('click', () => {
      this.openHelp();
    });
  }
  
  updateUI() {
    this.updateStatus();
    this.updateSiteInfo();
    this.updateStats();
    this.updateFilterLevel();
  }
  
  updateStatus() {
    const isEnabled = this.settings.filteringLevel !== 'disabled';
    const container = document.querySelector('.popup-container');
    const statusText = document.querySelector('.status-text');
    const mainToggle = document.getElementById('mainToggle');
    
    if (isEnabled) {
      container.classList.remove('disabled');
      statusText.textContent = 'Active';
      mainToggle.checked = true;
    } else {
      container.classList.add('disabled');
      statusText.textContent = 'Disabled';
      mainToggle.checked = false;
    }
  }
  
  updateSiteInfo() {
    if (!this.currentTab) return;
    
    const siteName = document.getElementById('siteName');
    const siteStatus = document.getElementById('siteStatus');
    const siteAction = document.getElementById('siteAction');
    
    const hostname = new URL(this.currentTab.url).hostname;
    siteName.textContent = hostname;
    
    const isAllowlisted = this.settings.allowlist?.includes(hostname);
    
    if (isAllowlisted) {
      siteStatus.textContent = 'Allowlisted';
      siteAction.textContent = 'Remove';
      siteAction.style.background = '#fed7d7';
      siteAction.style.color = '#c53030';
    } else {
      siteStatus.textContent = 'Protected';
      siteAction.textContent = 'Allowlist';
      siteAction.style.background = 'white';
      siteAction.style.color = '#4a5568';
    }
  }
  
  updateStats() {
    document.getElementById('blockedCount').textContent = 
      this.pageStats?.blockedCount || this.stats.contentBlocked || 0;
    
    document.getElementById('scannedCount').textContent = 
      this.stats.totalScanned || 0;
    
    document.getElementById('sitesCount').textContent = 
      this.stats.sitesVisited || 0;
  }
  
  updateFilterLevel() {
    const level = this.settings.filteringLevel || 'moderate';
    const radio = document.querySelector(`input[name="filterLevel"][value="${level}"]`);
    if (radio) {
      radio.checked = true;
    }
  }
  
  async toggleFiltering(enabled) {
    try {
      const newSettings = {
        ...this.settings,
        filteringLevel: enabled ? 'moderate' : 'disabled'
      };
      
      await this.updateSettings(newSettings);
      
      // Notify content script
      if (this.currentTab) {
        await this.sendMessageToTab({
          type: 'TOGGLE_FILTERING',
          enabled
        });
      }
      
      this.updateStatus();
      
    } catch (error) {
      console.error('Error toggling filtering:', error);
    }
  }
  
  async updateFilterLevel(level) {
    try {
      const newSettings = {
        ...this.settings,
        filteringLevel: level
      };
      
      await this.updateSettings(newSettings);
      
      // Notify content script
      if (this.currentTab) {
        await this.sendMessageToTab({
          type: 'UPDATE_SETTINGS',
          settings: newSettings
        });
      }
      
    } catch (error) {
      console.error('Error updating filter level:', error);
    }
  }
  
  async toggleSiteAllowlist() {
    if (!this.currentTab) return;
    
    try {
      const hostname = new URL(this.currentTab.url).hostname;
      const allowlist = this.settings.allowlist || [];
      const isAllowlisted = allowlist.includes(hostname);
      
      let newAllowlist;
      if (isAllowlisted) {
        newAllowlist = allowlist.filter(site => site !== hostname);
      } else {
        newAllowlist = [...allowlist, hostname];
      }
      
      const newSettings = {
        ...this.settings,
        allowlist: newAllowlist
      };
      
      await this.updateSettings(newSettings);
      this.updateSiteInfo();
      
      // Reload the page to apply changes
      chrome.tabs.reload(this.currentTab.id);
      
    } catch (error) {
      console.error('Error toggling allowlist:', error);
    }
  }
  
  async restoreContent() {
    if (!this.currentTab) return;
    
    try {
      await this.sendMessageToTab({
        type: 'RESTORE_CONTENT'
      });
      
      // Update stats
      await this.loadData();
      this.updateStats();
      
    } catch (error) {
      console.error('Error restoring content:', error);
    }
  }
  
  async rescanPage() {
    if (!this.currentTab) return;
    
    try {
      await this.sendMessageToTab({
        type: 'RESCAN_PAGE'
      });
      
      // Update stats after a delay
      setTimeout(async () => {
        await this.loadData();
        this.updateStats();
      }, 1000);
      
    } catch (error) {
      console.error('Error rescanning page:', error);
    }
  }
  
  async updateSettings(newSettings) {
    const response = await this.sendMessage({
      type: 'UPDATE_SETTINGS',
      data: newSettings
    });
    
    if (response.success) {
      this.settings = newSettings;
    }
    
    return response;
  }
  
  openSettings() {
    chrome.runtime.openOptionsPage();
  }
  
  openDashboard() {
    chrome.tabs.create({
      url: 'http://localhost:3000'
    });
  }
  
  openHelp() {
    chrome.tabs.create({
      url: 'https://github.com/ai-firewall/help'
    });
  }
  
  sendMessage(message) {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage(message, resolve);
    });
  }
  
  sendMessageToTab(message) {
    return new Promise((resolve) => {
      if (this.currentTab) {
        chrome.tabs.sendMessage(this.currentTab.id, message, resolve);
      } else {
        resolve({ success: false, error: 'No active tab' });
      }
    });
  }
}

// Initialize popup when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new PopupManager();
});
