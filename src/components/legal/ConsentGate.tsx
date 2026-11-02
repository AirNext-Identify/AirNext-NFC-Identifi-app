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
  // Id do usuário cuja checagem de aceite já foi CONFIRMADA por uma segunda leitura.
  // Logo após o login a primeira leitura pode vir vazia (o token ainda está assentando) e
  // antes isso fazia o aviso "concorda com os termos?" piscar na tela e sumir sozinho.
  // Agora o aviso só abre se uma releitura também disser que falta o aceite.
  const [verifiedFor, setVerifiedFor] = useState<string | null>(null);

  useEffect(() => {
    if (!user) { setVerifiedFor(null); setModalOpen(false); return; }
    if (loading || consentStatus.loading) return;
    if (consentStatus.requiredOk) { setModalOpen(false); return; }
    if (verifiedFor !== user.id) {
      setVerifiedFor(user.id);
      void refreshConsents();
      return;
    }
    setModalOpen(true);
  }, [user, loading, consentStatus.loading, consentStatus.requiredOk, verifiedFor, refreshConsents]);

  if (!user) return <>{children}</>;

  const checking = loading || consentStatus.loading || (!consentStatus.requiredOk && verifiedFor !== user.id);

  if (checking) {
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
