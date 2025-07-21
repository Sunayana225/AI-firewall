#!/usr/bin/env python3
"""
Setup script for Gemini API integration
"""

import os
import sys
from pathlib import Path

def setup_gemini_api():
    """Setup Gemini API key for AI-powered content moderation"""
    
    print("🤖 AI-Firewall Gemini API Setup")
    print("=" * 50)
    print()
    print("To use AI-powered content moderation instead of simple keywords,")
    print("you need a Google Gemini API key.")
    print()
    print("📋 How to get a Gemini API key:")
    print("1. Go to: https://makersuite.google.com/app/apikey")
    print("2. Sign in with your Google account")
    print("3. Click 'Create API Key'")
    print("4. Copy the generated API key")
    print()
    
    # Check if API key already exists
    env_file = Path('.env')
    current_key = None
    
    if env_file.exists():
        with open(env_file, 'r') as f:
            for line in f:
                if line.startswith('GEMINI_API_KEY='):
                    current_key = line.split('=', 1)[1].strip()
                    break
    
    if current_key:
        print(f"✅ Current API key found: {current_key[:10]}...")
        choice = input("\nDo you want to update it? (y/N): ").lower().strip()
        if choice != 'y':
            print("Keeping existing API key.")
            return
    
    # Get new API key
    api_key = input("\n🔑 Enter your Gemini API key: ").strip()
    
    if not api_key:
        print("❌ No API key provided. Exiting.")
        return
    
    if len(api_key) < 20:
        print("❌ API key seems too short. Please check and try again.")
        return
    
    # Save to .env file
    env_content = []
    
    if env_file.exists():
        with open(env_file, 'r') as f:
            env_content = f.readlines()
    
    # Remove existing GEMINI_API_KEY line
    env_content = [line for line in env_content if not line.startswith('GEMINI_API_KEY=')]
    
    # Add new API key
    env_content.append(f'GEMINI_API_KEY={api_key}\n')
    
    # Write back to file
    with open(env_file, 'w') as f:
        f.writelines(env_content)
    
    print(f"✅ API key saved to {env_file}")
    print()
    print("🎉 Setup complete!")
    print()
    print("📋 Next steps:")
    print("1. Restart the backend server: python backend/app.py")
    print("2. The system will now use AI-powered content analysis")
    print("3. Test with: 'killing pictures' - should be detected as violent content")
    print()
    print("💡 Benefits of AI analysis over keywords:")
    print("   • Understands context and nuance")
    print("   • Detects implicit threats and violence")
    print("   • No need to manually add keywords")
    print("   • Adapts to new forms of inappropriate content")

def test_gemini_api():
    """Test if Gemini API is working"""
    try:
        from backend.services.content_moderator import ContentModerator
        
        print("🧪 Testing Gemini API...")
        moderator = ContentModerator()
        
        if not moderator.is_ready():
            print("❌ Gemini API not ready. Please run setup first.")
            return
        
        # Test with violent content
        test_text = "killing pictures and violent imagery"
        result = moderator.moderate_text(test_text)
        
        if result:
            print(f"✅ API working! Test result:")
            print(f"   Text: '{test_text}'")
            print(f"   Flagged: {result.get('flagged', False)}")
            print(f"   Violence score: {result.get('category_scores', {}).get('violence', 0.0)}")
        else:
            print("❌ API test failed")
            
    except Exception as e:
        print(f"❌ Error testing API: {e}")

if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "test":
        test_gemini_api()
    else:
        setup_gemini_api()
