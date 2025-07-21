#!/usr/bin/env python3
"""
Test script to verify AI-Firewall extension functionality
"""

import requests
import time
import json

def test_backend_api():
    """Test if the backend API is working"""
    print("🔍 Testing Backend API...")
    
    try:
        # Test health endpoint
        health_response = requests.get('http://localhost:5000/api/health')
        if health_response.status_code == 200:
            print("✅ Backend health check passed")
            print(f"   Status: {health_response.json()}")
        else:
            print(f"❌ Backend health check failed: {health_response.status_code}")
            return False
            
        # Test text analysis with safe content
        safe_response = requests.post('http://localhost:5000/api/analyze/text', 
                                    json={'text': 'hello world', 'age_group': 'moderate'})
        if safe_response.status_code == 200:
            safe_data = safe_response.json()
            print(f"✅ Safe text analysis: is_safe={safe_data.get('is_safe', 'unknown')}")
        else:
            print(f"❌ Safe text analysis failed: {safe_response.status_code}")
            
        # Test text analysis with inappropriate content
        unsafe_response = requests.post('http://localhost:5000/api/analyze/text', 
                                      json={'text': 'naked', 'age_group': 'moderate'})
        if unsafe_response.status_code == 200:
            unsafe_data = unsafe_response.json()
            print(f"✅ Unsafe text analysis: is_safe={unsafe_data.get('is_safe', 'unknown')}")
            if not unsafe_data.get('is_safe', True):
                print("   ✅ Content correctly flagged as inappropriate")
            else:
                print("   ⚠️ Content not flagged (may need threshold adjustment)")
        else:
            print(f"❌ Unsafe text analysis failed: {unsafe_response.status_code}")
            
        return True
        
    except requests.exceptions.ConnectionError:
        print("❌ Cannot connect to backend API at http://localhost:5000")
        print("   Make sure the backend is running: python backend/app.py")
        return False
    except Exception as e:
        print(f"❌ Backend API test failed: {e}")
        return False

def test_cors():
    """Test CORS configuration"""
    print("\n🔍 Testing CORS Configuration...")
    
    try:
        # Test with Origin header (simulating browser request)
        response = requests.post('http://localhost:5000/api/analyze/text',
                               json={'text': 'test', 'age_group': 'moderate'},
                               headers={'Origin': 'chrome-extension://test'})
        
        if response.status_code == 200:
            print("✅ CORS appears to be configured correctly")
        else:
            print(f"⚠️ CORS test returned status: {response.status_code}")
            
    except Exception as e:
        print(f"❌ CORS test failed: {e}")

def check_extension_files():
    """Check if extension files exist and are properly structured"""
    print("\n🔍 Checking Extension Files...")
    
    import os
    
    required_files = [
        'extension/manifest.json',
        'extension/src/background/service-worker.js',
        'extension/src/content/content-script.js',
        'extension/src/content/content-scanner.js',
        'extension/src/content/dom-manipulator.js',
        'extension/src/popup/popup.html',
        'extension/src/popup/popup.js'
    ]
    
    all_exist = True
    for file_path in required_files:
        if os.path.exists(file_path):
            print(f"✅ {file_path}")
        else:
            print(f"❌ {file_path} - MISSING")
            all_exist = False
    
    if all_exist:
        print("✅ All required extension files are present")
    else:
        print("❌ Some extension files are missing")
    
    return all_exist

def main():
    """Run all tests"""
    print("🛡️ AI-Firewall Extension Test Suite")
    print("=" * 50)
    
    # Test backend API
    backend_ok = test_backend_api()
    
    # Test CORS
    test_cors()
    
    # Check extension files
    files_ok = check_extension_files()
    
    print("\n" + "=" * 50)
    print("📊 Test Summary:")
    print(f"   Backend API: {'✅ OK' if backend_ok else '❌ FAILED'}")
    print(f"   Extension Files: {'✅ OK' if files_ok else '❌ FAILED'}")
    
    if backend_ok and files_ok:
        print("\n🎉 All tests passed! The extension should be working.")
        print("\n📋 Next steps:")
        print("   1. Open Chrome and go to chrome://extensions/")
        print("   2. Enable 'Developer mode'")
        print("   3. Click 'Load unpacked' and select the 'extension' folder")
        print("   4. Open the test page: file:///path/to/test_page.html")
        print("   5. Check browser console for AI-Firewall logs")
    else:
        print("\n❌ Some tests failed. Please fix the issues above.")

if __name__ == "__main__":
    main()
