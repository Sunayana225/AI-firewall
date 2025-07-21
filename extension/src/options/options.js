/**
 * AI-Firewall Options Page
 * Handles settings management and UI interactions
 */

class OptionsManager {
  constructor() {
    this.settings = {};
    this.originalSettings = {};
    this.unsavedChanges = false;
    
    this.init();
  }
  
  async init() {
    // Load settings
    await this.loadSettings();
    
    // Setup event listeners
    this.setupEventListeners();
    
    // Initialize UI
    this.initializeUI();
    
    console.log('Options page initialized');
  }
  
  async loadSettings() {
    try {
      const response = await this.sendMessage({ type: 'GET_SETTINGS' });
      
      if (response.success) {
        this.settings = response.settings || {};
      } else {
        // Use defaults if settings can't be loaded
        this.settings = this.getDefaultSettings();
      }
      
      // Store original settings for comparison
      this.originalSettings = JSON.parse(JSON.stringify(this.settings));
      
    } catch (error) {
      console.error('Error loading settings:', error);
      this.settings = this.getDefaultSettings();
    }
  }
  
  getDefaultSettings() {
    return {
      filteringLevel: 'moderate',
      ageGroup: 'moderate',
      enabledCategories: ['explicit', 'violence', 'hate', 'harassment'],
      allowlist: [],
      parentalMode: false,
      showNotifications: true,
      enableStats: true,
      theme: 'auto',
      language: 'en',
      blockingMethod: 'replace',
      logActivity: true,
      emailReports: false,
      parentEmail: '',
      textThreshold: 0.7,
      imageThreshold: 0.6,
      enableCache: true,
      batchSize: 10
    };
  }
  
  setupEventListeners() {
    // Tab navigation
    document.querySelectorAll('.nav-tab').forEach(tab => {
      tab.addEventListener('click', () => this.switchTab(tab.dataset.tab));
    });
    
    // Save and cancel buttons
    document.getElementById('saveSettings').addEventListener('click', () => this.saveSettings());
    document.getElementById('cancelSettings').addEventListener('click', () => this.cancelChanges());
    
    // Range inputs
    document.querySelectorAll('input[type="range"]').forEach(range => {
      range.addEventListener('input', (e) => {
        e.target.nextElementSibling.textContent = e.target.value;
        this.markAsChanged();
      });
    });
    
    // Checkbox and radio inputs
    document.querySelectorAll('input[type="checkbox"], input[type="radio"]').forEach(input => {
      input.addEventListener('change', () => this.markAsChanged());
    });
    
    // Select inputs
    document.querySelectorAll('select').forEach(select => {
      select.addEventListener('change', () => this.markAsChanged());
    });
    
    // Text inputs
    document.querySelectorAll('input[type="text"], input[type="email"], input[type="password"]').forEach(input => {
      input.addEventListener('input', () => this.markAsChanged());
    });
    
    // Parental mode toggle
    document.getElementById('parentalMode').addEventListener('change', (e) => {
      document.getElementById('passwordSection').style.display = e.target.checked ? 'block' : 'none';
    });
    
    // Email reports toggle
    document.getElementById('emailReports').addEventListener('change', (e) => {
      document.getElementById('emailSection').style.display = e.target.checked ? 'block' : 'none';
    });
    
    // Allowlist management
    document.getElementById('addSite').addEventListener('click', () => this.addAllowlistSite());
    document.getElementById('newSite').addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.addAllowlistSite();
    });
    
    // Quick add buttons
    document.querySelectorAll('.quick-add-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const site = btn.dataset.site;
        this.quickAddSite(site);
      });
    });
    
    // Data management
    document.getElementById('exportSettings').addEventListener('click', () => this.exportSettings());
    document.getElementById('importSettings').addEventListener('click', () => document.getElementById('importFile').click());
    document.getElementById('importFile').addEventListener('change', (e) => this.importSettings(e));
    document.getElementById('clearCache').addEventListener('click', () => this.clearCache());
    document.getElementById('resetSettings').addEventListener('click', () => this.resetSettings());
    
    // Links
    document.getElementById('helpLink').addEventListener('click', (e) => {
      e.preventDefault();
      chrome.tabs.create({ url: 'https://github.com/ai-firewall/help' });
    });
    
    document.getElementById('privacyLink').addEventListener('click', (e) => {
      e.preventDefault();
      chrome.tabs.create({ url: 'https://github.com/ai-firewall/privacy' });
    });
    
    // Before unload warning
    window.addEventListener('beforeunload', (e) => {
      if (this.unsavedChanges) {
        e.preventDefault();
        e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
        return e.returnValue;
      }
    });
  }
  
  initializeUI() {
    // Set initial values based on loaded settings
    
    // General tab
    document.getElementById('enableFiltering').checked = this.settings.filteringLevel !== 'disabled';
    document.getElementById('showNotifications').checked = this.settings.showNotifications !== false;
    document.getElementById('enableStats').checked = this.settings.enableStats !== false;
    document.getElementById('theme').value = this.settings.theme || 'auto';
    document.getElementById('language').value = this.settings.language || 'en';
    
    // Filtering tab
    const filterLevel = this.settings.filteringLevel === 'disabled' ? 'moderate' : this.settings.filteringLevel;
    document.querySelector(`input[name="filterLevel"][value="${filterLevel}"]`).checked = true;
    
    document.getElementById('filterExplicit').checked = this.settings.enabledCategories?.includes('explicit') !== false;
    document.getElementById('filterViolence').checked = this.settings.enabledCategories?.includes('violence') !== false;
    document.getElementById('filterHate').checked = this.settings.enabledCategories?.includes('hate') !== false;
    document.getElementById('filterHarassment').checked = this.settings.enabledCategories?.includes('harassment') !== false;
    document.getElementById('filterDrugs').checked = this.settings.enabledCategories?.includes('drugs') === true;
    document.getElementById('filterWeapons').checked = this.settings.enabledCategories?.includes('weapons') === true;
    
    document.getElementById('blockingMethod').value = this.settings.blockingMethod || 'replace';
    
    // Allowlist tab
    this.renderAllowlist();
    
    // Parental tab
    document.getElementById('parentalMode').checked = this.settings.parentalMode === true;
    document.getElementById('passwordSection').style.display = this.settings.parentalMode ? 'block' : 'none';
    
    document.getElementById('logActivity').checked = this.settings.logActivity !== false;
    document.getElementById('emailReports').checked = this.settings.emailReports === true;
    document.getElementById('emailSection').style.display = this.settings.emailReports ? 'block' : 'none';
    document.getElementById('parentEmail').value = this.settings.parentEmail || '';
    
    // Advanced tab
    document.getElementById('textThreshold').value = this.settings.textThreshold || 0.7;
    document.getElementById('textThreshold').nextElementSibling.textContent = this.settings.textThreshold || 0.7;
    
    document.getElementById('imageThreshold').value = this.settings.imageThreshold || 0.6;
    document.getElementById('imageThreshold').nextElementSibling.textContent = this.settings.imageThreshold || 0.6;
    
    document.getElementById('enableCache').checked = this.settings.enableCache !== false;
    document.getElementById('batchSize').value = this.settings.batchSize || 10;
    
    // Reset unsaved changes flag
    this.unsavedChanges = false;
  }
  
  switchTab(tabId) {
    // Hide all tabs
    document.querySelectorAll('.tab-content').forEach(tab => {
      tab.classList.remove('active');
    });
    
    // Deactivate all tab buttons
    document.querySelectorAll('.nav-tab').forEach(tab => {
      tab.classList.remove('active');
    });
    
    // Show selected tab
    document.getElementById(tabId).classList.add('active');
    
    // Activate selected tab button
    document.querySelector(`.nav-tab[data-tab="${tabId}"]`).classList.add('active');
  }
  
  renderAllowlist() {
    const allowlistContainer = document.getElementById('allowlistSites');
    allowlistContainer.innerHTML = '';
    
    if (!this.settings.allowlist || this.settings.allowlist.length === 0) {
      allowlistContainer.innerHTML = '<p class="empty-list">No sites in allowlist. Add trusted websites above.</p>';
      return;
    }
    
    this.settings.allowlist.forEach(site => {
      const siteItem = document.createElement('div');
      siteItem.className = 'site-item';
      siteItem.innerHTML = `
        <span class="site-name">${site}</span>
        <button class="remove-site" data-site="${site}">✕</button>
      `;
      
      allowlistContainer.appendChild(siteItem);
    });
    
    // Add event listeners to remove buttons
    document.querySelectorAll('.remove-site').forEach(btn => {
      btn.addEventListener('click', () => {
        this.removeAllowlistSite(btn.dataset.site);
      });
    });
  }
  
  addAllowlistSite() {
    const input = document.getElementById('newSite');
    let site = input.value.trim();
    
    if (!site) return;
    
    // Basic URL cleanup
    site = site.toLowerCase();
    
    // Remove protocol and www if present
    site = site.replace(/^(https?:\/\/)?(www\.)?/, '');
    
    // Remove path and query parameters
    site = site.split('/')[0];
    
    if (!this.settings.allowlist) {
      this.settings.allowlist = [];
    }
    
    // Check if site already exists
    if (this.settings.allowlist.includes(site)) {
      alert(`${site} is already in your allowlist.`);
      return;
    }
    
    // Add to allowlist
    this.settings.allowlist.push(site);
    
    // Update UI
    this.renderAllowlist();
    input.value = '';
    
    this.markAsChanged();
  }
  
  removeAllowlistSite(site) {
    if (confirm(`Remove ${site} from your allowlist?`)) {
      this.settings.allowlist = this.settings.allowlist.filter(s => s !== site);
      this.renderAllowlist();
      this.markAsChanged();
    }
  }
  
  quickAddSite(site) {
    if (!this.settings.allowlist) {
      this.settings.allowlist = [];
    }
    
    // Check if site already exists
    if (this.settings.allowlist.includes(site)) {
      alert(`${site} is already in your allowlist.`);
      return;
    }
    
    // Add to allowlist
    this.settings.allowlist.push(site);
    
    // Update UI
    this.renderAllowlist();
    
    this.markAsChanged();
  }
  
  markAsChanged() {
    this.unsavedChanges = true;
    document.getElementById('saveSettings').classList.add('btn-primary');
    document.getElementById('saveSettings').classList.remove('btn-secondary');
  }
  
  async saveSettings() {
    // Collect settings from UI
    this.collectSettings();
    
    try {
      // Save settings
      const response = await this.sendMessage({
        type: 'UPDATE_SETTINGS',
        data: this.settings
      });
      
      if (response.success) {
        // Update original settings
        this.originalSettings = JSON.parse(JSON.stringify(this.settings));
        this.unsavedChanges = false;
        
        // Show success message
        alert('Settings saved successfully!');
        
        // Update UI
        document.getElementById('saveSettings').classList.remove('btn-primary');
        document.getElementById('saveSettings').classList.add('btn-secondary');
      } else {
        alert('Failed to save settings. Please try again.');
      }
      
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('An error occurred while saving settings.');
    }
  }
  
  collectSettings() {
    // General tab
    this.settings.filteringLevel = document.getElementById('enableFiltering').checked ? 
      document.querySelector('input[name="filterLevel"]:checked').value : 'disabled';
    
    this.settings.showNotifications = document.getElementById('showNotifications').checked;
    this.settings.enableStats = document.getElementById('enableStats').checked;
    this.settings.theme = document.getElementById('theme').value;
    this.settings.language = document.getElementById('language').value;
    
    // Filtering tab
    this.settings.enabledCategories = [];
    if (document.getElementById('filterExplicit').checked) this.settings.enabledCategories.push('explicit');
    if (document.getElementById('filterViolence').checked) this.settings.enabledCategories.push('violence');
    if (document.getElementById('filterHate').checked) this.settings.enabledCategories.push('hate');
    if (document.getElementById('filterHarassment').checked) this.settings.enabledCategories.push('harassment');
    if (document.getElementById('filterDrugs').checked) this.settings.enabledCategories.push('drugs');
    if (document.getElementById('filterWeapons').checked) this.settings.enabledCategories.push('weapons');
    
    this.settings.blockingMethod = document.getElementById('blockingMethod').value;
    
    // Parental tab
    this.settings.parentalMode = document.getElementById('parentalMode').checked;
    this.settings.logActivity = document.getElementById('logActivity').checked;
    this.settings.emailReports = document.getElementById('emailReports').checked;
    this.settings.parentEmail = document.getElementById('parentEmail').value;
    
    // Advanced tab
    this.settings.textThreshold = parseFloat(document.getElementById('textThreshold').value);
    this.settings.imageThreshold = parseFloat(document.getElementById('imageThreshold').value);
    this.settings.enableCache = document.getElementById('enableCache').checked;
    this.settings.batchSize = parseInt(document.getElementById('batchSize').value);
  }
  
  cancelChanges() {
    if (this.unsavedChanges) {
      if (confirm('You have unsaved changes. Are you sure you want to cancel?')) {
        // Reset settings to original
        this.settings = JSON.parse(JSON.stringify(this.originalSettings));
        
        // Reset UI
        this.initializeUI();
      }
    } else {
      window.close();
    }
  }
  
  exportSettings() {
    // Collect current settings
    this.collectSettings();
    
    // Create a download link
    const dataStr = JSON.stringify(this.settings, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    
    const exportName = 'ai-firewall-settings.json';
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportName);
    linkElement.click();
  }
  
  importSettings(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedSettings = JSON.parse(e.target.result);
        
        // Validate settings
        if (!importedSettings || typeof importedSettings !== 'object') {
          throw new Error('Invalid settings file');
        }
        
        // Merge with current settings
        this.settings = { ...this.getDefaultSettings(), ...importedSettings };
        
        // Update UI
        this.initializeUI();
        
        // Mark as changed
        this.markAsChanged();
        
        alert('Settings imported successfully. Click Save to apply them.');
        
      } catch (error) {
        console.error('Error importing settings:', error);
        alert('Failed to import settings. The file may be invalid.');
      }
    };
    
    reader.readAsText(file);
    
    // Reset file input
    event.target.value = '';
  }
  
  async clearCache() {
    if (confirm('Are you sure you want to clear the analysis cache?')) {
      try {
        const response = await this.sendMessage({ type: 'CLEAR_CACHE' });
        
        if (response.success) {
          alert('Cache cleared successfully.');
        } else {
          alert('Failed to clear cache.');
        }
        
      } catch (error) {
        console.error('Error clearing cache:', error);
        alert('An error occurred while clearing cache.');
      }
    }
  }
  
  resetSettings() {
    if (confirm('Are you sure you want to reset all settings to default? This cannot be undone.')) {
      // Reset to defaults
      this.settings = this.getDefaultSettings();
      
      // Update UI
      this.initializeUI();
      
      // Mark as changed
      this.markAsChanged();
      
      alert('Settings reset to default. Click Save to apply them.');
    }
  }
  
  sendMessage(message) {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage(message, resolve);
    });
  }
}

// Initialize options when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new OptionsManager();
});
