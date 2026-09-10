import React, { useState } from 'react';
import {
  FileSpreadsheet,
  X,
  ExternalLink,
  Plus,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Download,
  Users,
  Search,
  LogIn,
  LogOut,
  Sparkles,
  Link2,
} from 'lucide-react';
import { RSVPData, SheetsConfig } from '../types';
import { createRSVPSheet, batchAppendRSVPs, verifySheetAccess } from '../lib/sheetsService';
import { googleSignIn, logoutGoogle } from '../lib/googleAuth';
import { User } from 'firebase/auth';

interface SheetsAdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  rsvps: RSVPData[];
  sheetsConfig: SheetsConfig | null;
  onUpdateConfig: (config: SheetsConfig | null) => void;
  onUpdateRSVPs: (rsvps: RSVPData[]) => void;
  user: User | null;
  accessToken: string | null;
  onAuthChange: (user: User | null, token: string | null) => void;
}

export const SheetsAdminModal: React.FC<SheetsAdminModalProps> = ({
  isOpen,
  onClose,
  rsvps,
  sheetsConfig,
  onUpdateConfig,
  onUpdateRSVPs,
  user,
  accessToken,
  onAuthChange,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'sheets' | 'guests'>('overview');
  const [isCreatingSheet, setIsCreatingSheet] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [customSheetInput, setCustomSheetInput] = useState('');
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'yes' | 'no'>('all');

  if (!isOpen) return null;

  // Calculation of stats
  const confirmedRSVPs = rsvps.filter((r) => r.attending === 'yes');
  const declinedRSVPs = rsvps.filter((r) => r.attending === 'no');
  const totalAdults = confirmedRSVPs.reduce((acc, curr) => acc + (curr.adultsCount || 0), 0);
  const totalChildren = confirmedRSVPs.reduce((acc, curr) => acc + (curr.childrenCount || 0), 0);
  const totalGuests = totalAdults + totalChildren;

  // Filtered list
  const filteredRSVPs = rsvps.filter((item) => {
    const matchesFilter =
      filterType === 'all' ? true : filterType === 'yes' ? item.attending === 'yes' : item.attending === 'no';
    const matchesSearch =
      item.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.phone.includes(searchTerm) ||
      (item.companionNames && item.companionNames.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesFilter && matchesSearch;
  });

  const handleGoogleLogin = async () => {
    setIsSigningIn(true);
    setStatusMessage(null);
    try {
      const result = await googleSignIn();
      if (result) {
        onAuthChange(result.user, result.accessToken);
        setStatusMessage({ type: 'success', text: `Conectado com sucesso como ${result.user.email}!` });
      }
    } catch (err: any) {
      console.error(err);
      setStatusMessage({ type: 'error', text: err.message || 'Falha ao conectar com o Google.' });
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleGoogleLogout = async () => {
    await logoutGoogle();
    onAuthChange(null, null);
    setStatusMessage({ type: 'success', text: 'Você saiu da conta Google.' });
  };

  const handleCreateAutoSheet = async () => {
    if (!accessToken) {
      setStatusMessage({ type: 'error', text: 'Por favor, conecte sua Conta Google primeiro.' });
      return;
    }

    setIsCreatingSheet(true);
    setStatusMessage(null);

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

      // If we have existing RSVPs, sync them right now
      if (rsvps.length > 0) {
        await batchAppendRSVPs(accessToken, result.spreadsheetId, rsvps);
        const updated = rsvps.map((r) => ({ ...r, syncedToSheets: true }));
        onUpdateRSVPs(updated);
      }

      setStatusMessage({
        type: 'success',
        text: 'Planilha criada com sucesso no seu Google Drive! Todas as confirmações serão salvas nela automaticamente.',
      });
    } catch (err: any) {
      console.error(err);
      setStatusMessage({ type: 'error', text: err.message || 'Erro ao criar planilha no Google Sheets.' });
    } finally {
      setIsCreatingSheet(false);
    }
  };

  const handleLinkCustomSheet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken) {
      setStatusMessage({ type: 'error', text: 'Conecte sua Conta Google primeiro.' });
      return;
    }
    if (!customSheetInput.trim()) return;

    // Extract ID from URL or raw ID
    let sheetId = customSheetInput.trim();
    const match = sheetId.match(/\/d\/([a-zA-Z0-9-_]+)/);
    if (match && match[1]) {
      sheetId = match[1];
    }

    setIsSyncing(true);
    setStatusMessage(null);

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
      setStatusMessage({ type: 'success', text: `Planilha vinculada com sucesso: "${info.title}"!` });
      setCustomSheetInput('');
    } catch (err: any) {
      console.error(err);
      setStatusMessage({ type: 'error', text: err.message || 'Não foi possível vincular esta planilha.' });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSyncPendingRSVPs = async () => {
    if (!sheetsConfig?.spreadsheetId || !accessToken) {
      setStatusMessage({ type: 'error', text: 'Conecte sua conta Google e certifique-se de ter uma planilha vinculada.' });
      return;
    }

    setIsSyncing(true);
    setStatusMessage(null);

    try {
      const unsynced = rsvps.filter((r) => !r.syncedToSheets);
      if (unsynced.length === 0) {
        setStatusMessage({ type: 'success', text: 'Todas as confirmações já estão sincronizadas com a planilha!' });
        setIsSyncing(false);
        return;
      }

      await batchAppendRSVPs(accessToken, sheetsConfig.spreadsheetId, unsynced);
      const updated = rsvps.map((r) => ({ ...r, syncedToSheets: true }));
      onUpdateRSVPs(updated);
      onUpdateConfig({ ...sheetsConfig, lastSyncedAt: new Date().toISOString() });
      setStatusMessage({ type: 'success', text: `${unsynced.length} confirmação(ões) sincronizada(s) para o Google Sheets!` });
    } catch (err: any) {
      console.error(err);
      setStatusMessage({ type: 'error', text: err.message || 'Erro ao sincronizar com o Google Sheets.' });
    } finally {
      setIsSyncing(false);
    }
  };

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

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl border border-stone-200 overflow-hidden my-6 max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-[#F2F7F4] to-[#FAF6F3] p-5 sm:p-6 border-b border-stone-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-800 text-white flex items-center justify-center shadow-xs">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-['Cormorant_Garamond'] text-2xl font-bold text-stone-800">
                Painel de Controle dos Noivos & Google Planilhas
              </h3>
              <p className="text-xs text-stone-500">
                Gerencie convidados e mantenha sua lista sincronizada com o Google Sheets
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white text-stone-400 hover:text-stone-700 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-stone-200 px-6 bg-stone-50/70 text-xs sm:text-sm font-medium">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-3.5 px-4 border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'overview'
                ? 'border-teal-800 text-teal-900 font-semibold bg-white'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Visão Geral & Métricas</span>
          </button>
          <button
            onClick={() => setActiveTab('sheets')}
            className={`py-3.5 px-4 border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'sheets'
                ? 'border-teal-800 text-teal-900 font-semibold bg-white'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Integração Google Planilhas</span>
            {sheetsConfig && (
              <span className="w-2 h-2 rounded-full bg-emerald-500" title="Planilha conectada" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('guests')}
            className={`py-3.5 px-4 border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'guests'
                ? 'border-teal-800 text-teal-900 font-semibold bg-white'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Lista de Convidados ({rsvps.length})</span>
          </button>
        </div>

        {/* Status Notification */}
        {statusMessage && (
          <div
            className={`mx-6 mt-4 p-3.5 rounded-xl text-xs sm:text-sm flex items-start gap-2 border ${
              statusMessage.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : 'bg-red-50 text-red-800 border-red-200'
            }`}
          >
            {statusMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-600 mt-0.5" />
            ) : (
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-600 mt-0.5" />
            )}
            <span>{statusMessage.text}</span>
          </div>
        )}

        {/* Tab Body */}
        <div className="p-6 overflow-y-auto flex-1 text-stone-700">
          {/* TAB 1: OVERVIEW & STATS */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Stat Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                <div className="p-4 rounded-2xl bg-teal-50/80 border border-teal-800/15">
                  <span className="block text-[11px] uppercase tracking-wider text-teal-900 font-bold">
                    Total Confirmados
                  </span>
                  <span className="font-['Cormorant_Garamond'] text-3xl sm:text-4xl font-bold text-teal-950">
                    {totalGuests}
                  </span>
                  <span className="block text-[11px] text-teal-800 mt-0.5">
                    {totalAdults} adultos • {totalChildren} crianças
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200">
                  <span className="block text-[11px] uppercase tracking-wider text-emerald-900 font-bold">
                    Respostas Positivas
                  </span>
                  <span className="font-['Cormorant_Garamond'] text-3xl sm:text-4xl font-bold text-emerald-950">
                    {confirmedRSVPs.length}
                  </span>
                  <span className="block text-[11px] text-emerald-700 mt-0.5">Famílias/grupos</span>
                </div>

                <div className="p-4 rounded-2xl bg-[#FAF6F3] border border-[#D5B09E]/40">
                  <span className="block text-[11px] uppercase tracking-wider text-[#A66E5B] font-bold">
                    Não Poderão Ir
                  </span>
                  <span className="font-['Cormorant_Garamond'] text-3xl sm:text-4xl font-bold text-[#8E5B4C]">
                    {declinedRSVPs.length}
                  </span>
                  <span className="block text-[11px] text-stone-500 mt-0.5">Avisaram no site</span>
                </div>

                <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200">
                  <span className="block text-[11px] uppercase tracking-wider text-stone-600 font-bold">
                    Total Formulários
                  </span>
                  <span className="font-['Cormorant_Garamond'] text-3xl sm:text-4xl font-bold text-stone-800">
                    {rsvps.length}
                  </span>
                  <span className="block text-[11px] text-stone-500 mt-0.5">Respostas recebidas</span>
                </div>
              </div>

              {/* Quick Action Banner */}
              <div className="p-5 rounded-2xl bg-gradient-to-r from-[#EBF4F0] to-[#FAF4F0] border border-teal-800/15 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h4 className="font-bold text-stone-800 text-sm sm:text-base">
                    Status da Planilha Google: {sheetsConfig ? 'Conectada 🟢' : 'Pendente de Conexão ⚪'}
                  </h4>
                  <p className="text-xs text-stone-600 mt-0.5">
                    {sheetsConfig
                      ? `Vinculada à planilha "${sheetsConfig.sheetTitle}"`
                      : 'Conecte sua conta para salvar confirmações em tempo real'}
                  </p>
                </div>
                <div className="flex gap-2">
                  {sheetsConfig?.spreadsheetUrl && (
                    <a
                      href={sheetsConfig.spreadsheetUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 rounded-full bg-teal-800 hover:bg-teal-900 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Abrir Planilha</span>
                    </a>
                  )}
                  <button
                    onClick={handleExportCSV}
                    className="px-4 py-2 rounded-full bg-white hover:bg-stone-50 border border-stone-300 text-stone-700 text-xs font-semibold flex items-center gap-1.5 shadow-2xs"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Baixar CSV</span>
                  </button>
                </div>
              </div>

              {/* Recent Responses preview */}
              <div>
                <h4 className="text-xs uppercase tracking-wider font-bold text-stone-700 mb-3">
                  Últimas Confirmações Recebidas
                </h4>
                {rsvps.length === 0 ? (
                  <div className="p-8 text-center rounded-2xl bg-stone-50 border border-dashed border-stone-200 text-xs text-stone-500">
                    Ainda não há confirmações registradas. Envie o link do convite aos seus convidados!
                  </div>
                ) : (
                  <div className="space-y-2">
                    {rsvps.slice(0, 4).map((r) => (
                      <div
                        key={r.id}
                        className="p-3 rounded-xl bg-stone-50 border border-stone-200 flex items-center justify-between text-xs"
                      >
                        <div>
                          <span className="font-semibold text-stone-800">{r.fullName}</span>
                          <span className="text-stone-500 text-[11px] ml-2">({r.phone})</span>
                          {r.attending === 'yes' && (
                            <span className="text-stone-600 block text-[11px] mt-0.5">
                              {r.adultsCount} adulto(s){r.childrenCount > 0 ? `, ${r.childrenCount} criança(s)` : ''}
                              {r.companionNames ? ` • Acompanhantes: ${r.companionNames}` : ''}
                            </span>
                          )}
                        </div>
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            r.attending === 'yes' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {r.attending === 'yes' ? 'Confirmado' : 'Recusado'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: GOOGLE SHEETS INTEGRATION */}
          {activeTab === 'sheets' && (
            <div className="space-y-6">
              {/* Account Connection Card */}
              <div className="p-5 rounded-2xl bg-white border border-stone-200 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h4 className="font-semibold text-stone-800 text-sm">Conta Google dos Noivos</h4>
                    <p className="text-xs text-stone-500 mt-0.5">
                      {user
                        ? `Conectado como: ${user.email}`
                        : 'Conecte sua conta para autorizar a sincronização com o Google Planilhas'}
                    </p>
                  </div>

                  {user ? (
                    <button
                      onClick={handleGoogleLogout}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold transition"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Desconectar Conta</span>
                    </button>
                  ) : (
                    <button
                      onClick={handleGoogleLogin}
                      disabled={isSigningIn}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white hover:bg-stone-50 text-stone-700 text-xs font-semibold border border-stone-300 shadow-2xs transition"
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24">
                        <path
                          fill="#4285F4"
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                          fill="#34A853"
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                          fill="#FBBC05"
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                        />
                        <path
                          fill="#EA4335"
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                        />
                      </svg>
                      <span>{isSigningIn ? 'Conectando...' : 'Conectar com Google'}</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Option A: Create Auto Spreadsheet */}
              <div className="p-5 rounded-2xl bg-[#F2F7F4] border border-teal-800/20">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <span className="inline-block px-2.5 py-0.5 rounded-md bg-teal-800/15 text-teal-900 text-[10px] font-bold uppercase">
                      Recomendado
                    </span>
                    <h4 className="font-semibold text-stone-800 text-sm sm:text-base">
                      Criar Planilha Oficial Automática no Google Drive
                    </h4>
                    <p className="text-xs text-stone-600 max-w-xl">
                      Cria uma planilha formatada com cabeçalhos bonitos e colunas organizadas (Data, Convidado, Presença, Acompanhantes, Telefone, Restrições, Mensagem) diretamente no seu Google Drive.
                    </p>
                  </div>

                  <button
                    onClick={handleCreateAutoSheet}
                    disabled={isCreatingSheet}
                    className="px-5 py-2.5 rounded-full bg-teal-800 hover:bg-teal-900 disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-2 flex-shrink-0 shadow-xs"
                  >
                    {isCreatingSheet ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Criando...</span>
                      </>
                    ) : (
                      <>
                        <Plus className="w-3.5 h-3.5" />
                        <span>Criar Planilha Agora</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Option B: Link Existing Sheet */}
              <form onSubmit={handleLinkCustomSheet} className="p-5 rounded-2xl bg-[#FAF6F3] border border-[#D5B09E]/40 space-y-3">
                <h4 className="font-semibold text-stone-800 text-sm">
                  Ou Vincular uma Planilha Google Existente
                </h4>
                <p className="text-xs text-stone-600">
                  Caso já tenha uma planilha no seu Google Sheets, cole a URL ou o ID dela aqui:
                </p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="https://docs.google.com/spreadsheets/d/SEU_ID_AQUI/edit"
                    value={customSheetInput}
                    onChange={(e) => setCustomSheetInput(e.target.value)}
                    className="flex-1 px-3.5 py-2 rounded-xl border border-stone-300 text-xs focus:ring-2 focus:ring-teal-700 bg-white"
                  />
                  <button
                    type="submit"
                    disabled={isSyncing || !customSheetInput.trim()}
                    className="px-4 py-2 rounded-xl bg-[#A66E5B] hover:bg-[#8E5B4C] disabled:opacity-40 text-white text-xs font-semibold shadow-2xs"
                  >
                    Vincular
                  </button>
                </div>
              </form>

              {/* Current Connected Sheet Details */}
              {sheetsConfig && (
                <div className="p-5 rounded-2xl bg-white border border-teal-800/30 shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileSpreadsheet className="w-5 h-5 text-teal-800" />
                      <span className="font-bold text-sm text-stone-800">{sheetsConfig.sheetTitle}</span>
                    </div>
                    <a
                      href={sheetsConfig.spreadsheetUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-teal-800 hover:underline flex items-center gap-1 font-semibold"
                    >
                      <span>Abrir no Google Planilhas</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-stone-100 text-xs text-stone-500">
                    <span>ID: {sheetsConfig.spreadsheetId}</span>
                    <button
                      onClick={handleSyncPendingRSVPs}
                      disabled={isSyncing}
                      className="px-4 py-2 rounded-full bg-teal-50 hover:bg-teal-100 text-teal-900 border border-teal-800/20 font-semibold flex items-center gap-1.5 transition"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                      <span>Sincronizar Todas as Confirmações</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: GUESTS LIST */}
          {activeTab === 'guests' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
                {/* Search */}
                <div className="relative w-full sm:w-72">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                  <input
                    type="text"
                    placeholder="Buscar por nome ou telefone..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 rounded-xl border border-stone-300 text-xs focus:ring-2 focus:ring-teal-700 bg-white"
                  />
                </div>

                {/* Filter */}
                <div className="flex gap-1.5 w-full sm:w-auto">
                  <button
                    onClick={() => setFilterType('all')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                      filterType === 'all' ? 'bg-teal-800 text-white' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                    }`}
                  >
                    Todos ({rsvps.length})
                  </button>
                  <button
                    onClick={() => setFilterType('yes')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                      filterType === 'yes' ? 'bg-teal-800 text-white' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                    }`}
                  >
                    Confirmados ({confirmedRSVPs.length})
                  </button>
                  <button
                    onClick={() => setFilterType('no')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                      filterType === 'no' ? 'bg-[#A66E5B] text-white' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                    }`}
                  >
                    Recusados ({declinedRSVPs.length})
                  </button>
                </div>
              </div>

              {/* Table */}
              <div className="border border-stone-200 rounded-2xl overflow-hidden shadow-xs">
                <div className="overflow-x-auto max-h-96">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-stone-100 text-stone-700 font-semibold sticky top-0">
                      <tr>
                        <th className="p-3">Convidado</th>
                        <th className="p-3">Status</th>
                        <th className="p-3">Total Pessoas</th>
                        <th className="p-3">Telefone</th>
                        <th className="p-3">Acompanhantes</th>
                        <th className="p-3">Mensagem / Observações</th>
                        <th className="p-3">Planilha</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-200">
                      {filteredRSVPs.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="p-8 text-center text-stone-400">
                            Nenhum registro encontrado.
                          </td>
                        </tr>
                      ) : (
                        filteredRSVPs.map((r) => (
                          <tr key={r.id} className="hover:bg-stone-50">
                            <td className="p-3 font-semibold text-stone-800">{r.fullName}</td>
                            <td className="p-3">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  r.attending === 'yes'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-rose-100 text-rose-800'
                                }`}
                              >
                                {r.attending === 'yes' ? 'Confirmado' : 'Recusado'}
                              </span>
                            </td>
                            <td className="p-3">
                              {r.attending === 'yes' ? (
                                <span className="font-semibold text-teal-900">
                                  {r.adultsCount} ad. {r.childrenCount > 0 ? `+ ${r.childrenCount} cr.` : ''}
                                </span>
                              ) : (
                                '-'
                              )}
                            </td>
                            <td className="p-3 text-stone-600">{r.phone}</td>
                            <td className="p-3 text-stone-600 max-w-xs truncate">{r.companionNames || '-'}</td>
                            <td className="p-3 text-stone-600 max-w-xs truncate">
                              {r.message || r.dietaryRestrictions || '-'}
                            </td>
                            <td className="p-3">
                              {r.syncedToSheets ? (
                                <span className="text-emerald-600 font-bold">✓ Sincronizado</span>
                              ) : (
                                <span className="text-amber-600">Pendente</span>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Table Footer */}
              <div className="flex items-center justify-between pt-2">
                <span className="text-xs text-stone-500">
                  Mostrando {filteredRSVPs.length} de {rsvps.length} confirmações
                </span>
                <button
                  onClick={handleExportCSV}
                  className="px-4 py-2 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Exportar Planilha Excel/CSV</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-stone-50 border-t border-stone-200 flex items-center justify-between text-xs text-stone-500">
          <span>Comemoração de Casamento • 25 de Setembro de 2026</span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-full bg-teal-800 hover:bg-teal-900 text-white font-semibold text-xs transition"
          >
            Fechar Painel
          </button>
        </div>
      </div>
    </div>
  );
};
