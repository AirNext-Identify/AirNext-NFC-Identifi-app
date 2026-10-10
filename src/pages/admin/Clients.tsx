import { useAuth } from '../../contexts/AuthContext';
import { Package, Calendar } from 'lucide-react';

export default function AdminClients(){
  const {adminUsers,adminProducts}=useAuth();
  const clients=adminUsers.filter(u=>u.role==='USER');
  return(
    <div className="space-y-5 max-w-5xl">
      <div><h1 className="text-xl font-bold text-white">Clientes</h1><p className="text-zinc-500 text-sm mt-0.5">{clients.length} clientes cadastrados</p></div>
      <div className="glass rounded-xl overflow-hidden"><div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b border-white/5 text-[11px] text-zinc-600 uppercase"><th className="text-left px-4 py-2.5 font-medium">Cliente</th><th className="text-left px-4 py-2.5 font-medium">Email</th><th className="text-left px-4 py-2.5 font-medium">Produtos</th><th className="text-left px-4 py-2.5 font-medium">Desde</th></tr></thead>
        <tbody>{clients.map(c=>{const prods=adminProducts.filter(p=>p.ownerId===c.id);return(
          <tr key={c.id} className="border-b border-white/[0.03] hover:bg-white/[0.02]">
            <td className="px-4 py-3"><div className="flex items-center gap-2.5"><div className="h-7 w-7 rounded-full bg-gradient-to-br from-brand-500 to-purple-500 flex items-center justify-center text-white text-[10px] font-bold">{c.name.charAt(0)}</div><span className="font-medium text-white text-sm">{c.name}</span></div></td>
            <td className="px-4 py-3 text-xs text-zinc-500">{c.email}</td>
            <td className="px-4 py-3"><div className="flex items-center gap-1.5 text-xs text-zinc-400"><Package className="h-3 w-3 text-zinc-600"/>{prods.length}</div></td>
            <td className="px-4 py-3"><div className="flex items-center gap-1.5 text-xs text-zinc-500"><Calendar className="h-3 w-3 text-zinc-600"/>{c.createdAt}</div></td>
          </tr>);})}</tbody></table></div></div>
    </div>
  );
}
