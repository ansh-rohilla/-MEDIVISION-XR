#!/usr/bin/env python3
"""
Simple deployment script for MEDIVISION-XR backend
"""
import os
import sys
from waitress import serve
from app import app

if __name__ == '__main__':
    # Configure for production
    port = int(os.environ.get('PORT', 5000))
    
    print(f"🚀 Starting MEDIVISION-XR backend on port {port}")
    print("🌐 Backend will be accessible at: http://localhost:5000")
    
    # Serve the app
    serve(app, host='0.0.0.0', port=port)
