output "eventbridge_rule_arn" {
  description = "EventBridgeルールのARN"
  value       = aws_cloudwatch_event_rule.mediaconvert_job_state_change.arn
}

output "eventbridge_rule_name" {
  description = "EventBridgeルール名"
  value       = aws_cloudwatch_event_rule.mediaconvert_job_state_change.name
}

output "eventbridge_target_id" {
  description = "EventBridgeターゲットID"
  value       = aws_cloudwatch_event_target.notify_lambda.target_id
}

output "lambda_permission_statement_id" {
  description = "Lambda実行権限のステートメントID"
  value       = aws_lambda_permission.allow_eventbridge.statement_id
}

output "custom_bus_arn" {
  description = "カスタムEventBusのARN（作成された場合）"
  value       = var.create_custom_bus ? aws_cloudwatch_event_bus.vod_processing[0].arn : null
}

output "custom_bus_name" {
  description = "カスタムEventBus名（作成された場合）"
  value       = var.create_custom_bus ? aws_cloudwatch_event_bus.vod_processing[0].name : null
}

output "log_group_name" {
  description = "CloudWatch LogsグループのARN"
  value       = aws_cloudwatch_log_group.eventbridge_logs.name
}

output "log_group_arn" {
  description = "CloudWatch LogsグループのARN"
  value       = aws_cloudwatch_log_group.eventbridge_logs.arn
} 