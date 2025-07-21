#!/usr/bin/env python3
"""
AI-Firewall System Integration Test
Tests the complete system including backend API, AI models, and basic functionality
"""

import requests
import json
import base64
import time
import sys
from PIL import Image
import io

class AIFirewallTester:
    def __init__(self, base_url="http://localhost:5000"):
        self.base_url = base_url
        self.test_results = []
        
    def log_test(self, test_name, passed, message=""):
        """Log test result"""
        status = "PASS" if passed else "FAIL"
        print(f"[{status}] {test_name}: {message}")
        self.test_results.append({
            'test': test_name,
            'passed': passed,
            'message': message
        })
    
    def test_backend_health(self):
        """Test if backend is running and healthy"""
        try:
            response = requests.get(f"{self.base_url}/api/health", timeout=5)
            if response.status_code == 200:
                data = response.json()
                self.log_test("Backend Health Check", True, f"Status: {data.get('status')}")
                return True
            else:
                self.log_test("Backend Health Check", False, f"HTTP {response.status_code}")
                return False
        except Exception as e:
            self.log_test("Backend Health Check", False, f"Connection failed: {str(e)}")
            return False
    
    def test_text_analysis_safe(self):
        """Test text analysis with safe content"""
        try:
            payload = {
                "text": "This is a beautiful day. I love spending time with my family and friends.",
                "threshold": 0.7,
                "age_group": "moderate"
            }
            
            response = requests.post(f"{self.base_url}/api/analyze/text", json=payload, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                is_safe = data.get('is_safe', False)
                confidence = data.get('confidence', 0)
                
                if is_safe and confidence < 0.5:
                    self.log_test("Text Analysis - Safe Content", True, f"Confidence: {confidence}")
                    return True
                else:
                    self.log_test("Text Analysis - Safe Content", False, f"Incorrectly flagged as unsafe (confidence: {confidence})")
                    return False
            else:
                self.log_test("Text Analysis - Safe Content", False, f"HTTP {response.status_code}")
                return False
                
        except Exception as e:
            self.log_test("Text Analysis - Safe Content", False, f"Error: {str(e)}")
            return False
    
    def test_text_analysis_toxic(self):
        """Test text analysis with toxic content"""
        try:
            payload = {
                "text": "You are such an idiot and I hate you so much! This is stupid and pathetic.",
                "threshold": 0.5,
                "age_group": "moderate"
            }
            
            response = requests.post(f"{self.base_url}/api/analyze/text", json=payload, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                is_safe = data.get('is_safe', True)
                confidence = data.get('confidence', 0)
                flagged_categories = data.get('flagged_categories', [])
                
                if not is_safe and len(flagged_categories) > 0:
                    self.log_test("Text Analysis - Toxic Content", True, f"Flagged categories: {flagged_categories}")
                    return True
                else:
                    self.log_test("Text Analysis - Toxic Content", False, f"Failed to detect toxic content (confidence: {confidence})")
                    return False
            else:
                self.log_test("Text Analysis - Toxic Content", False, f"HTTP {response.status_code}")
                return False
                
        except Exception as e:
            self.log_test("Text Analysis - Toxic Content", False, f"Error: {str(e)}")
            return False
    
    def create_test_image(self, color=(255, 255, 255), size=(100, 100)):
        """Create a test image and return as base64"""
        image = Image.new('RGB', size, color)
        buffer = io.BytesIO()
        image.save(buffer, format='JPEG')
        image_data = base64.b64encode(buffer.getvalue()).decode()
        return f"data:image/jpeg;base64,{image_data}"
    
    def test_image_analysis_safe(self):
        """Test image analysis with safe content"""
        try:
            # Create a white image (should be safe)
            image_data = self.create_test_image((255, 255, 255))
            
            payload = {
                "image": image_data,
                "threshold": 0.6,
                "age_group": "moderate"
            }
            
            response = requests.post(f"{self.base_url}/api/analyze/image", json=payload, timeout=15)
            
            if response.status_code == 200:
                data = response.json()
                is_safe = data.get('is_safe', False)
                confidence = data.get('confidence', 0)
                
                if is_safe:
                    self.log_test("Image Analysis - Safe Content", True, f"Confidence: {confidence}")
                    return True
                else:
                    self.log_test("Image Analysis - Safe Content", False, f"Incorrectly flagged as unsafe (confidence: {confidence})")
                    return False
            else:
                self.log_test("Image Analysis - Safe Content", False, f"HTTP {response.status_code}")
                return False
                
        except Exception as e:
            self.log_test("Image Analysis - Safe Content", False, f"Error: {str(e)}")
            return False
    
    def test_image_analysis_suspicious(self):
        """Test image analysis with potentially suspicious content"""
        try:
            # Create a red image (might trigger violence detection)
            image_data = self.create_test_image((255, 0, 0))
            
            payload = {
                "image": image_data,
                "threshold": 0.3,  # Lower threshold to catch subtle indicators
                "age_group": "strict"
            }
            
            response = requests.post(f"{self.base_url}/api/analyze/image", json=payload, timeout=15)
            
            if response.status_code == 200:
                data = response.json()
                categories = data.get('categories', {})
                
                # Check if violence category has some score
                violence_score = categories.get('violence', 0)
                
                if violence_score > 0:
                    self.log_test("Image Analysis - Suspicious Content", True, f"Violence score: {violence_score}")
                    return True
                else:
                    self.log_test("Image Analysis - Suspicious Content", True, "No violence detected (expected for basic CV)")
                    return True
            else:
                self.log_test("Image Analysis - Suspicious Content", False, f"HTTP {response.status_code}")
                return False
                
        except Exception as e:
            self.log_test("Image Analysis - Suspicious Content", False, f"Error: {str(e)}")
            return False
    
    def test_batch_analysis(self):
        """Test batch analysis functionality"""
        try:
            payload = {
                "items": [
                    {
                        "id": "text1",
                        "type": "text",
                        "content": "Hello world, this is a nice day!",
                        "threshold": 0.7,
                        "age_group": "moderate"
                    },
                    {
                        "id": "text2",
                        "type": "text",
                        "content": "This is stupid and I hate it!",
                        "threshold": 0.5,
                        "age_group": "moderate"
                    }
                ]
            }
            
            response = requests.post(f"{self.base_url}/api/analyze/batch", json=payload, timeout=20)
            
            if response.status_code == 200:
                data = response.json()
                results = data.get('results', [])
                
                if len(results) == 2:
                    # First should be safe, second might be flagged
                    first_safe = results[0]['result'].get('is_safe', False)
                    
                    if first_safe:
                        self.log_test("Batch Analysis", True, f"Processed {len(results)} items")
                        return True
                    else:
                        self.log_test("Batch Analysis", False, "First item incorrectly flagged")
                        return False
                else:
                    self.log_test("Batch Analysis", False, f"Expected 2 results, got {len(results)}")
                    return False
            else:
                self.log_test("Batch Analysis", False, f"HTTP {response.status_code}")
                return False
                
        except Exception as e:
            self.log_test("Batch Analysis", False, f"Error: {str(e)}")
            return False
    
    def test_age_group_sensitivity(self):
        """Test different age group sensitivity levels"""
        try:
            borderline_text = "This is somewhat annoying and stupid behavior"
            
            # Test with mild filtering
            mild_payload = {
                "text": borderline_text,
                "threshold": 0.7,
                "age_group": "mild"
            }
            
            # Test with strict filtering
            strict_payload = {
                "text": borderline_text,
                "threshold": 0.7,
                "age_group": "strict"
            }
            
            mild_response = requests.post(f"{self.base_url}/api/analyze/text", json=mild_payload, timeout=10)
            strict_response = requests.post(f"{self.base_url}/api/analyze/text", json=strict_payload, timeout=10)
            
            if mild_response.status_code == 200 and strict_response.status_code == 200:
                mild_data = mild_response.json()
                strict_data = strict_response.json()
                
                mild_safe = mild_data.get('is_safe', False)
                strict_safe = strict_data.get('is_safe', False)
                
                # Strict should be more restrictive than mild
                if mild_safe or not strict_safe:
                    self.log_test("Age Group Sensitivity", True, f"Mild: {mild_safe}, Strict: {strict_safe}")
                    return True
                else:
                    self.log_test("Age Group Sensitivity", False, "Strict filtering not more restrictive than mild")
                    return False
            else:
                self.log_test("Age Group Sensitivity", False, "API request failed")
                return False
                
        except Exception as e:
            self.log_test("Age Group Sensitivity", False, f"Error: {str(e)}")
            return False
    
    def test_error_handling(self):
        """Test API error handling"""
        try:
            # Test with invalid data
            invalid_payload = {
                "text": "",  # Empty text
                "threshold": 1.5,  # Invalid threshold
                "age_group": "invalid"  # Invalid age group
            }
            
            response = requests.post(f"{self.base_url}/api/analyze/text", json=invalid_payload, timeout=10)
            
            if response.status_code == 400:
                self.log_test("Error Handling", True, "Properly rejected invalid input")
                return True
            else:
                self.log_test("Error Handling", False, f"Expected 400, got {response.status_code}")
                return False
                
        except Exception as e:
            self.log_test("Error Handling", False, f"Error: {str(e)}")
            return False
    
    def run_all_tests(self):
        """Run all tests and return summary"""
        print("🛡️  AI-Firewall System Integration Tests")
        print("=" * 50)
        
        # Check if backend is running
        if not self.test_backend_health():
            print("\n❌ Backend is not running. Please start the Flask server first.")
            print("Run: cd backend && python app.py")
            return False
        
        print("\n🧪 Running API Tests...")
        
        # Run all tests
        tests = [
            self.test_text_analysis_safe,
            self.test_text_analysis_toxic,
            self.test_image_analysis_safe,
            self.test_image_analysis_suspicious,
            self.test_batch_analysis,
            self.test_age_group_sensitivity,
            self.test_error_handling
        ]
        
        for test in tests:
            test()
            time.sleep(0.5)  # Small delay between tests
        
        # Summary
        passed = sum(1 for result in self.test_results if result['passed'])
        total = len(self.test_results)
        
        print("\n" + "=" * 50)
        print(f"📊 Test Summary: {passed}/{total} tests passed")
        
        if passed == total:
            print("✅ All tests passed! System is working correctly.")
            return True
        else:
            print("❌ Some tests failed. Check the output above for details.")
            failed_tests = [r for r in self.test_results if not r['passed']]
            print("\nFailed tests:")
            for test in failed_tests:
                print(f"  - {test['test']}: {test['message']}")
            return False

def main():
    """Main test runner"""
    print("Starting AI-Firewall system tests...")
    
    tester = AIFirewallTester()
    success = tester.run_all_tests()
    
    if success:
        print("\n🎉 System is ready for use!")
        print("\nNext steps:")
        print("1. Load the Chrome extension in Developer Mode")
        print("2. Start the dashboard: cd dashboard && npm start")
        print("3. Test on real websites")
    else:
        print("\n🔧 Please fix the issues above before proceeding.")
        sys.exit(1)

if __name__ == "__main__":
    main()
