"use client";

import { useState } from 'react';
import VideoPlayer from "@/components/VideoPlayer";
import URLInput from "@/components/URLInput";

export default function Home() {
  const [currentVideoUrl, setCurrentVideoUrl] = useState<string>('');
  const [videoTitle, setVideoTitle] = useState<string>('');

  // カスタムプリセットURL（実際のCloudFrontドメインに置き換え可能）
  const presetUrls = [
  ];

  // URL入力フォームからの送信処理
  const handleUrlSubmit = (url: string) => {
    setCurrentVideoUrl(url);
    // URLからファイル名を抽出してタイトルとして使用
    try {
      const urlObj = new URL(url);
      const filename = urlObj.pathname.split('/').pop() || 'Untitled Video';
      setVideoTitle(filename.replace('.m3u8', ''));
    } catch {
      setVideoTitle('動画');
    }
  };

  // 動画をクリア
  const handleClearVideo = () => {
    setCurrentVideoUrl('');
    setVideoTitle('');
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <header className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            HLS動画プレーヤー
          </h1>
          <p className="text-gray-600">
            CloudFront HLS配信対応のシンプルな動画プレーヤー
          </p>
        </header>

        <main className="space-y-8">
          {/* URL入力フォーム */}
          <URLInput 
            onSubmit={handleUrlSubmit}
            currentUrl={currentVideoUrl}
          />

          {/* 動画プレーヤー */}
          {currentVideoUrl && (
            <section className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-900">
                  動画プレーヤー
                </h2>
                <button
                  onClick={handleClearVideo}
                  className="px-3 py-1 text-sm bg-gray-200 hover:bg-gray-300 rounded transition-colors"
                >
                  クリア
                </button>
              </div>
              
              <VideoPlayer
                src={currentVideoUrl}
                title={videoTitle}
                controls={true}
                autoplay={false}
                className="w-full"
              />
              
              <div className="mt-4 p-3 bg-gray-50 rounded">
                <p className="text-xs text-gray-600">
                  <strong>再生中:</strong> {currentVideoUrl}
                </p>
              </div>
            </section>
          )}

          {/* VideoPlayerコンポーネント説明 */}
          <section className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">VideoPlayerコンポーネント</h2>
            <p className="text-gray-700 mb-4">
              HLS.jsを使用してHLS形式の動画を再生するReactコンポーネントです。
              CloudFrontから配信される動画を安全で高品質に再生できます。
            </p>
            <div className="bg-gray-100 rounded-md p-4">
              <p className="text-sm text-gray-600">
                <strong>ファイル位置:</strong> <code>src/components/VideoPlayer.tsx</code>
              </p>
            </div>
          </section>

          {/* Props仕様 */}
          <section className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Props仕様</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full table-auto">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">プロパティ</th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">型</th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">必須</th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">説明</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  <tr>
                    <td className="px-4 py-2 text-sm font-mono">src</td>
                    <td className="px-4 py-2 text-sm">string</td>
                    <td className="px-4 py-2 text-sm">✓</td>
                    <td className="px-4 py-2 text-sm">HLS動画のURL (CloudFront)</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2 text-sm font-mono">title</td>
                    <td className="px-4 py-2 text-sm">string</td>
                    <td className="px-4 py-2 text-sm">-</td>
                    <td className="px-4 py-2 text-sm">動画のタイトル</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2 text-sm font-mono">autoplay</td>
                    <td className="px-4 py-2 text-sm">boolean</td>
                    <td className="px-4 py-2 text-sm">-</td>
                    <td className="px-4 py-2 text-sm">自動再生 (デフォルト: false)</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2 text-sm font-mono">controls</td>
                    <td className="px-4 py-2 text-sm">boolean</td>
                    <td className="px-4 py-2 text-sm">-</td>
                    <td className="px-4 py-2 text-sm">コントロール表示 (デフォルト: true)</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2 text-sm font-mono">className</td>
                    <td className="px-4 py-2 text-sm">string</td>
                    <td className="px-4 py-2 text-sm">-</td>
                    <td className="px-4 py-2 text-sm">カスタムCSSクラス</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* 主な機能 */}
          <section className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">主な機能</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold text-gray-800 mb-2">VideoPlayer</h3>
                <ul className="space-y-2 text-gray-700">
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
                    HLS.jsによるHLS形式動画の再生
                  </li>
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
                    SafariでのネイティブHLS対応
                  </li>
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
                    エラーハンドリングとローディング状態表示
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-gray-800 mb-2">URLInput</h3>
                <ul className="space-y-2 text-gray-700">
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
                    URL形式とHLS形式のバリデーション
                  </li>
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
                    プリセットURLからの簡単選択
                  </li>
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
                    最近使用したURLの自動保存
                  </li>
                </ul>
              </div>
            </div>
          </section>

          {/* 使用方法 */}
          <section className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">使用方法</h2>
            <div className="bg-gray-100 rounded-md p-4">
              <pre className="text-sm text-gray-800 overflow-x-auto">
{`import VideoPlayer from "@/components/VideoPlayer";
import URLInput from "@/components/URLInput";

export default function MyPage() {
  const [videoUrl, setVideoUrl] = useState('');

  return (
    <div>
      <URLInput onSubmit={setVideoUrl} />
      {videoUrl && (
        <VideoPlayer
          src={videoUrl}
          title="動画タイトル"
          controls={true}
          autoplay={false}
          className="w-full"
        />
      )}
    </div>
  );
}`}
              </pre>
            </div>
          </section>

          {/* ブラウザ対応 */}
          <section className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">ブラウザ対応</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="font-semibold text-gray-800 mb-2">HLS.js対応</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Chrome, Firefox, Edge</li>
                  <li>• Android Chrome</li>
                  <li>• その他のモダンブラウザ</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-gray-800 mb-2">ネイティブHLS対応</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Safari (macOS)</li>
                  <li>• iOS Safari</li>
                  <li>• iPadOS Safari</li>
                </ul>
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
