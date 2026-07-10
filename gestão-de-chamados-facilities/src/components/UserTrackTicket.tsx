import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, Clock, MapPin, User, CheckCircle2, 
  AlertTriangle, Star, Check, Send, Sparkles,
  RefreshCw, FileText
} from 'lucide-react';
import { Ticket, StatusType } from '../types';

export function formatNameAndSurname(fullName: string): string {
  if (!fullName) return '';
  const parts = fullName.trim().split(/\s+/);
  if (parts.length <= 1) return fullName;
  const prepositions = ['de', 'da', 'do', 'dos', 'das', 'e'];
  if (prepositions.includes(parts[1].toLowerCase()) && parts.length > 2) {
    return `${parts[0]} ${parts[1]} ${parts[2]}`;
  }
  return `${parts[0]} ${parts[1]}`;
}

interface UserTrackTicketProps {
  tickets: Ticket[];
  onRateTicket: (id: string, rating: number, feedback: string) => void;
  initialSearchCode?: string;
}

export default function UserTrackTicket({ tickets, onRateTicket, initialSearchCode = '' }: UserTrackTicketProps) {
  const [searchCode, setSearchCode] = useState(initialSearchCode);
  const [searchedTicket, setSearchedTicket] = useState<Ticket | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [rating, setRating] = useState<number>(0);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [feedbackText, setFeedbackText] = useState('');
  const [ratedSuccessfully, setRatedSuccessfully] = useState(false);

  useEffect(() => {
    if (initialSearchCode) {
      setSearchCode(initialSearchCode);
      const found = tickets.find(t => t.id.toLowerCase() === initialSearchCode.toLowerCase());
      if (found) {
        setSearchedTicket(found);
      }
      setHasSearched(true);
    }
  }, [initialSearchCode, tickets]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchCode.trim()) return;

    const found = tickets.find(t => t.id.trim().toLowerCase() === searchCode.trim().toLowerCase());
    setSearchedTicket(found || null);
    setHasSearched(true);
    setRatedSuccessfully(false);
    setRating(found?.satisfactionRating || 0);
    setFeedbackText(found?.feedbackText || '');
  };

  const handleRatingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchedTicket || rating === 0) return;

    onRateTicket(searchedTicket.id, rating, feedbackText);
    setRatedSuccessfully(true);
  };

  // Status timeline steps
  const getStatusStep = (status: StatusType): number => {
    switch (status) {
      case 'Novo': return 1;
      case 'Em Análise': return 2;
      case 'Em Atendimento': return 3;
      case 'Aguardando Peça': return 3; // Mantém no passo de atendimento mas com nota de alerta
      case 'Concluído': return 4;
      case 'Cancelado': return 0;
      default: return 1;
    }
  };

  const currentStep = searchedTicket ? getStatusStep(searchedTicket.status) : 0;

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Crítica': return 'bg-rose-100 text-rose-800 border-rose-200';
      case 'Alta': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'Média': return 'bg-blue-50 text-risel-blue border-blue-100';
      case 'Baixa': return 'bg-slate-100 text-slate-700 border-slate-200';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  const getStatusBadge = (status: StatusType) => {
    switch (status) {
      case 'Novo': return 'bg-blue-50 text-blue-700 border border-blue-200';
      case 'Em Análise': return 'bg-indigo-50 text-indigo-700 border border-indigo-200';
      case 'Em Atendimento': return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
      case 'Aguardando Peça': return 'bg-amber-50 text-amber-700 border border-amber-200';
      case 'Concluído': return 'bg-teal-50 text-teal-800 border border-teal-200';
      case 'Cancelado': return 'bg-rose-50 text-rose-700 border border-rose-200';
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-slate-100 p-6 md:p-8" id="tracking-ticket-container">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-2">
            <span className="w-1.5 h-6 bg-[#009639] rounded-full"></span>
            <h2 className="text-xl md:text-2xl font-bold font-display text-slate-900">Rastrear Chamado em Tempo Real</h2>
          </div>
          <p className="text-sm text-slate-500">Insira o identificador único gerado no ato da abertura para ver o andamento do serviço.</p>
        </div>

        {/* Campo de Busca */}
        <form onSubmit={handleSearch} className="flex gap-2 max-w-lg mx-auto mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Ex: CHA-2026-001"
              value={searchCode}
              onChange={(e) => setSearchCode(e.target.value)}
              className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-risel-blue/10 focus:border-risel-blue text-slate-800 font-mono text-base uppercase transition"
              id="search-ticket-input"
            />
          </div>
            <button
            type="submit"
            className="bg-risel-blue hover:bg-opacity-95 text-white font-semibold px-6 py-3 rounded-xl transition duration-150 flex items-center gap-2 shadow-sm cursor-pointer"
            id="search-ticket-btn"
          >
            <span>Buscar</span>
          </button>
        </form>

        <AnimatePresence mode="wait">
          {hasSearched && searchedTicket && (
            <motion.div
              key={searchedTicket.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-6"
            >
              {/* Cabeçalho do Chamado Encontrado */}
              <div className="bg-slate-50 rounded-xl p-5 border border-slate-200/60 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <div className="flex items-center gap-2.5 mb-1">
                    <span className="text-lg font-mono font-bold text-risel-blue">{searchedTicket.id}</span>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${getPriorityColor(searchedTicket.priority)}`}>
                      Urgência: {searchedTicket.priority}
                    </span>
                  </div>
                  <p className="text-sm text-slate-500">
                    Aberto em: <span className="font-medium text-slate-700">{formatDate(searchedTicket.createdAt)}</span>
                  </p>
                </div>
                <div className={`px-4 py-1.5 rounded-lg text-sm font-semibold uppercase tracking-wider ${getStatusBadge(searchedTicket.status)}`}>
                  {searchedTicket.status}
                </div>
              </div>

              {/* Barra de Progresso do Status */}
              {searchedTicket.status !== 'Cancelado' && (
                <div className="bg-white border border-slate-100 rounded-xl p-6 shadow-sm">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-6 text-center">Status de Atendimento</h4>
                  
                  <div className="relative">
                    {/* Linha de fundo */}
                    <div className="absolute top-4 left-[10%] right-[10%] h-1 bg-slate-100 -translate-y-1/2 z-0"></div>
                    
                    {/* Linha ativa */}
                    <div 
                      className="absolute top-4 left-[10%] h-1 bg-emerald-600 -translate-y-1/2 transition-all duration-500 z-0"
                      style={{ width: `${(Math.max(0, currentStep - 1) / 3) * 80}%` }}
                    ></div>

                    <div className="grid grid-cols-4 relative z-10 text-center">
                      {[
                        { step: 1, label: 'Novo', desc: 'Aguardando Triagem' },
                        { step: 2, label: 'Em Análise', desc: 'Técnico Avaliando' },
                        { step: 3, label: 'Atendimento', desc: 'Em Manutenção' },
                        { step: 4, label: 'Concluído', desc: 'Serviço Finalizado' }
                      ].map((s) => {
                        const isDone = currentStep >= s.step;
                        const isCurrent = currentStep === s.step;
                        const isAwaitingParts = s.step === 3 && searchedTicket.status === 'Aguardando Peça';

                        return (
                          <div key={s.step} className="flex flex-col items-center">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                              isDone
                                ? isCurrent && isAwaitingParts
                                  ? 'bg-amber-500 border-amber-600 text-white shadow-sm'
                                  : 'bg-emerald-600 border-emerald-600 text-white shadow-sm'
                                : 'bg-white border-slate-200 text-slate-400'
                            }`}>
                              {isDone && !isCurrent ? (
                                <Check className="w-4 h-4" />
                              ) : isCurrent && isAwaitingParts ? (
                                <AlertTriangle className="w-4 h-4" />
                              ) : (
                                <span className="text-xs font-bold">{s.step}</span>
                              )}
                            </div>
                            <span className={`text-xs font-bold mt-2 ${isCurrent ? 'text-slate-900' : 'text-slate-400'}`}>
                              {isAwaitingParts ? 'Aguard. Peça' : s.label}
                            </span>
                            <span className="text-[10px] text-slate-400 hidden sm:block mt-0.5 leading-none">
                              {s.desc}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* Informações Detalhadas */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-50 rounded-xl p-5 border border-slate-100">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Informações Gerais</h4>
                  <div className="space-y-3.5 text-sm">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-xs text-slate-400 block">Categoria do Ativo</span>
                        <span className="font-semibold text-slate-800">{searchedTicket.category}</span>
                      </div>
                      <div>
                        <span className="text-xs text-slate-400 block">Subitem do Ativo</span>
                        <span className="font-semibold text-slate-800">{searchedTicket.subitem || 'Não informado'}</span>
                      </div>
                    </div>
                    <div>
                      <span className="text-xs text-slate-400 block">Base Operacional</span>
                      <span className="font-semibold text-slate-800">{searchedTicket.operationalBase || 'Não informada'}</span>
                    </div>
                    <div>
                      <span className="text-xs text-slate-400 block">Localização do Problema</span>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <MapPin className="w-4 h-4 text-slate-400" />
                        <span className="font-semibold text-slate-800">{searchedTicket.location}</span>
                      </div>
                    </div>
                    <div>
                      <span className="text-xs text-slate-400 block">Problema Relatado</span>
                      <p className="text-slate-600 mt-1 text-xs bg-white p-3 rounded-lg border border-slate-200/50 leading-relaxed">
                        {searchedTicket.description}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 rounded-xl p-5 border border-slate-100">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Acompanhamento Técnico</h4>
                  <div className="space-y-4 text-sm">
                    <div>
                      <span className="text-xs text-slate-400 block">Técnico Responsável</span>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="w-7 h-7 rounded-full bg-blue-50 text-risel-blue border border-blue-100 flex items-center justify-center font-bold text-xs">
                          {searchedTicket.assignedTechnician ? formatNameAndSurname(searchedTicket.assignedTechnician)[0] : '?'}
                        </div>
                        <span className="font-semibold text-slate-800">
                          {searchedTicket.assignedTechnician ? formatNameAndSurname(searchedTicket.assignedTechnician) : 'Aguardando atribuição...'}
                        </span>
                      </div>
                    </div>

                    <div>
                      <span className="text-xs text-slate-400 block">SLA Estipulado & Prazo Máximo</span>
                      <div className="flex items-center gap-2 mt-1 font-mono">
                        <Clock className="w-4 h-4 text-risel-blue" />
                        <span className="font-bold text-slate-800">{searchedTicket.slaHours}h</span>
                        <span className="text-slate-400">|</span>
                        <span className="text-xs text-slate-600 font-semibold">Limite: {formatDate(searchedTicket.slaTargetDate)}</span>
                      </div>
                    </div>

                    {searchedTicket.adminNotes && (
                      <div>
                        <span className="text-xs text-slate-400 block">Relatório Técnico / Notas</span>
                        <p className="text-xs text-emerald-800 bg-emerald-50 border border-emerald-100 rounded-lg p-3 mt-1 leading-relaxed font-sans">
                          {searchedTicket.adminNotes}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Fotos Anexadas pelo Solicitante */}
              {searchedTicket.photos && searchedTicket.photos.length > 0 && (
                <div className="bg-slate-50 rounded-xl p-5 border border-slate-100">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Fotos Anexadas</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {searchedTicket.photos.map((photo, index) => (
                      <div key={index} className="relative rounded-lg overflow-hidden border border-slate-200 aspect-video bg-white shadow-xs hover:shadow-md transition duration-150">
                        <img 
                          src={photo} 
                          alt={`Anexo ${index + 1}`} 
                          className="w-full h-full object-cover cursor-pointer hover:scale-105 transition duration-200"
                          referrerPolicy="no-referrer"
                          onClick={() => {
                            const newTab = window.open();
                            if (newTab) {
                              newTab.document.write(`
                                <html>
                                  <head>
                                    <title>Visualizar Foto - Risel Facilities</title>
                                    <style>
                                      body { margin: 0; background: #0f172a; display: flex; justify-content: center; align-items: center; height: 100vh; }
                                      img { max-width: 95%; max-height: 95vh; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5); border-radius: 8px; border: 1px solid rgba(255,255,255,0.1); }
                                    </style>
                                  </head>
                                  <body>
                                    <img src="${photo}" />
                                  </body>
                                </html>
                              `);
                            }
                          }}
                        />
                        <div className="absolute bottom-0 inset-x-0 bg-slate-900/60 text-[10px] text-white py-1 text-center font-semibold font-mono">
                          Foto {index + 1}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Seção de Avaliação e Feedback (Apenas para chamados CONCLUÍDOS) */}
              {searchedTicket.status === 'Concluído' && (
                <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-6 mt-4">
                  {ratedSuccessfully || searchedTicket.satisfactionRating ? (
                    <div className="text-center py-4">
                      <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3">
                        <Check className="w-6 h-6" />
                      </div>
                      <h4 className="text-lg font-bold font-display text-slate-900 mb-1">Obrigado pelo seu Feedback!</h4>
                      <p className="text-sm text-slate-600 mb-4">Sua avaliação ajuda a manter a excelência operacional do nosso setor de Facilities.</p>
                      
                      <div className="flex justify-center gap-1.5">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star 
                            key={star} 
                            className={`w-6 h-6 ${
                              star <= (searchedTicket.satisfactionRating || rating) 
                                ? 'fill-amber-400 text-amber-400' 
                                : 'text-slate-300'
                            }`}
                          />
                        ))}
                      </div>
                      {(searchedTicket.feedbackText || feedbackText) && (
                        <p className="text-xs italic text-slate-500 mt-3 max-w-md mx-auto bg-white p-3 rounded-xl border border-slate-100">
                          "{searchedTicket.feedbackText || feedbackText}"
                        </p>
                      )}
                    </div>
                  ) : (
                    <form onSubmit={handleRatingSubmit} className="space-y-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Sparkles className="w-5 h-5 text-amber-500" />
                        <h4 className="font-bold font-display text-slate-900">Avalie este Atendimento</h4>
                      </div>
                      <p className="text-xs text-slate-500">Este chamado foi concluído. Como você avalia a agilidade e a qualidade da manutenção executada?</p>

                      {/* Estrelas */}
                      <div className="flex gap-2 justify-center py-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setRating(star)}
                            onMouseEnter={() => setHoverRating(star)}
                            onMouseLeave={() => setHoverRating(0)}
                            className="transition duration-100 focus:outline-none"
                          >
                            <Star 
                              className={`w-8 h-8 ${
                                star <= (hoverRating || rating) 
                                  ? 'fill-amber-400 text-amber-400 scale-110' 
                                  : 'text-slate-300'
                              }`}
                            />
                          </button>
                        ))}
                      </div>

                      {/* Comentário */}
                      <div>
                        <label htmlFor="feedback" className="text-xs font-bold text-slate-600 block mb-1">Comentário Adicional (Opcional)</label>
                        <textarea
                          id="feedback"
                          rows={2}
                          placeholder="Fale o que achou do atendimento ou deixe um elogio para a equipe técnica..."
                          value={feedbackText}
                          onChange={(e) => setFeedbackText(e.target.value)}
                          className="w-full px-4 py-2 text-sm rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 text-slate-800"
                        />
                      </div>

                      {/* Botão de Avaliar */}
                      <div className="flex justify-end">
                        <button
                          type="submit"
                          disabled={rating === 0}
                          className={`px-5 py-2 rounded-xl font-semibold text-xs transition duration-150 flex items-center gap-1.5 ${
                            rating > 0 
                              ? 'bg-risel-blue text-white hover:bg-opacity-90 cursor-pointer' 
                              : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                          }`}
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>Enviar Avaliação</span>
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              )}
            </motion.div>
          )}

          {hasSearched && !searchedTicket && (
            <motion.div
              key="not-found"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-10 bg-rose-50/50 border border-rose-100 rounded-2xl max-w-md mx-auto"
            >
              <AlertTriangle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
              <h4 className="text-lg font-bold font-display text-rose-900 mb-1">Chamado não Encontrado</h4>
              <p className="text-xs text-rose-700 max-w-xs mx-auto mb-4">
                O código <span className="font-mono font-bold">{searchCode}</span> não corresponde a nenhuma solicitação em nossa base de dados.
              </p>
              <p className="text-[11px] text-slate-400">Verifique a digitação do código ou tente novamente com o identificador completo recebido por e-mail.</p>
            </motion.div>
          )}

          {!hasSearched && (
            <motion.div 
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12 bg-slate-50 border border-dashed border-slate-200 rounded-2xl"
            >
              <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 text-sm font-medium">Aguardando busca de chamado.</p>
              <p className="text-slate-400 text-xs mt-1">Insira um código de chamado para consultar os detalhes técnicos.</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
