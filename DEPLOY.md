# VOD処理パイプライン デプロイガイド

このドキュメントでは、VOD（Video on Demand）処理パイプラインのデプロイ方法を説明します。

## 🏗️ **アーキテクチャ概要**

```
S3 (入力) → SubmitJob Lambda → MediaConvert (720p最適化) → EventBridge
               ↓                                                  ↓
          SQS通知送信                                       Notify Lambda
                                                                 ↓
S3 (出力) ← CloudFront (グローバル配信) ← 出力ファイル検索 ← SQS/SNS通知
```

## 📋 **前提条件**

### AWS設定
- AWSアカウントとIAMユーザー（AdministratorAccess権限）
- AWS CLI設定済み
- Terraformバックエンド用S3バケット（terraform stateファイル保存用）

### 開発環境
- Node.js 18以上
- Terraform 1.5以上
- Git

## 🚀 **デプロイ方法**

### 1. ローカルデプロイ

#### ステップ1: Lambda関数のビルド
```bash
# プロジェクトルートで実行
cd services
npm install
chmod +x build.sh
./build.sh
```

#### ステップ2: Terraformでインフラデプロイ
```bash
cd terraform

# 初期化（初回のみ）
terraform init

# 変数設定
export TF_VAR_project_name="vod-sample"
export TF_VAR_environment="dev"
export TF_VAR_region="ap-northeast-1"
export TF_VAR_input_bucket_name="vod-sample-dev-input"
export TF_VAR_output_bucket_name="vod-sample-dev-output"
export TF_VAR_notification_email="admin@example.com"  # オプション（通知が必要な場合のみ設定）

# プラン確認
terraform plan

# デプロイ実行
terraform apply
```

#### ステップ3: S3イベント通知の設定
```bash
# SubmitJob Lambda関数のARNを取得
LAMBDA_ARN=$(terraform output -raw submit_job_function_arn)
INPUT_BUCKET=$(terraform output -raw input_bucket_name)

# S3バケットにイベント通知設定
aws s3api put-bucket-notification-configuration \
  --bucket $INPUT_BUCKET \
  --notification-configuration '{
    "LambdaConfigurations": [
      {
        "Id": "SubmitJobTrigger",
        "LambdaFunctionArn": "'$LAMBDA_ARN'",
        "Events": ["s3:ObjectCreated:*"],
        "Filter": {
          "Key": {
            "FilterRules": [
              {
                "Name": "suffix",
                "Value": ".mp4"
              }
            ]
          }
        }
      }
    ]
  }'
```

### 2. GitHub Actions CI/CDデプロイ

#### ステップ1: GitHub Secretsの設定

リポジトリの Settings → Secrets and variables → Actions で以下のシークレット変数を設定してください：

**開発環境用:**
- `AWS_ACCESS_KEY_ID`: IAMユーザーのアクセスキーID
- `AWS_SECRET_ACCESS_KEY`: IAMユーザーのシークレットアクセスキー
- `AWS_ACCOUNT_ID`: 12桁のAWSアカウントID
- `TERRAFORM_STATE_BUCKET`: Terraform状態ファイル保存用のS3バケット名

**本番環境用（必要に応じて）:**
- `AWS_ACCESS_KEY_ID_PROD`: 本番環境用アクセスキーID
- `AWS_SECRET_ACCESS_KEY_PROD`: 本番環境用シークレットアクセスキー
- `TERRAFORM_STATE_BUCKET_PROD`: 本番環境用状態ファイルS3バケット名

> ⚠️ **セキュリティ注意事項:**
> - IAMユーザーには最小限必要な権限のみを付与してください
> - アクセスキーは定期的にローテーションしてください
> - 本番環境では可能な限りIAMロールを使用することを推奨します

#### ステップ2: デプロイ実行

**開発環境へのデプロイ:**
```bash
# mainブランチにプッシュすると自動デプロイ
git push origin main
```

**本番環境へのデプロイ:**
```bash
# バージョンタグを作成してプッシュ
git tag v1.0.0
git push origin v1.0.0
```

## 🧪 **動作テスト**

### 1. 動画ファイルのアップロード
```bash
# テスト用MP4ファイルをS3にアップロード
INPUT_BUCKET=$(terraform output -raw input_bucket_name)
aws s3 cp test-video.mp4 s3://$INPUT_BUCKET/
```

### 2. 処理状況の監視
```bash
# CloudWatchでLambda関数のログを監視
aws logs tail /aws/lambda/vod-sample-dev-submit-job --follow
aws logs tail /aws/lambda/vod-sample-dev-notify --follow

# MediaConvertジョブの状況確認
aws mediaconvert list-jobs --max-results 10 --status PROGRESSING
```

### 3. 処理結果の確認
```bash
# 出力バケットの内容確認
OUTPUT_BUCKET=$(terraform output -raw output_bucket_name)
aws s3 ls s3://$OUTPUT_BUCKET/processed/ --recursive

# CloudFrontでの配信テスト
CLOUDFRONT_URL=$(terraform output -raw cloudfront_domain_name)
echo "配信URL: https://$CLOUDFRONT_URL/processed/test-video/hls/test-video_720p.m3u8"
```

## 📊 **監視とログ**

### CloudWatchダッシュボード
- Lambda関数の実行状況
- MediaConvertジョブの成功/失敗率
- S3バケットの使用量
- CloudFrontのアクセス状況

### ログの場所
- **SubmitJob Lambda**: `/aws/lambda/vod-sample-dev-submit-job`
- **Notify Lambda**: `/aws/lambda/vod-sample-dev-notify`
- **EventBridge**: `/aws/events/vod-sample-dev-mediaconvert-rule`

### アラート設定
```bash
# MediaConvertジョブ失敗時のアラート
aws cloudwatch put-metric-alarm \
  --alarm-name "MediaConvert-Job-Failures" \
  --alarm-description "MediaConvert job failure alert" \
  --metric-name "Errors" \
  --namespace "AWS/Events" \
  --statistic "Sum" \
  --period 300 \
  --threshold 1 \
  --comparison-operator "GreaterThanOrEqualToThreshold" \
  --evaluation-periods 1
```

## 🔧 **トラブルシューティング**

### よくある問題と解決法

#### 1. Lambda関数のデプロイエラー
```bash
# zipファイルのサイズ確認
ls -la terraform/dist/*.zip

# 依存関係の最適化
cd services
./build.sh
```

#### 2. MediaConvertジョブの失敗
```bash
# ジョブの詳細確認
aws mediaconvert get-job --id JOB_ID

# IAMロールの権限確認
aws iam get-role-policy --role-name ROLE_NAME --policy-name POLICY_NAME
```

#### 3. EventBridge連携の問題
```bash
# EventBridgeルールの確認
aws events list-rules --name-prefix vod-sample

# ターゲットの設定確認
aws events list-targets-by-rule --rule RULE_NAME
```

## 💰 **コスト最適化**

### 設定済みの最適化
- MediaConvert: 720p単一出力（70-80%コスト削減）
- S3: Intelligent Tiering
- CloudFront: 適切なキャッシュ設定
- Lambda: 本番用依存関係のみ

### 追加の最適化案
- S3 Lifecycle Policy設定
- CloudWatch Logs保持期間の調整
- 不要なリソースの定期削除

## 🔒 **セキュリティ**

### 実装済みのセキュリティ機能
- IAM最小権限の原則
- S3バケットのパブリックアクセスブロック
- CloudFront OAC（Origin Access Control）
- SQS/S3の暗号化

### セキュリティチェックリスト
- [ ] AWSアクセスキーの定期ローテーション
- [ ] IAMポリシーの定期見直し
- [ ] CloudTrailログの監視
- [ ] セキュリティグループの最小化

### 機密情報管理のベストプラクティス
- [ ] 環境変数を使用して機密情報をハードコード化しない
- [ ] .gitignoreファイルで機密ファイルを適切に除外
- [ ] GitHub Secretsやパラメータストアを活用した安全な設定管理
- [ ] 本番環境では一時的なアクセスキーではなくIAMロールを使用
- [ ] 定期的なセキュリティ監査の実施

## 📞 **サポート**

問題が発生した場合は、以下の情報と共にお問い合わせください：
- エラーメッセージの詳細
- CloudWatchログのスクリーンショット
- 実行したコマンドとその結果
- AWS環境の設定情報 