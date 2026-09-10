import React, { useState, useEffect } from 'react';
import { Clock, Calendar, Sparkles, Heart } from 'lucide-react';
import { BotanicalDivider } from './BotanicalDecorations';

// Target: 25 de Setembro de 2026 às 19:00:00 BRT (-03:00)
const EVENT_TIMESTAMP = new Date('2026-09-25T19:00:00-03:00').getTime();

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isPast: boolean;
}

export const CountdownTimer: React.FC = () => {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>(() => calculateTimeLeft());

  function calculateTimeLeft(): TimeLeft {
    const now = new Date().getTime();
    const difference = EVENT_TIMESTAMP - now;

    if (difference <= 0) {
      return { days: 0, hours: 0, minutes: 0, seconds: 0, isPast: true };
    }

    return {
      days: Math.floor(difference / (1000 * 60 * 60 * 24)),
      hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
      minutes: Math.floor((difference / 1000 / 60) % 60),
      seconds: Math.floor((difference / 1000) % 60),
      isPast: false,
    };
  }

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleAddToCalendar = () => {
    const title = encodeURIComponent('Comemoração de Casamento de Johnatan & Regiane');
    const details = encodeURIComponent(
      'Comemoração de casamento especial com recepção e jantar. Confirmação feita pelo convite online!'
    );
    const location = encodeURIComponent('Restaurante Family');
    // ISO format for Google Calendar: 20260925T220000Z (19:00 BRT is 22:00 UTC)
    const startDate = '20260925T220000Z';
    const endDate = '20260926T030000Z';

    const googleCalendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startDate}/${endDate}&details=${details}&location=${location}`;
    window.open(googleCalendarUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <section className="py-16 px-4 bg-gradient-to-b from-[#F8FAF8] via-[#F2F7F4] to-[#FAF8F5] relative overflow-hidden">
      <div className="max-w-4xl mx-auto text-center relative z-10">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#E5ECE8] text-teal-900 text-xs uppercase tracking-widest font-semibold mb-3">
          <Clock className="w-3.5 h-3.5 text-teal-800" />
          <span>Contagem Regressiva</span>
        </div>

        <h2 className="font-['Cormorant_Garamond'] text-3xl sm:text-5xl font-semibold text-stone-800 mb-2">
          Falta Pouco Para o Grande Dia
        </h2>
        <p className="text-stone-600 text-sm sm:text-base max-w-md mx-auto">
          Contando cada segundo com o coração cheio de alegria para celebrar este momento inesquecível com você.
        </p>

        <BotanicalDivider className="my-6" />

        {/* Countdown Cards */}
        {timeLeft.isPast ? (
          <div className="p-8 rounded-3xl bg-white border border-teal-800/20 shadow-sm max-w-lg mx-auto">
            <Heart className="w-12 h-12 text-[#C29B88] mx-auto mb-3 fill-[#C29B88]/20" />
            <h3 className="font-['Cormorant_Garamond'] text-2xl font-bold text-stone-800 mb-1">
              O Grande Dia Chegou!
            </h3>
            <p className="text-stone-600 text-sm">
              Estamos celebrando este dia abençoado e inesquecível!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-6 max-w-2xl mx-auto mb-8">
            {/* Days */}
            <div className="flex flex-col items-center justify-center p-4 sm:p-6 rounded-2xl bg-white/95 border border-teal-900/10 shadow-sm hover:shadow-md transition-shadow">
              <span className="font-['Cormorant_Garamond'] text-4xl sm:text-6xl font-bold text-teal-900">
                {String(timeLeft.days).padStart(2, '0')}
              </span>
              <span className="text-xs sm:text-sm uppercase tracking-wider text-stone-500 font-medium mt-1">
                {timeLeft.days === 1 ? 'Dia' : 'Dias'}
              </span>
            </div>

            {/* Hours */}
            <div className="flex flex-col items-center justify-center p-4 sm:p-6 rounded-2xl bg-white/95 border border-[#D5B09E]/35 shadow-sm hover:shadow-md transition-shadow">
              <span className="font-['Cormorant_Garamond'] text-4xl sm:text-6xl font-bold text-[#A66E5B]">
                {String(timeLeft.hours).padStart(2, '0')}
              </span>
              <span className="text-xs sm:text-sm uppercase tracking-wider text-stone-500 font-medium mt-1">
                Horas
              </span>
            </div>

            {/* Minutes */}
            <div className="flex flex-col items-center justify-center p-4 sm:p-6 rounded-2xl bg-white/95 border border-teal-900/10 shadow-sm hover:shadow-md transition-shadow">
              <span className="font-['Cormorant_Garamond'] text-4xl sm:text-6xl font-bold text-teal-900">
                {String(timeLeft.minutes).padStart(2, '0')}
              </span>
              <span className="text-xs sm:text-sm uppercase tracking-wider text-stone-500 font-medium mt-1">
                Minutos
              </span>
            </div>

            {/* Seconds */}
            <div className="flex flex-col items-center justify-center p-4 sm:p-6 rounded-2xl bg-white/95 border border-[#D5B09E]/35 shadow-sm hover:shadow-md transition-shadow">
              <span className="font-['Cormorant_Garamond'] text-4xl sm:text-6xl font-bold text-[#A66E5B]">
                {String(timeLeft.seconds).padStart(2, '0')}
              </span>
              <span className="text-xs sm:text-sm uppercase tracking-wider text-stone-500 font-medium mt-1">
                Segundos
              </span>
            </div>
          </div>
        )}

        {/* Action badge & Google Calendar */}
        <div className="flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={handleAddToCalendar}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white hover:bg-stone-50 text-stone-700 text-sm font-medium border border-stone-300 shadow-2xs transition-colors"
          >
            <Calendar className="w-4 h-4 text-teal-800" />
            <span>Salvar no Google Agenda</span>
          </button>

          <div className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-[#FAF1EC] border border-[#D5B09E]/40 text-[#9E6554] text-xs sm:text-sm font-medium">
            <Sparkles className="w-3.5 h-3.5 text-[#9E6554]" />
            <span>Prazo de confirmação: até <strong>22/09/2026</strong></span>
          </div>
        </div>
      </div>
    </section>
  );
};
