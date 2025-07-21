#!/usr/bin/env python3
"""
Create basic icons for the AI-Firewall extension
"""

from PIL import Image, ImageDraw, ImageFont
import os

def create_icon(size, filename):
    """Create a simple shield icon"""
    # Create image with transparent background
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # Shield background
    shield_color = (102, 126, 234, 255)  # Blue color
    margin = size // 8
    
    # Draw shield shape
    points = [
        (size//2, margin),  # Top center
        (size - margin, margin + size//4),  # Top right
        (size - margin, size - margin - size//4),  # Bottom right
        (size//2, size - margin),  # Bottom center
        (margin, size - margin - size//4),  # Bottom left
        (margin, margin + size//4),  # Top left
    ]
    
    draw.polygon(points, fill=shield_color)
    
    # Add shield symbol (checkmark or similar)
    symbol_color = (255, 255, 255, 255)  # White
    symbol_size = size // 3
    center_x, center_y = size // 2, size // 2
    
    # Draw a simple checkmark
    check_points = [
        (center_x - symbol_size//2, center_y),
        (center_x - symbol_size//4, center_y + symbol_size//3),
        (center_x + symbol_size//2, center_y - symbol_size//3)
    ]
    
    # Draw checkmark lines
    draw.line([check_points[0], check_points[1]], fill=symbol_color, width=max(2, size//16))
    draw.line([check_points[1], check_points[2]], fill=symbol_color, width=max(2, size//16))
    
    # Save the image
    img.save(filename, 'PNG')
    print(f"Created {filename} ({size}x{size})")

def main():
    """Create all required icon sizes"""
    # Create icons directory if it doesn't exist
    os.makedirs('.', exist_ok=True)
    
    # Create icons in different sizes
    sizes = [16, 32, 48, 128]
    
    for size in sizes:
        filename = f"icon-{size}.png"
        create_icon(size, filename)
    
    print("All icons created successfully!")

if __name__ == "__main__":
    main()
