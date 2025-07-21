"""
Test suite for AI content analyzers
"""

import pytest
import numpy as np
from PIL import Image
import io
import base64

from services.text_analyzer import TextAnalyzer
from services.image_analyzer import ImageAnalyzer
from services.content_moderator import ContentModerator

class TestTextAnalyzer:
    """Test cases for text analysis"""
    
    def setup_method(self):
        """Setup test fixtures"""
        self.analyzer = TextAnalyzer()
    
    def test_safe_text(self):
        """Test analysis of safe text"""
        safe_text = "This is a beautiful day. I love spending time with my family."
        result = self.analyzer.analyze(safe_text)
        
        assert result['is_safe'] == True
        assert result['confidence'] < 0.5
        assert len(result['flagged_categories']) == 0
    
    def test_toxic_text(self):
        """Test analysis of toxic text"""
        toxic_text = "You are such an idiot and I hate you so much!"
        result = self.analyzer.analyze(toxic_text, threshold=0.3)
        
        assert result['is_safe'] == False
        assert result['confidence'] > 0.3
        assert len(result['flagged_categories']) > 0
    
    def test_empty_text(self):
        """Test analysis of empty text"""
        result = self.analyzer.analyze("")
        
        assert result['is_safe'] == True
        assert 'reason' in result
    
    def test_age_group_thresholds(self):
        """Test different age group thresholds"""
        borderline_text = "This is somewhat annoying and stupid"
        
        # Mild filtering should be more permissive
        mild_result = self.analyzer.analyze(borderline_text, age_group='mild')
        
        # Strict filtering should be more restrictive
        strict_result = self.analyzer.analyze(borderline_text, age_group='strict')
        
        # Strict should be more likely to flag content
        assert mild_result['is_safe'] or not strict_result['is_safe']
    
    def test_batch_analysis(self):
        """Test batch text analysis"""
        texts = [
            "Hello world",
            "You are stupid",
            "Have a great day!"
        ]
        
        results = self.analyzer.analyze_batch(texts)
        
        assert len(results) == 3
        assert results[0]['is_safe'] == True
        assert results[2]['is_safe'] == True

class TestImageAnalyzer:
    """Test cases for image analysis"""
    
    def setup_method(self):
        """Setup test fixtures"""
        self.analyzer = ImageAnalyzer()
    
    def create_test_image(self, color=(255, 255, 255), size=(100, 100)):
        """Create a test image with specified color"""
        image = Image.new('RGB', size, color)
        return np.array(image)
    
    def test_white_image(self):
        """Test analysis of white image"""
        white_image = self.create_test_image((255, 255, 255))
        result = self.analyzer.analyze(self.image_to_base64(white_image))
        
        assert result['is_safe'] == True
        assert result['confidence'] < 0.5
    
    def test_red_image(self):
        """Test analysis of red image (potential violence indicator)"""
        red_image = self.create_test_image((255, 0, 0))
        result = self.analyzer.analyze(self.image_to_base64(red_image))
        
        # Red image might trigger violence detection
        assert 'violence' in result['categories']
    
    def test_skin_tone_image(self):
        """Test analysis of skin-tone image"""
        skin_image = self.create_test_image((220, 177, 145))  # Skin tone
        result = self.analyzer.analyze(self.image_to_base64(skin_image))
        
        # Should detect skin tones
        assert 'nsfw' in result['categories']
    
    def test_invalid_image_data(self):
        """Test handling of invalid image data"""
        result = self.analyzer.analyze("invalid_base64_data")
        
        assert 'error' in result
    
    def test_age_group_thresholds(self):
        """Test different age group thresholds for images"""
        test_image = self.create_test_image((200, 150, 120))  # Skin-like color
        image_data = self.image_to_base64(test_image)
        
        mild_result = self.analyzer.analyze(image_data, age_group='mild')
        strict_result = self.analyzer.analyze(image_data, age_group='strict')
        
        # Strict should be more restrictive
        assert mild_result['is_safe'] or not strict_result['is_safe']
    
    def image_to_base64(self, image_array):
        """Convert numpy array to base64 string"""
        image = Image.fromarray(image_array.astype('uint8'))
        buffer = io.BytesIO()
        image.save(buffer, format='JPEG')
        image_data = base64.b64encode(buffer.getvalue()).decode()
        return f"data:image/jpeg;base64,{image_data}"

class TestContentModerator:
    """Test cases for content moderation"""
    
    def setup_method(self):
        """Setup test fixtures"""
        self.moderator = ContentModerator()
    
    def test_moderator_availability(self):
        """Test if moderator is available"""
        # This will depend on whether OpenAI API key is configured
        is_ready = self.moderator.is_ready()
        assert isinstance(is_ready, bool)
    
    def test_safe_text_moderation(self):
        """Test moderation of safe text"""
        if not self.moderator.is_ready():
            pytest.skip("Content moderator not available")
        
        safe_text = "Hello, how are you today?"
        result = self.moderator.moderate_text(safe_text)
        
        if result:
            assert result['flagged'] == False
    
    def test_moderation_summary(self):
        """Test moderation summary generation"""
        mock_result = {
            'flagged': True,
            'categories': {
                'hate': True,
                'violence': False,
                'sexual': False
            },
            'category_scores': {
                'hate': 0.8,
                'violence': 0.1,
                'sexual': 0.05
            }
        }
        
        summary = self.moderator.get_moderation_summary(mock_result)
        
        assert summary['available'] == True
        assert summary['flagged'] == True
        assert summary['highest_risk_category'] == 'hate'
        assert summary['highest_risk_score'] == 0.8

class TestIntegration:
    """Integration tests for multiple analyzers"""
    
    def setup_method(self):
        """Setup test fixtures"""
        self.text_analyzer = TextAnalyzer()
        self.image_analyzer = ImageAnalyzer()
        self.moderator = ContentModerator()
    
    def test_combined_analysis(self):
        """Test combined text and image analysis"""
        # Test text
        text_result = self.text_analyzer.analyze("This is a test message")
        
        # Test image
        test_image = np.ones((100, 100, 3), dtype=np.uint8) * 128  # Gray image
        image_data = self.image_to_base64(test_image)
        image_result = self.image_analyzer.analyze(image_data)
        
        # Both should be safe
        assert text_result['is_safe'] == True
        assert image_result['is_safe'] == True
    
    def test_analyzer_readiness(self):
        """Test that all analyzers are ready"""
        assert self.text_analyzer.is_ready() == True
        assert self.image_analyzer.is_ready() == True
        # Moderator readiness depends on API key availability
        assert isinstance(self.moderator.is_ready(), bool)
    
    def image_to_base64(self, image_array):
        """Convert numpy array to base64 string"""
        image = Image.fromarray(image_array.astype('uint8'))
        buffer = io.BytesIO()
        image.save(buffer, format='JPEG')
        image_data = base64.b64encode(buffer.getvalue()).decode()
        return f"data:image/jpeg;base64,{image_data}"

if __name__ == "__main__":
    # Run tests
    pytest.main([__file__, "-v"])
