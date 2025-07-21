/**
 * DOM Manipulator
 * Handles blocking, blurring, and replacing inappropriate content
 */

class DOMManipulator {
  constructor() {
    this.blockedElements = new Set();
    this.replacementElements = new Map();
    
    // Listen for unsafe content events
    document.addEventListener('ai-firewall-unsafe-content', (event) => {
      this.handleUnsafeContent(event.detail);
    });
    
    this.init();
  }
  
  init() {
    // Add CSS for blocked content
    this.injectStyles();
  }
  
  injectStyles() {
    const style = document.createElement('style');
    style.textContent = `
      .ai-firewall-blocked {
        position: relative !important;
        background: #f8f9fa !important;
        border: 2px solid #e74c3c !important;
        border-radius: 8px !important;
        padding: 20px !important;
        text-align: center !important;
        color: #2c3e50 !important;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
        font-size: 14px !important;
        line-height: 1.5 !important;
      }
      
      .ai-firewall-blocked-text {
        background: linear-gradient(135deg, #fff5f5 0%, #fed7d7 100%) !important;
        min-height: 60px !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
      }
      
      .ai-firewall-blocked-image {
        background: linear-gradient(135deg, #f7fafc 0%, #e2e8f0 100%) !important;
        min-height: 200px !important;
        display: flex !important;
        flex-direction: column !important;
        align-items: center !important;
        justify-content: center !important;
      }
      
      .ai-firewall-blurred {
        filter: blur(20px) !important;
        transition: filter 0.3s ease !important;
      }
      
      .ai-firewall-blurred:hover {
        filter: blur(5px) !important;
      }
      
      .ai-firewall-icon {
        font-size: 24px !important;
        margin-bottom: 10px !important;
      }
      
      .ai-firewall-message {
        font-weight: 600 !important;
        margin-bottom: 8px !important;
      }
      
      .ai-firewall-details {
        font-size: 12px !important;
        color: #718096 !important;
        margin-bottom: 12px !important;
      }
      
      .ai-firewall-actions {
        display: flex !important;
        gap: 8px !important;
        justify-content: center !important;
        flex-wrap: wrap !important;
      }
      
      .ai-firewall-btn {
        padding: 6px 12px !important;
        border: 1px solid #cbd5e0 !important;
        border-radius: 4px !important;
        background: white !important;
        color: #4a5568 !important;
        font-size: 12px !important;
        cursor: pointer !important;
        transition: all 0.2s ease !important;
      }
      
      .ai-firewall-btn:hover {
        background: #f7fafc !important;
        border-color: #a0aec0 !important;
      }
      
      .ai-firewall-btn-primary {
        background: #3182ce !important;
        color: white !important;
        border-color: #3182ce !important;
      }
      
      .ai-firewall-btn-primary:hover {
        background: #2c5aa0 !important;
        border-color: #2c5aa0 !important;
      }
      
      .ai-firewall-safe {
        border: 1px solid #48bb78 !important;
        background: #f0fff4 !important;
      }
      
      @keyframes ai-firewall-fade-in {
        from { opacity: 0; transform: translateY(-10px); }
        to { opacity: 1; transform: translateY(0); }
      }
      
      .ai-firewall-blocked {
        animation: ai-firewall-fade-in 0.3s ease !important;
      }
    `;
    
    document.head.appendChild(style);
  }
  
  handleUnsafeContent(detail) {
    const { element, type, analysisResult } = detail;
    
    if (this.blockedElements.has(element)) {
      return; // Already handled
    }
    
    this.blockedElements.add(element);
    
    // Choose blocking method based on content type and severity
    const blockingMethod = this.getBlockingMethod(type, analysisResult);
    
    switch (blockingMethod) {
      case 'replace':
        this.replaceContent(element, type, analysisResult);
        break;
      case 'blur':
        this.blurContent(element, type, analysisResult);
        break;
      case 'hide':
        this.hideContent(element, type, analysisResult);
        break;
      default:
        this.replaceContent(element, type, analysisResult);
    }
  }
  
  getBlockingMethod(type, analysisResult) {
    const confidence = analysisResult.confidence;
    const flaggedCategories = analysisResult.flagged_categories || [];
    
    // High confidence or severe categories -> replace
    if (confidence > 0.8 || flaggedCategories.includes('severe_toxic')) {
      return 'replace';
    }
    
    // Medium confidence -> blur
    if (confidence > 0.6) {
      return 'blur';
    }
    
    // Low confidence -> replace with option to show
    return 'replace';
  }
  
  replaceContent(element, type, analysisResult) {
    const replacement = this.createReplacementElement(element, type, analysisResult);
    
    // Store original element for potential restoration
    this.replacementElements.set(replacement, element);
    
    // Replace in DOM
    element.parentNode.replaceChild(replacement, element);
  }
  
  createReplacementElement(originalElement, type, analysisResult) {
    const container = document.createElement('div');
    container.className = `ai-firewall-blocked ai-firewall-blocked-${type}`;
    
    const icon = type === 'image' ? '🖼️' : '📝';
    const typeLabel = type === 'image' ? 'Image' : 'Text';
    
    container.innerHTML = `
      <div class="ai-firewall-icon">${icon}</div>
      <div class="ai-firewall-message">
        ${typeLabel} blocked by AI-Firewall
      </div>
      <div class="ai-firewall-details">
        Reason: ${this.getBlockingReason(analysisResult)}
      </div>
      <div class="ai-firewall-actions">
        <button class="ai-firewall-btn ai-firewall-btn-primary" data-action="show">
          Show Content
        </button>
        <button class="ai-firewall-btn" data-action="report">
          Report Issue
        </button>
      </div>
    `;
    
    // Add event listeners
    this.addReplacementEventListeners(container, originalElement, type);
    
    return container;
  }
  
  getBlockingReason(analysisResult) {
    const categories = analysisResult.flagged_categories || [];
    
    if (categories.length === 0) {
      return 'Potentially inappropriate content';
    }
    
    const categoryLabels = {
      'toxic': 'Toxic language',
      'severe_toxic': 'Severely toxic content',
      'obscene': 'Obscene content',
      'threat': 'Threatening language',
      'insult': 'Insulting content',
      'identity_hate': 'Hate speech',
      'nsfw': 'Adult content',
      'violence': 'Violent content',
      'drugs': 'Drug-related content',
      'weapons': 'Weapon-related content'
    };
    
    const reasons = categories.map(cat => categoryLabels[cat] || cat);
    return reasons.join(', ');
  }
  
  addReplacementEventListeners(container, originalElement, type) {
    container.addEventListener('click', (event) => {
      const action = event.target.dataset.action;
      
      switch (action) {
        case 'show':
          this.showOriginalContent(container, originalElement);
          break;
        case 'report':
          this.reportIssue(originalElement, type);
          break;
      }
    });
  }
  
  showOriginalContent(replacement, originalElement) {
    // Ask for confirmation
    const confirmed = confirm(
      'Are you sure you want to view this content? It was flagged as potentially inappropriate.'
    );
    
    if (confirmed) {
      // Replace back with original
      replacement.parentNode.replaceChild(originalElement, replacement);
      
      // Mark as safe to prevent re-scanning
      originalElement.classList.add('ai-firewall-safe');
      
      // Clean up
      this.replacementElements.delete(replacement);
      this.blockedElements.delete(originalElement);
    }
  }
  
  reportIssue(element, type) {
    // Create feedback form
    const feedback = prompt(
      'Please describe the issue with this content filtering (optional):'
    );
    
    // Send feedback to background script
    chrome.runtime.sendMessage({
      type: 'REPORT_ISSUE',
      data: {
        url: window.location.href,
        type,
        feedback,
        timestamp: Date.now()
      }
    });
    
    alert('Thank you for your feedback! This helps improve our filtering.');
  }
  
  blurContent(element, type, analysisResult) {
    // Add blur class
    element.classList.add('ai-firewall-blurred');
    
    // Add click handler to remove blur
    const removeBlur = () => {
      element.classList.remove('ai-firewall-blurred');
      element.removeEventListener('click', removeBlur);
      
      // Mark as safe
      element.classList.add('ai-firewall-safe');
      this.blockedElements.delete(element);
    };
    
    element.addEventListener('click', removeBlur);
    
    // Add tooltip
    element.title = `Content blurred by AI-Firewall. Reason: ${this.getBlockingReason(analysisResult)}. Click to reveal.`;
  }
  
  hideContent(element, type, analysisResult) {
    // Store original display style
    const originalDisplay = element.style.display;
    element.dataset.originalDisplay = originalDisplay;
    
    // Hide element
    element.style.display = 'none';
    
    // Create show button
    const showButton = document.createElement('button');
    showButton.className = 'ai-firewall-btn ai-firewall-btn-primary';
    showButton.textContent = `Show hidden ${type}`;
    showButton.style.margin = '10px';
    
    showButton.addEventListener('click', () => {
      element.style.display = originalDisplay;
      showButton.remove();
      element.classList.add('ai-firewall-safe');
      this.blockedElements.delete(element);
    });
    
    // Insert show button
    element.parentNode.insertBefore(showButton, element);
  }
  
  // Utility methods
  restoreAllContent() {
    // Restore all replaced content
    this.replacementElements.forEach((original, replacement) => {
      if (replacement.parentNode) {
        replacement.parentNode.replaceChild(original, replacement);
      }
    });
    
    // Remove all blur effects
    document.querySelectorAll('.ai-firewall-blurred').forEach(element => {
      element.classList.remove('ai-firewall-blurred');
    });
    
    // Show all hidden content
    document.querySelectorAll('[data-original-display]').forEach(element => {
      element.style.display = element.dataset.originalDisplay;
    });
    
    // Clear tracking
    this.blockedElements.clear();
    this.replacementElements.clear();
  }
  
  getBlockedCount() {
    return this.blockedElements.size;
  }
}

// Export for use in content script
window.DOMManipulator = DOMManipulator;
