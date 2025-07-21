#!/usr/bin/env python3
"""
Test script for AI-Firewall API integrations
Tests Gemini API and Hugging Face models
"""

import os
import sys
from dotenv import load_dotenv

# Load environment variables
load_dotenv('backend/.env')

def test_gemini_api():
    """Test Gemini API integration"""
    print("🔍 Testing Gemini API...")
    
    try:
        from backend.services.content_moderator import ContentModerator
        
        moderator = ContentModerator()
        
        if not moderator.is_ready():
            print("❌ Gemini API not configured")
            print("💡 Add GEMINI_API_KEY to backend/.env file")
            print("📖 See API_SETUP_GUIDE.md for instructions")
            return False
        
        # Test with safe content
        safe_result = moderator.moderate_text("Hello, how are you today?")
        
        if safe_result and not safe_result.get('flagged', True):
            print("✅ Gemini API working - Safe content detected correctly")
        else:
            print("⚠️ Gemini API responding but may have issues")
            
        # Test with potentially harmful content
        harmful_result = moderator.moderate_text("I hate you and want to hurt you!")
        
        if harmful_result and harmful_result.get('flagged', False):
            print("✅ Gemini API working - Harmful content detected correctly")
        else:
            print("⚠️ Gemini API may not be detecting harmful content properly")
            
        return True
        
    except Exception as e:
        print(f"❌ Gemini API test failed: {str(e)}")
        return False

def test_huggingface_models():
    """Test Hugging Face model integration"""
    print("\n🤗 Testing Hugging Face models...")
    
    try:
        from backend.services.text_analyzer import TextAnalyzer
        
        analyzer = TextAnalyzer()
        
        if not analyzer.is_ready():
            print("❌ Text analyzer not ready")
            return False
        
        # Test with safe content
        safe_result = analyzer.analyze("This is a beautiful day!")
        
        if safe_result.get('is_safe', False):
            print("✅ Hugging Face models working - Safe content detected")
        else:
            print("⚠️ Hugging Face models may have issues with safe content")
            
        # Test with toxic content
        toxic_result = analyzer.analyze("You are stupid and I hate you!")
        
        if not toxic_result.get('is_safe', True):
            print("✅ Hugging Face models working - Toxic content detected")
        else:
            print("⚠️ Hugging Face models may not be detecting toxic content")
            
        return True
        
    except Exception as e:
        print(f"❌ Hugging Face test failed: {str(e)}")
        return False

def test_image_analysis():
    """Test image analysis capabilities"""
    print("\n🖼️ Testing Image Analysis...")
    
    try:
        from backend.services.image_analyzer import ImageAnalyzer
        from PIL import Image
        import io
        import base64
        
        analyzer = ImageAnalyzer()
        
        if not analyzer.is_ready():
            print("❌ Image analyzer not ready")
            return False
        
        # Create a simple test image
        test_image = Image.new('RGB', (100, 100), (255, 255, 255))
        buffer = io.BytesIO()
        test_image.save(buffer, format='JPEG')
        image_data = base64.b64encode(buffer.getvalue()).decode()
        image_data = f"data:image/jpeg;base64,{image_data}"
        
        result = analyzer.analyze(image_data)
        
        if result.get('is_safe', False):
            print("✅ Image analysis working - Safe image detected")
        else:
            print("⚠️ Image analysis may have issues")
            
        return True
        
    except Exception as e:
        print(f"❌ Image analysis test failed: {str(e)}")
        return False

def test_backend_health():
    """Test if backend is running"""
    print("\n🏥 Testing Backend Health...")
    
    try:
        import requests
        
        response = requests.get('http://localhost:5000/api/health', timeout=5)
        
        if response.status_code == 200:
            data = response.json()
            print("✅ Backend is running and healthy")
            print(f"   Status: {data.get('status')}")
            
            services = data.get('services', {})
            for service, status in services.items():
                status_icon = "✅" if status else "❌"
                print(f"   {service}: {status_icon}")
                
            return True
        else:
            print(f"❌ Backend health check failed: HTTP {response.status_code}")
            return False
            
    except requests.exceptions.ConnectionError:
        print("❌ Backend is not running")
        print("💡 Start the backend with: cd backend && python app.py")
        return False
    except Exception as e:
        print(f"❌ Backend health test failed: {str(e)}")
        return False

def print_api_status():
    """Print current API configuration status"""
    print("\n📋 API Configuration Status:")
    
    gemini_key = os.getenv('GEMINI_API_KEY')
    hf_key = os.getenv('HUGGINGFACE_API_KEY')
    
    print(f"   Gemini API: {'✅ Configured' if gemini_key else '❌ Not configured'}")
    print(f"   Hugging Face: {'✅ Configured' if hf_key else '⚠️ Optional'}")
    
    if not gemini_key:
        print("\n💡 To configure Gemini API:")
        print("   1. Get API key from https://makersuite.google.com/app/apikey")
        print("   2. Add GEMINI_API_KEY=your_key to backend/.env")
        print("   3. Restart the backend")

def main():
    """Main test runner"""
    print("🛡️ AI-Firewall API Test Suite")
    print("=" * 40)
    
    # Check API configuration
    print_api_status()
    
    # Run tests
    tests = [
        ("Backend Health", test_backend_health),
        ("Hugging Face Models", test_huggingface_models),
        ("Image Analysis", test_image_analysis),
        ("Gemini API", test_gemini_api),
    ]
    
    results = []
    
    for test_name, test_func in tests:
        try:
            result = test_func()
            results.append((test_name, result))
        except Exception as e:
            print(f"❌ {test_name} test crashed: {str(e)}")
            results.append((test_name, False))
    
    # Summary
    print("\n" + "=" * 40)
    print("📊 Test Results Summary:")
    
    passed = 0
    for test_name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"   {test_name}: {status}")
        if result:
            passed += 1
    
    print(f"\n🎯 {passed}/{len(results)} tests passed")
    
    if passed == len(results):
        print("🎉 All tests passed! Your AI-Firewall is ready to use.")
    else:
        print("🔧 Some tests failed. Check the output above for details.")
        print("📖 See API_SETUP_GUIDE.md for configuration help.")
    
    return passed == len(results)

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
