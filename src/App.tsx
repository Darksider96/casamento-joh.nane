/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import {
  Heart,
  Calendar,
  MapPin,
  FileSpreadsheet,
  Sparkles,
  ChevronUp,
  Lock,
} from 'lucide-react';
import { HeaderHero } from './components/HeaderHero';
import { CountdownTimer } from './components/CountdownTimer';
import { PhotoCarousel } from './components/PhotoCarousel';
import { EventLocation } from './components/EventLocation';
import { RSVPForm } from './components/RSVPForm';
import { SheetsAdminModal } from './components/SheetsAdminModal';
import { AdminDashboard } from './components/AdminDashboard';
import { FloatingMusicPlayer } from './components/FloatingMusicPlayer';
import { InvitationEnvelope } from './components/InvitationEnvelope';
import { BotanicalBranchLeft, BotanicalBranchRight, BotanicalDivider } from './components/BotanicalDecorations';
import { RSVPData, SheetsConfig } from './types';
import { initAuth, getAccessToken } from './lib/googleAuth';
import { appendRSVPToSheet } from './lib/sheetsService';
import { isAdminEmail } from './lib/firebase';
import {
  createRSVP,
  getSheetsConfig,
  replaceRSVPs,
  saveSheetsConfig,
  subscribeToRSVPs,
} from './lib/firestoreService';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isSheetsModalOpen, setIsSheetsModalOpen] = useState(false);

  // Client router state for /admin
  const getInitialPath = () => {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname;
      if (path === '/admin' || path.startsWith('/admin') || window.location.hash === '#admin') {
        return '/admin';
      }
    }
    return '/';
  };

  const [currentPath, setCurrentPath] = useState<string>(getInitialPath);

  useEffect(() => {
    const handleLocationChange = () => {
      const path = window.location.pathname;
      if (path === '/admin' || path.startsWith('/admin') || window.location.hash === '#admin') {
        setCurrentPath('/admin');
      } else {
        setCurrentPath('/');
      }
    };

    window.addEventListener('popstate', handleLocationChange);
    window.addEventListener('hashchange', handleLocationChange);
    return () => {
      window.removeEventListener('popstate', handleLocationChange);
      window.removeEventListener('hashchange', handleLocationChange);
    };
  }, []);

  const navigateTo = (path: string) => {
    if (typeof window !== 'undefined') {
      if (window.location.pathname !== path) {
        window.history.pushState({}, '', path);
      }
      setCurrentPath(path);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const [rsvps, setRsvps] = useState<RSVPData[]>([]);

  const [sheetsConfig, setSheetsConfig] = useState<SheetsConfig | null>(null);

  // Listen to Auth State
  useEffect(() => {
    const unsubscribe = initAuth(
      (currentUser, token) => {
        setUser(currentUser);
        setAccessToken(token || null);
      },
      () => {
        setUser(null);
        setAccessToken(null);
      }
    );
    return () => unsubscribe && unsubscribe();
  }, []);

  useEffect(() => {
    if (!isAdminEmail(user?.email)) {
      setRsvps([]);
      setSheetsConfig(null);
      return;
    }

    const unsubscribe = subscribeToRSVPs(
      setRsvps,
      (error) => console.error('Não foi possível carregar as confirmações:', error),
    );
    getSheetsConfig()
      .then(setSheetsConfig)
      .catch((error) => console.error('Não foi possível carregar a configuração da planilha:', error));
    return unsubscribe;
  }, [user]);

  const handleUpdateConfig = async (config: SheetsConfig | null) => {
    setSheetsConfig(config);
    await saveSheetsConfig(config);
  };

  const handleUpdateRSVPs = async (newRSVPs: RSVPData[]) => {
    const previous = rsvps;
    setRsvps(newRSVPs);
    await replaceRSVPs(previous, newRSVPs);
  };

  // RSVP Submission handler
  const handleRSVPSubmit = async (newRsvp: RSVPData): Promise<{ success: boolean; syncedToSheets: boolean; error?: string }> => {
    let synced = false;
    const currentToken = accessToken || getAccessToken();

    if (sheetsConfig?.spreadsheetId && currentToken) {
      try {
        await appendRSVPToSheet(currentToken, sheetsConfig.spreadsheetId, newRsvp);
        synced = true;
      } catch (err: any) {
        console.warn('Could not auto-sync to Google Sheet immediately:', err);
      }
    }

    const updatedRsvp = { ...newRsvp, syncedToSheets: synced };
    await createRSVP(updatedRsvp);

    return { success: true, syncedToSheets: synced };
  };

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // If on /admin, display the secure Admin Dashboard
  if (currentPath === '/admin') {
    return (
      <>
        <AdminDashboard
          onNavigateHome={() => navigateTo('/')}
          rsvps={rsvps}
          sheetsConfig={sheetsConfig}
          onUpdateConfig={handleUpdateConfig}
          onUpdateRSVPs={handleUpdateRSVPs}
          user={user}
          accessToken={accessToken}
          onAuthChange={(newUser, newToken) => {
            setUser(newUser);
            setAccessToken(newToken);
          }}
        />
        <FloatingMusicPlayer />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAF8] text-stone-800 font-['Plus_Jakarta_Sans',sans-serif] selection:bg-teal-200 selection:text-teal-900">
      <InvitationEnvelope />
      {/* Top Floating Navigation Bar */}
      <nav className="sticky top-0 z-40 bg-white/85 backdrop-blur-md border-b border-teal-800/10 transition-all">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="flex items-center gap-2 group cursor-pointer text-left"
          >
            <div className="w-8 h-8 rounded-full bg-teal-800/10 text-teal-800 flex items-center justify-center group-hover:bg-teal-800 group-hover:text-white transition">
              <Heart className="w-4 h-4 fill-current" />
            </div>
            <div>
              <span className="font-['Cormorant_Garamond'] text-lg sm:text-xl font-bold text-stone-800 tracking-tight leading-none block">
                Johnatan & Regiane
              </span>
              <span className="text-[10px] uppercase tracking-widest text-[#A66E5B] font-semibold block">
                25 . 09 . 2026
              </span>
            </div>
          </button>

          {/* Nav Links */}
          <div className="hidden md:flex items-center gap-6 text-xs font-semibold text-stone-600">
            <button
              onClick={() => scrollToSection('galeria')}
              className="hover:text-teal-800 transition cursor-pointer"
            >
              Fotos do Casal
            </button>
            <button
              onClick={() => scrollToSection('localizacao')}
              className="hover:text-teal-800 transition cursor-pointer"
            >
              Local do Evento
            </button>
            <button
              onClick={() => scrollToSection('confirmacao')}
              className="hover:text-teal-800 transition cursor-pointer"
            >
              Confirmar Presença
            </button>
          </div>

          {/* Couple Admin Link & RSVP action */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigateTo('/admin')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-stone-100 hover:bg-stone-200 border border-stone-200 text-stone-700 text-xs font-semibold transition cursor-pointer"
              title="Acessar Área dos Noivos (/admin)"
            >
              <Lock className="w-3.5 h-3.5 text-teal-800" />
              <span className="hidden sm:inline">Área dos Noivos</span>
              {rsvps.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-teal-800 text-white text-[10px] font-bold">
                  {rsvps.length}
                </span>
              )}
            </button>

            <button
              onClick={() => scrollToSection('confirmacao')}
              className="px-4 py-1.5 rounded-full bg-teal-800 hover:bg-teal-900 text-white text-xs font-semibold shadow-xs transition transform hover:-translate-y-0.5 cursor-pointer"
            >
              Confirmar
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content Sections */}
      <main>
        {/* 1. Header Hero */}
        <HeaderHero
          coupleNames="Johnatan & Regiane"
          onRSVPClick={() => scrollToSection('confirmacao')}
          onLocationClick={() => scrollToSection('localizacao')}
        />

        {/* 2. Countdown Timer to September 25, 2026, 19:00 */}
        <CountdownTimer />

        {/* 3. Photo Carousel of the couple */}
        <div id="galeria">
          <PhotoCarousel showAdminControls={false} />
        </div>

        {/* 4. Event Location (Restaurante Family + Instagram link) */}
        <div id="localizacao">
          <EventLocation />
        </div>

        {/* 5. RSVP Confirmation Form */}
        <div id="confirmacao">
          <RSVPForm
            onRSVPSubmit={handleRSVPSubmit}
            isSheetsConnected={Boolean(sheetsConfig?.spreadsheetId && accessToken)}
          />
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-stone-200/80 py-12 px-4 text-center relative overflow-hidden">
        <div className="max-w-3xl mx-auto space-y-4">
          <div className="flex items-center justify-center gap-3">
            <BotanicalBranchLeft className="w-10 h-10 text-teal-800/30" />
            <span className="font-['Alex_Brush'] text-3xl text-[#A66E5B]">Com carinho e amor</span>
            <BotanicalBranchRight className="w-10 h-10 text-teal-800/30" />
          </div>

          <h4 className="font-['Cormorant_Garamond'] text-2xl sm:text-3xl font-bold text-stone-800 tracking-tight">
            Johnatan & Regiane • 2026
          </h4>

          <p className="text-stone-500 text-xs max-w-md mx-auto">
            Restaurante Family • 25 de Setembro de 2026 às 19:00 horas
          </p>

          <div className="pt-4 flex flex-wrap items-center justify-center gap-4 text-xs">
            <button
              onClick={() => navigateTo('/admin')}
              className="text-teal-800 hover:underline font-semibold flex items-center gap-1 cursor-pointer"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Painel Administrativo dos Noivos (/admin)</span>
            </button>
            <span className="text-stone-300">•</span>
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="text-stone-500 hover:text-stone-800 flex items-center gap-1 cursor-pointer"
            >
              <ChevronUp className="w-3.5 h-3.5" />
              <span>Voltar ao topo</span>
            </button>
          </div>

          <div className="pt-6 border-t border-stone-200/60 mt-4 text-xs text-stone-400">
            <p className="tracking-wide">
              Desenvolvido por <span className="text-stone-600 font-medium">Johnatan Mesquita</span>
            </p>
          </div>
        </div>
      </footer>

      {/* Sheets Admin Modal */}
      <SheetsAdminModal
        isOpen={isSheetsModalOpen}
        onClose={() => setIsSheetsModalOpen(false)}
        rsvps={rsvps}
        sheetsConfig={sheetsConfig}
        onUpdateConfig={handleUpdateConfig}
        onUpdateRSVPs={handleUpdateRSVPs}
        user={user}
        accessToken={accessToken}
        onAuthChange={(newUser, newToken) => {
          setUser(newUser);
          setAccessToken(newToken);
        }}
      />

      {/* Floating Music Player (3+ YouTube Songs) */}
      <FloatingMusicPlayer />
    </div>
  );
}
