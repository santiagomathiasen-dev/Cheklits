import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, addDoc, updateDoc, doc, deleteDoc, query, orderBy } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { handleFirestoreError, OperationType } from '../lib/firestoreErrorHandler';
import { Plus, Trash2, Users, ClipboardList, Settings, ChevronRight, Save, LayoutGrid, LogOut, Eye, X, CheckCircle2, Home, RefreshCw, Camera } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { signOut } from 'firebase/auth';
import { cn } from '../lib/utils';

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
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <div className="flex gap-2">
                  <div className="p-2 bg-bento-bg rounded-xl text-bento-muted border border-bento-border">
                    <Home size={16} />
                  </div>
                  <div className="p-2 bg-bento-bg rounded-xl text-bento-muted border border-bento-border">
                    <RefreshCw size={16} />
                  </div>
                </div>
                <div>
                  <h1 className="text-base font-bold text-bento-ink leading-tight">{checklist.title || 'Sem Título'}</h1>
                  <p className="text-[10px] text-bento-muted font-medium">Segunda-feira, 14 de Abril</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="bg-[#FFF7ED] text-bento-accent px-3 py-1 rounded-full text-[10px] font-bold uppercase">
                  Praça: {checklist.praca || 'N/A'}
                </span>
                <div className="bg-red-50 text-red-500 px-3 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 border border-red-100">
                  <LogOut size={10} />
                  Sair
                </div>
              </div>
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
                  {item.type === 'time' && (
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-8 bg-bento-bg border border-bento-border rounded-lg" />
                    </div>
                  )}
                  {item.requiredPhoto && (
                    <div className="mt-3 p-3 border-2 border-dashed border-bento-border rounded-xl flex flex-col items-center gap-1 opacity-50">
                      <Camera size={16} className="text-bento-muted" />
                      <span className="text-[10px] font-bold text-bento-muted uppercase tracking-wider">Capturar Foto</span>
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
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'checklistTemplates');
    });

    const unsubUsers = onSnapshot(collection(db, 'users'), (snap) => {
      setUsers(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'users');
    });

    const unsubSubmissions = onSnapshot(query(collection(db, 'submissions'), orderBy('timestamp', 'desc')), (snap) => {
      setSubmissions(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'submissions');
    });

    return () => {
      unsubTemplates();
      unsubUsers();
      unsubSubmissions();
    };
  }, []);

  const handleCreateChecklist = async () => {
    if (!newChecklist.title || !newChecklist.praca) return;
    try {
      await addDoc(collection(db, 'checklistTemplates'), {
        ...newChecklist,
        active: true,
        createdAt: new Date().toISOString()
      });
      setIsCreating(false);
      setNewChecklist({ title: '', praca: '', frequency: 'daily', items: [{ id: '1', text: '', type: 'checkbox', requiredPhoto: false }] });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'checklistTemplates');
    }
  };

  const toggleChecklistAssignment = async (userId: string, templateId: string, currentIds: string[] = []) => {
    try {
      const newIds = currentIds.includes(templateId)
        ? currentIds.filter(id => id !== templateId)
        : [...currentIds, templateId];
      await updateDoc(doc(db, 'users', userId), { assignedChecklistIds: newIds });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${userId}`);
    }
  };

  return (
    <div className="min-h-screen bg-bento-bg p-6">
      <div className="max-w-[1400px] mx-auto grid grid-cols-1 lg:grid-cols-[240px_1fr_280px] gap-4 h-full">
        {/* Mobile Header */}
        <div className="lg:hidden bento-card flex items-center justify-between mb-4 bg-bento-ink text-white border-none py-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-bento-accent flex items-center justify-center font-bold text-white text-xs">
              GC
            </div>
            <span className="font-bold text-sm">GastroCheck</span>
          </div>
          <div className="flex gap-2">
            <button onClick={() => window.location.href = '/'} className="p-2 bg-white/10 rounded-xl hover:bg-white/20 transition-colors">
              <Home size={18} />
            </button>
            <button onClick={() => window.location.reload()} className="p-2 bg-white/10 rounded-xl hover:bg-white/20 transition-colors">
              <RefreshCw size={18} />
            </button>
            <button onClick={() => signOut(auth)} className="p-2 bg-red-500/20 text-red-400 rounded-xl hover:bg-red-500/30 transition-colors">
              <LogOut size={18} />
            </button>
          </div>
        </div>

        {/* Sidebar */}
        <aside className="hidden lg:flex bento-card bento-sidebar lg:row-span-6">
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
              <ClipboardList size={18} className="inline mr-2" />
              Templates
            </button>
            <button 
              onClick={() => setActiveTab('users')}
              className={`bento-nav-link text-left ${activeTab === 'users' ? 'bento-nav-link-active' : ''}`}
            >
              <Users size={18} className="inline mr-2" />
              Usuários
            </button>
            <button 
              onClick={() => setActiveTab('history')}
              className={`bento-nav-link text-left ${activeTab === 'history' ? 'bento-nav-link-active' : ''}`}
            >
              <LayoutGrid size={18} className="inline mr-2" />
              Submissões
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
                          <option value="time">Hora</option>
                        </select>
                        <button
                          onClick={() => {
                            const items = [...newChecklist.items];
                            items[index].requiredPhoto = !items[index].requiredPhoto;
                            setNewChecklist({...newChecklist, items});
                          }}
                          className={`p-2 rounded-lg border text-xs font-bold transition-colors ${item.requiredPhoto ? 'bg-bento-accent text-white border-bento-accent' : 'bg-bento-bg text-bento-muted border-bento-border'}`}
                        >
                          {item.requiredPhoto ? 'Com Foto' : 'Sem Foto'}
                        </button>
                        <button 
                          onClick={() => {
                            const items = newChecklist.items.filter((_, i) => i !== index);
                            setNewChecklist({...newChecklist, items});
                          }}
                          className="p-2 text-red-400 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                    <button 
                      onClick={() => setNewChecklist({...newChecklist, items: [...newChecklist.items, { id: Date.now().toString(), text: '', type: 'checkbox', requiredPhoto: false }]})}
                      className="w-full py-3 border-2 border-dashed border-bento-border rounded-xl text-bento-accent text-xs font-bold hover:bg-bento-accent/5 transition-colors flex items-center justify-center gap-2"
                    >
                      <Plus size={14} />
                      Adicionar Item
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
              <h2 className="text-lg font-bold mb-6">Usuários e Atribuições</h2>
              <div className="space-y-4">
                {users.map(user => (
                  <div key={user.id} className="bento-card bg-bento-bg/30 border-bento-border p-4">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-bento-accent/10 flex items-center justify-center font-bold text-bento-accent text-sm">
                          {user.displayName?.charAt(0) || 'U'}
                        </div>
                        <div>
                          <p className="font-bold text-sm text-bento-ink">{user.displayName}</p>
                          <p className="text-[11px] text-bento-muted">{user.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-bento-muted uppercase tracking-wider">
                          {(user.assignedChecklistIds?.length || 0)} ATRIBUÍDOS
                        </span>
                      </div>
                    </div>
                    
                    <div className="pt-3 border-t border-bento-border/50">
                      <p className="text-[10px] font-bold text-bento-muted mb-3 uppercase">Checklists Disponíveis</p>
                      <div className="flex flex-wrap gap-2">
                        {templates.map(t => {
                          const isAssigned = user.assignedChecklistIds?.includes(t.id);
                          return (
                            <button
                              key={t.id}
                              onClick={() => toggleChecklistAssignment(user.id, t.id, user.assignedChecklistIds)}
                              className={cn(
                                "px-3 py-1.5 rounded-lg text-xs font-bold transition-all border",
                                isAssigned 
                                  ? "bg-bento-accent text-white border-bento-accent shadow-sm"
                                  : "bg-white text-bento-muted border-bento-border hover:bg-gray-50"
                              )}
                            >
                              {t.title}
                            </button>
                          );
                        })}
                        {templates.length === 0 && (
                          <p className="text-[10px] text-bento-muted italic">Nenhum template criado</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'history' && (
            <div>
              <h2 className="text-lg font-bold mb-6">Submissões Recebidas</h2>
              <div className="space-y-3">
                {submissions.map(sub => (
                  <div key={sub.id} className="bento-card bg-bento-bg/50 border-bento-border">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p className="text-sm font-bold text-bento-ink">{sub.userName}</p>
                        <p className="text-[11px] text-bento-muted">{new Date(sub.timestamp).toLocaleString('pt-BR')}</p>
                      </div>
                      <span className="bento-tag bg-bento-success/10 text-bento-success border-bento-success/20">
                        {sub.praca}
                      </span>
                    </div>
                    
                    <div className="space-y-2 pt-3 border-t border-bento-border/50">
                      {Object.entries(sub.responses || {}).map(([itemId, resp]: [string, any]) => {
                        const template = templates.find(t => t.id === sub.templateId);
                        const item = template?.items.find((i: any) => i.id === itemId);
                        return (
                          <div key={itemId} className="flex justify-between items-center text-xs">
                            <span className="text-bento-muted">{item?.text || 'Item removido'}:</span>
                            <span className="font-bold text-bento-ink">
                              {resp.value === true ? 'Sim' : resp.value === false ? 'Não' : resp.value || 'N/A'}
                              {resp.hasPhoto && <span className="ml-2 text-[10px] text-bento-accent">(Foto no PDF)</span>}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
                {submissions.length === 0 && (
                  <div className="text-center py-12 text-bento-muted">
                    Nenhuma submissão encontrada.
                  </div>
                )}
              </div>
            </div>
          )}
        </main>

        {/* Stats Grid (Lower Middle) */}
        <div className="lg:col-span-1 lg:row-span-2 grid grid-cols-3 gap-3">
          <button 
            onClick={() => setActiveTab('history')}
            className="bento-card justify-center items-center text-center hover:bg-bento-accent/5 transition-colors"
          >
            <p className="text-[10px] text-bento-muted uppercase tracking-wider">Submissões</p>
            <p className="text-2xl font-bold text-bento-accent">{submissions.length}</p>
          </button>
          <button 
            onClick={() => setActiveTab('users')}
            className="bento-card justify-center items-center text-center hover:bg-bento-accent/5 transition-colors"
          >
            <p className="text-[10px] text-bento-muted uppercase tracking-wider">Usuários</p>
            <p className="text-2xl font-bold text-bento-ink">{users.length}</p>
          </button>
          <button 
            onClick={() => setActiveTab('checklists')}
            className="bento-card justify-center items-center text-center hover:bg-bento-accent/5 transition-colors"
          >
            <p className="text-[10px] text-bento-muted uppercase tracking-wider">Templates</p>
            <p className="text-2xl font-bold text-bento-ink">{templates.length}</p>
          </button>
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
