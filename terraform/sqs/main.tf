// SQSキュー作成用モジュールの雛形 

# デッドレターキュー（DLQ）
resource "aws_sqs_queue" "dlq" {
  name = var.dlq_name
  
  # メッセージ保持期間（14日間）
  message_retention_seconds = 1209600
  
  # 暗号化設定
  kms_master_key_id = "alias/aws/sqs"
  
  tags = {
    Name = var.dlq_name
    Type = "DeadLetterQueue"
  }
}

# メインSQSキュー
resource "aws_sqs_queue" "main" {
  name = var.queue_name
  
  # 可視性タイムアウト（Lambda処理時間を考慮して15分）
  visibility_timeout_seconds = 900
  
  # メッセージ受信待機時間（Long Polling）
  receive_wait_time_seconds = 20
  
  # メッセージ保持期間（4日間）
  message_retention_seconds = 345600
  
  # 最大メッセージサイズ（256KB）
  max_message_size = 262144
  
  # 暗号化設定
  kms_master_key_id = "alias/aws/sqs"
  
  # デッドレターキュー設定
  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.dlq.arn
    maxReceiveCount     = var.max_receive_count
  })
  
  tags = {
    Name = var.queue_name
    Type = "MainQueue"
  }
} 