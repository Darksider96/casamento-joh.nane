import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { Heart, CheckCircle2, UserCheck, Users, Phone, MessageSquare, AlertCircle, Sparkles, Send, Calendar } from 'lucide-react';
import { RSVPData } from '../types';
import { BotanicalBranchLeft, BotanicalBranchRight, BotanicalDivider } from './BotanicalDecorations';

interface RSVPFormProps {
  onRSVPSubmit: (rsvp: RSVPData) => Promise<{ success: boolean; syncedToSheets: boolean; error?: string }>;
  isSheetsConnected: boolean;
}

export const RSVPForm: React.FC<RSVPFormProps> = ({ onRSVPSubmit, isSheetsConnected }) => {
  const [attending, setAttending] = useState<'yes' | 'no'>('yes');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [adultsCount, setAdultsCount] = useState(1);
  const [childrenCount, setChildrenCount] = useState(0);
  const [companionNames, setCompanionNames] = useState('');
  const [message, setMessage] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedData, setSubmittedData] = useState<RSVPData | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [sheetSyncStatus, setSheetSyncStatus] = useState<boolean | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !phone.trim()) {
      setSubmitError('Por favor, preencha seu nome completo e telefone de contato.');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    const rsvpItem: RSVPData = {
      id: 'rsvp-' + Date.now(),
      fullName: fullName.trim(),
      attending,
      phone: phone.trim(),
      adultsCount: attending === 'yes' ? Math.max(1, adultsCount) : 0,
      childrenCount: attending === 'yes' ? Math.max(0, childrenCount) : 0,
      companionNames: attending === 'yes' ? companionNames.trim() : '',
      dietaryRestrictions: '',
      message: message.trim(),
      submittedAt: new Date().toISOString(),
    };

    try {
      const result = await onRSVPSubmit(rsvpItem);
      setSubmittedData(rsvpItem);
      setSheetSyncStatus(result.syncedToSheets);

      if (attending === 'yes') {
        // Trigger celebratory confetti
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#78A083', '#C29B88', '#E8D5CE', '#2D6A4F', '#F4E8E1'],
        });
      }
    } catch (err: any) {
      console.error('Error submitting RSVP:', err);
      setSubmitError(err.message || 'Houve um erro ao processar sua confirmação. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetForm = () => {
    setSubmittedData(null);
    setFullName('');
    setPhone('');
    setAdultsCount(1);
    setChildrenCount(0);
    setCompanionNames('');
    setMessage('');
    setSheetSyncStatus(null);
  };

  return (
    <section className="py-16 px-4 bg-[#FAF6F3] relative overflow-hidden" id="confirmacao">
      {/* Decorative Botanical Foliage */}
      <div className="absolute top-6 left-4 opacity-40 pointer-events-none hidden sm:block">
        <BotanicalBranchLeft className="w-28 h-28 text-teal-800/40" />
      </div>
      <div className="absolute top-6 right-4 opacity-40 pointer-events-none hidden sm:block">
        <BotanicalBranchRight className="w-28 h-28 text-teal-800/40" />
      </div>

      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#E8F3EE] text-teal-900 text-xs uppercase tracking-widest font-semibold mb-2">
            <UserCheck className="w-3.5 h-3.5 text-teal-800" />
            <span>Confirmação de Presença</span>
          </div>

          <h2 className="font-['Cormorant_Garamond'] text-3xl sm:text-5xl font-semibold text-stone-800 mb-2">
            Celebre Conosco
          </h2>
          <p className="text-stone-600 text-sm sm:text-base max-w-md mx-auto">
            Sua presença tornará nossa celebração ainda mais cheia de luz e alegria. Confirme até <strong>22/09/2026</strong>.
          </p>

          <BotanicalDivider className="my-4" />
        </div>

        {/* Success State */}
        {submittedData ? (
          <div className="bg-white rounded-3xl p-8 sm:p-10 shadow-xl border border-teal-800/20 text-center relative overflow-hidden animate-fade-in">
            <div className="w-16 h-16 rounded-full bg-teal-50 text-teal-800 flex items-center justify-center mx-auto mb-4 border border-teal-800/20">
              <CheckCircle2 className="w-8 h-8 text-teal-800" />
            </div>

            <h3 className="font-['Cormorant_Garamond'] text-3xl font-bold text-stone-800 mb-2">
              {submittedData.attending === 'yes' ? 'Presença Confirmada com Sucesso!' : 'Obrigado por nos Avisar!'}
            </h3>

            <p className="text-stone-600 text-sm sm:text-base max-w-md mx-auto mb-6">
              {submittedData.attending === 'yes'
                ? `Que alegria ter você conosco, ${submittedData.fullName}! Mal podemos esperar para brindar e celebrar juntos este momento tão sonhado.`
                : `Sentiremos sua falta, ${submittedData.fullName}, mas guardamos seu carinho e bênçãos em nossos corações.`}
            </p>

            {/* Confirmation Summary Card */}
            <div className="p-4 rounded-2xl bg-[#F4F8F5] border border-teal-800/15 text-left text-xs sm:text-sm text-stone-700 space-y-2 mb-6 max-w-md mx-auto">
              <div className="flex justify-between">
                <span className="text-stone-500">Convidado(a):</span>
                <span className="font-semibold text-stone-800">{submittedData.fullName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Telefone:</span>
                <span className="font-semibold text-stone-800">{submittedData.phone}</span>
              </div>
              {submittedData.attending === 'yes' && (
                <>
                  <div className="flex justify-between">
                    <span className="text-stone-500">Total de Pessoas:</span>
                    <span className="font-semibold text-teal-900">
                      {submittedData.adultsCount} adulto(s)
                      {submittedData.childrenCount > 0 ? ` + ${submittedData.childrenCount} criança(s)` : ''}
                    </span>
                  </div>
                  {submittedData.companionNames && (
                    <div className="flex justify-between">
                      <span className="text-stone-500">Acompanhantes:</span>
                      <span className="font-semibold text-stone-800 text-right">{submittedData.companionNames}</span>
                    </div>
                  )}
                </>
              )}
              {sheetSyncStatus && (
                <div className="pt-2 border-t border-teal-800/10 flex items-center gap-1.5 text-teal-900 text-xs font-medium">
                  <Sparkles className="w-3.5 h-3.5 text-teal-800" />
                  <span>Sincronizado diretamente na Planilha Google dos Noivos!</span>
                </div>
              )}
            </div>

            <button
              onClick={handleResetForm}
              className="px-6 py-2.5 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold transition"
            >
              Enviar outra confirmação
            </button>
          </div>
        ) : (
          /* RSVP Form */
          <form
            onSubmit={handleSubmit}
            className="bg-white rounded-3xl p-6 sm:p-10 shadow-xl border border-[#D5B09E]/40 relative text-left"
          >
            {submitError && (
              <div className="mb-6 p-4 rounded-2xl bg-red-50 text-red-800 text-xs sm:text-sm border border-red-200 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{submitError}</span>
              </div>
            )}

            {/* Attendance Choice Buttons */}
            <div className="mb-6">
              <label className="block text-xs uppercase tracking-wider font-bold text-stone-700 mb-3">
                Você poderá comparecer? *
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setAttending('yes')}
                  className={`p-4 rounded-2xl border text-sm font-medium flex items-center justify-center gap-2.5 transition-all ${
                    attending === 'yes'
                      ? 'bg-teal-800 text-white border-teal-800 shadow-sm'
                      : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Sim, com certeza irei! 🎉</span>
                </button>

                <button
                  type="button"
                  onClick={() => setAttending('no')}
                  className={`p-4 rounded-2xl border text-sm font-medium flex items-center justify-center gap-2.5 transition-all ${
                    attending === 'no'
                      ? 'bg-[#A66E5B] text-white border-[#A66E5B] shadow-sm'
                      : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                  }`}
                >
                  <Heart className="w-4 h-4" />
                  <span>Infelizmente não poderei ir</span>
                </button>
              </div>
            </div>

            {/* Full Name */}
            <div className="mb-5">
              <label className="block text-xs uppercase tracking-wider font-bold text-stone-700 mb-2">
                Seu Nome Completo *
              </label>
              <input
                type="text"
                required
                placeholder="Ex: Maria Clara dos Santos"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-stone-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-teal-700 bg-[#FDFCFB]"
              />
            </div>

            {/* Phone / WhatsApp */}
            <div className="mb-5">
              <label className="block text-xs uppercase tracking-wider font-bold text-stone-700 mb-2">
                WhatsApp ou Telefone com DDD *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                  <Phone className="w-4 h-4" />
                </div>
                <input
                  type="tel"
                  required
                  placeholder="(11) 98765-4321"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-stone-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-teal-700 bg-[#FDFCFB]"
                />
              </div>
              <span className="block text-[11px] text-stone-500 mt-1">
                Usaremos apenas para avisos importantes sobre o evento.
              </span>
            </div>

            {/* Companion section (only if attending) */}
            {attending === 'yes' && (
              <div className="p-5 rounded-2xl bg-[#F2F7F4] border border-teal-800/15 mb-6 space-y-4">
                <div className="flex items-center gap-2 text-xs uppercase tracking-wider font-bold text-teal-950">
                  <Users className="w-4 h-4 text-teal-800" />
                  <span>Acompanhantes & Família</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-stone-600 mb-1.5 font-medium">
                      Adultos (incluindo você):
                    </label>
                    <select
                      value={adultsCount}
                      onChange={(e) => setAdultsCount(Number(e.target.value))}
                      className="w-full px-3 py-2.5 rounded-xl border border-stone-300 bg-white text-sm focus:ring-2 focus:ring-teal-700 focus:outline-hidden"
                    >
                      {[1, 2, 3, 4, 5, 6].map((num) => (
                        <option key={num} value={num}>
                          {num} {num === 1 ? 'Adulto' : 'Adultos'}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs text-stone-600 mb-1.5 font-medium">
                      Crianças (até 10 anos):
                    </label>
                    <select
                      value={childrenCount}
                      onChange={(e) => setChildrenCount(Number(e.target.value))}
                      className="w-full px-3 py-2.5 rounded-xl border border-stone-300 bg-white text-sm focus:ring-2 focus:ring-teal-700 focus:outline-hidden"
                    >
                      {[0, 1, 2, 3, 4].map((num) => (
                        <option key={num} value={num}>
                          {num} {num === 1 ? 'Criança' : 'Crianças'}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {adultsCount > 1 && (
                  <div>
                    <label className="block text-xs text-stone-600 mb-1.5 font-medium">
                      Nome(s) do(s) acompanhante(s):
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: João Silva e Lucas Silva"
                      value={companionNames}
                      onChange={(e) => setCompanionNames(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 bg-white text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-teal-700"
                    />
                  </div>
                )}
              </div>
            )}

            {/* Heartfelt message */}
            <div className="mb-6">
              <label className="block text-xs uppercase tracking-wider font-bold text-stone-700 mb-2">
                Recado ou Mensagem de Carinho para os Noivos (Opcional)
              </label>
              <textarea
                rows={3}
                placeholder="Deixe uma mensagem especial para o casal..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-stone-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-teal-700 bg-[#FDFCFB]"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-4 rounded-full bg-teal-800 hover:bg-teal-900 disabled:opacity-50 text-white font-semibold text-base shadow-md shadow-teal-900/15 transition-all transform hover:-translate-y-0.5 flex items-center justify-center gap-2 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Processando confirmação...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Enviar Confirmação de Presença</span>
                </>
              )}
            </button>

            {/* Sheets Status Indicator */}
            <div className="mt-4 text-center">
              <p className="text-[11px] text-stone-500">
                {isSheetsConnected ? (
                  <span className="text-teal-800 font-medium inline-flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    Sua confirmação será registrada diretamente na Planilha Google do casal.
                  </span>
                ) : (
                  <span>
                    Sua confirmação será salva com segurança e enviada para os noivos.
                  </span>
                )}
              </p>
            </div>
          </form>
        )}
      </div>
    </section>
  );
};
