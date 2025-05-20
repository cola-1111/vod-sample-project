output "mediaconvert_queue_arn" {
  description = "MediaConvertキューのARN"
  value       = aws_mediaconvert_queue.default.arn
}

output "mediaconvert_job_template_arn" {
  description = "MediaConvertジョブテンプレートのARN"
  value       = aws_mediaconvert_job_template.default.arn
} 