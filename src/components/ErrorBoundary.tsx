import * as React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<any, any> {
  constructor(props: any) {
    super(props);
    (this as any).state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): any {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error', error, errorInfo);
  }

  render() {
    const { hasError, error } = (this as any).state;
    if (hasError) {
      let errorMessage = 'Ocorreu um erro inesperado.';
      let isFirestoreError = false;

      try {
        const parsed = JSON.parse(error?.message || '');
        if (parsed.error && parsed.operationType) {
          isFirestoreError = true;
          errorMessage = `Erro de Permissão: Você não tem autorização para realizar esta operação (${parsed.operationType} em ${parsed.path}).`;
        }
      } catch (e) {
        // Not a JSON error
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-bento-bg p-6">
          <div className="bento-card max-w-md w-full text-center py-12">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="text-red-500" size={32} />
            </div>
            <h2 className="text-2xl font-bold text-bento-ink mb-4">Ops! Algo deu errado</h2>
            <p className="text-bento-muted mb-8">
              {errorMessage}
            </p>
            <div className="space-y-3">
              <button
                onClick={() => window.location.reload()}
                className="w-full bg-bento-accent text-white py-3 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-orange-200"
              >
                <RefreshCw size={18} />
                Tentar Novamente
              </button>
              {isFirestoreError && (
                <p className="text-[10px] text-bento-muted mt-4">
                  Se o problema persistir, contate o administrador e informe o erro acima.
                </p>
              )}
            </div>
          </div>
        </div>
      );
    }

    return (this as any).props.children;
  }
}
