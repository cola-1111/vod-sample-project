variable "function_name" {
  description = "Lambda関数名"
  type        = string
}

variable "handler" {
  description = "Lambdaハンドラー"
  type        = string
}

variable "runtime" {
  description = "Lambdaランタイム"
  type        = string
}

variable "role_arn" {
  description = "Lambda実行ロールのARN"
  type        = string
}

variable "filename" {
  description = "デプロイ用zipファイルのパス"
  type        = string
}

variable "environment_variables" {
  description = "環境変数のマップ"
  type        = map(string)
  default     = {}
} 