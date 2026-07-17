import { Ticket, MaintenanceItem, PriorityType, StatusType, OperationalBase, UrgencyConfig } from './types';

export const INITIAL_BASES: OperationalBase[] = [
  { id: 'b1', name: 'Filial São Paulo (Matriz)', active: true, establishment: 'EST-101' },
  { id: 'b2', name: 'Base Paulínia - SP', active: true, establishment: 'EST-102' },
  { id: 'b3', name: 'Base Cubatão - SP', active: true, establishment: 'EST-103' },
  { id: 'b4', name: 'Base Duque de Caxias - RJ', active: true, establishment: 'EST-104' },
  { id: 'b5', name: 'Base Araucária - PR', active: true, establishment: 'EST-105' }
];

export const INITIAL_URGENCY_CONFIGS: UrgencyConfig[] = [
  { id: 'u1', priority: 'Baixa', defaultSlaDays: 5, active: true },
  { id: 'u2', priority: 'Média', defaultSlaDays: 3, active: true },
  { id: 'u3', priority: 'Alta', defaultSlaDays: 2, active: true },
  { id: 'u4', priority: 'Crítica', defaultSlaDays: 1, active: true }
];

export const MAINTENANCE_ITEMS: MaintenanceItem[] = [
  {
    id: '1',
    name: 'Ar Condicionado & Refrigeração',
    category: 'Climatização',
    defaultSlaDays: 2,
    descriptionPlaceholder: 'Ex: Aparelho split do bloco B sala 302 não está gelando ou apresenta vazamento de água.',
    iconName: 'Wind',
    active: true,
    subitems: [
      'Ar-condicionado não resfria',
      'Vazamento de água / Gotejamento',
      'Barulho excessivo na evaporadora/condensadora',
      'Mal cheiro ao ligar o aparelho',
      'Controle remoto quebrado ou sem bateria'
    ]
  },
  {
    id: '2',
    name: 'Elétrica & Iluminação',
    category: 'Elétrica',
    defaultSlaDays: 1,
    descriptionPlaceholder: 'Ex: Queda de disjuntor, tomadas sem energia ou lâmpadas piscando no setor administrativo.',
    iconName: 'Zap',
    active: true,
    subitems: [
      'Lâmpadas apagadas ou piscando',
      'Tomada sem energia ou com mau contato',
      'Queda frequente de disjuntor',
      'Fiação exposta ou curto-circuito',
      'Instalação de novos pontos elétricos'
    ]
  },
  {
    id: '3',
    name: 'Hidráulica & Saneamento',
    category: 'Hidráulica',
    defaultSlaDays: 1,
    descriptionPlaceholder: 'Ex: Torneira vazando, entupimento nos banheiros sociais do 1º andar ou infiltrações.',
    iconName: 'Droplet',
    active: true,
    subitems: [
      'Vazamento em torneira/registro',
      'Vaso sanitário entupido ou vazando',
      'Infiltração ou umidade na parede',
      'Falta de abastecimento de água',
      'Pia ou ralo entupido'
    ]
  },
  {
    id: '4',
    name: 'Manutenção Civil & Pintura',
    category: 'Civil & Infraestrutura',
    defaultSlaDays: 5,
    descriptionPlaceholder: 'Ex: Ajuste de portas, trincas nas paredes, fechadura com defeito ou goteira no teto.',
    iconName: 'Hammer',
    active: true,
    subitems: [
      'Ajuste/Manutenção de portas ou janelas',
      'Fechadura ou maçaneta quebrada',
      'Trincas ou rachaduras na parede',
      'Goteira ou infiltração no telhado',
      'Pintura ou retoque de parede/teto'
    ]
  },
  {
    id: '5',
    name: 'Elevadores & Transporte Vertical',
    category: 'Sistemas',
    defaultSlaDays: 1,
    descriptionPlaceholder: 'Ex: Elevador de carga parou com falha de energia ou emite ruído atípico durante subida.',
    iconName: 'ArrowUpDown',
    active: true,
    subitems: [
      'Elevador travado ou inoperante',
      'Ruído estranho durante deslocamento',
      'Portas com dificuldade de fechamento',
      'Painel de botões quebrado'
    ]
  },
  {
    id: '6',
    name: 'Controle de Acesso & CFTV',
    category: 'Segurança',
    defaultSlaDays: 2,
    descriptionPlaceholder: 'Ex: Catraca eletrônica da recepção não lê cartões ou câmera do estacionamento apagada.',
    iconName: 'ShieldAlert',
    active: true,
    subitems: [
      'Câmera de segurança offline/chuvisco',
      'Catraca ou portão eletrônico travado',
      'Leitor biométrico/tag sem leitura',
      'Alarme disparando sem motivo'
    ]
  },
  {
    id: '7',
    name: 'Limpeza Crítica & Conservação',
    category: 'Limpeza & Conservação',
    defaultSlaDays: 1,
    descriptionPlaceholder: 'Ex: Derramamento de óleo no galpão ou necessidade de higienização de emergência em auditório.',
    iconName: 'Trash2',
    active: true,
    subitems: [
      'Derramamento de resíduos/óleo',
      'Necessidade de limpeza pós-obra',
      'Falta de insumos nos banheiros',
      'Sujeira acumulada em área comum'
    ]
  }
];

export const TECHNICIANS = [
  'Carlos Eduardo (Eletricista Sênior)',
  'Marcos Vinícius (Técnico HVAC)',
  'Julio Cezar (Encanador/Hidráulica)',
  'Roberto Silva (Marceneiro/Civil)',
  'Anderson Melo (Sistemas de Segurança)',
  'Equipe de Facilities Externa (Terceirizada)'
];

export const INITIAL_TICKETS: Ticket[] = [];

export const CHART_CATEGORY_DISTRIBUTION = [
  { name: 'Climatização', value: 4, cost: 2090 },
  { name: 'Elétrica', value: 3, cost: 420 },
  { name: 'Hidráulica', value: 2, cost: 530 },
  { name: 'Civil & Infra', value: 2, cost: 1980 },
  { name: 'Sistemas/Elevador', value: 1, cost: 950 },
  { name: 'Segurança', value: 2, cost: 290 },
  { name: 'Limpeza & Cons.', value: 2, cost: 150 }
];

export const CHART_MONTHLY_EVOLUTION = [
  { name: 'Jan/26', total: 8, concluidos: 8, slaNoPrazo: 8, custos: 2400 },
  { name: 'Fev/26', total: 12, concluidos: 11, slaNoPrazo: 11, custos: 3100 },
  { name: 'Mar/26', total: 15, concluidos: 14, slaNoPrazo: 13, custos: 4500 },
  { name: 'Abr/26', total: 10, concluidos: 10, slaNoPrazo: 10, custos: 2100 },
  { name: 'Mai/26', total: 14, concluidos: 14, slaNoPrazo: 14, custos: 3800 },
  { name: 'Jun/26', total: 18, concluidos: 12, slaNoPrazo: 9, custos: 5400 }
];

export const CHART_RESOLUTION_TIME_BY_PRIORITY = [
  { name: 'Crítica', tempoMedioMinutos: 45, slaMedioMinutos: 90 },
  { name: 'Alta', tempoMedioMinutos: 110, slaMedioMinutos: 210 },
  { name: 'Média', tempoMedioMinutos: 380, slaMedioMinutos: 480 },
  { name: 'Baixa', tempoMedioMinutos: 720, slaMedioMinutos: 1440 }
];

export const CHART_COST_BY_ASSET_TYPE = [
  { name: 'Compressores/Ar Cond.', planejado: 5000, realizado: 4800, preventiva: 3000 },
  { name: 'Gerador/Quadros Elét.', planejado: 3000, realizado: 3200, preventiva: 2500 },
  { name: 'Bombas/Poço Art.', planejado: 2000, realizado: 1800, preventiva: 1200 },
  { name: 'Infra/Cobertura/Portas', planejado: 4000, realizado: 4100, preventiva: 1000 },
  { name: 'Controle de Acesso/Câmeras', planejado: 1500, realizado: 1350, preventiva: 800 }
];

export const CHART_SLA_COMPLIANCE_TREND = [
  { name: 'Semana 21', conformidade: 94 },
  { name: 'Semana 22', conformidade: 95 },
  { name: 'Semana 23', conformidade: 91 },
  { name: 'Semana 24', conformidade: 96 },
  { name: 'Semana 25', conformidade: 89 }
];
