import React, { useState, useRef, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { isSameDay } from 'date-fns';
import { useMusicPlayer } from '../context/MusicPlayerContext';
import { useData } from '../hooks/useData';
import { useTranslation } from '../lib/i18n';
import { gymAudio } from '../lib/audio';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(s: number) {
  if (isNaN(s) || !isFinite(s) || s < 0) return '00:00';
  const mins = Math.floor(s / 60);
  const secs = Math.floor(s % 60);
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

// ─── SVG Icons ────────────────────────────────────────────────────────────────

const PlayIcon = ({ s = 20 }: { s?: number }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="currentColor">
    <path d="M8 5.14v14l11-7-11-7z" />
  </svg>
);

const PauseIcon = ({ s = 20 }: { s?: number }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="currentColor">
    <rect x="6" y="4" width="4" height="16" rx="1" />
    <rect x="14" y="4" width="4" height="16" rx="1" />
  </svg>
);

const SkipNextIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
  </svg>
);

const SkipPrevIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M6 6h2v12H6zm3.5 6 8.5 6V6z" />
  </svg>
);

const ShuffleIcon = ({ on }: { on: boolean }) => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill={on ? '#c6f432' : '#475569'}>
    <path d="M10.59 9.17 5.41 4 4 5.41l5.17 5.17 1.42-1.41zM14.5 4l2.04 2.04L4 18.59 5.41 20 17.96 7.46 20 9.5V4h-5.5zm.33 9.41-1.41 1.41 3.13 3.13L14.5 20H20v-5.5l-2.04 2.04-3.13-3.13z" />
  </svg>
);

const RepeatIcon = ({ mode }: { mode: 'off' | 'all' | 'one' }) => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill={mode !== 'off' ? '#c6f432' : '#475569'}>
    {mode === 'one' ? (
      <path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4zm-4-2V9h-1l-2 1v1h1.5v4H13z" />
    ) : (
      <path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z" />
    )}
  </svg>
);

const HeartIcon = ({ on }: { on: boolean }) => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill={on ? '#f43f5e' : 'none'} stroke={on ? '#f43f5e' : '#64748b'} strokeWidth="2">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
  </svg>
);

const VolHigh = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="#64748b">
    <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3A4.5 4.5 0 0 0 14 7.97v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
  </svg>
);

const VolLow = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="#64748b">
    <path d="M18.5 12A4.5 4.5 0 0 0 16 7.97v8.05c1.48-.73 2.5-2.25 2.5-4.02zM5 9v6h4l5 5V4L9 9H5z" />
  </svg>
);

const VolMute = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="#ef4444">
    <path d="M16.5 12A4.5 4.5 0 0 0 14 7.97v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51A8.796 8.796 0 0 0 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3 3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06a8.99 8.99 0 0 0 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4 9.91 6.09 12 8.18V4z" />
  </svg>
);

const ChevronDown = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
    <path d="M7.41 8.59 12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z" />
  </svg>
);

const ChevronUp = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
    <path d="M7.41 15.41 12 10.83l4.59 4.58L18 14l-6-6-6 6 1.41 1.41z" />
  </svg>
);

const BtIcon = () => (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.71 7.71 12 2h-1v7.59L6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 11 14.41V22h1l5.71-5.71-4.3-4.29 4.3-4.29zM13 5.83l1.88 1.88L13 9.59V5.83zm1.88 10.46L13 18.17v-3.76l1.88 1.88z" />
  </svg>
);

const AirplayIcon = () => (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
    <path d="M6 22h12l-6-6-6 6zM21 3H3c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h4v-2H3V5h18v12h-4v2h4c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z" />
  </svg>
);

const MusicIcon = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
  </svg>
);

const FolderPlusIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z" />
    <line x1="12" y1="10" x2="12" y2="16" />
    <line x1="9" y1="13" x2="15" y2="13" />
  </svg>
);

// Mini SVG ring progress
function Ring({ pct }: { pct: number }) {
  const r = 9;
  const c = 2 * Math.PI * r;
  const clampedPct = Math.max(0, Math.min(1, pct || 0));

  return (
    <svg width="26" height="26" viewBox="0 0 26 26" style={{ transform: 'rotate(-90deg)', flexShrink: 0 }}>
      <circle cx="13" cy="13" r={r} fill="none" stroke="rgba(51,65,85,0.8)" strokeWidth="2.5" />
      <circle
        cx="13"
        cy="13"
        r={r}
        fill="none"
        stroke="#c6f432"
        strokeWidth="2.5"
        strokeDasharray={`${c * clampedPct} ${c}`}
        strokeLinecap="round"
        style={{ transition: 'stroke-dasharray 0.3s ease' }}
      />
    </svg>
  );
}

export function NowPlayingMusicWidget() {
  const {
    tracks,
    currentTrackIndex,
    currentTrack,
    isPlaying,
    elapsed,
    duration,
    volume,
    isMuted,
    isShuffle,
    repeatMode,
    isExpanded,
    isOpen,
    likedTrackIds,
    togglePlay,
    nextTrack,
    prevTrack,
    seek,
    setVolumeLevel,
    toggleMute,
    toggleShuffle,
    toggleRepeat,
    toggleLike,
    selectTrack,
    setExpanded,
    setIsOpen,
    addDeviceTrack
  } = useMusicPlayer();

  const { isRTL } = useTranslation();
  const { data } = useData();
  const location = useLocation();
  const isInSession = location.pathname.startsWith('/session/');

  const hasLiveWorkoutBar = useMemo(() => {
    if (isInSession || !data?.sessions) return false;
    const today = new Date();
    if (today.getDay() === 5) return false;
    return data.sessions.some(
      s => isSameDay(new Date(s.date), today) && !s.isCompleted
    );
  }, [isInSession, data?.sessions]);

  const [imgError, setImgError] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const pct = duration > 0 ? elapsed / duration : 0;
  const vol = isMuted ? 0 : volume;

  const handleSeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    seek(Math.round(val * duration));
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolumeLevel(val);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      for (let i = 0; i < files.length; i++) {
        addDeviceTrack(files[i]);
      }
      gymAudio.triggerSubtleHaptic([20, 30]);
    }
  };

  const sliderStyle = (val: number): React.CSSProperties => ({
    background: `linear-gradient(to right, #c6f432 ${val * 100}%, rgba(51,65,85,0.7) ${val * 100}%)`
  });

  const SourceBadge = () => {
    let icon = <MusicIcon />;
    if (currentTrack.source === 'Bluetooth') icon = <BtIcon />;
    if (currentTrack.source === 'AirPlay') icon = <AirplayIcon />;
    if (currentTrack.source === 'Device File') icon = <FolderPlusIcon />;

    return (
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.25rem',
          padding: '0.15rem 0.5rem',
          borderRadius: '999px',
          background: 'rgba(51, 65, 85, 0.6)',
          fontSize: '0.65rem',
          color: '#94a3b8',
          fontWeight: 600
        }}
      >
        {icon}
        <span>{currentTrack.source}</span>
      </span>
    );
  };

  const VolumeIcon = () => (isMuted || volume === 0 ? <VolMute /> : volume < 0.4 ? <VolLow /> : <VolHigh />);

  return (
    <div
      style={{
        position: 'fixed',
        bottom: hasLiveWorkoutBar 
          ? 'calc(156px + max(0px, env(safe-area-inset-bottom, 0px)))' 
          : 'calc(80px + max(0px, env(safe-area-inset-bottom, 0px)))',
        insetInlineEnd: 'clamp(8px, 2.5vw, 20px)',
        zIndex: 9998,
        transition: 'bottom 0.25s ease',
        direction: 'ltr' // Player controls maintain universal standard LTR orientation for audio timeline
      }}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="audio/*"
        multiple
        style={{ display: 'none' }}
        onChange={handleFileInput}
      />

      <AnimatePresence mode="wait">
        {isExpanded ? (
          /* ─── Expanded Mode (Card) ─────────────────────────────────── */
          <motion.div
            key="expanded"
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            transition={{ type: 'spring', stiffness: 380, damping: 28 }}
            className="now-playing-glass"
            style={{
              width: 'min(350px, calc(100vw - 20px))',
              maxWidth: 'calc(100vw - 20px)',
              borderRadius: '24px',
              position: 'relative',
              overflow: 'hidden',
              userSelect: 'none'
            }}
          >
            {/* Ambient Top Glow */}
            <div
              style={{
                position: 'absolute',
                top: -40,
                left: -40,
                width: 220,
                height: 220,
                background: 'radial-gradient(circle, rgba(198, 244, 50, 0.14) 0%, transparent 70%)',
                filter: 'blur(24px)',
                pointerEvents: 'none'
              }}
            />

            {/* Header: Label + Device Upload + Close/Minimize */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '1rem 1.15rem 0.25rem',
                position: 'relative',
                zIndex: 1
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <span
                  style={{
                    fontSize: '0.65rem',
                    fontWeight: 800,
                    letterSpacing: '0.12em',
                    color: '#c6f432',
                    textTransform: 'uppercase'
                  }}
                >
                  NOW PLAYING
                </span>
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    background: isPlaying ? '#c6f432' : '#64748b',
                    boxShadow: isPlaying ? '0 0 8px #c6f432' : 'none'
                  }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                {/* Upload from Device button */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  title={isRTL ? 'إضافة مقطع صوتي من جهازك' : 'Add audio file from your device'}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                    padding: '0.25rem 0.55rem',
                    borderRadius: '8px',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    background: 'rgba(255, 255, 255, 0.05)',
                    color: '#94a3b8',
                    fontSize: '0.68rem',
                    fontWeight: 650,
                    cursor: 'pointer'
                  }}
                >
                  <FolderPlusIcon />
                  <span>{isRTL ? 'من جهازك' : 'Device'}</span>
                </button>

                {/* Minimize to Pill */}
                <button
                  type="button"
                  onClick={() => setExpanded(false)}
                  style={{
                    padding: '0.3rem',
                    borderRadius: '8px',
                    border: 'none',
                    background: 'transparent',
                    color: '#64748b',
                    cursor: 'pointer'
                  }}
                  title="Minimize"
                >
                  <ChevronDown />
                </button>

                {/* Close Widget */}
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  style={{
                    padding: '0.3rem',
                    borderRadius: '8px',
                    border: 'none',
                    background: 'transparent',
                    color: '#64748b',
                    cursor: 'pointer',
                    fontSize: '0.85rem'
                  }}
                  title="Close"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Track Info & Art */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.85rem',
                padding: '0.75rem 1.15rem',
                position: 'relative',
                zIndex: 1
              }}
            >
              {/* Album Art with Vinyl Glow */}
              <div style={{ position: 'relative', flexShrink: 0 }}>
                <div
                  style={{
                    width: 58,
                    height: 58,
                    borderRadius: '14px',
                    overflow: 'hidden',
                    background: '#1e293b',
                    boxShadow: isPlaying
                      ? '0 0 0 2px #c6f432, 0 6px 18px rgba(198, 244, 50, 0.25)'
                      : '0 0 0 1px rgba(51, 65, 85, 0.8)',
                    transition: 'box-shadow 0.3s ease'
                  }}
                >
                  {!imgError ? (
                    <img
                      src={currentTrack.albumArt}
                      alt={currentTrack.album}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={() => setImgError(true)}
                    />
                  ) : (
                    <div
                      style={{
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: 'linear-gradient(135deg, #1e293b, #334155)',
                        color: '#94a3b8'
                      }}
                    >
                      <MusicIcon />
                    </div>
                  )}
                </div>
              </div>

              {/* Title, Artist, Source */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <h4
                  style={{
                    margin: 0,
                    fontSize: '0.95rem',
                    fontWeight: 750,
                    color: '#ffffff',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}
                >
                  {currentTrack.title}
                </h4>
                <p
                  style={{
                    margin: '0.15rem 0 0.4rem',
                    fontSize: '0.78rem',
                    color: '#94a3b8',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}
                >
                  {currentTrack.artist}
                </p>
                <SourceBadge />
              </div>

              {/* Heart Favorite Button */}
              <button
                type="button"
                onClick={() => {
                  toggleLike(currentTrack.id);
                  gymAudio.triggerSubtleHaptic([15]);
                }}
                style={{
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '12px',
                  padding: '0.5rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}
                aria-label="Favorite"
              >
                <HeartIcon on={likedTrackIds.has(currentTrack.id)} />
              </button>
            </div>

            {/* Scrubber Progress Bar */}
            <div style={{ padding: '0 1.15rem', position: 'relative', zIndex: 1 }}>
              <input
                type="range"
                min={0}
                max={1}
                step={0.001}
                value={pct}
                onChange={handleSeekChange}
                className="now-playing-range"
                style={{ width: '100%', ...sliderStyle(pct) }}
                aria-label="Seek track"
              />
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginTop: '0.2rem',
                  fontSize: '0.68rem',
                  color: '#64748b',
                  fontVariantNumeric: 'tabular-nums'
                }}
              >
                <span>{fmt(elapsed)}</span>
                <span>{fmt(duration)}</span>
              </div>
            </div>

            {/* Playback Controls */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.5rem 1.25rem 0.75rem',
                position: 'relative',
                zIndex: 1
              }}
            >
              <button
                type="button"
                onClick={toggleShuffle}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '0.4rem' }}
                title="Shuffle"
              >
                <ShuffleIcon on={isShuffle} />
              </button>

              <button
                type="button"
                onClick={prevTrack}
                style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '0.4rem' }}
                title="Previous"
              >
                <SkipPrevIcon />
              </button>

              {/* Main Play/Pause CTA */}
              <button
                type="button"
                onClick={togglePlay}
                className={isPlaying ? 'music-pulse-play' : ''}
                style={{
                  width: 50,
                  height: 50,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #c6f432 0%, #86efac 100%)',
                  color: '#0f172a',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: isPlaying ? '0 0 24px rgba(198, 244, 50, 0.45)' : '0 4px 16px rgba(0,0,0,0.4)',
                  transition: 'transform 0.15s ease'
                }}
                aria-label={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? <PauseIcon s={20} /> : <PlayIcon s={20} />}
              </button>

              <button
                type="button"
                onClick={nextTrack}
                style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '0.4rem' }}
                title="Next"
              >
                <SkipNextIcon />
              </button>

              <button
                type="button"
                onClick={toggleRepeat}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '0.4rem' }}
                title={`Repeat: ${repeatMode}`}
              >
                <RepeatIcon mode={repeatMode} />
              </button>
            </div>

            {/* Volume Row */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.65rem',
                margin: '0 1.15rem 0.85rem',
                padding: '0.45rem 0.85rem',
                borderRadius: '12px',
                background: 'rgba(15, 23, 42, 0.65)',
                border: '1px solid rgba(51, 65, 85, 0.4)'
              }}
            >
              <button
                type="button"
                onClick={toggleMute}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 0, display: 'flex' }}
                title={isMuted ? 'Unmute' : 'Mute'}
              >
                <VolumeIcon />
              </button>
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={vol}
                onChange={handleVolumeChange}
                className="now-playing-range"
                style={{ flex: 1, ...sliderStyle(vol) }}
                aria-label="Volume"
              />
              <span
                style={{
                  fontSize: '0.68rem',
                  color: '#64748b',
                  fontVariantNumeric: 'tabular-nums',
                  width: 24,
                  textAlign: 'right'
                }}
              >
                {Math.round(vol * 100)}
              </span>
            </div>

            {/* Track Dots Indicator */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '0.35rem', paddingBottom: '0.85rem' }}>
              {tracks.map((t, i) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => selectTrack(i)}
                  style={{
                    width: i === currentTrackIndex ? 18 : 6,
                    height: 5,
                    borderRadius: '999px',
                    background: i === currentTrackIndex ? '#c6f432' : 'rgba(51, 65, 85, 0.8)',
                    border: 'none',
                    cursor: 'pointer',
                    padding: 0,
                    transition: 'all 0.2s ease'
                  }}
                  aria-label={`Track ${i + 1}`}
                />
              ))}
            </div>
          </motion.div>
        ) : (
          /* ─── Mini Mode (Capsule Pill) ─────────────────────────────── */
          <motion.div
            key="mini"
            initial={{ opacity: 0, scale: 0.9, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 15 }}
            transition={{ type: 'spring', stiffness: 420, damping: 30 }}
            className="now-playing-pill-glass"
            style={{
              height: 62,
              borderRadius: '999px',
              padding: '4px 10px 4px 4px',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              minWidth: 0,
              width: 'min(310px, calc(100vw - 20px))',
              maxWidth: 'calc(100vw - 20px)',
              userSelect: 'none'
            }}
          >
            {/* Spinning Circular Album Art */}
            <div
              onClick={() => setExpanded(true)}
              style={{
                width: 52,
                height: 52,
                borderRadius: '50%',
                overflow: 'hidden',
                background: '#1e293b',
                flexShrink: 0,
                cursor: 'pointer',
                boxShadow: isPlaying
                  ? '0 0 0 2.5px #c6f432, 0 0 14px rgba(198, 244, 50, 0.35)'
                  : '0 0 0 1.5px rgba(51, 65, 85, 0.8)',
                transition: 'box-shadow 0.3s ease'
              }}
            >
              {!imgError ? (
                <img
                  src={currentTrack.albumArt}
                  alt={currentTrack.title}
                  className={`spin-slow ${isPlaying ? 'playing' : ''}`}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  onError={() => setImgError(true)}
                />
              ) : (
                <div
                  style={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: '#1e293b',
                    color: '#94a3b8'
                  }}
                >
                  <MusicIcon />
                </div>
              )}
            </div>

            {/* Track Title and Artist */}
            <div
              onClick={() => setExpanded(true)}
              style={{ flex: 1, minWidth: 0, cursor: 'pointer' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <p
                  style={{
                    margin: 0,
                    color: '#ffffff',
                    fontSize: '0.86rem',
                    fontWeight: 700,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}
                >
                  {currentTrack.title}
                </p>
                {isPlaying && (
                  <span
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: '50%',
                      background: '#c6f432',
                      boxShadow: '0 0 6px #c6f432',
                      flexShrink: 0
                    }}
                  />
                )}
              </div>
              <p
                style={{
                  margin: '0.1rem 0 0',
                  color: '#94a3b8',
                  fontSize: '0.74rem',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}
              >
                {currentTrack.artist}
              </p>
            </div>

            {/* Mini Progress Ring */}
            <div style={{ flexShrink: 0 }}>
              <Ring pct={pct} />
            </div>

            {/* Play/Pause Button */}
            <button
              type="button"
              onClick={togglePlay}
              className={isPlaying ? 'music-pulse-play' : ''}
              style={{
                width: 44,
                height: 44,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #c6f432 0%, #a3e635 100%)',
                color: '#0f172a',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                boxShadow: isPlaying
                  ? '0 0 16px rgba(198, 244, 50, 0.5), 0 2px 8px rgba(0,0,0,0.3)'
                  : '0 2px 8px rgba(0,0,0,0.3)'
              }}
              aria-label={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? <PauseIcon s={16} /> : <PlayIcon s={16} />}
            </button>

            {/* Expand Chevron Button */}
            <button
              type="button"
              onClick={() => setExpanded(true)}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#64748b',
                padding: '0.3rem',
                cursor: 'pointer',
                display: 'flex'
              }}
              title="Expand player"
            >
              <ChevronUp />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
