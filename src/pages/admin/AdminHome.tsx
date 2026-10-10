import { useState } from 'react';
import { useAuth, ProductType } from '../../contexts/AuthContext';
import { Users, Package, Key, Plus, CheckCircle, Ban, CreditCard, Watch, KeyRound, PawPrint, Tag, Copy, Check, Calendar, MessageSquare, Star, Mail, Clock } from 'lucide-react';

const PTYPES:{id:ProductType;label:string}[]=[{id:'CARTAO',label:'Cartão NFC'},{id:'PULSEIRA',label:'Pulseira NFC'},{id:'CHAVEIRO',label:'Chaveiro NFC'},{id:'PLAQUINHA_PET',label:'Plaquinha Pet'},{id:'ETIQUETA',label:'Etiqueta NFC'}];
const PT:Record<string,string>={CARTAO:'Cartão',PULSEIRA:'Pulseira',CHAVEIRO:'Chaveiro',PLAQUINHA_PET:'Plaquinha',ETIQUETA:'Etiqueta'};
const PI:Record<string,React.ElementType>={CARTAO:CreditCard,PULSEIRA:Watch,CHAVEIRO:KeyRound,PLAQUINHA_PET:PawPrint,ETIQUETA:Tag};
const SS:Record<string,string>={ATIVO:'bg-emerald-500/20 text-emerald-400',DISPONIVEL:'bg-blue-500/20 text-blue-400',EXPIRADO:'bg-red-500/20 text-red-400',BLOQUEADO:'bg-zinc-500/20 text-zinc-500'};

export default function AdminHome(){
  const {adminUsers,adminProducts,adminCreateBatch,adminBlockProduct,feedbacks}=useAuth();
  const [showGen,setShowGen]=useState(false);const [genType,setGenType]=useState<ProductType>('CARTAO');const [genQty,setGenQty]=useState(10);
  const [genLote,setGenLote]=useState(`Lote ${new Date().toLocaleDateString('pt-BR',{month:'long',year:'numeric'})}`);
  const [genResult,setGenResult]=useState<string[]>([]);const [copied,setCopied]=useState<string|null>(null);
  const [filter,setFilter]=useState<'ALL'|'ATIVO'|'DISPONIVEL'|'EXPIRADO'|'BLOQUEADO'>('ALL');
  const users=adminUsers.filter(u=>u.role==='USER');const active=adminProducts.filter(p=>p.status==='ATIVO');const avail=adminProducts.filter(p=>p.status==='DISPONIVEL');
  const now=new Date();const soon=adminProducts.filter(p=>{if(!p.expiresAt)return false;const d=(new Date(p.expiresAt).getTime()-now.getTime())/(86400000);return d>0&&d<=60;});
  const filtered=filter==='ALL'?adminProducts:adminProducts.filter(p=>p.status===filter);
  const gen=()=>{setGenResult(adminCreateBatch(genType,genQty,genLote));};
  const cp=(c:string)=>{navigator.clipboard.writeText(c);setCopied(c);setTimeout(()=>setCopied(null),1500);};

  return(
    <div className="space-y-5 max-w-6xl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div><h1 className="text-xl font-bold text-white">Administração</h1><p className="text-zinc-500 text-sm mt-0.5">Gestão AirNext</p></div>
        <button onClick={()=>{setShowGen(true);setGenResult([]);}} className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 px-4 py-2 rounded-lg text-sm font-semibold text-white transition-all"><Plus className="h-4 w-4"/>Gerar Lote</button>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[{l:'Clientes',v:users.length,icon:Users,c:'text-blue-400'},{l:'Ativos',v:active.length,icon:Package,c:'text-emerald-400'},{l:'Disponíveis',v:avail.length,icon:Key,c:'text-amber-400'},{l:'Vencendo em 60d',v:soon.length,icon:Calendar,c:'text-orange-400'}].map(s=>
          <div key={s.l} className="glass rounded-xl p-4"><s.icon className={`h-5 w-5 ${s.c} mb-2`}/><p className="text-2xl font-bold text-white">{s.v}</p><p className="text-[11px] text-zinc-500 mt-0.5">{s.l}</p></div>
        )}
      </div>
      {soon.length>0&&<div className="glass rounded-lg p-3 border-l-2 border-amber-500"><p className="text-xs font-semibold text-amber-400 mb-1">⚠️ Próximas renovações</p>{soon.slice(0,3).map(p=>{const o=adminUsers.find(u=>u.id===p.ownerId);return<p key={p.id} className="text-[11px] text-zinc-500">{p.activationCode} — {o?.name||'—'} — {p.expiresAt}</p>;})}</div>}
      <div className="flex gap-1.5 flex-wrap">{(['ALL','ATIVO','DISPONIVEL','EXPIRADO','BLOQUEADO'] as const).map(f=><button key={f} onClick={()=>setFilter(f)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filter===f?'bg-amber-500 text-white':'bg-white/5 text-zinc-500 hover:text-white hover:bg-white/10'}`}>{f==='ALL'?'Todos':f}</button>)}</div>
      <div className="glass rounded-xl overflow-hidden"><div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b border-white/5 text-[11px] text-zinc-600 uppercase"><th className="text-left px-4 py-2.5 font-medium">Código</th><th className="text-left px-4 py-2.5 font-medium">Tipo</th><th className="text-left px-4 py-2.5 font-medium">Status</th><th className="text-left px-4 py-2.5 font-medium">Dono</th><th className="text-left px-4 py-2.5 font-medium">Lote</th><th className="text-left px-4 py-2.5 font-medium">Expira</th><th className="text-right px-4 py-2.5 font-medium">Ação</th></tr></thead>
        <tbody>{filtered.map(p=>{const o=adminUsers.find(u=>u.id===p.ownerId);const I=PI[p.productType]||Package;return(
          <tr key={p.id} className="border-b border-white/[0.03] hover:bg-white/[0.02]">
            <td className="px-4 py-2.5 font-mono text-xs text-white">{p.activationCode}</td>
            <td className="px-4 py-2.5"><div className="flex items-center gap-1.5 text-zinc-400 text-xs"><I className="h-3 w-3 text-zinc-600"/>{PT[p.productType]}</div></td>
            <td className="px-4 py-2.5"><span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${SS[p.status]||''}`}>{p.status}</span></td>
            <td className="px-4 py-2.5 text-xs text-zinc-500">{o?.name||'—'}</td>
            <td className="px-4 py-2.5 text-[10px] text-zinc-600">{p.loteName||'—'}</td>
            <td className="px-4 py-2.5 text-xs text-zinc-500">{p.expiresAt||'—'}</td>
            <td className="px-4 py-2.5 text-right">{p.status==='ATIVO'&&<button onClick={()=>adminBlockProduct(p.id)} className="px-2.5 py-1 rounded-md text-[10px] font-semibold text-red-400 bg-red-500/10 hover:bg-red-500/20 transition-colors"><Ban className="h-3 w-3 inline mr-0.5"/>Bloquear</button>}{p.status==='DISPONIVEL'&&<button onClick={()=>cp(p.activationCode)} className="px-2.5 py-1 rounded-md text-[10px] font-semibold text-blue-400 bg-blue-500/10 hover:bg-blue-500/20 transition-colors">{copied===p.activationCode?<Check className="h-3 w-3 inline mr-0.5"/>:<Copy className="h-3 w-3 inline mr-0.5"/>}Copiar</button>}</td>
          </tr>);})}</tbody></table></div></div>
      {/* Modal */}
      {showGen&&<div className="fixed inset-0 z-50 flex items-center justify-center p-4"><div className="fixed inset-0 bg-black/70" onClick={()=>setShowGen(false)}/><div className="relative glass rounded-2xl p-6 max-w-md w-full">
        <h3 className="text-base font-bold text-white mb-5">Gerar Lote de Códigos</h3>
        {genResult.length>0?<div className="space-y-4"><div className="flex items-center gap-2 text-emerald-400 text-sm"><CheckCircle className="h-4 w-4"/><span className="font-semibold">{genResult.length} códigos gerados!</span></div><div className="max-h-52 overflow-y-auto space-y-1">{genResult.map(c=><div key={c} className="flex items-center justify-between bg-white/5 rounded-lg px-3 py-1.5"><span className="font-mono text-xs text-white">{c}</span><button onClick={()=>cp(c)} className="text-zinc-500 hover:text-white">{copied===c?<Check className="h-3.5 w-3.5 text-emerald-400"/>:<Copy className="h-3.5 w-3.5"/>}</button></div>)}</div><button onClick={()=>setShowGen(false)} className="w-full py-2.5 rounded-lg bg-amber-500 font-semibold text-white text-sm hover:bg-amber-600 transition-colors">Fechar</button></div>
        :<div className="space-y-4">
          <div><label className="block text-xs font-medium text-zinc-400 mb-1">Nome do Lote</label><input value={genLote} onChange={e=>setGenLote(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-lg px-3.5 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50 placeholder:text-zinc-700" placeholder="Lote Junho 2026"/></div>
          <div><label className="block text-xs font-medium text-zinc-400 mb-1">Tipo</label><select value={genType} onChange={e=>setGenType(e.target.value as ProductType)} className="w-full bg-white/5 border border-white/10 rounded-lg px-3.5 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50">{PTYPES.map(t=><option key={t.id} value={t.id}>{t.label}</option>)}</select></div>
          <div><label className="block text-xs font-medium text-zinc-400 mb-1">Quantidade</label><div className="flex gap-1.5">{[10,50,100,500,1000].map(n=><button key={n} onClick={()=>setGenQty(n)} className={`px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${genQty===n?'bg-amber-500 text-white':'bg-white/5 text-zinc-500 hover:text-white'}`}>{n}</button>)}</div></div>
          <div className="flex gap-3 pt-1"><button onClick={()=>setShowGen(false)} className="flex-1 py-2.5 rounded-lg border border-white/10 text-zinc-400 font-medium text-sm hover:bg-white/5 transition-colors">Cancelar</button><button onClick={gen} className="flex-1 py-2.5 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 font-semibold text-white text-sm hover:from-amber-600 hover:to-orange-600 transition-all">Gerar {genQty}</button></div>
        </div>}
      </div></div>}

      {/* === FEEDBACKS DO USUÁRIO (Admin only) === */}
      {feedbacks.length > 0 && (
        <div className="glass rounded-xl overflow-hidden mt-6">
          <div className="flex items-center gap-2.5 px-4 py-3 border-b border-white/5">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-rose-500 to-pink-500 flex items-center justify-center shadow-lg shadow-rose-500/20">
              <MessageSquare className="h-4 w-4 text-white" />
            </div>
            <div className="flex-1"><p className="text-sm font-bold text-white">Feedbacks dos Clientes</p><p className="text-[10px] text-zinc-500">{feedbacks.length} recebidos</p></div>
          </div>
          <div className="divide-y divide-white/5 max-h-96 overflow-y-auto hide-scrollbar">
            {feedbacks.map(fb => (
              <div key={fb.id} className="p-4 hover:bg-white/[0.02] transition-colors">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="h-7 w-7 rounded-full bg-gradient-to-br from-rose-500 to-pink-500 flex items-center justify-center text-white text-[10px] font-bold shrink-0">{(fb.userName || 'A')[0]}</div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-white truncate">{fb.userName || 'Anônimo'}</p>
                      {fb.userEmail && <p className="text-[10px] text-zinc-500 truncate">{fb.userEmail}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="flex gap-0.5">{[1,2,3,4,5].map(i => <Star key={i} className={`h-3 w-3 ${i <= Number(fb.navigation || 0) ? 'fill-amber-400 text-amber-400' : 'text-zinc-700'}`} />)}</div>
                    <div className="flex items-center gap-1 text-[10px] text-zinc-600">
                      <Clock className="h-3 w-3" />{new Date(fb.createdAt).toLocaleDateString('pt-BR', { day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' })}
                    </div>
                  </div>
                </div>
                {(fb as any).experience && <p className="text-xs text-zinc-300 mt-2"><span className="text-[10px] text-zinc-600 font-bold uppercase">Experiência:</span> {(fb as any).experience}</p>}
                {(fb as any).improvement && <p className="text-xs text-zinc-400 mt-1"><span className="text-[10px] text-zinc-600 font-bold uppercase">Melhoria:</span> {(fb as any).improvement}</p>}
                {(fb as any).comments && <p className="text-xs text-zinc-400 mt-1"><span className="text-[10px] text-zinc-600 font-bold uppercase">Comentário:</span> {(fb as any).comments}</p>}
                <a href={`mailto:airnect5@gmail.com?subject=Feedback de ${fb.userName}&body=Experiência: ${(fb as any).experience || ''}%0A%0AMelhoria: ${(fb as any).improvement || ''}%0A%0AComentário: ${(fb as any).comments || ''}%0A%0ANota: ${fb.navigation || ''}`} className="mt-2 inline-flex items-center gap-1 text-[10px] text-blue-400 hover:text-blue-300 transition-colors"><Mail className="h-3 w-3" /> Responder via email</a>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
