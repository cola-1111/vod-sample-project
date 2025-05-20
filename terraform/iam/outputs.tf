output "lambda_role_arn" {
  description = "Lambda用IAMロールのARN"
  value       = aws_iam_role.lambda.arn
}

output "mediaconvert_policy_arn" {
  description = "MediaConvert用IAMポリシーのARN"
  value       = aws_iam_policy.mediaconvert.arn
} 