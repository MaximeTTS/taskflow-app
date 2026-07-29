'use client';

import { useTfTheme, TF_BACKGROUNDS } from './theme';

/**
 * Site background. Two modes (chosen in the Apparence panel, persisted):
 *  - mesh: animated mesh-gradient blobs + aurora + stars (per-theme colors)
 *  - video: a looping, muted, full-bleed background video with a theme scrim
 * Both sit behind the glass at z-index 0.
 */
export function TfBackground() {
  const { bg } = useTfTheme();
  const option = TF_BACKGROUNDS.find((o) => o.id === bg);
  const videoSrc = option?.src ?? null;

  if (videoSrc) {
    // Raw video — no scrim/filter (shown exactly as uploaded).
    return (
      <div className="tf-bg" aria-hidden="true">
        <video
          key={videoSrc}
          className="tf-bg-video"
          src={videoSrc}
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
        />
      </div>
    );
  }

  return (
    <div className="tf-bg" aria-hidden="true">
      <div className="tf-aurora" />
      <div className="tf-blob tf-blob-1" />
      <div className="tf-blob tf-blob-2" />
      <div className="tf-blob tf-blob-3" />
      <div className="tf-blob tf-blob-4" />
      <div className="tf-stars" />
    </div>
  );
}
