import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Image as ImageIcon,
  Trash2,
  Maximize2,
  X,
  Sparkles,
  Heart,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Upload,
  Check,
  Film,
  Layers,
} from 'lucide-react';
import { CouplePhoto, TransitionStyle, ObjectFitMode } from '../types';
import { BotanicalBranchLeft, BotanicalBranchRight, BotanicalDivider } from './BotanicalDecorations';
import {
  getStoredMedia,
  saveAllMedia,
  clearAllStoredMedia,
  getCarouselConfig,
  saveCarouselConfig,
} from '../lib/mediaStorage';

// Beautiful vertical portrait photos as initial fallback
const DEFAULT_VERTICAL_MEDIA: CouplePhoto[] = [
  {
    id: 'vm-1',
    type: 'image',
    url: 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&w=800&h=1400&q=80',
    title: 'O Nosso Amor',
    caption: 'Cada instante ao seu lado é o melhor capítulo da nossa história.',
  },
  {
    id: 'vm-2',
    type: 'image',
    url: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=800&h=1400&q=80',
    title: 'O Grande "Sim"',
    caption: 'Celebrando o amor verdadeiro diante de quem mais amamos.',
  },
  {
    id: 'vm-3',
    type: 'image',
    url: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=800&h=1400&q=80',
    title: 'Nossa Cumplicidade',
    caption: 'Sorrisos sinceros e a certeza de um para sempre a dois.',
  },
  {
    id: 'vm-4',
    type: 'image',
    url: 'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?auto=format&fit=crop&w=800&h=1400&q=80',
    title: 'Caminhando Juntos',
    caption: 'De mãos dadas rumo ao nosso futuro repleto de sonhos.',
  },
];

interface PhotoCarouselProps {
  showAdminControls?: boolean;
}

export const PhotoCarousel: React.FC<PhotoCarouselProps> = ({ showAdminControls = false }) => {
  const initialConfig = getCarouselConfig();
  const [mediaList, setMediaList] = useState<CouplePhoto[]>(DEFAULT_VERTICAL_MEDIA);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState<number>(0);
  const [transitionEffect, setTransitionEffect] = useState<TransitionStyle>(initialConfig.transitionEffect);
  const [isPaused, setIsPaused] = useState(false);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [isManageModalOpen, setIsManageModalOpen] = useState(false);

  // Video playback states
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [isVideoMuted, setIsVideoMuted] = useState(true);
  const [videoProgress, setVideoProgress] = useState(0);
  const [objectFitMode, setObjectFitMode] = useState<ObjectFitMode>(initialConfig.objectFitMode);

  // Sync with global config updates
  useEffect(() => {
    const handleConfigUpdate = (e: any) => {
      if (e.detail) {
        if (e.detail.transitionEffect) setTransitionEffect(e.detail.transitionEffect);
        if (e.detail.objectFitMode) setObjectFitMode(e.detail.objectFitMode);
      }
    };
    window.addEventListener('wedding_carousel_config_updated', handleConfigUpdate);
    return () => {
      window.removeEventListener('wedding_carousel_config_updated', handleConfigUpdate);
    };
  }, []);

  const handleUpdateTransition = (style: TransitionStyle) => {
    setTransitionEffect(style);
    saveCarouselConfig({ transitionEffect: style, objectFitMode });
  };

  const handleUpdateFitMode = (mode: ObjectFitMode) => {
    setObjectFitMode(mode);
    saveCarouselConfig({ transitionEffect, objectFitMode: mode });
  };

  // Modal / Upload states
  const [isUploading, setIsUploading] = useState(false);
  const [uploadFeedback, setUploadFeedback] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Form for single URL addition
  const [newMediaUrl, setNewMediaUrl] = useState('');
  const [newMediaType, setNewMediaType] = useState<'image' | 'video'>('image');
  const [newMediaTitle, setNewMediaTitle] = useState('');
  const [newMediaCaption, setNewMediaCaption] = useState('');

  const videoRef = useRef<HTMLVideoElement>(null);
  const lightboxVideoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load persisted media from IndexedDB on startup
  useEffect(() => {
    let isMounted = true;
    getStoredMedia().then((stored) => {
      if (isMounted && stored && stored.length > 0) {
        setMediaList(stored);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  const totalItems = mediaList.length;
  const currentItem = mediaList[currentIndex] || mediaList[0] || DEFAULT_VERTICAL_MEDIA[0];
  const prevIndex = (currentIndex - 1 + totalItems) % totalItems;
  const nextIndex = (currentIndex + 1) % totalItems;
  const prevItem = mediaList[prevIndex];
  const nextItem = mediaList[nextIndex];
  const isCurrentVideo = currentItem.type === 'video';

  // Auto-play timer for photos (pauses when video is playing or user hovers)
  useEffect(() => {
    if (isPaused || isCurrentVideo || mediaList.length <= 1) return;

    const interval = setInterval(() => {
      setDirection(1);
      setCurrentIndex((prev) => (prev + 1) % mediaList.length);
    }, 5500);

    return () => clearInterval(interval);
  }, [isPaused, isCurrentVideo, mediaList.length]);

  // Video element event listeners
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !isCurrentVideo) return;

    setIsVideoPlaying(!video.paused);

    const onPlay = () => setIsVideoPlaying(true);
    const onPause = () => setIsVideoPlaying(false);
    const onEnded = () => {
      setIsVideoPlaying(false);
      handleNext();
    };
    const onTimeUpdate = () => {
      if (video.duration) {
        setVideoProgress((video.currentTime / video.duration) * 100);
      }
    };

    video.addEventListener('play', onPlay);
    video.addEventListener('pause', onPause);
    video.addEventListener('ended', onEnded);
    video.addEventListener('timeupdate', onTimeUpdate);

    return () => {
      video.removeEventListener('play', onPlay);
      video.removeEventListener('pause', onPause);
      video.removeEventListener('ended', onEnded);
      video.removeEventListener('timeupdate', onTimeUpdate);
    };
  }, [currentIndex, isCurrentVideo]);

  const handleNext = () => {
    if (isCurrentVideo && videoRef.current) {
      videoRef.current.pause();
    }
    setDirection(1);
    setCurrentIndex((prev) => (prev + 1) % mediaList.length);
  };

  const handlePrev = () => {
    if (isCurrentVideo && videoRef.current) {
      videoRef.current.pause();
    }
    setDirection(-1);
    setCurrentIndex((prev) => (prev - 1 + mediaList.length) % mediaList.length);
  };

  const handleSelectIndex = (idx: number) => {
    if (idx === currentIndex) return;
    if (isCurrentVideo && videoRef.current) {
      videoRef.current.pause();
    }
    setDirection(idx > currentIndex ? 1 : -1);
    setCurrentIndex(idx);
  };

  const toggleVideoPlayback = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play();
    } else {
      videoRef.current.pause();
    }
  };

  const toggleVideoMute = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!videoRef.current) return;
    videoRef.current.muted = !videoRef.current.muted;
    setIsVideoMuted(videoRef.current.muted);
  };

  // Animation transition variants (efeito mais leve e sedoso)
  const variants = {
    enter: (dir: number) => {
      if (transitionEffect === 'slide') {
        return {
          x: dir > 0 ? 90 : -90,
          opacity: 0.45,
          scale: 0.98,
        };
      }
      if (transitionEffect === 'fade') {
        return {
          opacity: 0.2,
          scale: 1.02,
        };
      }
      // Efeito Suave & Leve (padrão)
      return {
        x: dir > 0 ? 50 : -50,
        opacity: 0.55,
        scale: 0.97,
        rotateY: dir > 0 ? 3 : -3,
      };
    },
    center: {
      x: 0,
      opacity: 1,
      scale: 1,
      rotateY: 0,
      filter: 'blur(0px)',
      transition: {
        x: { type: 'spring', stiffness: 200, damping: 25, mass: 0.8 },
        scale: { duration: 0.3, ease: [0.22, 1, 0.36, 1] },
        opacity: { duration: 0.25 },
        rotateY: { duration: 0.3, ease: [0.22, 1, 0.36, 1] },
      },
    },
    exit: (dir: number) => {
      if (transitionEffect === 'slide') {
        return {
          x: dir < 0 ? 90 : -90,
          opacity: 0.4,
          scale: 0.98,
          transition: {
            x: { type: 'spring', stiffness: 200, damping: 25 },
            opacity: { duration: 0.2 },
          },
        };
      }
      if (transitionEffect === 'fade') {
        return {
          opacity: 0.2,
          scale: 0.98,
          transition: {
            opacity: { duration: 0.22 },
          },
        };
      }
      // Efeito Suave & Leve
      return {
        x: dir < 0 ? 50 : -50,
        opacity: 0.45,
        scale: 0.97,
        rotateY: dir < 0 ? 3 : -3,
        transition: {
          x: { type: 'spring', stiffness: 200, damping: 25, mass: 0.8 },
          opacity: { duration: 0.2 },
          rotateY: { duration: 0.25 },
        },
      };
    },
  };

  // Process uploaded files (multiple images and videos)
  const handleFiles = async (files: FileList | File[]) => {
    if (!files || files.length === 0) return;
    setIsUploading(true);
    setUploadFeedback(null);

    const newItems: CouplePhoto[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const isVideo = file.type.startsWith('video/') || file.name.match(/\.(mp4|mov|webm|m4v)$/i);
      const isImage = file.type.startsWith('image/') || file.name.match(/\.(jpg|jpeg|png|webp|gif)$/i);

      if (!isVideo && !isImage) continue;

      try {
        const dataUrl = await readFileAsDataURL(file);
        newItems.push({
          id: `media-${Date.now()}-${i}-${Math.random().toString(36).substr(2, 5)}`,
          url: dataUrl,
          type: isVideo ? 'video' : 'image',
          title: isVideo ? `Vídeo ${mediaList.length + i + 1}` : `Foto ${mediaList.length + i + 1}`,
          caption: '',
          isCustom: true,
        });
      } catch (err) {
        console.error('Error reading file:', file.name, err);
      }
    }

    if (newItems.length > 0) {
      const isOnlyDefaults = mediaList.every((m) => !m.isCustom);
      const updatedList = isOnlyDefaults ? newItems : [...newItems, ...mediaList];

      setMediaList(updatedList);
      saveAllMedia(updatedList);
      setCurrentIndex(0);

      const photosCount = newItems.filter((m) => m.type !== 'video').length;
      const videosCount = newItems.filter((m) => m.type === 'video').length;
      let msg = '';
      if (photosCount > 0 && videosCount > 0) {
        msg = `${photosCount} foto(s) e ${videosCount} vídeo(s) adicionados ao carrossel!`;
      } else if (videosCount > 0) {
        msg = `${videosCount} vídeo(s) adicionado(s) com sucesso!`;
      } else {
        msg = `${photosCount} foto(s) vertical(is) adicionada(s) com sucesso!`;
      }
      setUploadFeedback(msg);
    } else {
      setUploadFeedback('Nenhum arquivo de foto ou vídeo válido foi encontrado.');
    }

    setIsUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const readFileAsDataURL = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleAddMediaByUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMediaUrl.trim()) return;

    const newItem: CouplePhoto = {
      id: `custom-url-${Date.now()}`,
      url: newMediaUrl.trim(),
      type: newMediaType,
      title: newMediaTitle.trim() || (newMediaType === 'video' ? 'Vídeo Especial' : 'Foto Especial'),
      caption: newMediaCaption.trim() || 'Nosso momento gravado com carinho.',
      isCustom: true,
    };

    const updated = [newItem, ...mediaList];
    setMediaList(updated);
    saveAllMedia(updated);

    setNewMediaUrl('');
    setNewMediaTitle('');
    setNewMediaCaption('');
    setUploadFeedback('Item adicionado com sucesso!');
    setCurrentIndex(0);
  };

  const handleDeleteMedia = (id: string) => {
    if (mediaList.length <= 1) {
      alert('Você precisa manter pelo menos um item no carrossel.');
      return;
    }
    const updated = mediaList.filter((m) => m.id !== id);
    setMediaList(updated);
    saveAllMedia(updated);
    if (currentIndex >= updated.length) {
      setCurrentIndex(Math.max(0, updated.length - 1));
    }
  };

  const handleResetDefaults = async () => {
    if (confirm('Deseja restaurar as mídias padrão?')) {
      await clearAllStoredMedia();
      setMediaList(DEFAULT_VERTICAL_MEDIA);
      setCurrentIndex(0);
      setUploadFeedback('Restaurado para as fotos verticais padrão.');
    }
  };

  const photosCount = mediaList.filter((m) => m.type !== 'video').length;
  const videosCount = mediaList.filter((m) => m.type === 'video').length;

  return (
    <section className="py-16 px-4 bg-[#FAF8F5] relative overflow-hidden font-['Plus_Jakarta_Sans',sans-serif]" id="galeria">
      {/* Botanical accents */}
      <div className="absolute top-10 left-2 opacity-40 pointer-events-none hidden md:block">
        <BotanicalBranchLeft className="w-28 h-28 text-teal-800/40" />
      </div>
      <div className="absolute top-10 right-2 opacity-40 pointer-events-none hidden md:block">
        <BotanicalBranchRight className="w-28 h-28 text-teal-800/40" />
      </div>

      <div className="max-w-6xl mx-auto text-center">
        {/* Section Header */}
        <div className="mb-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-teal-800/10 text-teal-900 text-xs uppercase tracking-widest font-semibold mb-2">
            <Heart className="w-3.5 h-3.5 fill-[#C29B88] text-[#C29B88]" />
            <span>Nossa Galeria de Amor</span>
          </div>

          <h2 className="font-['Cormorant_Garamond'] text-3xl sm:text-5xl font-semibold text-stone-800 mb-2">
            Momentos em Fotos & Vídeos
          </h2>
          <p className="text-stone-600 text-xs sm:text-sm max-w-lg mx-auto">
            Nossos momentos mais especiais eternizados em fotos e vídeos verticais.
          </p>

          <BotanicalDivider className="my-3" />

          {/* Quick Stats & Controls Bar - Only visible if showAdminControls is enabled */}
          {showAdminControls && (
            <div className="flex flex-wrap items-center justify-center gap-2.5 mt-3">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-stone-100 text-stone-700 text-xs font-medium">
                <ImageIcon className="w-3.5 h-3.5 text-teal-800" />
                {photosCount} {photosCount === 1 ? 'Foto' : 'Fotos'}
              </span>
              {videosCount > 0 && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 text-teal-900 text-xs font-medium">
                  <Film className="w-3.5 h-3.5 text-teal-700" />
                  {videosCount} {videosCount === 1 ? 'Vídeo' : 'Vídeos'}
                </span>
              )}

              {/* Transition Style Selector */}
              <div className="inline-flex items-center gap-1 p-1 rounded-full bg-white border border-stone-200 shadow-2xs">
                <span className="text-[10px] uppercase font-bold text-stone-400 pl-2 pr-1 hidden sm:inline">
                  Efeito:
                </span>
                <button
                  onClick={() => handleUpdateTransition('coverflow')}
                  className={`px-2.5 py-1 rounded-full text-[11px] font-semibold transition cursor-pointer ${
                    transitionEffect === 'coverflow'
                      ? 'bg-teal-800 text-white shadow-xs'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                  title="Transição com perspectiva tridimensional e rotação"
                >
                  Coverflow 3D ✨
                </button>
                <button
                  onClick={() => handleUpdateTransition('slide')}
                  className={`px-2.5 py-1 rounded-full text-[11px] font-semibold transition cursor-pointer ${
                    transitionEffect === 'slide'
                      ? 'bg-teal-800 text-white shadow-xs'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                  title="Deslize horizontal fluido"
                >
                  Deslize
                </button>
                <button
                  onClick={() => handleUpdateTransition('fade')}
                  className={`px-2.5 py-1 rounded-full text-[11px] font-semibold transition cursor-pointer ${
                    transitionEffect === 'fade'
                      ? 'bg-teal-800 text-white shadow-xs'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                  title="Dissolução suave com leve zoom"
                >
                  Fade Romântico
                </button>
              </div>

              <button
                onClick={() => setIsManageModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-teal-800 hover:bg-teal-900 text-white text-xs font-semibold shadow-xs transition transform hover:scale-102 cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Enviar Mídias</span>
              </button>

              {/* Toggle Cover / Contain Fit */}
              <button
                onClick={() => handleUpdateFitMode(objectFitMode === 'cover' ? 'contain' : 'cover')}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-white hover:bg-stone-50 border border-stone-200 text-stone-600 text-[11px] font-medium transition cursor-pointer"
                title="Alternar entre ajustar foto inteira ou preencher borda"
              >
                <span>Enquadramento:</span>
                <span className="font-bold text-teal-900">
                  {objectFitMode === 'cover' ? 'Preencher' : 'Ajustar'}
                </span>
              </button>
            </div>
          )}
        </div>

        {/* 3-CARD CAROUSEL STAGE (COM EFEITO TRANSLÚCIDO BRANCO LATERAL) */}
        <div
          className="relative w-full max-w-5xl mx-auto my-4 flex items-center justify-center min-h-[480px] sm:min-h-[560px] md:min-h-[600px] overflow-hidden select-none px-2 sm:px-4"
          style={{ perspective: 1200 }}
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          {/* ================= PREVIOUS CARD (Foto Antes com Efeito Translúcido Branco e Borrão) ================= */}
          {totalItems > 1 && prevItem && (
            <div
              onClick={handlePrev}
              className="absolute left-[-20px] xs:left-0 sm:left-4 md:left-8 lg:left-14 top-1/2 -translate-y-1/2 w-[130px] xs:w-[155px] sm:w-[210px] md:w-[245px] lg:w-[270px] aspect-[9/16] rounded-3xl overflow-hidden cursor-pointer z-10 scale-90 sm:scale-95 transition-all duration-500 hover:scale-100 group shadow-[0_15px_35px_rgba(0,0,0,0.2)] border-2 border-white/70 hover:border-white"
              title={`Ver anterior: ${prevItem.title}`}
            >
              {/* Media element with blur */}
              <div className="relative w-full h-full">
                {prevItem.type === 'video' ? (
                  <div className="w-full h-full bg-stone-900 flex items-center justify-center">
                    <video
                      src={prevItem.url}
                      className="w-full h-full object-cover blur-[3px] scale-110"
                      muted
                      playsInline
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                      <Play className="w-6 h-6 fill-white/80 text-white/80" />
                    </div>
                  </div>
                ) : (
                  <img
                    src={prevItem.url}
                    alt={prevItem.title}
                    className="w-full h-full object-cover blur-[3px] scale-110 group-hover:scale-115 transition-transform duration-700"
                    loading="lazy"
                  />
                )}

                {/* Frosted White Luminous Overlay (Branco Puro e Translúcido) */}
                <div className="absolute inset-0 bg-white/40 backdrop-blur-[3px]" />
                <div className="absolute inset-0 bg-gradient-to-b from-white/35 via-white/10 to-transparent" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.45)_0%,rgba(255,255,255,0.15)_65%,transparent_100%)] pointer-events-none" />

                {/* White / Frosted Badge on Top */}
                <div className="absolute top-3 left-3 z-10 flex items-center gap-1 px-2.5 py-1 rounded-full bg-stone-900/60 backdrop-blur-md text-white text-[10px] font-semibold border border-white/30 shadow-xs group-hover:bg-stone-900/80 transition">
                  <ChevronLeft className="w-3 h-3 text-white" />
                  <span className="hidden sm:inline">Anterior</span>
                  <Sparkles className="w-2.5 h-2.5 text-amber-200 ml-0.5" />
                </div>
              </div>
            </div>
          )}

          {/* ================= CENTER ACTIVE CARD (Foto / Vídeo em Destaque) ================= */}
          <div className="relative w-[270px] xs:w-[290px] sm:w-[330px] md:w-[370px] aspect-[9/16] z-20 rounded-3xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.4)] border-2 border-teal-900/20 bg-stone-950 overflow-hidden group">
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={currentItem.id}
                custom={direction}
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.2}
                onDragEnd={(_e, { offset, velocity }) => {
                  if (offset.x < -50 || velocity.x < -300) {
                    handleNext();
                  } else if (offset.x > 50 || velocity.x > 300) {
                    handlePrev();
                  }
                }}
                className="relative w-full h-full flex items-center justify-center overflow-hidden cursor-grab active:cursor-grabbing"
              >
                {/* Ambient Blurred Backdrop */}
                {isCurrentVideo ? (
                  <video
                    src={currentItem.url}
                    className="absolute inset-0 w-full h-full object-cover scale-125 blur-2xl opacity-40 pointer-events-none"
                    muted
                    loop
                    playsInline
                    autoPlay
                  />
                ) : (
                  <img
                    src={currentItem.url}
                    alt=""
                    className="absolute inset-0 w-full h-full object-cover scale-125 blur-2xl opacity-40 pointer-events-none"
                    aria-hidden="true"
                  />
                )}

                {/* Foreground Media Display */}
                {isCurrentVideo ? (
                  <div
                    className="relative w-full h-full flex items-center justify-center cursor-pointer"
                    onClick={toggleVideoPlayback}
                  >
                    <video
                      ref={videoRef}
                      src={currentItem.url}
                      className={`w-full h-full ${
                        objectFitMode === 'contain' ? 'object-contain' : 'object-cover'
                      }`}
                      playsInline
                      muted={isVideoMuted}
                      autoPlay
                      loop
                    />

                    {/* Video Center Play/Pause Indicator Overlay */}
                    <div
                      className={`absolute inset-0 flex items-center justify-center bg-black/25 transition-opacity ${
                        isVideoPlaying ? 'opacity-0 group-hover:opacity-100' : 'opacity-100'
                      }`}
                    >
                      <button
                        onClick={toggleVideoPlayback}
                        className="w-16 h-16 rounded-full bg-white/90 hover:bg-white text-teal-900 shadow-xl flex items-center justify-center transform transition active:scale-95 cursor-pointer backdrop-blur-xs"
                        title={isVideoPlaying ? 'Pausar vídeo' : 'Reproduzir vídeo'}
                      >
                        {isVideoPlaying ? (
                          <Pause className="w-8 h-8 fill-teal-900" />
                        ) : (
                          <Play className="w-8 h-8 fill-teal-900 ml-1" />
                        )}
                      </button>
                    </div>

                    {/* Video Audio Mute Toggle Button */}
                    <button
                      onClick={toggleVideoMute}
                      className="absolute top-4 left-4 z-20 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/60 hover:bg-black/80 text-white text-xs font-semibold backdrop-blur-md transition shadow-md cursor-pointer"
                      title={isVideoMuted ? 'Ativar som do vídeo' : 'Silenciar som do vídeo'}
                    >
                      {isVideoMuted ? (
                        <>
                          <VolumeX className="w-3.5 h-3.5 text-stone-300" />
                          <span className="text-[10px]">Sem Som</span>
                        </>
                      ) : (
                        <>
                          <Volume2 className="w-3.5 h-3.5 text-amber-300" />
                          <span className="text-[10px] text-amber-200">Som Ativo</span>
                        </>
                      )}
                    </button>

                    {/* Video Progress Bar */}
                    <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-white/20 z-20">
                      <div
                        className="h-full bg-amber-400 transition-all duration-200"
                        style={{ width: `${videoProgress}%` }}
                      />
                    </div>
                  </div>
                ) : (
                  <img
                    src={currentItem.url}
                    alt={currentItem.title}
                    className={`w-full h-full transition-transform duration-500 ${
                      objectFitMode === 'contain' ? 'object-contain' : 'object-cover'
                    }`}
                    loading="lazy"
                  />
                )}

                {/* Subtle soft vignette at the very top for counter contrast */}
                <div className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-b from-black/40 to-transparent pointer-events-none z-10" />

                {/* Top Bar Indicators */}
                <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-full bg-black/50 backdrop-blur-md text-white text-[11px] font-semibold flex items-center gap-1 shadow-sm">
                    {isCurrentVideo ? <Film className="w-3 h-3 text-amber-300" /> : <ImageIcon className="w-3 h-3 text-teal-300" />}
                    <span>
                      {currentIndex + 1} / {mediaList.length}
                    </span>
                  </span>

                  <button
                    onClick={() => setIsLightboxOpen(true)}
                    className="p-2 rounded-full bg-black/50 hover:bg-black/80 text-white backdrop-blur-md transition cursor-pointer shadow-sm"
                    title="Ver em tela cheia"
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Left / Right Direct Arrows on Center Card */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                handlePrev();
              }}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-black/45 hover:bg-black/75 text-white backdrop-blur-xs flex items-center justify-center transition transform active:scale-90 cursor-pointer z-30"
              title="Item anterior"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                handleNext();
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-black/45 hover:bg-black/75 text-white backdrop-blur-xs flex items-center justify-center transition transform active:scale-90 cursor-pointer z-30"
              title="Próximo item"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* ================= NEXT CARD (Foto Depois com Efeito Translúcido Branco e Borrão) ================= */}
          {totalItems > 1 && nextItem && (
            <div
              onClick={handleNext}
              className="absolute right-[-20px] xs:right-0 sm:right-4 md:right-8 lg:right-14 top-1/2 -translate-y-1/2 w-[130px] xs:w-[155px] sm:w-[210px] md:w-[245px] lg:w-[270px] aspect-[9/16] rounded-3xl overflow-hidden cursor-pointer z-10 scale-90 sm:scale-95 transition-all duration-500 hover:scale-100 group shadow-[0_15px_35px_rgba(0,0,0,0.2)] border-2 border-white/70 hover:border-white"
              title={`Ver próxima: ${nextItem.title}`}
            >
              {/* Media element with blur */}
              <div className="relative w-full h-full">
                {nextItem.type === 'video' ? (
                  <div className="w-full h-full bg-stone-900 flex items-center justify-center">
                    <video
                      src={nextItem.url}
                      className="w-full h-full object-cover blur-[3px] scale-110"
                      muted
                      playsInline
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                      <Play className="w-6 h-6 fill-white/80 text-white/80" />
                    </div>
                  </div>
                ) : (
                  <img
                    src={nextItem.url}
                    alt={nextItem.title}
                    className="w-full h-full object-cover blur-[3px] scale-110 group-hover:scale-115 transition-transform duration-700"
                    loading="lazy"
                  />
                )}

                {/* Frosted White Luminous Overlay (Branco Puro e Translúcido) */}
                <div className="absolute inset-0 bg-white/40 backdrop-blur-[3px]" />
                <div className="absolute inset-0 bg-gradient-to-b from-white/35 via-white/10 to-transparent" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.45)_0%,rgba(255,255,255,0.15)_65%,transparent_100%)] pointer-events-none" />

                {/* White / Frosted Badge on Top */}
                <div className="absolute top-3 right-3 z-10 flex items-center gap-1 px-2.5 py-1 rounded-full bg-stone-900/60 backdrop-blur-md text-white text-[10px] font-semibold border border-white/30 shadow-xs group-hover:bg-stone-900/80 transition">
                  <Sparkles className="w-2.5 h-2.5 text-amber-200 mr-0.5" />
                  <span className="hidden sm:inline">Próxima</span>
                  <ChevronRight className="w-3 h-3 text-white" />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Thumbnail Reel Strip (Vertical Cards) */}
        <div className="mt-5 flex items-center justify-center gap-2 sm:gap-2.5 overflow-x-auto py-2 px-2 max-w-2xl mx-auto scrollbar-thin">
          {mediaList.map((item, idx) => {
            const isSelected = idx === currentIndex;
            const isVid = item.type === 'video';
            return (
              <button
                key={item.id}
                onClick={() => handleSelectIndex(idx)}
                className={`relative flex-shrink-0 w-12 sm:w-14 h-20 sm:h-24 rounded-2xl overflow-hidden transition-all transform cursor-pointer ${
                  isSelected
                    ? 'ring-3 ring-teal-800 ring-offset-2 scale-105 shadow-lg'
                    : 'opacity-60 hover:opacity-100 hover:scale-102'
                }`}
                title={item.title}
              >
                {isVid ? (
                  <div className="w-full h-full bg-stone-900 flex items-center justify-center relative">
                    <video src={item.url} className="w-full h-full object-cover" muted />
                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                      <Play className="w-4 h-4 fill-white text-white drop-shadow-md" />
                    </div>
                  </div>
                ) : (
                  <img src={item.url} alt={item.title} className="w-full h-full object-cover" />
                )}

                {/* Badge icon */}
                <div className="absolute bottom-1 right-1 p-0.5 rounded-full bg-black/60 text-white">
                  {isVid ? <Film className="w-2.5 h-2.5 text-amber-300" /> : <ImageIcon className="w-2.5 h-2.5" />}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Lightbox Fullscreen Modal */}
      {isLightboxOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex flex-col items-center justify-center p-4 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setIsLightboxOpen(false)}
        >
          <button
            onClick={() => setIsLightboxOpen(false)}
            className="absolute top-5 right-5 p-3 rounded-full bg-white/15 hover:bg-white/30 text-white transition cursor-pointer z-50"
            title="Fechar"
          >
            <X className="w-6 h-6" />
          </button>

          <div
            className="relative max-w-md w-full max-h-[90vh] flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative aspect-[9/16] max-h-[80vh] w-full rounded-3xl overflow-hidden bg-black shadow-2xl flex items-center justify-center">
              {isCurrentVideo ? (
                <video
                  ref={lightboxVideoRef}
                  src={currentItem.url}
                  className="w-full h-full object-contain"
                  controls
                  autoPlay
                  playsInline
                />
              ) : (
                <img
                  src={currentItem.url}
                  alt={currentItem.title}
                  className="w-full h-full object-contain"
                />
              )}
            </div>

            <div className="mt-3 text-center text-white">
              <span className="text-xs uppercase tracking-widest text-teal-200 font-semibold px-3.5 py-1.5 rounded-full bg-white/15 backdrop-blur-md">
                {isCurrentVideo ? 'Vídeo' : 'Foto'} {currentIndex + 1} de {mediaList.length}
              </span>
            </div>

            {/* Navigation in Lightbox */}
            <button
              onClick={handlePrev}
              className="absolute -left-3 sm:-left-12 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/20 hover:bg-white/40 text-white transition cursor-pointer"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              onClick={handleNext}
              className="absolute -right-3 sm:-right-12 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/20 hover:bg-white/40 text-white transition cursor-pointer"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>
        </div>
      )}

      {/* Upload & Media Management Modal */}
      {isManageModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => setIsManageModalOpen(false)}
        >
          <div
            className="bg-white w-full max-w-xl rounded-3xl p-6 sm:p-7 shadow-2xl border border-teal-800/20 my-6 max-h-[90vh] overflow-y-auto text-left relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-teal-50 text-teal-800 flex items-center justify-center">
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-['Cormorant_Garamond'] text-2xl font-bold text-stone-800">
                    Fotos & Vídeos na Vertical
                  </h3>
                  <p className="text-xs text-stone-500">
                    Envie suas fotos e vídeos verticais (celular / WhatsApp) para o carrossel.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsManageModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-stone-100 text-stone-400 hover:text-stone-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Feedback alert */}
            {uploadFeedback && (
              <div className="my-3 p-3 rounded-2xl bg-teal-50 border border-teal-200 text-teal-900 text-xs flex items-center gap-2">
                <Check className="w-4 h-4 text-teal-700 flex-shrink-0" />
                <span>{uploadFeedback}</span>
              </div>
            )}

            {/* Multi-file Drag & Drop Area */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                if (e.dataTransfer.files) {
                  handleFiles(e.dataTransfer.files);
                }
              }}
              className={`my-4 p-6 sm:p-8 rounded-3xl border-2 border-dashed text-center transition cursor-pointer ${
                isDragging
                  ? 'border-teal-700 bg-teal-50/80 scale-101'
                  : 'border-stone-300 hover:border-teal-700 bg-[#FAF8F5]'
              }`}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                type="file"
                ref={fileInputRef}
                multiple
                accept="image/*,video/*,.mp4,.mov,.webm,.m4v"
                onChange={(e) => {
                  if (e.target.files) handleFiles(e.target.files);
                }}
                className="hidden"
              />

              <div className="w-12 h-12 rounded-full bg-teal-800 text-white mx-auto flex items-center justify-center mb-3 shadow-md">
                <Upload className="w-6 h-6" />
              </div>

              <h4 className="text-sm font-bold text-stone-800 mb-1">
                Clique para selecionar ou arraste suas fotos e vídeos
              </h4>
              <p className="text-xs text-stone-500 max-w-sm mx-auto">
                Suporta múltiplas fotos (JPG, PNG) e vídeos verticais (MP4, MOV, WebM).
              </p>

              {isUploading && (
                <div className="mt-3 flex items-center justify-center gap-2 text-xs text-teal-800 font-semibold">
                  <div className="w-3.5 h-3.5 border-2 border-teal-800 border-t-transparent rounded-full animate-spin"></div>
                  <span>Processando e salvando arquivos...</span>
                </div>
              )}
            </div>

            {/* Or add by URL */}
            <form onSubmit={handleAddMediaByUrl} className="p-4 rounded-2xl bg-stone-50 border border-stone-200 mb-4 space-y-2.5">
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider">
                Ou adicionar por Link Direto (URL)
              </label>

              <div className="flex gap-2 mb-2">
                <button
                  type="button"
                  onClick={() => setNewMediaType('image')}
                  className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 cursor-pointer transition ${
                    newMediaType === 'image'
                      ? 'bg-teal-800 text-white'
                      : 'bg-stone-200 text-stone-700 hover:bg-stone-300'
                  }`}
                >
                  <ImageIcon className="w-3 h-3" /> Foto
                </button>
                <button
                  type="button"
                  onClick={() => setNewMediaType('video')}
                  className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 cursor-pointer transition ${
                    newMediaType === 'video'
                      ? 'bg-teal-800 text-white'
                      : 'bg-stone-200 text-stone-700 hover:bg-stone-300'
                  }`}
                >
                  <Film className="w-3 h-3" /> Vídeo (MP4)
                </button>
              </div>

              <input
                type="url"
                placeholder={newMediaType === 'video' ? 'https://.../video.mp4' : 'https://.../foto.jpg'}
                value={newMediaUrl}
                onChange={(e) => setNewMediaUrl(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs bg-white focus:outline-hidden focus:ring-2 focus:ring-teal-700"
              />

              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="Título (opcional)"
                  value={newMediaTitle}
                  onChange={(e) => setNewMediaTitle(e.target.value)}
                  className="px-3 py-1.5 rounded-xl border border-stone-300 text-xs bg-white"
                />
                <input
                  type="text"
                  placeholder="Legenda (opcional)"
                  value={newMediaCaption}
                  onChange={(e) => setNewMediaCaption(e.target.value)}
                  className="px-3 py-1.5 rounded-xl border border-stone-300 text-xs bg-white"
                />
              </div>

              <button
                type="submit"
                disabled={!newMediaUrl.trim()}
                className="w-full py-2 rounded-xl bg-stone-800 hover:bg-stone-900 disabled:opacity-40 text-white text-xs font-semibold transition cursor-pointer"
              >
                Adicionar Link
              </button>
            </form>

            {/* Existing media list with delete */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs uppercase tracking-wider font-bold text-stone-700">
                  Itens no Carrossel ({mediaList.length})
                </h4>
                <button
                  type="button"
                  onClick={handleResetDefaults}
                  className="text-[11px] text-stone-500 hover:text-stone-800 underline cursor-pointer"
                >
                  Restaurar padrão
                </button>
              </div>

              <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                {mediaList.map((item, idx) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-2 rounded-xl bg-stone-50 border border-stone-200 text-xs"
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <div className="w-8 h-12 rounded-lg bg-stone-200 overflow-hidden flex-shrink-0 relative">
                        {item.type === 'video' ? (
                          <div className="w-full h-full bg-stone-800 flex items-center justify-center">
                            <Film className="w-3.5 h-3.5 text-amber-300" />
                          </div>
                        ) : (
                          <img src={item.url} alt="" className="w-full h-full object-cover" />
                        )}
                      </div>
                      <div className="truncate">
                        <span className="font-semibold text-stone-800 block truncate">{item.title}</span>
                        <span className="text-[10px] text-stone-500 block">
                          {item.type === 'video' ? '🎬 Vídeo' : '📷 Foto'} • Item {idx + 1}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleDeleteMedia(item.id)}
                      className="p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer"
                      title="Remover"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="mt-5 pt-3 border-t border-stone-100 flex justify-end">
              <button
                onClick={() => setIsManageModalOpen(false)}
                className="px-6 py-2 rounded-full bg-teal-800 hover:bg-teal-900 text-white text-xs font-semibold shadow-xs cursor-pointer transition"
              >
                Concluir & Visualizar
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
