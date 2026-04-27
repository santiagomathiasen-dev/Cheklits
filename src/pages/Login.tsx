import React, { useState } from 'react';
import { useAuth } from '../AuthContext';
import { LayoutGrid, LogIn, Mail, User } from 'lucide-react';
import { motion } from 'motion/react';

export const Login = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    login(email, name);
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

        <form onSubmit={handleSubmit} className="space-y-4 bg-white/10 p-8 rounded-3xl backdrop-blur-md border border-white/10 shadow-2xl">
          <div className="space-y-3">
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-orange-200" size={18} />
              <input 
                type="email" 
                placeholder="Seu e-mail"
                required
                className="w-full bg-white/20 border-transparent rounded-xl py-3 pl-10 pr-4 text-white placeholder:text-orange-200 focus:bg-white/30 outline-none transition-all"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 text-orange-200" size={18} />
              <input 
                type="text" 
                placeholder="Seu nome"
                className="w-full bg-white/20 border-transparent rounded-xl py-3 pl-10 pr-4 text-white placeholder:text-orange-200 focus:bg-white/30 outline-none transition-all"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
          </div>
          <button 
            type="submit"
            className="w-full bg-white text-bento-accent py-4 rounded-2xl font-bold text-lg shadow-xl shadow-orange-900/10 flex items-center justify-center gap-3 hover:bg-orange-50 transition-colors"
          >
            <LogIn size={20} />
            Entrar no Sistema
          </button>
          <div className="text-xs text-orange-200 opacity-80 pt-2">
            <p>Admin: santiago02061992@gmail.com</p>
            <p>Os dados serão salvos localmente neste navegador.</p>
          </div>
        </form>
      </motion.div>

      {/* Background Decorative Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
        <div className="absolute -top-24 -left-24 w-64 h-64 bg-orange-400 rounded-full blur-3xl opacity-50" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-orange-800 rounded-full blur-3xl opacity-50" />
      </div>
    </div>
  );
};
