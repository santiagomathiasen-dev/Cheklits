import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, addDoc, doc, getDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { handleFirestoreError, OperationType } from '../lib/firestoreErrorHandler';
import { useAuth } from '../AuthContext';
import { PhotoCapture } from '../components/PhotoCapture';
import { CheckCircle2, ClipboardList, Thermometer, Type, Send, Loader2, LogOut, Home, RefreshCw, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { cn } from '../lib/utils';
import { signOut } from 'firebase/auth';

export const UserDashboard = () => {
  const { profile } = useAuth();
  const [template, setTemplate] = useState<any>(null);
  const [availableTemplates, setAvailableTemplates] = useState<any[]>([]);
  const [responses, setResponses] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!profile) return;
    
    // Fetch all templates and filter by user's assignments
    const unsubTemplates = onSnapshot(collection(db, 'checklistTemplates'), (snap) => {
      const allTemplates = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const assignedIds = profile.assignedChecklistIds || [];
      const userTemplates = allTemplates.filter(t => assignedIds.includes(t.id));
      setAvailableTemplates(userTemplates);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'checklistTemplates');
    });

    return () => unsubTemplates();
  }, [profile]);

  useEffect(() => {
    if (!profile?.assignedChecklistIds?.length) return;
    // No need to fetch a specific template by ID here anymore as we fetch all and filter
  }, [profile]);

  const handleResponseChange = (itemId: string, value: any) => {
    setResponses(prev => ({
      ...prev,
      [itemId]: { ...prev[itemId], value }
    }));
  };

  const handlePhotoCapture = (itemId: string, photoUrl: string) => {
    setResponses(prev => ({
      ...prev,
      [itemId]: { ...prev[itemId], photoUrl }
    }));
  };

  const generatePDF = async (submissionData: any) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    
    doc.setFontSize(22);
    doc.setTextColor(249, 115, 22); // Bento Accent
    doc.text('GastroCheck Pro', pageWidth / 2, 20, { align: 'center' });
    
    doc.setFontSize(16);
    doc.setTextColor(30, 41, 59); // Bento Ink
    doc.text('Relatório de Conformidade', pageWidth / 2, 30, { align: 'center' });
    
    doc.setDrawColor(226, 232, 240);
    doc.line(20, 35, pageWidth - 20, 35);

    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139); // Bento Muted
    doc.text(`Checklist: ${template.title}`, 20, 45);
    doc.text(`Praça: ${template.praca}`, 20, 52);
    doc.text(`Responsável: ${profile.displayName}`, pageWidth - 20, 45, { align: 'right' });
    doc.text(`Data/Hora: ${new Date().toLocaleString('pt-BR')}`, pageWidth - 20, 52, { align: 'right' });

    const tableData = template.items.map((item: any) => [
      item.text,
      responses[item.id]?.value || 'Pendente',
      responses[item.id]?.photoUrl ? 'Sim' : 'Não'
    ]);

    (doc as any).autoTable({
      startY: 60,
      head: [['Item do Checklist', 'Resultado', 'Foto']],
      body: tableData,
      headStyles: { fillStyle: 'f97316', textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      margin: { top: 60 },
    });

    // Add Photos Section
    let currentY = (doc as any).lastAutoTable.finalY + 20;
    const itemsWithPhotos = template.items.filter((item: any) => responses[item.id]?.photoUrl);

    if (itemsWithPhotos.length > 0) {
      if (currentY > 240) {
        doc.addPage();
        currentY = 20;
      }
      
      doc.setFontSize(14);
      doc.setTextColor(30, 41, 59);
      doc.text('Evidências Fotográficas', 20, currentY);
      currentY += 10;

      for (const item of itemsWithPhotos) {
        if (currentY > 220) {
          doc.addPage();
          currentY = 20;
        }
        
        doc.setFontSize(10);
        doc.setTextColor(100, 116, 139);
        doc.text(`Item: ${item.text}`, 20, currentY);
        currentY += 5;

        try {
          const imgData = responses[item.id].photoUrl;
          doc.addImage(imgData, 'JPEG', 20, currentY, 60, 45);
          currentY += 55;
        } catch (e) {
          console.error('Error adding image to PDF', e);
        }
      }
    }

    doc.save(`GastroCheck_${template.title.replace(/\s+/g, '_')}_${new Date().getTime()}.pdf`);
    return doc.output('blob');
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      // Strip photos from Firestore submission as requested
      const responsesForFirestore = { ...responses };
      Object.keys(responsesForFirestore).forEach(key => {
        if (responsesForFirestore[key].photoUrl) {
          delete responsesForFirestore[key].photoUrl;
          responsesForFirestore[key].hasPhoto = true; // Just a flag
        }
      });

      const submission = {
        templateId: template.id,
        userId: profile.uid,
        userName: profile.displayName,
        praca: template.praca,
        timestamp: new Date().toISOString(),
        responses: responsesForFirestore,
      };

      await addDoc(collection(db, 'submissions'), submission);
      await generatePDF(submission);
      setSubmitted(true);
      
      const message = encodeURIComponent(
        `🚀 *GastroCheck Pro - Novo Checklist Concluído*\n\n` +
        `📋 *Checklist:* ${template.title}\n` +
        `👤 *Usuário:* ${profile.displayName}\n` +
        `📍 *Praça:* ${template.praca}\n` +
        `⏰ *Data/Hora:* ${new Date().toLocaleString('pt-BR')}\n\n` +
        `✅ O relatório PDF foi gerado e está disponível no dispositivo do usuário.`
      );
      
      const whatsappUrl = `https://wa.me/?text=${message}`;
      window.open(whatsappUrl, '_blank');

    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'submissions');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-screen bg-bento-bg">
      <Loader2 className="animate-spin text-bento-accent" size={48} />
    </div>
  );

  if (!template) return (
    <div className="min-h-screen bg-bento-bg p-4 sm:p-6">
      <div className="max-w-2xl mx-auto">
        <header className="bento-card mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-xl font-bold text-bento-ink">Escolha um Checklist</h1>
              <p className="text-xs text-bento-muted">Selecione a tarefa que deseja iniciar no momento</p>
            </div>
            <button 
              onClick={() => signOut(auth)}
              className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-colors"
            >
              <LogOut size={20} />
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {availableTemplates.map((t) => (
            <motion.button
              key={t.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setTemplate(t)}
              className="bento-card text-left hover:border-bento-accent transition-all group"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="p-3 bg-bento-accent/10 rounded-2xl text-bento-accent group-hover:bg-bento-accent group-hover:text-white transition-colors">
                  <ClipboardList size={24} />
                </div>
                <span className="bento-tag text-[10px]">{t.praca}</span>
              </div>
              <h3 className="font-bold text-bento-ink text-lg">{t.title}</h3>
              <p className="text-xs text-bento-muted mt-1">{t.items?.length || 0} itens para conferência</p>
            </motion.button>
          ))}
        </div>

        {availableTemplates.length === 0 && !loading && (
          <div className="bento-card text-center py-20 bg-gray-50/50">
            <ClipboardList size={48} className="mx-auto text-bento-muted opacity-20 mb-4" />
            <h2 className="text-lg font-bold text-bento-ink">Sem Checklists Atribuídos</h2>
            <p className="text-bento-muted mt-1 text-xs">Contate o administrador para receber suas tarefas.</p>
            <button 
              onClick={() => window.location.reload()}
              className="mt-6 bg-white border border-bento-border text-bento-accent px-6 py-2 rounded-xl font-bold text-sm flex items-center gap-2 mx-auto shadow-sm"
            >
              <RefreshCw size={14} /> Atualizar Página
            </button>
          </div>
        )}
      </div>
    </div>
  );

  if (submitted) return (
    <div className="min-h-screen bg-bento-bg p-6 flex items-center justify-center">
      <div className="bento-card max-w-sm w-full text-center py-12">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="bg-bento-success/10 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="text-bento-success" size={40} />
        </motion.div>
        <h2 className="text-2xl font-bold text-bento-ink">Checklist Concluído!</h2>
        <p className="text-bento-muted mt-2 mb-8 text-sm">Seu relatório foi enviado com sucesso.</p>
        <button 
          onClick={() => window.location.reload()}
          className="w-full bg-bento-accent text-white py-4 rounded-2xl font-bold shadow-lg shadow-orange-200"
        >
          Novo Checklist
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-bento-bg p-4 pb-28">
      <div className="max-w-2xl mx-auto space-y-4">
        {/* Header Card */}
        <header className="bento-card">
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="flex gap-2 mr-2">
                <button 
                  onClick={() => {
                    setTemplate(null);
                    setResponses({});
                  }}
                  className="p-3 bg-bento-bg rounded-2xl text-bento-ink hover:bg-bento-accent hover:text-white transition-all shadow-sm border border-bento-border"
                  title="Trocar Checklist"
                >
                  <Home size={20} />
                </button>
                <button 
                  onClick={() => window.location.reload()}
                  className="p-3 bg-bento-bg rounded-2xl text-bento-ink hover:bg-bento-accent hover:text-white transition-all shadow-sm border border-bento-border"
                  title="Recarregar"
                >
                  <RefreshCw size={20} />
                </button>
              </div>
              <div>
                <h1 className="text-xl font-bold text-bento-ink leading-tight">{template?.title}</h1>
                <p className="text-xs text-bento-muted font-medium">{new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
              </div>
            </div>
            <div className="flex items-center justify-between w-full sm:w-auto sm:flex-col sm:items-end gap-2">
              <span className="bento-tag bg-bento-accent/10 text-bento-accent border-bento-accent/20">Praça: {template?.praca}</span>
              <button 
                onClick={() => signOut(auth)}
                className="bg-red-50 text-red-500 px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-red-100 transition-colors border border-red-100"
              >
                <LogOut size={14} />
                Sair da Conta
              </button>
            </div>
          </div>
        </header>

        {/* Tasks Grid */}
        <div className="space-y-3">
          {template?.items.map((item: any) => (
            <motion.div 
              key={item.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bento-card"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-colors",
                    responses[item.id]?.value ? "bg-bento-success border-bento-success" : "border-bento-border"
                  )}>
                    {responses[item.id]?.value && <CheckCircle2 size={14} className="text-white" />}
                  </div>
                  <h3 className="font-bold text-bento-ink">{item.text}</h3>
                </div>
                {item.type === 'temperature' && (
                  <span className="text-xs font-mono text-bento-muted">AFERIÇÃO TEMP.</span>
                )}
              </div>

              <div className="pl-9 space-y-4">
                {item.type === 'checkbox' && (
                  <button 
                    onClick={() => handleResponseChange(item.id, !responses[item.id]?.value)}
                    className={cn(
                      "px-4 py-2 rounded-xl text-sm font-bold transition-all",
                      responses[item.id]?.value 
                        ? "bg-bento-success/10 text-bento-success" 
                        : "bg-bento-bg text-bento-muted"
                    )}
                  >
                    {responses[item.id]?.value ? 'Concluído' : 'Marcar como feito'}
                  </button>
                )}

                {item.type === 'temperature' && (
                  <div className="flex items-center gap-3">
                    <input 
                      type="number" 
                      placeholder="0.0"
                      step="0.1"
                      className="w-24 p-2 bg-bento-bg border border-bento-border rounded-xl outline-none text-center font-bold"
                      onChange={(e) => handleResponseChange(item.id, e.target.value)}
                    />
                    <span className="text-bento-muted font-bold">°C</span>
                  </div>
                )}

                {item.type === 'time' && (
                  <div className="flex items-center gap-3">
                    <div className="relative flex-1 max-w-[160px]">
                      <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-bento-muted" size={16} />
                      <input 
                        type="time" 
                        className="w-full pl-10 pr-4 py-2 bg-bento-bg border border-bento-border rounded-xl outline-none font-bold"
                        onChange={(e) => handleResponseChange(item.id, e.target.value)}
                      />
                    </div>
                  </div>
                )}

                {item.requiredPhoto && (
                  <div className="pt-2">
                    <PhotoCapture onCapture={(url) => handlePhotoCapture(item.id, url)} />
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Floating Action Button */}
      <div className="fixed bottom-6 left-0 right-0 px-4 pointer-events-none">
        <div className="max-w-2xl mx-auto pointer-events-auto">
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full bg-bento-accent text-white py-5 rounded-2xl font-bold text-lg shadow-2xl shadow-orange-900/20 flex items-center justify-center gap-3 disabled:opacity-50"
          >
            {submitting ? <Loader2 className="animate-spin" /> : <Send size={20} />}
            {submitting ? 'Enviando...' : 'Finalizar Checklist'}
          </button>
        </div>
      </div>
    </div>
  );
};
