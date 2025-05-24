output "lambda_role_arn" {
  description = "Lambda用IAMロールのARN"
  value       = aws_iam_role.lambda.arn
}

output "lambda_role_name" {
  description = "Lambda用IAMロール名"
  value       = aws_iam_role.lambda.name
}

output "mediaconvert_role_arn" {
  description = "MediaConvert用IAMロールのARN"
  value       = aws_iam_role.mediaconvert.arn
}

output "mediaconvert_role_name" {
  description = "MediaConvert用IAMロール名"
  value       = aws_iam_role.mediaconvert.name
}

output "lambda_s3_policy_arn" {
  description = "Lambda用S3ポリシーのARN"
  value       = aws_iam_policy.lambda_s3_access.arn
}

output "lambda_sqs_policy_arn" {
  description = "Lambda用SQSポリシーのARN"
  value       = aws_iam_policy.lambda_sqs_access.arn
}

output "lambda_mediaconvert_policy_arn" {
  description = "Lambda用MediaConvertポリシーのARN"
  value       = aws_iam_policy.lambda_mediaconvert_access.arn
} 