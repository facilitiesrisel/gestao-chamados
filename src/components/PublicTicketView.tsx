import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'motion/react';
import { 
  Search, Clock, MapPin, User, CheckCircle2, 
  AlertTriangle, Check, Send, RefreshCw,
  FileText, MessageSquare, Camera
} from 'lucide-react';

interface PublicTicket {
  id: string;
  requesterName: string;
  requesterEmail: string;
  category: string;
  subitem: string;
  location: string;
  description: string;
  priority: string;
  status: string;
  operationalBase: string;
  createdAt: string;
  slaTargetDate: string;
  assignedTechnician?: string;
  technicalNotes?: string;
  requesterComment?: string;
  requesterCommentAt?: string;
  baseOperacional?: string;
}

function formatDate(dateStr: string) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${day}/${month}/${year} ${hours}:${minutes}`;
}

function getStatusStep(status: string): number {
  switch (status) {
    case 'Novo': return 1;
    case 'Em Análise': return 2;
    case 'Em Atendimento': return 3;
    case 'Aguardando Peça': return 3;
    case 'Concluído': return 4;
    case 'Cancelado': return 0;
    default: return 1;
  }
}

export default function PublicTicketView({ ticketId }: { ticketId: string }) {
  const [ticket, setTicket] = useState<PublicTicket | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [comment, setComment] = useState('');
  const [commentPhoto, setCommentPhoto] = useState('');
  const [sendingComment, setSendingComment] = useState(false);
  const [commentSent, setCommentSent] = useState(false);

  const fetchTicket = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/tickets/public/${ticketId}`);
      if (!res.ok) {
        if (res.status === 404) {
          setError('Chamado não encontrado. Verifique o código e tente novamente.');
        } else {
          setError('Erro ao buscar chamado. Tente novamente mais tarde.');
        }
        return;
      }
      const data = await res.json();
      setTicket(data.ticket);
    } catch (e) {
      setError('Erro de conexão. Verifique sua internet e tente novamente.');
    } finally {
      setLoading(false);
    }
  }, [ticketId]);

  useEffect(() => {
    fetchTicket();
  }, [fetchTicket]);

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) return;

    setSendingComment(true);
    try {
      const res = await fetch(`/api/tickets/public/${ticketId}/comment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ comment: comment.trim(), photo: commentPhoto || undefined }),
      });
      if (res.ok) {
        setCommentSent(true);
        setComment('');
        setCommentPhoto('');
        fetchTicket(); // Reload ticket to show new comment
      } else {
        alert('Erro ao enviar comentário. Tente novamente.');
      }
    } catch (e) {
      alert('Erro de conexão ao enviar comentário.');
    } finally {
      setSendingComment(false);
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert('Foto deve ter no máximo 5MB.');
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setCommentPhoto(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const currentStep = ticket ? getStatusStep(ticket.status) : 0;

  if (loading) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center bg-white rounded-2xl shadow-xl border border-slate-100 p-6">
        <RefreshCw className="w-8 h-8 text-risel-blue animate-spin mb-4" />
        <p className="text-sm text-slate-500">Carregando informações do chamado...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center bg-white rounded-2xl shadow-xl border border-slate-100 p-6">
        <AlertTriangle className="w-12 h-12 text-rose-500 mb-4" />
        <h2 className="text-lg font-bold text-slate-900 mb-2">Chamado não Encontrado</h2>
        <p className="text-sm text-slate-500 text-center max-w-md mb-4">{error}</p>
        <button 
          onClick={fetchTicket}
          className="px-4 py-2 bg-risel-blue text-white rounded-xl text-sm font-semibold hover:bg-opacity-90 transition"
        >
          Tentar Novamente
        </button>
      </div>
    );
  }

  if (!ticket) return null;

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-slate-100 p-6 md:p-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-2">
            <span className="w-1.5 h-6 bg-[#009639] rounded-full"></span>
            <h2 className="text-xl md:text-2xl font-bold font-display text-slate-900">Acompanhamento do Chamado</h2>
          </div>
          <p className="text-sm text-slate-500">Visualize o progresso e adicione informações ao seu chamado.</p>
        </div>

        {/* Ticket Header */}
        <div className="bg-slate-50 rounded-xl p-5 border border-slate-200/60 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2.5 mb-1">
              <span className="text-lg font-mono font-bold text-risel-blue">{ticket.id}</span>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                ticket.priority === 'Crítica' ? 'bg-rose-100 text-rose-800 border-rose-200' :
                ticket.priority === 'Alta' ? 'bg-amber-100 text-amber-800 border-amber-200' :
                ticket.priority === 'Média' ? 'bg-blue-50 text-risel-blue border-blue-100' :
                'bg-slate-100 text-slate-700 border-slate-200'
              }`}>
                Urgência: {ticket.priority}
              </span>
            </div>
            <p className="text-sm text-slate-500">
              Aberto em: <span className="font-medium text-slate-700">{formatDate(ticket.createdAt)}</span>
            </p>
          </div>
          <div className={`px-4 py-1.5 rounded-lg text-sm font-semibold uppercase tracking-wider ${
            ticket.status === 'Novo' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
            ticket.status === 'Em Análise' ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' :
            ticket.status === 'Em Atendimento' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
            ticket.status === 'Aguardando Peça' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
            ticket.status === 'Concluído' ? 'bg-teal-50 text-teal-800 border border-teal-200' :
            'bg-rose-50 text-rose-700 border border-rose-200'
          }`}>
            {ticket.status}
          </div>
        </div>

        {/* Progress Bar */}
        {ticket.status !== 'Cancelado' && (
          <div className="bg-white border border-slate-100 rounded-xl p-6 shadow-sm mb-6">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-6 text-center">Status de Atendimento</h4>
            <div className="relative">
              <div className="absolute top-4 left-[10%] right-[10%] h-1 bg-slate-100 -translate-y-1/2 z-0"></div>
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
                  const isAwaitingParts = s.step === 3 && ticket.status === 'Aguardando Peça';
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
                      <span className="text-[10px] text-slate-400 hidden sm:block mt-0.5 leading-none">{s.desc}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="bg-slate-50 rounded-xl p-5 border border-slate-100">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Informações do Chamado</h4>
            <div className="space-y-3 text-sm">
              <div>
                <span className="text-xs text-slate-400 block">Categoria</span>
                <span className="font-semibold text-slate-800">{ticket.category}</span>
              </div>
              <div>
                <span className="text-xs text-slate-400 block">Subitem</span>
                <span className="font-semibold text-slate-800">{ticket.subitem || 'Não informado'}</span>
              </div>
              <div>
                <span className="text-xs text-slate-400 block">Base Operacional</span>
                <span className="font-semibold text-slate-800">{ticket.operationalBase || ticket.baseOperacional || 'Não informada'}</span>
              </div>
              <div>
                <span className="text-xs text-slate-400 block">Localização</span>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <MapPin className="w-4 h-4 text-slate-400" />
                  <span className="font-semibold text-slate-800">{ticket.location || 'Não informada'}</span>
                </div>
              </div>
              <div>
                <span className="text-xs text-slate-400 block">Problema Relatado</span>
                <p className="text-slate-600 mt-1 text-xs bg-white p-3 rounded-lg border border-slate-200/50 leading-relaxed">
                  {ticket.description || 'Não informado'}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-slate-50 rounded-xl p-5 border border-slate-100">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Acompanhamento</h4>
            <div className="space-y-4 text-sm">
              <div>
                <span className="text-xs text-slate-400 block">Técnico Responsável</span>
                <div className="flex items-center gap-2 mt-1">
                  <div className="w-7 h-7 rounded-full bg-blue-50 text-risel-blue border border-blue-100 flex items-center justify-center font-bold text-xs">
                    {ticket.assignedTechnician ? ticket.assignedTechnician[0].toUpperCase() : '?'}
                  </div>
                  <span className="font-semibold text-slate-800">
                    {ticket.assignedTechnician || 'Aguardando atribuição...'}
                  </span>
                </div>
              </div>
              <div>
                <span className="text-xs text-slate-400 block">Prazo SLA</span>
                <div className="flex items-center gap-2 mt-1 font-mono">
                  <Clock className="w-4 h-4 text-risel-blue" />
                  <span className="text-xs text-slate-600 font-semibold">Limite: {formatDate(ticket.slaTargetDate)}</span>
                </div>
              </div>
              {ticket.technicalNotes && (
                <div>
                  <span className="text-xs text-slate-400 block">Notas Técnicas / Resolução</span>
                  <p className="text-xs text-emerald-800 bg-emerald-50 border border-emerald-100 rounded-lg p-3 mt-1 leading-relaxed">
                    {ticket.technicalNotes}
                  </p>
                </div>
              )}
              {ticket.requesterComment && (
                <div>
                  <span className="text-xs text-slate-400 block">Sua Última Observação</span>
                  <p className="text-xs text-blue-800 bg-blue-50 border border-blue-100 rounded-lg p-3 mt-1 leading-relaxed">
                    {ticket.requesterComment}
                  </p>
                  {ticket.requesterCommentAt && (
                    <p className="text-[10px] text-slate-400 mt-1">Enviado em: {formatDate(ticket.requesterCommentAt)}</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Comment Form */}
        {ticket.status !== 'Concluído' && ticket.status !== 'Cancelado' && (
          <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-6">
            {commentSent ? (
              <div className="text-center py-4">
                <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Check className="w-6 h-6" />
                </div>
                <h4 className="text-lg font-bold font-display text-slate-900 mb-1">Observação Enviada!</h4>
                <p className="text-sm text-slate-600 mb-4">Sua informação foi registrada e os administradores foram notificados.</p>
                <button 
                  onClick={() => setCommentSent(false)}
                  className="px-4 py-2 bg-risel-blue text-white rounded-xl text-sm font-semibold hover:bg-opacity-90 transition"
                >
                  Enviar Outra Observação
                </button>
              </div>
            ) : (
              <form onSubmit={handleCommentSubmit} className="space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <MessageSquare className="w-5 h-5 text-risel-blue" />
                  <h4 className="font-bold font-display text-slate-900">Adicionar Observação</h4>
                </div>
                <p className="text-xs text-slate-500">Envie atualizações, fotos ou informações adicionais sobre o problema.</p>
                
                <textarea
                  rows={3}
                  placeholder="Descreva alguma informação adicional sobre o problema..."
                  value={comment}
                  onChange={(e) => { setComment(e.target.value); setCommentSent(false); }}
                  className="w-full px-4 py-2 text-sm rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 text-slate-800"
                />

                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-500 hover:text-slate-700 transition">
                    <Camera className="w-4 h-4" />
                    <span>Anexar Foto</span>
                    <input 
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      onChange={handlePhotoUpload}
                    />
                  </label>
                  {commentPhoto && (
                    <div className="relative">
                      <img src={commentPhoto} alt="Preview" className="w-10 h-10 rounded-lg object-cover border border-slate-200" />
                      <button 
                        type="button" 
                        onClick={() => setCommentPhoto('')}
                        className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-rose-500 text-white rounded-full text-[10px] flex items-center justify-center"
                      >
                        ✕
                      </button>
                    </div>
                  )}
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={!comment.trim() || sendingComment}
                    className={`px-5 py-2 rounded-xl font-semibold text-xs transition duration-150 flex items-center gap-1.5 ${
                      comment.trim() && !sendingComment
                        ? 'bg-risel-blue text-white hover:bg-opacity-90 cursor-pointer'
                        : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{sendingComment ? 'Enviando...' : 'Enviar Observação'}</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
