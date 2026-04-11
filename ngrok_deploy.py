#!/usr/bin/env python3
"""
Deploy MEDIVISION-XR backend with ngrok for public access
"""
import os
import sys
from pyngrok import ngrok
from waitress import serve
from app import app

if __name__ == '__main__':
    # Start ngrok tunnel
    print("Starting ngrok tunnel...")
    public_url = ngrok.connect(5000)
    print(f"Public URL: {public_url}")
    
    # Update frontend environment file
    env_content = f"REACT_APP_BACKEND_ORIGIN={public_url}"
    with open('frontend/.env.production', 'w') as f:
        f.write(env_content)
    
    print(f"Updated frontend environment with: {env_content}")
    
    # Configure for production
    port = int(os.environ.get('PORT', 5000))
    
    print(f"Starting MEDIVISION-XR backend on port {port}")
    print(f"Backend accessible at: {public_url}")
    
    # Serve the app
    try:
        serve(app, host='0.0.0.0', port=port)
    except KeyboardInterrupt:
        print("\nShutting down...")
        ngrok.disconnect(public_url)
