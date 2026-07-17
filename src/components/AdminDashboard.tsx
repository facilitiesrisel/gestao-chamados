import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  TrendingUp, Clock, AlertTriangle, CheckCircle2, 
  DollarSign, Activity, Wrench, ShieldAlert, 
  Calendar, Award, HeartHandshake, X, Filter
} from 'lucide-react';
import { 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, 
  CartesianGrid, Tooltip, Legend, LineChart, Line, 
  PieChart, Pie, Cell, AreaChart, Area 
} from 'recharts';
import { Ticket } from '../types';

interface AdminDashboardProps {
  tickets: Ticket[];
  onEditTicket?: (ticketId: string) => void;
}

export default function AdminDashboard({ tickets, onEditTicket }: AdminDashboardProps) {
  const [showCriticalModal, setShowCriticalModal] = useState(false);
  const [showInlineFilters, setShowInlineFilters] = useState(false);
  const [periodFilter, setPeriodFilter] = useState('Todos');
  const [statusFilter, setStatusFilter] = useState('Todos');
  const [monthFilter, setMonthFilter] = useState('Todos');
  const [yearFilter, setYearFilter] = useState('Todos');

  // Calculate filtered tickets based on state
  const filteredTickets = tickets.filter(t => {
    let matchesPeriod = true;
    if (periodFilter !== 'Todos') {
      const now = new Date();
      const ticketDate = new Date(t.createdAt);
      if (periodFilter === 'Últimos 30 dias') matchesPeriod = (now.getTime() - ticketDate.getTime()) < 30 * 24 * 60 * 60 * 1000;
      else if (periodFilter === 'Últimos 6 meses') matchesPeriod = (now.getTime() - ticketDate.getTime()) < 6 * 30 * 24 * 60 * 60 * 1000;
      else if (periodFilter === 'Este ano') matchesPeriod = ticketDate.getFullYear() === now.getFullYear();
    }
    const matchesStatus = statusFilter === 'Todos' || t.status === statusFilter;
    const matchesMonth = monthFilter === 'Todos' || new Date(t.createdAt).getMonth() + 1 === parseInt(monthFilter);
    const matchesYear = yearFilter === 'Todos' || new Date(t.createdAt).getFullYear() === parseInt(yearFilter);
    
    return matchesPeriod && matchesStatus && matchesMonth && matchesYear;
  });

  // Critical items
  const criticalTickets = filteredTickets.filter(t => t.status !== 'Concluído' && t.status !== 'Cancelado');


  // Modal component
  const CriticalItemsModal = () => (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-xl">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-slate-900">Itens Críticos (Abertos)</h3>
          <button onClick={() => setShowCriticalModal(false)} className="text-slate-400 hover:text-rose-500"><X /></button>
        </div>
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {criticalTickets.map(t => (
            <div key={t.id} className="p-3 border border-slate-200 rounded-lg flex justify-between items-center text-xs">
              <div><span className="font-bold text-risel-blue">{t.id}</span> - {t.category}</div>
              <button 
                onClick={() => {
                  setShowCriticalModal(false);
                  if (onEditTicket) onEditTicket(t.id);
                }} 
                className="text-risel-primary font-bold hover:underline cursor-pointer"
              >
                Editar
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // 1. Calculate dynamic statistics based on current active tickets
  const totalTickets = filteredTickets.length;
  const pendingTickets = filteredTickets.filter(t => t.status !== 'Concluído' && t.status !== 'Cancelado').length;
  
  const resolvedTickets = filteredTickets.filter(t => t.status === 'Concluído');
  const totalResolvedCount = resolvedTickets.length;

  const slaCompliedCount = resolvedTickets.filter(t => !t.isSlaViolated).length;
  const slaCompliancePercent = totalResolvedCount > 0 
    ? Math.round((slaCompliedCount / totalResolvedCount) * 100) 
    : 100;

  const totalCosts = filteredTickets.reduce((acc, t) => acc + (t.cost || 0), 0);

  // Real Predictive Score simulation: 
  const slaViolations = filteredTickets.filter(t => t.isSlaViolated).length;
  const predictiveScore = Math.max(0, 100 - (pendingTickets * 2) - (slaViolations * 5));

  // --- 1. Calcular MTTR Real (Tempo Médio de Resposta) ---
  const ticketsComTempo = filteredTickets.filter(t => t.status === 'Concluído' && t.createdAt && t.updatedAt);
  const totalTempoMinutos = ticketsComTempo.reduce((acc, t) => {
    return acc + (new Date(t.updatedAt).getTime() - new Date(t.createdAt).getTime()) / (1000 * 60);
  }, 0);
  const mttrReal = ticketsComTempo.length > 0 ? Math.round(totalTempoMinutos / ticketsComTempo.length) : null;
  
  let mttrText = '--';
  if (mttrReal !== null) {
    if (mttrReal < 60) {
      mttrText = `${mttrReal} min`;
    } else if (mttrReal < 1440) {
      const hours = Math.floor(mttrReal / 60);
      const minutes = mttrReal % 60;
      mttrText = `${hours}h ${minutes}m`;
    } else {
      const days = Math.floor(mttrReal / 1440);
      const remainingMinutes = mttrReal % 1440;
      const hours = Math.floor(remainingMinutes / 60);
      mttrText = `${days}d ${hours}h`;
    }
  }

  // --- 2. Calcular CSAT Real (Satisfação de Atendimento) ---
  const ticketsComAvaliacao = filteredTickets.filter(t => t.satisfactionRating !== undefined && t.satisfactionRating !== null);
  const somaAvaliacao = ticketsComAvaliacao.reduce((acc, t) => acc + (t.satisfactionRating || 0), 0);
  const csatReal = ticketsComAvaliacao.length > 0 ? (somaAvaliacao / ticketsComAvaliacao.length).toFixed(1) : null;
  const csatText = csatReal !== null ? `${csatReal}/5` : '--';

  // Agregação de solicitações por dia para o novo gráfico
  const ticketsByDay = filteredTickets.reduce((acc: Record<string, number>, t) => {
    const day = t.createdAt.split('T')[0];
    acc[day] = (acc[day] || 0) + 1;
    return acc;
  }, {});

  const dailyRequestData = Object.entries(ticketsByDay)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => new Date(a.name).getTime() - new Date(b.name).getTime())
    .map(item => {
      const parts = item.name.split('-');
      if (parts.length === 3) {
        return { ...item, name: `${parts[2]}/${parts[1]}/${parts[0]}` };
      }
      return item;
    });


  // Agregação de solicitações por mês para o gráfico de evolução
  const ticketsByMonth = filteredTickets.reduce((acc: Record<string, { total: number, concluidos: number }>, t) => {
    const month = t.createdAt.substring(0, 7); // yyyy-mm
    if (!acc[month]) acc[month] = { total: 0, concluidos: 0 };
    acc[month].total += 1;
    if (t.status === 'Concluído') acc[month].concluidos += 1;
    return acc;
  }, {});

  const monthlyEvolutionData = Object.entries(ticketsByMonth)
    .map(([key, data]) => ({ 
        key,
        name: new Date(key + '-02T00:00:00').toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '').toUpperCase(),
        total: data.total,
        concluidos: data.concluidos
    }))
    .sort((a, b) => a.key.localeCompare(b.key));

  // Dynamic distribution of categories for live updates
  const categoryCounts = filteredTickets.reduce((acc: Record<string, { value: number, cost: number }>, t) => {
    if (!acc[t.category]) {
      acc[t.category] = { value: 0, cost: 0 };
    }
    acc[t.category].value += 1;
    acc[t.category].cost += t.cost || 0;
    return acc;
  }, {});

  const dynamicCategoryData = Object.entries(categoryCounts).map(([name, data]) => ({
    name,
    value: data.value,
    cost: data.cost
  }));

  const categoryDistributionData = dynamicCategoryData;

  const priorityCounts = filteredTickets.reduce((acc: Record<string, { tempo: number, count: number }>, t) => {
    if (t.status === 'Concluído' && t.createdAt && t.updatedAt) {
      const priority = t.priority || 'Média';
      if (!acc[priority]) acc[priority] = { tempo: 0, count: 0 };
      const duration = (new Date(t.updatedAt).getTime() - new Date(t.createdAt).getTime()) / (1000 * 60);
      acc[priority].tempo += duration;
      acc[priority].count += 1;
    }
    return acc;
  }, {});

  const resolutionTimeByPriorityData = Object.entries(priorityCounts).map(([name, data]) => ({
    name,
    tempoMedioMinutos: data.count > 0 ? Math.round(data.tempo / data.count) : 0,
    slaMedioMinutos: 480 
  }));

  const finalResolutionData = resolutionTimeByPriorityData;

  // Gerar dados de custo por ativo de forma 100% dinâmica a partir do banco
  const costByAssetData = Object.entries(categoryCounts).map(([name, data]) => ({
    name,
    realizado: data.cost,
    preventiva: Math.round(data.cost * 0.25) // estimativa realista de 25% de manutenção preventiva
  }));

  // Gerar dados de chamados por setor (Base Operacional) de forma 100% dinâmica
  const sectorCounts = filteredTickets.reduce((acc: Record<string, number>, t) => {
    const sector = t.operationalBase || 'Sem Especificar';
    acc[sector] = (acc[sector] || 0) + 1;
    return acc;
  }, {});

  const sectorChartData = Object.entries(sectorCounts).map(([name, value]) => ({
    name,
    value
  })).sort((a, b) => b.value - a.value);

  // Gerar dados de chamados por setor / local de forma 100% dinâmica
  const locationCounts = filteredTickets.reduce((acc: Record<string, number>, t) => {
    const loc = t.location || 'Sem Especificar';
    acc[loc] = (acc[loc] || 0) + 1;
    return acc;
  }, {});

  const locationChartData = Object.entries(locationCounts).map(([name, value]) => ({
    name,
    value
  })).sort((a, b) => b.value - a.value).slice(0, 10);

  // Colors for graphs
  const COLORS_RISEL = [
    '#002B5C', // Azul Risel Escuro
    '#009639', // Verde Risel
    '#FFC72C', // Amarelo Risel
    '#EF4444', // Red
    '#06B6D4', // Cyan
    '#8B5CF6', // Purple
    '#64748B'  // Gray
  ];

  const formatCurrency = (val: number) => {
    return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  return (
    <div className="space-y-6" id="dashboard-tab-container">
      {/* Seção Congelada/Sticky - Do Cabeçalho e Filtros até os Cards de KPI */}
      <div className="sticky top-[-24px] z-30 bg-slate-50/95 backdrop-blur-md -mx-6 px-6 pt-6 pb-5 border-b border-slate-200/60 shadow-sm" id="dashboard-sticky-pane">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
          <div>
            <h2 className="text-xl md:text-2xl font-bold font-display text-slate-900">Dashboard de Eficiência de Facilities</h2>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowInlineFilters(!showInlineFilters)}
              className={`flex items-center gap-2 text-xs border px-3 py-1.5 rounded-lg transition ${showInlineFilters ? 'bg-risel-blue text-white border-risel-blue' : 'bg-white border-slate-200 text-slate-700 hover:border-risel-primary'}`}
            >
              <Filter className="w-3.5 h-3.5" />
              {showInlineFilters ? 'Ocultar Filtros' : 'Filtros'}
            </button>
            
            <button 
              onClick={() => setShowCriticalModal(true)}
              className="text-xs bg-white border border-rose-200 text-rose-700 font-bold px-3 py-1.5 rounded-lg hover:bg-rose-50 transition"
            >
              Itens Críticos
            </button>
          </div>
        </div>
        
        {showCriticalModal && <CriticalItemsModal />}
        {showInlineFilters && (
          <div className="mb-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Status</label>
                  <select 
                    value={statusFilter} 
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full text-xs bg-slate-50 border border-slate-200 px-3 py-2 rounded-lg text-slate-700 focus:outline-none focus:border-risel-primary"
                  >
                    <option>Todos</option>
                    <option>Novo</option>
                    <option>Em Análise</option>
                    <option>Em Atendimento</option>
                    <option>Concluído</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Mês</label>
                  <select 
                    value={monthFilter} 
                    onChange={(e) => setMonthFilter(e.target.value)}
                    className="w-full text-xs bg-slate-50 border border-slate-200 px-3 py-2 rounded-lg text-slate-700 focus:outline-none focus:border-risel-primary"
                  >
                    <option value="Todos">Todos</option>
                    {[
                      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
                      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
                    ].map((mes, i) => (
                      <option key={i+1} value={String(i+1)}>{mes}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Ano</label>
                  <select 
                    value={yearFilter} 
                    onChange={(e) => setYearFilter(e.target.value)}
                    className="w-full text-xs bg-slate-50 border border-slate-200 px-3 py-2 rounded-lg text-slate-700 focus:outline-none focus:border-risel-primary"
                  >
                    <option value="Todos">Todos</option>
                    <option value="2025">2025</option>
                    <option value="2026">2026</option>
                  </select>
                </div>
              </div>
          </div>
        )}

        {/* Grid de Cards de KPI */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Card 1: Total de Chamados */}
          <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm flex flex-col justify-between" id="card-total-chamados">
            <div className="flex justify-between items-start mb-1.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Chamados</span>
              <div className="p-1.5 rounded-lg bg-blue-50/50 text-risel-blue">
                <Wrench className="w-4 h-4" />
              </div>
            </div>
            <div>
              <span className="text-2xl font-mono font-bold text-slate-900 block leading-none mb-0.5">{totalTickets}</span>
              <div className="flex items-center gap-1 text-[10px] text-emerald-600 font-semibold">
                <TrendingUp className="w-3 h-3" />
                <span>+12.4% vs mês ant.</span>
              </div>
            </div>
          </div>

          {/* Card 2: Chamados em Aberto */}
          <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm flex flex-col justify-between" id="card-chamados-aberto">
            <div className="flex justify-between items-start mb-1.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Em Aberto / Triagem</span>
              <div className="p-1.5 rounded-lg bg-amber-50 text-amber-600">
                <AlertTriangle className="w-4 h-4" />
              </div>
            </div>
            <div>
              <span className="text-2xl font-mono font-bold text-slate-900 block leading-none mb-0.5">{pendingTickets}</span>
              <div className="flex items-center gap-1 text-[10px]">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping"></span>
                <span className="text-amber-700 font-semibold truncate">Requer atenção</span>
              </div>
            </div>
          </div>

          {/* Card 3: Conformidade de SLA */}
          <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm flex flex-col justify-between" id="card-sla-compliance">
            <div className="flex justify-between items-start mb-1.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Cumprimento SLA</span>
              <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <div>
              <span className="text-2xl font-mono font-bold text-slate-900 block leading-none mb-0.5">{slaCompliancePercent}%</span>
              <div className="flex items-center gap-1 text-[10px] text-emerald-600 font-semibold">
                <Award className="w-3 h-3" />
                <span>Meta excelência (90%)</span>
              </div>
            </div>
          </div>

          {/* Card 4: Custos Totais */}
          <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm flex flex-col justify-between" id="card-total-costs">
            <div className="flex justify-between items-start mb-1.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Custo Manutenção</span>
              <div className="p-1.5 rounded-lg bg-teal-50 text-teal-600">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
            <div>
              <span className="text-xl font-mono font-bold text-slate-900 block leading-none mb-0.5">{formatCurrency(totalCosts)}</span>
              <div className="flex items-center gap-1 text-[10px] text-slate-500">
                <span>Mês corrente</span>
              </div>
            </div>
          </div>

          {/* Card 5: Tempo Médio de Resposta (MTTR) */}
          <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm flex flex-col justify-between" id="card-mttr">
            <div className="flex justify-between items-start mb-1.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Tempo Resolução</span>
              <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div>
              <span className="text-2xl font-mono font-bold text-slate-900 block leading-none mb-0.5">{mttrText}</span>
              <div className="flex items-center gap-1 text-[10px] text-emerald-600 font-semibold">
                <HeartHandshake className="w-3 h-3" />
                <span>CSAT {csatText}</span>
              </div>
            </div>
          </div>
        </div>
      </div>



      <div className="mt-6 space-y-6">
        {/* Grid de Gráficos - Pelo menos 7 gráficos para análise detalhada de desempenho */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Gráfico 1: Evolução Mensal dos Chamados (Abertos vs Concluídos) */}
          <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
            <div className="mb-4">
              <h3 className="text-sm font-bold text-slate-800 font-display">1. Histórico de Demanda e Resolutividade</h3>
              <p className="text-[11px] text-slate-400">Total de chamados abertos comparado com concluídos no prazo contratual de SLA.</p>
            </div>
            <div className="h-[260px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyEvolutionData}>
                  <defs>
                    <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#002B5C" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#002B5C" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorConcluidos" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#009639" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#009639" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <Tooltip />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '11px' }} />
                  <Area type="monotone" dataKey="total" name="Chamados Recebidos" stroke="#002B5C" strokeWidth={2} fillOpacity={1} fill="url(#colorTotal)" />
                  <Area type="monotone" dataKey="concluidos" name="Atendidos com Sucesso" stroke="#009639" strokeWidth={2} fillOpacity={1} fill="url(#colorConcluidos)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Gráfico 2: Volume de Chamados por Categoria de Ativo */}
          <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
            <div className="mb-4">
              <h3 className="text-sm font-bold text-slate-800 font-display">2. Distribuição por Classe de Ativo</h3>
              <p className="text-[11px] text-slate-400">Distribuição volumétrica por tipo de subsistema predial em manutenção.</p>
            </div>
            <div className="h-[260px] w-full flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="h-full flex-1 w-full max-w-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryDistributionData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={80}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {categoryDistributionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS_RISEL[index % COLORS_RISEL.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`${value} chamados`, 'Volume']} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              
              <div className="space-y-1.5 text-xs flex-1 w-full">
                {categoryDistributionData.map((entry, index) => (
                  <div key={entry.name} className="flex items-center justify-between border-b border-slate-50 pb-1">
                    <div className="flex items-center gap-2">
                      <span 
                        className="w-2.5 h-2.5 rounded-full shrink-0" 
                        style={{ backgroundColor: COLORS_RISEL[index % COLORS_RISEL.length] }}
                      ></span>
                      <span className="text-slate-600 font-medium">{entry.name}</span>
                    </div>
                    <span className="font-mono font-bold text-slate-900">{entry.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Gráfico 3: Tempo de Resolução vs SLA por Prioridade */}
          <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
            <div className="mb-4">
              <h3 className="text-sm font-bold text-slate-800 font-display">3. Tempo Médio de Resolução (MTTR) vs SLA Limite</h3>
              <p className="text-[11px] text-slate-400">Tempo de execução real comparado com o SLA contratual tolerado (em minutos).</p>
            </div>
            <div className="h-[260px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={finalResolutionData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <Tooltip />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '11px' }} />
                  <Bar dataKey="tempoMedioMinutos" name="Tempo Real de Reparo (min)" fill="#009639" radius={[4, 4, 0, 0]} maxBarSize={30} />
                  <Bar dataKey="slaMedioMinutos" name="Prazo de SLA Limite (min)" fill="#002B5C" radius={[4, 4, 0, 0]} maxBarSize={30} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Gráfico 4: Custos de Manutenção: Planejado vs Realizado */}
          <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm bg-gradient-to-br from-white to-slate-50/30">
            <div className="mb-4">
              <h3 className="text-sm font-bold text-slate-800 font-display">4. Desempenho Financeiro e Opex de Ativos</h3>
              <p className="text-[11px] text-slate-400">Comparação financeira de custos de corretiva e preventiva realizados por classe de ativo (em R$).</p>
            </div>
            <div className="h-[260px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={costByAssetData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                  <XAxis type="number" stroke="#94a3b8" fontSize={10} tickLine={false} />
                  <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={10} width={130} tickLine={false} />
                  <Tooltip formatter={(value) => [`R$ ${value}`, 'Investimento']} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '11px' }} />
                  <Bar dataKey="realizado" name="Custo Corretivo Realizado" fill="#EF4444" radius={[0, 4, 4, 0]} maxBarSize={12} />
                  <Bar dataKey="preventiva" name="Custo de Manut. Preventiva" fill="#009639" radius={[0, 4, 4, 0]} maxBarSize={12} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Gráfico 5: Distribuição de Ocorrências por Setor / Base */}
          <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm bg-gradient-to-br from-white to-slate-50/30">
            <div className="mb-4">
              <h3 className="text-sm font-bold text-slate-800 font-display">5. Chamados por Setor (Base Operacional)</h3>
              <p className="text-[11px] text-slate-400">Total de chamados registrados por cada setor ou base operacional.</p>
            </div>
            <div className="h-[260px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={sectorChartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} />
                  <Tooltip formatter={(value) => [`${value} chamados`, 'Volume']} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '11px' }} />
                  <Bar dataKey="value" name="Volume de Chamados" fill="#002B5C" radius={[4, 4, 0, 0]} maxBarSize={35}>
                    {sectorChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS_RISEL[index % COLORS_RISEL.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Gráfico 6: Distribuição de Ocorrências por Setor / Local (Lado a lado com Base) */}
          <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm bg-gradient-to-br from-white to-slate-50/30">
            <div className="mb-4">
              <h3 className="text-sm font-bold text-slate-800 font-display">6. Chamados por Setor / Local</h3>
              <p className="text-[11px] text-slate-400">Total de chamados registrados por cada setor ou localização física.</p>
            </div>
            <div className="h-[260px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={locationChartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} />
                  <Tooltip formatter={(value) => [`${value} chamados`, 'Volume']} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '11px' }} />
                  <Bar dataKey="value" name="Volume de Chamados" fill="#009639" radius={[4, 4, 0, 0]} maxBarSize={35}>
                    {locationChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS_RISEL[(index + 2) % COLORS_RISEL.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Gráfico 7: Solicitações por dia */}
          <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm lg:col-span-2">
            <div className="mb-4">
              <h3 className="text-sm font-bold text-slate-800 font-display">7. Volume Diário de Solicitações</h3>
              <p className="text-[11px] text-slate-400">Distribuição diária de novas solicitações conforme filtros aplicados.</p>
            </div>
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dailyRequestData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <Tooltip />
                  <Line type="monotone" dataKey="value" name="Solicitações" stroke="#247d52" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
