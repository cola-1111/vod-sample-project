variable "queue_name" {
  description = "MediaConvertキュー名"
  type        = string
}

variable "job_template_name" {
  description = "MediaConvertジョブテンプレート名"
  type        = string
}

variable "job_template_category" {
  description = "MediaConvertジョブテンプレートのカテゴリ"
  type        = string
  default     = "VOD"
} 