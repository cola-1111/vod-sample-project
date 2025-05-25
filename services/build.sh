#!/bin/bash

# VOD Pipeline Lambda Functions Build Script
# Lambda関数のビルドとパッケージング自動化スクリプト

set -e  # エラー時にスクリプトを停止

# 色付きログ関数
log_info() {
    echo -e "\033[36m[INFO]\033[0m $1"
}

log_success() {
    echo -e "\033[32m[SUCCESS]\033[0m $1"
}

log_error() {
    echo -e "\033[31m[ERROR]\033[0m $1"
}

log_warning() {
    echo -e "\033[33m[WARNING]\033[0m $1"
}

# スクリプトのルートディレクトリ
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

log_info "VOD Pipeline Lambda Functions ビルド開始"
log_info "プロジェクトルート: $PROJECT_ROOT"

# Lambda関数のリスト
LAMBDA_FUNCTIONS=("submit-job" "notify")

# 各Lambda関数をビルド
for func in "${LAMBDA_FUNCTIONS[@]}"; do
    log_info "=== $func Lambda関数のビルド開始 ==="
    
    FUNC_DIR="$SCRIPT_DIR/$func"
    
    if [ ! -d "$FUNC_DIR" ]; then
        log_error "$func ディレクトリが見つかりません: $FUNC_DIR"
        exit 1
    fi
    
    cd "$FUNC_DIR"
    
    # package.jsonの存在確認
    if [ ! -f "package.json" ]; then
        log_error "$func/package.json が見つかりません"
        exit 1
    fi
    
    # 1. 既存のdistとnode_modulesをクリーンアップ
    log_info "$func: クリーンアップ実行中..."
    rm -rf dist/ node_modules/ *.zip
    
    # 2. 依存関係のインストール（本番用のみ）
    log_info "$func: 本番用依存関係をインストール中..."
    npm ci --only=production --silent
    
    # 3. TypeScriptビルド
    log_info "$func: TypeScriptコンパイル実行中..."
    
    # 開発依存関係を一時的にインストール（TypeScript等）
    npm install --silent
    npm run build
    
    if [ ! -d "dist" ]; then
        log_error "$func: ビルド失敗 - distディレクトリが作成されませんでした"
        exit 1
    fi
    
    # 4. 本番用依存関係の再インストール（クリーンな状態）
    log_info "$func: 本番用依存関係を再インストール中..."
    rm -rf node_modules/
    npm ci --only=production --silent
    
    # 5. 不要なファイルの除去
    log_info "$func: 不要なファイルを除去中..."
    
    # node_modulesから不要なファイルを削除
    find node_modules -name "*.md" -delete 2>/dev/null || true
    find node_modules -name "*.txt" -delete 2>/dev/null || true
    find node_modules -name "*.d.ts" -delete 2>/dev/null || true
    find node_modules -name "*.map" -delete 2>/dev/null || true
    find node_modules -name "test*" -type d -exec rm -rf {} + 2>/dev/null || true
    find node_modules -name "example*" -type d -exec rm -rf {} + 2>/dev/null || true
    find node_modules -name "doc*" -type d -exec rm -rf {} + 2>/dev/null || true
    
    # 6. zipファイルの作成
    ZIP_NAME="${func}.zip"
    log_info "$func: zipファイル作成中: $ZIP_NAME"
    
    # Lambda用zipファイルの作成（トップレベルに必要なファイルを配置）
    zip -r "$ZIP_NAME" dist/ node_modules/ -q
    
    if [ ! -f "$ZIP_NAME" ]; then
        log_error "$func: zipファイルの作成に失敗しました"
        exit 1
    fi
    
    # 7. zipファイルサイズの確認
    ZIP_SIZE=$(stat -c%s "$ZIP_NAME" 2>/dev/null || stat -f%z "$ZIP_NAME" 2>/dev/null)
    ZIP_SIZE_MB=$((ZIP_SIZE / 1024 / 1024))
    
    if [ $ZIP_SIZE_MB -gt 50 ]; then
        log_warning "$func: zipファイルサイズが大きいです: ${ZIP_SIZE_MB}MB"
        log_warning "Lambda関数の制限（50MB）に近づいています"
    else
        log_success "$func: zipファイル作成完了 (${ZIP_SIZE_MB}MB)"
    fi
    
    # 8. Terraformディストリビューション用にコピー
    TERRAFORM_DIST_DIR="$PROJECT_ROOT/terraform/dist"
    mkdir -p "$TERRAFORM_DIST_DIR"
    cp "$ZIP_NAME" "$TERRAFORM_DIST_DIR/"
    
    log_success "$func: Terraform用ディストリビューションファイルをコピーしました"
    
    log_success "=== $func Lambda関数のビルド完了 ==="
    echo
done

# 9. ビルド結果のサマリー
log_info "=== ビルド結果サマリー ==="
cd "$SCRIPT_DIR"

for func in "${LAMBDA_FUNCTIONS[@]}"; do
    if [ -f "$func/$func.zip" ]; then
        SIZE=$(stat -c%s "$func/$func.zip" 2>/dev/null || stat -f%z "$func/$func.zip" 2>/dev/null)
        SIZE_MB=$((SIZE / 1024 / 1024))
        log_success "$func: ビルド成功 (${SIZE_MB}MB)"
    else
        log_error "$func: ビルド失敗"
    fi
done

# 10. Terraformディストリビューション確認
log_info "Terraformディストリビューション:"
ls -la "$PROJECT_ROOT/terraform/dist/" 2>/dev/null || log_warning "Terraformディストリビューションディレクトリが作成されませんでした"

log_success "🎉 全Lambda関数のビルドが完了しました！"

# 11. 次のステップの案内
echo
log_info "📋 次のステップ:"
log_info "1. terraform plan を実行してデプロイを確認"
log_info "2. terraform apply を実行してAWSにデプロイ"
log_info "3. テスト用動画ファイルをS3にアップロードして動作確認"
echo 