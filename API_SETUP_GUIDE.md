# 🔑 API Setup Guide for AI-Firewall

## 📋 Required APIs Overview

The AI-Firewall system uses the following APIs for enhanced content filtering:

### ✅ **Required APIs**
1. **Google Gemini API** - Primary content moderation (FREE tier available)
2. **Hugging Face API** - Text analysis models (FREE tier available)

### ❌ **Removed APIs**
- ~~OpenAI API~~ - Replaced with Gemini (was expensive and restrictive)

---

## 🚀 **1. Google Gemini API Setup**

### **Why Gemini?**
- ✅ **FREE tier**: 60 requests per minute
- ✅ **Generous limits**: 1,500 requests per day
- ✅ **Advanced reasoning**: Better context understanding
- ✅ **Cost-effective**: Much cheaper than OpenAI
- ✅ **Reliable**: Google's infrastructure

### **Setup Steps:**

#### **Step 1: Get Gemini API Key**
1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click **"Create API Key"**
4. Copy the generated API key

#### **Step 2: Configure in AI-Firewall**
1. Open `backend/.env` file (create from `.env.example` if needed)
2. Add your Gemini API key:
   ```env
   GEMINI_API_KEY=your_actual_gemini_api_key_here
   ```

#### **Step 3: Test Gemini Integration**
```bash
# Test the API
python -c "
import os
os.environ['GEMINI_API_KEY'] = 'your_key_here'
from services.content_moderator import ContentModerator
moderator = ContentModerator()
print('Gemini ready:', moderator.is_ready())
"
```

---

## 🤗 **2. Hugging Face API Setup (Optional)**

### **Why Hugging Face?**
- ✅ **FREE tier**: 30,000 characters/month
- ✅ **Local models**: Can run offline
- ✅ **Specialized models**: Toxicity detection
- ✅ **No rate limits**: For local inference

### **Setup Steps:**

#### **Step 1: Get Hugging Face Token**
1. Go to [Hugging Face](https://huggingface.co/settings/tokens)
2. Sign up/login
3. Create a new token
4. Copy the token

#### **Step 2: Configure in AI-Firewall**
```env
HUGGINGFACE_API_KEY=your_huggingface_token_here
```

#### **Note**: Hugging Face is optional - the system works with local models too!

---

## 💰 **Cost Comparison**

| API | Free Tier | Paid Tier | Best For |
|-----|-----------|-----------|----------|
| **Gemini** | 60 req/min, 1,500/day | $0.50/1M tokens | Content moderation |
| **Hugging Face** | 30K chars/month | $9/month unlimited | Text analysis |
| ~~OpenAI~~ | ~~Very limited~~ | ~~$0.002/1K tokens~~ | ~~Expensive~~ |

---

## 🔧 **Configuration Files**

### **backend/.env**
```env
# Flask Configuration
FLASK_ENV=development
FLASK_DEBUG=True
FLASK_HOST=localhost
FLASK_PORT=5000

# AI Model Configuration
GEMINI_API_KEY=your_gemini_api_key_here
HUGGINGFACE_API_KEY=your_huggingface_token_here

# Content Filtering Thresholds
DEFAULT_TEXT_THRESHOLD=0.7
DEFAULT_IMAGE_THRESHOLD=0.6

# CORS Settings
CORS_ORIGINS=chrome-extension://*,http://localhost:3000

# Logging
LOG_LEVEL=DEBUG
LOG_FILE=logs/app.log
```

---

## 🎯 **API Usage in AI-Firewall**

### **Gemini API Usage:**
- **Content moderation**: Analyzes text for inappropriate content
- **Context understanding**: Better than keyword matching
- **Multi-category detection**: Hate, violence, sexual content, etc.
- **Confidence scoring**: Provides probability scores

### **Hugging Face Usage:**
- **Local text analysis**: `unitary/toxic-bert` model
- **Fallback system**: When Gemini is unavailable
- **Offline capability**: Works without internet
- **Specialized models**: Toxicity-specific training

---

## 🚦 **Fallback System**

The AI-Firewall has a robust fallback system:

1. **Primary**: Gemini API (if configured)
2. **Secondary**: Hugging Face models (local/API)
3. **Tertiary**: Keyword-based filtering (always available)

This ensures the system works even without API keys!

---

## 🧪 **Testing Your Setup**

### **Test Script:**
```python
# Run this to test your API setup
python test_apis.py
```

### **Manual Testing:**
```bash
# Test Gemini
curl -X POST http://localhost:5000/api/analyze/text \
  -H "Content-Type: application/json" \
  -d '{"text": "This is a test message", "threshold": 0.7}'

# Check response for Gemini integration
```

---

## 🔒 **Security Best Practices**

### **API Key Security:**
- ✅ Never commit API keys to version control
- ✅ Use environment variables
- ✅ Rotate keys regularly
- ✅ Monitor usage in API dashboards

### **Rate Limiting:**
- ✅ Implement caching to reduce API calls
- ✅ Use batch processing when possible
- ✅ Monitor usage to stay within limits

---

## 📊 **Expected Usage**

For a typical family with 2-3 kids:
- **Daily requests**: ~500-1,000 (well within Gemini free tier)
- **Monthly cost**: $0 (free tier sufficient)
- **Performance**: < 500ms response time

---

## 🆘 **Troubleshooting**

### **Common Issues:**

#### **"Gemini API key not found"**
- Check `.env` file exists in `backend/` folder
- Verify `GEMINI_API_KEY` is set correctly
- Restart the Flask server

#### **"API quota exceeded"**
- Check your usage in Google AI Studio
- Implement caching (already included)
- Consider upgrading to paid tier

#### **"Model not loading"**
- Check internet connection
- Verify Hugging Face token
- Models download automatically on first use

---

## 🎉 **Benefits of This Setup**

✅ **Cost-effective**: Free tier covers most usage  
✅ **Reliable**: Multiple fallback systems  
✅ **Fast**: Local models + API caching  
✅ **Accurate**: Advanced AI models  
✅ **Scalable**: Easy to upgrade when needed  

---

## 🔄 **Migration from OpenAI**

If you had OpenAI configured before:

1. **Remove OpenAI key** from `.env`
2. **Add Gemini key** to `.env`
3. **Restart backend**: `python app.py`
4. **Test functionality**: Extension should work the same

The system will automatically use Gemini instead of OpenAI!

---

**🎯 Ready to go! Your AI-Firewall now uses cost-effective, powerful APIs for the best content filtering experience.**
