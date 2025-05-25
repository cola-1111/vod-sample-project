terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 4.0"
    }
  }
  required_version = ">= 1.0.0"
  
  # S3バックエンド設定（profile以外の値を設定）
  backend "s3" {
    bucket         = "YOUR_TERRAFORM_STATE_BUCKET"
    key            = "vod-pipeline/terraform.tfstate"
    region         = "us-east-1"
    encrypt        = true
    dynamodb_table = "terraform-state-lock"
  }
}

provider "aws" {
  region = var.region
} 