variable "queue_name" {
  description = "標準SQSキュー名"
  type        = string
}

variable "dlq_name" {
  description = "デッドレターキュー名"
  type        = string
}

variable "max_receive_count" {
  description = "DLQに送るまでの最大受信回数"
  type        = number
  default     = 5
} 