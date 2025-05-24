# VOD処理パイプライン - 出力値定義

# S3バケット情報
output "input_bucket_name" {
  description = "入力用S3バケット名"
  value       = module.s3.input_bucket_name
}

output "output_bucket_name" {
  description = "出力用S3バケット名"
  value       = module.s3.output_bucket_name
}

output "output_bucket_id" {
  description = "出力用S3バケットID"
  value       = module.s3.output_bucket_id
}

# SQS情報
output "queue_url" {
  description = "SQSキューURL"
  value       = module.sqs.queue_url
}

output "queue_arn" {
  description = "SQSキューARN"
  value       = module.sqs.queue_arn
}

output "dlq_url" {
  description = "デッドレターキューURL"
  value       = module.sqs.dlq_url
}

# IAMロール情報
output "lambda_role_arn" {
  description = "Lambda実行ロールARN"
  value       = module.iam.lambda_role_arn
}

output "mediaconvert_role_arn" {
  description = "MediaConvert実行ロールARN"
  value       = module.iam.mediaconvert_role_arn
}

# MediaConvert情報
output "mediaconvert_queue_arn" {
  description = "MediaConvertキューARN"
  value       = module.mediaconvert.queue_arn
}

output "mediaconvert_template_name" {
  description = "MediaConvertジョブテンプレート名"
  value       = module.mediaconvert.template_name
}

# Lambda関数情報
output "submit_job_function_name" {
  description = "SubmitJob Lambda関数名"
  value       = module.lambda_submit_job.function_name
}

output "submit_job_function_arn" {
  description = "SubmitJob Lambda関数ARN"
  value       = module.lambda_submit_job.function_arn
}

output "notify_function_name" {
  description = "Notify Lambda関数名"
  value       = module.lambda_notify.function_name
}

output "notify_function_arn" {
  description = "Notify Lambda関数ARN"
  value       = module.lambda_notify.function_arn
}

# CloudFront情報
output "cloudfront_distribution_id" {
  description = "CloudFrontディストリビューションID"
  value       = module.cloudfront.distribution_id
}

output "cloudfront_domain_name" {
  description = "CloudFrontドメイン名"
  value       = module.cloudfront.domain_name
} 