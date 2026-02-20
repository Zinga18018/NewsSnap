# 🚀 LLMOps — End-to-End ML Operations Pipeline

A production-grade MLOps pipeline for text classification using **AWS**, **Terraform**, **Docker**, **GitHub Actions**, and **Netlify**.

## Architecture

```
Local Dev → GitHub → CI/CD (GitHub Actions) → AWS (S3, ECR, SageMaker, Lambda, CloudWatch) → Netlify Dashboard
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Infrastructure** | Terraform (AWS: S3, ECR, IAM, SageMaker, Lambda, CloudWatch) |
| **ML Framework** | PyTorch + HuggingFace Transformers (DistilBERT) |
| **Dataset** | AG News (120K articles, 4-class classification) |
| **Containerization** | Docker + Docker Compose |
| **CI/CD** | GitHub Actions (3 workflows: CI, Terraform, ML Pipeline) |
| **Dashboard** | React + Vite + Recharts, deployed on Netlify |
| **Monitoring** | CloudWatch + S3 metrics + Netlify dashboard |

## Quick Start

### 1. Setup
```bash
# Clone and configure
cp .env.example .env
# Edit .env with your AWS credentials

# Install Python deps
pip install -r requirements.txt
```

### 2. Data Pipeline
```bash
# Download & preprocess AG News
python -m src.data.ingestion
python -m src.data.preprocessing
```

### 3. Train Locally (Docker)
```bash
docker-compose up training
# or
python -m src.models.train --data-dir data/processed --model-dir models/latest
```

### 4. Evaluate
```bash
python -m src.models.evaluate --model-dir models/latest --test-data data/processed/test.jsonl
```

### 5. Deploy Infrastructure
```bash
cd terraform
terraform init
terraform plan
terraform apply
```

### 6. Dashboard
```bash
cd dashboard
npm install
npm run dev
```

## GitHub Actions Secrets Required

| Secret | Description |
|--------|-------------|
| `AWS_ACCESS_KEY_ID` | AWS access key |
| `AWS_SECRET_ACCESS_KEY` | AWS secret key |
| `SAGEMAKER_ROLE_ARN` | SageMaker execution role ARN (from Terraform output) |

## Project Structure

```
LLMOPS/
├── terraform/          # Infrastructure as Code (10 files)
├── src/                # ML pipeline (data, models, serving, utils)
├── scripts/            # CLI tools (trigger_training, deploy_model)
├── .github/workflows/  # CI/CD (ci, terraform, ml-pipeline)
├── dashboard/          # React monitoring dashboard (Netlify)
├── tests/              # Unit tests
├── Dockerfile          # SageMaker-compatible container
├── docker-compose.yml  # Local dev stack
└── config.py           # Central configuration
```

## License

MIT
