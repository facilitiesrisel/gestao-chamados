import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Lock, X, AlertCircle, CheckCircle2, RefreshCw, KeyRound } from 'lucide-react';

interface ChangePasswordModalProps {
  email: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function ChangePasswordModal({ email, isOpen, onClose }: ChangePasswordModalProps) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (newPassword.length < 6) {
      setErrorMsg('A nova senha deve conter no mínimo 6 caracteres para garantir a segurança.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg('A confirmação de senha não coincide com a nova senha digitada.');
      return;
    }

    setIsLoading(true);

    fetch('/api/admin/change-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, currentPassword, newPassword })
    })
    .then(async (res) => {
      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessMsg('Sua senha de acesso foi alterada com sucesso!');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setTimeout(() => {
          onClose();
          setSuccessMsg('');
        }, 2000);
      } else {
        setErrorMsg(data.error || 'Erro ao alterar sua senha de acesso. Verifique a senha atual.');
      }
    })
    .catch((err) => {
      setErrorMsg('Erro de comunicação com o servidor: ' + err.message);
    })
    .finally(() => {
      setIsLoading(false);
    });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/65 backdrop-blur-xs" id="change-password-modal">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-100 overflow-hidden"
          >
            {/* Header */}
            <div className="bg-slate-50 border-b border-slate-100 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-800">
                <KeyRound className="w-5 h-5 text-risel-blue shrink-0" />
                <h3 className="font-bold font-display text-sm">Alterar Minha Senha</h3>
              </div>
              <button
                onClick={onClose}
                type="button"
                className="p-1 hover:bg-slate-200 rounded-lg text-slate-400 hover:text-slate-600 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
              {errorMsg && (
                <div className="bg-rose-50 border border-rose-100 text-rose-800 rounded-xl p-4 flex items-center gap-3 font-semibold">
                  <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {successMsg && (
                <div className="bg-emerald-50 border border-emerald-100 text-emerald-800 rounded-xl p-4 flex items-center gap-3 font-bold">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                  <span>{successMsg}</span>
                </div>
              )}

              <div className="space-y-3.5">
                <div>
                  <label className="font-semibold text-slate-600 block mb-1">Senha Atual *</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="password"
                      required
                      disabled={isLoading || !!successMsg}
                      placeholder="Digite sua senha de acesso atual"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-risel-primary/10 focus:border-risel-primary text-slate-800 bg-white"
                    />
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-3.5">
                  <label className="font-semibold text-slate-600 block mb-1">Nova Senha *</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="password"
                      required
                      disabled={isLoading || !!successMsg}
                      placeholder="Mínimo de 6 caracteres"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-risel-primary/10 focus:border-risel-primary text-slate-800 bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-semibold text-slate-600 block mb-1">Confirmar Nova Senha *</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="password"
                      required
                      disabled={isLoading || !!successMsg}
                      placeholder="Repita a nova senha criada"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-risel-primary/10 focus:border-risel-primary text-slate-800 bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Botões */}
              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isLoading || !!successMsg}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-600 font-bold transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isLoading || !!successMsg}
                  className="px-5 py-2 bg-risel-primary hover:bg-opacity-95 text-white font-bold rounded-lg transition cursor-pointer flex items-center gap-2 disabled:opacity-55"
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Processando...</span>
                    </>
                  ) : (
                    <span>Alterar Minha Senha</span>
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
