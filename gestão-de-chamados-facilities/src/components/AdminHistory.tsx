import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Filter, SlidersHorizontal, Calendar, ArrowUpDown, 
  Search, Check, X, Eye, Edit2, CheckCircle2, 
  Clock, AlertTriangle, User, DollarSign, Wrench, FileText,
  Trash2
} from 'lucide-react';
import { Ticket, PriorityType, StatusType, AdminUser } from '../types';
import { TECHNICIANS } from '../data';

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

export function getSlaRemainingText(slaTargetDateStr: string, status: StatusType) {
  if (status === 'Concluído' || status === 'Cancelado') {
    return null;
  }
  
  const now = new Date();
  const target = new Date(slaTargetDateStr);
  const diffTime = target.getTime() - now.getTime();
  const diffMinutes = diffTime / (1000 * 60);
  const diffHours = diffTime / (1000 * 60 * 60);
  const diffDays = diffTime / (1000 * 60 * 60 * 24);
  
  if (diffTime < 0) {
    const hoursPast = Math.abs(diffHours);
    if (hoursPast < 24) {
      return {
        text: `Atrasado ${Math.round(hoursPast)}h`,
        color: 'text-rose-600 font-bold',
        days: diffDays
      };
    }
    return {
      text: `Atrasado ${Math.ceil(Math.abs(diffDays))}d`,
      color: 'text-rose-600 font-bold animate-pulse',
      days: diffDays
    };
  } else {
    // Menos de 1 hora restante
    if (diffMinutes < 60) {
      return {
        text: `Falta ${Math.round(diffMinutes)}m`,
        color: 'text-rose-500 font-extrabold animate-pulse',
        days: diffDays
      };
    }
    // Menos de 24 horas restantes
    if (diffHours < 24) {
      return {
        text: `Falta ${Math.round(diffHours)}h`,
        color: 'text-amber-500 font-bold animate-pulse',
        days: diffDays
      };
    }
    
    // Dias restantes
    const roundedDays = Math.round(diffDays);
    if (roundedDays <= 1) {
      return {
        text: `Falta 1 dia`,
        color: 'text-amber-600 font-medium',
        days: diffDays
      };
    }
    return {
      text: `Faltam ${roundedDays} dias`,
      color: 'text-emerald-600 font-medium',
      days: diffDays
    };
  }
}

interface AdminHistoryProps {
  tickets: Ticket[];
  onUpdateTicket: (updatedTicket: Ticket) => void;
  onDeleteTicket: (ticketId: string) => void;
  adminUsers: AdminUser[];
  initialSelectedTicketId?: string | null;
  onCloseDetail?: () => void;
}

export default function AdminHistory({ 
  tickets, 
  onUpdateTicket, 
  onDeleteTicket,
  adminUsers,
  initialSelectedTicketId,
  onCloseDetail
}: AdminHistoryProps) {
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  
  // States for filters
  const [showInlineFilters, setShowInlineFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<string>('Todas');
  const [statusFilter, setStatusFilter] = useState<string>('Todos');
  const [dateFilter, setDateFilter] = useState<string>('Todos'); // 'Todos', '7dias', '30dias', 'hoje'

  // Edit ticket state
  const [editStatus, setEditStatus] = useState<StatusType>('Novo');
  const [editTechnician, setEditTechnician] = useState('');
  const [editCost, setEditCost] = useState<number>(0);
  const [editNotes, setEditNotes] = useState('');

  // Sorting state
  const [sortConfig, setSortConfig] = useState<{ key: keyof Ticket, direction: 'asc' | 'desc' } | null>(null);

  const selectedTicket = tickets.find(t => t.id === selectedTicketId);

  // Sync initialSelectedTicketId
  React.useEffect(() => {
    if (initialSelectedTicketId) {
      const ticket = tickets.find(t => t.id === initialSelectedTicketId);
      if (ticket) {
        handleOpenDetail(ticket);
      }
    }
  }, [initialSelectedTicketId, tickets]);

  const handleClose = () => {
    setSelectedTicketId(null);
    setShowConfirmDelete(false);
    if (onCloseDetail) onCloseDetail();
  };

  const requestSort = (key: keyof Ticket) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Filter logic
  const filteredTickets = tickets.filter(ticket => {
    // 1. Text Search Query
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = 
      ticket.id.toLowerCase().includes(searchLower) ||
      ticket.requesterName.toLowerCase().includes(searchLower) ||
      ticket.location.toLowerCase().includes(searchLower) ||
      ticket.description.toLowerCase().includes(searchLower);

    // 2. Priority Filter
    const matchesPriority = priorityFilter === 'Todas' || ticket.priority === priorityFilter;

    // 3. Status Filter
    const matchesStatus = statusFilter === 'Todos' || ticket.status === statusFilter;

    // 4. Date Filter
    let matchesDate = true;
    if (dateFilter !== 'Todos') {
      const ticketTime = new Date(ticket.createdAt).getTime();
      const now = Date.now();
      const oneDay = 24 * 60 * 60 * 1000;
      
      if (dateFilter === 'hoje') {
        matchesDate = (now - ticketTime) < oneDay;
      } else if (dateFilter === '7dias') {
        matchesDate = (now - ticketTime) < (7 * oneDay);
      } else if (dateFilter === '30dias') {
        matchesDate = (now - ticketTime) < (30 * oneDay);
      }
    }

    return matchesSearch && matchesPriority && matchesStatus && matchesDate;
  });

  const sortedTickets = React.useMemo(() => {
    let sortableTickets = [...filteredTickets];
    if (sortConfig !== null) {
      sortableTickets.sort((a, b) => {
        const aVal = a[sortConfig.key];
        const bVal = b[sortConfig.key];
        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return sortableTickets;
  }, [filteredTickets, sortConfig]);

  const handleOpenDetail = (ticket: Ticket) => {
    setSelectedTicketId(ticket.id);
    setEditStatus(ticket.status);
    setEditTechnician(ticket.assignedTechnician || '');
    setEditCost(ticket.cost || 0);
    setEditNotes(ticket.adminNotes || '');
  };

  const handleSaveDetails = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket) return;

    const isSlaViolated = selectedTicket.isSlaViolated || 
      (editStatus === 'Concluído' && new Date() > new Date(selectedTicket.slaTargetDate));

    const updated: Ticket = {
      ...selectedTicket,
      status: editStatus,
      assignedTechnician: editTechnician || undefined,
      cost: Number(editCost),
      adminNotes: editNotes,
      isSlaViolated,
      updatedAt: new Date().toISOString()
    };

    onUpdateTicket(updated);
    handleClose(); // Fecha o painel
  };

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

  const getPriorityBadge = (priority: PriorityType) => {
    switch (priority) {
      case 'Crítica': return 'bg-rose-100 text-rose-800 text-xs font-semibold px-2 py-0.5 rounded-full border border-rose-200';
      case 'Alta': return 'bg-amber-100 text-amber-800 text-xs font-semibold px-2 py-0.5 rounded-full border border-amber-200';
      case 'Média': return 'bg-blue-50 text-risel-blue text-xs font-semibold px-2 py-0.5 rounded-full border border-blue-100';
      case 'Baixa': return 'bg-slate-100 text-slate-700 text-xs font-semibold px-2 py-0.5 rounded-full border border-slate-200';
    }
  };

  const getStatusBadge = (status: StatusType) => {
    let style = '';
    switch (status) {
      case 'Novo': style = 'bg-blue-50 text-blue-700 border-blue-200'; break;
      case 'Em Análise': style = 'bg-indigo-50 text-indigo-700 border-indigo-200'; break;
      case 'Em Atendimento': style = 'bg-teal-50 text-teal-700 border-teal-200'; break;
      case 'Aguardando Peça': style = 'bg-amber-50 text-amber-700 border-amber-200'; break;
      case 'Concluído': style = 'bg-emerald-50 text-emerald-800 border-emerald-200'; break;
      case 'Cancelado': style = 'bg-rose-50 text-rose-700 border-rose-200'; break;
    }
    return (
      <span className={`${style} text-xs font-semibold px-2.5 py-1 rounded-lg border inline-block whitespace-nowrap shadow-2xs`}>
        {status}
      </span>
    );
  };

  return (
    <div className="space-y-6" id="history-tab-container">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-bold font-display text-slate-900">Histórico de Chamados de Facilities</h2>
          <p className="text-xs text-slate-500">Consulte, filtre e gerencie ordens de serviço ativas e o histórico de intervenções prediais.</p>
        </div>
        <button
          onClick={() => setShowInlineFilters(!showInlineFilters)}
          className={`flex items-center gap-2 text-xs border px-3 py-1.5 rounded-lg transition ${showInlineFilters ? 'bg-risel-blue text-white border-risel-blue' : 'bg-white border-slate-200 text-slate-700 hover:border-risel-primary'}`}
        >
          <Filter className="w-3.5 h-3.5" />
          {showInlineFilters ? 'Ocultar Filtros' : 'Filtros'}
        </button>
      </div>

      {/* Painel de Filtros Avançados - Retrátil */}
      {showInlineFilters && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-risel-blue" />
              <h3 className="text-sm font-bold text-slate-800 font-display">Filtros Avançados</h3>
            </div>
            <button 
              onClick={() => {
                setSearchQuery('');
                setPriorityFilter('Todas');
                setStatusFilter('Todos');
                setDateFilter('Todos');
              }}
              className="text-xs font-semibold text-slate-400 hover:text-risel-blue transition"
            >
              Limpar Filtros
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Busca por texto */}
            <div>
              <label className="text-xs font-bold text-slate-500 block mb-1">Buscar por palavra-chave</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="ID, solicitante, local, etc..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-risel-blue/10 focus:border-risel-blue"
                />
              </div>
            </div>

            {/* Categoria de Prioridade */}
            <div>
              <label className="text-xs font-bold text-slate-500 block mb-1">Urgência / Prioridade</label>
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-100 bg-white"
              >
                <option value="Todas">Todas as prioridades</option>
                <option value="Crítica">Crítica</option>
                <option value="Alta">Alta</option>
                <option value="Média">Média</option>
                <option value="Baixa">Baixa</option>
              </select>
            </div>

            {/* Status */}
            <div>
              <label className="text-xs font-bold text-slate-500 block mb-1">Status da OS</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-100 bg-white"
              >
                <option value="Todos">Todos os status</option>
                <option value="Novo">Novo</option>
                <option value="Em Análise">Em Análise</option>
                <option value="Em Atendimento">Em Atendimento</option>
                <option value="Aguardando Peça">Aguardando Peça</option>
                <option value="Concluído">Concluído</option>
                <option value="Cancelado">Cancelado</option>
              </select>
            </div>

            {/* Período */}
            <div>
              <label className="text-xs font-bold text-slate-500 block mb-1">Período de Abertura</label>
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-100 bg-white"
              >
                <option value="Todos">Todo o histórico</option>
                <option value="hoje">Hoje (últimas 24h)</option>
                <option value="7dias">Últimos 7 dias</option>
                <option value="30dias">Últimos 30 dias</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Lista Funcional (Tabela responsiva) */}
      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
        <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Exibindo {filteredTickets.length} de {tickets.length} chamados
          </span>
        </div>

        {filteredTickets.length === 0 ? (
          <div className="p-12 text-center">
            <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-sm font-semibold text-slate-700">Nenhum chamado encontrado</p>
            <p className="text-xs text-slate-400 mt-1">Ajuste os filtros de pesquisa acima para refinar os resultados.</p>
          </div>
        ) : (
          <div className="overflow-y-auto overflow-x-auto max-h-[600px] relative scrollbar-thin">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/20 bg-gradient-to-r from-risel-blue to-[#1a5b3a] text-white text-[11px] font-bold uppercase tracking-wider">
                  <th className="px-6 py-4 cursor-pointer hover:text-risel-yellow sticky top-0 z-10 bg-risel-blue" onClick={() => requestSort('id')}>ID / Abertura</th>
                  <th className="px-6 py-4 cursor-pointer hover:text-risel-yellow sticky top-0 z-10 bg-risel-blue" onClick={() => requestSort('requesterName')}>Solicitante / Local</th>
                  <th className="px-6 py-4 sticky top-0 z-10 bg-risel-blue">Categoria / Assunto</th>
                  <th className="px-6 py-4 cursor-pointer hover:text-risel-yellow sticky top-0 z-10 bg-risel-blue" onClick={() => requestSort('priority')}>Urgência</th>
                  <th className="px-6 py-4 cursor-pointer hover:text-risel-yellow sticky top-0 z-10 bg-risel-blue" onClick={() => requestSort('status')}>Status</th>
                  <th className="px-6 py-4 cursor-pointer hover:text-risel-yellow sticky top-0 z-10 bg-risel-blue" onClick={() => requestSort('slaTargetDate')}>SLA Limite</th>
                  <th className="px-6 py-4 text-right sticky top-0 z-10 bg-risel-blue">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {sortedTickets.map((ticket) => {
                  const isOverSla = new Date() > new Date(ticket.slaTargetDate) && ticket.status !== 'Concluído' && ticket.status !== 'Cancelado';
                  
                  return (
                    <tr key={ticket.id} className="hover:bg-slate-50/70 transition">
                      {/* ID / Abertura */}
                      <td className="px-6 py-4">
                        <span className="font-mono font-bold text-risel-blue block">{ticket.id}</span>
                        <span className="text-[10px] text-slate-400 block mt-0.5">{formatDate(ticket.createdAt)}</span>
                      </td>

                      {/* Solicitante / Local */}
                      <td className="px-6 py-4">
                        <span className="font-medium text-slate-800 block leading-tight">{ticket.requesterName}</span>
                        <span className="text-xs text-slate-500 block mt-0.5">
                          {ticket.operationalBase ? `${ticket.operationalBase} - ` : ''}{ticket.location}
                        </span>
                      </td>

                      {/* Categoria / Assunto */}
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap items-center gap-1 mb-1">
                          <span className="text-[10px] font-semibold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded-md leading-none">
                            {ticket.category}
                          </span>
                          {ticket.subitem && (
                            <span className="text-[10px] font-semibold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-md leading-none">
                              {ticket.subitem}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 line-clamp-1 max-w-[200px]">{ticket.description}</p>
                      </td>

                      {/* Urgência */}
                      <td className="px-6 py-4">
                        <span className={getPriorityBadge(ticket.priority)}>{ticket.priority}</span>
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4">
                        {getStatusBadge(ticket.status)}
                      </td>

                      {/* SLA Limite */}
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-xs font-semibold text-slate-700">{formatDate(ticket.slaTargetDate)}</span>
                          {(() => {
                            const remaining = getSlaRemainingText(ticket.slaTargetDate, ticket.status);
                            if (remaining) {
                              return (
                                <span className={`text-[11px] flex items-center gap-1 mt-1 font-semibold ${remaining.color}`}>
                                  <Clock className="w-3.5 h-3.5 shrink-0" /> {remaining.text}
                                </span>
                              );
                            }
                            
                            if (ticket.status === 'Concluído') {
                              return ticket.isSlaViolated ? (
                                <span className="text-[10px] font-bold text-rose-500 uppercase tracking-wider flex items-center gap-1 mt-1">
                                  Estourou SLA
                                </span>
                              ) : (
                                <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider flex items-center gap-1 mt-1">
                                  Atendido no Prazo
                                </span>
                              );
                            }
                            
                            return (
                              <span className="text-[10px] text-slate-400 mt-1">Cancelado</span>
                            );
                          })()}
                        </div>
                      </td>

                      {/* Botão de Ação */}
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleOpenDetail(ticket)}
                          className="p-2 hover:bg-blue-50/50 text-risel-blue rounded-lg transition flex items-center gap-1 text-xs font-semibold ml-auto cursor-pointer"
                        >
                          <Edit2 className="w-4 h-4" />
                          <span>Gerenciar</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Painel Lateral de Detalhes e Ações (Slide-over panel) */}
      <AnimatePresence>
        {selectedTicketId && selectedTicket && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              exit={{ opacity: 0 }}
              onClick={handleClose}
              className="fixed inset-0 bg-black z-40"
            />

            {/* Painel de Ações */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-white shadow-2xl z-50 flex flex-col border-l border-slate-100"
            >
              {/* Header do Painel */}
              <div className="p-6 border-b border-slate-100 bg-risel-blue text-white flex justify-between items-center shrink-0">
                <div>
                  <span className="text-xs font-mono font-bold uppercase tracking-wider text-blue-200">Gerenciar Chamado</span>
                  <h3 className="text-lg font-bold font-display">{selectedTicket.id}</h3>
                </div>
                <button
                  onClick={handleClose}
                  className="p-1.5 hover:bg-white/10 rounded-lg transition text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Corpo com formulário */}
              <form onSubmit={handleSaveDetails} className="flex-1 overflow-y-auto p-6 space-y-6 text-sm">
                
                {/* Resumo do Solicitante */}
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Informações de Contato</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <span className="text-[10px] text-slate-400 block">Solicitante</span>
                      <span className="font-semibold text-slate-800 block leading-tight">{selectedTicket.requesterName}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Contato / Telefone</span>
                      <span className="text-xs font-medium text-slate-600 block">{selectedTicket.requesterPhone}</span>
                    </div>
                    <div className="col-span-2 grid grid-cols-2 gap-2 bg-slate-100/50 p-2.5 rounded-xl border border-slate-200/40">
                      <div>
                        <span className="text-[10px] text-slate-400 block">Base Operacional</span>
                        <span className="font-semibold text-slate-800 text-xs block leading-tight">{selectedTicket.operationalBase || 'Não informado'}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">Subitem do Ativo</span>
                        <span className="font-semibold text-slate-800 text-xs block leading-tight">{selectedTicket.subitem || 'Não informado'}</span>
                      </div>
                    </div>
                    <div className="col-span-2">
                      <span className="text-[10px] text-slate-400 block">Localização</span>
                      <span className="font-semibold text-slate-800 block">{selectedTicket.location}</span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-[10px] text-slate-400 block">Problema</span>
                      <p className="text-xs text-slate-600 mt-0.5 bg-white p-2.5 rounded border border-slate-200/50 leading-relaxed">
                        {selectedTicket.description}
                      </p>
                    </div>
                    {selectedTicket.photos && selectedTicket.photos.length > 0 && (
                      <div className="col-span-2 space-y-1.5 pt-1">
                        <span className="text-[10px] text-slate-400 block uppercase font-bold tracking-wider">Fotos Anexadas</span>
                        <div className="grid grid-cols-3 gap-2">
                          {selectedTicket.photos.map((photo, index) => (
                            <div key={index} className="relative rounded-lg overflow-hidden border border-slate-200 aspect-video bg-white shadow-xs hover:shadow-md transition">
                              <img 
                                src={photo} 
                                alt={`Anexo ${index + 1}`} 
                                className="w-full h-full object-cover cursor-pointer hover:scale-105 transition duration-150"
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
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Atualizar Status */}
                <div>
                  <label htmlFor="edit-status" className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Mudar Status da Ocorrência *</label>
                  <select
                    id="edit-status"
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as StatusType)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-100 bg-white"
                  >
                    <option value="Novo">Novo (Em Triagem)</option>
                    <option value="Em Análise">Em Análise</option>
                    <option value="Em Atendimento">Em Atendimento</option>
                    <option value="Aguardando Peça">Aguardando Peça / Fornecedor</option>
                    <option value="Concluído">Concluído (Resolver OS)</option>
                    <option value="Cancelado">Cancelado</option>
                  </select>
                </div>

                {/* Atribuir Técnico */}
                <div>
                  <label htmlFor="edit-tech" className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Atribuir Técnico Responsável</label>
                  <select
                    id="edit-tech"
                    value={editTechnician}
                    onChange={(e) => setEditTechnician(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-100 bg-white"
                  >
                    <option value="">-- Selecionar Administrador / Técnico --</option>
                    {adminUsers && adminUsers.filter(u => u.active).map(t => (
                      <option key={t.id} value={t.name}>
                        {formatNameAndSurname(t.name)}
                      </option>
                    ))}
                    {(!adminUsers || adminUsers.length === 0) && TECHNICIANS.map(t => (
                      <option key={t} value={t}>{formatNameAndSurname(t)}</option>
                    ))}
                  </select>
                </div>

                {/* Custos da Manutenção (OPEX) */}
                <div>
                  <label htmlFor="edit-cost" className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Custo Associado (R$)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-semibold text-xs">R$</span>
                    <input
                      id="edit-cost"
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0,00"
                      value={editCost || ''}
                      onChange={(e) => setEditCost(Number(e.target.value))}
                      className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-100 font-mono"
                    />
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1 block">Incorpore o valor de peças, taxas ou hora-técnica externa para faturamento e Opex.</span>
                </div>

                {/* Notas internas / Relatório técnico */}
                <div>
                  <label htmlFor="edit-notes" className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Notas Técnicas / Resolução da OS</label>
                  <textarea
                    id="edit-notes"
                    rows={4}
                    placeholder="Descreva as ações tomadas, peças substituídas ou detalhes de agendamento de terceiros..."
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                {/* Exclusão de Chamado (Ação de Segurança) */}
                <div className="pt-4 border-t border-slate-100 space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-rose-500">Ações de Segurança / Moderação</h4>
                  
                  {!showConfirmDelete ? (
                    <button
                      type="button"
                      onClick={() => setShowConfirmDelete(true)}
                      className="w-full py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 hover:text-rose-800 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 border border-rose-100 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4 text-rose-600" />
                      <span>Excluir Chamado Permanentemente</span>
                    </button>
                  ) : (
                    <div className="bg-rose-50/70 border border-rose-200 rounded-xl p-4 space-y-3">
                      <p className="text-xs font-semibold text-rose-800 leading-relaxed">
                        Tem certeza que deseja excluir este chamado permanentemente? Essa ação removerá o chamado da nuvem e do sistema local de forma definitiva e não poderá ser desfeita.
                      </p>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            onDeleteTicket(selectedTicket.id);
                            setShowConfirmDelete(false);
                            handleClose();
                          }}
                          className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition cursor-pointer"
                        >
                          Sim, Excluir
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowConfirmDelete(false)}
                          className="px-3.5 py-1.5 bg-white border border-slate-200 text-slate-600 rounded-lg text-xs font-semibold hover:bg-slate-50 transition cursor-pointer"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  )}
                </div>

              </form>

              {/* Footer do Painel com botões */}
              <div className="p-4 border-t border-slate-100 bg-slate-50 shrink-0 flex gap-3">
                <button
                  type="button"
                  onClick={handleClose}
                  className="flex-1 py-3 text-xs font-semibold text-slate-500 hover:text-slate-700 bg-white border border-slate-200 rounded-xl transition text-center"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSaveDetails}
                  className="flex-1 py-3 text-xs font-bold text-white bg-risel-blue hover:bg-opacity-95 rounded-xl transition text-center shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>Salvar Alterações</span>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
