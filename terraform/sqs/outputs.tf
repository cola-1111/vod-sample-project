output "queue_url" {
  description = "標準SQSキューのURL"
  value       = aws_sqs_queue.main.id
}

output "queue_arn" {
  description = "標準SQSキューのARN"
  value       = aws_sqs_queue.main.arn
}

output "dlq_url" {
  description = "デッドレターキューのURL"
  value       = aws_sqs_queue.dlq.id
}

output "dlq_arn" {
  description = "デッドレターキューのARN"
  value       = aws_sqs_queue.dlq.arn
} 