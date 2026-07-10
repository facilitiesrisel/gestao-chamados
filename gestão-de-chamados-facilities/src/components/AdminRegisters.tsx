import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Building2, Layers, Clock, Plus, Trash2, Edit2, Check, X, ToggleLeft, ToggleRight, 
  Wind, Zap, Droplet, Hammer, ArrowUpDown, ShieldAlert, Trash, AlertTriangle, Play, Users,
  Key, Wifi, Paintbrush, Wrench, Flame, Plug, HardHat, Laptop, Phone, Sun, Car, Leaf, Search,
  Database, RefreshCw, Server, Mail, Send
} from 'lucide-react';
import { MaintenanceItem, OperationalBase, UrgencyConfig, PriorityType, AdminUser } from '../types';

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

export const ICON_GALLERY = [
  { name: 'Wind', label: 'Climatização / Ar Condicionado', tags: ['climatizacao', 'ar', 'condicionado', 'vento', 'frio', 'calor', 'aquecedor', 'wind', 'clima', 'refrigeracao'] },
  { name: 'Zap', label: 'Elétrica / Energia', tags: ['eletrica', 'energia', 'luz', 'tomada', 'raio', 'zap', 'disjuntor', 'fio', 'tensao'] },
  { name: 'Droplet', label: 'Hidráulica / Água', tags: ['hidraulica', 'agua', 'vazamento', 'cano', 'torneira', 'gota', 'droplet', 'esgoto', 'bomba'] },
  { name: 'Hammer', label: 'Civil / Reparos', tags: ['civil', 'obra', 'reparo', 'martelo', 'hammer', 'alvenaria', 'parede', 'reforma', 'porta', 'janela'] },
  { name: 'ArrowUpDown', label: 'Transporte / Elevador', tags: ['transporte', 'elevador', 'escada', 'subir', 'descer', 'arrow', 'up', 'down'] },
  { name: 'ShieldAlert', label: 'Segurança / Incêndio', tags: ['seguranca', 'incendio', 'alarme', 'extintor', 'shield', 'alert', 'camera', 'perigo'] },
  { name: 'Trash2', label: 'Limpeza / Resíduos', tags: ['limpeza', 'lixo', 'residuo', 'trash', 'descarte', 'jardinagem', 'conservacao'] },
  { name: 'Key', label: 'Controle de Acesso / Chaves', tags: ['chave', 'fechadura', 'acesso', 'portao', 'key', 'seguranca', 'tranca'] },
  { name: 'Wifi', label: 'Redes / Conectividade', tags: ['redes', 'conectividade', 'wifi', 'internet', 'sinal', 'ti', 'modem', 'roteador'] },
  { name: 'Paintbrush', label: 'Pintura / Acabamento', tags: ['pintura', 'pincel', 'paintbrush', 'parede', 'cor', 'acabamento', 'tinta'] },
  { name: 'Wrench', label: 'Equipamentos / Mecânica', tags: ['equipamento', 'mecanica', 'ferramenta', 'wrench', 'chave de fenda', 'maquina'] },
  { name: 'Flame', label: 'Fogo / Aquecimento', tags: ['fogo', 'aquecimento', 'caldeira', 'flame', 'gas', 'quente'] },
  { name: 'Plug', label: 'Tomadas / Aparelhos', tags: ['tomada', 'aparelho', 'plug', 'conector', 'eletrico'] },
  { name: 'HardHat', label: 'EPI / Obra', tags: ['epi', 'obra', 'capacete', 'hardhat', 'seguranca do trabalho'] },
  { name: 'Laptop', label: 'Tecnologia / TI', tags: ['tecnologia', 'ti', 'computador', 'notebook', 'laptop', 'sistema'] },
  { name: 'Phone', label: 'Telefonia / Interfone', tags: ['telefonia', 'interfone', 'comunicacao', 'phone', 'telefone', 'chamado'] },
  { name: 'Sun', label: 'Iluminação Externa / Solar', tags: ['iluminacao', 'externa', 'solar', 'sol', 'sun', 'poste', 'refletor'] },
  { name: 'Car', label: 'Garagem / Portões', tags: ['garagem', 'portao', 'carro', 'estacionamento', 'car', 'cancela'] },
  { name: 'Leaf', label: 'Jardinagem / Áreas Verdes', tags: ['jardinagem', 'jardim', 'verde', 'folha', 'leaf', 'planta', 'paisagismo'] }
];

interface AdminRegistersProps {
  maintenanceItems: MaintenanceItem[];
  setMaintenanceItems: React.Dispatch<React.SetStateAction<MaintenanceItem[]>>;
  operationalBases: OperationalBase[];
  setOperationalBases: React.Dispatch<React.SetStateAction<OperationalBase[]>>;
  urgencyConfigs: UrgencyConfig[];
  setUrgencyConfigs: React.Dispatch<React.SetStateAction<UrgencyConfig[]>>;
  adminUsers: AdminUser[];
  setAdminUsers: React.Dispatch<React.SetStateAction<AdminUser[]>>;
  onResetTickets: () => void;
}

type TabType = 'bases' | 'items' | 'urgency' | 'admins' | 'sistema';

export default function AdminRegisters({
  maintenanceItems,
  setMaintenanceItems,
  operationalBases,
  setOperationalBases,
  urgencyConfigs,
  setUrgencyConfigs,
  adminUsers,
  setAdminUsers,
  onResetTickets
}: AdminRegistersProps) {
  const [activeTab, setActiveTab] = useState<TabType>('items');
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [dbInfo, setDbInfo] = useState<{ configured: boolean; provider: string }>({ configured: false, provider: 'Verificando...' });

  const [testEmail, setTestEmail] = useState('');
  const [isTestingEmail, setIsTestingEmail] = useState(false);
  const [testEmailResult, setTestEmailResult] = useState<{ success: boolean; message: string; advice?: string } | null>(null);

  React.useEffect(() => {
    fetch('/api/db-status')
      .then(res => res.json())
      .then(data => setDbInfo(data))
      .catch(() => setDbInfo({ configured: false, provider: 'Erro ao conectar' }));
  }, [activeTab]);

  const handleTestEmail = (e: React.FormEvent) => {
    e.preventDefault();
    if (!testEmail) return;

    setIsTestingEmail(true);
    setTestEmailResult(null);

    fetch('/api/test-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail })
    })
      .then(async (res) => {
        const data = await res.json();
        if (res.ok) {
          setTestEmailResult({
            success: true,
            message: data.message || 'E-mail enviado com sucesso!'
          });
        } else {
          setTestEmailResult({
            success: false,
            message: data.error || 'Erro desconhecido ao enviar e-mail.',
            advice: data.advice
          });
        }
      })
      .catch((err) => {
        setTestEmailResult({
          success: false,
          message: 'Não foi possível se comunicar com o servidor: ' + err.message
        });
      })
      .finally(() => {
        setIsTestingEmail(false);
      });
  };

  // State for operational base forms
  const [newBaseName, setNewBaseName] = useState('');
  const [newBaseEstablishment, setNewBaseEstablishment] = useState('');
  const [editingBaseId, setEditingBaseId] = useState<string | null>(null);
  const [editingBaseName, setEditingBaseName] = useState('');
  const [editingBaseEstablishment, setEditingBaseEstablishment] = useState('');

  // State for urgency edit
  const [editingUrgencyId, setEditingUrgencyId] = useState<string | null>(null);
  const [editingUrgencySla, setEditingUrgencySla] = useState<number>(0);

  // State for maintenance item form
  const [newItemName, setNewItemName] = useState('');
  const [newItemCategory, setNewItemCategory] = useState('');
  const [newItemSla, setNewItemSla] = useState(4);
  const [newItemPlaceholder, setNewItemPlaceholder] = useState('');
  const [newItemIcon, setNewItemIcon] = useState('Hammer');
  const [newItemTechnician, setNewItemTechnician] = useState('');
  const [newSubitemName, setNewSubitemName] = useState('');
  const [newSubitemSla, setNewSubitemSla] = useState<string>('');
  const [selectedItemForSubitems, setSelectedItemForSubitems] = useState<string | null>(null);

  // States para novo admin
  const [newAdminName, setNewAdminName] = useState('');
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminPhone, setNewAdminPhone] = useState('');
  const [newAdminSector, setNewAdminSector] = useState('');

  // States para edição de admin
  const [editingAdminId, setEditingAdminId] = useState<string | null>(null);
  const [editingAdminName, setEditingAdminName] = useState('');
  const [editingAdminEmail, setEditingAdminEmail] = useState('');
  const [editingAdminPhone, setEditingAdminPhone] = useState('');
  const [editingAdminSector, setEditingAdminSector] = useState('');

  // States para edição de item predial
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editingItemName, setEditingItemName] = useState('');
  const [editingItemCategory, setEditingItemCategory] = useState('');
  const [editingItemSla, setEditingItemSla] = useState(0);
  const [editingItemIcon, setEditingItemIcon] = useState('Hammer');
  const [editingItemTechnician, setEditingItemTechnician] = useState('');

  // States para edição de subitem
  const [editingSubitemKey, setEditingSubitemKey] = useState<{ itemId: string; subitemName: string } | null>(null);
  const [editingSubitemNewName, setEditingSubitemNewName] = useState('');
  const [editingSubitemNewSla, setEditingSubitemNewSla] = useState('');

  // States para seletor de ícone com busca em português
  const [showIconSelectorForNew, setShowIconSelectorForNew] = useState(false);
  const [showIconSelectorForEditId, setShowIconSelectorForEditId] = useState<string | null>(null);
  const [iconSearchTerm, setIconSearchTerm] = useState('');

  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isSendingInvite, setIsSendingInvite] = useState(false);

  // Operational Base Actions
  const handleAddBase = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    if (!newBaseName.trim()) {
      setErrorMsg('O nome da Base Operacional é obrigatório.');
      return;
    }
    if (!newBaseEstablishment.trim()) {
      setErrorMsg('O Estabelecimento é obrigatório.');
      return;
    }
    if (operationalBases.some(b => b.name.toLowerCase() === newBaseName.trim().toLowerCase())) {
      setErrorMsg('Já existe uma Base Operacional com este nome.');
      return;
    }

    const newBase: OperationalBase = {
      id: 'base_' + Date.now(),
      name: newBaseName.trim(),
      active: true,
      establishment: newBaseEstablishment.trim()
    };

    setOperationalBases(prev => [...prev, newBase]);
    setNewBaseName('');
    setNewBaseEstablishment('');
  };

  const handleToggleBase = (id: string) => {
    setOperationalBases(prev => prev.map(b => b.id === id ? { ...b, active: !b.active } : b));
  };

  const handleStartEditBase = (base: OperationalBase) => {
    setEditingBaseId(base.id);
    setEditingBaseName(base.name);
    setEditingBaseEstablishment(base.establishment || '');
  };

  const handleSaveBaseName = (id: string) => {
    if (!editingBaseName.trim()) return;
    setOperationalBases(prev => prev.map(b => b.id === id ? { ...b, name: editingBaseName.trim(), establishment: editingBaseEstablishment.trim() } : b));
    setEditingBaseId(null);
  };

  // Urgency & SLA Actions
  const handleStartEditUrgency = (urg: UrgencyConfig) => {
    setEditingUrgencyId(urg.id);
    setEditingUrgencySla(urg.defaultSlaDays || 1);
  };

  const handleSaveUrgencySla = (id: string) => {
    if (editingUrgencySla <= 0) return;
    setUrgencyConfigs(prev => prev.map(u => u.id === id ? { ...u, defaultSlaDays: editingUrgencySla } : u));
    setEditingUrgencyId(null);
  };

  const handleToggleUrgency = (id: string) => {
    setUrgencyConfigs(prev => prev.map(u => u.id === id ? { ...u, active: !u.active } : u));
  };

  // Administradores Actions
  const handleAddAdmin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    
    const emailLower = newAdminEmail.trim().toLowerCase();
    
    if (!newAdminName.trim() || !emailLower) {
      setErrorMsg('Nome e E-mail são obrigatórios para cadastrar um administrador.');
      return;
    }
    
    // Validação obrigatória do domínio @risel.com.br
    if (!emailLower.endsWith('@risel.com.br')) {
      setErrorMsg('O e-mail do administrador deve pertencer obrigatoriamente ao domínio @risel.com.br');
      return;
    }
    
    if (adminUsers.some(u => u.email.toLowerCase() === emailLower)) {
      setErrorMsg('Já existe um administrador cadastrado com este e-mail.');
      return;
    }

    setIsSendingInvite(true);
    
    fetch('/api/admin/invite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: newAdminName.trim(),
        email: emailLower,
        phone: newAdminPhone.trim(),
        sector: newAdminSector.trim()
      })
    })
    .then(async (res) => {
      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessMsg(`Convite enviado com sucesso para ${emailLower}! Um e-mail foi disparado para que a pessoa cadastre a própria senha.`);
        // Adiciona à lista local o administrador criado na API
        if (data.user) {
          setAdminUsers(prev => [...prev, data.user]);
        }
        setNewAdminName('');
        setNewAdminEmail('');
        setNewAdminPhone('');
        setNewAdminSector('');
      } else {
        setErrorMsg(data.error || 'Erro ao enviar convite por e-mail.');
      }
    })
    .catch((err) => {
      setErrorMsg('Erro de comunicação com o servidor: ' + err.message);
    })
    .finally(() => {
      setIsSendingInvite(false);
    });
  };

  const handleToggleAdmin = (id: string) => {
    setErrorMsg('');
    setSuccessMsg('');
    const admin = adminUsers.find(u => u.id === id);
    if (admin && admin.email === 'deny.goncalves@risel.com.br') {
      setErrorMsg('Não é permitido desativar o Administrador Geral do sistema.');
      return;
    }
    setAdminUsers(prev => prev.map(u => u.id === id ? { ...u, active: !u.active } : u));
    setSuccessMsg(`Status do administrador ${admin?.name} alterado com sucesso.`);
  };

  const handleRemoveAdmin = (id: string) => {
    setErrorMsg('');
    setSuccessMsg('');
    const admin = adminUsers.find(u => u.id === id);
    if (admin && admin.email === 'deny.goncalves@risel.com.br') {
      setErrorMsg('Não é permitido excluir o Administrador Geral do sistema.');
      return;
    }
    if (window.confirm(`Tem certeza de que deseja excluir permanentemente o administrador "${admin?.name}"?`)) {
      setAdminUsers(prev => prev.filter(u => u.id !== id));
      setSuccessMsg('Administrador excluído com sucesso.');
    }
  };

  const handleStartEditAdmin = (admin: AdminUser) => {
    setEditingAdminId(admin.id);
    setEditingAdminName(admin.name);
    setEditingAdminEmail(admin.email);
    setEditingAdminPhone(admin.phone);
    setEditingAdminSector(admin.sector);
  };

  const handleSaveAdmin = (id: string) => {
    setErrorMsg('');
    setSuccessMsg('');
    const emailLower = editingAdminEmail.trim().toLowerCase();
    if (!editingAdminName.trim() || !emailLower) {
      setErrorMsg('Nome e E-mail são obrigatórios para o administrador.');
      return;
    }
    
    // Validação obrigatória do domínio @risel.com.br
    if (!emailLower.endsWith('@risel.com.br')) {
      setErrorMsg('O e-mail do administrador deve pertencer obrigatoriamente ao domínio @risel.com.br');
      return;
    }
    
    setAdminUsers(prev => prev.map(u => u.id === id ? {
      ...u,
      name: editingAdminName.trim(),
      email: emailLower,
      phone: editingAdminPhone.trim(),
      sector: editingAdminSector.trim()
    } : u));
    setEditingAdminId(null);
    setSuccessMsg('Cadastro atualizado com sucesso.');
  };

  // Maintenance Items & Subitems Actions
  const handleStartEditItem = (item: MaintenanceItem) => {
    setEditingItemId(item.id);
    setEditingItemName(item.name);
    setEditingItemCategory(item.category);
    setEditingItemSla(item.defaultSlaDays || 1);
    setEditingItemIcon(item.iconName);
    setEditingItemTechnician(item.assignedTechnicianId || '');
  };

  const handleSaveItem = (id: string) => {
    if (!editingItemName.trim() || !editingItemCategory.trim()) return;
    setMaintenanceItems(prev => prev.map(item => item.id === id ? {
      ...item,
      name: editingItemName.trim(),
      category: editingItemCategory.trim(),
      defaultSlaDays: editingItemSla,
      iconName: editingItemIcon,
      assignedTechnicianId: editingItemTechnician || undefined
    } : item));
    setEditingItemId(null);
  };

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    if (!newItemName.trim() || !newItemCategory.trim() || !newItemPlaceholder.trim()) {
      setErrorMsg('Preencha todos os campos obrigatórios da categoria.');
      return;
    }

    const newItem: MaintenanceItem = {
      id: 'item_' + Date.now(),
      name: newItemName.trim(),
      category: newItemCategory.trim(),
      defaultSlaDays: newItemSla,
      descriptionPlaceholder: newItemPlaceholder.trim(),
      iconName: newItemIcon,
      subitems: [],
      active: true,
      assignedTechnicianId: newItemTechnician || undefined
    };

    setMaintenanceItems(prev => [...prev, newItem]);
    setNewItemName('');
    setNewItemCategory('');
    setNewItemPlaceholder('');
    setNewItemSla(4);
    setNewItemTechnician('');
  };

  const handleToggleItem = (id: string) => {
    setMaintenanceItems(prev => prev.map(item => item.id === id ? { ...item, active: !item.active } : item));
  };

  const handleAddSubitem = (itemId: string) => {
    if (!newSubitemName.trim()) return;
    setMaintenanceItems(prev => prev.map(item => {
      if (item.id === itemId) {
        if (item.subitems.includes(newSubitemName.trim())) return item; // no duplicates
        const updatedSubitemSlas = { ...(item.subitemSlas || {}) };
        if (newSubitemSla && !isNaN(Number(newSubitemSla))) {
          updatedSubitemSlas[newSubitemName.trim()] = Number(newSubitemSla);
        }
        return {
          ...item,
          subitems: [...item.subitems, newSubitemName.trim()],
          subitemSlas: updatedSubitemSlas
        };
      }
      return item;
    }));
    setNewSubitemName('');
    setNewSubitemSla('');
  };

  const handleRemoveSubitem = (itemId: string, subitemToRemove: string) => {
    setMaintenanceItems(prev => prev.map(item => {
      if (item.id === itemId) {
        const updatedSubitemSlas = { ...(item.subitemSlas || {}) };
        delete updatedSubitemSlas[subitemToRemove];
        return {
          ...item,
          subitems: item.subitems.filter(s => s !== subitemToRemove),
          subitemSlas: updatedSubitemSlas
        };
      }
      return item;
    }));
  };

  const handleStartEditSubitem = (itemId: string, subitemName: string, currentSla?: number) => {
    setEditingSubitemKey({ itemId, subitemName });
    setEditingSubitemNewName(subitemName);
    setEditingSubitemNewSla(currentSla ? String(currentSla) : '');
  };

  const handleSaveSubitem = (itemId: string, oldSubitemName: string) => {
    if (!editingSubitemNewName.trim()) return;
    setMaintenanceItems(prev => prev.map(item => {
      if (item.id === itemId) {
        // Se o nome mudou e já existe esse novo nome, impedir duplicidade
        if (oldSubitemName !== editingSubitemNewName.trim() && item.subitems.includes(editingSubitemNewName.trim())) {
          return item;
        }

        const updatedSubitems = item.subitems.map(s => s === oldSubitemName ? editingSubitemNewName.trim() : s);
        const updatedSubitemSlas = { ...(item.subitemSlas || {}) };

        // Se mudou de nome, remove a chave antiga do SLA
        const oldSla = updatedSubitemSlas[oldSubitemName];
        if (oldSubitemName !== editingSubitemNewName.trim()) {
          delete updatedSubitemSlas[oldSubitemName];
        }

        if (editingSubitemNewSla && !isNaN(Number(editingSubitemNewSla))) {
          updatedSubitemSlas[editingSubitemNewName.trim()] = Number(editingSubitemNewSla);
        } else if (oldSla !== undefined && oldSubitemName !== editingSubitemNewName.trim()) {
          updatedSubitemSlas[editingSubitemNewName.trim()] = oldSla;
        }

        return {
          ...item,
          subitems: updatedSubitems,
          subitemSlas: updatedSubitemSlas
        };
      }
      return item;
    }));
    setEditingSubitemKey(null);
    setEditingSubitemNewName('');
    setEditingSubitemNewSla('');
  };

  const getFilteredIcons = (term: string) => {
    const cleanTerm = term.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    if (!cleanTerm) return ICON_GALLERY;
    return ICON_GALLERY.filter(icon => 
      icon.name.toLowerCase().includes(cleanTerm) ||
      icon.label.toLowerCase().includes(cleanTerm) ||
      icon.tags.some(tag => tag.includes(cleanTerm))
    );
  };

  const getIcon = (name: string) => {
    const props = { className: "w-5 h-5" };
    switch (name) {
      case 'Wind': return <Wind {...props} />;
      case 'Zap': return <Zap {...props} />;
      case 'Droplet': return <Droplet {...props} />;
      case 'Hammer': return <Hammer {...props} />;
      case 'ArrowUpDown': return <ArrowUpDown {...props} />;
      case 'ShieldAlert': return <ShieldAlert {...props} />;
      case 'Trash2': return <Trash2 {...props} />;
      case 'Key': return <Key {...props} />;
      case 'Wifi': return <Wifi {...props} />;
      case 'Paintbrush': return <Paintbrush {...props} />;
      case 'Wrench': return <Wrench {...props} />;
      case 'Flame': return <Flame {...props} />;
      case 'Plug': return <Plug {...props} />;
      case 'HardHat': return <HardHat {...props} />;
      case 'Laptop': return <Laptop {...props} />;
      case 'Phone': return <Phone {...props} />;
      case 'Sun': return <Sun {...props} />;
      case 'Car': return <Car {...props} />;
      case 'Leaf': return <Leaf {...props} />;
      default: return <Hammer {...props} />;
    }
  };

  const changeTab = (tab: TabType) => {
    setActiveTab(tab);
    setErrorMsg('');
    setSuccessMsg('');
  };

  return (
    <div className="bg-white rounded-2xl shadow-md border border-slate-100 overflow-hidden" id="admin-registers-container">
      {/* Header */}
      <div className="bg-slate-50 border-b border-slate-100 p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold font-display text-slate-800">Menu de Cadastros e Configurações</h2>
          <p className="text-xs text-slate-500 mt-1">Gerencie bases operacionais, itens prediais de manutenção, subitens de suporte e SLAs do sistema.</p>
        </div>

        {/* Abas */}
        <div className="flex bg-slate-200/60 p-1 rounded-xl border border-slate-200 shrink-0">
          <button
            onClick={() => changeTab('items')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'items' 
                ? 'bg-white text-risel-blue shadow-sm' 
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Itens & Subitens</span>
          </button>
          <button
            onClick={() => changeTab('bases')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'bases' 
                ? 'bg-white text-risel-blue shadow-sm' 
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Bases Operacionais</span>
          </button>
          <button
            onClick={() => changeTab('urgency')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'urgency' 
                ? 'bg-white text-risel-blue shadow-sm' 
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>SLA & Urgência</span>
          </button>
          <button
            onClick={() => changeTab('admins')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'admins' 
                ? 'bg-white text-risel-blue shadow-sm' 
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Admins</span>
          </button>
          <button
            onClick={() => changeTab('sistema')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'sistema' 
                ? 'bg-white text-risel-blue shadow-sm' 
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>Sistema</span>
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="mx-6 mt-6 bg-rose-50 border border-rose-100 text-rose-800 rounded-xl p-4 flex items-center gap-3 text-xs">
          <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="mx-6 mt-6 bg-emerald-50 border border-emerald-100 text-emerald-800 rounded-xl p-4 flex items-center gap-3 text-xs font-semibold">
          <Check className="w-5 h-5 text-emerald-500 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Content */}
      <div className="p-6">
        
        {/* TAB 1: ITENS E SUBITENS */}
        {activeTab === 'items' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Form de Nova Categoria */}
              <div className="lg:col-span-1 bg-slate-50 rounded-2xl border border-slate-200/60 p-5 space-y-4">
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide flex items-center gap-2">
                  <Plus className="w-4 h-4 text-risel-blue" />
                  <span>Nova Categoria</span>
                </h3>
                <form onSubmit={handleAddItem} className="space-y-3 text-xs">
                  <div>
                    <label className="font-semibold text-slate-600 block mb-1">Nome do Item Predial *</label>
                    <input 
                      type="text" 
                      required
                      placeholder="Ex: Ar Condicionado & HVAC"
                      value={newItemName}
                      onChange={(e) => setNewItemName(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 text-slate-800 focus:outline-none focus:border-risel-blue bg-white"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-slate-600 block mb-1">Nome da Categoria Curta *</label>
                    <input 
                      type="text" 
                      required
                      placeholder="Ex: Climatização"
                      value={newItemCategory}
                      onChange={(e) => setNewItemCategory(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 text-slate-800 focus:outline-none focus:border-risel-blue bg-white"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="font-semibold text-slate-600 block mb-1">SLA Padrão (Dias) *</label>
                      <input 
                        type="number" 
                        required
                        min={1}
                        value={newItemSla}
                        onChange={(e) => setNewItemSla(Number(e.target.value))}
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 text-slate-800 focus:outline-none focus:border-risel-blue bg-white font-mono"
                      />
                    </div>
                    <div>
                      <label className="font-semibold text-slate-600 block mb-1">Técnico Responsável</label>
                      <select 
                        value={newItemTechnician}
                        onChange={(e) => setNewItemTechnician(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 text-slate-800 focus:outline-none focus:border-risel-blue bg-white text-xs"
                      >
                        <option value="">-- Selecionar --</option>
                        {adminUsers.map(u => <option key={u.id} value={u.id}>{formatNameAndSurname(u.name)}</option>)}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="font-semibold text-slate-600 block mb-1">Ícone Visual</label>
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => {
                          setShowIconSelectorForNew(!showIconSelectorForNew);
                          setIconSearchTerm('');
                        }}
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 text-slate-800 focus:outline-none focus:border-risel-blue bg-white flex items-center justify-between text-left cursor-pointer hover:bg-slate-50 transition"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-risel-blue">{getIcon(newItemIcon)}</span>
                          <span>{ICON_GALLERY.find(i => i.name === newItemIcon)?.label || newItemIcon}</span>
                        </div>
                        <span className="text-slate-400 text-[10px]">Alterar</span>
                      </button>

                      {showIconSelectorForNew && (
                        <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl p-3 max-h-60 overflow-y-auto space-y-2 text-left">
                          <div className="relative flex items-center">
                            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 pointer-events-none" />
                            <input 
                              type="text"
                              placeholder="Buscar ícone (Ex: água, elétrica)..."
                              value={iconSearchTerm}
                              onChange={(e) => setIconSearchTerm(e.target.value)}
                              className="w-full pl-8 pr-3 py-1.5 rounded-md border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-risel-blue bg-white"
                            />
                          </div>
                          <div className="grid grid-cols-1 gap-1">
                            {getFilteredIcons(iconSearchTerm).length === 0 ? (
                              <span className="text-[11px] text-slate-400 italic text-center py-2 block">Nenhum ícone encontrado</span>
                            ) : (
                              getFilteredIcons(iconSearchTerm).map(icon => (
                                <button
                                  key={icon.name}
                                  type="button"
                                  onClick={() => {
                                    setNewItemIcon(icon.name);
                                    setShowIconSelectorForNew(false);
                                  }}
                                  className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center gap-2 text-xs transition cursor-pointer hover:bg-slate-50 ${
                                    newItemIcon === icon.name ? 'bg-blue-50/50 text-risel-blue font-semibold' : 'text-slate-700'
                                  }`}
                                >
                                  <span className={newItemIcon === icon.name ? 'text-risel-blue' : 'text-slate-500'}>
                                    {getIcon(icon.name)}
                                  </span>
                                  <span className="truncate">{icon.label}</span>
                                </button>
                              ))
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="font-semibold text-slate-600 block mb-1">Placeholder de Descrição *</label>
                    <textarea 
                      required
                      rows={2}
                      placeholder="Instruções para o solicitante preencher no formulário..."
                      value={newItemPlaceholder}
                      onChange={(e) => setNewItemPlaceholder(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 text-slate-800 focus:outline-none focus:border-risel-blue bg-white"
                    />
                  </div>

                  <button 
                    type="submit"
                    className="w-full bg-risel-blue hover:bg-opacity-95 text-white font-bold py-2.5 rounded-lg text-xs transition cursor-pointer"
                  >
                    Adicionar Categoria
                  </button>
                </form>
              </div>

              {/* Tabela de Categorias Cadastradas */}
              <div className="lg:col-span-2 space-y-4">
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide">Categorias Ativas & Subitens</h3>
                <div className="border border-slate-200 rounded-2xl overflow-hidden text-xs">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                      <tr>
                        <th className="px-4 py-3">Item Predial</th>
                        <th className="px-4 py-3">Categoria</th>
                        <th className="px-4 py-3 text-center">SLA Padrão</th>
                        <th className="px-4 py-3 text-center">Subitens</th>
                        <th className="px-4 py-3 text-right">Status / Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 text-slate-700">
                      {maintenanceItems.map((item) => (
                        <React.Fragment key={item.id}>
                          {editingItemId === item.id ? (
                            <tr className="bg-blue-50/40">
                              <td className="px-4 py-3" colSpan={1}>
                                <div className="space-y-1">
                                  <input 
                                    type="text" 
                                    value={editingItemName}
                                    onChange={(e) => setEditingItemName(e.target.value)}
                                    placeholder="Nome do Item"
                                    className="px-2 py-1.5 text-xs rounded border border-slate-200 focus:outline-none focus:border-risel-blue bg-white font-semibold w-full"
                                  />
                                  <div className="relative">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setShowIconSelectorForEditId(showIconSelectorForEditId === item.id ? null : item.id);
                                        setIconSearchTerm('');
                                      }}
                                      className="px-2 py-1 text-[11px] rounded border border-slate-200 bg-white w-full flex items-center justify-between text-left cursor-pointer hover:bg-slate-50 transition"
                                    >
                                      <span className="text-risel-blue shrink-0 mr-1">{getIcon(editingItemIcon)}</span>
                                      <span className="truncate text-[10px]">{ICON_GALLERY.find(i => i.name === editingItemIcon)?.label.split(' / ')[0] || editingItemIcon}</span>
                                    </button>

                                    {showIconSelectorForEditId === item.id && (
                                      <div className="absolute top-full left-0 z-50 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl p-2.5 w-52 max-h-52 overflow-y-auto space-y-1.5 text-left">
                                        <div className="relative flex items-center">
                                          <Search className="w-3 h-3 text-slate-400 absolute left-2 pointer-events-none" />
                                          <input 
                                            type="text"
                                            placeholder="Buscar ícone..."
                                            value={iconSearchTerm}
                                            onChange={(e) => setIconSearchTerm(e.target.value)}
                                            className="w-full pl-6 pr-2 py-1 rounded-md border border-slate-200 text-[10px] text-slate-800 focus:outline-none focus:border-risel-blue bg-white"
                                          />
                                        </div>
                                        <div className="grid grid-cols-1 gap-0.5">
                                          {getFilteredIcons(iconSearchTerm).length === 0 ? (
                                            <span className="text-[10px] text-slate-400 italic text-center py-1.5 block">Sem ícones</span>
                                          ) : (
                                            getFilteredIcons(iconSearchTerm).map(icon => (
                                              <button
                                                key={icon.name}
                                                type="button"
                                                onClick={() => {
                                                  setEditingItemIcon(icon.name);
                                                  setShowIconSelectorForEditId(null);
                                                }}
                                                className={`w-full text-left px-2 py-1 rounded-md flex items-center gap-1.5 text-[10px] transition cursor-pointer hover:bg-slate-50 ${
                                                  editingItemIcon === icon.name ? 'bg-blue-50 text-risel-blue font-semibold' : 'text-slate-700'
                                                }`}
                                              >
                                                <span className={editingItemIcon === icon.name ? 'text-risel-blue' : 'text-slate-500'}>
                                                  {getIcon(icon.name)}
                                                </span>
                                                <span className="truncate">{icon.label.split(' / ')[0]}</span>
                                              </button>
                                            ))
                                          )}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <input 
                                  type="text" 
                                  value={editingItemCategory}
                                  onChange={(e) => setEditingItemCategory(e.target.value)}
                                  placeholder="Categoria"
                                  className="px-2 py-1.5 text-xs rounded border border-slate-200 focus:outline-none focus:border-risel-blue bg-white font-medium w-full"
                                />
                              </td>
                              <td className="px-4 py-3 text-center">
                                <div className="flex flex-col gap-1 items-center">
                                  <input 
                                    type="number" 
                                    min={1}
                                    value={editingItemSla}
                                    onChange={(e) => setEditingItemSla(Number(e.target.value))}
                                    className="px-2 py-1 text-xs rounded border border-slate-200 focus:outline-none focus:border-risel-blue bg-white font-mono w-16 text-center"
                                  />
                                  <span className="text-[9px] text-slate-500 font-semibold">dias</span>
                                </div>
                              </td>
                              <td className="px-4 py-3 text-center">
                                <select 
                                  value={editingItemTechnician}
                                  onChange={(e) => setEditingItemTechnician(e.target.value)}
                                  className="px-2 py-1 text-[11px] rounded border border-slate-200 focus:outline-none focus:border-risel-blue bg-white w-full text-slate-800"
                                >
                                  <option value="">-- Sem Técnico --</option>
                                  {adminUsers.map(u => <option key={u.id} value={u.id}>{formatNameAndSurname(u.name)}</option>)}
                                </select>
                              </td>
                              <td className="px-4 py-3 text-right">
                                <div className="flex justify-end items-center gap-1.5">
                                  <button 
                                    onClick={() => handleSaveItem(item.id)}
                                    className="p-1.5 hover:bg-emerald-100 text-emerald-600 rounded transition cursor-pointer"
                                    title="Salvar"
                                  >
                                    <Check className="w-4 h-4" />
                                  </button>
                                  <button 
                                    onClick={() => setEditingItemId(null)}
                                    className="p-1.5 hover:bg-rose-100 text-rose-500 rounded transition cursor-pointer"
                                    title="Cancelar"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ) : (
                            <tr className={`hover:bg-slate-55/40 transition ${!item.active ? 'bg-slate-100/40 text-slate-400' : ''}`}>
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-2">
                                  <span className={item.active ? 'text-risel-blue' : 'text-slate-400'}>
                                    {getIcon(item.iconName)}
                                  </span>
                                  <div>
                                    <div className="font-semibold">{item.name}</div>
                                    {item.assignedTechnicianId && (
                                      <div className="text-[10px] text-slate-500 font-medium">
                                        Resp: {formatNameAndSurname(adminUsers.find(u => u.id === item.assignedTechnicianId)?.name || 'Desconhecido')}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 py-3 font-medium">{item.category}</td>
                              <td className="px-4 py-3 text-center font-mono">
                                {item.defaultSlaDays || 1} {(item.defaultSlaDays || 1) === 1 ? 'dia' : 'dias'}
                              </td>
                              <td className="px-4 py-3 text-center">
                                <span className="bg-slate-100 text-slate-600 font-bold px-2 py-0.5 rounded-full">
                                  {item.subitems.length}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-right">
                                <div className="flex justify-end items-center gap-2">
                                  <button
                                    onClick={() => setSelectedItemForSubitems(selectedItemForSubitems === item.id ? null : item.id)}
                                    className="text-xs text-risel-blue font-bold px-2.5 py-1 hover:bg-blue-50 rounded-lg transition cursor-pointer"
                                  >
                                    {selectedItemForSubitems === item.id ? 'Fechar Subitens' : 'Gerenciar Subitens'}
                                  </button>
                                  <button
                                    onClick={() => handleStartEditItem(item)}
                                    className="p-1 hover:bg-slate-100 rounded transition cursor-pointer"
                                    title="Editar Item"
                                  >
                                    <Edit2 className="w-3.5 h-3.5 text-slate-500" />
                                  </button>
                                  <button
                                    onClick={() => handleToggleItem(item.id)}
                                    className="p-1 hover:bg-slate-100 rounded transition cursor-pointer"
                                    title={item.active ? 'Inativar Categoria' : 'Ativar Categoria'}
                                  >
                                    {item.active ? (
                                      <ToggleRight className="w-6 h-6 text-emerald-600" />
                                    ) : (
                                      <ToggleLeft className="w-6 h-6 text-slate-400" />
                                    )}
                                  </button>
                                </div>
                              </td>
                            </tr>
                          )}

                          {/* Seção Expandida para Subitens */}
                          {selectedItemForSubitems === item.id && (
                            <tr>
                              <td colSpan={5} className="bg-slate-50/50 p-4 border-t border-slate-200">
                                <div className="space-y-3">
                                  <div className="flex items-center justify-between">
                                    <span className="font-bold text-slate-800">Subitens de {item.name}:</span>
                                    <span className="text-[10px] text-slate-400">Insira subitens específicos para apoiar a triagem</span>
                                  </div>

                                  {/* Listagem de Subitens */}
                                  <div className="flex flex-wrap gap-2">
                                    {item.subitems.length === 0 ? (
                                      <span className="text-slate-400 italic">Nenhum subitem cadastrado. Adicione abaixo.</span>
                                    ) : (
                                      item.subitems.map(sub => {
                                        const customSla = item.subitemSlas?.[sub];
                                        const isEditingThisSub = editingSubitemKey?.itemId === item.id && editingSubitemKey?.subitemName === sub;
                                        
                                        if (isEditingThisSub) {
                                          return (
                                            <div key={sub} className="bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-xl flex items-center gap-2 shadow-xs text-xs">
                                              <input 
                                                type="text"
                                                value={editingSubitemNewName}
                                                onChange={(e) => setEditingSubitemNewName(e.target.value)}
                                                className="px-2 py-1 rounded border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-risel-blue bg-white font-medium w-36"
                                                placeholder="Nome do subitem"
                                              />
                                              <div className="flex items-center gap-1">
                                                <span className="text-[10px] text-slate-500 font-semibold font-display">SLA:</span>
                                                <input 
                                                  type="number"
                                                  min={1}
                                                  value={editingSubitemNewSla}
                                                  onChange={(e) => setEditingSubitemNewSla(e.target.value)}
                                                  className="px-2 py-1 rounded border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-risel-blue bg-white font-mono w-14 text-center"
                                                  placeholder="Padrão"
                                                />
                                                <span className="text-[10px] text-slate-500">dias</span>
                                              </div>
                                              <button
                                                type="button"
                                                onClick={() => handleSaveSubitem(item.id, sub)}
                                                className="p-1 hover:bg-emerald-100 text-emerald-600 rounded transition cursor-pointer"
                                                title="Salvar Subitem"
                                              >
                                                <Check className="w-3.5 h-3.5" />
                                              </button>
                                              <button
                                                type="button"
                                                onClick={() => setEditingSubitemKey(null)}
                                                className="p-1 hover:bg-rose-100 text-rose-500 rounded transition cursor-pointer"
                                                title="Cancelar"
                                              >
                                                <X className="w-3.5 h-3.5" />
                                              </button>
                                            </div>
                                          );
                                        }

                                        return (
                                          <div key={sub} className="bg-white border border-slate-200 px-3 py-1.5 rounded-xl flex items-center gap-2 shadow-xs text-xs">
                                            <span className="font-medium text-slate-700">{sub}</span>
                                            <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-mono font-bold">
                                              SLA: {customSla ? `${customSla} ${customSla === 1 ? 'dia' : 'dias'}` : 'padrão'}
                                            </span>
                                            <div className="flex items-center gap-1 border-l border-slate-150 pl-2 ml-1">
                                              <button
                                                type="button"
                                                onClick={() => handleStartEditSubitem(item.id, sub, customSla)}
                                                className="text-slate-400 hover:text-risel-blue transition cursor-pointer"
                                                title="Editar Subitem"
                                              >
                                                <Edit2 className="w-3.5 h-3.5" />
                                              </button>
                                              <button
                                                type="button"
                                                onClick={() => handleRemoveSubitem(item.id, sub)}
                                                className="text-slate-400 hover:text-rose-500 transition cursor-pointer"
                                                title="Excluir Subitem"
                                              >
                                                <X className="w-3.5 h-3.5" />
                                              </button>
                                            </div>
                                          </div>
                                        );
                                      })
                                    )}
                                  </div>

                                  {/* Adicionar Novo Subitem */}
                                  <div className="flex gap-2 max-w-md items-center">
                                    <input 
                                      type="text" 
                                      placeholder="Ex: Vazamento de água"
                                      value={newSubitemName}
                                      onChange={(e) => setNewSubitemName(e.target.value)}
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                          e.preventDefault();
                                          handleAddSubitem(item.id);
                                        }
                                      }}
                                      className="flex-1 px-3 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-risel-blue bg-white"
                                    />
                                    <input 
                                      type="number" 
                                      min={1}
                                      placeholder="SLA (dias) - Opcional"
                                      value={newSubitemSla}
                                      onChange={(e) => setNewSubitemSla(e.target.value)}
                                      className="w-32 px-3 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-risel-blue bg-white font-mono"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => handleAddSubitem(item.id)}
                                      className="bg-risel-blue text-white font-bold px-4 py-1.5 rounded-lg hover:bg-opacity-90 transition cursor-pointer shrink-0"
                                    >
                                      Adicionar
                                    </button>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* TAB 2: BASES OPERACIONAIS */}
        {activeTab === 'bases' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Form Base */}
              <div className="bg-slate-50 rounded-2xl border border-slate-200/60 p-5 space-y-4">
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide flex items-center gap-2">
                  <Plus className="w-4 h-4 text-risel-blue" />
                  <span>Nova Base Operacional</span>
                </h3>
                <form onSubmit={handleAddBase} className="space-y-3 text-xs">
                  <div>
                    <label className="font-semibold text-slate-600 block mb-1">Nome da Base *</label>
                    <input 
                      type="text" 
                      required
                      placeholder="Ex: Base Paulínia - SP"
                      value={newBaseName}
                      onChange={(e) => setNewBaseName(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-slate-800 focus:outline-none focus:border-risel-blue bg-white"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-600 block mb-1">Estabelecimento *</label>
                    <input 
                      type="text" 
                      required
                      placeholder="Ex: EST-102 ou Paulínia"
                      value={newBaseEstablishment}
                      onChange={(e) => setNewBaseEstablishment(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-slate-800 focus:outline-none focus:border-risel-blue bg-white"
                    />
                  </div>
                  <button 
                    type="submit"
                    className="w-full bg-risel-blue hover:bg-opacity-95 text-white font-bold py-2.5 rounded-lg text-xs transition cursor-pointer"
                  >
                    Cadastrar Base
                  </button>
                </form>
              </div>

              {/* Tabela Bases */}
              <div className="md:col-span-2 space-y-4">
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide">Bases Operacionais Ativas</h3>
                <div className="border border-slate-200 rounded-2xl overflow-hidden text-xs">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                      <tr>
                        <th className="px-4 py-3">Estabelecimento</th>
                        <th className="px-4 py-3">Nome da Base</th>
                        <th className="px-4 py-3 text-center">Status</th>
                        <th className="px-4 py-3 text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 text-slate-700">
                      {operationalBases.map((base) => (
                        <tr key={base.id} className={`hover:bg-slate-50/50 transition ${!base.active ? 'bg-slate-100/40 text-slate-400' : ''}`}>
                          <td className="px-4 py-3">
                            {editingBaseId === base.id ? (
                              <input 
                                type="text" 
                                value={editingBaseEstablishment}
                                onChange={(e) => setEditingBaseEstablishment(e.target.value)}
                                className="px-2 py-1 rounded border border-slate-200 focus:outline-none focus:border-risel-blue bg-white w-28 text-xs font-semibold"
                                placeholder="Estabelecimento"
                              />
                            ) : (
                              <span className="font-mono text-slate-600 bg-slate-100 px-2 py-0.5 rounded text-[11px] font-bold">
                                {base.establishment || 'N/A'}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            {editingBaseId === base.id ? (
                              <div className="flex gap-2">
                                <input 
                                  type="text" 
                                  value={editingBaseName}
                                  onChange={(e) => setEditingBaseName(e.target.value)}
                                  className="px-2 py-1 rounded border border-slate-200 focus:outline-none focus:border-risel-blue bg-white text-xs w-48"
                                />
                                <button 
                                  onClick={() => handleSaveBaseName(base.id)}
                                  className="p-1 hover:bg-emerald-50 text-emerald-600 rounded transition cursor-pointer"
                                  title="Salvar"
                                >
                                  <Check className="w-4 h-4" />
                                </button>
                                <button 
                                  onClick={() => setEditingBaseId(null)}
                                  className="p-1 hover:bg-rose-50 text-rose-500 rounded transition cursor-pointer"
                                  title="Cancelar"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            ) : (
                              <span className="font-semibold">{base.name}</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                              base.active ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-slate-100 text-slate-500 border border-slate-200'
                            }`}>
                              {base.active ? 'Ativo' : 'Inativo'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex justify-end items-center gap-2">
                              {editingBaseId !== base.id && (
                                <button
                                  onClick={() => handleStartEditBase(base)}
                                  className="p-1.5 hover:bg-slate-100 text-slate-500 rounded-lg transition cursor-pointer"
                                  title="Editar Nome"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                              <button
                                onClick={() => handleToggleBase(base.id)}
                                className="p-1 hover:bg-slate-100 rounded transition cursor-pointer"
                                title={base.active ? 'Inativar Base' : 'Ativar Base'}
                              >
                                {base.active ? (
                                  <ToggleRight className="w-6 h-6 text-emerald-600" />
                                ) : (
                                  <ToggleLeft className="w-6 h-6 text-slate-400" />
                                )}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* TAB 3: URGÊNCIA E SLA */}
        {activeTab === 'urgency' && (
          <div className="space-y-6">
            <div className="bg-slate-50 rounded-2xl border border-slate-100 p-5 mb-4">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide mb-2">Funcionamento dos Prazos de SLA</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Os prazos de SLA (Service Level Agreement) em dias cadastrados abaixo controlam a data limite máxima para resolução do chamado. Quando um solicitante abre uma nova solicitação sob determinado nível de urgência, o tempo limite será atribuído dinamicamente com base nas regras estabelecidas aqui. A inativação de um nível de urgência o ocultará no seletor para novos chamados.
              </p>
            </div>

            <div className="border border-slate-200 rounded-2xl overflow-hidden text-xs max-w-3xl">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4">Prioridade / Urgência</th>
                    <th className="px-6 py-4 text-center">SLA de Resolução Padrão</th>
                    <th className="px-6 py-4 text-center">Status do Campo</th>
                    <th className="px-6 py-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-slate-700">
                  {urgencyConfigs.map((urg) => (
                    <tr key={urg.id} className={`hover:bg-slate-50/50 transition ${!urg.active ? 'bg-slate-100/40 text-slate-400' : ''}`}>
                      <td className="px-6 py-4">
                        <span className={`font-bold px-2.5 py-0.5 rounded-full border ${
                          urg.priority === 'Crítica' ? 'bg-rose-50 text-rose-700 border-rose-100' :
                          urg.priority === 'Alta' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                          urg.priority === 'Média' ? 'bg-blue-50 text-risel-blue border-blue-100' :
                          'bg-slate-100 text-slate-700 border-slate-200'
                        }`}>
                          {urg.priority}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        {editingUrgencyId === urg.id ? (
                          <div className="flex justify-center items-center gap-2">
                            <input 
                              type="number" 
                              min={1}
                              value={editingUrgencySla}
                              onChange={(e) => setEditingUrgencySla(Number(e.target.value))}
                              className="px-2 py-1 rounded border border-slate-200 focus:outline-none focus:border-risel-blue bg-white font-mono w-16 text-center"
                            />
                            <span className="font-semibold text-slate-600">dias</span>
                            <button 
                              onClick={() => handleSaveUrgencySla(urg.id)}
                              className="p-1 hover:bg-emerald-50 text-emerald-600 rounded transition cursor-pointer"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => setEditingUrgencyId(null)}
                              className="p-1 hover:bg-rose-50 text-rose-500 rounded transition cursor-pointer"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <span className="font-bold font-mono text-base">{urg.defaultSlaDays || 1} {(urg.defaultSlaDays || 1) === 1 ? 'dia' : 'dias'}</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                          urg.active ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-slate-100 text-slate-500 border border-slate-200'
                        }`}>
                          {urg.active ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end items-center gap-2">
                          {editingUrgencyId !== urg.id && (
                            <button
                              onClick={() => handleStartEditUrgency(urg)}
                              className="p-1.5 hover:bg-slate-100 text-slate-500 rounded-lg transition cursor-pointer"
                              title="Configurar SLA"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            onClick={() => handleToggleUrgency(urg.id)}
                            className="p-1 hover:bg-slate-100 rounded transition cursor-pointer"
                            title={urg.active ? 'Inativar prioridade' : 'Ativar prioridade'}
                          >
                            {urg.active ? (
                              <ToggleRight className="w-6 h-6 text-emerald-600" />
                            ) : (
                              <ToggleLeft className="w-6 h-6 text-slate-400" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 4: ADMINS */}
        {activeTab === 'admins' && (
          <div className="space-y-6">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide">Gerenciamento de Administradores</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Form de Novo Administrador */}
              <div className="md:col-span-1 bg-slate-50 rounded-2xl border border-slate-200/60 p-5 space-y-4">
                <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wide">Cadastrar Administrador</h4>
                <form onSubmit={handleAddAdmin} className="space-y-3 text-xs">
                  <div>
                    <label className="font-semibold text-slate-600 block mb-1">Nome Completo *</label>
                    <input 
                      type="text" 
                      required 
                      placeholder="Ex: João da Silva"
                      value={newAdminName}
                      onChange={(e) => setNewAdminName(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:border-risel-blue bg-white text-slate-800" 
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-600 block mb-1">E-mail *</label>
                    <input 
                      type="email" 
                      required 
                      placeholder="joao@risel.com.br"
                      value={newAdminEmail}
                      onChange={(e) => setNewAdminEmail(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:border-risel-blue bg-white text-slate-800" 
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-600 block mb-1">Telefone/Ramal</label>
                    <input 
                      type="text" 
                      placeholder="(11) 99999-9999"
                      value={newAdminPhone}
                      onChange={(e) => setNewAdminPhone(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:border-risel-blue bg-white text-slate-800" 
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-600 block mb-1">Setor</label>
                    <input 
                      type="text" 
                      placeholder="Ex: TI, Facilities, Engenharia"
                      value={newAdminSector}
                      onChange={(e) => setNewAdminSector(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:border-risel-blue bg-white text-slate-800" 
                    />
                  </div>
                  <button 
                    type="submit" 
                    disabled={isSendingInvite}
                    className="w-full bg-risel-blue hover:bg-opacity-95 text-white font-bold py-2.5 rounded-lg text-xs transition cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isSendingInvite ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Enviando Convite...</span>
                      </>
                    ) : (
                      <span>Cadastrar & Enviar Convite</span>
                    )}
                  </button>
                </form>
              </div>

              {/* Lista de Administradores */}
              <div className="md:col-span-2 bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
                <h4 className="font-bold text-slate-800 text-sm">Administradores e Técnicos</h4>
                <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                      <tr>
                        <th className="px-4 py-2.5">Nome / E-mail</th>
                        <th className="px-4 py-2.5">Telefone</th>
                        <th className="px-4 py-2.5">Setor</th>
                        <th className="px-4 py-2.5 text-center">Status</th>
                        <th className="px-4 py-2.5 text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 text-slate-700">
                      {adminUsers.map(u => {
                        const isEditing = editingAdminId === u.id;
                        return (
                          <tr key={u.id} className={`hover:bg-slate-50/50 transition ${!u.active && !isEditing ? 'opacity-60 bg-slate-50' : ''}`}>
                            {isEditing ? (
                              <>
                                <td className="px-4 py-2 space-y-1">
                                  <input 
                                    type="text" 
                                    value={editingAdminName} 
                                    onChange={(e) => setEditingAdminName(e.target.value)} 
                                    className="w-full px-2 py-1 rounded border border-slate-300 focus:outline-none focus:border-risel-blue text-xs font-semibold bg-white text-slate-800"
                                    placeholder="Nome"
                                  />
                                  <input 
                                    type="email" 
                                    value={editingAdminEmail} 
                                    onChange={(e) => setEditingAdminEmail(e.target.value)} 
                                    className="w-full px-2 py-1 rounded border border-slate-300 focus:outline-none focus:border-risel-blue text-[10px] bg-white text-slate-800"
                                    placeholder="E-mail"
                                  />
                                </td>
                                <td className="px-4 py-2">
                                  <input 
                                    type="text" 
                                    value={editingAdminPhone} 
                                    onChange={(e) => setEditingAdminPhone(e.target.value)} 
                                    className="w-full px-2 py-1 rounded border border-slate-300 focus:outline-none focus:border-risel-blue text-xs font-mono bg-white text-slate-800"
                                    placeholder="Telefone"
                                  />
                                </td>
                                <td className="px-4 py-2">
                                  <input 
                                    type="text" 
                                    value={editingAdminSector} 
                                    onChange={(e) => setEditingAdminSector(e.target.value)} 
                                    className="w-full px-2 py-1 rounded border border-slate-300 focus:outline-none focus:border-risel-blue text-xs bg-white text-slate-800"
                                    placeholder="Setor"
                                  />
                                </td>
                                <td className="px-4 py-2 text-center text-slate-400">-</td>
                                <td className="px-4 py-2 text-right space-x-1.5 whitespace-nowrap">
                                  <button
                                    onClick={() => handleSaveAdmin(u.id)}
                                    type="button"
                                    className="p-1.5 hover:bg-emerald-50 rounded text-emerald-600 transition cursor-pointer inline-flex items-center"
                                    title="Salvar alterações"
                                  >
                                    <Check className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => setEditingAdminId(null)}
                                    type="button"
                                    className="p-1.5 hover:bg-rose-50 rounded text-rose-600 transition cursor-pointer inline-flex items-center"
                                    title="Cancelar"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                </td>
                              </>
                            ) : (
                              <>
                                <td className="px-4 py-3">
                                  <div className="font-semibold text-slate-800">{u.name}</div>
                                  <div className="text-[10px] text-slate-400">{u.email}</div>
                                </td>
                                <td className="px-4 py-3 font-mono">{u.phone || '-'}</td>
                                <td className="px-4 py-3 font-medium text-slate-500">{u.sector || 'Facilities'}</td>
                                <td className="px-4 py-3 text-center">
                                  <span className={`px-2 py-0.5 rounded-full font-bold text-[9px] ${
                                    u.active ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-slate-100 text-slate-500 border border-slate-200'
                                  }`}>
                                    {u.active ? 'Ativo' : 'Inativo'}
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-right space-x-1.5 whitespace-nowrap">
                                  <button
                                    onClick={() => handleStartEditAdmin(u)}
                                    type="button"
                                    className="p-1 hover:bg-slate-100 rounded text-slate-600 transition cursor-pointer inline-flex items-center"
                                    title="Editar Administrador"
                                  >
                                    <Edit2 className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => handleToggleAdmin(u.id)}
                                    type="button"
                                    disabled={u.email === 'deny.goncalves@risel.com.br'}
                                    className={`p-1 rounded transition cursor-pointer inline-flex items-center ${
                                      u.email === 'deny.goncalves@risel.com.br' ? 'opacity-40 cursor-not-allowed' : 'hover:bg-slate-100'
                                    }`}
                                    title={u.email === 'deny.goncalves@risel.com.br' ? 'Não permitido inativar Admin Geral' : (u.active ? 'Inativar Administrador' : 'Ativar Administrador')}
                                  >
                                    {u.active ? (
                                      <ToggleRight className="w-6 h-6 text-emerald-600" />
                                    ) : (
                                      <ToggleLeft className="w-6 h-6 text-slate-400" />
                                    )}
                                  </button>
                                  <button
                                    onClick={() => handleRemoveAdmin(u.id)}
                                    type="button"
                                    disabled={u.email === 'deny.goncalves@risel.com.br'}
                                    className={`p-1 rounded transition cursor-pointer inline-flex items-center ${
                                      u.email === 'deny.goncalves@risel.com.br' ? 'opacity-40 cursor-not-allowed text-slate-300' : 'hover:bg-slate-100 text-rose-500 hover:text-rose-600'
                                    }`}
                                    title={u.email === 'deny.goncalves@risel.com.br' ? 'Não permitido excluir Admin Geral' : 'Excluir Administrador'}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </td>
                              </>
                            )}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* TAB 5: SISTEMA E BANCO DE DADOS */}
        {activeTab === 'sistema' && (
          <div className="space-y-6">
            <div className="max-w-3xl bg-slate-50 rounded-2xl border border-slate-200/60 p-6 space-y-6">
              <div>
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide flex items-center gap-2">
                  <Server className="w-4 h-4 text-risel-blue" />
                  <span>Status e Integração de Dados</span>
                </h3>
                <p className="text-xs text-slate-500 mt-1">Monitore a conexão com a nuvem e limpe dados para início de produção.</p>
              </div>

              {/* Status de Conexão */}
              <div className="bg-white rounded-xl border border-slate-200 p-5 flex items-center justify-between">
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Provedor Ativo</span>
                  <div className="text-xs font-bold text-slate-800 flex items-center gap-2">
                    <Database className="w-4 h-4 text-emerald-500" />
                    <span>{dbInfo.provider}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${dbInfo.configured ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`} />
                  <span className="text-xs font-semibold text-slate-600">
                    {dbInfo.configured ? 'Firebase Conectado' : 'Modo Offline / LocalStorage'}
                  </span>
                </div>
              </div>

              {/* Diagnóstico de Envio de E-mails (SMTP) */}
              <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
                <div className="flex items-start gap-3">
                  <div className="bg-blue-50 text-risel-blue p-2 rounded-lg shrink-0">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide">Diagnóstico de E-mail (SMTP)</h4>
                    <p className="text-xs text-slate-500 mt-1">
                      Teste a conexão com o servidor de e-mails para garantir que as notificações de abertura e atualização de chamados estão sendo despachadas.
                    </p>
                  </div>
                </div>

                <form onSubmit={handleTestEmail} className="space-y-3 pt-1">
                  <div className="flex gap-2">
                    <input
                      type="email"
                      required
                      placeholder="Digite um e-mail para receber o teste..."
                      value={testEmail}
                      onChange={(e) => setTestEmail(e.target.value)}
                      className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-risel-blue focus:ring-1 focus:ring-risel-blue transition"
                    />
                    <button
                      type="submit"
                      disabled={isTestingEmail || !testEmail}
                      className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      {isTestingEmail ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Testando...</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-3.5 h-3.5" />
                          <span>Enviar Teste</span>
                        </>
                      )}
                    </button>
                  </div>

                  {testEmailResult && (
                    <div className={`text-xs rounded-lg p-3.5 border ${
                      testEmailResult.success 
                        ? 'bg-emerald-50 border-emerald-100 text-emerald-800 font-medium' 
                        : 'bg-rose-50 border-rose-100 text-rose-800'
                    }`}>
                      <div className="font-bold flex items-center gap-1.5 mb-1">
                        <span className={`w-2 h-2 rounded-full ${testEmailResult.success ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                        {testEmailResult.success ? '✓ Conexão SMTP OK!' : '✗ Erro na autenticação SMTP'}
                      </div>
                      <p className="leading-relaxed font-mono text-[11px] whitespace-pre-line">{testEmailResult.message}</p>
                      {testEmailResult.advice && (
                        <p className="mt-2 text-[11px] leading-relaxed bg-white/60 border border-rose-200/50 rounded-md p-2 font-semibold text-rose-900">
                          💡 {testEmailResult.advice}
                        </p>
                      )}
                    </div>
                  )}
                </form>
              </div>

              {/* Reset de Chamados */}
              <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
                <div className="flex items-start gap-3">
                  <div className="bg-rose-50 text-rose-600 p-2 rounded-lg shrink-0">
                    <RefreshCw className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide">Limpar Dados de Chamados</h4>
                    <p className="text-xs text-slate-500 mt-1">Remova permanentemente TODOS os chamados registrados no banco de dados e no cache local do navegador para iniciar o sistema em produção limpo.</p>
                  </div>
                </div>

                <div className="pt-2">
                  {!showResetConfirm ? (
                    <button
                      type="button"
                      onClick={() => {
                        setShowResetConfirm(true);
                        setResetSuccess(false);
                      }}
                      disabled={isResetting}
                      className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-2 shadow-sm disabled:opacity-50"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Zerar Banco de Chamados</span>
                    </button>
                  ) : (
                    <div className="bg-rose-50 border border-rose-100 rounded-xl p-4 space-y-3">
                      <p className="text-xs font-semibold text-rose-800 leading-relaxed">
                        ⚠️ Atenção: Esta ação irá deletar permanentemente todos os chamados da Risel no Firestore e no cache local. Isso removerá as OSs fictícias antigas e iniciará o painel limpo. Deseja prosseguir?
                      </p>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setIsResetting(true);
                            onResetTickets();
                            setTimeout(() => {
                              setIsResetting(false);
                              setShowResetConfirm(false);
                              setResetSuccess(true);
                            }, 1500);
                          }}
                          className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition cursor-pointer"
                        >
                          {isResetting ? 'Limpando...' : 'Sim, Limpar Tudo'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowResetConfirm(false)}
                          className="px-3.5 py-1.5 bg-white border border-slate-200 text-slate-600 rounded-lg text-xs font-semibold hover:bg-slate-50 transition cursor-pointer"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  )}

                  {resetSuccess && (
                    <div className="mt-3 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-xl p-3">
                      ✓ Banco de chamados zerado com sucesso! Agora você pode começar a registrar chamados reais de produção.
                    </div>
                  )}
                </div>
              </div>

              {/* Informações Úteis de Produção */}
              <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-5 space-y-2">
                <h4 className="text-xs font-bold text-risel-blue uppercase tracking-wide">Dica de Deploy no Render</h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Para garantir que o seu servidor no Render se conecte perfeitamente ao seu Firebase Firestore na nuvem, lembre-se de configurar a variável de ambiente <strong className="font-mono bg-blue-100 px-1 rounded">FIREBASE_SERVICE_ACCOUNT_KEY</strong> com o conteúdo JSON da sua chave privada (gerada no console do Firebase &gt; Configurações do Projeto &gt; Contas de Serviço). Caso contrário, o servidor utilizará o armazenamento local de fallback de maneira segura.
                </p>
              </div>
            </div>
          </div>
        )}

      </div>

    </div>
  );
}
