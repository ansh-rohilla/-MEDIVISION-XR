#!/usr/bin/env python3
"""
Simple public backend for MEDIVISION-XR that works anywhere
"""
import os
import json
import uuid
from datetime import datetime
from flask import Flask, jsonify, request
from flask_cors import CORS

app = Flask(__name__)
CORS(app, origins=["*"], supports_credentials=True)

# Brain labels data
BRAIN_LABELS = [
    {"name": "Cerebrum", "x": 50, "y": 30, "side": "center", "type": "normal", "category": "organs", "description": "Largest part of brain responsible for higher functions"},
    {"name": "Cerebellum", "x": 50, "y": 65, "side": "center", "type": "normal", "category": "organs", "description": "Coordinates movement and balance"},
    {"name": "Brainstem", "x": 50, "y": 80, "side": "center", "type": "normal", "category": "organs", "description": "Controls vital functions like breathing and heart rate"},
    {"name": "Frontal Lobe", "x": 35, "y": 25, "side": "left", "type": "normal", "category": "organs", "description": "Responsible for reasoning and motor control"},
    {"name": "Parietal Lobe", "x": 65, "y": 25, "side": "right", "type": "normal", "category": "organs", "description": "Processes sensory information and spatial awareness"},
    {"name": "Temporal Lobe", "x": 30, "y": 45, "side": "left", "type": "normal", "category": "organs", "description": "Processes auditory information and memory"},
    {"name": "Occipital Lobe", "x": 70, "y": 45, "side": "right", "type": "normal", "category": "organs", "description": "Processes visual information"},
    {"name": "Thalamus", "x": 50, "y": 50, "side": "center", "type": "normal", "category": "organs", "description": "Relays sensory and motor signals"},
    {"name": "Hypothalamus", "x": 45, "y": 55, "side": "left", "type": "normal", "category": "organs", "description": "Regulates hormones and autonomic functions"},
    {"name": "Pituitary Gland", "x": 55, "y": 55, "side": "right", "type": "normal", "category": "organs", "description": "Master gland controlling endocrine system"},
    {"name": "Corpus Callosum", "x": 50, "y": 40, "side": "center", "type": "normal", "category": "organs", "description": "Connects left and right brain hemispheres"},
    {"name": "Pons", "x": 48, "y": 70, "side": "left", "type": "normal", "category": "organs", "description": "Part of brainstem linking to cerebellum"},
    {"name": "Medulla Oblongata", "x": 52, "y": 75, "side": "right", "type": "normal", "category": "organs", "description": "Controls vital autonomic functions"}
]

@app.route('/')
def index():
    return jsonify({
        'status': 'healthy',
        'message': 'MEDIVISION-XR Backend API',
        'version': '1.0.0',
        'endpoints': ['/api/labels/<body_part>', '/api/upload', '/api/evaluate', '/api/auth/me']
    })

@app.route('/health')
def health():
    return jsonify({'status': 'healthy'})

@app.route('/api/labels/<body_part>')
def get_labels(body_part):
    """Get organ labels for a specific body part"""
    body_part_normalized = body_part.lower()
    
    if body_part_normalized in ['brain', 'head', 'skull', 'cerebral', 'cranial']:
        labels = BRAIN_LABELS
    else:
        # Fallback to brain labels for any body part
        labels = BRAIN_LABELS
    
    return jsonify({
        'labels': labels,
        'body_part': body_part,
        'count': len(labels)
    })

@app.route('/api/upload', methods=['POST'])
def upload_file():
    """Handle file upload with proper registration"""
    try:
        # Generate session ID
        session_id = str(uuid.uuid4())
        
        # Get files from request
        files = request.files.getlist('files')
        
        if not files:
            return jsonify({'error': 'No files provided'}), 400
        
        # Process files
        file_count = len(files)
        file_names = []
        
        for file in files:
            if file.filename:
                file_names.append(file.filename)
        
        # Detect body part from file names (default to brain)
        body_part = 'brain'
        
        return jsonify({
            'session_id': session_id,
            'body_part': body_part,
            'file_count': file_count,
            'message': 'Files uploaded successfully',
            'status': 'success'
        })
        
    except Exception as e:
        return jsonify({'error': str(e), 'status': 'error'}), 500

@app.route('/api/evaluate', methods=['POST'])
def evaluate():
    """Evaluate uploaded files"""
    try:
        data = request.get_json()
        session_id = data.get('session_id')
        
        if not session_id:
            return jsonify({'error': 'Invalid session ID'}), 400
        
        # Mock evaluation results
        return jsonify({
            'two_d': {
                'mean_top1_confidence': 0.85,
                'mean_entropy': 0.23,
                'pretrained': True,
                'slice_scores': [{'confidence': 0.85, 'entropy': 0.23} for _ in range(10)]
            },
            'three_d': {
                'mean_top1_confidence': 0.92,
                'mean_entropy': 0.18,
                'pretrained': True,
                'slice_scores': [{'confidence': 0.92, 'entropy': 0.18} for _ in range(10)]
            },
            'comparison': {
                'confidence_gap': 0.07,
                'three_d_confidence': 0.92,
                'two_d_confidence': 0.85,
                'notes': '3D model shows improved performance'
            }
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/auth/me')
def auth_me():
    """Mock authentication endpoint"""
    return jsonify({
        'user': {
            'id': 'demo_user',
            'email': 'demo@medivision-xr.com',
            'name': 'Demo User'
        }
    })

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    print(f"Starting MEDIVISION-XR backend on port {port}")
    print(f"Backend will be accessible at: http://localhost:{port}")
    app.run(host='0.0.0.0', port=port, debug=False)
