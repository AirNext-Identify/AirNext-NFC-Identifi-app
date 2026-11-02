/**
 * Tela de espera ÚNICA para o caminho "escanear placa → abrir perfil".
 * Antes eram 3 telas diferentes em sequência (carregando do app, "Abrindo perfil…" e "Carregando perfil…"),
 * cada uma com animação de entrada própria — a troca entre elas parecia um "bug". Agora todas usam este
 * mesmo visual, parado e sem animação de entrada, então o carregamento parece contínuo.
 */
export default function ScanLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950" role="status" aria-label="Abrindo perfil">
      <div className="h-9 w-9 animate-spin rounded-full border-2 border-white/15 border-t-white/70" />
    </div>
  );
}
