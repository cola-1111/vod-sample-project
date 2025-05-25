# VOD処理パイプライン - Terraform設定

## デプロイ手順

### 1. 初期化（プロファイル指定）

```bash
# デフォルト設定で初期化
terraform init -backend-config=backend-config.hcl

# 開発環境用プロファイルで初期化
terraform init -backend-config=backend-dev.hcl

# 本番環境用プロファイルで初期化
terraform init -backend-config=backend-prod.hcl
```

### 2. 計画の確認

```bash
terraform plan
```

### 3. デプロイの実行

```bash
terraform apply
```

### 4. リソースの削除

```bash
terraform destroy
```

## バックエンド設定ファイル

- `backend-config.hcl`: デフォルト設定（profileは"default"）
- `backend-dev.hcl`: 開発環境用設定（profileは"dev"）
- `backend-prod.hcl`: 本番環境用設定（profileは"prod"）

## 事前準備

1. S3バケットの作成（Terraformステート用）
2. DynamoDBテーブルの作成（ステートロック用）
3. `provider.tf`内の`YOUR_TERRAFORM_STATE_BUCKET`を実際のバケット名に変更

```bash
# S3バケット作成例
aws s3 mb s3://your-terraform-state-bucket --profile your-profile

# DynamoDBテーブル作成例
aws dynamodb create-table \
  --table-name terraform-state-lock \
  --attribute-definitions AttributeName=LockID,AttributeType=S \
  --key-schema AttributeName=LockID,KeyType=HASH \
  --provisioned-throughput ReadCapacityUnits=5,WriteCapacityUnits=5 \
  --profile your-profile
```

## 必要な変数

以下の変数を`terraform.tfvars`ファイルまたはコマンドライン引数で指定してください：

- `project_name`: プロジェクト名
- `environment`: 環境名（dev, staging, prod等）
- `region`: AWSリージョン
- `notification_email`: 通知用メールアドレス（オプション） 