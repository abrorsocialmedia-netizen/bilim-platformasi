'use client';

import { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';

export function ProtectedVideoPlayer({ src, watermarkText }: { src: string; watermarkText: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [wmPosition, setWmPosition] = useState({ top: '10%', left: '10%' });

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let hls: Hls | null = null;
    if (src.includes('.m3u8') && Hls.isSupported()) {
      hls = new Hls();
      hls.loadSource(src);
      hls.attachMedia(video);
    } else {
      video.src = src;
    }

    return () => {
      hls?.destroy();
    };
  }, [src]);

  useEffect(() => {
    const interval = setInterval(() => {
      const top = `${Math.floor(Math.random() * 70) + 5}%`;
      const left = `${Math.floor(Math.random() * 70) + 5}%`;
      setWmPosition({ top, left });
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      className="relative aspect-video w-full overflow-hidden rounded-lg bg-black select-none"
      onContextMenu={(e) => e.preventDefault()}
    >
      <video
        ref={videoRef}
        controls
        controlsList="nodownload noremoteplayback"
        disablePictureInPicture
        className="h-full w-full"
        onContextMenu={(e) => e.preventDefault()}
      />
      <div
        className="pointer-events-none absolute select-none rounded bg-black/30 px-2 py-1 text-xs text-white/80 transition-all duration-1000"
        style={{ top: wmPosition.top, left: wmPosition.left }}
      >
        {watermarkText}
      </div>
    </div>
  );
}
