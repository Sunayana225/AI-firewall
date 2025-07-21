"""
Text Analysis Service
Uses Hugging Face transformers for toxicity detection
"""

import os
import logging
from typing import Dict, List, Optional
from transformers import pipeline, AutoTokenizer, AutoModelForSequenceClassification
import torch

logger = logging.getLogger(__name__)

class TextAnalyzer:
    """AI-powered text content analyzer for detecting inappropriate content"""
    
    def __init__(self):
        self.model_name = "unitary/toxic-bert"
        self.classifier = None
        self.tokenizer = None
        self.model = None
        self._ready = False
        self.toxic_keywords = {}  # Initialize this first

        # Content categories and their severity levels
        self.categories = {
            'toxic': {'mild': 0.5, 'moderate': 0.3, 'strict': 0.1},
            'severe_toxic': {'mild': 0.7, 'moderate': 0.5, 'strict': 0.3},
            'obscene': {'mild': 0.3, 'moderate': 0.2, 'strict': 0.1},
            'threat': {'mild': 0.7, 'moderate': 0.5, 'strict': 0.3},
            'insult': {'mild': 0.5, 'moderate': 0.3, 'strict': 0.1},
            'identity_hate': {'mild': 0.7, 'moderate': 0.5, 'strict': 0.3}
        }

        # Load keyword filters first
        self._load_keyword_filters()

        self._initialize_model()
    
    def _initialize_model(self):
        """Initialize the toxicity detection model"""
        try:
            logger.info("Loading text toxicity model...")

            # Try to load the model with error handling
            try:
                # Load tokenizer and model
                self.tokenizer = AutoTokenizer.from_pretrained(self.model_name)
                self.model = AutoModelForSequenceClassification.from_pretrained(self.model_name)

                # Create pipeline
                self.classifier = pipeline(
                    "text-classification",
                    model=self.model,
                    tokenizer=self.tokenizer,
                    device=0 if torch.cuda.is_available() else -1,
                    top_k=None  # Return all scores
                )

                logger.info("Text analyzer initialized successfully with Hugging Face model")

            except Exception as model_error:
                logger.warning(f"Failed to load Hugging Face model: {model_error}")
                logger.info("Falling back to simple keyword-based detection")

                # Fallback to simple keyword-based detection
                self.classifier = None
                self._load_keyword_filters()

            self._ready = True

        except Exception as e:
            logger.error(f"Failed to initialize text analyzer: {str(e)}")
            self._ready = False

    def _load_keyword_filters(self):
        """Load keyword-based filters as fallback"""
        self.toxic_keywords = {
            'toxic': [
                'hate', 'stupid', 'idiot', 'moron', 'dumb', 'loser', 'pathetic',
                'worthless', 'disgusting', 'awful', 'terrible', 'horrible'
            ],
            'severe_toxic': [
                'kill yourself', 'die', 'murder', 'suicide', 'harm yourself'
            ],
            'obscene': [
                'damn', 'hell', 'crap', 'shit', 'fuck', 'bitch', 'ass',
                'naked', 'nude', 'sex', 'porn', 'xxx', 'adult', 'explicit',
                'sexual', 'erotic', 'intimate', 'seductive', 'provocative'
            ],
            'threat': [
                'kill you', 'hurt you', 'destroy you', 'beat you up', 'violence',
                'killing', 'murder', 'death', 'dead', 'shoot', 'gun', 'weapon',
                'blood', 'gore', 'torture', 'abuse', 'attack', 'fight', 'war'
            ],
            'insult': [
                'ugly', 'fat', 'skinny', 'short', 'tall', 'weird', 'freak'
            ],
            'identity_hate': [
                'racist', 'sexist', 'homophobic', 'transphobic', 'bigot'
            ]
        }
    
    def is_ready(self) -> bool:
        """Check if the analyzer is ready to use"""
        return self._ready
    
    def analyze(self, text: str, threshold: float = 0.7, age_group: str = 'moderate') -> Dict:
        """
        Analyze text content for toxicity

        Args:
            text: Text content to analyze
            threshold: Custom threshold (overrides age_group default)
            age_group: Age group setting (mild/moderate/strict)

        Returns:
            Dictionary with analysis results
        """
        if not self._ready:
            return {
                'is_safe': True,
                'confidence': 0.0,
                'categories': {},
                'error': 'Text analyzer not ready'
            }

        try:
            # Preprocess text
            processed_text = self._preprocess_text(text)

            if not processed_text.strip():
                return {
                    'is_safe': True,
                    'confidence': 1.0,
                    'categories': {},
                    'reason': 'Empty text'
                }

            # Analyze with the model or fallback
            if self.classifier is not None:
                # Use Hugging Face model (AI-based)
                try:
                    results = self.classifier(processed_text)
                    logger.debug(f"HF model results: {results}")
                    analysis_result = self._process_results(results, threshold, age_group)
                    analysis_result['model'] = 'huggingface-toxic-bert'
                    logger.info(f"Using AI model analysis: {analysis_result['is_safe']}")
                except Exception as hf_error:
                    logger.warning(f"Hugging Face model failed: {hf_error}, falling back to keywords")
                    analysis_result = self._keyword_based_analysis(processed_text, threshold, age_group)
                    analysis_result['model'] = 'keyword_based'
                    analysis_result['fallback_reason'] = 'AI model failed'
            else:
                # Use keyword-based analysis as last resort
                logger.info("AI models not available, using keyword-based analysis")
                analysis_result = self._keyword_based_analysis(processed_text, threshold, age_group)
                analysis_result['model'] = 'keyword_based'
                analysis_result['fallback_reason'] = 'AI models not loaded'

            logger.debug(f"Text analysis completed: {analysis_result['is_safe']}")
            return analysis_result

        except Exception as e:
            logger.error(f"Error analyzing text: {str(e)}")
            return {
                'is_safe': True,  # Fail safe
                'confidence': 0.0,
                'categories': {},
                'error': str(e)
            }
    
    def _preprocess_text(self, text: str) -> str:
        """Preprocess text for analysis"""
        # Remove excessive whitespace
        text = ' '.join(text.split())
        
        # Truncate if too long (BERT has token limits)
        if len(text) > 512:
            text = text[:512]
        
        return text
    
    def _process_results(self, results, threshold: float, age_group: str) -> Dict:
        """Process model results and apply age-appropriate thresholds"""
        categories = {}
        max_score = 0.0
        flagged_categories = []

        # Process Hugging Face model results
        if isinstance(results, list) and len(results) > 0:
            # Handle return_all_scores=True format
            for result in results:
                label = result['label'].lower()
                score = result['score']

                categories[label] = score

                # Check against age-appropriate threshold
                category_threshold = self.categories.get(label, {}).get(age_group, threshold)

                if score > category_threshold:
                    flagged_categories.append(label)
                    max_score = max(max_score, score)

        is_safe = len(flagged_categories) == 0

        return {
            'is_safe': is_safe,
            'confidence': max_score,
            'categories': categories,
            'flagged_categories': flagged_categories,
            'threshold_used': threshold,
            'age_group': age_group,
            'model': self.model_name if self.classifier else 'keyword_based'
        }

    def _keyword_based_analysis(self, text: str, threshold: float, age_group: str) -> Dict:
        """Fallback keyword-based content analysis"""
        categories = {}
        flagged_categories = []
        max_score = 0.0

        text_lower = text.lower()

        import re

        for category, keywords in self.toxic_keywords.items():
            score = 0.0
            matches = 0

            for keyword in keywords:
                # Use word boundary matching to avoid false positives
                if ' ' in keyword:
                    # For multi-word phrases, use exact matching
                    if keyword in text_lower:
                        matches += 1
                        score += 0.5 + (0.2 * text_lower.count(keyword))
                else:
                    # For single words, use word boundary matching
                    pattern = r'\b' + re.escape(keyword) + r'\b'
                    if re.search(pattern, text_lower):
                        matches += 1
                        score += 0.5 + (0.2 * len(re.findall(pattern, text_lower)))

            # Normalize score but make it more sensitive
            if matches > 0:
                score = min(1.0, score)

            categories[category] = score

            # Check against threshold
            category_threshold = self.categories.get(category, {}).get(age_group, threshold)

            if score > category_threshold:
                flagged_categories.append(category)
                max_score = max(max_score, score)

        is_safe = len(flagged_categories) == 0

        return {
            'is_safe': is_safe,
            'confidence': max_score,
            'categories': categories,
            'flagged_categories': flagged_categories,
            'threshold_used': threshold,
            'age_group': age_group,
            'model': 'keyword_based'
        }
    
    def analyze_batch(self, texts: List[str], threshold: float = 0.7, age_group: str = 'moderate') -> List[Dict]:
        """Analyze multiple texts in batch"""
        results = []
        for text in texts:
            result = self.analyze(text, threshold, age_group)
            results.append(result)
        return results
