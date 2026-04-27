import React from 'react';
import { useAuth } from '../AuthContext';
import { LogOut, Clock, ShieldAlert } from 'lucide-react';
import { motion } from 'motion/react';

export const PendingApproval: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden"
      >
        <div className="p-8 text-center">
          <div className="flex justify-center mb-6">
            <div className="bg-orange-100 p-4 rounded-full">
              <Clock className="text-orange-600 w-12 h-12" />
            </div>
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Conta em Análise</h1>
          <p className="text-gray-600 mb-8">
            Olá, <span className="font-semibold text-gray-900">{user?.displayName || user?.email}</span>. 
            Seu cadastro foi recebido com sucesso, mas precisa ser aprovado por um administrador para acessar o sistema.
          </p>

          <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 mb-8 text-left">
            <div className="flex items-start gap-3">
              <ShieldAlert className="text-blue-600 w-5 h-5 mt-0.5" />
              <p className="text-sm text-blue-800 leading-relaxed">
                Nossas regras de segurança exigem que cada novo acesso seja validado manualmente para garantir a integridade dos dados.
              </p>
            </div>
          </div>

          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gray-900 text-white rounded-xl font-medium hover:bg-gray-800 transition-colors"
          >
            <LogOut size={20} />
            Sair do Sistema
          </button>
        </div>
        
        <div className="bg-gray-50 p-4 border-t border-gray-100 text-center">
          <p className="text-xs text-gray-500 uppercase tracking-widest font-semibold">
            Segurança Validada Localmente
          </p>
        </div>
      </motion.div>
    </div>
  );
};
