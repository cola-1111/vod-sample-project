// EventBridgeリソース作成用モジュール

# EventBridgeルール - MediaConvertジョブ状態変化の監視
resource "aws_cloudwatch_event_rule" "mediaconvert_job_state_change" {
  name        = var.rule_name
  description = "MediaConvertジョブの状態変化を監視"
  
  # MediaConvertジョブ状態変化イベントの検出
  event_pattern = jsonencode({
    source      = ["aws.mediaconvert"]
    detail-type = ["MediaConvert Job State Change"]
    detail = {
      status = [
        "COMPLETE",
        "ERROR", 
        "CANCELED"
      ]
    }
  })

  # ルールの有効化
  state = "ENABLED"

  tags = {
    Name        = var.rule_name
    Purpose     = "VOD-MediaConvert-Monitoring"
    Environment = var.environment
  }
}

# EventBridgeターゲット - Notify Lambdaの実行
resource "aws_cloudwatch_event_target" "notify_lambda" {
  rule      = aws_cloudwatch_event_rule.mediaconvert_job_state_change.name
  target_id = "NotifyLambdaTarget"
  arn       = var.notify_lambda_function_arn

  # 入力変換設定（必要に応じてイベントデータを整形）
  input_transformer {
    input_paths = {
      status  = "$.detail.status"
      jobId   = "$.detail.jobId"
      queue   = "$.detail.queue"
      account = "$.account"
      region  = "$.region"
      time    = "$.time"
    }

    # Lambda関数に渡すイベント構造
    input_template = jsonencode({
      version      = "0"
      id           = "<aws.events.event.ingestion-time>"
      detail-type  = "MediaConvert Job State Change"
      source       = "aws.mediaconvert" 
      account      = "<account>"
      time         = "<time>"
      region       = "<region>"
      detail = {
        status = "<status>"
        jobId  = "<jobId>"
        queue  = "<queue>"
      }
    })
  }

  # エラー時のリトライ設定
  retry_policy {
    maximum_retry_attempts       = 3
    maximum_event_age_in_seconds = 3600  # 1時間
  }

  # デッドレターキュー設定（オプション）
  dead_letter_config {
    arn = var.dlq_arn
  }
}

# Lambda関数実行権限 - EventBridgeからの呼び出し許可
resource "aws_lambda_permission" "allow_eventbridge" {
  statement_id  = "AllowExecutionFromEventBridge"
  action        = "lambda:InvokeFunction"
  function_name = var.notify_lambda_function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.mediaconvert_job_state_change.arn

  # 権限の説明
  qualifier = var.lambda_alias
}

# EventBridge カスタムバス（オプション：デフォルトバスを使用する場合は不要）
resource "aws_cloudwatch_event_bus" "vod_processing" {
  count = var.create_custom_bus ? 1 : 0
  name  = var.custom_bus_name

  tags = {
    Name        = var.custom_bus_name
    Purpose     = "VOD-Processing-Events"
    Environment = var.environment
  }
}

# カスタムバス用ルール（カスタムバスを使用する場合）
resource "aws_cloudwatch_event_rule" "mediaconvert_custom_bus" {
  count       = var.create_custom_bus ? 1 : 0
  name        = "${var.rule_name}-custom"
  description = "MediaConvertジョブ状態変化監視（カスタムバス用）"
  event_bus_name = aws_cloudwatch_event_bus.vod_processing[0].name
  
  event_pattern = jsonencode({
    source      = ["aws.mediaconvert"]
    detail-type = ["MediaConvert Job State Change"]
    detail = {
      status = [
        "COMPLETE",
        "ERROR", 
        "CANCELED"
      ]
    }
  })

  state = "ENABLED"

  tags = {
    Name        = "${var.rule_name}-custom"
    Purpose     = "VOD-MediaConvert-Custom-Bus"
    Environment = var.environment
  }
}

# ログ用CloudWatch Logs グループ
resource "aws_cloudwatch_log_group" "eventbridge_logs" {
  name              = "/aws/events/${var.rule_name}"
  retention_in_days = var.log_retention_days

  tags = {
    Name        = "${var.rule_name}-logs"
    Purpose     = "VOD-EventBridge-Logging"
    Environment = var.environment
  }
} 