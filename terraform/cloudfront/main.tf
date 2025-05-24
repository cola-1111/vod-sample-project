// CloudFrontリソース作成用モジュールの雛形 

# CloudFrontディストリビューション作成用モジュール - VOD配信最適化版

# Origin Access Control (OAC) - S3へのセキュアなアクセス
resource "aws_cloudfront_origin_access_control" "s3_oac" {
  name                              = "vod-s3-oac"
  description                       = "VOD配信用S3 Origin Access Control"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

# CloudFrontディストリビューション
resource "aws_cloudfront_distribution" "vod_distribution" {
  comment             = "VOD配信用CloudFrontディストリビューション"
  enabled             = true
  is_ipv6_enabled     = true
  price_class         = "PriceClass_All"
  wait_for_deployment = false

  # S3オリジン設定
  origin {
    domain_name              = var.s3_origin_domain_name
    origin_id                = "vod-s3-origin"
    origin_access_control_id = aws_cloudfront_origin_access_control.s3_oac.id

    # カスタムヘッダー追加
    custom_header {
      name  = "X-VOD-Origin"
      value = "cloudfront"
    }
  }

  # HLSマニフェストファイル用キャッシュビヘイビア (.m3u8)
  ordered_cache_behavior {
    path_pattern     = "*.m3u8"
    allowed_methods  = ["GET", "HEAD", "OPTIONS"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "vod-s3-origin"
    compress         = true

    forwarded_values {
      query_string = true
      headers      = ["Origin", "Access-Control-Request-Headers", "Access-Control-Request-Method"]
      
      cookies {
        forward = "none"
      }
    }

    viewer_protocol_policy = "redirect-to-https"
    min_ttl                = 0
    default_ttl            = 10        # 10秒 - ライブ配信に近い体験
    max_ttl                = 86400     # 24時間
  }

  # HLSセグメントファイル用キャッシュビヘイビア (.ts)
  ordered_cache_behavior {
    path_pattern     = "*.ts"
    allowed_methods  = ["GET", "HEAD", "OPTIONS"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "vod-s3-origin"
    compress         = false  # 動画ファイルは既に圧縮済み

    forwarded_values {
      query_string = false
      headers      = ["Origin", "Access-Control-Request-Headers", "Access-Control-Request-Method"]
      
      cookies {
        forward = "none"
      }
    }

    viewer_protocol_policy = "redirect-to-https"
    min_ttl                = 86400     # 1日
    default_ttl            = 604800    # 7日間
    max_ttl                = 31536000  # 1年間 - セグメントは変更されないため長期キャッシュ
  }

  # サムネイル画像用キャッシュビヘイビア
  ordered_cache_behavior {
    path_pattern     = "thumbnails/*"
    allowed_methods  = ["GET", "HEAD", "OPTIONS"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "vod-s3-origin"
    compress         = true

    forwarded_values {
      query_string = false
      headers      = ["Origin", "Access-Control-Request-Headers", "Access-Control-Request-Method"]
      
      cookies {
        forward = "none"
      }
    }

    viewer_protocol_policy = "redirect-to-https"
    min_ttl                = 86400     # 1日
    default_ttl            = 604800    # 7日間
    max_ttl                = 31536000  # 1年間
  }

  # デフォルトキャッシュビヘイビア (その他のファイル)
  default_cache_behavior {
    allowed_methods        = ["GET", "HEAD", "OPTIONS"]
    cached_methods         = ["GET", "HEAD"]
    target_origin_id       = "vod-s3-origin"
    compress               = true
    viewer_protocol_policy = "redirect-to-https"

    forwarded_values {
      query_string = false
      headers      = ["Origin", "Access-Control-Request-Headers", "Access-Control-Request-Method"]
      
      cookies {
        forward = "none"
      }
    }

    min_ttl     = 0
    default_ttl = 3600     # 1時間
    max_ttl     = 86400    # 24時間
  }

  # SSL証明書設定
  viewer_certificate {
    cloudfront_default_certificate = true
    minimum_protocol_version       = "TLSv1.2_2021"
  }

  # 地理的制限
  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  # カスタムエラーページ
  custom_error_response {
    error_code            = 403
    error_caching_min_ttl = 10
    response_code         = 404
    response_page_path    = "/error.html"
  }

  custom_error_response {
    error_code            = 404
    error_caching_min_ttl = 10
    response_code         = 404
    response_page_path    = "/error.html"
  }

  # タグ設定
  tags = {
    Name        = "vod-distribution"
    Purpose     = "VOD-Content-Delivery"
    Environment = "production"
  }
}

# S3バケットポリシー - CloudFrontからのアクセスのみ許可
resource "aws_s3_bucket_policy" "cloudfront_access" {
  bucket = replace(var.s3_origin_domain_name, ".s3.${data.aws_region.current.name}.amazonaws.com", "")

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowCloudFrontServicePrincipal"
        Effect = "Allow"
        Principal = {
          Service = "cloudfront.amazonaws.com"
        }
        Action   = "s3:GetObject"
        Resource = "arn:aws:s3:::${replace(var.s3_origin_domain_name, ".s3.${data.aws_region.current.name}.amazonaws.com", "")}/*"
        Condition = {
          StringEquals = {
            "AWS:SourceArn" = aws_cloudfront_distribution.vod_distribution.arn
          }
        }
      }
    ]
  })
}

# 現在のリージョン情報取得
data "aws_region" "current" {} 