output "cloudfront_distribution_id" {
  description = "CloudFrontディストリビューションのID"
  value       = aws_cloudfront_distribution.this.id
}

output "cloudfront_domain_name" {
  description = "CloudFrontディストリビューションのドメイン名"
  value       = aws_cloudfront_distribution.this.domain_name
} 