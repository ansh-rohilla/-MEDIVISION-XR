#!/usr/bin/env python3
"""
Script to update the frontend to use the latest uploaded session
"""
import json
import os

def update_frontend_session():
    """Read the latest upload and create a frontend-compatible session file"""
    
    # Read the latest upload data
    try:
        with open('latest_upload.json', 'r') as f:
            session_data = json.load(f)
    except FileNotFoundError:
        print("No latest_upload.json found. Please run upload_folder.py first.")
        return
    
    # Create a frontend-compatible session file
    frontend_data = {
        "session_id": session_data["session_id"],
        "slice_urls": session_data["slice_urls"],
        "model_url": session_data["model_url"],
        "volume_url": session_data["volume_url"],
        "snapshot_url": session_data["snapshot_url"]
    }
    
    # Save to a location the frontend can access
    with open('frontend_session.json', 'w') as f:
        json.dump(frontend_data, f, indent=2)
    
    print(f"Frontend session updated!")
    print(f"Session ID: {session_data['session_id']}")
    print(f"Number of slices: {len(session_data['slice_urls'])}")
    print(f"You can now load this data in the frontend.")
    
    # Also print the URLs for manual testing
    print("\nURLs for manual testing:")
    print(f"Model: http://localhost:5050{session_data['model_url']}")
    print(f"Volume: http://localhost:5050{session_data['volume_url']}")
    print(f"Snapshot: http://localhost:5050{session_data['snapshot_url']}")

if __name__ == "__main__":
    update_frontend_session()
