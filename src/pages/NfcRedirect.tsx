import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams, Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { Loader2, PackageSearch, Lock, Clock, Zap, KeyRound } from "lucide-react";
import { getPendingActivationHint, setPendingActivationHint } from "../lib/pendingActivation";
import { isValidGoogleReviewUrl } from "../lib/googleReview";
import { takeScanLookup } from "../lib/scanPrefetch";
import { prefetchPublicProfile } from "../lib/publicApi";
import ScanLoader from "../components/ScanLoader";

type ProductStatus = "DISPONIVEL" | "ATIVO" | "BLOQUEADO" | "EXPIRADO" | "NAO_PROGRAMADO" | "CANCELADO";

type NfcState =
  | { kind: "loading" }
  | { kind: "not_found" }
  | { kind: "available" }
  | { kind: "blocked" }
  | { kind: "expired" }
  | { kind: "cancelled" }
  | { kind: "google_pending" }
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
  const [searchParams] = useSearchParams();
  const [state, setState] = useState<NfcState>({ kind: "loading" });
  // Plaquinha AirNext Google: não tem perfil, só redireciona para as avaliações.
  const [googleLine, setGoogleLine] = useState(false);

  // /n/:uuid?s=qr → QR impresso (ID público, sem o código de ativação); /n/:uuid → chip NFC.
  const source: "nfc" | "qr" = uuid ? (searchParams.get("s") === "qr" ? "qr" : "nfc") : "qr";
  const lookupValue = uuid || code;

  useEffect(() => {
    let cancelled = false;

    async function lookup() {
      if (!lookupValue) {
        // Rota "/a" (sem nada na URL): usada depois que o link antigo /a/:código
        // foi limpo do endereço. Mostra o estado "disponível" a partir do aviso
        // guardado (nunca do código).
        const hint = getPendingActivationHint();
        if (!cancelled) {
          setGoogleLine(hint?.line === "GOOGLE");
          setState(hint ? { kind: "available" } : { kind: "not_found" });
        }
        return;
      }

      // /n/:uuid busca sempre por nfc_uuid (chip NFC físico, nunca
      // gerado/alterado aqui). /a/:code busca pelo mesmo código de ativação
      // permanente que também é impresso como QR Code na placa — ambos os
      // meios resolvem para a MESMA linha de products, pelo mesmo motor de
      // ativação (ver ActivationPage/AuthContext.activateProduct).
      // Resolução via função no banco (resolve_product): devolve só o estado
      // do produto. O código de ativação NUNCA é devolvido aqui — quem escaneia
      // ou aproxima a placa não consegue ativá-la sem o código que acompanha o
      // produto (ver sql/19_ativacao_codigo_obrigatorio.sql).
      // A consulta já pode ter sido iniciada no carregamento do app (ver lib/scanPrefetch.ts).
      const early = takeScanLookup(uuid ? "n" : "a", lookupValue);
      const { data, error } = await (early ??
        supabase.rpc("resolve_product", uuid ? { p_uuid: uuid } : { p_code: code }));

      if (cancelled) return;

      if (error || !data) {
        setState({ kind: "not_found" });
        return;
      }

      const status = data.status as ProductStatus;

      // Linha do produto vem do BANCO (nunca do cliente). AirNext Google:
      // o QR é permanente e leva direto ao link de avaliações cadastrado.
      const isGoogle = data.product_line === "GOOGLE";
      setGoogleLine(isGoogle);
      if (isGoogle && status === "ATIVO") {
        // Revalida no cliente (defesa em profundidade): o banco já só aceita
        // links do Google, mas nunca redirecionamos para um destino inesperado.
        if (isValidGoogleReviewUrl(data.redirect_url)) {
          setState({ kind: "redirecting" });
          // Conta o escaneamento (QR ou NFC) sem atrasar o cliente: espera no máximo ~0,7 s.
          // A contagem é opcional — nunca impede a abertura da avaliação.
          try {
            await Promise.race([
              supabase.rpc(
                "track_google_scan",
                uuid ? { p_uuid: uuid, p_source: source } : { p_code: code, p_source: source }
              ),
              new Promise((resolve) => setTimeout(resolve, 700)),
            ]);
          } catch {
            /* ignora */
          }
          if (cancelled) return;
          window.location.replace(data.redirect_url);
        } else {
          setState({ kind: "google_pending" });
        }
        return;
      }

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
        // Começa a buscar o perfil agora, em paralelo, para ele já estar pronto quando a página abrir.
        prefetchPublicProfile(data.slug);
        navigate(`/u/${data.slug}?via=${source}`, { replace: true });
        return;
      }

      if (status === "DISPONIVEL") {
        // Produto aguardando ativação. Escanear/aproximar NÃO ativa: o cliente
        // precisa entrar na conta e digitar o código de ativação que acompanha
        // o produto. Guardamos só um aviso (sem código) para manter o texto
        // certo depois do login.
        setPendingActivationHint(isGoogle ? "GOOGLE" : undefined);
        setState({ kind: "available" });
        // Link antigo /a/:código: tira o código do endereço e do histórico.
        if (code) navigate("/a", { replace: true });
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

  // Carregando/redirecionando: mesma tela de espera do app e da página do perfil (sem troca visível).
  if (state.kind === "loading" || (state.kind === "redirecting" && !googleLine)) return <ScanLoader />;

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface p-4">
      <div className="w-full max-w-sm text-center">
        {(state.kind === "loading" || state.kind === "redirecting") && (
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-brand-400" />
            <p className="text-sm text-zinc-500">{googleLine ? "Abrindo avaliações..." : "Abrindo perfil..."}</p>
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
              {googleLine
                ? "Ative sua plaquinha AirNext Google para começar a receber avaliações dos seus clientes."
                : "Ative seu produto AirNext para criar o seu perfil digital."}
            </p>
            <div className="flex items-start gap-2 rounded-xl border border-white/10 bg-white/5 p-3 text-left">
              <KeyRound className="mt-0.5 h-4 w-4 shrink-0 text-brand-400" />
              <p className="text-xs text-zinc-400">
                Para ativar, você precisa do <span className="font-semibold text-zinc-200">código de ativação</span> que
                acompanha o produto. Só aproximar ou escanear a placa não ativa.
              </p>
            </div>
            <Link
              to={`/login?next=${encodeURIComponent("/ativar")}`}
              className="inline-flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-700 text-white font-semibold py-3 px-5 rounded-xl transition-colors text-sm"
            >
              Ativar agora
            </Link>
          </div>
        )}

        {state.kind === "google_pending" && (
          <div className="glass rounded-2xl p-8 space-y-3">
            <PackageSearch className="h-10 w-10 text-zinc-500 mx-auto" />
            <h1 className="text-lg font-bold text-white">Avaliações indisponíveis no momento.</h1>
            <p className="text-sm text-zinc-500">
              O link de avaliações desta plaquinha ainda não foi configurado.
            </p>
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
