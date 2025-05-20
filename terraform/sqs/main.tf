// SQSキュー作成用モジュールの雛形 

resource "aws_sqs_queue" "dlq" {
  name = var.dlq_name
}

resource "aws_sqs_queue" "main" {
  name                      = var.queue_name
  redrive_policy            = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.dlq.arn
    maxReceiveCount     = var.max_receive_count
  })
} 