import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Volume2,
  VolumeX,
  Music,
  X,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Disc3,
} from 'lucide-react';
import { MusicTrack } from '../types';
import {
  USER_DEFAULT_TRACKS,
  extractYouTubeId,
  getStoredTracks,
  loadStoredTracks,
} from '../lib/musicStorage';

export { USER_DEFAULT_TRACKS, extractYouTubeId };

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

export const FloatingMusicPlayer: React.FC = () => {
  // Load saved tracks or fallback to the 4 user provided tracks with Aerosmith first
  const [tracks, setTracks] = useState<MusicTrack[]>(getStoredTracks);

  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(80);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showInvitationPrompt, setShowInvitationPrompt] = useState(true);

  // Sync with global playlist updates (e.g., when edited from /admin)
  useEffect(() => {
    loadStoredTracks().catch((error) => {
      console.warn('Não foi possível carregar a playlist compartilhada.', error);
    });

    const handlePlaylistUpdate = (e: any) => {
      if (e.detail && Array.isArray(e.detail) && e.detail.length > 0) {
        setTracks(e.detail);
      }
    };
    window.addEventListener('wedding_playlist_updated', handlePlaylistUpdate);
    return () => {
      window.removeEventListener('wedding_playlist_updated', handlePlaylistUpdate);
    };
  }, []);

  const playerRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const userHasPausedRef = useRef(false);
  const tracksRef = useRef(tracks);
  const currentTrackIndexRef = useRef(0);

  useEffect(() => {
    tracksRef.current = tracks;
  }, [tracks]);

  const currentTrack = tracks[currentTrackIndex] || tracks[0] || USER_DEFAULT_TRACKS[0];

  // Initialize the YouTube player. Playback starts from an explicit Play tap,
  // which is required reliably by Chrome on Android.
  useEffect(() => {
    let checkInterval: any;

    const initPlayer = () => {
      if (!window.YT || !window.YT.Player) return;

      const playerDiv = document.getElementById('youtube-bg-audio-player');
      if (!playerDiv) return;

      if (playerRef.current) {
        return;
      }

      playerRef.current = new window.YT.Player('youtube-bg-audio-player', {
        height: '1',
        width: '1',
        videoId: currentTrack?.youtubeId || USER_DEFAULT_TRACKS[0].youtubeId,
        playerVars: {
          autoplay: 0,
          controls: 0,
          disablekb: 1,
          fs: 0,
          iv_load_policy: 3,
          modestbranding: 1,
          rel: 0,
          playsinline: 1,
          enablejsapi: 1,
        },
        events: {
          onReady: (event: any) => {
            event.target.setVolume(volume);
            event.target.unMute();
            setIsMuted(false);
            setIsPlaying(false);
            setShowInvitationPrompt(true);
          },
          onStateChange: (event: any) => {
            // YT.PlayerState.PLAYING = 1, PAUSED = 2, ENDED = 0
            if (event.data === 1) {
              const playerIsMuted = event.target.isMuted?.() ?? true;
              setIsPlaying(true);
              setIsMuted(playerIsMuted);
              setShowInvitationPrompt(playerIsMuted);
            } else if (event.data === 2) {
              setIsPlaying(false);
            } else if (event.data === 0) {
              // Auto advance to next song in loop
              handleNextTrack();
            }
          },
        },
      });
    };

    // Load YouTube API script if not loaded
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);

      window.onYouTubeIframeAPIReady = () => {
        initPlayer();
      };
    } else if (window.YT && window.YT.Player) {
      initPlayer();
    } else {
      checkInterval = setInterval(() => {
        if (window.YT && window.YT.Player) {
          clearInterval(checkInterval);
          initPlayer();
        }
      }, 300);
    }

    return () => {
      if (checkInterval) clearInterval(checkInterval);
    };
  }, []);

  // Update track in player when currentTrack changes
  const changeTrack = (newIndex: number, autoPlay: boolean = true) => {
    const activeTracks = tracksRef.current;
    if (activeTracks.length === 0) return;
    const validIndex = (newIndex + activeTracks.length) % activeTracks.length;
    setCurrentTrackIndex(validIndex);
    currentTrackIndexRef.current = validIndex;
    const target = activeTracks[validIndex];
    if (playerRef.current && playerRef.current.loadVideoById && target?.youtubeId) {
      if (autoPlay) {
        playerRef.current.setVolume(volume);
        playerRef.current.unMute();
        playerRef.current.loadVideoById(target.youtubeId);
        setIsPlaying(true);
        setIsMuted(false);
        setShowInvitationPrompt(false);
      } else {
        playerRef.current.cueVideoById(target.youtubeId);
      }
    }
  };

  const handleTogglePlay = () => {
    setShowInvitationPrompt(false);
    if (!playerRef.current) return;

    try {
      if (isPlaying) {
        userHasPausedRef.current = true;
        playerRef.current.pauseVideo();
        setIsPlaying(false);
      } else {
        userHasPausedRef.current = false;
        playerRef.current.setVolume(volume);
        playerRef.current.unMute();
        const playerState = playerRef.current.getPlayerState?.() ?? -1;
        if (playerState === -1 || playerState === 5) {
          playerRef.current.loadVideoById(currentTrack.youtubeId);
        } else {
          playerRef.current.playVideo();
        }
        setIsMuted(false);
        setIsPlaying(true);
        setShowInvitationPrompt(false);
      }
    } catch (e) {
      console.error('Error toggling play state:', e);
    }
  };

  const handleNextTrack = () => {
    const nextIdx = (currentTrackIndexRef.current + 1) % tracksRef.current.length;
    changeTrack(nextIdx, true);
  };

  const handlePrevTrack = () => {
    const prevIdx = (currentTrackIndexRef.current - 1 + tracksRef.current.length) % tracksRef.current.length;
    changeTrack(prevIdx, true);
  };

  const handleToggleMute = () => {
    if (!playerRef.current) return;
    if (isMuted) {
      playerRef.current.setVolume(volume);
      playerRef.current.unMute();
      playerRef.current.playVideo();
      setIsMuted(false);
      setIsPlaying(true);
      setShowInvitationPrompt(false);
    } else {
      playerRef.current.mute();
      setIsMuted(true);
    }
  };

  const handleVolumeChange = (newVol: number) => {
    setVolume(newVol);
    if (playerRef.current && playerRef.current.setVolume) {
      playerRef.current.setVolume(newVol);
      if (newVol === 0) {
        setIsMuted(true);
      } else if (isMuted) {
        playerRef.current.unMute();
        setIsMuted(false);
      }
    }
  };

  return (
    <>
      {/* Hidden YouTube Iframe Player Container */}
      <div
        className="fixed -left-[9999px] -top-[9999px] w-1 h-1 pointer-events-none opacity-0 overflow-hidden"
        aria-hidden="true"
      >
        <div id="youtube-bg-audio-player"></div>
      </div>

      {/* Floating Player Widget Container */}
      <div
        ref={containerRef}
        className="fixed bottom-5 right-4 sm:right-6 z-40 transition-all duration-300 font-['Plus_Jakarta_Sans',sans-serif]"
      >
        {/* Play First Invitation Tooltip (Dismissible) */}
        {showInvitationPrompt && !isPlaying && (
          <div className="absolute bottom-full right-0 mb-3 w-64 bg-white/95 backdrop-blur-md rounded-2xl p-3 shadow-xl border border-teal-800/20 text-xs text-stone-700 animate-bounce flex items-start gap-2">
            <Sparkles className="w-4 h-4 text-teal-800 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold text-teal-900">Músicas do Casamento 🎵</p>
              <p className="text-[11px] text-stone-500">
                Toque no play para ouvir a playlist romântica do casal!
              </p>
            </div>
            <button
              onClick={() => setShowInvitationPrompt(false)}
              className="text-stone-400 hover:text-stone-600 p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Collapsed Pill View */}
        {!isExpanded && (
          <div className="flex items-center gap-2 p-1.5 pl-2.5 pr-2 rounded-full bg-white/95 backdrop-blur-md border border-teal-800/20 shadow-xl shadow-teal-950/10 hover:shadow-2xl transition-all">
            {/* Spinning Disc / Vinyl Icon */}
            <button
              onClick={() => setIsExpanded(true)}
              className="relative w-8 h-8 rounded-full bg-[#1A2E26] text-white flex items-center justify-center flex-shrink-0 cursor-pointer overflow-hidden group"
              title="Expandir player de música"
            >
              <Disc3
                className={`w-5 h-5 text-amber-200 transition-transform duration-1000 ${
                  isPlaying ? 'animate-spin' : ''
                }`}
              />
              <div className="absolute inset-0 bg-teal-900/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                <ChevronUp className="w-3.5 h-3.5 text-white" />
              </div>
            </button>

            {/* Track Info (Click to expand) */}
            <button
              onClick={() => setIsExpanded(true)}
              className="text-left max-w-[130px] sm:max-w-[170px] truncate cursor-pointer group"
              title={`${currentTrack?.title} - ${currentTrack?.artist || ''}`}
            >
              <span className="block text-[10px] uppercase font-bold text-teal-900 tracking-wider">
                Música {currentTrackIndex + 1}/{tracks.length}
              </span>
              <span className="block text-xs font-semibold text-stone-800 truncate group-hover:text-teal-800 transition">
                {currentTrack?.title}
              </span>
            </button>

            {/* Equalizer Wave Bars */}
            <div className="flex items-end gap-[2px] h-3 px-1">
              <span
                className={`w-[2px] bg-teal-800 rounded-full transition-all duration-300 ${
                  isPlaying ? 'h-3 animate-pulse' : 'h-1'
                }`}
              ></span>
              <span
                className={`w-[2px] bg-teal-800 rounded-full transition-all duration-300 delay-100 ${
                  isPlaying ? 'h-2 animate-bounce' : 'h-1.5'
                }`}
              ></span>
              <span
                className={`w-[2px] bg-teal-800 rounded-full transition-all duration-300 delay-200 ${
                  isPlaying ? 'h-3.5 animate-pulse' : 'h-1'
                }`}
              ></span>
            </div>

            {/* Play/Pause Button */}
            <button
              onClick={handleTogglePlay}
              className="w-8 h-8 rounded-full bg-teal-800 hover:bg-teal-900 text-white flex items-center justify-center transition shadow-xs cursor-pointer active:scale-95"
              title={isPlaying ? 'Pausar música' : 'Tocar música'}
            >
              {isPlaying ? <Pause className="w-4 h-4 fill-white" /> : <Play className="w-4 h-4 fill-white ml-0.5" />}
            </button>

            {/* Quick Next Song Button */}
            <button
              onClick={handleNextTrack}
              className="w-7 h-7 rounded-full text-stone-500 hover:text-teal-900 hover:bg-stone-100 flex items-center justify-center transition cursor-pointer"
              title="Próxima música"
            >
              <SkipForward className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Expanded Card View */}
        {isExpanded && (
          <div className="w-[310px] sm:w-[350px] bg-white/95 backdrop-blur-md rounded-3xl p-5 shadow-2xl border border-teal-800/20 text-stone-800 animate-in fade-in slide-in-from-bottom-4 duration-200">
            {/* Header with Title and Minimize */}
            <div className="flex items-center justify-between pb-3 border-b border-stone-200/80 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-[#E8F3EE] text-teal-800 flex items-center justify-center">
                  <Music className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-stone-800 uppercase tracking-wider">
                    Trilha do Casamento
                  </h4>
                  <p className="text-[10px] text-teal-800 font-semibold">{tracks.length} Músicas Selecionadas</p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => setIsExpanded(false)}
                  className="p-1.5 rounded-full text-stone-500 hover:text-stone-800 hover:bg-stone-100 transition cursor-pointer"
                  title="Recolher player"
                >
                  <ChevronDown className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Center Vinyl & Track Info */}
            <div className="flex items-center gap-3.5 mb-4 p-3 rounded-2xl bg-[#FAF6F3] border border-[#D5B09E]/30">
              <div
                className={`relative w-12 h-12 rounded-full bg-[#1F2E28] border-2 border-amber-200/50 flex items-center justify-center flex-shrink-0 shadow-md ${
                  isPlaying ? 'animate-spin' : ''
                }`}
                style={{ animationDuration: '4s' }}
              >
                <Disc3 className="w-7 h-7 text-amber-100/90" />
                <div className="w-3 h-3 rounded-full bg-[#FAF6F3] border border-stone-800 absolute center"></div>
              </div>

              <div className="flex-1 min-w-0 text-left">
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="inline-block text-[10px] font-bold text-teal-900 uppercase tracking-wider px-2 py-0.5 rounded-full bg-teal-100/70">
                    Faixa {currentTrackIndex + 1} de {tracks.length}
                  </span>
                  {currentTrack?.artist && (
                    <span className="text-[10px] text-stone-500 truncate">
                      • {currentTrack.artist}
                    </span>
                  )}
                </div>
                <h5 className="text-xs sm:text-sm font-bold text-stone-800 truncate leading-tight">
                  {currentTrack?.title}
                </h5>
                <p className="text-[11px] text-stone-500 truncate">
                  {isPlaying ? 'Tocando no convite...' : 'Pausado • Clique para tocar'}
                </p>
              </div>
            </div>

            {/* Audio Controls */}
            <div className="flex items-center justify-between mb-4 px-2">
              <button
                onClick={handlePrevTrack}
                className="p-2 text-stone-600 hover:text-teal-900 hover:bg-stone-100 rounded-full transition cursor-pointer"
                title="Música anterior"
              >
                <SkipBack className="w-5 h-5" />
              </button>

              <button
                onClick={handleTogglePlay}
                className="w-12 h-12 rounded-full bg-teal-800 hover:bg-teal-900 text-white flex items-center justify-center shadow-md shadow-teal-900/20 transition transform hover:scale-105 active:scale-95 cursor-pointer"
                title={isPlaying ? 'Pausar' : 'Tocar'}
              >
                {isPlaying ? <Pause className="w-5 h-5 fill-white" /> : <Play className="w-5 h-5 fill-white ml-0.5" />}
              </button>

              <button
                onClick={handleNextTrack}
                className="p-2 text-stone-600 hover:text-teal-900 hover:bg-stone-100 rounded-full transition cursor-pointer"
                title="Próxima música"
              >
                <SkipForward className="w-5 h-5" />
              </button>
            </div>

            {/* Volume Control Bar */}
            <div className="flex items-center gap-2 px-2 py-1.5 mb-4 bg-stone-50 rounded-xl border border-stone-200/60">
              <button
                onClick={handleToggleMute}
                className="text-stone-500 hover:text-teal-900 p-1 transition"
                title={isMuted ? 'Ativar som' : 'Silenciar'}
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="w-4 h-4 text-stone-400" />
                ) : (
                  <Volume2 className="w-4 h-4 text-teal-800" />
                )}
              </button>
              <input
                type="range"
                min="0"
                max="100"
                value={isMuted ? 0 : volume}
                onChange={(e) => handleVolumeChange(Number(e.target.value))}
                className="w-full h-1.5 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-teal-800"
              />
              <span className="text-[10px] font-mono text-stone-500 w-7 text-right">
                {isMuted ? '0%' : `${volume}%`}
              </span>
            </div>

            {/* Playlist Quick Selector List */}
            <div className="space-y-1.5 mb-3 text-left max-h-[160px] overflow-y-auto pr-1">
              <div className="flex items-center justify-between text-[11px] font-semibold text-stone-500 px-1 sticky top-0 bg-white/95 pb-1">
                <span>Lista da Trilha:</span>
                <span className="text-teal-800">{tracks.length} músicas</span>
              </div>

              {tracks.map((track, idx) => {
                const isCurrent = currentTrackIndex === idx;
                return (
                  <button
                    key={track.id}
                    onClick={() => changeTrack(idx, true)}
                    className={`w-full p-2 rounded-xl text-left flex items-center justify-between gap-2 text-xs transition cursor-pointer ${
                      isCurrent
                        ? 'bg-[#E8F3EE] text-teal-900 font-bold border border-teal-800/20'
                        : 'bg-stone-50/80 text-stone-700 hover:bg-stone-100 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span
                        className={`w-5 h-5 rounded-full text-[10px] font-mono flex items-center justify-center flex-shrink-0 ${
                          isCurrent ? 'bg-teal-800 text-white' : 'bg-stone-200 text-stone-600'
                        }`}
                      >
                        {idx + 1}
                      </span>
                      <div className="truncate">
                        <span className="truncate block font-medium">{track.title}</span>
                        {track.artist && (
                          <span className="text-[10px] text-stone-400 block truncate">{track.artist}</span>
                        )}
                      </div>
                    </div>

                    {isCurrent && isPlaying && (
                      <span className="flex items-center gap-0.5 flex-shrink-0">
                        <span className="w-1 h-2.5 bg-teal-800 rounded-full animate-pulse"></span>
                        <span className="w-1 h-3.5 bg-teal-800 rounded-full animate-bounce"></span>
                        <span className="w-1 h-2 bg-teal-800 rounded-full animate-pulse"></span>
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Footer Action Button: Minimize */}
            <button
              onClick={() => setIsExpanded(false)}
              className="w-full py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-600 text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer"
            >
              <ChevronDown className="w-3.5 h-3.5" />
              <span>Recolher</span>
            </button>
          </div>
        )}
      </div>
    </>
  );
};
