#!/bin/bash

# Set environment variables
export PORT=${PORT:-1000}
export NODE_ENV=production

# Start the Flask app
python app.py
