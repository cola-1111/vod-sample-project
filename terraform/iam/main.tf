// IAMリソース作成用モジュール

# Lambda実行ロール
resource "aws_iam_role" "lambda" {
  name               = var.lambda_role_name
  assume_role_policy = file("${path.module}/assume_role_policy.json")
  
  tags = {
    Name    = var.lambda_role_name
    Purpose = "VOD-Lambda-Execution"
  }
}

# MediaConvert実行ロール
resource "aws_iam_role" "mediaconvert" {
  name               = "${var.lambda_role_name}-mediaconvert"
  assume_role_policy = file("${path.module}/mediaconvert_assume_role_policy.json")
  
  tags = {
    Name    = "${var.lambda_role_name}-mediaconvert"
    Purpose = "VOD-MediaConvert-Execution"
  }
}

# Lambda基本実行ポリシー（CloudWatchログ）
resource "aws_iam_role_policy_attachment" "lambda_basic_execution" {
  role       = aws_iam_role.lambda.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

# Lambda用S3アクセスポリシー
resource "aws_iam_policy" "lambda_s3_access" {
  name        = "${var.lambda_role_name}-s3-access"
  description = "Lambda用S3バケットアクセス権限"
  policy      = file("${path.module}/lambda_s3_policy.json")
  
  tags = {
    Name    = "${var.lambda_role_name}-s3-access"
    Purpose = "VOD-Lambda-S3-Access"
  }
}

# Lambda用SQSアクセスポリシー
resource "aws_iam_policy" "lambda_sqs_access" {
  name        = "${var.lambda_role_name}-sqs-access"
  description = "Lambda用SQSキューアクセス権限"
  policy      = file("${path.module}/lambda_sqs_policy.json")
  
  tags = {
    Name    = "${var.lambda_role_name}-sqs-access"
    Purpose = "VOD-Lambda-SQS-Access"
  }
}

# Lambda用MediaConvertアクセスポリシー
resource "aws_iam_policy" "lambda_mediaconvert_access" {
  name        = var.mediaconvert_policy_name
  description = "Lambda用MediaConvertアクセス権限"
  policy      = file("${path.module}/lambda_mediaconvert_policy.json")
  
  tags = {
    Name    = var.mediaconvert_policy_name
    Purpose = "VOD-Lambda-MediaConvert-Access"
  }
}

# MediaConvert用S3アクセスポリシー
resource "aws_iam_policy" "mediaconvert_s3_access" {
  name        = "${var.lambda_role_name}-mediaconvert-s3-access"
  description = "MediaConvert用S3バケットアクセス権限"
  policy      = file("${path.module}/mediaconvert_s3_policy.json")
  
  tags = {
    Name    = "${var.lambda_role_name}-mediaconvert-s3-access"
    Purpose = "VOD-MediaConvert-S3-Access"
  }
}

# Lambda用ポリシーアタッチメント
resource "aws_iam_role_policy_attachment" "lambda_s3_access" {
  role       = aws_iam_role.lambda.name
  policy_arn = aws_iam_policy.lambda_s3_access.arn
}

resource "aws_iam_role_policy_attachment" "lambda_sqs_access" {
  role       = aws_iam_role.lambda.name
  policy_arn = aws_iam_policy.lambda_sqs_access.arn
}

resource "aws_iam_role_policy_attachment" "lambda_mediaconvert_access" {
  role       = aws_iam_role.lambda.name
  policy_arn = aws_iam_policy.lambda_mediaconvert_access.arn
}

# MediaConvert用ポリシーアタッチメント
resource "aws_iam_role_policy_attachment" "mediaconvert_s3_access" {
  role       = aws_iam_role.mediaconvert.name
  policy_arn = aws_iam_policy.mediaconvert_s3_access.arn
} 