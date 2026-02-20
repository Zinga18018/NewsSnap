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

# SageMaker expects the training script at this path
ENV SAGEMAKER_PROGRAM=src/models/train.py

# ──────────────────────────────────────────────
# Default: run training
# ──────────────────────────────────────────────
ENTRYPOINT ["python", "-m", "src.models.train"]
