import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ShieldCheck, Lock, User, AlertCircle, Eye, EyeOff, Building2 } from 'lucide-react';

interface AdminLoginProps {
  onLoginSuccess: (name: string, email: string) => void;
  onCancel: () => void;
}

export default function AdminLogin({ onLoginSuccess, onCancel }: AdminLoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    
    const emailLower = email.trim().toLowerCase();
    
    // Validação obrigatória do domínio do e-mail @risel.com.br
    if (!emailLower.endsWith('@risel.com.br')) {
      setErrorMsg('O login de administrador deve conter obrigatoriamente um e-mail do domínio @risel.com.br');
      return;
    }
    
    setIsLoading(true);

    fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: emailLower, password })
    })
    .then(async (res) => {
      const data = await res.json();
      if (res.ok && data.success) {
        sessionStorage.setItem('risel_admin_token', data.token);
        onLoginSuccess(data.user.name, data.user.email);
      } else {
        setErrorMsg(data.error || 'E-mail ou senha incorretos.');
      }
    })
    .catch((err) => {
      setErrorMsg('Erro ao conectar com o servidor: ' + err.message);
    })
    .finally(() => {
      setIsLoading(false);
    });
  };

  return (
    <div className="max-w-md w-full mx-auto my-12" id="admin-login-container">
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="bg-white rounded-2xl border border-slate-100 shadow-xl overflow-hidden"
      >
        <div className="bg-risel-primary p-8 text-white text-center relative">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="bg-white p-1 rounded-xl flex items-center justify-center w-12 h-12 overflow-hidden shadow-sm">
              <img 
                src="https://i.ibb.co/My6STcDv/71144827-2525571747712417-6231227587708846080-n.jpg" 
                alt="Risel Logo" 
                className="w-full h-full object-cover rounded-lg"
                referrerPolicy="no-referrer"
              />
            </div>
            <span className="font-bold text-xl tracking-tight text-white font-display">RISEL</span>
          </div>
          <h2 className="text-xl font-bold font-display tracking-tight">Autenticação Administrativa</h2>
          <p className="text-xs text-blue-200 mt-1">Insira as credenciais de acesso autorizado da Risel Combustíveis</p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          {errorMsg && (
            <div className="bg-rose-50 border border-rose-100 text-rose-800 rounded-xl p-4 flex items-center gap-3 text-xs font-semibold">
              <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="space-y-4">
            {/* Usuário (E-mail) */}
            <div>
              <label htmlFor="email" className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">E-mail @risel.com.br *</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  id="email"
                  type="email"
                  required
                  disabled={isLoading}
                  placeholder="exemplo@risel.com.br"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-risel-primary/10 focus:border-risel-primary text-slate-800 transition bg-white"
                />
              </div>
            </div>

            {/* Senha */}
            <div>
              <label htmlFor="password" className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Senha *</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  disabled={isLoading}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-10 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-risel-primary/10 focus:border-risel-primary text-slate-800 transition bg-white"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3 pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className="bg-risel-primary hover:bg-opacity-95 text-white font-bold py-3 rounded-xl transition duration-150 shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-55"
              id="admin-submit-login-btn"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <span>Confirmar Login</span>
              )}
            </button>
            <button
              type="button"
              onClick={onCancel}
              disabled={isLoading}
              className="border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold py-3 rounded-xl transition duration-150 cursor-pointer text-sm"
              id="admin-cancel-login-btn"
            >
              Voltar ao Início
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
