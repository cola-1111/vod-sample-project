variable "project_name" {
  description = "プロジェクト名"
  type        = string
  default     = "vod-sample"
}

variable "region" {
  description = "AWSリージョン"
  type        = string
  default     = "ap-northeast-1"
}

variable "environment" {
  description = "環境名 (dev, stg, prod など)"
  type        = string
  default     = "dev"
}

variable "input_bucket_name" {
  description = "入力用S3バケット名"
  type        = string
}

variable "output_bucket_name" {
  description = "出力用S3バケット名"
  type        = string
}

variable "notification_email" {
  description = "通知先メールアドレス"
  type        = string
  default     = ""
} 