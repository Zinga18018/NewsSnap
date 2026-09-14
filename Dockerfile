# Legacy inference service. Maintained training is in ai-engineering-lab/newssnap.
# The API explicitly reports demo mode when model weights are absent.
FROM python:3.11-slim
WORKDIR /app
COPY requirements-runtime.txt ./requirements-runtime.txt
RUN pip install --no-cache-dir -r requirements-runtime.txt
COPY config.py ./config.py
COPY src/ ./src/
COPY evidence/evaluation_results.json ./models/latest/evaluation_results.json
COPY evidence/training_history.json ./models/latest/training_history.json
EXPOSE 8000
CMD ["uvicorn", "src.serving.api:app", "--host", "0.0.0.0", "--port", "8000"]
