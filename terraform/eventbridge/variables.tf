variable "rule_name" {
  description = "EventBridgeルール名"
  type        = string
}

variable "environment" {
  description = "環境名 (dev, stg, prod など)"
  type        = string
  default     = "dev"
}

variable "notify_lambda_function_arn" {
  description = "Notify Lambda関数のARN"
  type        = string
}

variable "notify_lambda_function_name" {
  description = "Notify Lambda関数名"
  type        = string
}

variable "dlq_arn" {
  description = "デッドレターキューのARN"
  type        = string
}

variable "lambda_alias" {
  description = "Lambda関数のエイリアス"
  type        = string
  default     = null
}

variable "create_custom_bus" {
  description = "カスタムEventBusを作成するかどうか"
  type        = bool
  default     = false
}

variable "custom_bus_name" {
  description = "カスタムEventBus名"
  type        = string
  default     = "vod-processing-bus"
}

variable "log_retention_days" {
  description = "CloudWatch Logsの保持日数"
  type        = number
  default     = 14
} 