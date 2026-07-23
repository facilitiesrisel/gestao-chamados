export type PriorityType = 'Baixa' | 'Média' | 'Alta' | 'Crítica';

export type StatusType = 'Novo' | 'Em Análise' | 'Em Atendimento' | 'Aguardando Peça' | 'Concluído' | 'Cancelado';

export interface MaintenanceItem {
  id: string;
  name: string;
  category: string;
  defaultSlaDays: number;
  descriptionPlaceholder: string;
  iconName: string;
  subitems: string[];
  active: boolean;
  subitemSlas?: Record<string, number>;
  assignedTechnicianId?: string;
}

export interface Ticket {
  id: string;
  requesterName: string;
  requesterEmail: string;
  requesterPhone: string;
  category: string;
  subitem: string;
  operationalBase: string;
  location: string;
  description: string;
  priority: PriorityType;
  status: StatusType;
  createdAt: string;
  updatedAt: string;
  slaDays: number;
  slaTargetDate: string;
  cost: number;
  assignedTechnician?: string;
  adminNotes?: string;
  satisfactionRating?: number;
  feedbackText?: string;
  isSlaViolated: boolean;
  photos?: string[];
}

export interface OperationalBase {
  id: string;
  name: string;
  active: boolean;
  establishment?: string;
}

export interface UrgencyConfig {
  id: string;
  priority: PriorityType;
  defaultSlaDays: number;
  active: boolean;
}

export interface MaintenanceSlaConfig {
  category: string;
  days: number;
  description: string;
}

export interface AdminUser {
  id: string;
  name: string;
  sector: string;
  phone: string;
  email: string;
  active: boolean;
}

