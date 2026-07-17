import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Wind, Zap, Droplet, Hammer, ArrowUpDown, 
  ShieldAlert, Trash2, Send, Clock, MapPin, 
  User, Mail, Phone, Info, AlertTriangle, Layers, Building2,
  Camera, Upload, X, Key, Wifi, Paintbrush, Wrench, Flame,
  Plug, HardHat, Laptop, Sun, Car, Leaf
} from 'lucide-react';
import { Ticket, PriorityType, MaintenanceItem, OperationalBase, UrgencyConfig } from '../types';

interface UserRequestFormProps {
  onSubmitTicket: (ticket: Omit<Ticket, 'id' | 'createdAt' | 'updatedAt' | 'isSlaViolated'>) => Promise<string> | string;
  maintenanceItems: MaintenanceItem[];
  operationalBases: OperationalBase[];
  urgencyConfigs: UrgencyConfig[];
}

export default function UserRequestForm({ 
  onSubmitTicket, 
  maintenanceItems, 
  operationalBases,
  urgencyConfigs
}: UserRequestFormProps) {
  // Filter active registers
  const activeItems = maintenanceItems.filter(item => item.active);
  const activeBases = operationalBases.filter(base => base.active);
  const activeUrgencies = urgencyConfigs.filter(urg => urg.active);

  const [selectedItem, setSelectedItem] = useState<string>('');
  const [selectedSubitem, setSelectedSubitem] = useState('');
  const [selectedBase, setSelectedBase] = useState('');
  const [requesterName, setRequesterName] = useState('');
  const [requesterEmail, setRequesterEmail] = useState('');
  const [requesterPhone, setRequesterPhone] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<PriorityType>('Média');
  
  // Estado para fotos anexadas (máximo 3)
  const [photos, setPhotos] = useState<string[]>([]);
  const [dragActive, setDragActive] = useState(false);

  const [successTicketId, setSuccessTicketId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  // Set default selected item
  useEffect(() => {
    if (activeItems.length > 0 && !selectedItem) {
      setSelectedItem(activeItems[0].id);
    }
  }, [activeItems, selectedItem]);

  const currentItem = activeItems.find(item => item.id === selectedItem) || activeItems[0];

  // Set default subitem when selected item changes
  useEffect(() => {
    if (currentItem && currentItem.subitems && currentItem.subitems.length > 0) {
      setSelectedSubitem(currentItem.subitems[0]);
    } else {
      setSelectedSubitem('');
    }
  }, [currentItem]);

  // Set default base
  useEffect(() => {
    if (activeBases.length > 0 && !selectedBase) {
      setSelectedBase(activeBases[0].name);
    }
  }, [activeBases, selectedBase]);

  // Helper to format SLA days
  const calculateSlaInDays = (days: number): string => {
    if (days === 1) return "1 dia";
    return `${days} dias`;
  };

  const getResolvedSlaDays = (): number => {
    if (!currentItem) return 1;
    if (selectedSubitem && currentItem.subitemSlas && currentItem.subitemSlas[selectedSubitem]) {
      return currentItem.subitemSlas[selectedSubitem];
    }
    return currentItem.defaultSlaDays || 1;
  };

  // Upload/Anexo de fotos
  const handlePhotoUpload = (files: FileList | null) => {
    if (!files) return;
    const currentPhotosCount = photos.length;
    const remainingSlots = 3 - currentPhotosCount;
    if (remainingSlots <= 0) {
      setErrorMsg('Você já atingiu o limite máximo de 3 fotos.');
      return;
    }

    const filesArray = Array.from(files).slice(0, remainingSlots);
    
    filesArray.forEach(file => {
      if (!file.type.startsWith('image/')) {
        setErrorMsg('Por favor, selecione apenas arquivos de imagem.');
        return;
      }
      
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setPhotos(prev => [...prev, reader.result as string]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const removePhoto = (indexToRemove: number) => {
    setPhotos(prev => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handlePhotoUpload(e.dataTransfer.files);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!requesterName.trim() || !requesterEmail.trim() || !requesterPhone.trim() || !location.trim() || !description.trim()) {
      setErrorMsg('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    if (!selectedBase) {
      setErrorMsg('Por favor, selecione uma Base Operacional.');
      return;
    }

    if (!selectedSubitem) {
      setErrorMsg('Por favor, selecione um subitem de manutenção para facilitar o diagnóstico.');
      return;
    }

    try {
      const slaDays = getResolvedSlaDays();
      // Determine priority automatically based on SLA days
      let resolvedPriority: PriorityType = 'Média';
      if (slaDays <= 1) resolvedPriority = 'Crítica';
      else if (slaDays <= 3) resolvedPriority = 'Alta';
      else if (slaDays <= 7) resolvedPriority = 'Média';
      else resolvedPriority = 'Baixa';

      const ticketId = await onSubmitTicket({
        requesterName,
        requesterEmail,
        requesterPhone,
        category: currentItem.category,
        subitem: selectedSubitem,
        operationalBase: selectedBase,
        location,
        description,
        priority: resolvedPriority,
        status: 'Novo',
        slaDays: slaDays,
        slaTargetDate: new Date(Date.now() + slaDays * 24 * 60 * 60 * 1000).toISOString(),
        cost: 0,
        photos: photos
      });

      setSuccessTicketId(ticketId);
      // Reset form fields
      setRequesterName('');
      setRequesterEmail('');
      setRequesterPhone('');
      setLocation('');
      setDescription('');
      setPriority('Média');
      setPhotos([]);
    } catch (err) {
      setErrorMsg('Erro ao registrar chamado. Tente novamente.');
    }
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

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-4 md:p-5" id="request-form-container">
      {successTicketId ? (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-6 px-4"
        >
          <div className="w-16 h-16 bg-green-50 text-risel-primary rounded-full flex items-center justify-center mx-auto mb-4 border border-green-100">
            <Send className="w-8 h-8 animate-bounce" />
          </div>
          <h3 className="text-2xl font-extrabold font-display text-slate-900 mb-2">Chamado Registrado!</h3>
          <p className="text-sm text-slate-600 max-w-sm mx-auto mb-4">
            Sua solicitação de <span className="font-bold text-risel-primary">{currentItem.category} ({selectedSubitem})</span> foi registrada com sucesso na base.
          </p>
          
          <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-4 max-w-xs mx-auto mb-6">
            <span className="text-xs font-bold text-slate-400 block uppercase tracking-wider mb-1">Código de Acompanhamento</span>
            <span className="text-xl font-mono font-extrabold text-risel-primary select-all block tracking-wide">{successTicketId}</span>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
            <button
              onClick={() => setSuccessTicketId(null)}
              className="w-full sm:w-auto bg-risel-primary hover:bg-opacity-90 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition cursor-pointer shadow-sm"
            >
              Abrir Outro Chamado
            </button>
            <button
              onClick={() => {
                const event = new CustomEvent('track-ticket', { detail: successTicketId });
                window.dispatchEvent(event);
              }}
              className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition cursor-pointer shadow-sm"
            >
              Acompanhar Chamado
            </button>
          </div>
        </motion.div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2.5">
            <Building2 className="w-5 h-5 text-risel-primary shrink-0" />
            <h2 className="text-base font-bold text-slate-900">Nova Solicitação de Manutenção</h2>
          </div>

          {errorMsg && (
            <div className="bg-rose-50 border border-rose-200 text-rose-800 rounded-xl p-2.5 flex items-center gap-2 text-xs font-medium">
              <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Dados do Solicitante - Grid Amplo e Compacto */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3" id="requester-fields-grid">
            <div>
              <label htmlFor="requester-name" className="text-[11px] font-bold text-slate-600 uppercase block mb-1">Nome Completo *</label>
              <input
                id="requester-name"
                type="text"
                required
                placeholder="Ex: João da Silva"
                value={requesterName}
                onChange={(e) => setRequesterName(e.target.value)}
                className="w-full px-3 py-1.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-risel-primary focus:ring-1 focus:ring-risel-primary/20 bg-white text-slate-800 font-medium"
              />
            </div>
            <div>
              <label htmlFor="requester-email" className="text-[11px] font-bold text-slate-600 uppercase block mb-1">E-mail Corporativo *</label>
              <input
                id="requester-email"
                type="email"
                required
                placeholder="nome@risel.com.br"
                value={requesterEmail}
                onChange={(e) => setRequesterEmail(e.target.value)}
                className="w-full px-3 py-1.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-risel-primary focus:ring-1 focus:ring-risel-primary/20 bg-white text-slate-800 font-medium"
              />
            </div>
            <div>
              <label htmlFor="requester-phone" className="text-[11px] font-bold text-slate-600 uppercase block mb-1">Telefone / Ramal *</label>
              <input
                id="requester-phone"
                type="tel"
                required
                placeholder="(11) 99999-9999"
                value={requesterPhone}
                onChange={(e) => setRequesterPhone(e.target.value)}
                className="w-full px-3 py-1.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-risel-primary focus:ring-1 focus:ring-risel-primary/20 bg-white text-slate-800 font-mono"
              />
            </div>
            <div>
              <label htmlFor="operational-base" className="text-[11px] font-bold text-slate-600 uppercase block mb-1">Base Risel *</label>
              <select
                id="operational-base"
                value={selectedBase}
                onChange={(e) => setSelectedBase(e.target.value)}
                className="w-full px-3 py-1.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-risel-primary focus:ring-1 focus:ring-risel-primary/20 bg-white text-slate-800 font-medium h-[30px]"
              >
                {activeBases.map((base) => (
                  <option key={base.id} value={base.name}>{base.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="location" className="text-[11px] font-bold text-slate-600 uppercase block mb-1">Setor / Local *</label>
              <input
                id="location"
                type="text"
                required
                placeholder="Ex: Bloco B"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full px-3 py-1.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-risel-primary focus:ring-1 focus:ring-risel-primary/20 bg-white text-slate-800 font-medium"
              />
            </div>
          </div>

          {/* Categoria do Ativo - Grid de Ícones Compacto com texto ao lado */}
          <div>
            <label className="text-[11px] font-bold text-slate-600 uppercase block mb-1.5">Item predial da solicitação *</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-1.5">
              {activeItems.map((item) => {
                const isSelected = selectedItem === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSelectedItem(item.id)}
                    className={`flex items-center gap-2 px-2.5 py-1.5 rounded-xl border transition cursor-pointer text-left ${
                      isSelected 
                        ? 'border-risel-primary bg-green-50 text-risel-primary shadow-xs ring-1 ring-risel-primary/30' 
                        : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700 hover:text-slate-900'
                    }`}
                  >
                    <span className="scale-[0.85] text-inherit shrink-0">
                      {getIcon(item.iconName)}
                    </span>
                    <span className="text-[11px] font-bold truncate leading-tight">{item.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Subitens - Legíveis e com destaque */}
          <AnimatePresence mode="wait">
            {currentItem && currentItem.subitems && currentItem.subitems.length > 0 && (
              <motion.div 
                key={currentItem.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-slate-50 border border-slate-100 rounded-xl p-2.5"
              >
                <label className="text-[11px] font-bold text-slate-700 mb-1.5 block uppercase tracking-wide">Selecione o problema específico *</label>
                <div className="flex flex-wrap gap-1.5">
                  {currentItem.subitems.map((sub) => {
                    const isSubSelected = selectedSubitem === sub;
                    return (
                      <button
                        key={sub}
                        type="button"
                        onClick={() => setSelectedSubitem(sub)}
                        className={`px-3 py-1 text-[11px] font-bold rounded-lg border transition cursor-pointer ${
                          isSubSelected
                            ? 'bg-risel-primary border-risel-primary text-white shadow-xs'
                            : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:text-slate-800'
                        }`}
                      >
                        {sub}
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Descrição - Espaçosa e Legível */}
          <div>
            <label htmlFor="description" className="text-[11px] font-bold text-slate-600 uppercase block mb-1">Descrição Detalhada do Problema *</label>
            <textarea
              id="description"
              required
              rows={6}
              placeholder="Descreva o problema para agilizarmos o diagnóstico..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl border border-slate-200 text-sm focus:outline-none focus:border-risel-primary focus:ring-1 focus:ring-risel-primary/20 bg-white text-slate-800 font-medium min-h-[150px] resize-y"
            />
          </div>

          {/* Área de Anexar Fotos - Horizontal e compactada */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-center">
            <div 
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              onClick={() => document.getElementById('photo-input')?.click()}
              className={`border border-dashed rounded-xl p-2.5 text-center transition cursor-pointer flex items-center justify-center gap-3 ${
                dragActive 
                  ? 'border-risel-primary bg-green-50/50 text-risel-primary' 
                  : 'border-slate-200 hover:border-slate-300 text-slate-500 hover:text-slate-700'
              }`}
            >
              <input 
                id="photo-input"
                type="file"
                multiple
                accept="image/*"
                onChange={(e) => handlePhotoUpload(e.target.files)}
                className="hidden"
              />
              <Camera className="w-4 h-4 text-risel-primary shrink-0" />
              <div className="text-left leading-tight">
                <span className="text-[11px] font-bold text-slate-700 block">Anexar Fotos (Até 3)</span>
                <span className="text-[9px] text-slate-400 block">Arraste aqui ou clique para selecionar</span>
              </div>
            </div>

            {/* Previews das Fotos Anexadas */}
            {photos.length > 0 ? (
              <div className="flex gap-2 justify-end">
                {photos.map((photo, index) => (
                  <div key={index} className="relative group rounded-lg overflow-hidden border border-slate-200 w-16 h-10 bg-slate-100">
                    <img 
                      src={photo} 
                      alt={`Anexo ${index + 1}`} 
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        removePhoto(index);
                      }}
                      className="absolute top-0.5 right-0.5 bg-rose-500 hover:bg-rose-600 text-white p-0.5 rounded-full shadow-md transition duration-100 cursor-pointer"
                      title="Excluir foto"
                    >
                      <X className="w-2.5 h-2.5" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-right text-[10px] text-slate-400 font-semibold pr-2">
                Nenhuma foto anexada
              </div>
            )}
          </div>

          <button
            type="submit"
            className="w-full bg-risel-primary hover:bg-opacity-95 text-white font-extrabold px-5 py-2 rounded-xl text-xs transition cursor-pointer shadow-md flex items-center justify-center gap-1.5"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Abrir Chamado Predial</span>
          </button>
        </form>
      )}
    </div>
  );
}
