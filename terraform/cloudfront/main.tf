// CloudFrontリソース作成用モジュールの雛形 

resource "aws_cloudfront_distribution" "this" {
  enabled             = true
  default_root_object = "index.html"

  origin {
    domain_name = var.s3_origin_domain_name
    origin_id   = "s3-origin"
  }

  default_cache_behavior {
    allowed_methods  = ["GET", "HEAD"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "s3-origin"
    viewer_protocol_policy = "redirect-to-https"
    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }
  }

  viewer_certificate {
    cloudfront_default_certificate = true
  }
} 