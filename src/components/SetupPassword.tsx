import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Lock, Eye, EyeOff, CheckCircle2, AlertCircle, RefreshCw, KeyRound } from 'lucide-react';

interface SetupPasswordProps {
  token: string;
  onSuccess: () => void;
}

export default function SetupPassword({ token, onSuccess }: SetupPasswordProps) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isDone, setIsDone] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (password.length < 6) {
      setErrorMsg('A senha deve conter no mínimo 6 caracteres para garantir a segurança de acesso.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg('A confirmação de senha não coincide com a senha digitada.');
      return;
    }

    setIsLoading(true);

    fetch('/api/admin/setup-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, password })
    })
    .then(async (res) => {
      const data = await res.json();
      if (res.ok && data.success) {
        setIsDone(true);
      } else {
        setErrorMsg(data.error || 'Erro ao registrar sua senha de acesso.');
      }
    })
    .catch((err) => {
      setErrorMsg('Erro de comunicação com o servidor: ' + err.message);
    })
    .finally(() => {
      setIsLoading(false);
    });
  };

  if (isDone) {
    return (
      <div className="max-w-md w-full mx-auto my-12 px-4" id="setup-password-success-container">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-2xl border border-slate-100 shadow-xl p-8 text-center space-y-6"
        >
          <div className="mx-auto w-16 h-16 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center border border-emerald-100">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-bold font-display text-slate-800">Senha Ativada com Sucesso!</h2>
            <p className="text-xs text-slate-500">
              Sua conta administrativa foi ativada. Agora você pode realizar o login com seu e-mail corporativo @risel.com.br e a senha cadastrada.
            </p>
          </div>
          <button
            onClick={onSuccess}
            className="w-full bg-risel-primary hover:bg-opacity-95 text-white font-bold py-3 rounded-xl transition duration-150 cursor-pointer text-xs uppercase tracking-wider"
          >
            Ir para Tela de Login
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-md w-full mx-auto my-12 px-4" id="setup-password-container">
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="bg-white rounded-2xl border border-slate-100 shadow-xl overflow-hidden"
      >
        <div className="bg-risel-primary p-8 text-white text-center">
          <div className="mx-auto w-12 h-12 bg-white/10 p-2.5 rounded-xl border border-white/10 flex items-center justify-center mb-4">
            <KeyRound className="w-6 h-6 text-risel-yellow" />
          </div>
          <h2 className="text-xl font-bold font-display tracking-tight">Ativar Acesso Administrador</h2>
          <p className="text-xs text-blue-200 mt-1">Crie sua senha de acesso segura e exclusiva para a Risel Combustíveis</p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-5">
          {errorMsg && (
            <div className="bg-rose-50 border border-rose-100 text-rose-800 rounded-xl p-4 flex items-center gap-3 text-xs font-semibold">
              <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="space-y-4">
            {/* Senha */}
            <div>
              <label htmlFor="pass" className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Nova Senha *</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  id="pass"
                  type={showPassword ? 'text' : 'password'}
                  required
                  disabled={isLoading}
                  placeholder="Mínimo 6 caracteres"
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

            {/* Confirmar Senha */}
            <div>
              <label htmlFor="confirmPass" className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Confirmar Nova Senha *</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  id="confirmPass"
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  disabled={isLoading}
                  placeholder="Repita a nova senha"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-9 pr-10 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-risel-primary/10 focus:border-risel-primary text-slate-800 transition bg-white"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition cursor-pointer"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-risel-primary hover:bg-opacity-95 text-white font-bold py-3 rounded-xl transition duration-150 shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-55 text-xs uppercase tracking-wider"
            >
              {isLoading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <span>Ativar Meu Acesso</span>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
