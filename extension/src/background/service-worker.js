/**
 * AI-Firewall Background Service Worker
 * Handles communication between content scripts and backend API
 */

// Configuration
const CONFIG = {
  API_BASE_URL: 'http://localhost:5000/api',
  CACHE_DURATION: 5 * 60 * 1000, // 5 minutes
  MAX_CACHE_SIZE: 1000,
  BATCH_SIZE: 10,
  BATCH_TIMEOUT: 1000 // 1 second
};

// Cache for analysis results
const analysisCache = new Map();
const pendingRequests = new Map();
let batchQueue = [];
let batchTimer = null;

// Initialize extension
chrome.runtime.onInstalled.addListener(async (details) => {
  console.log('AI-Firewall extension installed/updated');
  
  // Set default settings
  await setDefaultSettings();
  
  // Clear cache on install/update
  analysisCache.clear();
});

// Handle messages from content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Background received message:', message.type);
  
  switch (message.type) {
    case 'ANALYZE_TEXT':
      handleTextAnalysis(message.data, sendResponse);
      return true; // Keep message channel open for async response
      
    case 'ANALYZE_IMAGE':
      handleImageAnalysis(message.data, sendResponse);
      return true;
      
    case 'ANALYZE_BATCH':
      handleBatchAnalysis(message.data, sendResponse);
      return true;
      
    case 'GET_SETTINGS':
      handleGetSettings(sendResponse);
      return true;
      
    case 'UPDATE_SETTINGS':
      handleUpdateSettings(message.data, sendResponse);
      return true;
      
    case 'GET_STATS':
      handleGetStats(sendResponse);
      return true;
      
    default:
      console.warn('Unknown message type:', message.type);
      sendResponse({ error: 'Unknown message type' });
  }
});

// Text analysis handler
async function handleTextAnalysis(data, sendResponse) {
  try {
    const { text, threshold, ageGroup } = data;
    
    // Check cache first
    const cacheKey = `text:${hashString(text)}:${threshold}:${ageGroup}`;
    const cached = getFromCache(cacheKey);
    if (cached) {
      sendResponse({ success: true, result: cached });
      return;
    }
    
    // Make API request
    const result = await makeApiRequest('/analyze/text', {
      text,
      threshold,
      age_group: ageGroup
    });
    
    // Cache result
    setCache(cacheKey, result);
    
    // Update stats
    await updateStats('text_analyzed');
    if (!result.is_safe) {
      await updateStats('content_blocked');
    }
    
    sendResponse({ success: true, result });
    
  } catch (error) {
    console.error('Text analysis error:', error);
    sendResponse({ success: false, error: error.message });
  }
}

// Image analysis handler
async function handleImageAnalysis(data, sendResponse) {
  try {
    const { imageData, threshold, ageGroup } = data;
    
    // Check cache first
    const cacheKey = `image:${hashString(imageData)}:${threshold}:${ageGroup}`;
    const cached = getFromCache(cacheKey);
    if (cached) {
      sendResponse({ success: true, result: cached });
      return;
    }
    
    // Make API request
    const result = await makeApiRequest('/analyze/image', {
      image: imageData,
      threshold,
      age_group: ageGroup
    });
    
    // Cache result
    setCache(cacheKey, result);
    
    // Update stats
    await updateStats('images_analyzed');
    if (!result.is_safe) {
      await updateStats('content_blocked');
    }
    
    sendResponse({ success: true, result });
    
  } catch (error) {
    console.error('Image analysis error:', error);
    sendResponse({ success: false, error: error.message });
  }
}

// Batch analysis handler
async function handleBatchAnalysis(data, sendResponse) {
  try {
    const { items } = data;
    
    const result = await makeApiRequest('/analyze/batch', { items });
    
    sendResponse({ success: true, result });
    
  } catch (error) {
    console.error('Batch analysis error:', error);
    sendResponse({ success: false, error: error.message });
  }
}

// Settings handlers
async function handleGetSettings(sendResponse) {
  try {
    const settings = await chrome.storage.sync.get([
      'filteringLevel',
      'ageGroup',
      'enabledCategories',
      'allowlist',
      'parentalMode'
    ]);
    
    sendResponse({ success: true, settings });
  } catch (error) {
    console.error('Get settings error:', error);
    sendResponse({ success: false, error: error.message });
  }
}

async function handleUpdateSettings(data, sendResponse) {
  try {
    await chrome.storage.sync.set(data);
    sendResponse({ success: true });
  } catch (error) {
    console.error('Update settings error:', error);
    sendResponse({ success: false, error: error.message });
  }
}

// Stats handler
async function handleGetStats(sendResponse) {
  try {
    const stats = await chrome.storage.local.get([
      'totalScanned',
      'contentBlocked',
      'textAnalyzed',
      'imagesAnalyzed',
      'lastReset'
    ]);
    
    sendResponse({ success: true, stats });
  } catch (error) {
    console.error('Get stats error:', error);
    sendResponse({ success: false, error: error.message });
  }
}

// Utility functions
async function makeApiRequest(endpoint, data) {
  const response = await fetch(`${CONFIG.API_BASE_URL}${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data)
  });
  
  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`);
  }
  
  return await response.json();
}

function getFromCache(key) {
  const cached = analysisCache.get(key);
  if (cached && Date.now() - cached.timestamp < CONFIG.CACHE_DURATION) {
    return cached.data;
  }
  analysisCache.delete(key);
  return null;
}

function setCache(key, data) {
  // Implement LRU cache
  if (analysisCache.size >= CONFIG.MAX_CACHE_SIZE) {
    const firstKey = analysisCache.keys().next().value;
    analysisCache.delete(firstKey);
  }
  
  analysisCache.set(key, {
    data,
    timestamp: Date.now()
  });
}

function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return hash.toString();
}

async function setDefaultSettings() {
  const defaults = {
    filteringLevel: 'moderate',
    ageGroup: 'moderate',
    enabledCategories: ['explicit', 'violence', 'hate', 'harassment'],
    allowlist: [],
    parentalMode: false
  };
  
  const existing = await chrome.storage.sync.get(Object.keys(defaults));
  const toSet = {};
  
  for (const [key, value] of Object.entries(defaults)) {
    if (!(key in existing)) {
      toSet[key] = value;
    }
  }
  
  if (Object.keys(toSet).length > 0) {
    await chrome.storage.sync.set(toSet);
  }
}

async function updateStats(statName) {
  const stats = await chrome.storage.local.get([statName, 'totalScanned']);
  const newStats = {
    [statName]: (stats[statName] || 0) + 1,
    totalScanned: (stats.totalScanned || 0) + 1
  };
  
  await chrome.storage.local.set(newStats);
}
