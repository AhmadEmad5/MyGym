import React, { createContext, useContext, useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { validateClientFile, MAX_AUDIO_UPLOAD_BYTES, ALLOWED_AUDIO_MIME_TYPES } from '../lib/fileValidation';

export interface Track {
  id: string | number;
  title: string;
  artist: string;
  album: string;
  duration: number; // in seconds
  albumArt: string;
  source: 'Bluetooth' | 'In-App Audio' | 'AirPlay' | 'Device File';
  audioUrl?: string;
  file?: File;
}

export interface MusicPlayerContextType {
  tracks: Track[];
  currentTrackIndex: number;
  currentTrack: Track;
  isPlaying: boolean;
  elapsed: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  isShuffle: boolean;
  repeatMode: 'off' | 'all' | 'one';
  isExpanded: boolean;
  isOpen: boolean;
  likedTrackIds: Set<string | number>;
  play: () => void;
  pause: () => void;
  togglePlay: () => void;
  nextTrack: () => void;
  prevTrack: () => void;
  seek: (seconds: number) => void;
  setVolumeLevel: (val: number) => void;
  toggleMute: () => void;
  toggleShuffle: () => void;
  toggleRepeat: () => void;
  toggleLike: (trackId: string | number) => void;
  selectTrack: (index: number) => void;
  setExpanded: (expanded: boolean) => void;
  setIsOpen: (open: boolean) => void;
  toggleWidget: () => void;
  addDeviceTrack: (file: File) => void;
}

const DEFAULT_TRACKS: Track[] = [
  {
    id: 1,
    title: 'Power Trip (Workout Mix)',
    artist: 'Kendrick Lamar',
    album: 'GNX Energy',
    duration: 225,
    albumArt: '/music/ref2.png',
    source: 'Bluetooth',
    audioUrl: 'https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3?filename=workout-112318.mp3'
  },
  {
    id: 2,
    title: 'Blinding Lights (Gym Synth)',
    artist: 'The Weeknd',
    album: 'After Hours Phonk',
    duration: 200,
    albumArt: '/music/ref.png',
    source: 'In-App Audio',
    audioUrl: 'https://cdn.pixabay.com/download/audio/2022/03/10/audio_c8c8a73467.mp3?filename=aggressive-computer-beat-109038.mp3'
  },
  {
    id: 3,
    title: 'Titan Cardio Rush',
    artist: 'FORMA Athletes',
    album: '135 BPM Cardio Boost',
    duration: 183,
    albumArt: 'https://images.unsplash.com/photo-1506157786151-b8491531f063?w=400&h=400&fit=crop&auto=format',
    source: 'AirPlay',
    audioUrl: 'https://cdn.pixabay.com/download/audio/2022/01/18/audio_d0a13f69d2.mp3?filename=sport-fashion-electronic-10114.mp3'
  },
  {
    id: 4,
    title: 'Deep Focus & Recovery',
    artist: 'Mind & Muscle Beats',
    album: 'Hypertrophy Reset',
    duration: 257,
    albumArt: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&h=400&fit=crop&auto=format',
    source: 'In-App Audio',
    audioUrl: 'https://cdn.pixabay.com/download/audio/2021/08/09/audio_8844787a22.mp3?filename=lofi-study-112191.mp3'
  }
];

const MusicPlayerContext = createContext<MusicPlayerContextType | null>(null);

export function MusicPlayerProvider({ children }: { children: React.ReactNode }) {
  const [tracks, setTracks] = useState<Track[]>(() => {
    return DEFAULT_TRACKS;
  });

  const [currentTrackIndex, setCurrentTrackIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [elapsed, setElapsed] = useState<number>(0);
  const [duration, setDuration] = useState<number>(225);

  const [volume, setVolume] = useState<number>(() => {
    const saved = localStorage.getItem('forma_music_vol');
    return saved ? parseFloat(saved) : 0.72;
  });

  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isShuffle, setIsShuffle] = useState<boolean>(() => {
    return localStorage.getItem('forma_music_shuffle') === 'true';
  });

  const [repeatMode, setRepeatMode] = useState<'off' | 'all' | 'one'>(() => {
    return (localStorage.getItem('forma_music_repeat') as any) || 'off';
  });

  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [isOpen, setIsOpen] = useState<boolean>(false);

  const [likedTrackIds, setLikedTrackIds] = useState<Set<string | number>>(() => {
    try {
      const saved = localStorage.getItem('forma_music_liked');
      return saved ? new Set(JSON.parse(saved)) : new Set([1]);
    } catch {
      return new Set([1]);
    }
  });

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const synthCtxRef = useRef<AudioContext | null>(null);
  const synthTimerRef = useRef<any>(null);
  const isSynthActiveRef = useRef<boolean>(false);

  const currentTrack = tracks[currentTrackIndex] || tracks[0];

  // Helper: Stop synth backup
  const stopSynth = useCallback(() => {
    if (synthTimerRef.current) {
      clearInterval(synthTimerRef.current);
      synthTimerRef.current = null;
    }
    isSynthActiveRef.current = false;
  }, []);

  // Helper: Start energetic workout synth beat if audio stream is unavailable
  const startSynthBeat = useCallback(() => {
    try {
      if (!synthCtxRef.current) {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) synthCtxRef.current = new AudioCtx();
      }
      if (!synthCtxRef.current) return;
      if (synthCtxRef.current.state === 'suspended') {
        synthCtxRef.current.resume().catch(() => {});
      }

      stopSynth();
      isSynthActiveRef.current = true;
      let step = 0;

      synthTimerRef.current = setInterval(() => {
        if (!synthCtxRef.current || !isSynthActiveRef.current) return;
        const now = synthCtxRef.current.currentTime;
        const ctx = synthCtxRef.current;

        // Kick on every 4 beats
        if (step % 4 === 0) {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(140, now);
          osc.frequency.exponentialRampToValueAtTime(38, now + 0.18);
          gain.gain.setValueAtTime(0.5 * volume, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now);
          osc.stop(now + 0.24);
        }

        // Hi-hat / synth tick on other beats
        if (step % 2 === 1) {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(420, now);
          gain.gain.setValueAtTime(0.12 * volume, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now);
          osc.stop(now + 0.09);
        }

        step = (step + 1) % 16;
      }, 125); // 120 BPM
    } catch {
      // AudioContext unavailable
    }
  }, [volume, stopSynth]);

  // Sync Audio Element
  useEffect(() => {
    if (!audioRef.current) {
      const audio = new Audio();
      audio.preload = 'metadata';
      audioRef.current = audio;

      audio.addEventListener('timeupdate', () => {
        setElapsed(Math.floor(audio.currentTime));
      });

      audio.addEventListener('loadedmetadata', () => {
        if (audio.duration && !isNaN(audio.duration) && isFinite(audio.duration)) {
          setDuration(Math.floor(audio.duration));
        }
      });

      audio.addEventListener('ended', () => {
        handleNext();
      });

      audio.addEventListener('error', () => {
        // Switch to synthesized workout rhythm if remote audio URL fails
        if (isPlaying) {
          startSynthBeat();
        }
      });
    }
  }, []);

  // Update track source on track index change
  useEffect(() => {
    if (!audioRef.current || !currentTrack) return;
    stopSynth();
    const audio = audioRef.current;

    if (currentTrack.audioUrl) {
      audio.src = currentTrack.audioUrl;
      audio.currentTime = 0;
      setElapsed(0);
      setDuration(currentTrack.duration || 225);

      if (isPlaying) {
        audio.play().catch(() => {
          startSynthBeat();
        });
      }
    } else {
      if (isPlaying) {
        startSynthBeat();
      }
    }
  }, [currentTrackIndex, currentTrack?.id]);

  // Volume & Mute listener
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
    localStorage.setItem('forma_music_vol', String(volume));
  }, [volume, isMuted]);

  // MediaSession API Integration (Windows/Mac/iOS/Android lockscreen & keyboard keys)
  useEffect(() => {
    if ('mediaSession' in navigator && currentTrack) {
      try {
        navigator.mediaSession.metadata = new MediaMetadata({
          title: currentTrack.title,
          artist: currentTrack.artist,
          album: currentTrack.album,
          artwork: [
            { src: currentTrack.albumArt, sizes: '96x96', type: 'image/png' },
            { src: currentTrack.albumArt, sizes: '192x192', type: 'image/png' },
            { src: currentTrack.albumArt, sizes: '512x512', type: 'image/png' }
          ]
        });

        navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';

        navigator.mediaSession.setActionHandler('play', () => play());
        navigator.mediaSession.setActionHandler('pause', () => pause());
        navigator.mediaSession.setActionHandler('previoustrack', () => prevTrack());
        navigator.mediaSession.setActionHandler('nexttrack', () => nextTrack());
        navigator.mediaSession.setActionHandler('seekto', (details) => {
          if (details.seekTime !== undefined) seek(details.seekTime);
        });
      } catch {
        // MediaSession not supported
      }
    }
  }, [currentTrack, isPlaying]);

  // Audio Play
  const play = useCallback(() => {
    setIsPlaying(true);
    setIsOpen(true);
    if (audioRef.current && currentTrack.audioUrl) {
      audioRef.current.play().catch(() => {
        startSynthBeat();
      });
    } else {
      startSynthBeat();
    }
  }, [currentTrack, startSynthBeat]);

  // Audio Pause
  const pause = useCallback(() => {
    setIsPlaying(false);
    stopSynth();
    if (audioRef.current) {
      audioRef.current.pause();
    }
  }, [stopSynth]);

  const togglePlay = useCallback(() => {
    if (isPlaying) pause();
    else play();
  }, [isPlaying, pause, play]);

  // Next Track
  const nextTrack = useCallback(() => {
    stopSynth();
    if (repeatMode === 'one') {
      if (audioRef.current) audioRef.current.currentTime = 0;
      setElapsed(0);
      return;
    }

    setElapsed(0);
    setCurrentTrackIndex((prev) => {
      if (isShuffle) {
        let nextIndex = prev;
        while (nextIndex === prev && tracks.length > 1) {
          nextIndex = Math.floor(Math.random() * tracks.length);
        }
        return nextIndex;
      }
      return (prev + 1) % tracks.length;
    });
  }, [isShuffle, repeatMode, tracks.length, stopSynth]);

  // Previous Track
  const prevTrack = useCallback(() => {
    stopSynth();
    if (elapsed > 3) {
      if (audioRef.current) audioRef.current.currentTime = 0;
      setElapsed(0);
      return;
    }
    setElapsed(0);
    setCurrentTrackIndex((prev) => (prev - 1 + tracks.length) % tracks.length);
  }, [elapsed, tracks.length, stopSynth]);

  const handleNext = nextTrack;

  // Seek
  const seek = useCallback((seconds: number) => {
    const clamped = Math.max(0, Math.min(seconds, duration));
    setElapsed(clamped);
    if (audioRef.current) {
      audioRef.current.currentTime = clamped;
    }
  }, [duration]);

  // Volume
  const setVolumeLevel = useCallback((val: number) => {
    const clamped = Math.max(0, Math.min(1, val));
    setVolume(clamped);
    setIsMuted(false);
  }, []);

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => !prev);
  }, []);

  const toggleShuffle = useCallback(() => {
    setIsShuffle((prev) => {
      const next = !prev;
      localStorage.setItem('forma_music_shuffle', String(next));
      return next;
    });
  }, []);

  const toggleRepeat = useCallback(() => {
    setRepeatMode((prev) => {
      const next = prev === 'off' ? 'all' : prev === 'all' ? 'one' : 'off';
      localStorage.setItem('forma_music_repeat', next);
      return next;
    });
  }, []);

  const toggleLike = useCallback((trackId: string | number) => {
    setLikedTrackIds((prev) => {
      const next = new Set(prev);
      if (next.has(trackId)) next.delete(trackId);
      else next.add(trackId);
      localStorage.setItem('forma_music_liked', JSON.stringify(Array.from(next)));
      return next;
    });
  }, []);

  const selectTrack = useCallback((index: number) => {
    if (index >= 0 && index < tracks.length) {
      setCurrentTrackIndex(index);
      setElapsed(0);
      setIsPlaying(true);
      setIsOpen(true);
    }
  }, [tracks.length]);

  const toggleWidget = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  // Add Device Track from User's Computer / Phone
  const addDeviceTrack = useCallback((file: File) => {
    const validation = validateClientFile(file, {
      maxSizeBytes: MAX_AUDIO_UPLOAD_BYTES,
      allowedMimeTypes: ALLOWED_AUDIO_MIME_TYPES
    });
    if (!validation.valid) {
      console.warn('Audio track rejected:', validation.error);
      return;
    }

    try {
      const blobUrl = URL.createObjectURL(file);
      const cleanTitle = file.name.replace(/\.[^/.]+$/, '');
      const newTrack: Track = {
        id: `device-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        title: cleanTitle,
        artist: 'My Device Audio',
        album: 'Local Device Music',
        duration: 210,
        albumArt: '/music/ref2.png',
        source: 'Device File',
        audioUrl: blobUrl,
        file
      };

      setTracks((prev) => [newTrack, ...prev]);
      setCurrentTrackIndex(0);
      setIsPlaying(true);
      setIsOpen(true);
    } catch {
      // Failed to create URL
    }
  }, []);

  const value = useMemo(
    () => ({
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
      play,
      pause,
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
      setExpanded: setIsExpanded,
      setIsOpen,
      toggleWidget,
      addDeviceTrack
    }),
    [
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
      play,
      pause,
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
      addDeviceTrack,
      toggleWidget
    ]
  );

  return <MusicPlayerContext.Provider value={value}>{children}</MusicPlayerContext.Provider>;
}

export function useMusicPlayer() {
  const ctx = useContext(MusicPlayerContext);
  if (!ctx) {
    throw new Error('useMusicPlayer must be used within MusicPlayerProvider');
  }
  return ctx;
}
