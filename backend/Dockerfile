FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy and install python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application files, models, and data
COPY . .

# Expose port (default 8080 or 7860 for HF Spaces)
EXPOSE 8080

ENV PORT=8080

CMD ["python", "main.py"]
