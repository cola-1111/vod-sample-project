// S3バケット作成用モジュールの雛形 

resource "aws_s3_bucket" "input" {
  bucket = var.input_bucket_name
}

resource "aws_s3_bucket" "output" {
  bucket = var.output_bucket_name
} 