import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

interface Props {
  children: ReactNode;
  requireAuth?: boolean;
  adminOnly?: boolean;
  requireOnboarding?: boolean;
}

export default function SmartProtected({
  children,
  requireAuth = true,
  adminOnly = false,
  requireOnboarding = false,
}: Props) {
  const { user, loading, hasProfile } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
      </div>
    );
  }

  // 🔒 precisa estar logado
  if (requireAuth && !user) {
    return <Navigate to="/login" replace />;
  }

  // 🔐 admin only
  if (adminOnly && user?.role !== "ADMIN") {
    return <Navigate to="/dashboard" replace />;
  }

  // 🧠 onboarding obrigatório
  if (requireOnboarding) {
    if (hasProfile === null) return null;

    // já tem perfil → não deixa repetir onboarding
    if (hasProfile === true) {
      return <Navigate to="/dashboard" replace />;
    }
  }

  return <>{children}</>;
}