"use client";

import { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';

interface VideoPlayerProps {
  src: string;  // HLS動画のURL (CloudFront)
  title?: string;
  autoplay?: boolean;
  controls?: boolean;
  className?: string;
}

export default function VideoPlayer({ 
  src, 
  title, 
  autoplay = false, 
  controls = true, 
  className 
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    setError(null);
    setLoading(true);

    // HLS.jsがサポートされているかチェック
    if (Hls.isSupported()) {
      // HLS.jsインスタンスを作成
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: false,
      });
      
      hlsRef.current = hls;

      // エラーハンドリング
      hls.on(Hls.Events.ERROR, (event, data) => {
        console.error('HLS Error:', data);
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              setError('ネットワークエラーが発生しました');
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              setError('メディアエラーが発生しました');
              break;
            default:
              setError('動画の再生でエラーが発生しました');
              break;
          }
        }
      });

      // HLSマニフェストロード完了時
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        console.log('HLS manifest parsed successfully');
      });

      // HLSストリームをvideoエレメントにアタッチ
      hls.loadSource(src);
      hls.attachMedia(video);

    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      // ネイティブHLS対応ブラウザ（Safari）での直接再生
      video.src = src;
      video.addEventListener('error', () => {
        setError('動画の再生でエラーが発生しました');
      });
    } else {
      setError('このブラウザではHLS動画の再生がサポートされていません');
    }

    // クリーンアップ関数
    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [src]);

  return (
    <div className={className}>
      {title && <h2 className="mb-4 text-xl font-bold">{title}</h2>}
      {error && (
        <div className="text-red-500 mb-4 p-3 bg-red-50 border border-red-200 rounded">
          エラー: {error}
        </div>
      )}
      {loading && (
        <div className="text-gray-500 mb-4 p-3 bg-gray-50 border border-gray-200 rounded">
          読み込み中...
        </div>
      )}
      <video
        ref={videoRef}
        controls={controls}
        autoPlay={autoplay}
        className="w-full h-auto rounded-lg shadow-md"
        onLoadStart={() => setLoading(true)}
        onCanPlay={() => setLoading(false)}
        onError={() => setError('動画の読み込みでエラーが発生しました')}
        preload="metadata"
      >
        お使いのブラウザでは動画を再生できません。
      </video>
    </div>
  );
} 