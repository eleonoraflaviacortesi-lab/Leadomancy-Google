import React, { Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { AuthProvider } from "@/src/hooks/useAuth";
import { UndoRedoProvider } from "@/src/hooks/useUndoRedo";
import AppLayout from "@/src/components/layout/AppLayout";
import Auth from "@/src/pages/Auth";
import NotFound from "@/src/pages/NotFound";
import { NotiziePage } from "@/src/components/notizie/NotiziePage";
import { ClientiPage } from "@/src/components/clienti/ClientiPage";
import { CalendarPage } from "@/src/components/calendar/CalendarPage";
import { PersonalDashboard } from "@/src/components/dashboard/PersonalDashboard";
import { ReportPage } from "@/src/components/dashboard/ReportPage";
import { OfficeChatPage } from "@/src/components/chat/OfficeChatPage";
import { UfficioPage } from "@/src/components/ufficio/UfficioPage";
import { SettingsPage } from "@/src/components/settings/SettingsPage";
import ProfilePage from "@/src/pages/ProfilePage";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2, // 2 minutes
      gcTime: 1000 * 60 * 10, // 10 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <UndoRedoProvider>
          <BrowserRouter>
            <Suspense
              fallback={
                <div className="min-h-screen flex items-center justify-center bg-[var(--bg-page)]">
                  <div className="w-8 h-8 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
                </div>
              }
            >
              <Routes>
                <Route path="/auth" element={<Auth />} />
                
                <Route element={<AppLayout />}>
                  <Route path="/" element={<PersonalDashboard />} />
                  <Route path="/properties" element={<NotiziePage />} />
                  <Route path="/contacts" element={<ClientiPage />} />
                  <Route path="/activities" element={<CalendarPage />} />
                  <Route path="/chat" element={<OfficeChatPage />} />
                  <Route path="/inserisci" element={<ReportPage />} />
                  <Route path="/office" element={<UfficioPage />} />
                  <Route path="/settings" element={<SettingsPage />} />
                  <Route path="/profile" element={<ProfilePage />} />
                </Route>

                <Route path="/404" element={<NotFound />} />
                <Route path="*" element={<Navigate to="/404" replace />} />
              </Routes>
            </Suspense>
            <Toaster position="top-right" richColors />
          </BrowserRouter>
        </UndoRedoProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
