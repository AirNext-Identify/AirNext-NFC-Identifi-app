import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import { Loader2 } from "lucide-react";

export default function Onboarding() {
  const navigate = useNavigate();
  const { user, products, loadProducts } = useAuth();

  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [slug, setSlug] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  // Get the most recently activated product without a profile
  const pendingProduct = products.find(p => p.status === 'ATIVO' && !p.slug);
  const targetProduct = pendingProduct ?? products[products.length - 1];

  useEffect(() => {
    if (user?.name) setName(user.name);
  }, [user]);

  const next = () => setStep(s => s + 1);

  const finishOnboarding = async () => {
    if (!user) return;
    setBusy(true);
    setError("");

    const finalSlug = slug
      .replace(/[^a-zA-Z0-9-]/g, '')
      .toLowerCase() || Math.random().toString(36).substring(2, 8);

    // 1. Create profile linked to product
    const profilePayload: any = {
      user_id: user.id,
      name,
      profile_type: category || 'PERSONAL',
      public_slug: finalSlug,
      email: user.email,
      visible: true,
    };

    if (targetProduct?.id) {
      profilePayload.product_id = targetProduct.id;
    }

    const { error: profileError } = await supabase
      .from("profiles")
      .upsert(profilePayload, {
        onConflict: targetProduct?.id ? 'product_id' : 'user_id',
      });

    if (profileError) {
      setError(profileError.message);
      setBusy(false);
      return;
    }

    // 2. Update the product with category and slug
    if (targetProduct?.id) {
      await supabase
        .from("products")
        .update({
          category: category || 'PERSONAL',
          slug: finalSlug,
          profile_data: { nome: name, slug: finalSlug },
        })
        .eq("id", targetProduct.id);
    }

    // 3. Reload products and navigate
    await loadProducts(user.id);
    setBusy(false);
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-6">
      <div className="w-full max-w-md glass rounded-2xl p-8 space-y-6">
        <h1 className="text-2xl font-black text-white text-center">Configure seu Perfil</h1>

        {error && (
          <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-400">
            {error}
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-white font-semibold">Seu nome</h2>
            <input
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              placeholder="Nome completo"
              value={name}
              onChange={e => setName(e.target.value)}
            />
            <button
              onClick={next}
              disabled={!name.trim()}
              className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white font-semibold py-3 rounded-xl transition-colors"
            >
              Continuar
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <h2 className="text-white font-semibold">Categoria</h2>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'PERSONAL', label: 'Pessoal' },
                { id: 'BUSINESS', label: 'Negócio' },
                { id: 'PET', label: 'Pet' },
                { id: 'KIDS', label: 'Kids' },
                { id: 'SENIOR', label: 'Senior' },
                { id: 'TEA', label: 'TEA' },
              ].map(c => (
                <button
                  key={c.id}
                  onClick={() => setCategory(c.id)}
                  className={`py-3 rounded-xl border font-semibold text-sm transition-all ${category === c.id ? 'border-blue-500 bg-blue-500/10 text-blue-400' : 'border-white/10 text-zinc-400 hover:bg-white/5'}`}
                >
                  {c.label}
                </button>
              ))}
            </div>
            <button
              onClick={next}
              disabled={!category}
              className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white font-semibold py-3 rounded-xl transition-colors"
            >
              Continuar
            </button>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <h2 className="text-white font-semibold">Seu link (slug)</h2>
            <div className="flex items-center gap-2">
              <span className="text-zinc-600 text-sm shrink-0">airnext.com/u/</span>
              <input
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                placeholder="seu-nome"
                value={slug}
                onChange={e => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
              />
            </div>
            <button
              onClick={finishOnboarding}
              disabled={!slug.trim() || busy}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white font-semibold py-3 rounded-xl transition-colors"
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {busy ? 'Criando...' : 'Finalizar'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
