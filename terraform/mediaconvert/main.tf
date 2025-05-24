// MediaConvertリソース作成用モジュール

# MediaConvertエンドポイントの取得
data "aws_mediaconvert_endpoint" "this" {}

# MediaConvertキューの作成
resource "aws_mediaconvert_queue" "default" {
  name        = var.queue_name
  description = "VOD処理パイプライン用MediaConvertキュー"
  
  # 料金クラス（オンデマンド）
  pricing_plan = "ON_DEMAND"
  
  # ステータス（アクティブ）
  status = "ACTIVE"
  
  tags = {
    Name        = var.queue_name
    Environment = var.job_template_category
    Purpose     = "VOD-Processing"
  }
}

# MediaConvertジョブテンプレートの作成
resource "aws_mediaconvert_job_template" "default" {
  name        = var.job_template_name
  description = "VOD処理用ジョブテンプレート - HLS生成とサムネイル作成"
  category    = var.job_template_category
  queue       = aws_mediaconvert_queue.default.arn
  
  # テンプレート設定の読み込み
  settings_json = file("${path.module}/template.json")
  
  tags = {
    Name        = var.job_template_name
    Environment = var.job_template_category
    Purpose     = "VOD-Processing"
  }
} 