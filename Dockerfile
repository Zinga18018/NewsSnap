# ──────────────────────────────────────────────
# Stage 1: Base image with Python + system deps
# ──────────────────────────────────────────────
FROM python:3.11-slim AS base

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /opt/ml/code

# ──────────────────────────────────────────────
# Stage 2: Install Python dependencies
# ──────────────────────────────────────────────
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# ──────────────────────────────────────────────
# Stage 3: Copy application code
# ──────────────────────────────────────────────
COPY config.py .
COPY src/ ./src/

# ──────────────────────────────────────────────
# Runtime Configuration
# ──────────────────────────────────────────────
# Default program for SageMaker
ENV SAGEMAKER_PROGRAM=src/models/train.py

# Expose FastAPI port
EXPOSE 8000

# Entrypoint script or direct command
# Use CMD so it can be easily overridden:
# Training: docker run image train
# Serving:  docker run image serve
COPY <<EOF /usr/local/bin/entrypoint.sh
#!/bin/bash
if [ "$1" = "serve" ]; then
    exec uvicorn src.serving.api:app --host 0.0.0.0 --port 8000
else
    exec python -m src.models.train "$@"
fi
EOF

RUN chmod +x /usr/local/bin/entrypoint.sh
ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
CMD ["train"]
