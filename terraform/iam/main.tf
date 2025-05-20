// IAMリソース作成用モジュールの雛形 

resource "aws_iam_role" "lambda" {
  name               = var.lambda_role_name
  assume_role_policy = file("${path.module}/assume_role_policy.json")
}

resource "aws_iam_policy" "mediaconvert" {
  name   = var.mediaconvert_policy_name
  policy = file("${path.module}/mediaconvert_policy.json")
}

resource "aws_iam_role_policy_attachment" "lambda_mediaconvert" {
  role       = aws_iam_role.lambda.name
  policy_arn = aws_iam_policy.mediaconvert.arn
} 