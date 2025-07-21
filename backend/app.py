"""
AI-Firewall Flask Backend
Main application file for content filtering API
"""

import os
import logging
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv

from services.text_analyzer import TextAnalyzer
from services.image_analyzer import ImageAnalyzer
from services.content_moderator import ContentModerator
from utils.logger import setup_logger
from utils.validators import validate_text_request, validate_image_request

# Load environment variables
load_dotenv()

# Initialize Flask app
app = Flask(__name__)
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'dev-secret-key')

# Setup CORS
CORS(app, origins=os.getenv('CORS_ORIGINS', '*').split(','))

# Setup logging
logger = setup_logger(__name__)

# Initialize AI services
text_analyzer = TextAnalyzer()
image_analyzer = ImageAnalyzer()
content_moderator = ContentModerator()

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'version': '1.0.0',
        'services': {
            'text_analyzer': text_analyzer.is_ready(),
            'image_analyzer': image_analyzer.is_ready(),
            'content_moderator': content_moderator.is_ready()
        }
    })

@app.route('/api/analyze/text', methods=['POST'])
def analyze_text():
    """Analyze text content for inappropriate material"""
    try:
        # Validate request
        data = request.get_json()
        validation_error = validate_text_request(data)
        if validation_error:
            return jsonify({'error': validation_error}), 400
        
        text = data['text']
        threshold = data.get('threshold', float(os.getenv('DEFAULT_TEXT_THRESHOLD', 0.7)))
        age_group = data.get('age_group', 'moderate')
        
        logger.info(f"Analyzing text content, length: {len(text)}, age_group: {age_group}")
        
        # Try Gemini API first (most sophisticated)
        if content_moderator.is_ready():
            moderation_result = content_moderator.moderate_text(text)
            if moderation_result and moderation_result.get('flagged') is not None:
                # Use Gemini result as primary analysis
                result = {
                    'is_safe': not moderation_result['flagged'],
                    'confidence': max(moderation_result['category_scores'].values()) if moderation_result['category_scores'] else 0.0,
                    'categories': moderation_result['category_scores'],
                    'flagged_categories': [cat for cat, flagged in moderation_result['categories'].items() if flagged],
                    'model': 'gemini-pro',
                    'explanation': moderation_result.get('explanation', ''),
                    'threshold_used': threshold,
                    'age_group': age_group
                }
                logger.info(f"Using Gemini analysis: {result['is_safe']}")
            else:
                # Fallback to text analyzer
                result = text_analyzer.analyze(text, threshold, age_group)
                result['moderation'] = moderation_result
        else:
            # Fallback to text analyzer
            result = text_analyzer.analyze(text, threshold, age_group)
        
        logger.info(f"Text analysis result: {result['is_safe']}")
        return jsonify(result)
        
    except Exception as e:
        logger.error(f"Error analyzing text: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/api/analyze/image', methods=['POST'])
def analyze_image():
    """Analyze image content for inappropriate material"""
    try:
        # Validate request
        data = request.get_json()
        validation_error = validate_image_request(data)
        if validation_error:
            return jsonify({'error': validation_error}), 400
        
        image_data = data['image']  # Base64 encoded image
        threshold = data.get('threshold', float(os.getenv('DEFAULT_IMAGE_THRESHOLD', 0.6)))
        age_group = data.get('age_group', 'moderate')
        
        logger.info(f"Analyzing image content, age_group: {age_group}")
        
        # Perform image analysis
        result = image_analyzer.analyze(image_data, threshold, age_group)
        
        logger.info(f"Image analysis result: {result['is_safe']}")
        return jsonify(result)
        
    except Exception as e:
        logger.error(f"Error analyzing image: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/api/analyze/batch', methods=['POST'])
def analyze_batch():
    """Analyze multiple content items in batch"""
    try:
        data = request.get_json()
        items = data.get('items', [])
        
        if not items or len(items) > 50:  # Limit batch size
            return jsonify({'error': 'Invalid batch size (1-50 items)'}), 400
        
        results = []
        for item in items:
            if item.get('type') == 'text':
                result = text_analyzer.analyze(
                    item['content'], 
                    item.get('threshold', 0.7),
                    item.get('age_group', 'moderate')
                )
            elif item.get('type') == 'image':
                result = image_analyzer.analyze(
                    item['content'],
                    item.get('threshold', 0.6),
                    item.get('age_group', 'moderate')
                )
            else:
                result = {'error': 'Invalid content type'}
            
            results.append({
                'id': item.get('id'),
                'result': result
            })
        
        return jsonify({'results': results})
        
    except Exception as e:
        logger.error(f"Error in batch analysis: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Endpoint not found'}), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({'error': 'Internal server error'}), 500

if __name__ == '__main__':
    # Create logs directory
    os.makedirs('logs', exist_ok=True)
    
    # Run the app
    host = os.getenv('FLASK_HOST', 'localhost')
    port = int(os.getenv('FLASK_PORT', 5000))
    debug = os.getenv('FLASK_DEBUG', 'True').lower() == 'true'
    
    logger.info(f"Starting AI-Firewall backend on {host}:{port}")
    app.run(host=host, port=port, debug=debug)
