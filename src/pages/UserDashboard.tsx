import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, addDoc, doc, getDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { useAuth } from '../AuthContext';
import { PhotoCapture } from '../components/PhotoCapture';
import { CheckCircle2, ClipboardList, Thermometer, Type, Send, Loader2, LogOut, Home, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { cn } from '../lib/utils';
import { signOut } from 'firebase/auth';

export const UserDashboard = () => {
  const { profile } = useAuth();
  const [template, setTemplate] = useState<any>(null);
  const [responses, setResponses] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!profile?.assignedChecklistId) {
      setLoading(false);
      return;
    }

    const unsub = onSnapshot(doc(db, 'checklistTemplates', profile.assignedChecklistId), (docSnap) => {
      if (docSnap.exists()) {
        setTemplate({ id: docSnap.id, ...docSnap.data() });
      }
      setLoading(false);
    });

    return () => unsub();
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
    doc.setFontSize(20);
    doc.text('Relatório de Checklist - GastroCheck', 20, 20);
    
    doc.setFontSize(12);
    doc.text(`Checklist: ${template.title}`, 20, 35);
    doc.text(`Usuário: ${profile.displayName}`, 20, 42);
    doc.text(`Data: ${new Date().toLocaleString()}`, 20, 49);
    doc.text(`Praça: ${template.praca}`, 20, 56);

    const tableData = template.items.map((item: any) => [
      item.text,
      responses[item.id]?.value || 'N/A',
      responses[item.id]?.photoUrl ? 'Sim' : 'Não'
    ]);

    (doc as any).autoTable({
      startY: 65,
      head: [['Item', 'Resposta', 'Foto']],
      body: tableData,
    });

    return doc.output('blob');
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const submission = {
        templateId: template.id,
        userId: profile.uid,
        userName: profile.displayName,
        praca: template.praca,
        timestamp: new Date().toISOString(),
        responses,
      };

      await addDoc(collection(db, 'submissions'), submission);
      await generatePDF(submission);
      setSubmitted(true);
      
      const message = encodeURIComponent(`Checklist ${template.title} concluído por ${profile.displayName} na praça ${template.praca}.`);
      window.open(`https://wa.me/?text=${message}`, '_blank');

    } catch (error) {
      console.error('Error submitting checklist:', error);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-screen bg-bento-bg">
      <Loader2 className="animate-spin text-bento-accent" size={48} />
    </div>
  );

  if (!profile?.assignedChecklistId) return (
    <div className="min-h-screen bg-bento-bg p-6 flex items-center justify-center">
      <div className="bento-card max-w-sm w-full text-center py-12">
        <ClipboardList size={64} className="mx-auto text-bento-muted mb-4 opacity-20" />
        <h2 className="text-xl font-bold text-bento-ink">Nenhum checklist atribuído</h2>
        <p className="text-bento-muted mt-2 text-sm">Contate o administrador para receber suas tarefas do dia.</p>
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
          <div className="flex justify-between items-start">
            <div className="flex items-start gap-3">
              <button 
                onClick={() => window.location.href = '/'}
                className="p-2 bg-bento-bg rounded-xl text-bento-muted hover:text-bento-accent transition-colors"
                title="Início"
              >
                <Home size={20} />
              </button>
              <button 
                onClick={() => window.location.reload()}
                className="p-2 bg-bento-bg rounded-xl text-bento-muted hover:text-bento-accent transition-colors"
                title="Recarregar"
              >
                <RefreshCw size={20} />
              </button>
              <div>
                <h1 className="text-xl font-bold text-bento-ink">{template?.title}</h1>
                <p className="text-sm text-bento-muted">{new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <span className="bento-tag">Praça: {template?.praca}</span>
              <button 
                onClick={() => signOut(auth)}
                className="text-red-500 text-xs font-bold flex items-center gap-1 hover:opacity-80 transition-opacity"
              >
                <LogOut size={14} />
                Sair
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
