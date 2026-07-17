import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Wrench, Activity, ShieldAlert, Users, 
  Settings, LogOut, LayoutDashboard, History,
  PlusCircle, Search, HelpCircle, MonitorDot,
  ChevronLeft, ChevronRight, Menu, Building2, Layers
} from 'lucide-react';
import { Ticket, MaintenanceItem, OperationalBase, UrgencyConfig, AdminUser } from './types';
import { INITIAL_TICKETS, MAINTENANCE_ITEMS, INITIAL_BASES, INITIAL_URGENCY_CONFIGS } from './data';
import UserRequestForm from './components/UserRequestForm';
import UserTrackTicket from './components/UserTrackTicket';
import AdminDashboard from './components/AdminDashboard';
import AdminHistory from './components/AdminHistory';
import AdminLogin from './components/AdminLogin';
import AdminRegisters from './components/AdminRegisters';
import SetupPassword from './components/SetupPassword';
import ChangePasswordModal from './components/ChangePasswordModal';

export default function App() {
  // --- STATE FOR TICKETS ---
  const [tickets, setTickets] = useState<Ticket[]>(() => {
    const stored = localStorage.getItem('risel_facilities_tickets');
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {
        console.error('Erro ao decodificar tickets do localStorage', e);
      }
    }
    return INITIAL_TICKETS;
  });

  // --- STATE FOR REGISTERS / CADASTROS ---
  const [maintenanceItems, setMaintenanceItems] = useState<MaintenanceItem[]>(() => {
    const stored = localStorage.getItem('risel_facilities_maintenance_items');
    if (stored) {
      try { return JSON.parse(stored); } catch (e) { }
    }
    return MAINTENANCE_ITEMS;
  });

  const [operationalBases, setOperationalBases] = useState<OperationalBase[]>(() => {
    const stored = localStorage.getItem('risel_facilities_operational_bases');
    if (stored) {
      try { return JSON.parse(stored); } catch (e) { }
    }
    return INITIAL_BASES;
  });

  const [urgencyConfigs, setUrgencyConfigs] = useState<UrgencyConfig[]>(() => {
    const stored = localStorage.getItem('risel_facilities_urgency_configs');
    if (stored) {
      try { return JSON.parse(stored); } catch (e) { }
    }
    return INITIAL_URGENCY_CONFIGS;
  });

  const [adminUsers, setAdminUsers] = useState<AdminUser[]>(() => {
    const stored = localStorage.getItem('risel_facilities_admin_users');
    if (stored) {
      try { return JSON.parse(stored); } catch (e) { }
    }
    return [{ id: 'admin1', name: 'Gestor de Frota', sector: 'Facilities', phone: '11999999999', email: 'facilities@risel.com.br', active: true }];
  });

  // --- NAVIGATION & AUTH STATES ---
  const [profile, setProfile] = useState<'user' | 'admin'>('user');
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(() => {
    const stored = sessionStorage.getItem('risel_admin_auth');
    return stored === 'true';
  });
  const [showLoginScreen, setShowLoginScreen] = useState(false);

  // Dados do administrador autenticado
  const [loggedAdminName, setLoggedAdminName] = useState(() => {
    return sessionStorage.getItem('risel_admin_name') || 'Gestor de Frota';
  });
  const [loggedAdminEmail, setLoggedAdminEmail] = useState(() => {
    return sessionStorage.getItem('risel_admin_email') || 'facilities@risel.com.br';
  });

  // Modal de alteração de senha
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);

  // Token de convite por e-mail na URL
  const [inviteToken, setInviteToken] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('inviteToken');
    if (token) {
      setInviteToken(token);
    }
  }, []);

  const handleSetupPasswordSuccess = () => {
    const url = new URL(window.location.href);
    url.searchParams.delete('inviteToken');
    window.history.replaceState({}, '', url.toString());
    setInviteToken(null);
    setProfile('admin');
    setShowLoginScreen(true);
  };

  // Sub-navigation for user: 'create' or 'track'
  const [userTab, setUserTab] = useState<'create' | 'track'>('create');
  // Pass newly created ticket ID to the tracker
  const [activeTrackingId, setActiveTrackingId] = useState('');

  // Sub-navigation for admin: 'dashboard' | 'history' | 'registers'
  const [adminTab, setAdminTab] = useState<'dashboard' | 'history' | 'registers'>('dashboard');
  // State for active admin ticket editing
  const [activeAdminTicketId, setActiveAdminTicketId] = useState<string | null>(null);

  // Sidebar collapsed state
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (mobile) {
        setIsSidebarCollapsed(true);
      }
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Controle de carga inicial para evitar loops de sincronização com o banco
  const [isInitialLoadDone, setIsInitialLoadDone] = useState(false);

  // --- SYNCHRONIZE DATA TO LOCAL STORAGE & FIREBASE ---
  useEffect(() => {
    localStorage.setItem('risel_facilities_tickets', JSON.stringify(tickets));
  }, [tickets]);

  useEffect(() => {
    localStorage.setItem('risel_facilities_maintenance_items', JSON.stringify(maintenanceItems));
    if (isInitialLoadDone) {
      fetch('/api/maintenance-items/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: maintenanceItems })
      }).catch(err => console.error('Erro ao sincronizar itens com o Firebase:', err));
    }
  }, [maintenanceItems, isInitialLoadDone]);

  useEffect(() => {
    localStorage.setItem('risel_facilities_operational_bases', JSON.stringify(operationalBases));
    if (isInitialLoadDone) {
      fetch('/api/operational-bases/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bases: operationalBases })
      }).catch(err => console.error('Erro ao sincronizar bases com o Firebase:', err));
    }
  }, [operationalBases, isInitialLoadDone]);

  useEffect(() => {
    localStorage.setItem('risel_facilities_urgency_configs', JSON.stringify(urgencyConfigs));
    if (isInitialLoadDone) {
      fetch('/api/urgency-configs/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ configs: urgencyConfigs })
      }).catch(err => console.error('Erro ao sincronizar urgências com o Firebase:', err));
    }
  }, [urgencyConfigs, isInitialLoadDone]);

  useEffect(() => {
    localStorage.setItem('risel_facilities_admin_users', JSON.stringify(adminUsers));
    if (isInitialLoadDone) {
      fetch('/api/admin-users/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ users: adminUsers })
      }).catch(err => console.error('Erro ao sincronizar administradores com o Firebase:', err));
    }
  }, [adminUsers, isInitialLoadDone]);

  // Handle cross-component tracking action from the successful submit screen
  useEffect(() => {
    const handleTrackEvent = (e: Event) => {
      const customEvent = e as CustomEvent<string>;
      if (customEvent.detail) {
        setActiveTrackingId(customEvent.detail);
        setUserTab('track');
      }
    };
    window.addEventListener('track-ticket', handleTrackEvent);
    return () => window.removeEventListener('track-ticket', handleTrackEvent);
  }, []);

  // --- CARREGAMENTO INICIAL E SINCRONIZAÇÃO COM O FIREBASE / API ---
  useEffect(() => {
    const loadAllData = async () => {
      try {
        // 1. Busca os chamados
        const ticketsRes = await fetch('/api/tickets');
        if (ticketsRes.ok) {
          const ticketsData = await ticketsRes.json();
          // Verifica se o Firebase está configurado para sabermos se devemos limpar chamados fictícios
          const statusRes = await fetch('/api/db-status');
          const statusData = await statusRes.json();
          const isDbActive = statusData.configured;

          if (isDbActive) {
            // Se o Firebase está ativo, usamos os dados reais do banco. 
            // Se o banco estiver vazio, iniciamos com vazio [] para começar do zero com dados reais!
            setTickets(ticketsData || []);
          } else {
            // Se o Firebase não está ativo, usamos o localStorage ou fallback comum
            if (Array.isArray(ticketsData) && ticketsData.length > 0) {
              setTickets(ticketsData);
            }
          }
        }

        // 2. Busca Itens de Manutenção
        const itemsRes = await fetch('/api/maintenance-items');
        if (itemsRes.ok) {
          const itemsData = await itemsRes.json();
          if (Array.isArray(itemsData) && itemsData.length > 0) {
            setMaintenanceItems(itemsData);
          } else {
            // Sincroniza dados padrão no primeiro acesso se o banco estiver vazio para manter o app funcional
            fetch('/api/maintenance-items/sync', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ items: maintenanceItems })
            }).catch(e => console.error(e));
          }
        }

        // 3. Busca Bases Operacionais
        const basesRes = await fetch('/api/operational-bases');
        if (basesRes.ok) {
          const basesData = await basesRes.json();
          if (Array.isArray(basesData) && basesData.length > 0) {
            setOperationalBases(basesData);
          } else {
            // Sincroniza dados padrão no primeiro acesso
            fetch('/api/operational-bases/sync', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ bases: operationalBases })
            }).catch(e => console.error(e));
          }
        }

        // 4. Busca Configurações de Urgência
        const urgencyRes = await fetch('/api/urgency-configs');
        if (urgencyRes.ok) {
          const urgencyData = await urgencyRes.json();
          if (Array.isArray(urgencyData) && urgencyData.length > 0) {
            setUrgencyConfigs(urgencyData);
          } else {
            // Sincroniza dados padrão no primeiro acesso
            fetch('/api/urgency-configs/sync', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ configs: urgencyConfigs })
            }).catch(e => console.error(e));
          }
        }

        // 5. Busca Administradores
        const adminsRes = await fetch('/api/admin-users');
        if (adminsRes.ok) {
          const adminsData = await adminsRes.json();
          if (Array.isArray(adminsData) && adminsData.length > 0) {
            setAdminUsers(adminsData);
          } else {
            // Sincroniza dados padrão no primeiro acesso
            fetch('/api/admin-users/sync', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ users: adminUsers })
            }).catch(e => console.error(e));
          }
        }

      } catch (err) {
        console.error("Erro no carregamento de dados do Firebase:", err);
      } finally {
        setIsInitialLoadDone(true);
      }
    };

    loadAllData();
  }, []);

  // --- ACTIONS ---
  const handleAddTicket = (newTicketData: Omit<Ticket, 'id' | 'createdAt' | 'updatedAt' | 'isSlaViolated'>): string => {
    const year = new Date().getFullYear();
    const sequence = String(tickets.length + 1).padStart(3, '0');
    const newId = `CHA-${year}-${sequence}`;

    const newTicket: Ticket = {
      ...newTicketData,
      id: newId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isSlaViolated: false
    };

    // Atualiza localmente imediatamente para dar feedback rápido
    setTickets(prev => {
      const updated = [newTicket, ...prev];
      localStorage.setItem('risel_facilities_tickets', JSON.stringify(updated));
      return updated;
    });

    // Envia para o banco de dados via API do backend
    fetch('/api/tickets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ticket: newTicket })
    })
    .then(() => {
      // Envia e-mail de confirmação assincronamente ao criar com sucesso
      return fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticket: newTicket, isUpdate: false })
      });
    })
    .catch(err => console.error('Erro ao registrar chamado no backend:', err));

    return newId;
  };

  const handleUpdateTicket = (updatedTicket: Ticket) => {
    const previousTicket = tickets.find(t => t.id === updatedTicket.id);
    const statusChanged = previousTicket ? previousTicket.status !== updatedTicket.status : false;

    // Atualiza localmente
    setTickets(prev => {
      const updated = prev.map(t => t.id === updatedTicket.id ? updatedTicket : t);
      localStorage.setItem('risel_facilities_tickets', JSON.stringify(updated));
      return updated;
    });

    // Envia atualização ao banco de dados via API do backend
    fetch(`/api/tickets/${updatedTicket.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ticket: updatedTicket })
    })
    .then(() => {
      // Se houve mudança de status, dispara e-mail de atualização
      if (statusChanged) {
        fetch('/api/send-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ticket: updatedTicket,
            isUpdate: true,
            updateMessage: `O status do seu chamado ${updatedTicket.id} foi atualizado para: "${updatedTicket.status}".`
          })
        }).catch(err => console.error('Erro ao enviar e-mail de atualização:', err));
      }
    })
    .catch(err => console.error('Erro ao atualizar chamado no backend:', err));
  };

  const handleDeleteTicket = (ticketId: string) => {
    // 1. Atualiza o estado localmente imediatamente para dar feedback rápido
    setTickets(prev => {
      const updated = prev.filter(t => t.id !== ticketId);
      localStorage.setItem('risel_facilities_tickets', JSON.stringify(updated));
      return updated;
    });

    // 2. Envia a requisição de exclusão para o backend
    fetch(`/api/tickets/${ticketId}`, {
      method: 'DELETE'
    })
    .catch(err => console.error('Erro ao excluir chamado no backend:', err));
  };

  const handleResetTickets = () => {
    // 1. Limpa o local storage e o estado local imediatamente
    localStorage.removeItem('risel_facilities_tickets');
    setTickets([]);

    // 2. Envia a requisição de reset geral para o backend
    fetch('/api/tickets/reset', {
      method: 'POST'
    })
    .catch(err => console.error('Erro ao resetar chamados no backend:', err));
  };

  const handleRateTicket = (id: string, rating: number, feedback: string) => {
    const originalTicket = tickets.find(t => t.id === id);
    if (!originalTicket) return;

    const updatedTicket = {
      ...originalTicket,
      satisfactionRating: rating,
      feedbackText: feedback,
      updatedAt: new Date().toISOString()
    };

    // Atualiza localmente
    setTickets(prev => prev.map(t => t.id === id ? updatedTicket : t));

    // Envia atualização de feedback ao banco via API
    fetch(`/api/tickets/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ticket: updatedTicket })
    }).catch(err => console.error('Erro ao salvar avaliação do chamado:', err));
  };

  const handleProfileChange = (targetProfile: 'user' | 'admin') => {
    if (targetProfile === 'admin') {
      if (isAdminAuthenticated) {
        setProfile('admin');
        setShowLoginScreen(false);
      } else {
        setShowLoginScreen(true);
      }
    } else {
      setProfile('user');
      setShowLoginScreen(false);
    }
  };

  const handleLoginSuccess = (name: string, email: string) => {
    setIsAdminAuthenticated(true);
    setLoggedAdminName(name);
    setLoggedAdminEmail(email);
    sessionStorage.setItem('risel_admin_auth', 'true');
    sessionStorage.setItem('risel_admin_name', name);
    sessionStorage.setItem('risel_admin_email', email);
    setProfile('admin');
    setShowLoginScreen(false);
  };

  const handleAdminLogout = () => {
    setIsAdminAuthenticated(false);
    setLoggedAdminName('Gestor de Frota');
    setLoggedAdminEmail('facilities@risel.com.br');
    sessionStorage.removeItem('risel_admin_auth');
    sessionStorage.removeItem('risel_admin_name');
    sessionStorage.removeItem('risel_admin_email');
    setProfile('user');
  };

  if (inviteToken) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 relative overflow-hidden">
        {/* Imagem de Fundo Discreta do Sistema (Caminhão) */}
        <div 
          className="absolute inset-0 opacity-[0.035] bg-cover bg-center pointer-events-none z-0" 
          style={{ backgroundImage: `url('https://i.ibb.co/Z64d6VF9/c-AMINH-O.jpg')` }}
        />
        <SetupPassword token={inviteToken} onSuccess={handleSetupPasswordSuccess} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50 text-slate-800 font-sans flex flex-col antialiased relative overflow-hidden">
      
      {/* Imagem de Fundo Discreta do Sistema (Caminhão) */}
      <div 
        className="absolute inset-0 opacity-[0.035] bg-cover bg-center pointer-events-none z-0" 
        style={{ backgroundImage: `url('https://i.ibb.co/Z64d6VF9/c-AMINH-O.jpg')` }}
      />

      {/* RENDER PRINCIPAL DO LAYOUT */}
      {profile === 'admin' && isAdminAuthenticated ? (
        
        <div className="flex h-screen overflow-hidden z-10 relative">
          
          {/* Sidebar Backdrop for Mobile */}
          {isMobile && !isSidebarCollapsed && (
            <div 
              onClick={() => setIsSidebarCollapsed(true)}
              className="fixed inset-0 bg-black/50 z-40 backdrop-blur-xs transition-opacity duration-200"
            />
          )}

          {/* Sidebar */}
          <motion.aside 
            animate={{ 
              width: isMobile ? 260 : (isSidebarCollapsed ? 80 : 260),
              x: isMobile && isSidebarCollapsed ? -260 : 0
            }}
            transition={{ type: 'spring', damping: 22, stiffness: 180 }}
            className="bg-risel-blue text-white flex flex-col justify-between border-r border-slate-900 shrink-0 h-screen fixed inset-y-0 left-0 z-50"
          >
            {/* Top Sidebar */}
            <div className="flex flex-col h-full">
              {/* Header da Sidebar com Botão de recolher/expandir mais intuitivo */}
              <div className="p-4 flex items-center justify-between border-b border-white/10">
                {!isSidebarCollapsed && (
                  <div className="flex items-center gap-2">
                    <div className="bg-white/10 p-1.5 rounded-lg border border-white/10 shrink-0">
                      <Wrench className="w-5 h-5 text-risel-yellow" />
                    </div>
                    <div>
                      <span className="text-sm font-bold tracking-tight font-display text-white">RISEL FACILITIES</span>
                      <span className="text-[9px] text-risel-green block font-bold leading-none uppercase tracking-widest mt-0.5">Admin Central</span>
                    </div>
                  </div>
                )}
                {isSidebarCollapsed && (
                  <div className="mx-auto bg-white/10 p-2 rounded-xl border border-white/10">
                    <Wrench className="w-5 h-5 text-risel-yellow" />
                  </div>
                )}
                <button
                  onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                  className="p-1.5 hover:bg-white/10 rounded-lg text-slate-300 hover:text-white transition cursor-pointer shrink-0"
                >
                  {isSidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
                </button>
              </div>

              {/* Foto de Perfil do Admin */}
              <div className={`p-4 border-b border-white/5 flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-3'}`}>
                <img 
                  src="https://i.ibb.co/My6STcDv/71144827-2525571747712417-6231227587708846080-n.jpg" 
                  alt="Admin Profile" 
                  className="w-10 h-10 rounded-full object-cover border-2 border-risel-yellow shrink-0 shadow-md"
                  referrerPolicy="no-referrer"
                />
                {!isSidebarCollapsed && (
                  <div className="overflow-hidden flex-1" id="admin-sidebar-profile-info">
                    <span className="text-xs font-bold block text-white truncate">
                      {loggedAdminName}
                    </span>
                    <span className="text-[10px] text-slate-300 block truncate">
                      {loggedAdminEmail}
                    </span>
                    <button
                      onClick={() => setIsChangePasswordOpen(true)}
                      className="text-[9px] text-risel-yellow hover:underline block font-semibold text-left mt-0.5 cursor-pointer"
                    >
                      Alterar Senha
                    </button>
                  </div>
                )}
              </div>

              {/* Links de Menu */}
              <nav className="p-3 space-y-1.5 mt-4 flex-1">
                <button
                  onClick={() => setAdminTab('dashboard')}
                  className={`w-full flex items-center p-3 rounded-xl text-xs font-bold transition-all duration-150 cursor-pointer ${
                    adminTab === 'dashboard'
                      ? 'bg-white/15 text-risel-yellow border-l-4 border-risel-yellow font-bold shadow-xs'
                      : 'text-slate-300 hover:bg-white/5 hover:text-white'
                  } ${isSidebarCollapsed ? 'justify-center' : 'gap-3'}`}
                  title="Painel de Status"
                >
                  <LayoutDashboard className="w-4.5 h-4.5 shrink-0" />
                  {!isSidebarCollapsed && <span>Painel de Status</span>}
                </button>
                <button
                  onClick={() => setAdminTab('history')}
                  className={`w-full flex items-center p-3 rounded-xl text-xs font-bold transition-all duration-150 cursor-pointer ${
                    adminTab === 'history'
                      ? 'bg-white/15 text-risel-yellow border-l-4 border-risel-yellow font-bold shadow-xs'
                      : 'text-slate-300 hover:bg-white/5 hover:text-white'
                  } ${isSidebarCollapsed ? 'justify-center' : 'gap-3'}`}
                  title="Histórico de Chamados"
                >
                  <History className="w-4.5 h-4.5 shrink-0" />
                  {!isSidebarCollapsed && <span>Histórico de Chamados</span>}
                </button>
                <button
                  onClick={() => setAdminTab('registers')}
                  className={`w-full flex items-center p-3 rounded-xl text-xs font-bold transition-all duration-150 cursor-pointer ${
                    adminTab === 'registers'
                      ? 'bg-white/15 text-risel-yellow border-l-4 border-risel-yellow font-bold shadow-xs'
                      : 'text-slate-300 hover:bg-white/5 hover:text-white'
                  } ${isSidebarCollapsed ? 'justify-center' : 'gap-3'}`}
                  title="Menu de Cadastros"
                >
                  <Settings className="w-4.5 h-4.5 shrink-0" />
                  {!isSidebarCollapsed && <span>Menu de Cadastros</span>}
                </button>
              </nav>

              {/* Bottom Sidebar */}
              <div className="p-3 space-y-3">
                <button
                  onClick={handleAdminLogout}
                  className={`w-full flex items-center p-3 rounded-xl text-xs font-bold text-rose-300 hover:bg-rose-950/40 hover:text-rose-100 transition duration-150 cursor-pointer ${
                    isSidebarCollapsed ? 'justify-center' : 'gap-3'
                  }`}
                  title="Sair do Painel Admin"
                >
                  <LogOut className="w-4.5 h-4.5 shrink-0 text-rose-400" />
                  {!isSidebarCollapsed && <span>Sair do Admin</span>}
                </button>
              </div>
            </div>
          </motion.aside>

          {/* Área de Conteúdo Principal */}
          <motion.div 
            animate={{ marginLeft: isMobile ? 0 : (isSidebarCollapsed ? 80 : 260) }}
            className="flex-1 flex flex-col h-screen overflow-hidden bg-slate-50"
          >
            {/* Header Interno do Admin */}
            <header className="bg-white border-b border-slate-200/60 px-4 md:px-6 py-4 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                {isMobile && (
                  <button 
                    onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                    className="p-2 mr-1 bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-700 cursor-pointer"
                  >
                    <Menu className="w-5 h-5 text-risel-blue" />
                  </button>
                )}
                <h1 className="text-sm md:text-lg font-bold font-display text-slate-800 uppercase tracking-tight">
                  {adminTab === 'dashboard' && 'Painel Central'}
                  {adminTab === 'history' && 'Histórico Geral'}
                  {adminTab === 'registers' && 'Gerenciador de Cadastros'}
                </h1>
                <span className="hidden sm:inline bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded text-[10px] uppercase border border-emerald-100">
                  Sessão Segura Ativa
                </span>
              </div>
            </header>

            {/* Área Rolável de Trabalho */}
            <main className="flex-1 overflow-y-auto p-6 space-y-6">
              <AnimatePresence mode="wait">
                <motion.div
                  key={adminTab}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.15 }}
                >
                  {adminTab === 'dashboard' && (
                    <AdminDashboard 
                      tickets={tickets} 
                      onEditTicket={(ticketId) => {
                        setActiveAdminTicketId(ticketId);
                        setAdminTab('history');
                      }}
                    />
                  )}
                  {adminTab === 'history' && (
                    <AdminHistory 
                      tickets={tickets} 
                      onUpdateTicket={handleUpdateTicket} 
                      onDeleteTicket={handleDeleteTicket}
                      adminUsers={adminUsers}
                      initialSelectedTicketId={activeAdminTicketId}
                      onCloseDetail={() => setActiveAdminTicketId(null)}
                    />
                  )}
                  {adminTab === 'registers' && (
                    <AdminRegisters 
                      maintenanceItems={maintenanceItems}
                      setMaintenanceItems={setMaintenanceItems}
                      operationalBases={operationalBases}
                      setOperationalBases={setOperationalBases}
                      urgencyConfigs={urgencyConfigs}
                      setUrgencyConfigs={setUrgencyConfigs}
                      adminUsers={adminUsers}
                      setAdminUsers={setAdminUsers}
                      onResetTickets={handleResetTickets}
                    />
                  )}
                </motion.div>
              </AnimatePresence>
            </main>
          </motion.div>

        </div>

      ) : (

        // --- LAYOUT DO SOLICITANTE / PÁGINA PÚBLICA ---
        <div className="flex-1 flex flex-col z-10">
          
          {/* Cabeçalho Principal Integrado com a Risel */}
          <header className="bg-white border-b border-slate-100 shadow-sm sticky top-0 z-30 shrink-0">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col md:flex-row justify-between items-center gap-4">
              
              {/* Logo Risel e Facilities */}
              <div className="flex items-center gap-3">
                <div className="bg-risel-blue text-white p-2.5 rounded-xl flex items-center justify-center shadow-sm shrink-0">
                  <Wrench className="w-5 h-5 text-risel-yellow" />
                </div>
                <div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-xl font-bold font-display tracking-tight text-risel-blue">RISEL</span>
                    <span className="text-xs font-bold uppercase tracking-widest text-[#009639]">Facilities</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-medium block uppercase tracking-wide leading-none">Gestão Predial & Manutenção</span>
                </div>
              </div>

              {/* Seletor de Perfil Elegante para o Protótipo com Imagem do Usuário no lugar de Engrenagem */}
              <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200/80 shrink-0">
                <button
                  onClick={() => handleProfileChange('user')}
                  className={`px-4 py-2 rounded-lg text-xs font-semibold transition flex items-center gap-2 cursor-pointer ${
                    profile === 'user' && !showLoginScreen
                      ? 'bg-white text-risel-blue shadow-sm' 
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Users className="w-3.5 h-3.5 text-risel-green" />
                  <span>Área do Solicitante</span>
                </button>
                <button
                  onClick={() => handleProfileChange('admin')}
                  className={`px-4 py-2 rounded-lg text-xs font-semibold transition flex items-center gap-2 cursor-pointer ${
                    profile === 'admin' || showLoginScreen
                      ? 'bg-white text-risel-blue shadow-sm' 
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                  id="switch-to-admin-btn"
                >
                  <img 
                    src="https://i.ibb.co/My6STcDv/71144827-2525571747712417-6231227587708846080-n.jpg" 
                    alt="Admin Icon" 
                    className="w-4 h-4 rounded-full object-cover border border-slate-300 shrink-0"
                    referrerPolicy="no-referrer"
                  />
                  <span>Acesso Admin</span>
                </button>
              </div>

            </div>
          </header>

          {/* Conteúdo Principal com Abas de Navegação */}
          <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col gap-6">
            
            {showLoginScreen ? (
              // --- TELA DE LOGIN DO ADMIN ---
              <AdminLogin 
                onLoginSuccess={handleLoginSuccess}
                onCancel={() => {
                  setShowLoginScreen(false);
                  setProfile('user');
                }}
              />
            ) : (
              // --- CONTEÚDO NORMAL DO SOLICITANTE ---
              <>
                {/* Sub-navegação baseada no perfil ativo */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-200 pb-2 gap-4 shrink-0">
                  
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setUserTab('create');
                        setActiveTrackingId('');
                      }}
                      className={`px-4 py-2 text-sm font-semibold border-b-2 transition flex items-center gap-2 cursor-pointer ${
                        userTab === 'create'
                          ? 'border-risel-blue text-risel-blue font-bold'
                          : 'border-transparent text-slate-400 hover:text-slate-600'
                      }`}
                    >
                      <PlusCircle className="w-4 h-4" />
                      <span>Abrir Nova Solicitação</span>
                    </button>
                    <button
                      onClick={() => setUserTab('track')}
                      className={`px-4 py-2 text-sm font-semibold border-b-2 transition flex items-center gap-2 cursor-pointer ${
                        userTab === 'track'
                          ? 'border-risel-blue text-risel-blue font-bold'
                          : 'border-transparent text-slate-400 hover:text-slate-600'
                      }`}
                    >
                      <Search className="w-4 h-4" />
                      <span>Consultar Status</span>
                    </button>
                  </div>

                  {/* Banner de Status Rápido para Apoio Preditivo */}
                  <div className="text-right text-xs text-slate-400">
                    <span>Não é necessário login para abrir chamados</span>
                  </div>

                </div>

                {/* Visualização de Telas com Transições */}
                <div className="flex-1">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={`${profile}-${userTab}`}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.15 }}
                      className="h-full"
                    >
                      {userTab === 'create' ? (
                        <UserRequestForm 
                          onSubmitTicket={handleAddTicket} 
                          maintenanceItems={maintenanceItems}
                          operationalBases={operationalBases}
                          urgencyConfigs={urgencyConfigs}
                        />
                      ) : (
                        <UserTrackTicket 
                          tickets={tickets} 
                          onRateTicket={handleRateTicket}
                          initialSearchCode={activeTrackingId}
                        />
                      )}
                    </motion.div>
                  </AnimatePresence>
                </div>
              </>
            )}

          </main>

          {/* Rodapé Corporativo e Informações de Integração */}
          <footer className="text-slate-400 py-6 mt-12 shrink-0 z-10 relative text-center text-xs bg-white/40 border-t border-slate-100 backdrop-blur-xs">
            <p>&copy; {new Date().getFullYear()} Risel Facilities. Todos os direitos reservados.</p>
          </footer>

        </div>
      )}

      <ChangePasswordModal 
        email={loggedAdminEmail} 
        isOpen={isChangePasswordOpen} 
        onClose={() => setIsChangePasswordOpen(false)} 
      />
    </div>
  );
}
