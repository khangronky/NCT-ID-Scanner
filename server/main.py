from flask import Flask, request, jsonify
from flask_cors import CORS
import cv2
import numpy as np
import re
import pytesseract
import base64

# Path to Tesseract executable
pytesseract.pytesseract.tesseract_cmd = r"C:\Program Files\Tesseract-OCR\tesseract.exe"

# Initialize Flask app
app = Flask(__name__)
CORS(app)

def preprocess_image(frame):
    """
    Preprocess the image for better OCR results.
    - Converts the image to grayscale.
    - Applies Gaussian blur to reduce noise.
    - Applies adaptive thresholding for better text clarity.
    """
    # Convert to grayscale
    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    # Apply Gaussian blur to reduce noise
    blurred = cv2.GaussianBlur(gray, (5, 5), 0)
    # Apply adaptive thresholding
    thresh = cv2.adaptiveThreshold(blurred, 255, 
                                   cv2.ADAPTIVE_THRESH_GAUSSIAN_C, 
                                   cv2.THRESH_BINARY, 11, 2)
    return thresh

def process_frame_for_text(frame):
    """
    Processes the frame and extracts text using Tesseract OCR.
    """
    preprocessed_frame = preprocess_image(frame)
    return pytesseract.image_to_string(preprocessed_frame)

def extract_name_from_text(text):
    """
    Extracts name and student number from the extracted text.
    Updated to remove specified keywords and months before processing.
    Handles names split across lines and formats uppercase names correctly.
    """
    # Define the excluded keywords, including months of the year
    excluded_keywords = r"(RMIT|Student|STUDENT|UNIVERSITY|SINH\sVIEN|January|February|March|April|May|June|July|August|September|October|November|December)"

    # Remove excluded keywords from the text
    cleaned_text = re.sub(excluded_keywords, '', text, flags=re.IGNORECASE)

    # Pattern to match full names (first and last) allowing for newlines or spaces between parts,
    # followed by a student number.
    combined_pattern = r"([A-Z][a-zA-Z]+(?:[\s\n]+[A-Z][a-zA-Z]+)*)\s*\n*\s*(\d{7})"
    match = re.search(combined_pattern, cleaned_text)

    if match:
        name, student_number = match.groups()
        
        # Split the name into parts and format
        name_parts = name.split()
        formatted_name_parts = [
            part.capitalize() if part.isupper() else part for part in name_parts
        ]
        formatted_name = ' '.join(formatted_name_parts)
        
        return formatted_name.strip(), student_number.strip()
    
    return None

@app.route('/capture', methods=['POST'])
def capture():
    """
    Endpoint to capture an image, process it, and extract ID information.
    """
    data = request.json
    if 'imageData' not in data:
        return jsonify({'error': 'No image data provided'}), 400

    # Decode the base64 image
    image_data = data['imageData'].split(',')[1]
    nparr = np.frombuffer(base64.b64decode(image_data), np.uint8)
    frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

    if frame is None:
        return jsonify({'error': 'Image could not be decoded'}), 400

    # Process the frame and extract text
    extracted_text = process_frame_for_text(frame)
    id_info = extract_name_from_text(extracted_text)

    if id_info:
        name, student_number = id_info
        return jsonify({'name': name.strip(), 'studentNumber': student_number.strip()})
    else:
        return jsonify({'error': 'No match found in the provided ID data'}), 200

if __name__ == "__main__":
    app.run(host='0.0.0.0', port=5000)
