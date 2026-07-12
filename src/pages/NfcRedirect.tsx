import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { Loader2, PackageSearch, Lock, Clock, Zap } from "lucide-react";

type ProductStatus = "DISPONIVEL" | "ATIVO" | "BLOQUEADO" | "EXPIRADO" | "NAO_PROGRAMADO" | "CANCELADO";

type NfcState =
  | { kind: "loading" }
  | { kind: "not_found" }
  | { kind: "available" }
  | { kind: "blocked" }
  | { kind: "expired" }
  | { kind: "cancelled" }
  | { kind: "redirecting" };

// Tela pública exibida para /n/:uuid. NUNCA envolvida por Protected/AuthGuard —
// o chip NFC precisa funcionar para qualquer pessoa, autenticada ou não.
export default function NfcRedirect() {
  // Esta tela atende duas rotas com origens diferentes:
  //  - /n/:uuid  → chip NFC físico (tap), busca por products.nfc_uuid
  //  - /a/:code  → QR code impresso com o código de ativação, busca por products.code
  // Antes o componente só desestruturava `uuid`, então todo acesso via
  // /a/:code chegava com uuid=undefined e caía sempre em "not_found".
  // Também nunca marcávamos a origem do acesso (?via=nfc/qr) ao redirecionar
  // para o perfil público, então TODO tap de NFC era contabilizado como
  // acesso "link" nas Estatísticas.
  const { uuid, code } = useParams<{ uuid?: string; code?: string }>();
  const navigate = useNavigate();
  const [state, setState] = useState<NfcState>({ kind: "loading" });

  const source: "nfc" | "qr" = uuid ? "nfc" : "qr";
  const lookupValue = uuid || code;

  useEffect(() => {
    let cancelled = false;

    async function lookup() {
      if (!lookupValue) {
        if (!cancelled) setState({ kind: "not_found" });
        return;
      }

      // /n/:uuid busca sempre por nfc_uuid (nunca gerado/alterado aqui).
      // /a/:code busca pelo código de ativação do produto.
      const query = supabase
        .from("products")
        .select("code, slug, status, nfc_uuid, expires_at");

      const { data, error } = await (uuid
        ? query.eq("nfc_uuid", uuid)
        : query.eq("code", code)
      ).maybeSingle();

      if (cancelled) return;

      if (error || !data) {
        setState({ kind: "not_found" });
        return;
      }

      const status = data.status as ProductStatus;

      // A coluna `status` não vira 'EXPIRADO' sozinha quando a validade
      // vence — isso antes só era calculado visualmente no painel admin,
      // nunca gravado de volta no banco. Sem esta checagem, um chip NFC
      // vencido continuava redirecionando normalmente para o perfil.
      const isPastValidity = !!data.expires_at && new Date(data.expires_at).getTime() < Date.now();

      if (status === "ATIVO" && isPastValidity) {
        setState({ kind: "expired" });
        return;
      }

      if (status === "ATIVO") {
        if (!data.slug) {
          // Estado inconsistente: ativo mas sem slug. Trata como não encontrado
          // em vez de quebrar com uma rota /u/undefined.
          setState({ kind: "not_found" });
          return;
        }
        setState({ kind: "redirecting" });
        navigate(`/u/${data.slug}?via=${source}`, { replace: true });
        return;
      }

      if (status === "DISPONIVEL") {
        setState({ kind: "available" });
        return;
      }

      if (status === "BLOQUEADO") {
        setState({ kind: "blocked" });
        return;
      }

      if (status === "EXPIRADO") {
        setState({ kind: "expired" });
        return;
      }

      if (status === "CANCELADO") {
        setState({ kind: "cancelled" });
        return;
      }

      if (status === "NAO_PROGRAMADO") {
        // Não deveria acontecer em uso normal (o chip só existe fisicamente
        // depois de gravado pelo Programador NFC), mas trata com segurança.
        setState({ kind: "not_found" });
        return;
      }

      // Status desconhecido: exibe estado neutro em vez de redirecionar para login.
      setState({ kind: "not_found" });
    }

    setState({ kind: "loading" });
    lookup();

    return () => {
      cancelled = true;
    };
  }, [uuid, code, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface p-4">
      <div className="w-full max-w-sm text-center">
        {(state.kind === "loading" || state.kind === "redirecting") && (
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-brand-400" />
            <p className="text-sm text-zinc-500">Abrindo perfil...</p>
          </div>
        )}

        {state.kind === "not_found" && (
          <div className="glass rounded-2xl p-8 space-y-3">
            <PackageSearch className="h-10 w-10 text-zinc-500 mx-auto" />
            <h1 className="text-lg font-bold text-white">Produto não encontrado</h1>
            <p className="text-sm text-zinc-500">
              Não encontramos nenhum produto AirNext associado a este chip.
            </p>
          </div>
        )}

        {state.kind === "available" && (
          <div className="glass rounded-2xl p-8 space-y-4">
            <Zap className="h-10 w-10 text-brand-400 mx-auto" />
            <h1 className="text-lg font-bold text-white">
              Este produto ainda não foi ativado.
            </h1>
            <p className="text-sm text-zinc-500">
              Ative seu produto AirNext para criar o seu perfil digital.
            </p>
            <Link
              to="/login"
              className="inline-flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-700 text-white font-semibold py-3 px-5 rounded-xl transition-colors text-sm"
            >
              Ativar agora
            </Link>
          </div>
        )}

        {state.kind === "blocked" && (
          <div className="glass rounded-2xl p-8 space-y-3">
            <Lock className="h-10 w-10 text-red-400 mx-auto" />
            <h1 className="text-lg font-bold text-white">Produto bloqueado.</h1>
            <p className="text-sm text-zinc-500">
              Entre em contato com o suporte AirNext para mais informações.
            </p>
          </div>
        )}

        {state.kind === "expired" && (
          <div className="glass rounded-2xl p-8 space-y-3">
            <Clock className="h-10 w-10 text-amber-400 mx-auto" />
            <h1 className="text-lg font-bold text-white">Produto expirado.</h1>
            <p className="text-sm text-zinc-500">
              Este produto não está mais ativo no momento.
            </p>
          </div>
        )}

        {state.kind === "cancelled" && (
          <div className="glass rounded-2xl p-8 space-y-3">
            <PackageSearch className="h-10 w-10 text-zinc-500 mx-auto" />
            <h1 className="text-lg font-bold text-white">Produto cancelado.</h1>
            <p className="text-sm text-zinc-500">
              Este produto foi cancelado e não está mais disponível. Entre em contato com o suporte AirNext.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
