import React, { useState, useEffect } from 'react';
import { dataService } from '../services/dataService';
import { useAuth } from '../AuthContext';
import { PhotoCapture } from '../components/PhotoCapture';
import { CheckCircle2, ClipboardList, Thermometer, Type, Send, Loader2, LogOut, Home, RefreshCw, Clock, Camera, ShieldAlert } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { cn } from '../lib/utils';

export const UserDashboard = () => {
  const { profile, logout } = useAuth();
  const [template, setTemplate] = useState<any>(null);
  const [availableTemplates, setAvailableTemplates] = useState<any[]>([]);
  const [responses, setResponses] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!profile || !profile.organization_id) return;
    
    const loadTemplates = () => {
      const allTemplates = dataService.getTemplates(profile.organization_id);
      const assignedIds = profile.assignedChecklistIds || [];
      const userTemplates = allTemplates.filter((t: any) => assignedIds.includes(t.id));
      setAvailableTemplates(userTemplates);
      setLoading(false);
    };

    loadTemplates();
  }, [profile]);

  const handleResponseChange = (itemId: string, item: any, value: any) => {
    const evaluation = dataService.evaluateResponse(item, value);
    setResponses(prev => ({
      ...prev,
      [itemId]: { 
        ...prev[itemId], 
        value, 
        isConform: evaluation.isConform,
        message: evaluation.message 
      }
    }));
  };

  const handleActionPlanChange = (itemId: string, action_plan: string) => {
    setResponses(prev => ({
      ...prev,
      [itemId]: { ...prev[itemId], action_plan }
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
    doc.setTextColor(249, 115, 22);
    doc.text('Checklist Azura', pageWidth / 2, 20, { align: 'center' });
    
    doc.setFontSize(16);
    doc.setTextColor(30, 41, 59);
    doc.text('Auditoria Operacional', pageWidth / 2, 30, { align: 'center' });
    
    doc.setDrawColor(226, 232, 240);
    doc.line(20, 35, pageWidth - 20, 35);

    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text(`Checklist: ${template.title}`, 20, 45);
    doc.text(`Categoria: ${template.category}`, 20, 52);
    doc.text(`Responsável: ${profile.displayName}`, pageWidth - 20, 45, { align: 'right' });
    doc.text(`Data/Hora: ${new Date().toLocaleString('pt-BR')}`, pageWidth - 20, 52, { align: 'right' });

    const tableData = template.items.map((item: any) => [
      item.label,
      responses[item.id]?.value || 'Pendente',
      responses[item.id]?.isConform ? 'OK' : 'ALERTA',
      responses[item.id]?.action_plan || '-'
    ]);

    (doc as any).autoTable({
      startY: 60,
      head: [['Item', 'Valor', 'Status', 'Plano de Ação']],
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
        organization_id: profile.organization_id,
        category: template.category,
        timestamp: new Date().toISOString(),
        responses: responsesForFirestore,
      };

      dataService.saveSubmission(submission);
      await generatePDF(submission);
      setSubmitted(true);
      
      const message = encodeURIComponent(
        `🚀 *AZURA OPERAÇÕES - Novo Checklist*\n\n` +
        `📋 *Checklist:* ${template.title}\n` +
        `👤 *Usuário:* ${profile.displayName}\n` +
        `📍 *Categoria:* ${template.category}\n` +
        `⏰ *Data/Hora:* ${new Date().toLocaleString('pt-BR')}\n\n` +
        `✅ Operação Concluída. Relatório PDF gerado localmente.`
      );
      
      const whatsappUrl = `https://wa.me/?text=${message}`;
      window.open(whatsappUrl, '_blank');

    } catch (error) {
      console.error("Error saving submission:", error);
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
              onClick={logout}
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
                <span className="bento-tag text-[10px]">{t.category}</span>
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
              <span className="bento-tag bg-bento-accent/10 text-bento-accent border-bento-accent/20">Setor: {template?.category}</span>
              <button 
                onClick={logout}
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
                    responses[item.id]?.value !== undefined ? (responses[item.id]?.isConform ? "bg-bento-success border-bento-success" : "bg-red-500 border-red-500") : "border-bento-border"
                  )}>
                    {responses[item.id]?.value !== undefined && <CheckCircle2 size={14} className="text-white" />}
                  </div>
                  <h3 className="font-bold text-bento-ink">{item.label}</h3>
                </div>
                {item.type === 'numeric' && (
                  <span className="text-[10px] font-bold text-red-400">FAIXA: {item.minValue || '0'} a {item.maxValue || '100'}</span>
                )}
              </div>

              <div className="pl-9 space-y-4">
                {item.type === 'checkbox' && (
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleResponseChange(item.id, item, true)}
                      className={cn(
                        "flex-1 py-4 rounded-xl text-sm font-bold transition-all border",
                        responses[item.id]?.value === true 
                          ? "bg-bento-success text-white border-bento-success" 
                          : "bg-white text-bento-muted border-bento-border"
                      )}
                    >
                      SIM
                    </button>
                    <button 
                      onClick={() => handleResponseChange(item.id, item, false)}
                      className={cn(
                        "flex-1 py-4 rounded-xl text-sm font-bold transition-all border",
                        responses[item.id]?.value === false 
                          ? "bg-red-500 text-white border-red-500" 
                          : "bg-white text-bento-muted border-bento-border"
                      )}
                    >
                      NÃO
                    </button>
                  </div>
                )}

                {item.type === 'numeric' && (
                  <div className="flex items-center gap-3">
                    <input 
                      type="number" 
                      placeholder="0.0"
                      step="0.1"
                      className="w-full p-4 bg-bento-bg border border-bento-border rounded-xl outline-none text-center font-bold text-lg"
                      onChange={(e) => handleResponseChange(item.id, item, e.target.value)}
                    />
                  </div>
                )}

                {item.type === 'photo' && (
                  <div className="pt-2">
                    <PhotoCapture onCapture={(url) => handlePhotoCapture(item.id, url)} />
                  </div>
                )}
                
                {item.type === 'text' && (
                  <textarea 
                    placeholder="Observações..."
                    className="w-full p-3 bg-bento-bg border border-bento-border rounded-xl text-sm"
                    onChange={(e) => handleResponseChange(item.id, item, e.target.value)}
                  />
                )}

                <AnimatePresence>
                  {responses[item.id]?.isConform === false && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="bg-red-50 p-4 rounded-xl border border-red-100 space-y-2 mt-2">
                        <div className="flex items-center gap-2 text-red-600">
                          <ShieldAlert size={16} />
                          <p className="text-[11px] font-bold uppercase">Não-Conformidade Detectada</p>
                        </div>
                        <p className="text-xs text-red-500 font-medium">{responses[item.id]?.message || 'O valor informado está fora do padrão.'}</p>
                        <textarea 
                          placeholder="Descreva o plano de ação imediato..."
                          className="w-full p-2 bg-white border border-red-200 rounded-lg text-xs outline-none focus:ring-1 focus:ring-red-400"
                          value={responses[item.id]?.action_plan || ''}
                          onChange={(e) => handleActionPlanChange(item.id, e.target.value)}
                          required
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
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
