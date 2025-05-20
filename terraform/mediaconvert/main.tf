// MediaConvertリソース作成用モジュールの雛形 

data "aws_mediaconvert_endpoint" "this" {}

resource "aws_mediaconvert_queue" "default" {
  name = var.queue_name
}

resource "aws_mediaconvert_job_template" "default" {
  name     = var.job_template_name
  settings = file("${path.module}/template.json")
  category = var.job_template_category
  queue    = aws_mediaconvert_queue.default.arn
} 