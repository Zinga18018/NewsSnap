# Using local backend for now.
# To migrate to S3 remote state later, uncomment the block below
# and run: terraform init -migrate-state

# terraform {
#   backend "s3" {
#     bucket         = "llmops-terraform-state"
#     key            = "mlops/terraform.tfstate"
#     region         = "us-east-1"
#     dynamodb_table = "llmops-terraform-lock"
#     encrypt        = true
#   }
# }
