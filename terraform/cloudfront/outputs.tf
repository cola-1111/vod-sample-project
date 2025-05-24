output "distribution_id" {
  description = "CloudFrontディストリビューションのID"
  value       = aws_cloudfront_distribution.vod_distribution.id
}

output "domain_name" {
  description = "CloudFrontディストリビューションのドメイン名"
  value       = aws_cloudfront_distribution.vod_distribution.domain_name
}

output "distribution_arn" {
  description = "CloudFrontディストリビューションのARN"
  value       = aws_cloudfront_distribution.vod_distribution.arn
}

output "hosted_zone_id" {
  description = "CloudFrontディストリビューションのホストゾーンID"
  value       = aws_cloudfront_distribution.vod_distribution.hosted_zone_id
}

output "status" {
  description = "CloudFrontディストリビューションのステータス"
  value       = aws_cloudfront_distribution.vod_distribution.status
}

output "hls_streaming_url" {
  description = "HLS配信用のベースURL"
  value       = "https://${aws_cloudfront_distribution.vod_distribution.domain_name}/hls/"
}

output "thumbnail_url" {
  description = "サムネイル画像用のベースURL" 
  value       = "https://${aws_cloudfront_distribution.vod_distribution.domain_name}/thumbnails/"
} 