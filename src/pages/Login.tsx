import React from 'react';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../firebase';
import { LayoutGrid, LogIn } from 'lucide-react';
import { motion } from 'motion/react';

export const Login = () => {
  const handleLogin = async () => {
    try {
      googleProvider.setCustomParameters({ prompt: 'select_account' });
      await signInWithPopup(auth, googleProvider);
    } catch (error: any) {
      console.error('Login failed:', error);
      if (error.code === 'auth/popup-closed-by-user') {
        alert('O login foi cancelado. Por favor, tente novamente sem fechar a janela.');
      } else if (error.code === 'auth/cancelled-popup-request') {
        // Safe to ignore or handle
      } else {
        alert(`Erro ao entrar: ${error.message}\n\nDica: Tente abrir o app em uma NOVA GUIA usando o botão no canto superior direito do preview.`);
      }
    }
  };

  return (
    <div className="min-h-screen bg-bento-accent flex flex-col items-center justify-center p-6 text-white">
      <motion.div 
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="text-center space-y-8 max-w-sm w-full"
      >
        <div className="flex flex-col items-center gap-4">
          <div className="bg-white p-4 rounded-3xl shadow-2xl shadow-orange-900/20">
            <LayoutGrid className="text-bento-accent" size={48} />
          </div>
          <h1 className="text-4xl font-black tracking-tight">GastroCheck</h1>
          <p className="text-orange-100 font-medium">
            Gestão profissional de checklists para sua cozinha.
          </p>
        </div>

        <div className="space-y-4">
          <button 
            onClick={handleLogin}
            className="w-full bg-white text-bento-accent py-4 rounded-2xl font-bold text-lg shadow-xl shadow-orange-900/10 flex items-center justify-center gap-3 hover:bg-orange-50 transition-colors"
          >
            <LogIn size={20} />
            Entrar com Google
          </button>
          <p className="text-xs text-orange-200 opacity-70">
            Acesse seu painel administrativo ou de usuário.
          </p>
        </div>
      </motion.div>

      {/* Background Decorative Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
        <div className="absolute -top-24 -left-24 w-64 h-64 bg-orange-400 rounded-full blur-3xl opacity-50" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-orange-800 rounded-full blur-3xl opacity-50" />
      </div>
    </div>
  );
};
