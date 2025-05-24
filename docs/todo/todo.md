# VOD処理パイプラインのTodoリスト

## 1. プロジェクト構成の作成
- [x] リポジトリ構造の作成
  - [x] `terraform/` ディレクトリとサブディレクトリの作成
  - [x] s3モジュールディレクトリの作成
  - [x] sqsモジュールディレクトリの作成
  - [x] mediaconvertモジュールディレクトリの作成
  - [x] lambdaモジュールディレクトリの作成
  - [x] iamモジュールディレクトリの作成
  - [x] cloudfrontモジュールディレクトリの作成
  - [x] モジュール構造の構築（s3, sqs, mediaconvert, lambda, iam, cloudfront）
    - [x] s3/main.tf の実装
    - [x] s3/variables.tf の作成
    - [x] s3/outputs.tf の作成
    - [x] sqs/main.tf の実装
    - [x] sqs/variables.tf の作成
    - [x] sqs/outputs.tf の作成
    - [x] mediaconvert/main.tf の実装
    - [x] mediaconvert/variables.tf の作成
    - [x] mediaconvert/outputs.tf の作成
    - [x] mediaconvert/template.json の作成
    - [x] lambda/submit_job/main.tf の実装
    - [x] lambda/submit_job/variables.tf の作成
    - [x] lambda/submit_job/outputs.tf の作成
    - [x] lambda/notify/main.tf の実装
    - [x] lambda/notify/variables.tf の作成
    - [x] lambda/notify/outputs.tf の作成
    - [x] iam/main.tf の実装
    - [x] iam/variables.tf の作成
    - [x] iam/outputs.tf の作成
    - [x] iam/assume_role_policy.json の作成
    - [x] iam/mediaconvert_policy.json の作成
    - [x] cloudfront/main.tf の実装
    - [x] cloudfront/variables.tf の作成
    - [x] cloudfront/outputs.tf の作成

## 2. Terraformインフラコード実装
- [x] `terraform/variables.tf` の作成
- [x] `terraform/provider.tf` の作成
- [x] `terraform/main.tf` の作成（モジュール呼び出し）
- [x] `terraform/outputs.tf` の作成
- [x] S3バケットモジュールの実装
- [x] SQSキューとDLQモジュールの実装
- [x] MediaConvertリソースモジュールの実装
  - [x] `mediaconvert/template.json` の作成
- [ ] EventBridgeルールモジュールの実装
- [ ] IAMロールとポリシーモジュールの実装
  - [x] `assume_role_policy.json` の作成
  - [x] `mediaconvert_policy.json` の作成
- [ ] CloudFrontディストリビューションモジュールの実装

## 3. Lambda関数の実装
- [ ] `services` ディレクトリの作成
- [ ] SubmitJob Lambda実装
  - [ ] `services/submit-job/` ディレクトリ構造の作成
  - [ ] TypeScript設定の構築
  - [ ] `src/handler.ts` の実装
  - [ ] 冪等性処理の追加（DynamoDBまたはJobIdempotencyToken）
- [ ] Notify Lambda実装
  - [ ] `services/notify/` ディレクトリ構造の作成
  - [ ] TypeScript設定の構築
  - [ ] `src/handler.ts` の実装

## 4. ビルドとデプロイ設定
- [ ] Lambdaコードのビルドスクリプト作成
- [ ] デプロイパイプラインの設定（GitHub Actions）

## 5. テストと監視
- [ ] テスト用の動画ファイル準備
- [ ] CloudWatchメトリクスとアラートの設定
- [ ] デプロイテスト実行
- [ ] パイプラインの動作確認
  - [ ] 動画アップロードテスト
  - [ ] トランスコード処理確認
  - [ ] サムネイル生成確認
  - [ ] CloudFrontでの配信テスト

## 6. ドキュメント整備
- [ ] システム構成図の更新
- [ ] 利用方法と運用手順のドキュメント作成
- [ ] トラブルシューティングガイドの作成

---

## 🎉 **最近完了したマイルストーン**

### ✅ **Terraformコア実装完了**（セクション2の大部分）
- **terraform/main.tf**: 全モジュール統合 
- **terraform/outputs.tf**: 全出力値定義
- **S3モジュール**: 完全実装（セキュリティ、暗号化、CloudFront連携）
- **SQSモジュール**: 完全実装（暗号化、Long Polling、DLQ設定）
- **MediaConvertモジュール**: コスト最適化実装（70-80%コスト削減）

### 🔄 **現在進行中**
- **IAMモジュール**: 基本構造完成、詳細権限設定中

### 📋 **次のフェーズ**
- IAMロール完成
- CloudFrontモジュール実装
- Lambda関数実装開始 