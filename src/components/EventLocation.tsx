import React from 'react';
import { MapPin, Instagram, Navigation, Clock, Sparkles, Car, AlertCircle } from 'lucide-react';
import { BotanicalBranchLeft, BotanicalBranchRight, BotanicalDivider } from './BotanicalDecorations';

export const EventLocation: React.FC = () => {
  const instagramUrl = 'https://www.instagram.com/restaurante_family/';
  const googleMapsSearchUrl = 'https://maps.app.goo.gl/e31tpdvZVDhJoVpz6';

  return (
    <section className="py-16 px-4 bg-[#F2F7F4] relative overflow-hidden" id="localizacao">
      {/* Botanical Corner accents */}
      <div className="absolute top-4 left-4 opacity-40 pointer-events-none hidden sm:block">
        <BotanicalBranchLeft className="w-24 h-24 text-teal-800/40" />
      </div>
      <div className="absolute top-4 right-4 opacity-40 pointer-events-none hidden sm:block">
        <BotanicalBranchRight className="w-24 h-24 text-teal-800/40" />
      </div>

      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-teal-900/10 text-teal-900 text-xs uppercase tracking-widest font-semibold mb-2">
            <MapPin className="w-3.5 h-3.5 text-teal-800" />
            <span>Local & Cerimônia</span>
          </div>

          <h2 className="font-['Cormorant_Garamond'] text-3xl sm:text-5xl font-semibold text-stone-800 mb-2">
            Onde Iremos Comemorar
          </h2>
          <p className="text-stone-600 text-sm sm:text-base max-w-lg mx-auto">
            Preparamos um ambiente acolhedor e memorável para receber você e sua família com todo o nosso amor.
          </p>

          <BotanicalDivider className="my-4" />
        </div>

        {/* Venue Highlight Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-10 shadow-lg border border-teal-800/15 relative overflow-hidden mb-8">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
            {/* Left Info */}
            <div className="md:col-span-7 space-y-4 text-left">
              <div className="inline-block px-3 py-1 rounded-md bg-[#E8F3EE] text-teal-900 text-xs font-semibold uppercase tracking-wider">
                Espaço Escolhido
              </div>
              <h3 className="font-['Cormorant_Garamond'] text-3xl sm:text-4xl font-bold text-stone-800 leading-tight">
                Restaurante Family
              </h3>
              <p className="text-stone-600 text-sm sm:text-base leading-relaxed">
                Um espaço gastronômico acolhedor, com ambiente intimista e agradável, perfeito para compartilharmos
                risadas, brindes e memórias afetivas inesquecíveis.
              </p>

              <div className="pt-2 flex flex-wrap gap-3">
                <a
                  href={instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-[#833AB4]/90 via-[#FD1D1D]/90 to-[#FCB045]/90 hover:opacity-95 text-white text-xs sm:text-sm font-semibold shadow-xs transition transform hover:-translate-y-0.5"
                >
                  <Instagram className="w-4 h-4" />
                  <span>Conhecer no Instagram @restaurante_family</span>
                </a>

                <a
                  href={googleMapsSearchUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-teal-800 hover:bg-teal-900 text-white text-xs sm:text-sm font-semibold shadow-xs transition transform hover:-translate-y-0.5"
                >
                  <Navigation className="w-4 h-4" />
                  <span>Traçar Rota no GPS / Maps</span>
                </a>
              </div>
            </div>

            {/* Right Quick Info Box */}
            <div className="md:col-span-5 bg-[#FAF6F3] rounded-2xl p-6 border border-[#D5B09E]/40 space-y-4 text-left">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-teal-800/10 text-teal-800 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs uppercase tracking-wider font-bold text-stone-800">Horário</h4>
                  <p className="text-sm font-semibold text-teal-900">Início pontual às 19:00</p>
                  <p className="text-xs text-stone-500">25 de Setembro de 2026 (Sexta-feira)</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-teal-800/10 text-teal-800 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Car className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs uppercase tracking-wider font-bold text-stone-800">Estacionamento</h4>
                  <p className="text-sm text-stone-700">Fácil acesso e vagas nas proximidades</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-6 rounded-2xl bg-white p-6 border border-teal-800/15 text-center">
          <h3 className="font-['Cormorant_Garamond'] text-2xl sm:text-3xl font-semibold text-teal-900 mb-2">
            Um momento de confraternização
          </h3>
          <p className="text-stone-600 text-sm sm:text-base leading-relaxed max-w-2xl mx-auto">
            Convidamos você e sua família para celebrar conosco este momento tão especial,
            em um jantar de confraternização cheio de carinho e alegria.{' '}
            <strong className="font-semibold text-teal-900">Cada família ficará responsável pelo pagamento do seu próprio jantar.</strong>{' '}
            Sua presença será o nosso maior presente!
          </p>
        </div>

        {/* Deadline Notice Banner */}
        <div className="flex items-center gap-3 p-4 rounded-2xl bg-[#FAF1EC] border border-[#D5B09E]/50 text-[#8E5B4C]">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-[#9E6554]" />
          <p className="text-xs sm:text-sm leading-relaxed text-left">
            <strong>Atenção aos prazos:</strong> A confirmação de presença deve ser realizada impreterivelmente até o dia <strong>22 de setembro de 2026</strong> para organização das mesas e buffet.
          </p>
        </div>
      </div>
    </section>
  );
};
