output "lambda_function_arn" {
  description = "SubmitJob Lambda関数のARN"
  value       = aws_lambda_function.function.arn
}

output "lambda_function_name" {
  description = "SubmitJob Lambda関数名"
  value       = aws_lambda_function.function.function_name
} 