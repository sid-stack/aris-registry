FROM python:3.11-slim

# Install system deps (e.g., gcc, libpq) if needed
RUN apt-get update && apt-get install -y --no-install-recommends \
        build-essential \
        curl && \
    rm -rf /var/lib/apt/lists/*

# Create a non-root user for safety
RUN useradd -m appuser
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the source code
COPY . .

# Switch to non-root user
USER appuser

EXPOSE 8000

# Added healthcheck curl requirement
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
