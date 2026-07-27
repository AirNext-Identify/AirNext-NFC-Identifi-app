import { ReactNode, useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { ConsentModal } from './ConsentModal';

/**
 * Garante que o usuário autenticado tenha aceitado a versão atual da
 * Política de Privacidade e dos Termos de Uso antes de renderizar filhos
 * (dashboard, ativação, onboarding).
 *
 * - Enquanto `consentStatus.loading`, mostra fallback discreto.
 * - Se `requiredOk` for false, abre o modal obrigatório (não dispensável
 *   sem aceite, salvo se `allowSkip` for true — não usado por padrão).
 * - Admins também passam pela validação (mesmo conjunto de documentos).
 */
export function ConsentGate({
  children,
  fallback,
}: {
  children: ReactNode;
  fallback?: ReactNode;
}) {
  const { user, loading, consentStatus, refreshConsents } = useAuth();
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    if (!user || loading || consentStatus.loading) return;
    setModalOpen(!consentStatus.requiredOk);
  }, [user, loading, consentStatus.loading, consentStatus.requiredOk]);

  if (!user) return <>{children}</>;

  if (loading || consentStatus.loading) {
    return (
      <>
        {fallback ?? (
          <div className="flex min-h-screen items-center justify-center bg-surface">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
          </div>
        )}
      </>
    );
  }

  if (!consentStatus.requiredOk) {
    return (
      <>
        {fallback ?? (
          <div className="flex min-h-screen items-center justify-center bg-surface px-4">
            <p className="text-center text-sm text-zinc-400">
              Confirme os documentos atualizados para continuar.
            </p>
          </div>
        )}
        <ConsentModal
          isOpen={modalOpen}
          userId={user.id}
          onAccepted={async () => {
            await refreshConsents();
            setModalOpen(false);
          }}
          // Não permite fechar sem aceite — validação obrigatória
          onClose={() => {
            /* bloqueado até aceite */
          }}
        />
      </>
    );
  }

  return <>{children}</>;
}
