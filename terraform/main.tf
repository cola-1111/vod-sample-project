# VOD処理パイプライン - メインTerraform設定

# MediaConvertエンドポイントの取得
data "aws_mediaconvert_endpoint" "default" {}

# S3バケットモジュール
module "s3" {
  source = "./s3"
  
  input_bucket_name  = "${var.project_name}-${var.environment}-input"
  output_bucket_name = "${var.project_name}-${var.environment}-output"
}

# SQSキューモジュール
module "sqs" {
  source = "./sqs"
  
  queue_name = "${var.project_name}-${var.environment}-queue"
  dlq_name   = "${var.project_name}-${var.environment}-dlq"
}

# IAMロールモジュール
module "iam" {
  source = "./iam"
  
  lambda_role_name          = "${var.project_name}-${var.environment}-lambda-role"
  mediaconvert_policy_name  = "${var.project_name}-${var.environment}-mediaconvert-policy"
}

# MediaConvertモジュール
module "mediaconvert" {
  source = "./mediaconvert"
  
  queue_name          = "${var.project_name}-${var.environment}-mediaconvert-queue"
  job_template_name   = "${var.project_name}-${var.environment}-template"
}

# 通知用SNSトピック（オプション）
# resource "aws_sns_topic" "notifications" {
#   count = var.notification_email != "" ? 1 : 0
#   name  = "${var.project_name}-${var.environment}-notifications"
#   
#   tags = {
#     Name        = "${var.project_name}-${var.environment}-notifications"
#     Environment = var.environment
#     Purpose     = "VOD-Processing-Notifications"
#   }
# }

# resource "aws_sns_topic_subscription" "email_notification" {
#   count     = var.notification_email != "" ? 1 : 0
#   topic_arn = aws_sns_topic.notifications[0].arn
#   protocol  = "email"
#   endpoint  = var.notification_email
# }

# Lambda関数モジュール（SubmitJob）
module "lambda_submit_job" {
  source = "./lambda/submit_job"
  
  function_name = "${var.project_name}-${var.environment}-submit-job"
  handler      = "dist/handler.handler"
  runtime      = "nodejs18.x"
  role_arn     = module.iam.lambda_role_arn
  filename     = "./dist/submit-job.zip"
  
  environment_variables = {
    MEDIACONVERT_ENDPOINT = data.aws_mediaconvert_endpoint.default.url
    MEDIACONVERT_ROLE_ARN = module.iam.mediaconvert_role_arn
    JOB_TEMPLATE_NAME     = module.mediaconvert.template_name
    OUTPUT_BUCKET_NAME    = module.s3.output_bucket_name
    SQS_QUEUE_URL         = module.sqs.queue_url
    AWS_REGION            = var.region
  }
}

# Lambda関数モジュール（Notify）
module "lambda_notify" {
  source = "./lambda/notify"
  
  function_name = "${var.project_name}-${var.environment}-notify"
  handler      = "dist/handler.handler"
  runtime      = "nodejs18.x"
  role_arn     = module.iam.lambda_role_arn
  filename     = "./dist/notify.zip"
  
  environment_variables = {
    OUTPUT_BUCKET_NAME    = module.s3.output_bucket_name
    SQS_QUEUE_URL         = module.sqs.queue_url
    SNS_TOPIC_ARN         = ""
    CLOUDFRONT_DOMAIN     = module.cloudfront.domain_name
    AWS_REGION            = var.region
  }
}

# CloudFrontディストリビューションモジュール
module "cloudfront" {
  source = "./cloudfront"
  
  s3_origin_domain_name = module.s3.output_bucket_regional_domain_name
}

# EventBridgeモジュール - MediaConvert完了イベントの処理
module "eventbridge" {
  source = "./eventbridge"
  
  rule_name                    = "${var.project_name}-${var.environment}-mediaconvert-rule"
  environment                  = var.environment
  notify_lambda_function_arn   = module.lambda_notify.function_arn
  notify_lambda_function_name  = module.lambda_notify.function_name
  dlq_arn                     = module.sqs.dlq_arn
  
  # オプション設定
  create_custom_bus   = false  # デフォルトEventBusを使用
  log_retention_days  = 14     # ログ保持期間：2週間
} 