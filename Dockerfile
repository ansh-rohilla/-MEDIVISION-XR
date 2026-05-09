FROM python:3.9-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy and install lightweight Python dependencies
COPY requirements-railway.txt .
RUN pip install --no-cache-dir -r requirements-railway.txt

# Copy backend code
COPY . .

# Create static directories
RUN mkdir -p static/uploads static/processed

EXPOSE 5050

CMD ["gunicorn", "--bind", "0.0.0.0:5050", "app:app"]
