import React from "react";
import { Navigate, Outlet, useLocation, NavLink } from "react-router-dom";
import { useAuth } from "@/src/hooks/useAuth";
import AppSidebar from "./AppSidebar";
import { useDetail } from "@/src/context/DetailContext";
import { ClienteDetail } from "@/src/components/clienti/ClienteDetail";
import { NotiziaDetail } from "@/src/components/notizie/NotiziaDetail";
import { useClienti } from "@/src/hooks/useClienti";
import { useNotizie } from "@/src/hooks/useNotizie";
import { Plus, LayoutDashboard, Building2, Users, CalendarDays, MessageSquare, Settings } from "lucide-react";
import { cn } from "@/src/lib/utils";
import { useLocalStorage } from "@/src/hooks/useLocalStorage";
import { AnnouncementBanner } from "./AnnouncementBanner";

const MobileNavLink = ({ to, icon, label }: { to: string; icon: React.ReactNode; label: string }) => (
  <NavLink
    to={to}
    className={({ isActive }) =>
      cn(
        "flex flex-col items-center justify-center w-full h-full gap-1 transition-colors",
        isActive ? "text-[var(--accent)]" : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
      )
    }
  >
    {icon}
    <span className="text-[10px] font-medium">{label}</span>
  </NavLink>
);

export default function AppLayout() {
  const { isAuthenticated, isLoading: authLoading, isUsingFallback } = useAuth();
  const { detail, closeDetail } = useDetail();
  const { clienti, updateCliente, deleteCliente } = useClienti();
  const { notizie, updateNotizia, deleteNotizia } = useNotizie();
  const selectedCliente = clienti.find(c => c.id === detail?.id);
  const selectedNotizia = notizie.find(n => n.id === detail?.id);
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useLocalStorage("sidebar-collapsed", false);
  const [showFallbackBanner, setShowFallbackBanner] = React.useState(true);
  const [forceShow, setForceShow] = React.useState(false);

  // Debug logs
  React.useEffect(() => {
    console.log("[AppLayout] Loading state:", authLoading, "isAuthenticated:", isAuthenticated, "forceShow:", forceShow);
  }, [authLoading, isAuthenticated, forceShow]);

  // Loading timeout
  React.useEffect(() => {
    if (authLoading) {
      const timer = setTimeout(() => {
        console.warn("[AppLayout] Loading timeout reached (5s). Forcing app to show.");
        setForceShow(true);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [authLoading]);

  const isLoading = authLoading && !forceShow;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg-page)]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
          <p className="text-[10px] font-mono text-[var(--text-secondary)] uppercase tracking-widest animate-pulse">
            Inizializzazione...
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated && !forceShow) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  return (
    <>
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 9999, height: '34px', overflow: 'hidden' }}>
        <AnnouncementBanner />
      </div>
      <div style={{ paddingTop: '34px' }}>
        <div className="min-h-screen bg-[var(--bg-page)]">
          {/* Fallback Banner */}
          {isUsingFallback && showFallbackBanner && (
            <div 
              className="fixed left-0 right-0 z-[100] bg-orange-500 text-white px-4 py-2 flex items-center justify-between text-[11px] font-medium tracking-wide shadow-lg"
              style={{ top: 'calc(var(--banner-height) + env(safe-area-inset-top, 0px))' }}
            >
              <div className="flex items-center gap-2">
                <span className="bg-white/20 px-1.5 py-0.5 rounded text-[9px] font-bold">AVVISO</span>
                <span>Profilo non trovato su Sheets — usando profilo temporaneo. Aggiungi il tuo profilo nel foglio 'users'.</span>
              </div>
              <button 
                onClick={() => setShowFallbackBanner(false)}
                className="hover:bg-white/20 p-1 rounded transition-colors"
              >
                <Plus size={14} className="rotate-45" />
              </button>
            </div>
          )}

          {/* Sidebar Layout (Desktop) */}
          <div className="hidden md:block">
            <AppSidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
          </div>

          {/* Main Content */}
          <main
            className={cn(
              "transition-all duration-200 ease-in-out pb-20 md:pb-10",
              isCollapsed ? "md:ml-[64px]" : "md:ml-[220px]"
            )}
            style={{ padding: '0 24px 40px 24px', minHeight: '100vh' }}
          >
            <Outlet />
          </main>

          {/* Mobile Bottom Navigation */}
          <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-[var(--border-light)] z-50 flex items-center justify-around h-16 px-2 pb-safe">
            <MobileNavLink to="/" icon={<LayoutDashboard size={20} />} label="Dash" />
            <MobileNavLink to="/properties" icon={<Building2 size={20} />} label="Notizie" />
            <MobileNavLink to="/contacts" icon={<Users size={20} />} label="Buyers" />
            <MobileNavLink to="/activities" icon={<CalendarDays size={20} />} label="Cal" />
            <MobileNavLink to="/chat" icon={<MessageSquare size={20} />} label="Chat" />
            <MobileNavLink to="/profile" icon={<Settings size={20} />} label="Menu" />
          </div>
        </div>
      </div>

      {/* Detail Panel */}
      {detail && (
        <div className="fixed inset-0 z-[200] flex justify-end">
          <div className="absolute inset-0 bg-black/20" onClick={closeDetail} />
          <div className="relative w-full max-w-md bg-white h-full shadow-xl">
             {detail.type === 'cliente' && selectedCliente ? (
               <ClienteDetail 
                 cliente={selectedCliente}
                 isOpen={true}
                 onClose={closeDetail}
                 onUpdate={(id, updates) => updateCliente({ id, ...updates })}
                 onDelete={(id) => {
                   if (window.confirm('Eliminare questo cliente?')) {
                     deleteCliente(id);
                   }
                   closeDetail();
                 }}
               />
             ) : detail.type === 'notizia' && selectedNotizia ? (
               <NotiziaDetail 
                 notizia={selectedNotizia}
                 open={true}
                 onOpenChange={(open) => !open && closeDetail()}
                 onUpdate={(id, updates) => updateNotizia({ id, ...updates })}
                 onDelete={(id) => {
                   if (window.confirm('Eliminare questa notizia?')) {
                     deleteNotizia(id);
                   }
                   closeDetail();
                 }}
               />
             ) : (
               <div className="p-6">Dettaglio non trovato</div>
             )}
          </div>
        </div>
      )}
    </>
  );
}
