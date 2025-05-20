output "input_bucket_name" {
  description = "入力用S3バケット名"
  value       = aws_s3_bucket.input.id
}

output "input_bucket_arn" {
  description = "入力用S3バケットのARN"
  value       = aws_s3_bucket.input.arn
}

output "output_bucket_name" {
  description = "出力用S3バケット名"
  value       = aws_s3_bucket.output.id
}

output "output_bucket_arn" {
  description = "出力用S3バケットのARN"
  value       = aws_s3_bucket.output.arn
} 