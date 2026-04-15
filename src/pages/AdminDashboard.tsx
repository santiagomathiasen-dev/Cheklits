import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, addDoc, updateDoc, doc, deleteDoc, query, orderBy } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { Plus, Trash2, Users, ClipboardList, Settings, ChevronRight, Save, LayoutGrid, LogOut, Eye, X, CheckCircle2, Home, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { signOut } from 'firebase/auth';

const PreviewModal = ({ isOpen, onClose, checklist }: { isOpen: boolean, onClose: () => void, checklist: any }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-bento-bg w-full max-w-md max-h-[80vh] rounded-3xl overflow-hidden flex flex-col shadow-2xl"
      >
        <div className="p-6 border-b border-bento-border flex justify-between items-center bg-white">
          <div>
            <h3 className="font-bold text-bento-ink">Prévia do Checklist</h3>
            <p className="text-xs text-bento-muted">Como o usuário verá no celular</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <header className="bg-white p-5 rounded-2xl border border-bento-border shadow-sm">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-lg font-bold text-bento-ink">{checklist.title || 'Sem Título'}</h1>
                <p className="text-xs text-bento-muted">Segunda-feira, 14 de Abril</p>
              </div>
              <span className="bg-[#FFF7ED] text-bento-accent px-3 py-1 rounded-full text-[10px] font-bold uppercase">
                Praça: {checklist.praca || 'N/A'}
              </span>
            </div>
          </header>

          <div className="space-y-3">
            {checklist.items.map((item: any, idx: number) => (
              <div key={idx} className="bg-white p-5 rounded-2xl border border-bento-border shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-5 h-5 rounded-md border-2 border-bento-border flex items-center justify-center">
                    {idx === 0 && <CheckCircle2 size={12} className="text-bento-success" />}
                  </div>
                  <h3 className="font-bold text-sm text-bento-ink">{item.text || 'Item sem descrição'}</h3>
                </div>
                
                <div className="pl-8">
                  {item.type === 'checkbox' && (
                    <div className="bg-bento-bg px-4 py-2 rounded-xl text-xs font-bold text-bento-muted inline-block">
                      Marcar como feito
                    </div>
                  )}
                  {item.type === 'temperature' && (
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-8 bg-bento-bg border border-bento-border rounded-lg" />
                      <span className="text-xs font-bold text-bento-muted">°C</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="p-4 bg-white border-t border-bento-border">
          <div className="w-full bg-bento-accent text-white py-3 rounded-xl font-bold text-center opacity-50 cursor-not-allowed">
            Finalizar Checklist
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export const AdminDashboard = () => {
  const [templates, setTemplates] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'checklists' | 'users' | 'history'>('checklists');
  const [isCreating, setIsCreating] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);
  
  // New Checklist State
  const [newChecklist, setNewChecklist] = useState({
    title: '',
    praca: '',
    frequency: 'daily',
    items: [{ id: '1', text: '', type: 'checkbox', requiredPhoto: false }]
  });

  useEffect(() => {
    const unsubTemplates = onSnapshot(collection(db, 'checklistTemplates'), (snap) => {
      setTemplates(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    const unsubUsers = onSnapshot(collection(db, 'users'), (snap) => {
      setUsers(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    const unsubSubmissions = onSnapshot(query(collection(db, 'submissions'), orderBy('timestamp', 'desc')), (snap) => {
      setSubmissions(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => {
      unsubTemplates();
      unsubUsers();
      unsubSubmissions();
    };
  }, []);

  const handleCreateChecklist = async () => {
    await addDoc(collection(db, 'checklistTemplates'), {
      ...newChecklist,
      active: true,
      createdAt: new Date().toISOString()
    });
    setIsCreating(false);
    setNewChecklist({ title: '', praca: '', frequency: 'daily', items: [{ id: '1', text: '', type: 'checkbox', requiredPhoto: false }] });
  };

  const assignChecklist = async (userId: string, templateId: string) => {
    await updateDoc(doc(db, 'users', userId), { assignedChecklistId: templateId });
  };

  return (
    <div className="min-h-screen bg-bento-bg p-6">
      <div className="max-w-[1400px] mx-auto grid grid-cols-1 lg:grid-cols-[240px_1fr_280px] gap-4 h-full">
        {/* Sidebar */}
        <aside className="bento-card bento-sidebar lg:row-span-6">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-full bg-bento-accent flex items-center justify-center font-bold text-white">
              GC
            </div>
            <div>
              <p className="text-sm font-semibold">Admin Console</p>
              <p className="text-[11px] opacity-60">GastroCheck Pro</p>
            </div>
          </div>

          <nav className="flex flex-col gap-1">
            <button 
              onClick={() => window.location.href = '/'}
              className="bento-nav-link text-left flex items-center gap-2"
            >
              <Home size={18} />
              Início
            </button>
            <button 
              onClick={() => window.location.reload()}
              className="bento-nav-link text-left flex items-center gap-2"
            >
              <RefreshCw size={18} />
              Recarregar
            </button>
            <button 
              onClick={() => setActiveTab('checklists')}
              className={`bento-nav-link text-left ${activeTab === 'checklists' ? 'bento-nav-link-active' : ''}`}
            >
              Checklists
            </button>
            <button 
              onClick={() => setActiveTab('users')}
              className={`bento-nav-link text-left ${activeTab === 'users' ? 'bento-nav-link-active' : ''}`}
            >
              Usuários
            </button>
            <button 
              onClick={() => setActiveTab('history')}
              className={`bento-nav-link text-left ${activeTab === 'history' ? 'bento-nav-link-active' : ''}`}
            >
              Histórico
            </button>
          </nav>

          <div className="mt-auto flex flex-col gap-2">
            <button 
              onClick={() => signOut(auth)}
              className="flex items-center gap-2 text-red-400 text-sm font-bold hover:text-red-500 transition-colors p-2"
            >
              <LogOut size={16} />
              Sair
            </button>
            <div className="bento-tag bg-white/10 text-white border-none text-center">
              Admin Mode
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="bento-card lg:col-span-1 lg:row-span-4 overflow-y-auto">
          {activeTab === 'checklists' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-bold">Gestão de Checklists</h2>
                <button 
                  onClick={() => setIsCreating(true)}
                  className="bg-bento-accent text-white px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2"
                >
                  <Plus size={18} />
                  Novo
                </button>
              </div>

              {isCreating ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <input 
                      type="text" 
                      placeholder="Título"
                      className="w-full p-3 bg-bento-bg border border-bento-border rounded-xl outline-none"
                      value={newChecklist.title}
                      onChange={e => setNewChecklist({...newChecklist, title: e.target.value})}
                    />
                    <input 
                      type="text" 
                      placeholder="Praça"
                      className="w-full p-3 bg-bento-bg border border-bento-border rounded-xl outline-none"
                      value={newChecklist.praca}
                      onChange={e => setNewChecklist({...newChecklist, praca: e.target.value})}
                    />
                  </div>

                  <div className="space-y-3">
                    {newChecklist.items.map((item, index) => (
                      <div key={item.id} className="flex gap-3 items-center">
                        <input 
                          type="text" 
                          placeholder="Item..."
                          className="flex-1 p-2 bg-bento-bg border border-bento-border rounded-lg outline-none text-sm"
                          value={item.text}
                          onChange={e => {
                            const items = [...newChecklist.items];
                            items[index].text = e.target.value;
                            setNewChecklist({...newChecklist, items});
                          }}
                        />
                        <select 
                          className="p-2 bg-bento-bg border border-bento-border rounded-lg text-sm"
                          value={item.type}
                          onChange={e => {
                            const items = [...newChecklist.items];
                            items[index].type = e.target.value;
                            setNewChecklist({...newChecklist, items});
                          }}
                        >
                          <option value="checkbox">Check</option>
                          <option value="temperature">Temp</option>
                        </select>
                      </div>
                    ))}
                    <button 
                      onClick={() => setNewChecklist({...newChecklist, items: [...newChecklist.items, { id: Date.now().toString(), text: '', type: 'checkbox', requiredPhoto: false }]})}
                      className="text-bento-accent text-xs font-bold"
                    >
                      + Adicionar Item
                    </button>
                  </div>

                  <div className="flex justify-end gap-3">
                    <button onClick={() => setIsCreating(false)} className="text-sm text-bento-muted font-bold">Cancelar</button>
                    <button 
                      onClick={() => setIsPreviewing(true)}
                      className="bg-bento-bg text-bento-ink border border-bento-border px-6 py-2 rounded-xl text-sm font-bold flex items-center gap-2"
                    >
                      <Eye size={18} />
                      Visualizar
                    </button>
                    <button onClick={handleCreateChecklist} className="bg-bento-accent text-white px-6 py-2 rounded-xl text-sm font-bold flex items-center gap-2">
                      <Save size={18} />
                      Salvar Checklist
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {templates.map(template => (
                    <div key={template.id} className="flex items-center justify-between p-4 border-b border-bento-border last:border-0">
                      <div>
                        <p className="font-bold text-sm">{template.title}</p>
                        <p className="text-xs text-bento-muted">{template.praca} • {template.items.length} itens</p>
                      </div>
                      <button onClick={() => deleteDoc(doc(db, 'checklistTemplates', template.id))} className="text-red-400">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'users' && (
            <div>
              <h2 className="text-lg font-bold mb-6">Usuários</h2>
              <div className="space-y-4">
                {users.map(user => (
                  <div key={user.id} className="flex items-center justify-between p-4 bg-bento-bg rounded-xl">
                    <div>
                      <p className="font-bold text-sm">{user.displayName}</p>
                      <p className="text-xs text-bento-muted">{user.email}</p>
                    </div>
                    <select 
                      className="p-2 bg-white border border-bento-border rounded-lg text-xs"
                      value={user.assignedChecklistId || ''}
                      onChange={e => assignChecklist(user.id, e.target.value)}
                    >
                      <option value="">Nenhum Checklist</option>
                      {templates.map(t => (
                        <option key={t.id} value={t.id}>{t.title}</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'history' && (
            <div>
              <h2 className="text-lg font-bold mb-6">Histórico Recente</h2>
              <div className="space-y-3">
                {submissions.map(sub => (
                  <div key={sub.id} className="flex items-center justify-between p-4 border-b border-bento-border last:border-0">
                    <div>
                      <p className="text-sm font-bold">{sub.userName} <span className="text-bento-muted font-normal">em</span> {sub.praca}</p>
                      <p className="text-[11px] text-bento-muted">{new Date(sub.timestamp).toLocaleString()}</p>
                    </div>
                    <span className="bento-tag">Concluído</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>

        {/* Stats Grid (Lower Middle) */}
        <div className="lg:col-span-1 lg:row-span-2 grid grid-cols-3 gap-3">
          <div className="bento-card justify-center items-center text-center">
            <p className="text-[10px] text-bento-muted uppercase tracking-wider">Submissões</p>
            <p className="text-2xl font-bold text-bento-accent">{submissions.length}</p>
          </div>
          <div className="bento-card justify-center items-center text-center">
            <p className="text-[10px] text-bento-muted uppercase tracking-wider">Usuários</p>
            <p className="text-2xl font-bold text-bento-ink">{users.length}</p>
          </div>
          <div className="bento-card justify-center items-center text-center">
            <p className="text-[10px] text-bento-muted uppercase tracking-wider">Templates</p>
            <p className="text-2xl font-bold text-bento-ink">{templates.length}</p>
          </div>
        </div>

        {/* Admin Panel (Right Top) */}
        <div className="bento-card lg:col-span-1 lg:row-span-3">
          <h3 className="text-xs font-bold text-bento-muted mb-4">STATUS DO SISTEMA</h3>
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-sm">
              <div className="w-2 h-2 rounded-full bg-bento-success" />
              <span>Google Drive Sincronizado</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <div className="w-2 h-2 rounded-full bg-blue-500" />
              <span>Backup: 48h</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <div className="w-2 h-2 rounded-full bg-yellow-500" />
              <span>Limpeza: 7 dias</span>
            </div>
            <div className="mt-auto p-3 bg-blue-50 rounded-xl border border-dashed border-blue-300 text-center">
              <p className="text-[10px] font-bold text-blue-800 uppercase">Relatório Gerado</p>
              <p className="text-[11px] text-blue-600 truncate">GastroCheck_Report_2024.pdf</p>
            </div>
          </div>
        </div>

        {/* Status Panel (Right Bottom) */}
        <div className="bento-card lg:col-span-1 lg:row-span-3 bg-gray-50/50">
          <h3 className="text-xs font-bold text-bento-muted mb-4">NOTIFICAÇÕES</h3>
          <div className="space-y-3">
            <div className="bg-[#DCF8C6] p-3 rounded-xl text-center">
              <span className="text-[#075E54] font-bold text-sm">WhatsApp Ativo</span>
            </div>
            <div className="pt-4 border-t border-bento-border">
              <p className="text-[10px] text-bento-muted mb-2">LOGS RECENTES</p>
              <div className="space-y-2">
                {submissions.slice(0, 3).map(sub => (
                  <div key={sub.id} className="flex justify-between text-[11px]">
                    <span className="truncate max-w-[120px]">{sub.userName}</span>
                    <span className="text-bento-success font-bold">ENVIADO</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <PreviewModal 
        isOpen={isPreviewing} 
        onClose={() => setIsPreviewing(false)} 
        checklist={newChecklist} 
      />
    </div>
  );
};
