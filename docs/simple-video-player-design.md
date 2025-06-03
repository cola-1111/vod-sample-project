# シンプル動画プレーヤー設計書 (HLS対応)

## 概要
CloudFrontに配置されたHLS形式の動画ファイルを再生するためのシンプルなWebフロントエンドを構築します。

## 技術スタック

### フロントエンド
- **Next.js 14** (App Router)
- **TypeScript**
- **Tailwind CSS**
- **HLS.js** (HLS動画再生)

### 最小限の依存関係
```bash
npm install hls.js
npm install lucide-react  # アイコン用
```

## 機能要件

### 基本機能のみ
- HLS形式動画の再生
- 基本的な動画コントロール (再生/一時停止、シーク、音量)
- レスポンシブ対応
- 動画URL入力機能

## 技術仕様

### シンプルなディレクトリ構造
```
src/
├── app/
│   ├── page.tsx           # メインページ
│   ├── layout.tsx         # 基本レイアウト
│   └── globals.css        # スタイル
├── components/
│   ├── VideoPlayer.tsx    # HLS動画プレーヤー
│   └── URLInput.tsx       # URL入力フォーム
└── types/
    └── video.ts           # 基本型定義
```

### データ型定義

```typescript
// types/video.ts
export interface VideoSource {
  url: string;
  type: 'hls' | 'mp4';
  title?: string;
}

export interface PlayerState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  muted: boolean;
}
```

## 実装指示書

### Phase 1: プロジェクト作成
```bash
# Next.jsプロジェクト作成
npx create-next-app@latest simple-video-player --typescript --tailwind --eslint --app

# HLS.js インストール
npm install hls.js
npm install @types/hls.js --save-dev
npm install lucide-react
```

### Phase 2: HLS動画プレーヤー実装

#### AI実装指示プロンプト
```
CloudFrontのHLS動画を再生するシンプルな動画プレーヤーを実装してください：

ファイル: src/components/VideoPlayer.tsx

要件:
1. HLS.jsを使用してHLS形式の動画を再生
2. TypeScriptで型安全性を確保
3. 基本的なHTML5 videoコントロール
4. レスポンシブデザイン
5. エラーハンドリング

Props型定義:
```typescript
interface VideoPlayerProps {
  src: string;  // HLS動画のURL (CloudFront)
  title?: string;
  autoplay?: boolean;
  controls?: boolean;
  className?: string;
}
```

実装要件:
- HLS.jsによるHLS形式サポート
- フォールバック：ネイティブHLS対応ブラウザ（Safari）での直接再生
- エラー時の適切なメッセージ表示
- ローディング状態の表示

コード例:
```typescript
import { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';

interface VideoPlayerProps {
  src: string;
  title?: string;
  autoplay?: boolean;
  controls?: boolean;
  className?: string;
}

export default function VideoPlayer({ src, title, autoplay = false, controls = true, className }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // HLS.js実装
    // エラーハンドリング
    // クリーンアップ
  }, [src]);

  return (
    <div className={className}>
      {title && <h2 className="mb-4 text-xl font-bold">{title}</h2>}
      {error && <div className="text-red-500 mb-4">エラー: {error}</div>}
      {loading && <div className="text-gray-500 mb-4">読み込み中...</div>}
      <video
        ref={videoRef}
        controls={controls}
        autoPlay={autoplay}
        className="w-full h-auto"
        onLoadStart={() => setLoading(true)}
        onCanPlay={() => setLoading(false)}
      />
    </div>
  );
}
```
```

### Phase 3: URL入力フォーム実装

#### AI実装指示プロンプト
```
CloudFrontの動画URLを入力するシンプルなフォームを実装してください：

ファイル: src/components/URLInput.tsx

要件:
1. URL入力フィールド
2. 入力値のバリデーション
3. プリセットURL（よく使用するCloudFrontドメイン）
4. 送信ボタン

Props型定義:
```typescript
interface URLInputProps {
  onSubmit: (url: string) => void;
  currentUrl?: string;
  presetUrls?: { label: string; url: string }[];
}
```

機能:
- URL形式の簡単なバリデーション
- HLS (.m3u8) ファイルの検証
- プリセットURLからの選択
- 最近使用したURLの保存（localStorage）
```

### Phase 4: メインページ実装

#### AI実装指示プロンプト
```
動画プレーヤーとURL入力を統合したメインページを実装してください：

ファイル: src/app/page.tsx

要件:
1. URLInputコンポーネントとVideoPlayerコンポーネントの統合
2. 状態管理（useState）
3. エラーハンドリング
4. レスポンシブレイアウト

機能:
- URL入力後に動画プレーヤーを表示
- 動画の切り替え
- エラー状態の表示
- シンプルなUI

レイアウト:
```tsx
export default function Home() {
  const [currentVideoUrl, setCurrentVideoUrl] = useState<string>('');
  
  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">HLS動画プレーヤー</h1>
      
      <div className="mb-8">
        <URLInput onSubmit={setCurrentVideoUrl} currentUrl={currentVideoUrl} />
      </div>
      
      {currentVideoUrl && (
        <div className="mb-8">
          <VideoPlayer src={currentVideoUrl} title="CloudFront HLS動画" />
        </div>
      )}
    </main>
  );
}
```
```

## 使用例

### CloudFront HLS URL例
```
https://d1234567890abcd.cloudfront.net/videos/sample/playlist.m3u8
```

### プリセットURL設定例
```typescript
const presetUrls = [
  {
    label: 'サンプル動画1',
    url: 'https://your-cloudfront-domain.net/video1/playlist.m3u8'
  },
  {
    label: 'サンプル動画2', 
    url: 'https://your-cloudfront-domain.net/video2/playlist.m3u8'
  }
];
```

## デプロイメント

### Vercel デプロイ
```bash
# Vercelにデプロイ
npm install -g vercel
vercel
```

### 環境変数（必要に応じて）
```
NEXT_PUBLIC_CLOUDFRONT_DOMAIN=your-cloudfront-domain.net
```

## 特記事項

### HLS.js vs ネイティブHLS
- **Safari**: ネイティブHLS対応のため直接再生
- **Chrome/Firefox/Edge**: HLS.jsを使用
- 自動判定とフォールバック実装

### CloudFront設定
- CORS設定が必要
- 適切なキャッシュヘッダー設定

### セキュリティ
- CSP（Content Security Policy）設定
- 信頼できるCloudFrontドメインのみ許可

---

## 完全なAI実装指示プロンプト

```
CloudFrontにあるHLS動画を再生するシンプルなNext.jsアプリケーションを実装してください。

技術要件:
- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- HLS.js

機能要件:
1. HLS動画URL入力フォーム
2. HLS.jsベースの動画プレーヤー
3. レスポンシブデザイン
4. エラーハンドリング

実装するファイル:
1. src/app/page.tsx - メインページ
2. src/components/VideoPlayer.tsx - HLS動画プレーヤー
3. src/components/URLInput.tsx - URL入力フォーム
4. src/types/video.ts - 型定義

プロジェクト作成コマンド:
```bash
npx create-next-app@latest simple-video-player --typescript --tailwind --eslint --app
cd simple-video-player
npm install hls.js @types/hls.js lucide-react
```

HLS.jsの実装:
- Safari等のネイティブHLS対応ブラウザとの互換性
- 適切なエラーハンドリング
- メモリリーク防止のクリーンアップ

URL入力機能:
- .m3u8 ファイルの簡単なバリデーション
- localStorage でURL履歴保存
- プリセットURL対応

シンプルで実用的な動画確認ツールとして実装してください。
```

この簡易版設計で、CloudFrontのHLS動画を素早く確認できるツールが作成できます。 