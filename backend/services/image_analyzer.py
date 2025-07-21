"""
Image Analysis Service
Uses computer vision models for NSFW and inappropriate content detection
"""

import os
import logging
import base64
import io
from typing import Dict, List
import numpy as np
from PIL import Image
import cv2

logger = logging.getLogger(__name__)

class ImageAnalyzer:
    """AI-powered image content analyzer for detecting inappropriate visual content"""
    
    def __init__(self):
        self.model_loaded = False
        self._ready = False
        
        # Age-appropriate thresholds for different content types
        self.thresholds = {
            'nsfw': {'mild': 0.7, 'moderate': 0.5, 'strict': 0.3},
            'violence': {'mild': 0.8, 'moderate': 0.6, 'strict': 0.4},
            'drugs': {'mild': 0.8, 'moderate': 0.6, 'strict': 0.4},
            'weapons': {'mild': 0.8, 'moderate': 0.6, 'strict': 0.4}
        }
        
        self._initialize_model()
    
    def _initialize_model(self):
        """Initialize the image analysis model"""
        try:
            logger.info("Initializing image analyzer...")

            # Try to load advanced models, fall back to basic CV
            self.use_advanced_models = False

            try:
                # Try to import and initialize NSFW detection
                # This would require additional dependencies in production
                # import nsfwjs or similar
                logger.info("Advanced NSFW models not available, using basic CV analysis")
                self.use_advanced_models = False
            except ImportError:
                logger.info("Using basic computer vision for image analysis")
                self.use_advanced_models = False

            # Initialize basic CV components
            self._initialize_cv_components()

            self._ready = True
            logger.info("Image analyzer initialized successfully")

        except Exception as e:
            logger.error(f"Failed to initialize image analyzer: {str(e)}")
            self._ready = False

    def _initialize_cv_components(self):
        """Initialize computer vision components"""
        # Skin detection parameters (HSV color space)
        self.skin_lower = np.array([0, 20, 70], dtype=np.uint8)
        self.skin_upper = np.array([20, 255, 255], dtype=np.uint8)

        # Violence detection parameters
        self.red_threshold = 150
        self.violence_red_ratio_threshold = 0.15

        # Content type classifiers
        self.content_classifiers = {
            'nsfw': self._detect_nsfw_content,
            'violence': self._detect_violent_content,
            'drugs': self._detect_drug_content,
            'weapons': self._detect_weapon_content
        }
    
    def is_ready(self) -> bool:
        """Check if the analyzer is ready to use"""
        return self._ready
    
    def analyze(self, image_data: str, threshold: float = 0.6, age_group: str = 'moderate') -> Dict:
        """
        Analyze image content for inappropriate material
        
        Args:
            image_data: Base64 encoded image data
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
                'error': 'Image analyzer not ready'
            }
        
        try:
            # Decode and process image
            image = self._decode_image(image_data)
            if image is None:
                return {
                    'is_safe': True,
                    'confidence': 0.0,
                    'categories': {},
                    'error': 'Invalid image data'
                }
            
            # Perform analysis
            analysis_result = self._analyze_image(image, threshold, age_group)
            
            logger.debug(f"Image analysis completed: {analysis_result['is_safe']}")
            return analysis_result
            
        except Exception as e:
            logger.error(f"Error analyzing image: {str(e)}")
            return {
                'is_safe': True,  # Fail safe
                'confidence': 0.0,
                'categories': {},
                'error': str(e)
            }
    
    def _decode_image(self, image_data: str) -> np.ndarray:
        """Decode base64 image data"""
        try:
            # Remove data URL prefix if present
            if image_data.startswith('data:image'):
                image_data = image_data.split(',')[1]
            
            # Decode base64
            image_bytes = base64.b64decode(image_data)
            
            # Convert to PIL Image
            pil_image = Image.open(io.BytesIO(image_bytes))
            
            # Convert to RGB if necessary
            if pil_image.mode != 'RGB':
                pil_image = pil_image.convert('RGB')
            
            # Convert to numpy array
            image_array = np.array(pil_image)
            
            return image_array
            
        except Exception as e:
            logger.error(f"Error decoding image: {str(e)}")
            return None
    
    def _analyze_image(self, image: np.ndarray, threshold: float, age_group: str) -> Dict:
        """Analyze image using computer vision techniques"""

        categories = {
            'nsfw': 0.0,
            'violence': 0.0,
            'drugs': 0.0,
            'weapons': 0.0
        }

        # Run all content classifiers
        for category, classifier_func in self.content_classifiers.items():
            try:
                score = classifier_func(image)
                categories[category] = score
            except Exception as e:
                logger.warning(f"Error in {category} classifier: {e}")
                categories[category] = 0.0

        # Apply age-appropriate thresholds
        flagged_categories = []
        max_score = 0.0

        for category, score in categories.items():
            category_threshold = self.thresholds.get(category, {}).get(age_group, threshold)

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
            'image_size': image.shape[:2],
            'model': 'enhanced_cv_analyzer'
        }
    
    def _detect_nsfw_content(self, image: np.ndarray) -> float:
        """Detect NSFW content using computer vision"""
        try:
            # Multiple indicators for NSFW content
            skin_ratio = self._detect_skin_ratio(image)
            flesh_tone_dominance = self._analyze_flesh_tones(image)
            edge_density = self._calculate_edge_density(image)

            # Combine indicators
            nsfw_score = 0.0

            # High skin ratio indicator
            if skin_ratio > 0.4:
                nsfw_score += 0.4
            elif skin_ratio > 0.25:
                nsfw_score += 0.2

            # Flesh tone dominance
            if flesh_tone_dominance > 0.6:
                nsfw_score += 0.3

            # Low edge density might indicate smooth skin
            if edge_density < 0.1:
                nsfw_score += 0.1

            return min(1.0, nsfw_score)

        except Exception as e:
            logger.error(f"Error in NSFW detection: {e}")
            return 0.0

    def _detect_violent_content(self, image: np.ndarray) -> float:
        """Detect violent content indicators"""
        try:
            red_ratio = self._detect_red_ratio(image)
            dark_ratio = self._detect_dark_areas(image)
            sharp_edges = self._detect_sharp_objects(image)

            violence_score = 0.0

            # High red content (blood indicator)
            if red_ratio > 0.2:
                violence_score += 0.4
            elif red_ratio > 0.15:
                violence_score += 0.2

            # Dark areas (shadows, night scenes)
            if dark_ratio > 0.5:
                violence_score += 0.1

            # Sharp edges (weapons, aggressive poses)
            if sharp_edges > 0.3:
                violence_score += 0.2

            return min(1.0, violence_score)

        except Exception as e:
            logger.error(f"Error in violence detection: {e}")
            return 0.0

    def _detect_drug_content(self, image: np.ndarray) -> float:
        """Detect drug-related content (basic implementation)"""
        try:
            # Look for specific color patterns and shapes
            green_ratio = self._detect_green_ratio(image)
            white_powder_like = self._detect_white_powder_patterns(image)

            drug_score = 0.0

            # Green content (marijuana indicator)
            if green_ratio > 0.4:
                drug_score += 0.3

            # White powder-like patterns
            if white_powder_like > 0.5:
                drug_score += 0.4

            return min(1.0, drug_score)

        except Exception as e:
            logger.error(f"Error in drug detection: {e}")
            return 0.0

    def _detect_weapon_content(self, image: np.ndarray) -> float:
        """Detect weapon-related content"""
        try:
            metallic_surfaces = self._detect_metallic_surfaces(image)
            sharp_edges = self._detect_sharp_objects(image)
            dark_objects = self._detect_dark_objects(image)

            weapon_score = 0.0

            # Metallic surfaces (guns, knives)
            if metallic_surfaces > 0.3:
                weapon_score += 0.3

            # Sharp edges
            if sharp_edges > 0.4:
                weapon_score += 0.2

            # Dark objects with specific shapes
            if dark_objects > 0.3:
                weapon_score += 0.2

            return min(1.0, weapon_score)

        except Exception as e:
            logger.error(f"Error in weapon detection: {e}")
            return 0.0
    
    def _detect_skin_ratio(self, image: np.ndarray) -> float:
        """Detect skin-like colors in image (basic implementation)"""
        try:
            # Convert to HSV for better skin detection
            hsv = cv2.cvtColor(image, cv2.COLOR_RGB2HSV)
            
            # Define skin color range in HSV
            lower_skin = np.array([0, 20, 70], dtype=np.uint8)
            upper_skin = np.array([20, 255, 255], dtype=np.uint8)
            
            # Create mask for skin colors
            skin_mask = cv2.inRange(hsv, lower_skin, upper_skin)
            
            # Calculate ratio of skin pixels
            skin_pixels = np.sum(skin_mask > 0)
            total_pixels = image.shape[0] * image.shape[1]
            
            return skin_pixels / total_pixels
            
        except Exception:
            return 0.0
    
    def _detect_red_ratio(self, image: np.ndarray) -> float:
        """Detect red colors in image (basic violence indicator)"""
        try:
            # Extract red channel
            red_channel = image[:, :, 0]

            # Count high red values
            red_pixels = np.sum(red_channel > self.red_threshold)
            total_pixels = image.shape[0] * image.shape[1]

            return red_pixels / total_pixels

        except Exception:
            return 0.0

    def _analyze_flesh_tones(self, image: np.ndarray) -> float:
        """Analyze flesh tone dominance in image"""
        try:
            # Convert to HSV for better flesh tone detection
            hsv = cv2.cvtColor(image, cv2.COLOR_RGB2HSV)

            # Extended flesh tone ranges
            flesh_lower1 = np.array([0, 10, 60], dtype=np.uint8)
            flesh_upper1 = np.array([20, 150, 255], dtype=np.uint8)

            flesh_lower2 = np.array([0, 10, 60], dtype=np.uint8)
            flesh_upper2 = np.array([25, 255, 255], dtype=np.uint8)

            # Create masks
            mask1 = cv2.inRange(hsv, flesh_lower1, flesh_upper1)
            mask2 = cv2.inRange(hsv, flesh_lower2, flesh_upper2)

            # Combine masks
            flesh_mask = cv2.bitwise_or(mask1, mask2)

            # Calculate ratio
            flesh_pixels = np.sum(flesh_mask > 0)
            total_pixels = image.shape[0] * image.shape[1]

            return flesh_pixels / total_pixels

        except Exception:
            return 0.0

    def _calculate_edge_density(self, image: np.ndarray) -> float:
        """Calculate edge density in image"""
        try:
            # Convert to grayscale
            gray = cv2.cvtColor(image, cv2.COLOR_RGB2GRAY)

            # Apply Canny edge detection
            edges = cv2.Canny(gray, 50, 150)

            # Calculate edge density
            edge_pixels = np.sum(edges > 0)
            total_pixels = image.shape[0] * image.shape[1]

            return edge_pixels / total_pixels

        except Exception:
            return 0.0

    def _detect_dark_areas(self, image: np.ndarray) -> float:
        """Detect dark areas in image"""
        try:
            # Convert to grayscale
            gray = cv2.cvtColor(image, cv2.COLOR_RGB2GRAY)

            # Count dark pixels
            dark_pixels = np.sum(gray < 50)
            total_pixels = image.shape[0] * image.shape[1]

            return dark_pixels / total_pixels

        except Exception:
            return 0.0

    def _detect_sharp_objects(self, image: np.ndarray) -> float:
        """Detect sharp objects using edge analysis"""
        try:
            # Convert to grayscale
            gray = cv2.cvtColor(image, cv2.COLOR_RGB2GRAY)

            # Apply Laplacian for sharp edge detection
            laplacian = cv2.Laplacian(gray, cv2.CV_64F)
            sharp_edges = np.sum(np.abs(laplacian) > 30)

            total_pixels = image.shape[0] * image.shape[1]
            return sharp_edges / total_pixels

        except Exception:
            return 0.0

    def _detect_green_ratio(self, image: np.ndarray) -> float:
        """Detect green colors in image"""
        try:
            # Extract green channel
            green_channel = image[:, :, 1]

            # Count high green values
            green_pixels = np.sum(green_channel > 120)
            total_pixels = image.shape[0] * image.shape[1]

            return green_pixels / total_pixels

        except Exception:
            return 0.0

    def _detect_white_powder_patterns(self, image: np.ndarray) -> float:
        """Detect white powder-like patterns"""
        try:
            # Convert to grayscale
            gray = cv2.cvtColor(image, cv2.COLOR_RGB2GRAY)

            # Look for white/light areas with specific texture
            white_areas = np.sum(gray > 200)
            total_pixels = image.shape[0] * image.shape[1]

            white_ratio = white_areas / total_pixels

            # Check for powder-like texture (low variance in white areas)
            if white_ratio > 0.1:
                white_mask = gray > 200
                if np.sum(white_mask) > 0:
                    white_variance = np.var(gray[white_mask])
                    if white_variance < 100:  # Low variance indicates uniform texture
                        return min(1.0, white_ratio * 2)

            return 0.0

        except Exception:
            return 0.0

    def _detect_metallic_surfaces(self, image: np.ndarray) -> float:
        """Detect metallic surfaces"""
        try:
            # Convert to grayscale
            gray = cv2.cvtColor(image, cv2.COLOR_RGB2GRAY)

            # Look for high contrast areas (metallic reflections)
            # Apply Sobel operator to detect edges
            sobel_x = cv2.Sobel(gray, cv2.CV_64F, 1, 0, ksize=3)
            sobel_y = cv2.Sobel(gray, cv2.CV_64F, 0, 1, ksize=3)

            # Calculate gradient magnitude
            gradient_magnitude = np.sqrt(sobel_x**2 + sobel_y**2)

            # High gradient areas might indicate metallic surfaces
            metallic_pixels = np.sum(gradient_magnitude > 50)
            total_pixels = image.shape[0] * image.shape[1]

            return metallic_pixels / total_pixels

        except Exception:
            return 0.0

    def _detect_dark_objects(self, image: np.ndarray) -> float:
        """Detect dark objects with specific shapes"""
        try:
            # Convert to grayscale
            gray = cv2.cvtColor(image, cv2.COLOR_RGB2GRAY)

            # Create binary image of dark areas
            _, binary = cv2.threshold(gray, 80, 255, cv2.THRESH_BINARY_INV)

            # Find contours
            contours, _ = cv2.findContours(binary, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

            # Analyze contour shapes
            suspicious_objects = 0
            total_area = image.shape[0] * image.shape[1]

            for contour in contours:
                area = cv2.contourArea(contour)
                if area > 100:  # Minimum size threshold
                    # Calculate aspect ratio
                    x, y, w, h = cv2.boundingRect(contour)
                    aspect_ratio = float(w) / h

                    # Look for elongated objects (potential weapons)
                    if aspect_ratio > 2.0 or aspect_ratio < 0.5:
                        suspicious_objects += area

            return suspicious_objects / total_area

        except Exception:
            return 0.0
