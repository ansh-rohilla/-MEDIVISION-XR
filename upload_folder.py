#!/usr/bin/env python3
"""
Simple script to upload a folder of DICOM files to the MEDIVISION-XR backend
"""
import os
import sys
import requests
import json

def get_auth_token(backend_url="http://localhost:5050"):
    """Get authentication token by creating a new test user"""
    try:
        # Create a new test user with known credentials
        import random
        random_id = random.randint(1000, 9999)
        register_data = {
            "email": f"test{random_id}@example.com",
            "password": "testpassword",
            "name": "Test User"
        }
        
        response = requests.post(f"{backend_url}/api/auth/register", json=register_data)
        
        if response.status_code == 200:
            print(f"Created new user: {register_data['email']}")
            return response.json().get("token")
        
        print(f"Registration failed: {response.text}")
        return None
        
    except Exception as e:
        print(f"Error getting auth token: {e}")
        return None

def upload_folder(folder_path, backend_url="http://localhost:5050"):
    """Upload all DICOM files from a folder to the backend"""
    
    # Get authentication token
    token = get_auth_token(backend_url)
    if not token:
        print("Failed to get authentication token!")
        return
    
    print("Authentication successful!")
    
    # Get all DICOM files
    dicom_files = []
    for root, dirs, files in os.walk(folder_path):
        for file in files:
            if file.lower().endswith('.dcm') or file.lower().endswith('.dicom'):
                dicom_files.append(os.path.join(root, file))
    
    if not dicom_files:
        print("No DICOM files found in the folder!")
        return
    
    print(f"Found {len(dicom_files)} DICOM files")
    
    # Upload files
    files = []
    for i, file_path in enumerate(dicom_files[:10]):  # Limit to first 10 files
        files.append(('files', open(file_path, 'rb')))
    
    try:
        # Add authentication headers
        headers = {
            "Authorization": f"Bearer {token}"
        }
        
        response = requests.post(f"{backend_url}/api/upload", files=files, headers=headers)
        
        # Close all files
        for _, f in files:
            f.close()
        
        if response.status_code == 200:
            result = response.json()
            print("Upload successful!")
            print(f"Session ID: {result.get('session_id')}")
            print(f"Slice URLs: {len(result.get('slice_urls', []))}")
            print(f"Model URL: {result.get('model_url')}")
            print(f"Volume URL: {result.get('volume_url')}")
            print(f"Snapshot URL: {result.get('snapshot_url')}")
            
            # Save session info for frontend
            session_data = {
                "session_id": result.get('session_id'),
                "slice_urls": result.get('slice_urls', []),
                "model_url": result.get('model_url'),
                "volume_url": result.get('volume_url'),
                "snapshot_url": result.get('snapshot_url')
            }
            
            with open('latest_upload.json', 'w') as f:
                json.dump(session_data, f, indent=2)
            
            print("Session data saved to 'latest_upload.json'")
            print("You can now load this in the frontend using the 'Load Sample Data' button (update the session ID)")
            
        else:
            print(f"Upload failed: {response.status_code}")
            print(response.text)
            
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    folder_path = "/Users/anshrohilla/CascadeProjects/MEDIVISION-XR/static/uploads/7e55897b-603f-4962-a151-113b0c9be6bc/Chest (thorax)"
    upload_folder(folder_path)
