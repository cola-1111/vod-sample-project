# VOD処理パイプライン - メインTerraform設定

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

# Lambda関数モジュール（SubmitJob）
module "lambda_submit_job" {
  source = "./lambda/submit_job"
  
  function_name = "${var.project_name}-${var.environment}-submit-job"
  handler      = "dist/handler.handler"
  runtime      = "nodejs18.x"
  role_arn     = module.iam.lambda_role_arn
  filename     = "../services/submit-job/dist/submit-job.zip"
  
  environment_variables = {
    INPUT_BUCKET  = module.s3.input_bucket_name
    OUTPUT_BUCKET = module.s3.output_bucket_name
    QUEUE_URL     = module.sqs.queue_url
    TEMPLATE_NAME = module.mediaconvert.template_name
  }
}

# Lambda関数モジュール（Notify）
module "lambda_notify" {
  source = "./lambda/notify"
  
  function_name = "${var.project_name}-${var.environment}-notify"
  handler      = "dist/handler.handler"
  runtime      = "nodejs18.x"
  role_arn     = module.iam.lambda_role_arn
  filename     = "../services/notify/dist/notify.zip"
  
  environment_variables = {
    OUTPUT_BUCKET = module.s3.output_bucket_name
  }
}

# CloudFrontディストリビューションモジュール
module "cloudfront" {
  source = "./cloudfront"
  
  s3_origin_domain_name = module.s3.output_bucket_regional_domain_name
} 