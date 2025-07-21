"""
Request validation utilities
"""

from typing import Dict, Optional

def validate_text_request(data: Dict) -> Optional[str]:
    """
    Validate text analysis request
    
    Args:
        data: Request data dictionary
    
    Returns:
        Error message if validation fails, None if valid
    """
    if not data:
        return "Request body is required"
    
    if 'text' not in data:
        return "Text field is required"
    
    text = data['text']
    if not isinstance(text, str):
        return "Text must be a string"
    
    if len(text.strip()) == 0:
        return "Text cannot be empty"
    
    if len(text) > 10000:  # Reasonable limit
        return "Text too long (max 10,000 characters)"
    
    # Validate optional fields
    if 'threshold' in data:
        threshold = data['threshold']
        if not isinstance(threshold, (int, float)) or not (0.0 <= threshold <= 1.0):
            return "Threshold must be a number between 0.0 and 1.0"
    
    if 'age_group' in data:
        age_group = data['age_group']
        if age_group not in ['mild', 'moderate', 'strict']:
            return "Age group must be 'mild', 'moderate', or 'strict'"
    
    return None

def validate_image_request(data: Dict) -> Optional[str]:
    """
    Validate image analysis request
    
    Args:
        data: Request data dictionary
    
    Returns:
        Error message if validation fails, None if valid
    """
    if not data:
        return "Request body is required"
    
    if 'image' not in data:
        return "Image field is required"
    
    image_data = data['image']
    if not isinstance(image_data, str):
        return "Image must be a base64 encoded string"
    
    if len(image_data.strip()) == 0:
        return "Image data cannot be empty"
    
    # Basic base64 validation
    try:
        import base64
        # Remove data URL prefix if present
        if image_data.startswith('data:image'):
            image_data = image_data.split(',')[1]
        
        # Try to decode
        base64.b64decode(image_data)
    except Exception:
        return "Invalid base64 image data"
    
    # Validate optional fields
    if 'threshold' in data:
        threshold = data['threshold']
        if not isinstance(threshold, (int, float)) or not (0.0 <= threshold <= 1.0):
            return "Threshold must be a number between 0.0 and 1.0"
    
    if 'age_group' in data:
        age_group = data['age_group']
        if age_group not in ['mild', 'moderate', 'strict']:
            return "Age group must be 'mild', 'moderate', or 'strict'"
    
    return None
