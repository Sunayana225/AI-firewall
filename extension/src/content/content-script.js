/**
 * Main Content Script
 * Coordinates content scanning and DOM manipulation
 */

(function() {
  'use strict';
  
  // Prevent multiple initialization
  if (window.aiFirewallInitialized) {
    return;
  }
  window.aiFirewallInitialized = true;
  
  console.log('AI-Firewall content script loaded');
  
  let contentScanner = null;
  let domManipulator = null;
  let isEnabled = true;
  
  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
  } else {
    initialize();
  }
  
  function initialize() {
    console.log('Initializing AI-Firewall on:', window.location.hostname);
    
    // Check if we should run on this page
    if (shouldSkipPage()) {
      console.log('Skipping AI-Firewall on this page');
      return;
    }
    
    // Initialize components
    domManipulator = new window.DOMManipulator();
    contentScanner = new window.ContentScanner();
    
    // Setup message listeners
    setupMessageListeners();
    
    // Setup page visibility handling
    setupVisibilityHandling();
    
    // Setup keyboard shortcuts
    setupKeyboardShortcuts();
    
    console.log('AI-Firewall initialized successfully');
  }
  
  function shouldSkipPage() {
    const hostname = window.location.hostname;
    const pathname = window.location.pathname;
    
    // Skip on extension pages
    if (hostname.includes('chrome-extension://')) {
      return true;
    }
    
    // Skip on local files
    if (window.location.protocol === 'file:') {
      return true;
    }
    
    // Skip on certain system pages
    const skipDomains = [
      'chrome.google.com',
      'chromewebstore.google.com',
      'chrome:///',
      'edge:///',
      'about:'
    ];
    
    return skipDomains.some(domain => hostname.includes(domain) || pathname.includes(domain));
  }
  
  function setupMessageListeners() {
    // Listen for messages from popup/background
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      console.log('Content script received message:', message.type);
      
      switch (message.type) {
        case 'TOGGLE_FILTERING':
          toggleFiltering(message.enabled);
          sendResponse({ success: true });
          break;
          
        case 'UPDATE_SETTINGS':
          updateSettings(message.settings);
          sendResponse({ success: true });
          break;
          
        case 'GET_PAGE_STATS':
          sendResponse({
            success: true,
            stats: getPageStats()
          });
          break;
          
        case 'RESTORE_CONTENT':
          restoreAllContent();
          sendResponse({ success: true });
          break;
          
        case 'RESCAN_PAGE':
          rescanPage();
          sendResponse({ success: true });
          break;
          
        default:
          sendResponse({ success: false, error: 'Unknown message type' });
      }
      
      return true; // Keep message channel open
    });
  }
  
  function setupVisibilityHandling() {
    // Pause/resume scanning based on page visibility
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        pauseScanning();
      } else {
        resumeScanning();
      }
    });
    
    // Handle page focus/blur
    window.addEventListener('focus', resumeScanning);
    window.addEventListener('blur', pauseScanning);
  }
  
  function setupKeyboardShortcuts() {
    document.addEventListener('keydown', (event) => {
      // Ctrl+Shift+F: Toggle filtering
      if (event.ctrlKey && event.shiftKey && event.key === 'F') {
        event.preventDefault();
        toggleFiltering(!isEnabled);
        showNotification(`AI-Firewall ${isEnabled ? 'enabled' : 'disabled'}`);
      }
      
      // Ctrl+Shift+R: Restore all content
      if (event.ctrlKey && event.shiftKey && event.key === 'R') {
        event.preventDefault();
        restoreAllContent();
        showNotification('All content restored');
      }
      
      // Ctrl+Shift+S: Show stats
      if (event.ctrlKey && event.shiftKey && event.key === 'S') {
        event.preventDefault();
        showStats();
      }
    });
  }
  
  function toggleFiltering(enabled) {
    isEnabled = enabled;
    
    if (enabled) {
      // Re-initialize if needed
      if (!contentScanner) {
        contentScanner = new window.ContentScanner();
      }
      if (!domManipulator) {
        domManipulator = new window.DOMManipulator();
      }
    } else {
      // Pause scanning
      if (contentScanner) {
        contentScanner.destroy();
        contentScanner = null;
      }
    }
    
    // Update page indicator
    updatePageIndicator(enabled);
  }
  
  function updateSettings(newSettings) {
    // Reload scanner with new settings
    if (contentScanner) {
      contentScanner.destroy();
      contentScanner = new window.ContentScanner();
    }
  }
  
  function getPageStats() {
    const stats = {
      url: window.location.href,
      hostname: window.location.hostname,
      blockedCount: domManipulator ? domManipulator.getBlockedCount() : 0,
      scanningEnabled: isEnabled,
      timestamp: Date.now()
    };
    
    return stats;
  }
  
  function restoreAllContent() {
    if (domManipulator) {
      domManipulator.restoreAllContent();
    }
  }
  
  function rescanPage() {
    if (contentScanner) {
      contentScanner.destroy();
      contentScanner = new window.ContentScanner();
    }
  }
  
  function pauseScanning() {
    if (contentScanner) {
      contentScanner.isScanning = false;
    }
  }
  
  function resumeScanning() {
    if (contentScanner && isEnabled) {
      contentScanner.isScanning = true;
      contentScanner.startScanning();
    }
  }
  
  function updatePageIndicator(enabled) {
    // Remove existing indicator
    const existing = document.getElementById('ai-firewall-indicator');
    if (existing) {
      existing.remove();
    }
    
    // Add new indicator
    const indicator = document.createElement('div');
    indicator.id = 'ai-firewall-indicator';
    indicator.style.cssText = `
      position: fixed !important;
      top: 10px !important;
      right: 10px !important;
      z-index: 999999 !important;
      background: ${enabled ? '#48bb78' : '#e53e3e'} !important;
      color: white !important;
      padding: 8px 12px !important;
      border-radius: 20px !important;
      font-size: 12px !important;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
      box-shadow: 0 2px 10px rgba(0,0,0,0.2) !important;
      transition: all 0.3s ease !important;
      cursor: pointer !important;
    `;
    
    indicator.textContent = `🛡️ AI-Firewall ${enabled ? 'ON' : 'OFF'}`;
    indicator.title = 'Click to toggle AI-Firewall';
    
    indicator.addEventListener('click', () => {
      toggleFiltering(!isEnabled);
    });
    
    document.body.appendChild(indicator);
    
    // Auto-hide after 3 seconds
    setTimeout(() => {
      if (indicator.parentNode) {
        indicator.style.opacity = '0.3';
      }
    }, 3000);
  }
  
  function showNotification(message) {
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed !important;
      top: 50px !important;
      right: 10px !important;
      z-index: 999999 !important;
      background: #2d3748 !important;
      color: white !important;
      padding: 12px 16px !important;
      border-radius: 8px !important;
      font-size: 14px !important;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3) !important;
      animation: slideIn 0.3s ease !important;
    `;
    
    notification.textContent = message;
    document.body.appendChild(notification);
    
    // Remove after 3 seconds
    setTimeout(() => {
      notification.style.animation = 'slideOut 0.3s ease';
      setTimeout(() => {
        if (notification.parentNode) {
          notification.remove();
        }
      }, 300);
    }, 3000);
  }
  
  function showStats() {
    const stats = getPageStats();
    const message = `
      AI-Firewall Stats:
      • Blocked items: ${stats.blockedCount}
      • Status: ${stats.scanningEnabled ? 'Active' : 'Disabled'}
      • Site: ${stats.hostname}
    `;
    
    showNotification(message);
  }
  
  // Add CSS animations
  const style = document.createElement('style');
  style.textContent = `
    @keyframes slideIn {
      from { transform: translateX(100%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes slideOut {
      from { transform: translateX(0); opacity: 1; }
      to { transform: translateX(100%); opacity: 0; }
    }
  `;
  document.head.appendChild(style);
  
  // Initialize page indicator
  updatePageIndicator(isEnabled);
  
})();
