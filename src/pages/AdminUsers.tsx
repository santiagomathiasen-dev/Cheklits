import React, { useEffect, useState } from 'react';
import { dataService } from '../services/dataService';
import { useAuth } from '../AuthContext';
import { UserCheck, UserX, Trash2, Mail, Shield, ShieldAlert, ArrowLeft, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';

interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: 'admin' | 'staff';
  isApproved: boolean;
  createdAt: string;
}

export const AdminUsers: React.FC = () => {
  const { isAdmin } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const loadUsers = () => {
    if (!isAdmin) return;
    const usersData = dataService.getProfiles().sort((a: any, b: any) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    setUsers(usersData);
    setLoading(false);
  };

  useEffect(() => {
    loadUsers();
  }, [isAdmin]);

  const toggleApproval = (uid: string, currentStatus: boolean) => {
    const user = users.find(u => u.uid === uid);
    if (user) {
      dataService.saveProfile({ ...user, isApproved: !currentStatus });
      loadUsers();
    }
  };

  const promoteToAdmin = (uid: string) => {
    if (!window.confirm("Deseja realmente tornar este usuário Administrador?")) return;
    const user = users.find(u => u.uid === uid);
    if (user) {
      dataService.saveProfile({ ...user, role: 'admin' });
      loadUsers();
    }
  };

  const deleteUser = (uid: string) => {
    if (!window.confirm("Deseja deletar este usuário permanentemente?")) return;
    // Note: deleteProfile logic would go here
    loadUsers();
  };

  const filteredUsers = users.filter(u => 
    u.email.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.displayName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const pendingUsers = filteredUsers.filter(u => !u.isApproved);
  const approvedUsers = filteredUsers.filter(u => u.isApproved);

  if (!isAdmin) return <div className="p-8 text-center">Acesso Negado</div>;

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <header className="bg-white border-b sticky top-0 z-10 px-4 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate('/')}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <ArrowLeft size={24} className="text-gray-600" />
            </button>
            <h1 className="text-xl font-bold text-gray-900">Gerenciamento de Usuários</h1>
          </div>
          
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Buscar por nome ou e-mail..."
              className="w-full pl-10 pr-4 py-2 bg-gray-100 border-transparent rounded-xl focus:bg-white focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-4 space-y-8">
        {/* Pending Approval Section */}
        {pendingUsers.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-4">
              <ShieldAlert className="text-orange-600" size={20} />
              <h2 className="text-lg font-semibold text-gray-900">Aguardando Aprovação ({pendingUsers.length})</h2>
            </div>
            <div className="grid gap-3">
              <AnimatePresence>
                {pendingUsers.map(u => (
                  <UserRow 
                    key={u.uid} 
                    user={u} 
                    onApprove={() => toggleApproval(u.uid, u.isApproved)}
                    onDelete={() => deleteUser(u.uid)}
                    onPromote={() => promoteToAdmin(u.uid)}
                  />
                ))}
              </AnimatePresence>
            </div>
          </section>
        )}

        {/* Approved Users Section */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Shield className="text-green-600" size={20} />
            <h2 className="text-lg font-semibold text-gray-900">Usuários Ativos ({approvedUsers.length})</h2>
          </div>
          <div className="grid gap-3">
            <AnimatePresence>
              {approvedUsers.map(u => (
                <UserRow 
                  key={u.uid} 
                  user={u} 
                  onApprove={() => toggleApproval(u.uid, u.isApproved)}
                  onDelete={() => deleteUser(u.uid)}
                  onPromote={() => promoteToAdmin(u.uid)}
                />
              ))}
            </AnimatePresence>
          </div>
        </section>

        {loading && (
          <div className="text-center py-12 text-gray-500">Carregando usuários...</div>
        )}
      </main>
    </div>
  );
};

interface UserRowProps {
  user: UserProfile;
  onApprove: () => void;
  onDelete: () => void;
  onPromote: () => void;
}

const UserRow: React.FC<UserRowProps> = ({ user, onApprove, onDelete, onPromote }) => {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4"
    >
      <div className="flex items-center gap-4">
        <div className={`p-3 rounded-full ${user.isApproved ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'}`}>
          {user.role === 'admin' ? <Shield size={24} /> : <Mail size={24} />}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-gray-900">{user.displayName}</h3>
            {user.role === 'admin' && (
              <span className="text-[10px] bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-black uppercase tracking-wider">
                Admin
              </span>
            )}
            {!user.isApproved && (
              <span className="text-[10px] bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-black uppercase tracking-wider">
                Pendente
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500 truncate max-w-xs">{user.email}</p>
        </div>
      </div>

      <div className="flex items-center gap-2 self-end md:self-center">
        {!user.isApproved && (
          <button
            onClick={onApprove}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-semibold hover:bg-green-700 transition-colors shadow-sm"
          >
            <UserCheck size={18} />
            Aprovar
          </button>
        )}
        
        {user.isApproved && user.role !== 'admin' && (
          <button
            onClick={onPromote}
            className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
            title="Tornar Admin"
          >
            <Shield size={20} />
          </button>
        )}

        {user.isApproved && user.role !== 'admin' && (
          <button
            onClick={onApprove}
            className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
            title="Revogar Acesso"
          >
            <UserX size={20} />
          </button>
        )}

        {user.email !== 'santiago02061992@gmail.com' && (
          <button
            onClick={onDelete}
            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
            title="Deletar Usuário"
          >
            <Trash2 size={20} />
          </button>
        )}
      </div>
    </motion.div>
  );
};
