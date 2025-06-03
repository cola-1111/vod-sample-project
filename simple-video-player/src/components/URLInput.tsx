"use client";

import { useState, useEffect } from 'react';

interface URLInputProps {
  onSubmit: (url: string) => void;
  currentUrl?: string;
  presetUrls?: { label: string; url: string }[];
}

const RECENT_URLS_KEY = 'video-player-recent-urls';
const MAX_RECENT_URLS = 5;

export default function URLInput({ 
  onSubmit, 
  currentUrl = '', 
  presetUrls = [] 
}: URLInputProps) {
  const [inputUrl, setInputUrl] = useState(currentUrl);
  const [error, setError] = useState<string | null>(null);
  const [recentUrls, setRecentUrls] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // localStorage から最近使用したURLを読み込み
  useEffect(() => {
    try {
      const saved = localStorage.getItem(RECENT_URLS_KEY);
      if (saved) {
        setRecentUrls(JSON.parse(saved));
      }
    } catch (error) {
      console.warn('Failed to load recent URLs:', error);
    }
  }, []);

  // 最近使用したURLをlocalStorageに保存
  const saveRecentUrl = (url: string) => {
    try {
      const updated = [url, ...recentUrls.filter(u => u !== url)].slice(0, MAX_RECENT_URLS);
      setRecentUrls(updated);
      localStorage.setItem(RECENT_URLS_KEY, JSON.stringify(updated));
    } catch (error) {
      console.warn('Failed to save recent URL:', error);
    }
  };

  // URL形式のバリデーション
  const validateUrl = (url: string): string | null => {
    if (!url.trim()) {
      return 'URLを入力してください';
    }

    // 基本的なURL形式チェック
    try {
      const urlObj = new URL(url);
      
      // プロトコルチェック
      if (!['http:', 'https:'].includes(urlObj.protocol)) {
        return 'http:// または https:// で始まるURLを入力してください';
      }

      // HLS形式チェック (.m3u8)
      if (!url.toLowerCase().includes('.m3u8')) {
        return 'HLS形式の動画(.m3u8)URLを入力してください';
      }

      return null;
    } catch {
      return '有効なURLを入力してください';
    }
  };

  // フォーム送信処理
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    const validationError = validateUrl(inputUrl);
    if (validationError) {
      setError(validationError);
      setIsLoading(false);
      return;
    }

    try {
      // URLの実際の存在確認（簡単なチェック）
      const response = await fetch(inputUrl, { method: 'HEAD' });
      if (!response.ok) {
        throw new Error('URLにアクセスできません');
      }

      // 成功時の処理
      saveRecentUrl(inputUrl);
      onSubmit(inputUrl);
    } catch (fetchError) {
      console.warn('URL validation failed:', fetchError);
      // ネットワークエラーでも一応URLを通す（CORS等の理由でチェックできない場合があるため）
      saveRecentUrl(inputUrl);
      onSubmit(inputUrl);
    } finally {
      setIsLoading(false);
    }
  };

  // プリセットURL選択
  const handlePresetSelect = (url: string) => {
    setInputUrl(url);
    setError(null);
  };

  // 最近使用したURL選択
  const handleRecentSelect = (url: string) => {
    setInputUrl(url);
    setError(null);
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-4">動画URL入力</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* URL入力フィールド */}
        <div>
          <label htmlFor="videoUrl" className="block text-sm font-medium text-gray-700 mb-2">
            CloudFront HLS動画URL
          </label>
          <input
            id="videoUrl"
            type="url"
            value={inputUrl}
            onChange={(e) => {
              setInputUrl(e.target.value);
              setError(null);
            }}
            placeholder="https://your-cloudfront-domain.com/video.m3u8"
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              error ? 'border-red-500' : 'border-gray-300'
            }`}
            disabled={isLoading}
          />
          {error && (
            <p className="mt-2 text-sm text-red-600">{error}</p>
          )}
        </div>

        {/* 送信ボタン */}
        <button
          type="submit"
          disabled={isLoading || !inputUrl.trim()}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? '確認中...' : '動画を読み込む'}
        </button>
      </form>

      {/* プリセットURL */}
      {presetUrls.length > 0 && (
        <div className="mt-6">
          <h3 className="text-sm font-medium text-gray-700 mb-2">プリセットURL</h3>
          <div className="space-y-2">
            {presetUrls.map((preset, index) => (
              <button
                key={index}
                onClick={() => handlePresetSelect(preset.url)}
                className="w-full text-left px-3 py-2 text-sm bg-gray-50 hover:bg-gray-100 rounded border transition-colors"
                disabled={isLoading}
              >
                <div className="font-medium text-gray-900">{preset.label}</div>
                <div className="text-gray-500 truncate">{preset.url}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 最近使用したURL */}
      {recentUrls.length > 0 && (
        <div className="mt-6">
          <h3 className="text-sm font-medium text-gray-700 mb-2">最近使用したURL</h3>
          <div className="space-y-2">
            {recentUrls.map((url, index) => (
              <button
                key={index}
                onClick={() => handleRecentSelect(url)}
                className="w-full text-left px-3 py-2 text-sm bg-blue-50 hover:bg-blue-100 rounded border border-blue-200 transition-colors"
                disabled={isLoading}
              >
                <div className="text-blue-800 truncate">{url}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ヘルプテキスト */}
      <div className="mt-6 p-3 bg-gray-50 rounded-md">
        <p className="text-xs text-gray-600">
          <strong>ヒント:</strong> CloudFrontから配信されるHLS形式(.m3u8)の動画URLを入力してください。
          例: https://d1234567890.cloudfront.net/video.m3u8
        </p>
      </div>
    </div>
  );
} 