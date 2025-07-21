/**
 * Content Scanner
 * Scans web page content for text and images that need analysis
 */

class ContentScanner {
  constructor() {
    this.scanQueue = [];
    this.isScanning = false;
    this.settings = null;
    this.observer = null;
    
    // Selectors for content to scan
    this.textSelectors = [
      'p', 'div', 'span', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'article', 'section', 'main', 'aside', 'blockquote',
      'li', 'td', 'th', 'caption', 'figcaption',
      // Google-specific selectors
      '.g', '.rc', '.r', '.s', '.st', '[data-ved]', '.LC20lb'
    ];
    
    this.imageSelectors = ['img', 'picture', 'svg'];
    
    // Elements to ignore
    this.ignoreSelectors = [
      'script', 'style', 'noscript', 'meta', 'link', 'title',
      '.ai-firewall-blocked', '.ai-firewall-safe'
    ];
    
    this.init();
  }
  
  async init() {
    // Load settings
    await this.loadSettings();
    
    // Start scanning
    this.startScanning();
    
    // Setup mutation observer for dynamic content
    this.setupMutationObserver();
  }
  
  async loadSettings() {
    try {
      const response = await this.sendMessage({
        type: 'GET_SETTINGS'
      });
      
      if (response.success) {
        this.settings = response.settings;
      } else {
        // Use defaults
        this.settings = {
          filteringLevel: 'moderate',
          ageGroup: 'moderate',
          enabledCategories: ['explicit', 'violence', 'hate'],
          allowlist: []
        };
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  }
  
  startScanning() {
    if (this.isScanning) return;
    
    this.isScanning = true;
    
    // Check if current site is in allowlist
    if (this.isAllowlisted()) {
      console.log('Site is allowlisted, skipping scan');
      return;
    }
    
    // Scan existing content
    this.scanExistingContent();
    
    // Continue scanning new content
    this.continuousScanning();
  }
  
  isAllowlisted() {
    const currentDomain = window.location.hostname;
    return this.settings.allowlist.some(domain => 
      currentDomain.includes(domain) || domain.includes(currentDomain)
    );
  }
  
  scanExistingContent() {
    // Scan text content
    this.scanTextContent();

    // Special handling for Google search
    if (window.location.hostname.includes('google.')) {
      this.scanGoogleSearchResults();
    }

    // Scan images
    this.scanImageContent();
  }
  
  scanTextContent() {
    const textElements = document.querySelectorAll(this.textSelectors.join(','));
    
    textElements.forEach(element => {
      if (this.shouldIgnoreElement(element)) return;
      
      const text = this.extractText(element);
      if (this.shouldAnalyzeText(text)) {
        this.queueTextAnalysis(element, text);
      }
    });
  }
  
  scanImageContent() {
    const imageElements = document.querySelectorAll(this.imageSelectors.join(','));
    
    imageElements.forEach(element => {
      if (this.shouldIgnoreElement(element)) return;
      
      if (this.shouldAnalyzeImage(element)) {
        this.queueImageAnalysis(element);
      }
    });
  }
  
  shouldIgnoreElement(element) {
    // Check if element or parent has ignore class
    if (element.closest(this.ignoreSelectors.join(','))) {
      return true;
    }
    
    // Check if already processed
    if (element.hasAttribute('data-ai-firewall-processed')) {
      return true;
    }
    
    // Check if element is hidden
    const style = window.getComputedStyle(element);
    if (style.display === 'none' || style.visibility === 'hidden') {
      return true;
    }
    
    return false;
  }
  
  extractText(element) {
    return element.textContent?.trim() || '';
  }
  
  shouldAnalyzeText(text) {
    // Skip if too short or too long
    if (text.length < 5 || text.length > 5000) {
      return false;
    }
    
    // Skip if only numbers/symbols
    if (!/[a-zA-Z]/.test(text)) {
      return false;
    }
    
    return true;
  }
  
  shouldAnalyzeImage(element) {
    // Skip if no src
    if (!element.src && !element.srcset) {
      return false;
    }
    
    // Skip if too small (likely icons)
    if (element.width < 50 || element.height < 50) {
      return false;
    }
    
    return true;
  }
  
  queueTextAnalysis(element, text) {
    this.scanQueue.push({
      type: 'text',
      element,
      content: text,
      timestamp: Date.now()
    });
    
    this.processQueue();
  }
  
  queueImageAnalysis(element) {
    this.scanQueue.push({
      type: 'image',
      element,
      timestamp: Date.now()
    });
    
    this.processQueue();
  }
  
  async processQueue() {
    if (this.scanQueue.length === 0) return;
    
    const item = this.scanQueue.shift();
    
    try {
      // Mark as processed
      item.element.setAttribute('data-ai-firewall-processed', 'true');
      
      if (item.type === 'text') {
        await this.analyzeText(item);
      } else if (item.type === 'image') {
        await this.analyzeImage(item);
      }
    } catch (error) {
      console.error('Error processing queue item:', error);
    }
    
    // Continue processing
    if (this.scanQueue.length > 0) {
      setTimeout(() => this.processQueue(), 100);
    }
  }
  
  async analyzeText(item) {
    const response = await this.sendMessage({
      type: 'ANALYZE_TEXT',
      data: {
        text: item.content,
        threshold: this.getThreshold('text'),
        ageGroup: this.settings.ageGroup
      }
    });
    
    if (response.success && !response.result.is_safe) {
      this.handleUnsafeContent(item.element, 'text', response.result);
    }
  }
  
  async analyzeImage(item) {
    try {
      const imageData = await this.getImageData(item.element);
      
      const response = await this.sendMessage({
        type: 'ANALYZE_IMAGE',
        data: {
          imageData,
          threshold: this.getThreshold('image'),
          ageGroup: this.settings.ageGroup
        }
      });
      
      if (response.success && !response.result.is_safe) {
        this.handleUnsafeContent(item.element, 'image', response.result);
      }
    } catch (error) {
      console.error('Error analyzing image:', error);
    }
  }
  
  async getImageData(imgElement) {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        
        try {
          const dataURL = canvas.toDataURL('image/jpeg', 0.8);
          resolve(dataURL);
        } catch (error) {
          reject(error);
        }
      };
      
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = imgElement.src;
    });
  }
  
  getThreshold(type) {
    const level = this.settings.filteringLevel;
    const thresholds = {
      text: { mild: 0.8, moderate: 0.6, strict: 0.4 },
      image: { mild: 0.7, moderate: 0.5, strict: 0.3 }
    };
    
    return thresholds[type][level] || 0.6;
  }
  
  handleUnsafeContent(element, type, analysisResult) {
    // Dispatch event for DOM manipulator
    const event = new CustomEvent('ai-firewall-unsafe-content', {
      detail: {
        element,
        type,
        analysisResult
      }
    });
    
    document.dispatchEvent(event);
  }
  
  setupMutationObserver() {
    this.observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            this.scanNewElement(node);
          }
        });
      });
    });
    
    this.observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }
  
  scanNewElement(element) {
    // Scan text in new element
    const textElements = element.querySelectorAll(this.textSelectors.join(','));
    textElements.forEach(el => {
      if (!this.shouldIgnoreElement(el)) {
        const text = this.extractText(el);
        if (this.shouldAnalyzeText(text)) {
          this.queueTextAnalysis(el, text);
        }
      }
    });
    
    // Scan images in new element
    const imageElements = element.querySelectorAll(this.imageSelectors.join(','));
    imageElements.forEach(el => {
      if (!this.shouldIgnoreElement(el) && this.shouldAnalyzeImage(el)) {
        this.queueImageAnalysis(el);
      }
    });
  }
  
  continuousScanning() {
    // Periodic re-scan for dynamic content
    setInterval(() => {
      if (!this.isAllowlisted()) {
        this.scanExistingContent();
      }
    }, 5000); // Every 5 seconds
  }
  
  sendMessage(message) {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage(message, resolve);
    });
  }
  
  scanGoogleSearchResults() {
    // Google search result selectors
    const googleSelectors = [
      '.g .LC20lb', // Search result titles
      '.g .VwiC3b', // Search result snippets
      '.g .s .st', // Search result descriptions
      '.g .r a', // Search result links
      '#search .g', // General search results
      '.srg .g' // Search result group
    ];

    googleSelectors.forEach(selector => {
      const elements = document.querySelectorAll(selector);
      elements.forEach(element => {
        if (this.shouldIgnoreElement(element)) return;

        const text = this.extractText(element);
        if (this.shouldAnalyzeText(text)) {
          console.log('Scanning Google search result:', text.substring(0, 50) + '...');
          this.queueTextAnalysis(element, text);
        }
      });
    });
  }

  destroy() {
    if (this.observer) {
      this.observer.disconnect();
    }
    this.isScanning = false;
    this.scanQueue = [];
  }
}

// Export for use in content script
window.ContentScanner = ContentScanner;
