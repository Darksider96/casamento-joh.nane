import React, { useState, useEffect, useRef } from 'react';
import {
  Lock,
  Unlock,
  KeyRound,
  Eye,
  EyeOff,
  FileSpreadsheet,
  Upload,
  Image as ImageIcon,
  Film,
  Trash2,
  ExternalLink,
  LogOut,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Users,
  Search,
  Download,
  ArrowLeft,
  Sparkles,
  Sliders,
  Layers,
  Maximize2,
  Check,
  Plus,
  Play,
  Music,
  ListMusic,
  MoveUp,
  MoveDown,
  RotateCcw,
  Volume2,
} from 'lucide-react';
import { User } from 'firebase/auth';
import { CouplePhoto, RSVPData, SheetsConfig, TransitionStyle, ObjectFitMode, MusicTrack } from '../types';
import {
  getStoredMedia,
  saveAllMedia,
  clearAllStoredMedia,
  getCarouselConfig,
  loadCarouselConfig,
  saveCarouselConfig,
} from '../lib/mediaStorage';
import {
  getStoredTracks,
  loadStoredTracks,
  saveStoredTracks,
  resetStoredTracks,
  extractYouTubeId,
  USER_DEFAULT_TRACKS,
} from '../lib/musicStorage';
import { createRSVPSheet, batchAppendRSVPs, verifySheetAccess } from '../lib/sheetsService';
import { adminSignIn, googleSignIn, logoutGoogle } from '../lib/googleAuth';
import { isAdminEmail } from '../lib/firebase';
import { PhotoCarousel } from './PhotoCarousel';

interface AdminDashboardProps {
  onNavigateHome: () => void;
  rsvps: RSVPData[];
  sheetsConfig: SheetsConfig | null;
  onUpdateConfig: (config: SheetsConfig | null) => void;
  onUpdateRSVPs: (rsvps: RSVPData[]) => void;
  user: User | null;
  accessToken: string | null;
  onAuthChange: (user: User | null, token: string | null) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  onNavigateHome,
  rsvps,
  sheetsConfig,
  onUpdateConfig,
  onUpdateRSVPs,
  user,
  accessToken,
  onAuthChange,
}) => {
  // Authentication state
  const isAuthenticated = isAdminEmail(user?.email);
  const [authError, setAuthError] = useState<string | null>(null);

  // Active Admin Tab
  const [activeTab, setActiveTab] = useState<'media' | 'music' | 'rsvps' | 'sheets'>('rsvps');

  // Music Playlist state
  const [playlistTracks, setPlaylistTracks] = useState<MusicTrack[]>(getStoredTracks);
  const [musicFeedback, setMusicFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [newTrackUrl, setNewTrackUrl] = useState('');
  const [newTrackTitle, setNewTrackTitle] = useState('');
  const [newTrackArtist, setNewTrackArtist] = useState('');

  // Sync with global playlist updates
  useEffect(() => {
    loadStoredTracks().catch((error) => console.warn('Não foi possível carregar a playlist.', error));

    const handlePlaylistUpdate = (e: any) => {
      if (e.detail && Array.isArray(e.detail) && e.detail.length > 0) {
        setPlaylistTracks(e.detail);
      }
    };
    window.addEventListener('wedding_playlist_updated', handlePlaylistUpdate);
    return () => {
      window.removeEventListener('wedding_playlist_updated', handlePlaylistUpdate);
    };
  }, []);

  // Carousel config state
  const [carouselConfig, setCarouselConfig] = useState(getCarouselConfig);

  // Media state
  const [mediaList, setMediaList] = useState<CouplePhoto[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadFeedback, setUploadFeedback] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Direct link form
  const [newMediaUrl, setNewMediaUrl] = useState('');
  const [newMediaType, setNewMediaType] = useState<'image' | 'video'>('image');
  const [newMediaTitle, setNewMediaTitle] = useState('');
  const [newMediaCaption, setNewMediaCaption] = useState('');

  // Google Sheets state
  const [isCreatingSheet, setIsCreatingSheet] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [customSheetInput, setCustomSheetInput] = useState('');
  const [sheetsMessage, setSheetsMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // RSVP filters
  const [rsvpSearch, setRsvpSearch] = useState('');
  const [rsvpFilter, setRsvpFilter] = useState<'all' | 'yes' | 'no'>('all');

  // Load media items from IndexedDB
  useEffect(() => {
    getStoredMedia()
      .then((stored) => {
        if (stored && stored.length > 0) setMediaList(stored);
      })
      .catch((error) => setUploadFeedback(`Erro ao carregar mídias: ${error.message}`));
    loadCarouselConfig().then(setCarouselConfig).catch((error) => {
      console.warn('Não foi possível carregar a configuração do carrossel.', error);
    });
  }, []);

  const handleAdminLogin = async () => {
    setIsSigningIn(true);
    setAuthError(null);
    try {
      const signedInUser = await adminSignIn();
      onAuthChange(signedInUser, null);
    } catch (error: any) {
      setAuthError(error.message || 'Não foi possível entrar com a Conta Google.');
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleLogout = async () => {
    await logoutGoogle();
    onAuthChange(null, null);
  };

  // Carousel transition update
  const handleTransitionChange = (transitionEffect: TransitionStyle) => {
    const updated = { ...carouselConfig, transitionEffect };
    setCarouselConfig(updated);
    saveCarouselConfig(updated);
    setUploadFeedback('Transição padrão do carrossel atualizada com sucesso!');
    setTimeout(() => setUploadFeedback(null), 3500);
  };

  // Carousel fit mode update
  const handleFitModeChange = (objectFitMode: ObjectFitMode) => {
    const updated = { ...carouselConfig, objectFitMode };
    setCarouselConfig(updated);
    saveCarouselConfig(updated);
    setUploadFeedback('Enquadramento padrão do carrossel atualizado com sucesso!');
    setTimeout(() => setUploadFeedback(null), 3500);
  };

  // Music Playlist Handlers
  const handleMoveTrack = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= playlistTracks.length) return;

    const updated = [...playlistTracks];
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;

    const reindexed = updated.map((t, i) => ({ ...t, id: i + 1 }));
    setPlaylistTracks(reindexed);
    saveStoredTracks(reindexed);
    setMusicFeedback({
      type: 'success',
      text: `Música "${temp.title}" movida para a posição #${targetIndex + 1}!`,
    });
    setTimeout(() => setMusicFeedback(null), 3000);
  };

  const handleDeleteTrack = (indexToDelete: number) => {
    if (playlistTracks.length <= 1) {
      setMusicFeedback({
        type: 'error',
        text: 'A playlist precisa de pelo menos uma música para tocar.',
      });
      setTimeout(() => setMusicFeedback(null), 3000);
      return;
    }
    const trackToRemove = playlistTracks[indexToDelete];
    const filtered = playlistTracks.filter((_, idx) => idx !== indexToDelete);
    const reindexed = filtered.map((t, i) => ({ ...t, id: i + 1 }));
    setPlaylistTracks(reindexed);
    saveStoredTracks(reindexed);
    setMusicFeedback({
      type: 'success',
      text: `Música "${trackToRemove.title}" removida da playlist.`,
    });
    setTimeout(() => setMusicFeedback(null), 3000);
  };

  const handleUpdateTrackField = (index: number, field: 'title' | 'artist' | 'youtubeUrl', value: string) => {
    const updated = [...playlistTracks];
    const current = { ...updated[index], [field]: value };
    if (field === 'youtubeUrl') {
      const extractedId = extractYouTubeId(value);
      if (extractedId) {
        current.youtubeId = extractedId;
      }
    }
    updated[index] = current;
    setPlaylistTracks(updated);
  };

  const handleSaveMusicChanges = () => {
    const validated = playlistTracks.map((t, idx) => {
      const id = extractYouTubeId(t.youtubeUrl) || t.youtubeId;
      return {
        ...t,
        id: idx + 1,
        title: t.title.trim() || `Música ${idx + 1}`,
        artist: t.artist.trim() || 'Trilha do Casal',
        youtubeUrl: t.youtubeUrl.trim() || `https://www.youtube.com/watch?v=${id}`,
        youtubeId: id,
      };
    });
    setPlaylistTracks(validated);
    saveStoredTracks(validated);
    setMusicFeedback({
      type: 'success',
      text: `Trilha sonora de ${validated.length} músicas salva com sucesso no convite!`,
    });
    setTimeout(() => setMusicFeedback(null), 3500);
  };

  const handleAddMusic = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTrackUrl.trim()) {
      setMusicFeedback({ type: 'error', text: 'Informe a URL ou o ID do vídeo do YouTube.' });
      setTimeout(() => setMusicFeedback(null), 3000);
      return;
    }
    const extractedId = extractYouTubeId(newTrackUrl);
    if (!extractedId) {
      setMusicFeedback({ type: 'error', text: 'Link do YouTube inválido. Cole a URL completa ou o código de 11 caracteres.' });
      setTimeout(() => setMusicFeedback(null), 3000);
      return;
    }
    const newTrack: MusicTrack = {
      id: playlistTracks.length + 1,
      title: newTrackTitle.trim() || `Música ${playlistTracks.length + 1}`,
      artist: newTrackArtist.trim() || 'Trilha do Casal',
      youtubeUrl: newTrackUrl.trim(),
      youtubeId: extractedId,
    };
    const updated = [...playlistTracks, newTrack];
    setPlaylistTracks(updated);
    saveStoredTracks(updated);
    setNewTrackUrl('');
    setNewTrackTitle('');
    setNewTrackArtist('');
    setMusicFeedback({
      type: 'success',
      text: `Música "${newTrack.title}" adicionada como #${newTrack.id}!`,
    });
    setTimeout(() => setMusicFeedback(null), 3500);
  };

  const handleRestoreDefaultPlaylist = () => {
    const defaults = resetStoredTracks();
    setPlaylistTracks(defaults);
    setMusicFeedback({
      type: 'success',
      text: 'Playlist restaurada na ordem desejada: #1 Aerosmith, #2 Always (Bon Jovi), #3 Leal (Djonga), #4 Semente (Armandinho).',
    });
    setTimeout(() => setMusicFeedback(null), 4000);
  };

  // Process uploaded files
  const handleFiles = async (files: FileList) => {
    if (!files || files.length === 0) return;
    setIsUploading(true);
    setUploadFeedback(null);

    const newItems: CouplePhoto[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const isVideo = file.type.startsWith('video/') || file.name.match(/\.(mp4|mov|webm|m4v)$/i);
      const isImage = file.type.startsWith('image/');

      if (!isImage && !isVideo) continue;

      try {
        const dataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

        newItems.push({
          id: `custom-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
          type: isVideo ? 'video' : 'image',
          url: dataUrl,
          title: isVideo ? `Vídeo ${mediaList.length + i + 1}` : `Foto ${mediaList.length + i + 1}`,
          caption: '',
          isCustom: true,
        });
      } catch (err) {
        console.error('Error reading file:', err);
      }
    }

    if (newItems.length > 0) {
      const updated = [...mediaList, ...newItems];
      try {
        const saved = await saveAllMedia(updated);
        setMediaList(saved);
        setUploadFeedback(`${newItems.length} arquivo(s) adicionado(s) com sucesso ao carrossel!`);
      } catch (error: any) {
        setUploadFeedback(error.message || 'Não foi possível enviar os arquivos.');
      }
    } else {
      setUploadFeedback('Nenhum arquivo de imagem ou vídeo compatível encontrado.');
    }

    setIsUploading(false);
    setTimeout(() => setUploadFeedback(null), 4000);
  };

  // Add media by direct link
  const handleAddMediaByUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMediaUrl.trim()) return;

    const newItem: CouplePhoto = {
      id: `url-${Date.now()}`,
      type: newMediaType,
      url: newMediaUrl.trim(),
      title: newMediaTitle.trim() || (newMediaType === 'video' ? 'Vídeo dos Noivos' : 'Foto dos Noivos'),
      caption: newMediaCaption.trim() || 'Momento inesquecível registrado com carinho.',
      isCustom: true,
    };

    const updated = [...mediaList, newItem];
    const saved = await saveAllMedia(updated);
    setMediaList(saved);

    setNewMediaUrl('');
    setNewMediaTitle('');
    setNewMediaCaption('');
    setUploadFeedback('Mídia adicionada com sucesso por link!');
    setTimeout(() => setUploadFeedback(null), 4000);
  };

  // Delete media item
  const handleDeleteMedia = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja remover esta mídia do carrossel?')) return;
    const updated = mediaList.filter((m) => m.id !== id);
    const saved = await saveAllMedia(updated);
    setMediaList(saved);
    setUploadFeedback('Item removido com sucesso.');
    setTimeout(() => setUploadFeedback(null), 3000);
  };

  // Restore defaults
  const handleResetDefaults = async () => {
    if (!window.confirm('Deseja restaurar as fotos padrão originais do carrossel?')) return;
    await clearAllStoredMedia();
    window.location.reload();
  };

  // Delete individual RSVP
  const handleDeleteRSVP = (id: string) => {
    if (!window.confirm('Deseja remover esta resposta de confirmação?')) return;
    const updated = rsvps.filter((r) => r.id !== id);
    onUpdateRSVPs(updated);
  };

  // Export CSV
  const handleExportCSV = () => {
    if (!rsvps.length) {
      alert('Nenhuma confirmação recebida ainda para exportar.');
      return;
    }

    const headers = ['Data', 'Nome', 'Status', 'Adultos', 'Criancas', 'Acompanhantes', 'Telefone', 'Restricoes', 'Mensagem'];
    const rows = rsvps.map((r) => [
      `"${new Date(r.submittedAt).toLocaleString('pt-BR')}"`,
      `"${r.fullName.replace(/"/g, '""')}"`,
      `"${r.attending === 'yes' ? 'Confirmado' : 'Recusado'}"`,
      r.adultsCount,
      r.childrenCount,
      `"${(r.companionNames || '').replace(/"/g, '""')}"`,
      `"${r.phone}"`,
      `"${(r.dietaryRestrictions || '').replace(/"/g, '""')}"`,
      `"${(r.message || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `lista_convidados_casamento_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Google Sign-In
  const handleGoogleLogin = async () => {
    setIsSigningIn(true);
    setSheetsMessage(null);
    try {
      const result = await googleSignIn();
      if (result) {
        onAuthChange(result.user, result.accessToken);
        setSheetsMessage({ type: 'success', text: `Conectado com sucesso como ${result.user.email}!` });
      }
    } catch (err: any) {
      console.error(err);
      setSheetsMessage({ type: 'error', text: err.message || 'Falha ao conectar com o Google.' });
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleGoogleLogout = async () => {
    await logoutGoogle();
    onAuthChange(null, null);
    setSheetsMessage({ type: 'success', text: 'Você saiu da conta Google.' });
  };

  // Create automatic sheet
  const handleCreateAutoSheet = async () => {
    if (!accessToken) {
      setSheetsMessage({ type: 'error', text: 'Por favor, conecte sua Conta Google primeiro.' });
      return;
    }

    setIsCreatingSheet(true);
    setSheetsMessage(null);

    try {
      const result = await createRSVPSheet(accessToken, 'RSVP - Casamento Johnatan & Regiane 2026');
      const newConfig: SheetsConfig = {
        spreadsheetId: result.spreadsheetId,
        spreadsheetUrl: result.spreadsheetUrl,
        sheetTitle: 'RSVP - Casamento Johnatan & Regiane 2026',
        autoSync: true,
        lastSyncedAt: new Date().toISOString(),
      };
      onUpdateConfig(newConfig);

      if (rsvps.length > 0) {
        await batchAppendRSVPs(accessToken, result.spreadsheetId, rsvps);
        const updated = rsvps.map((r) => ({ ...r, syncedToSheets: true }));
        onUpdateRSVPs(updated);
      }

      setSheetsMessage({
        type: 'success',
        text: 'Planilha criada com sucesso no seu Google Drive! Todas as confirmações serão sincronizadas nela.',
      });
    } catch (err: any) {
      console.error(err);
      setSheetsMessage({ type: 'error', text: err.message || 'Erro ao criar planilha no Google Sheets.' });
    } finally {
      setIsCreatingSheet(false);
    }
  };

  // Link existing sheet
  const handleLinkCustomSheet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken) {
      setSheetsMessage({ type: 'error', text: 'Conecte sua Conta Google primeiro.' });
      return;
    }
    if (!customSheetInput.trim()) return;

    let sheetId = customSheetInput.trim();
    const match = sheetId.match(/\/d\/([a-zA-Z0-9-_]+)/);
    if (match && match[1]) {
      sheetId = match[1];
    }

    setIsSyncing(true);
    setSheetsMessage(null);

    try {
      const info = await verifySheetAccess(accessToken, sheetId);
      const newConfig: SheetsConfig = {
        spreadsheetId: sheetId,
        spreadsheetUrl: `https://docs.google.com/spreadsheets/d/${sheetId}/edit`,
        sheetTitle: info.title,
        autoSync: true,
        lastSyncedAt: new Date().toISOString(),
      };
      onUpdateConfig(newConfig);
      setSheetsMessage({ type: 'success', text: `Planilha vinculada com sucesso: "${info.title}"!` });
      setCustomSheetInput('');
    } catch (err: any) {
      console.error(err);
      setSheetsMessage({ type: 'error', text: err.message || 'Não foi possível vincular esta planilha. Verifique as permissões.' });
    } finally {
      setIsSyncing(false);
    }
  };

  // Sync RSVPs
  const handleSyncPendingRSVPs = async () => {
    if (!sheetsConfig?.spreadsheetId || !accessToken) {
      setSheetsMessage({ type: 'error', text: 'Conecte sua conta Google e certifique-se de ter uma planilha vinculada.' });
      return;
    }

    setIsSyncing(true);
    setSheetsMessage(null);

    try {
      const unsynced = rsvps.filter((r) => !r.syncedToSheets);
      if (unsynced.length === 0) {
        setSheetsMessage({ type: 'success', text: 'Todas as confirmações já estão sincronizadas com a planilha!' });
        setIsSyncing(false);
        return;
      }

      await batchAppendRSVPs(accessToken, sheetsConfig.spreadsheetId, unsynced);
      const updated = rsvps.map((r) => ({ ...r, syncedToSheets: true }));
      onUpdateRSVPs(updated);
      onUpdateConfig({ ...sheetsConfig, lastSyncedAt: new Date().toISOString() });
      setSheetsMessage({ type: 'success', text: `${unsynced.length} confirmação(ões) sincronizada(s) para o Google Sheets!` });
    } catch (err: any) {
      console.error(err);
      setSheetsMessage({ type: 'error', text: err.message || 'Erro ao sincronizar com o Google Sheets.' });
    } finally {
      setIsSyncing(false);
    }
  };

  // Stats calculation
  const confirmedRSVPs = rsvps.filter((r) => r.attending === 'yes');
  const declinedRSVPs = rsvps.filter((r) => r.attending === 'no');
  const totalAdults = confirmedRSVPs.reduce((acc, curr) => acc + (curr.adultsCount || 0), 0);
  const totalChildren = confirmedRSVPs.reduce((acc, curr) => acc + (curr.childrenCount || 0), 0);
  const totalGuests = totalAdults + totalChildren;

  // Filtered RSVPs
  const filteredRSVPs = rsvps.filter((item) => {
    const matchesFilter =
      rsvpFilter === 'all' ? true : rsvpFilter === 'yes' ? item.attending === 'yes' : item.attending === 'no';
    const matchesSearch =
      item.fullName.toLowerCase().includes(rsvpSearch.toLowerCase()) ||
      item.phone.includes(rsvpSearch) ||
      (item.companionNames && item.companionNames.toLowerCase().includes(rsvpSearch.toLowerCase()));
    return matchesFilter && matchesSearch;
  });

  // ==========================================
  // VIEW 1: PASSWORD GATE (IF NOT AUTHENTICATED)
  // ==========================================
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#F2F7F4] via-[#FAF6F3] to-[#F8FAF8] flex flex-col justify-center items-center px-4 py-12">
        <div className="w-full max-w-md bg-white rounded-3xl p-8 sm:p-10 shadow-2xl border border-stone-200 text-center relative overflow-hidden">
          {/* Ambient top decoration */}
          <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-teal-700 via-[#C29B88] to-teal-800" />

          {/* Lock Icon */}
          <div className="w-16 h-16 rounded-2xl bg-teal-50 text-teal-800 border border-teal-800/15 mx-auto flex items-center justify-center mb-5 shadow-xs">
            <Lock className="w-8 h-8" />
          </div>

          <span className="text-[11px] font-bold uppercase tracking-widest text-[#A66E5B] block mb-1">
            Área dos Noivos
          </span>
          <h1 className="font-['Cormorant_Garamond'] text-3xl font-bold text-stone-800 mb-2">
            Acesso Administrativo
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 mb-6 leading-relaxed">
            Entre com a Conta Google autorizada para gerenciar fotos, vídeos e confirmações de presença.
          </p>

          <div className="space-y-4 text-left">

            {authError && (
              <div className="p-3 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2 animate-in fade-in duration-200">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{authError}</span>
              </div>
            )}

            <button
              type="button"
              onClick={handleAdminLogin}
              disabled={isSigningIn}
              className="w-full py-3.5 rounded-2xl bg-teal-800 hover:bg-teal-900 disabled:opacity-60 text-white text-sm font-semibold shadow-md transition transform active:scale-98 cursor-pointer flex items-center justify-center gap-2"
            >
              <KeyRound className="w-4 h-4" />
              <span>{isSigningIn ? 'Entrando...' : 'Entrar com Google'}</span>
            </button>
          </div>

          <div className="mt-6 pt-5 border-t border-stone-100 flex items-center justify-center">
            <button
              onClick={onNavigateHome}
              className="inline-flex items-center gap-1.5 text-xs text-stone-500 hover:text-stone-800 transition cursor-pointer font-medium"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Voltar ao Convite do Casamento</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // VIEW 2: FULL ADMIN DASHBOARD (AUTHENTICATED)
  // ==========================================
  return (
    <div className="min-h-screen bg-[#F8FAF8] text-stone-800 font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Top Admin Header Bar */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-stone-200 shadow-2xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-18 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-800 text-white flex items-center justify-center shadow-xs">
              <Sparkles className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-['Cormorant_Garamond'] text-xl sm:text-2xl font-bold text-stone-800 leading-none">
                  Painel dos Noivos • Johnatan & Regiane
                </h1>
                <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold">
                  <Unlock className="w-2.5 h-2.5" /> Acesso /admin
                </span>
              </div>
              <p className="text-[11px] text-stone-500 hidden sm:block">
                Controle do Carrossel de Fotos, Efeitos e Lista de Presenças
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={onNavigateHome}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold transition cursor-pointer"
              title="Voltar para a página pública do convite"
            >
              <ExternalLink className="w-3.5 h-3.5 text-teal-800" />
              <span className="hidden xs:inline">Ver Convite</span>
            </button>

            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-semibold transition cursor-pointer"
              title="Encerrar sessão de administrador"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">Sair</span>
            </button>
          </div>
        </div>

        {/* Admin Navigation Tabs */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center gap-2 border-t border-stone-100 overflow-x-auto">
          <button
            onClick={() => setActiveTab('music')}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'music'
                ? 'border-teal-800 text-teal-900 bg-teal-50/50'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <Music className="w-4 h-4 text-teal-800" />
            <span>Músicas & Trilha Sonora</span>
            <span className="px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 text-[10px]">
              {playlistTracks.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('rsvps')}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'rsvps'
                ? 'border-teal-800 text-teal-900 bg-teal-50/50'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Lista de Convidados (RSVP)</span>
            <span className="px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 text-[10px]">
              {rsvps.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('sheets')}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'sheets'
                ? 'border-teal-800 text-teal-900 bg-teal-50/50'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Google Planilhas</span>
            {sheetsConfig?.spreadsheetId && (
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
            )}
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {/* Global Feedback notification */}
        {uploadFeedback && (
          <div className="mb-6 p-4 rounded-2xl bg-teal-50 border border-teal-200 text-teal-900 text-xs flex items-center gap-2 shadow-xs animate-in fade-in duration-200">
            <Check className="w-4 h-4 text-teal-700 flex-shrink-0" />
            <span className="font-semibold">{uploadFeedback}</span>
          </div>
        )}

        {musicFeedback && (
          <div
            className={`mb-6 p-4 rounded-2xl text-xs flex items-center gap-2 shadow-xs animate-in fade-in duration-200 ${
              musicFeedback.type === 'success'
                ? 'bg-teal-50 border border-teal-200 text-teal-900'
                : 'bg-red-50 border border-red-200 text-red-800'
            }`}
          >
            {musicFeedback.type === 'success' ? (
              <Check className="w-4 h-4 text-teal-700 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
            )}
            <span className="font-semibold">{musicFeedback.text}</span>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 1: MEDIA & CAROUSEL SETTINGS                         */}
        {/* ======================================================== */}
        {activeTab === 'media' && (
          <div className="space-y-8">
            {/* 1. Presentation Settings Card */}
            <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-xs border border-stone-200">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-800 flex items-center justify-center">
                  <Sliders className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-['Cormorant_Garamond'] text-2xl font-bold text-stone-800">
                    Configurações de Exibição do Carrossel
                  </h3>
                  <p className="text-xs text-stone-500">
                    Defina o estilo padrão de transição e o enquadramento que os convidados verão no site.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2 border-t border-stone-100">
                {/* Transition Effect Selector */}
                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-2">
                    Efeito de Transição Padrão
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => handleTransitionChange('coverflow')}
                      className={`p-3 rounded-2xl border text-center transition cursor-pointer flex flex-col items-center justify-center gap-1 ${
                        carouselConfig.transitionEffect === 'coverflow'
                          ? 'border-teal-800 bg-teal-50/70 text-teal-900 font-bold ring-2 ring-teal-800/20'
                          : 'border-stone-200 hover:border-stone-300 text-stone-600 bg-white'
                      }`}
                    >
                      <Layers className="w-4 h-4 text-teal-800" />
                      <span className="text-xs">Coverflow 3D</span>
                      <span className="text-[10px] text-stone-400">Perspectiva 3D</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleTransitionChange('slide')}
                      className={`p-3 rounded-2xl border text-center transition cursor-pointer flex flex-col items-center justify-center gap-1 ${
                        carouselConfig.transitionEffect === 'slide'
                          ? 'border-teal-800 bg-teal-50/70 text-teal-900 font-bold ring-2 ring-teal-800/20'
                          : 'border-stone-200 hover:border-stone-300 text-stone-600 bg-white'
                      }`}
                    >
                      <Sparkles className="w-4 h-4 text-teal-800" />
                      <span className="text-xs">Deslize</span>
                      <span className="text-[10px] text-stone-400">Horizontal suave</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleTransitionChange('fade')}
                      className={`p-3 rounded-2xl border text-center transition cursor-pointer flex flex-col items-center justify-center gap-1 ${
                        carouselConfig.transitionEffect === 'fade'
                          ? 'border-teal-800 bg-teal-50/70 text-teal-900 font-bold ring-2 ring-teal-800/20'
                          : 'border-stone-200 hover:border-stone-300 text-stone-600 bg-white'
                      }`}
                    >
                      <Sparkles className="w-4 h-4 text-amber-500" />
                      <span className="text-xs">Fade</span>
                      <span className="text-[10px] text-stone-400">Dissolução suave</span>
                    </button>
                  </div>
                </div>

                {/* Object Fit Selector */}
                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-2">
                    Enquadramento das Fotos & Vídeos Verticais
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => handleFitModeChange('cover')}
                      className={`p-3 rounded-2xl border text-center transition cursor-pointer flex flex-col items-center justify-center gap-1 ${
                        carouselConfig.objectFitMode === 'cover'
                          ? 'border-teal-800 bg-teal-50/70 text-teal-900 font-bold ring-2 ring-teal-800/20'
                          : 'border-stone-200 hover:border-stone-300 text-stone-600 bg-white'
                      }`}
                    >
                      <Maximize2 className="w-4 h-4 text-teal-800" />
                      <span className="text-xs">Preencher (Cover)</span>
                      <span className="text-[10px] text-stone-400">Preenche toda a borda</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleFitModeChange('contain')}
                      className={`p-3 rounded-2xl border text-center transition cursor-pointer flex flex-col items-center justify-center gap-1 ${
                        carouselConfig.objectFitMode === 'contain'
                          ? 'border-teal-800 bg-teal-50/70 text-teal-900 font-bold ring-2 ring-teal-800/20'
                          : 'border-stone-200 hover:border-stone-300 text-stone-600 bg-white'
                      }`}
                    >
                      <ImageIcon className="w-4 h-4 text-teal-800" />
                      <span className="text-xs">Ajustar (Contain)</span>
                      <span className="text-[10px] text-stone-400">Foto inteira visível</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Upload Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Drag and Drop File Upload */}
              <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-xs border border-stone-200 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Upload className="w-5 h-5 text-teal-800" />
                    <h3 className="font-['Cormorant_Garamond'] text-2xl font-bold text-stone-800">
                      Enviar Arquivos do Celular ou Computador
                    </h3>
                  </div>
                  <p className="text-xs text-stone-500 mb-4">
                    Envie várias fotos (JPG, PNG) ou vídeos na vertical (MP4, MOV, WebM).
                  </p>

                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDragging(true);
                    }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setIsDragging(false);
                      if (e.dataTransfer.files) handleFiles(e.dataTransfer.files);
                    }}
                    onClick={() => fileInputRef.current?.click()}
                    className={`p-8 rounded-3xl border-2 border-dashed text-center transition cursor-pointer ${
                      isDragging
                        ? 'border-teal-800 bg-teal-50/80 scale-101'
                        : 'border-stone-300 hover:border-teal-800 bg-[#FAF8F5]'
                    }`}
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

                    <div className="w-12 h-12 rounded-2xl bg-teal-800 text-white mx-auto flex items-center justify-center mb-3 shadow-md">
                      <Upload className="w-6 h-6" />
                    </div>

                    <h4 className="text-sm font-bold text-stone-800 mb-1">
                      Clique para escolher ou arraste seus arquivos aqui
                    </h4>
                    <p className="text-xs text-stone-500">
                      Suporte a múltiplas fotos e vídeos simultâneos
                    </p>

                    {isUploading && (
                      <div className="mt-4 flex items-center justify-center gap-2 text-xs text-teal-800 font-semibold">
                        <div className="w-4 h-4 border-2 border-teal-800 border-t-transparent rounded-full animate-spin"></div>
                        <span>Processando arquivos...</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Add by Direct Link */}
              <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-xs border border-stone-200">
                <div className="flex items-center gap-2 mb-2">
                  <ExternalLink className="w-5 h-5 text-teal-800" />
                  <h3 className="font-['Cormorant_Garamond'] text-2xl font-bold text-stone-800">
                    Adicionar por Link Direto (URL)
                  </h3>
                </div>
                <p className="text-xs text-stone-500 mb-4">
                  Cole o endereço web de qualquer imagem ou vídeo vertical hospedado online.
                </p>

                <form onSubmit={handleAddMediaByUrl} className="space-y-3">
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setNewMediaType('image')}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition ${
                        newMediaType === 'image'
                          ? 'bg-teal-800 text-white'
                          : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                      }`}
                    >
                      <ImageIcon className="w-3.5 h-3.5" /> Foto (JPG/PNG)
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewMediaType('video')}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition ${
                        newMediaType === 'video'
                          ? 'bg-teal-800 text-white'
                          : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                      }`}
                    >
                      <Film className="w-3.5 h-3.5" /> Vídeo (MP4/WebM)
                    </button>
                  </div>

                  <div>
                    <input
                      type="url"
                      placeholder={newMediaType === 'video' ? 'https://.../video.mp4' : 'https://.../foto.jpg'}
                      value={newMediaUrl}
                      onChange={(e) => setNewMediaUrl(e.target.value)}
                      required
                      className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-xs bg-white focus:outline-hidden focus:ring-2 focus:ring-teal-700"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="Título (opcional)"
                      value={newMediaTitle}
                      onChange={(e) => setNewMediaTitle(e.target.value)}
                      className="px-3.5 py-2 rounded-xl border border-stone-300 text-xs bg-white"
                    />
                    <input
                      type="text"
                      placeholder="Legenda (opcional)"
                      value={newMediaCaption}
                      onChange={(e) => setNewMediaCaption(e.target.value)}
                      className="px-3.5 py-2 rounded-xl border border-stone-300 text-xs bg-white"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={!newMediaUrl.trim()}
                    className="w-full py-2.5 rounded-xl bg-teal-800 hover:bg-teal-900 disabled:opacity-40 text-white text-xs font-semibold transition cursor-pointer"
                  >
                    Adicionar ao Carrossel
                  </button>
                </form>
              </div>
            </div>

            {/* 3. Media Items List / Manager */}
            <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-xs border border-stone-200">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-stone-100">
                <div>
                  <h3 className="font-['Cormorant_Garamond'] text-2xl font-bold text-stone-800">
                    Mídias Ativas no Convite ({mediaList.length})
                  </h3>
                  <p className="text-xs text-stone-500">
                    Gerencie a ordem e remova qualquer foto ou vídeo indesejado.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleResetDefaults}
                  className="px-3 py-1.5 rounded-full text-xs font-semibold text-stone-600 bg-stone-100 hover:bg-stone-200 transition cursor-pointer"
                >
                  Restaurar Padrões Originais
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {mediaList.map((item, idx) => (
                  <div
                    key={item.id}
                    className="group relative rounded-2xl bg-stone-50 border border-stone-200 overflow-hidden flex flex-col justify-between shadow-2xs hover:shadow-md transition"
                  >
                    <div className="relative aspect-[9/16] bg-stone-900 overflow-hidden">
                      {item.type === 'video' ? (
                        <div className="w-full h-full flex items-center justify-center relative">
                          <video src={item.url} className="w-full h-full object-cover" muted playsInline />
                          <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                            <Play className="w-8 h-8 fill-white/80 text-white/80" />
                          </div>
                        </div>
                      ) : (
                        <img src={item.url} alt={item.title} className="w-full h-full object-cover" />
                      )}

                      <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-xs text-white text-[10px] font-bold">
                        #{idx + 1}
                      </div>

                      <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-xs text-white text-[10px] font-medium flex items-center gap-1">
                        {item.type === 'video' ? <Film className="w-2.5 h-2.5 text-amber-300" /> : <ImageIcon className="w-2.5 h-2.5" />}
                        <span>{item.type === 'video' ? 'Vídeo' : 'Foto'}</span>
                      </div>
                    </div>

                    <div className="p-3 flex items-center justify-between gap-2">
                      <div className="truncate">
                        <span className="font-bold text-xs text-stone-800 block truncate">{item.title}</span>
                        <span className="text-[10px] text-stone-500 block truncate">{item.caption}</span>
                      </div>
                      <button
                        onClick={() => handleDeleteMedia(item.id)}
                        className="p-1.5 rounded-lg text-stone-400 hover:text-red-600 hover:bg-red-50 transition cursor-pointer flex-shrink-0"
                        title="Remover"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 4. Live Carousel Preview in Admin */}
            <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-xs border border-stone-200">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-5 h-5 text-teal-800" />
                <h3 className="font-['Cormorant_Garamond'] text-2xl font-bold text-stone-800">
                  Pré-visualização do Carrossel (Como os convidados veem)
                </h3>
              </div>
              <p className="text-xs text-stone-500 mb-6">
                Carrossel com efeito véu branco translúcido nas laterais e transição {carouselConfig.transitionEffect}.
              </p>

              <div className="p-4 rounded-3xl bg-stone-50 border border-stone-200">
                <PhotoCarousel showAdminControls={false} />
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB: MUSIC PLAYLIST MANAGEMENT                           */}
        {/* ======================================================== */}
        {activeTab === 'music' && (
          <div className="space-y-8">
            {/* 1. Header & Priority Banner */}
            <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-xs border border-stone-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-stone-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-teal-50 text-teal-800 flex items-center justify-center flex-shrink-0">
                    <Music className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-['Cormorant_Garamond'] text-2xl font-bold text-stone-800">
                      Trilha Sonora do Casamento
                    </h3>
                    <p className="text-xs text-stone-500">
                      Edite as músicas tocadas no convite, organize a ordem de reprodução e adicione novas faixas do YouTube.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={handleRestoreDefaultPlaylist}
                    className="px-3.5 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold transition cursor-pointer flex items-center gap-1.5"
                    title="Restaurar: 1º Aerosmith, 2º Always (Bon Jovi), 3º Djonga, 4º Armandinho"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Restaurar Ordem Padrão</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleSaveMusicChanges}
                    className="px-4 py-2 rounded-xl bg-teal-800 hover:bg-teal-900 text-white text-xs font-semibold transition shadow-xs cursor-pointer flex items-center gap-1.5"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Salvar Playlist</span>
                  </button>
                </div>
              </div>

              {/* Spotlight: First & Second tracks */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                <div className="p-4 rounded-2xl bg-teal-50/50 border border-teal-200/80 flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-teal-800 text-white flex items-center justify-center font-bold text-xs flex-shrink-0 mt-0.5">
                    #1
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] uppercase tracking-wider font-bold text-teal-800 bg-teal-100/80 px-2 py-0.5 rounded-md">
                        Início Automático (1ª Música)
                      </span>
                    </div>
                    <p className="font-semibold text-stone-900 text-sm truncate mt-1">
                      {playlistTracks[0]?.title || 'Nenhuma'}
                    </p>
                    <p className="text-xs text-stone-500 truncate">
                      {playlistTracks[0]?.artist || 'Artista'}
                    </p>
                    <p className="text-[11px] text-teal-700/80 mt-1">
                      Começa a tocar automaticamente logo na abertura do convite.
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-amber-50/40 border border-amber-200/70 flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#A66E5B] text-white flex items-center justify-center font-bold text-xs flex-shrink-0 mt-0.5">
                    #2
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] uppercase tracking-wider font-bold text-[#A66E5B] bg-amber-100/80 px-2 py-0.5 rounded-md">
                        Segunda a Tocar (Na Sequência)
                      </span>
                    </div>
                    <p className="font-semibold text-stone-900 text-sm truncate mt-1">
                      {playlistTracks[1]?.title || 'Nenhuma'}
                    </p>
                    <p className="text-xs text-stone-500 truncate">
                      {playlistTracks[1]?.artist || 'Artista'}
                    </p>
                    <p className="text-[11px] text-stone-500 mt-1">
                      Toca automaticamente em seguida ou quando o convidado avança a faixa.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Add New Track Form */}
            <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-xs border border-stone-200">
              <div className="flex items-center gap-2 mb-4">
                <Plus className="w-5 h-5 text-teal-800" />
                <h4 className="font-['Cormorant_Garamond'] text-xl font-bold text-stone-800">
                  Adicionar Nova Música do YouTube
                </h4>
              </div>

              <form onSubmit={handleAddMusic} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-1">
                    <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                      Link ou ID do YouTube *
                    </label>
                    <input
                      type="text"
                      placeholder="https://youtube.com/watch?v=..."
                      value={newTrackUrl}
                      onChange={(e) => setNewTrackUrl(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-xs bg-stone-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-teal-700"
                    />
                    <span className="text-[10px] text-stone-400 mt-1 block">
                      Ex: https://youtu.be/..., shorts ou o ID do vídeo.
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                      Título da Música
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: I Don't Want to Miss a Thing"
                      value={newTrackTitle}
                      onChange={(e) => setNewTrackTitle(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-xs bg-stone-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-teal-700"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                      Artista / Banda
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Aerosmith"
                      value={newTrackArtist}
                      onChange={(e) => setNewTrackArtist(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-xs bg-stone-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-teal-700"
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-teal-800 hover:bg-teal-900 text-white text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Adicionar à Playlist</span>
                  </button>
                </div>
              </form>
            </div>

            {/* 3. Reorderable / Editable Tracks List */}
            <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-xs border border-stone-200">
              <div className="flex items-center justify-between gap-4 mb-6">
                <div>
                  <h4 className="font-['Cormorant_Garamond'] text-xl font-bold text-stone-800">
                    Músicas Ativas na Playlist ({playlistTracks.length})
                  </h4>
                  <p className="text-xs text-stone-500">
                    Use os botões de seta para subir ou descer qualquer música na fila. Você também pode editar títulos ou excluir faixas.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleSaveMusicChanges}
                  className="px-4 py-2 rounded-xl bg-teal-800 hover:bg-teal-900 text-white text-xs font-semibold transition shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Salvar Alterações</span>
                </button>
              </div>

              <div className="space-y-3">
                {playlistTracks.map((track, index) => {
                  const isFirst = index === 0;
                  const isSecond = index === 1;
                  const isLast = index === playlistTracks.length - 1;

                  return (
                    <div
                      key={track.id || index}
                      className={`p-4 rounded-2xl border transition flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                        isFirst
                          ? 'border-teal-300 bg-teal-50/20'
                          : isSecond
                          ? 'border-amber-200 bg-amber-50/10'
                          : 'border-stone-200 bg-stone-50/40 hover:bg-stone-50'
                      }`}
                    >
                      {/* Left side: Position, Thumbnail & Inputs */}
                      <div className="flex items-center gap-3 w-full sm:w-auto flex-1 min-w-0">
                        {/* Position Pill */}
                        <div className="flex flex-col items-center justify-center flex-shrink-0">
                          <span
                            className={`w-8 h-8 rounded-xl font-bold text-xs flex items-center justify-center ${
                              isFirst
                                ? 'bg-teal-800 text-white'
                                : isSecond
                                ? 'bg-[#A66E5B] text-white'
                                : 'bg-stone-200 text-stone-700'
                            }`}
                          >
                            #{index + 1}
                          </span>
                        </div>

                        {/* YouTube Thumbnail Preview */}
                        <div className="relative w-16 h-12 rounded-xl overflow-hidden bg-black/10 flex-shrink-0 border border-stone-200">
                          <img
                            src={`https://img.youtube.com/vi/${track.youtubeId}/mqdefault.jpg`}
                            alt={track.title}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                          <a
                            href={track.youtubeUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="absolute inset-0 bg-black/30 hover:bg-black/10 transition flex items-center justify-center text-white"
                            title="Abrir no YouTube"
                          >
                            <Play className="w-3.5 h-3.5 fill-current" />
                          </a>
                        </div>

                        {/* Track Info Form Inputs */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 flex-1 min-w-0">
                          <div>
                            <span className="text-[9px] uppercase tracking-wider font-bold text-stone-400 block mb-0.5">
                              Título
                            </span>
                            <input
                              type="text"
                              value={track.title}
                              onChange={(e) => handleUpdateTrackField(index, 'title', e.target.value)}
                              className="w-full px-2.5 py-1.5 rounded-lg border border-stone-200 text-xs font-semibold text-stone-800 bg-white focus:outline-hidden focus:ring-1 focus:ring-teal-700"
                            />
                          </div>

                          <div>
                            <span className="text-[9px] uppercase tracking-wider font-bold text-stone-400 block mb-0.5">
                              Artista
                            </span>
                            <input
                              type="text"
                              value={track.artist}
                              onChange={(e) => handleUpdateTrackField(index, 'artist', e.target.value)}
                              className="w-full px-2.5 py-1.5 rounded-lg border border-stone-200 text-xs text-stone-600 bg-white focus:outline-hidden focus:ring-1 focus:ring-teal-700"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Right side: Reorder Arrows & Delete Button */}
                      <div className="flex items-center gap-1.5 self-end sm:self-center flex-shrink-0">
                        {/* Move Up */}
                        <button
                          type="button"
                          onClick={() => handleMoveTrack(index, 'up')}
                          disabled={isFirst}
                          className="w-8 h-8 rounded-xl border border-stone-200 hover:bg-stone-100 disabled:opacity-30 disabled:pointer-events-none flex items-center justify-center text-stone-600 transition cursor-pointer"
                          title="Mover para cima (tocar antes)"
                        >
                          <MoveUp className="w-4 h-4" />
                        </button>

                        {/* Move Down */}
                        <button
                          type="button"
                          onClick={() => handleMoveTrack(index, 'down')}
                          disabled={isLast}
                          className="w-8 h-8 rounded-xl border border-stone-200 hover:bg-stone-100 disabled:opacity-30 disabled:pointer-events-none flex items-center justify-center text-stone-600 transition cursor-pointer"
                          title="Mover para baixo (tocar depois)"
                        >
                          <MoveDown className="w-4 h-4" />
                        </button>

                        {/* External YouTube Link */}
                        <a
                          href={track.youtubeUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-8 h-8 rounded-xl border border-stone-200 hover:bg-stone-100 flex items-center justify-center text-stone-600 transition"
                          title="Assistir no YouTube"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>

                        {/* Delete Track */}
                        <button
                          type="button"
                          onClick={() => handleDeleteTrack(index)}
                          className="w-8 h-8 rounded-xl border border-red-200 hover:bg-red-50 text-red-600 flex items-center justify-center transition cursor-pointer"
                          title="Remover música da playlist"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-6 p-4 rounded-2xl bg-stone-50 border border-stone-200 text-xs text-stone-500 flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-teal-800 flex-shrink-0 mt-0.5" />
                <p>
                  <strong>Dica:</strong> A música que estiver na posição <strong>#1</strong> será a primeira a ser tocada automaticamente quando qualquer convidado acessar o convite de casamento. A faixa <strong>#2</strong> tocará logo em seguida.
                </p>
              </div>
            </div>
          </div>
        )}
        {activeTab === 'rsvps' && (
          <div className="space-y-6">
            {/* Quick Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
              <div className="p-4 sm:p-5 rounded-2xl bg-white border border-stone-200 shadow-2xs">
                <span className="text-stone-500 text-xs font-semibold uppercase tracking-wider block">
                  Respostas
                </span>
                <span className="font-['Cormorant_Garamond'] text-3xl font-bold text-stone-800 block mt-1">
                  {rsvps.length}
                </span>
                <span className="text-[11px] text-stone-400">Total recebido</span>
              </div>

              <div className="p-4 sm:p-5 rounded-2xl bg-white border border-emerald-200/60 bg-emerald-50/20 shadow-2xs">
                <span className="text-emerald-800 text-xs font-semibold uppercase tracking-wider block">
                  Confirmados
                </span>
                <span className="font-['Cormorant_Garamond'] text-3xl font-bold text-emerald-800 block mt-1">
                  {confirmedRSVPs.length}
                </span>
                <span className="text-[11px] text-emerald-700 font-medium">
                  {totalAdults} adultos • {totalChildren} crianças
                </span>
              </div>

              <div className="p-4 sm:p-5 rounded-2xl bg-white border border-teal-200/60 bg-teal-50/20 shadow-2xs">
                <span className="text-teal-800 text-xs font-semibold uppercase tracking-wider block">
                  Total Pessoas
                </span>
                <span className="font-['Cormorant_Garamond'] text-3xl font-bold text-teal-900 block mt-1">
                  {totalGuests}
                </span>
                <span className="text-[11px] text-teal-700">Presentes no evento</span>
              </div>

              <div className="p-4 sm:p-5 rounded-2xl bg-white border border-stone-200 shadow-2xs">
                <span className="text-stone-500 text-xs font-semibold uppercase tracking-wider block">
                  Recusados
                </span>
                <span className="font-['Cormorant_Garamond'] text-3xl font-bold text-stone-600 block mt-1">
                  {declinedRSVPs.length}
                </span>
                <span className="text-[11px] text-stone-400">Não comparecerão</span>
              </div>
            </div>

            {/* Filter and Action bar */}
            <div className="bg-white rounded-3xl p-5 shadow-xs border border-stone-200 flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative w-64">
                  <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Buscar por nome ou fone..."
                    value={rsvpSearch}
                    onChange={(e) => setRsvpSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-stone-200 text-xs bg-stone-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-teal-700"
                  />
                </div>

                <div className="inline-flex rounded-xl bg-stone-100 p-1">
                  <button
                    onClick={() => setRsvpFilter('all')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                      rsvpFilter === 'all' ? 'bg-white shadow-xs text-teal-900' : 'text-stone-600'
                    }`}
                  >
                    Todos ({rsvps.length})
                  </button>
                  <button
                    onClick={() => setRsvpFilter('yes')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                      rsvpFilter === 'yes' ? 'bg-white shadow-xs text-teal-900' : 'text-stone-600'
                    }`}
                  >
                    Confirmados ({confirmedRSVPs.length})
                  </button>
                  <button
                    onClick={() => setRsvpFilter('no')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                      rsvpFilter === 'no' ? 'bg-white shadow-xs text-teal-900' : 'text-stone-600'
                    }`}
                  >
                    Recusados ({declinedRSVPs.length})
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleExportCSV}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-teal-800 hover:bg-teal-900 text-white text-xs font-semibold shadow-xs transition cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Baixar Planilha CSV</span>
                </button>
              </div>
            </div>

            {/* Table of RSVPs */}
            <div className="bg-white rounded-3xl shadow-xs border border-stone-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-stone-600">
                  <thead className="bg-[#FAF8F5] text-stone-700 uppercase tracking-wider text-[10px] font-bold border-b border-stone-200">
                    <tr>
                      <th className="px-5 py-3.5">Convidado</th>
                      <th className="px-4 py-3.5">Status</th>
                      <th className="px-4 py-3.5">Pessoas</th>
                      <th className="px-4 py-3.5">Acompanhantes</th>
                      <th className="px-4 py-3.5">Telefone</th>
                      <th className="px-4 py-3.5">Mensagem / Dieta</th>
                      <th className="px-4 py-3.5">Data</th>
                      <th className="px-4 py-3.5 text-right">Ação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {filteredRSVPs.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="px-5 py-10 text-center text-stone-400">
                          Nenhuma resposta encontrada.
                        </td>
                      </tr>
                    ) : (
                      filteredRSVPs.map((r) => (
                        <tr key={r.id} className="hover:bg-stone-50/80 transition">
                          <td className="px-5 py-3.5 font-bold text-stone-800 whitespace-nowrap">
                            {r.fullName}
                          </td>
                          <td className="px-4 py-3.5 whitespace-nowrap">
                            {r.attending === 'yes' ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                                <Check className="w-3 h-3" /> Confirmado
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-stone-100 text-stone-600 text-[10px] font-bold">
                                Não irá
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3.5 whitespace-nowrap font-medium">
                            {r.attending === 'yes' ? (
                              <span>
                                {r.adultsCount} ad. {r.childrenCount > 0 ? `+ ${r.childrenCount} cr.` : ''}
                              </span>
                            ) : (
                              '-'
                            )}
                          </td>
                          <td className="px-4 py-3.5 max-w-xs truncate">
                            {r.companionNames || '-'}
                          </td>
                          <td className="px-4 py-3.5 whitespace-nowrap font-mono text-[11px]">
                            {r.phone}
                          </td>
                          <td className="px-4 py-3.5 max-w-xs truncate" title={r.message || r.dietaryRestrictions}>
                            {r.message || r.dietaryRestrictions || '-'}
                          </td>
                          <td className="px-4 py-3.5 whitespace-nowrap text-stone-400 text-[11px]">
                            {new Date(r.submittedAt).toLocaleDateString('pt-BR')}
                          </td>
                          <td className="px-4 py-3.5 text-right whitespace-nowrap">
                            <button
                              onClick={() => handleDeleteRSVP(r.id)}
                              className="p-1 rounded-lg text-stone-400 hover:text-red-600 hover:bg-red-50 transition cursor-pointer"
                              title="Excluir resposta"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 3: GOOGLE SHEETS INTEGRATION                         */}
        {/* ======================================================== */}
        {activeTab === 'sheets' && (
          <div className="space-y-6">
            {/* Feedback Message */}
            {sheetsMessage && (
              <div
                className={`p-4 rounded-2xl flex items-center gap-2 text-xs shadow-xs ${
                  sheetsMessage.type === 'success'
                    ? 'bg-teal-50 border border-teal-200 text-teal-900'
                    : 'bg-red-50 border border-red-200 text-red-700'
                }`}
              >
                {sheetsMessage.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-teal-700 flex-shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-red-700 flex-shrink-0" />
                )}
                <span>{sheetsMessage.text}</span>
              </div>
            )}

            {/* Google Account Status */}
            <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-xs border border-stone-200 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-stone-100 flex items-center justify-center overflow-hidden border border-stone-200">
                  {user?.photoURL ? (
                    <img src={user.photoURL} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <FileSpreadsheet className="w-6 h-6 text-teal-800" />
                  )}
                </div>
                <div>
                  <h3 className="text-base font-bold text-stone-800">
                    {user ? user.displayName || user.email : 'Conta Google Desconectada'}
                  </h3>
                  <p className="text-xs text-stone-500">
                    {user
                      ? `Conectado via ${user.email}. Pronto para criar e sincronizar planilhas.`
                      : 'Conecte sua conta para salvar confirmações de presença automaticamente no Google Sheets.'}
                  </p>
                </div>
              </div>

              {user ? (
                <button
                  onClick={handleGoogleLogout}
                  className="px-4 py-2 rounded-full border border-stone-200 text-stone-600 hover:bg-stone-50 text-xs font-semibold transition cursor-pointer"
                >
                  Desconectar Conta
                </button>
              ) : (
                <button
                  onClick={handleGoogleLogin}
                  disabled={isSigningIn}
                  className="px-5 py-2.5 rounded-full bg-teal-800 hover:bg-teal-900 text-white text-xs font-semibold shadow-xs transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>{isSigningIn ? 'Conectando...' : 'Conectar com Conta Google'}</span>
                </button>
              )}
            </div>

            {/* Sheet Link / Setup Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Option 1: Create Auto Sheet */}
              <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-xs border border-stone-200 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="w-5 h-5 text-teal-800" />
                    <h4 className="font-['Cormorant_Garamond'] text-2xl font-bold text-stone-800">
                      Criar Planilha Oficial no Google Drive
                    </h4>
                  </div>
                  <p className="text-xs text-stone-500 mb-6 leading-relaxed">
                    Crie uma planilha formatada automaticamente no seu Google Drive, com todas as colunas de convidados, telefone, acompanhantes e restrições.
                  </p>
                </div>

                <button
                  onClick={handleCreateAutoSheet}
                  disabled={!user || isCreatingSheet}
                  className="w-full py-3 rounded-2xl bg-teal-800 hover:bg-teal-900 text-white text-xs font-semibold shadow-md transition disabled:opacity-40 cursor-pointer flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>{isCreatingSheet ? 'Criando Planilha...' : 'Criar Nova Planilha com 1 Clique'}</span>
                </button>
              </div>

              {/* Option 2: Link Custom Sheet */}
              <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-xs border border-stone-200 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <ExternalLink className="w-5 h-5 text-teal-800" />
                    <h4 className="font-['Cormorant_Garamond'] text-2xl font-bold text-stone-800">
                      Vincular Planilha Existente
                    </h4>
                  </div>
                  <p className="text-xs text-stone-500 mb-4 leading-relaxed">
                    Cole o link de uma planilha já existente no seu Google Drive.
                  </p>

                  <form onSubmit={handleLinkCustomSheet} className="space-y-3">
                    <input
                      type="text"
                      placeholder="https://docs.google.com/spreadsheets/d/ID_DA_PLANILHA/edit"
                      value={customSheetInput}
                      onChange={(e) => setCustomSheetInput(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-xs bg-[#FAF8F5] focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-teal-700"
                    />

                    <button
                      type="submit"
                      disabled={!user || !customSheetInput.trim() || isSyncing}
                      className="w-full py-2.5 rounded-xl bg-stone-800 hover:bg-stone-900 disabled:opacity-40 text-white text-xs font-semibold transition cursor-pointer"
                    >
                      {isSyncing ? 'Verificando...' : 'Vincular Esta Planilha'}
                    </button>
                  </form>
                </div>
              </div>
            </div>

            {/* Current Active Sheet details */}
            {sheetsConfig && (
              <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-xs border border-teal-200/80 bg-teal-50/20">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center">
                      <FileSpreadsheet className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 block">
                        Planilha Ativa & Sincronizada
                      </span>
                      <h4 className="text-base font-bold text-stone-800">
                        {sheetsConfig.sheetTitle}
                      </h4>
                      <p className="text-xs text-stone-500">
                        ID: <code className="font-mono">{sheetsConfig.spreadsheetId}</code>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <a
                      href={sheetsConfig.spreadsheetUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold shadow-xs transition"
                    >
                      <span>Abrir no Google Sheets</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>

                    <button
                      onClick={handleSyncPendingRSVPs}
                      disabled={isSyncing}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white hover:bg-stone-50 border border-stone-300 text-stone-700 text-xs font-semibold transition cursor-pointer disabled:opacity-40"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                      <span>Sincronizar Agora</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};
