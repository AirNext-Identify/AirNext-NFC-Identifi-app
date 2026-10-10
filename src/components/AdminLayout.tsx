import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LayoutDashboard, Users, LogOut, Menu } from 'lucide-react';
import { useState, useEffect } from 'react';
import Logo from './Logo';

const NAV=[{name:'Painel',href:'/admin',icon:LayoutDashboard},{name:'Clientes',href:'/admin/clientes',icon:Users}];

export default function AdminLayout(){
  const {user,logout,adminDataLoaded,loadAdminData}=useAuth();const loc=useLocation();const nav=useNavigate();
  const [open,setOpen]=useState(false);

  // Dados de admin (todos os produtos/clientes/feedbacks da plataforma) só
  // são buscados quando o admin realmente entra em /admin — antes rodava em
  // todo login, mesmo se o admin nunca abrisse essa área. `adminDataLoaded`
  // garante que isso acontece só 1x por sessão, mesmo navegando entre as
  // sub-rotas de admin (Painel <-> Clientes).
  useEffect(() => {
    if (!adminDataLoaded) loadAdminData();
  }, [adminDataLoaded, loadAdminData]);
  const doLogout=()=>{logout();nav('/');};
  const isA=(h:string)=>loc.pathname===h;
  const sb=(<div className="flex flex-col h-full">
    <div className="flex items-center px-5 pt-5 pb-6"><Logo size="md" /></div>
    <nav className="flex-1 px-3 space-y-0.5">{NAV.map(n=><Link key={n.href} to={n.href} onClick={()=>setOpen(false)} className={`flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-[13px] font-medium transition-all ${isA(n.href)?'bg-white/10 text-white':'text-zinc-500 hover:text-zinc-300 hover:bg-white/5'}`}><n.icon className={`h-4 w-4 ${isA(n.href)?'text-amber-400':'text-zinc-600'}`}/>{n.name}</Link>)}</nav>
    <div className="px-3 pb-4 border-t border-white/5 pt-4 mt-auto"><div className="flex items-center gap-2.5 px-2 mb-3"><div className="h-7 w-7 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-white text-xs font-bold">{user?.name?.charAt(0)}</div><div className="min-w-0"><p className="text-xs font-medium text-white truncate">{user?.name}</p><p className="text-[10px] text-zinc-600 truncate">{user?.email}</p></div></div><button onClick={doLogout} className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"><LogOut className="h-4 w-4"/>Sair</button></div>
  </div>);
  return(
    <div className="min-h-screen bg-surface">
      <div className={`fixed inset-0 z-50 lg:hidden ${open?'':'hidden'}`}><div className="fixed inset-0 bg-black/60" onClick={()=>setOpen(false)}/><div className="fixed inset-y-0 left-0 w-56 bg-surface-900 border-r border-white/5">{sb}</div></div>
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-56 lg:flex-col bg-surface-900 border-r border-white/5">{sb}</div>
      <div className="lg:pl-56 flex flex-col min-h-screen">
        <div className="sticky top-0 z-40 flex h-12 items-center gap-4 border-b border-white/5 bg-surface/80 backdrop-blur-xl px-4 lg:px-6"><button className="lg:hidden p-1.5 text-zinc-500" onClick={()=>setOpen(true)}><Menu className="h-5 w-5"/></button><div className="flex-1"/><div className="h-6 w-6 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-white text-[10px] font-bold">{user?.name?.charAt(0)}</div></div>
        <main className="flex-1 py-6 px-4 sm:px-6 lg:px-8"><Outlet/></main>
      </div>
    </div>
  );
}
