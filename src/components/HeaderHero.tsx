import React from 'react';
import { Calendar, MapPin, Heart, Clock, ChevronDown } from 'lucide-react';
import { BotanicalBranchLeft, BotanicalBranchRight, BotanicalDivider } from './BotanicalDecorations';

interface HeaderHeroProps {
  onRSVPClick: () => void;
  onLocationClick: () => void;
  coupleNames?: string;
}

export const HeaderHero: React.FC<HeaderHeroProps> = ({
  onRSVPClick,
  onLocationClick,
  coupleNames = 'Johnatan & Regiane',
}) => {
  const namesArray = coupleNames.split('&').map((name) => name.trim());

  return (
    <header className="relative min-h-[92vh] flex flex-col items-center justify-center text-center px-4 pt-12 pb-16 overflow-hidden bg-gradient-to-b from-[#F2F7F4] via-[#FAF6F3] to-[#F8FAF8]">
      {/* Decorative ambient background rings */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] sm:w-[800px] h-[600px] sm:h-[800px] rounded-full border border-teal-900/5 pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] sm:w-[680px] h-[500px] sm:h-[680px] rounded-full border border-[#D5B09E]/20 pointer-events-none" />

      {/* Botanical Corner branches */}
      <div className="absolute top-4 left-4 sm:top-8 sm:left-8 opacity-60 pointer-events-none">
        <BotanicalBranchLeft className="w-20 h-20 sm:w-32 sm:h-32 text-teal-800/40" />
      </div>
      <div className="absolute top-4 right-4 sm:top-8 sm:right-8 opacity-60 pointer-events-none">
        <BotanicalBranchRight className="w-20 h-20 sm:w-32 sm:h-32 text-teal-800/40" />
      </div>

      <div className="relative z-10 max-w-3xl mx-auto flex flex-col items-center">
        {/* Soft tag */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-teal-900/5 border border-teal-800/15 text-teal-900 text-xs sm:text-sm tracking-widest uppercase mb-4 font-medium">
          <Heart className="w-3.5 h-3.5 fill-[#C29B88] text-[#C29B88]" />
          <span>Celebração de Amor & Matrimônio</span>
          <Heart className="w-3.5 h-3.5 fill-[#C29B88] text-[#C29B88]" />
        </div>

        {/* Script Intro Phrase */}
        <p className="font-['Alex_Brush'] text-3xl sm:text-4xl md:text-5xl text-[#A66E5B] mb-2 font-normal drop-shadow-2xs">
          Comemoração de Casamento
        </p>

        {/* Delicate Center Names */}
        <h1 className="font-['Alex_Brush'] text-5xl sm:text-7xl md:text-8xl lg:text-9xl text-stone-800 font-normal leading-tight tracking-normal mb-3 drop-shadow-2xs text-center">
          {namesArray.length === 2 ? (
            <>
              <span>{namesArray[0]}</span>
              <span className="text-[#A66E5B] font-normal mx-2 sm:mx-3">&</span>
              <span>{namesArray[1]}</span>
            </>
          ) : (
            coupleNames
          )}
        </h1>

        <BotanicalDivider className="my-3" />

        {/* Romantic quote */}
        <p className="font-['Cormorant_Garamond'] italic text-lg sm:text-xl text-stone-600 max-w-xl mx-auto mb-8 leading-relaxed">
          &ldquo;O amor não consiste em olhar um para o outro, mas sim em olhar juntos na mesma direção.&rdquo;
        </p>

        {/* Date, Time & Venue summary pills */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 w-full max-w-xl mb-10 text-stone-700">
          <div className="flex items-center justify-center gap-3 px-5 py-3.5 rounded-2xl bg-white/80 backdrop-blur-xs border border-teal-700/15 shadow-xs transition hover:border-teal-700/30">
            <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-800 flex items-center justify-center flex-shrink-0">
              <Calendar className="w-5 h-5 text-teal-800" />
            </div>
            <div className="text-left">
              <span className="block text-[11px] uppercase tracking-wider text-teal-900/70 font-semibold">Data & Horário</span>
              <span className="font-['Cormorant_Garamond'] text-lg sm:text-xl font-bold text-stone-800">
                25 de Setembro de 2026
              </span>
              <span className="block text-xs text-stone-500 font-medium">Sexta-feira • 19:00 horas</span>
            </div>
          </div>

          <div 
            onClick={onLocationClick}
            className="flex items-center justify-center gap-3 px-5 py-3.5 rounded-2xl bg-white/80 backdrop-blur-xs border border-[#D5B09E]/40 shadow-xs cursor-pointer transition hover:border-[#C29B88] hover:bg-[#FDF9F7]"
          >
            <div className="w-10 h-10 rounded-xl bg-[#F6ECE6] text-[#A66E5B] flex items-center justify-center flex-shrink-0">
              <MapPin className="w-5 h-5 text-[#A66E5B]" />
            </div>
            <div className="text-left">
              <span className="block text-[11px] uppercase tracking-wider text-[#A66E5B] font-semibold">Local da Festa</span>
              <span className="font-['Cormorant_Garamond'] text-lg sm:text-xl font-bold text-stone-800">
                Restaurante Family
              </span>
              <span className="block text-xs text-teal-800 font-medium hover:underline">Ver localização e detalhes →</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full justify-center">
          <button
            id="hero-rsvp-btn"
            onClick={onRSVPClick}
            className="w-full sm:w-auto px-8 py-4 rounded-full bg-teal-800 hover:bg-teal-900 text-white font-medium text-base tracking-wide shadow-md shadow-teal-900/15 transition-all transform hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2.5"
          >
            <Heart className="w-4 h-4 fill-white" />
            <span>Confirmar Presença</span>
          </button>

          <button
            id="hero-location-btn"
            onClick={onLocationClick}
            className="w-full sm:w-auto px-7 py-4 rounded-full bg-white/90 hover:bg-white text-stone-700 font-medium text-base border border-stone-300/80 shadow-xs transition-all transform hover:-translate-y-0.5"
          >
            <span>Informações do Evento</span>
          </button>
        </div>

        {/* Confirmation Deadline Notice */}
        <div className="mt-8 flex items-center gap-2 text-xs sm:text-sm text-stone-500 bg-[#EBF4F0] px-4 py-2 rounded-full border border-teal-800/10">
          <Clock className="w-4 h-4 text-teal-800" />
          <span>Por favor, confirme sua presença com carinho até <strong>22/09/2026</strong></span>
        </div>

        {/* Scroll down indicator */}
        <div className="mt-12 text-stone-400 animate-bounce">
          <ChevronDown className="w-6 h-6" />
        </div>
      </div>
    </header>
  );
};
