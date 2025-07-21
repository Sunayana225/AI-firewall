"""
Content Moderation Service
Enhanced content filtering using Google Gemini API
"""

import os
import logging
from typing import Dict, Optional
import requests
import json

logger = logging.getLogger(__name__)

class ContentModerator:
    """Enhanced content moderation using Google Gemini API"""

    def __init__(self):
        self.api_key = None
        self._ready = False
        self.base_url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro-latest:generateContent"

        # Initialize Gemini client if API key is available
        api_key = os.getenv('GEMINI_API_KEY')
        if api_key:
            try:
                self.api_key = api_key
                self._ready = True
                logger.info("Gemini content moderator initialized")
            except Exception as e:
                logger.warning(f"Failed to initialize Gemini moderator: {str(e)}")
        else:
            logger.info("Gemini API key not found, content moderator disabled")
    
    def is_ready(self) -> bool:
        """Check if the moderator is ready to use"""
        return self._ready
    
    def moderate_text(self, text: str) -> Optional[Dict]:
        """
        Moderate text content using Gemini API

        Args:
            text: Text content to moderate

        Returns:
            Moderation result or None if service unavailable
        """
        if not self._ready:
            return None

        try:
            # Create moderation prompt for Gemini
            prompt = self._create_moderation_prompt(text)

            # Make API request to Gemini
            headers = {
                'Content-Type': 'application/json',
            }

            payload = {
                "contents": [{
                    "parts": [{
                        "text": prompt
                    }]
                }],
                "generationConfig": {
                    "temperature": 0.1,
                    "maxOutputTokens": 1000
                }
            }

            url = f"{self.base_url}?key={self.api_key}"
            response = requests.post(url, headers=headers, json=payload, timeout=10)

            if response.status_code == 200:
                result = response.json()
                return self._parse_gemini_response(result, text)
            else:
                logger.error(f"Gemini API error: {response.status_code}")
                return None

        except Exception as e:
            logger.error(f"Error in Gemini moderation: {str(e)}")
            return None

    def _create_moderation_prompt(self, text: str) -> str:
        """Create a moderation prompt for Gemini"""
        return f"""
Analyze the following text for inappropriate content and provide a JSON response with the following structure:

{{
    "flagged": true/false,
    "categories": {{
        "hate": true/false,
        "harassment": true/false,
        "violence": true/false,
        "sexual": true/false,
        "self_harm": true/false,
        "toxic": true/false
    }},
    "category_scores": {{
        "hate": 0.0-1.0,
        "harassment": 0.0-1.0,
        "violence": 0.0-1.0,
        "sexual": 0.0-1.0,
        "self_harm": 0.0-1.0,
        "toxic": 0.0-1.0
    }},
    "explanation": "Brief explanation of why content was flagged"
}}

Text to analyze: "{text}"

Respond only with the JSON object, no additional text.
"""

    def _parse_gemini_response(self, response: Dict, original_text: str) -> Dict:
        """Parse Gemini API response"""
        try:
            # Extract the generated text
            candidates = response.get('candidates', [])
            if not candidates:
                return self._create_safe_response()

            content = candidates[0].get('content', {})
            parts = content.get('parts', [])
            if not parts:
                return self._create_safe_response()

            generated_text = parts[0].get('text', '')

            # Try to parse as JSON
            try:
                result = json.loads(generated_text.strip())

                # Validate the response structure
                if self._validate_response(result):
                    result['model'] = 'gemini-pro'
                    return result
                else:
                    logger.warning("Invalid Gemini response structure")
                    return self._create_safe_response()

            except json.JSONDecodeError:
                logger.warning("Failed to parse Gemini response as JSON")
                return self._create_safe_response()

        except Exception as e:
            logger.error(f"Error parsing Gemini response: {str(e)}")
            return self._create_safe_response()

    def _validate_response(self, result: Dict) -> bool:
        """Validate the structure of Gemini response"""
        required_keys = ['flagged', 'categories', 'category_scores']
        return all(key in result for key in required_keys)

    def _create_safe_response(self) -> Dict:
        """Create a safe default response"""
        return {
            'flagged': False,
            'categories': {
                'hate': False,
                'harassment': False,
                'violence': False,
                'sexual': False,
                'self_harm': False,
                'toxic': False
            },
            'category_scores': {
                'hate': 0.0,
                'harassment': 0.0,
                'violence': 0.0,
                'sexual': 0.0,
                'self_harm': 0.0,
                'toxic': 0.0
            },
            'explanation': 'Content appears safe',
            'model': 'gemini-pro'
        }
    
    def get_moderation_summary(self, moderation_result: Dict) -> Dict:
        """
        Get a summary of moderation results
        
        Args:
            moderation_result: Result from moderate_text()
        
        Returns:
            Summary with key insights
        """
        if not moderation_result:
            return {'available': False}
        
        flagged_categories = []
        highest_score = 0.0
        highest_category = None
        
        for category, flagged in moderation_result['categories'].items():
            if flagged:
                flagged_categories.append(category)
                score = moderation_result['category_scores'][category]
                if score > highest_score:
                    highest_score = score
                    highest_category = category
        
        return {
            'available': True,
            'flagged': moderation_result['flagged'],
            'flagged_categories': flagged_categories,
            'highest_risk_category': highest_category,
            'highest_risk_score': highest_score,
            'total_categories_flagged': len(flagged_categories)
        }
